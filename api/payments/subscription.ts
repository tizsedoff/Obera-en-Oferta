import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// TEMPORAL - SOLO PARA PRUEBAS.
// POST   /api/payments/subscription  { planId, payerEmail?, demo? }  -> crea una suscripción (con prueba gratuita si el negocio no la usó)
// PATCH  /api/payments/subscription                                  -> [solo demo] simula el cobro del siguiente ciclo
// DELETE /api/payments/subscription                                  -> cancela la suscripción (el plan sigue hasta que venza lo ya otorgado)
//
// Está activa fuera de producción, o en producción si ENABLE_SUBSCRIPTIONS=true.
// El modo demo (sin Mercado Pago) nunca funciona en producción.
// Para sacarla: borrar este archivo, los bloques "suscripciones" de status.ts/webhook.ts y la sección en PlanPanel.tsx.

const TRIAL_DIAS = Math.max(1, Number(process.env.SUBSCRIPTION_TRIAL_DAYS) || 15);

function suscripcionesHabilitadas(): boolean {
  return process.env.VERCEL_ENV !== "production" || process.env.ENABLE_SUBSCRIPTIONS === "true";
}

function demoHabilitado(): boolean {
  return process.env.VERCEL_ENV !== "production" && process.env.PAYMENTS_DEMO !== "false";
}

