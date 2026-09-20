import { createClient } from "@supabase/supabase-js";

// GET /api/payments/status
// Devuelve, para el comercio logueado: su plan vigente, cuántas ofertas activas usa, los planes disponibles
// y sus últimos pagos. La tabla de pagos no es legible desde el navegador: pasa siempre por acá.

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  const supabaseUrl = process.env.SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || "";
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

    const { data: planes } = await supabase
      .from("planes")
      .select("id, tipo, nombre, descripcion, precio_ars, duracion_dias, max_ofertas_activas")
      .eq("activo", true)
      .order("orden", { ascending: true });

    const pagosDisponibles = process.env.MP_ACCESS_TOKEN ? true : false;

    const { data: negocio, error: negocioError } = await supabase
      .from("negocios")
      .select("id, nombre, plan_id, plan_vence_at")
      .eq("owner_id", userData.user.id)
      .maybeSingle();
    if (negocioError) return res.status(500).json({ error: "No se pudo leer tu negocio." });
    if (!negocio) return res.status(200).json({ negocio: null, planes: planes || [], pagosDisponibles });

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
    });
  } catch (err: any) {
    console.error("Error en /api/payments/status:", err);
    return res.status(500).json({ error: "Ocurrió un error al leer tu plan." });
  }
}
