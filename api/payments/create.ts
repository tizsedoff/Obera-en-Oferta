import { createClient } from "@supabase/supabase-js";

// POST /api/payments/create  { planId, ofertaId? }
// Crea un pago pendiente y la preferencia de Mercado Pago (Checkout Pro) para el negocio del usuario logueado.
// El precio SIEMPRE sale de public.planes en el servidor: nunca se acepta un monto desde el navegador.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Modo demo: simula un pago aprobado SIN pasar por Mercado Pago. Nunca en producción (no hay forma de forzarlo).
// Se apaga también en staging con PAYMENTS_DEMO=false.
function demoHabilitado(): boolean {
  return process.env.VERCEL_ENV !== "production" && process.env.PAYMENTS_DEMO !== "false";
}

function getOrigin(req: any): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const host = String(req.headers?.["x-forwarded-host"] || req.headers?.host || "");
  const proto = String(req.headers?.["x-forwarded-proto"] || "https").split(",")[0];
  return host ? `${proto}://${host}` : "";
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  const supabaseUrl = process.env.SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || "";
  const mpToken = process.env.MP_ACCESS_TOKEN || "";
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Configuración de Supabase faltante en el servidor." });
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // 1) Usuario logueado
    const authHeader = String(req.headers?.authorization || "");
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) return res.status(401).json({ error: "No autenticado." });
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return res.status(401).json({ error: "Sesión inválida o expirada." });
    const user = userData.user;

    // 2) Plan pedido (precio desde la base)
    const { planId, ofertaId } = req.body || {};
    if (typeof planId !== "string" || !planId) {
      return res.status(400).json({ error: "Falta el plan a contratar." });
    }
    const { data: plan } = await supabase.from("planes").select("*").eq("id", planId).eq("activo", true).maybeSingle();
    if (!plan || Number(plan.precio_ars) <= 0) {
      return res.status(400).json({ error: "Ese plan no existe o no se puede contratar." });
    }

    // 3) Negocio del usuario
    const { data: negocio, error: negocioError } = await supabase
      .from("negocios")
      .select("id, nombre")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (negocioError) return res.status(500).json({ error: "No se pudo verificar tu negocio." });
    if (!negocio) return res.status(403).json({ error: "Necesitás tener un negocio registrado para contratar un plan." });

    // 4) Los extras (destacar) exigen una oferta activa del propio negocio
    let ofertaTitulo = "";
    let ofertaIdFinal: string | null = null;
    if (plan.tipo === "extra") {
      if (typeof ofertaId !== "string" || !UUID_RE.test(ofertaId)) {
        return res.status(400).json({ error: "Elegí qué oferta querés destacar." });
      }
      const { data: oferta } = await supabase
        .from("ofertas")
        .select("id, negocio_id, activo, titulo")
        .eq("id", ofertaId)
        .maybeSingle();
      if (!oferta || oferta.negocio_id !== negocio.id || !oferta.activo) {
        return res.status(403).json({ error: "Esa oferta no es de tu negocio o ya no está activa." });
      }
      ofertaTitulo = oferta.titulo || "";
      ofertaIdFinal = oferta.id;
    }

    const demo = req.body?.demo === true;
    if (demo && !demoHabilitado()) {
      return res.status(403).json({ error: "El modo demo no está habilitado." });
    }
    if (!demo && !mpToken) {
      return res.status(503).json({ error: "Los pagos todavía no están configurados." });
    }

    // 5) Registrar el pago pendiente
    const { data: pago, error: pagoError } = await supabase
      .from("pagos")
      .insert({
        negocio_id: negocio.id,
        owner_id: user.id,
        plan_id: plan.id,
        oferta_id: ofertaIdFinal,
        monto_ars: plan.precio_ars,
        estado: "pendiente",
      })
      .select("id")
      .single();
    if (pagoError || !pago) {
      console.error("Error creando pago:", pagoError);
      return res.status(500).json({ error: "No se pudo iniciar el pago." });
    }

    // Demo: se da por aprobado y se aplica con la misma función que usa el webhook real
    if (demo) {
      const { data: aplicado, error: rpcError } = await supabase.rpc("aplicar_pago_aprobado", {
        p_pago_id: pago.id,
        p_mp_payment_id: `DEMO-${pago.id}`,
        p_mp_status: "demo",
      });
      if (rpcError) {
        console.error("Error aplicando el pago demo:", rpcError);
        return res.status(500).json({ error: "No se pudo aplicar el pago de prueba." });
      }
      await supabase.from("pagos").update({ mp_preference_id: "demo" }).eq("id", pago.id);
      return res.status(200).json({ demo: true, pagoId: pago.id, aplicado: !!aplicado });
    }

    // 6) Preferencia de Mercado Pago
    const origin = getOrigin(req);
    let notificationUrl = `${origin}/api/payments/webhook`;
    // Los deployments de Preview están protegidos por Vercel: el bypass permite que Mercado Pago llegue al webhook.
    if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
      notificationUrl += `?x-vercel-protection-bypass=${encodeURIComponent(process.env.VERCEL_AUTOMATION_BYPASS_SECRET)}`;
    }

    const titulo = ofertaTitulo ? `${plan.nombre}: ${ofertaTitulo}` : `Plan ${plan.nombre}`;
    const preferenceBody = {
      items: [
        {
          id: plan.id,
          title: `${titulo} - Oberá en Oferta`.slice(0, 250),
          quantity: 1,
          unit_price: Number(plan.precio_ars),
          currency_id: "ARS",
        },
      ],
      external_reference: pago.id,
      back_urls: {
        success: `${origin}/?pago=ok`,
        failure: `${origin}/?pago=error`,
        pending: `${origin}/?pago=pendiente`,
      },
      auto_return: "approved",
      notification_url: notificationUrl,
      statement_descriptor: "OBERAENOFERTA",
      metadata: { pago_id: pago.id, negocio_id: negocio.id, plan_id: plan.id },
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": pago.id,
      },
      body: JSON.stringify(preferenceBody),
    });

    if (!mpRes.ok) {
      const detail = await mpRes.text().catch(() => "");
      console.error("Mercado Pago rechazó la preferencia:", mpRes.status, detail);
      await supabase.from("pagos").update({ estado: "cancelado", mp_status: "preferencia_fallida", updated_at: new Date().toISOString() }).eq("id", pago.id);
      return res.status(502).json({ error: "No se pudo generar el link de pago. Probá de nuevo en unos minutos." });
    }

    const preference = await mpRes.json();
    await supabase
      .from("pagos")
      .update({ mp_preference_id: preference.id, updated_at: new Date().toISOString() })
      .eq("id", pago.id);

    const useSandbox = mpToken.startsWith("TEST-") && preference.sandbox_init_point;
    return res.status(200).json({
      pagoId: pago.id,
      init_point: useSandbox ? preference.sandbox_init_point : preference.init_point,
    });
  } catch (err: any) {
    console.error("Error en /api/payments/create:", err);
    return res.status(500).json({ error: "Ocurrió un error al iniciar el pago." });
  }
}