function getOrigin(req: any): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const host = String(req.headers?.["x-forwarded-host"] || req.headers?.host || "");
  const proto = String(req.headers?.["x-forwarded-proto"] || "https").split(",")[0];
  return host ? `${proto}://${host}` : "";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST" && req.method !== "DELETE" && req.method !== "PATCH") {
    return res.status(405).json({ error: "Método no permitido." });
  }
  if (!suscripcionesHabilitadas()) {
    return res.status(404).json({ error: "Las suscripciones no están habilitadas." });
  }

  const supabaseUrl = process.env.SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || "";
  const mpToken = process.env.MP_ACCESS_TOKEN || "";
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Configuración de Supabase faltante en el servidor." });
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const authHeader = String(req.headers?.authorization || "");
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) return res.status(401).json({ error: "No autenticado." });
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return res.status(401).json({ error: "Sesión inválida o expirada." });
    const user = userData.user;

    const { data: negocio, error: negocioError } = await supabase
      .from("negocios")
      .select("id, nombre, trial_usado")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (negocioError) return res.status(500).json({ error: "No se pudo verificar tu negocio." });
    if (!negocio) return res.status(403).json({ error: "Necesitás tener un negocio registrado." });

    // ---------- [Demo] Simular el cobro del siguiente ciclo ----------
    if (req.method === "PATCH") {
      if (!demoHabilitado()) return res.status(403).json({ error: "El modo demo no está habilitado." });
      const { data: susc } = await supabase
        .from("suscripciones")
        .select("id")
        .eq("negocio_id", negocio.id)
        .eq("estado", "autorizada")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!susc) return res.status(404).json({ error: "No tenés una suscripción activa." });
      const { data: cobro, error: rpcError } = await supabase.rpc("aplicar_cobro_suscripcion", {
        p_susc_id: susc.id,
        p_mp_payment_id: `DEMO-PAY-${crypto.randomUUID()}`,
      });
      if (rpcError) {
        console.error("Error simulando el cobro:", rpcError);
        return res.status(500).json({ error: "No se pudo simular el cobro." });
      }
      return res.status(200).json({ ok: true, aplicado: !!cobro?.aplicado, nuevoMonto: cobro?.nuevo_monto ?? null });
    }

    // ---------- Cancelar ----------
    if (req.method === "DELETE") {
      const { data: susc } = await supabase
        .from("suscripciones")
        .select("id, mp_preapproval_id")
        .eq("negocio_id", negocio.id)
        .in("estado", ["autorizada", "pausada", "pendiente"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!susc) return res.status(404).json({ error: "No tenés una suscripción para cancelar." });

      const esDemo = !!susc.mp_preapproval_id && String(susc.mp_preapproval_id).startsWith("DEMO-");
      if (susc.mp_preapproval_id && !esDemo) {
        if (!mpToken) return res.status(503).json({ error: "Los pagos todavía no están configurados." });
        const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(susc.mp_preapproval_id)}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${mpToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ status: "cancelled" }),
        });
        if (!mpRes.ok) {
          console.error("Mercado Pago no pudo cancelar la suscripción:", mpRes.status, await mpRes.text().catch(() => ""));
          return res.status(502).json({ error: "No se pudo cancelar la suscripción. Probá de nuevo en unos minutos." });
        }
      }
      await supabase.from("suscripciones").update({ estado: "cancelada", updated_at: new Date().toISOString() }).eq("id", susc.id);
      return res.status(200).json({ ok: true });
    }

    // ---------- Suscribirse ----------
    const { planId, payerEmail } = req.body || {};
    const demo = req.body?.demo === true;
    if (demo && !demoHabilitado()) return res.status(403).json({ error: "El modo demo no está habilitado." });
    if (!demo && !mpToken) return res.status(503).json({ error: "Los pagos todavía no están configurados." });
    if (typeof planId !== "string" || !planId) return res.status(400).json({ error: "Falta el plan." });

    const { data: plan } = await supabase.from("planes").select("*").eq("id", planId).eq("activo", true).maybeSingle();
    if (!plan || plan.tipo !== "plan" || Number(plan.precio_ars) <= 0) {
      return res.status(400).json({ error: "Ese plan no admite suscripción." });
    }
    if (plan.negocio_id && plan.negocio_id !== negocio.id) {
      return res.status(403).json({ error: "Ese plan no está disponible para tu negocio." });
    }

    // Precio para este negocio: si hay una promoción vigente, los primeros ciclos salen con descuento
    const { data: precioRows, error: precioError } = await supabase.rpc("calcular_precio", { p_negocio: negocio.id, p_plan: plan.id });
    const precio = Array.isArray(precioRows) ? precioRows[0] : null;
    if (precioError || !precio) {
      console.error("Error calculando el precio:", precioError);
      return res.status(500).json({ error: "No se pudo calcular el precio." });
    }
    const monto = Number(precio.o_monto);

    const { data: activa } = await supabase
      .from("suscripciones")
      .select("id")
      .eq("negocio_id", negocio.id)
      .eq("estado", "autorizada")
      .limit(1)
      .maybeSingle();
    if (activa) return res.status(409).json({ error: "Ya tenés una suscripción activa. Cancelala antes de crear otra." });

    // Las que quedaron sin completar se descartan
    await supabase
      .from("suscripciones")
      .update({ estado: "cancelada", updated_at: new Date().toISOString() })
      .eq("negocio_id", negocio.id)
      .eq("estado", "pendiente");

    let email = "";
    if (!demo) {
      email = typeof payerEmail === "string" && payerEmail.trim() ? payerEmail.trim().toLowerCase() : String(user.email || "");
      if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Ingresá un email válido para Mercado Pago." });
    }

    const conTrial = !negocio.trial_usado;
    const { data: susc, error: suscError } = await supabase
      .from("suscripciones")
      .insert({
        negocio_id: negocio.id,
        owner_id: user.id,
        plan_id: plan.id,
        monto_ars: monto,
        monto_lista_ars: Number(precio.o_lista),
        monto_promo_ars: monto,
        descuento_pct: Number(precio.o_pct) || 0,
        promo_id: precio.o_promo_id || null,
        promo_ciclos_restantes: precio.o_promo_id ? Number(precio.o_promo_restantes) || 0 : 0,
        con_trial: conTrial,
        trial_dias: conTrial ? TRIAL_DIAS : null,
        estado: "pendiente",
      })
      .select("id")
      .single();
    if (suscError || !susc) {
      console.error("Error creando la suscripción:", suscError);
      return res.status(500).json({ error: "No se pudo iniciar la suscripción." });
    }

    // Demo: se autoriza al instante (con la misma función que usa el webhook real)
    if (demo) {
      await supabase.from("suscripciones").update({ mp_preapproval_id: `DEMO-${susc.id}` }).eq("id", susc.id);
      const { error: activarError } = await supabase.rpc("activar_suscripcion", { p_susc_id: susc.id });
      if (activarError) {
        console.error("Error activando la suscripción demo:", activarError);
        return res.status(500).json({ error: "No se pudo activar la suscripción de prueba." });
      }
      // Sin prueba gratuita (ya usada) el primer cobro es inmediato
      if (!conTrial) {
        const { error: cobroError } = await supabase.rpc("aplicar_cobro_suscripcion", {
          p_susc_id: susc.id,
          p_mp_payment_id: `DEMO-PAY-${crypto.randomUUID()}`,
        });
        if (cobroError) {
          console.error("Error aplicando el primer cobro demo:", cobroError);
          return res.status(500).json({ error: "No se pudo aplicar el primer cobro de prueba." });
        }
      }
      return res.status(200).json({ demo: true, suscripcionId: susc.id, conTrial, trialDias: conTrial ? TRIAL_DIAS : 0 });
    }

    const origin = getOrigin(req);
    const autoRecurring: Record<string, unknown> = {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: monto,
      currency_id: "ARS",
    };
    if (conTrial) {
      autoRecurring.free_trial = { frequency: TRIAL_DIAS, frequency_type: "days" };
    }

    const mpRes = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: { Authorization: `Bearer ${mpToken}`, "Content-Type": "application/json", "X-Idempotency-Key": susc.id },
      body: JSON.stringify({
        reason: `Suscripción mensual plan ${plan.nombre} - Oberá en Oferta`.slice(0, 250),
        external_reference: susc.id,
        payer_email: email,
        back_url: `${origin}/?suscripcion=ok`,
        status: "pending",
        auto_recurring: autoRecurring,
      }),
    });

    if (!mpRes.ok) {
      console.error("Mercado Pago rechazó la suscripción:", mpRes.status, await mpRes.text().catch(() => ""));
      await supabase.from("suscripciones").update({ estado: "cancelada", updated_at: new Date().toISOString() }).eq("id", susc.id);
      return res.status(502).json({ error: "No se pudo crear la suscripción en Mercado Pago. Revisá el email e intentá de nuevo." });
    }

    const preapproval = await mpRes.json();
    await supabase
      .from("suscripciones")
      .update({ mp_preapproval_id: String(preapproval.id), updated_at: new Date().toISOString() })
      .eq("id", susc.id);

    return res.status(200).json({ init_point: preapproval.init_point, suscripcionId: susc.id, conTrial, trialDias: conTrial ? TRIAL_DIAS : 0 });
  } catch (err: any) {
    console.error("Error en /api/payments/subscription:", err);
    return res.status(500).json({ error: "Ocurrió un error con la suscripción." });
  }
}
