import { createClient } from "@supabase/supabase-js";

// GET /api/payments/status
// Devuelve, para el comercio logueado: su plan vigente, cuántas ofertas activas usa, los planes disponibles
// y sus últimos pagos. La tabla de pagos no es legible desde el navegador: pasa siempre por acá.

// Suscripciones: TEMPORAL, solo pruebas (ver api/payments/subscription.ts)
const TRIAL_DIAS = Math.max(1, Number(process.env.SUBSCRIPTION_TRIAL_DAYS) || 15);
function suscripcionesHabilitadas(): boolean {
  return process.env.VERCEL_ENV !== "production" || process.env.ENABLE_SUBSCRIPTIONS === "true";
}

// Si el usuario volvió de Mercado Pago y el webhook todavía no llegó, se consulta el estado real de la suscripción
async function sincronizarSuscripcionPendiente(supabase: any, mpToken: string, susc: any): Promise<boolean> {
  try {
    const r = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(susc.mp_preapproval_id)}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
    });
    if (!r.ok) return false;
    const pa = await r.json();
    if (String(pa.external_reference || "") !== susc.id) return false;
    if (pa.status === "authorized" && Math.abs(Number(pa.auto_recurring?.transaction_amount) - Number(susc.monto_ars)) < 0.01) {
      const { error } = await supabase.rpc("activar_suscripcion", { p_susc_id: susc.id });
      return !error;
    }
    if (pa.status === "cancelled") {
      await supabase.from("suscripciones").update({ estado: "cancelada", updated_at: new Date().toISOString() }).eq("id", susc.id);
    }
    return false;
  } catch (e) {
    console.error("No se pudo sincronizar la suscripción pendiente:", e);
    return false;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  const supabaseUrl = process.env.SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || "";
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Configuración de Supabase faltante en el servidor." });
  }
  const supabase: any = createClient(supabaseUrl, serviceKey);

  try {
    const authHeader = String(req.headers?.authorization || "");
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) return res.status(401).json({ error: "No autenticado." });
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return res.status(401).json({ error: "Sesión inválida o expirada." });

    const { data: planes } = await supabase
      .from("planes")
      .select("id, tipo, nombre, descripcion, precio_ars, duracion_dias, max_ofertas_activas")
      .eq("activo", true)
      .order("orden", { ascending: true });

    const pagosDisponibles = process.env.MP_ACCESS_TOKEN ? true : false;
    const suscripcionesDisponibles = suscripcionesHabilitadas();

    const negocioColumns = suscripcionesDisponibles ? "id, nombre, plan_id, plan_vence_at, trial_usado" : "id, nombre, plan_id, plan_vence_at";
    let { data: negocio, error: negocioError } = await supabase
      .from("negocios")
      .select(negocioColumns)
      .eq("owner_id", userData.user.id)
      .maybeSingle();
    if (negocioError) return res.status(500).json({ error: "No se pudo leer tu negocio." });
    if (!negocio) return res.status(200).json({ negocio: null, planes: planes || [], pagosDisponibles, suscripcionesDisponibles });

    // Suscripción vigente (modo prueba)
    let suscripcion: any = null;
    if (suscripcionesDisponibles) {
      const cols = "id, plan_id, estado, con_trial, trial_dias, monto_ars, mp_preapproval_id";
      const consultar = () =>
        supabase
          .from("suscripciones")
          .select(cols)
          .eq("negocio_id", negocio.id)
          .in("estado", ["pendiente", "autorizada", "pausada"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
      let { data: susc } = await consultar();

      if (susc && susc.estado === "pendiente" && susc.mp_preapproval_id && process.env.MP_ACCESS_TOKEN) {
        const cambio = await sincronizarSuscripcionPendiente(supabase, process.env.MP_ACCESS_TOKEN, susc);
        if (cambio) {
          ({ data: susc } = await consultar());
          const { data: negocioNuevo } = await supabase.from("negocios").select(negocioColumns).eq("id", negocio.id).maybeSingle();
          if (negocioNuevo) negocio = negocioNuevo;
        }
      }
      suscripcion = susc ? { id: susc.id, planId: susc.plan_id, estado: susc.estado, conTrial: susc.con_trial, trialDias: susc.trial_dias } : null;
    }

    const vigente =
      negocio.plan_id !== "gratis" && negocio.plan_vence_at && new Date(negocio.plan_vence_at) > new Date();
    const planEfectivoId = vigente ? negocio.plan_id : "gratis";
    const planEfectivo = (planes || []).find((p: any) => p.id === planEfectivoId);

    const hoy = new Date().toISOString().slice(0, 10);
    const { count } = await supabase
      .from("ofertas")
      .select("id", { count: "exact", head: true })
      .eq("negocio_id", negocio.id)
      .eq("activo", true)
      .or(`fecha_fin.is.null,fecha_fin.eq.,fecha_fin.gte.${hoy}`);

    const { data: pagos } = await supabase
      .from("pagos")
      .select("id, plan_id, monto_ars, estado, created_at, aprobado_at")
      .eq("negocio_id", negocio.id)
      .order("created_at", { ascending: false })
      .limit(10);

    return res.status(200).json({
      negocio: { id: negocio.id, nombre: negocio.nombre },
      plan: {
        id: planEfectivoId,
        nombre: planEfectivo?.nombre || planEfectivoId,
        venceAt: vigente ? negocio.plan_vence_at : null,
        maxOfertasActivas: planEfectivo?.max_ofertas_activas ?? null,
        ofertasActivas: count || 0,
      },
      planes: planes || [],
      pagos: pagos || [],
      pagosDisponibles,
      suscripcionesDisponibles,
      suscripcion,
      trialDisponible: suscripcionesDisponibles && !negocio.trial_usado,
      trialDias: TRIAL_DIAS,
    });
  } catch (err: any) {
    console.error("Error en /api/payments/status:", err);
    return res.status(500).json({ error: "Ocurrió un error al leer tu plan." });
  }
}
