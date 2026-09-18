import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed. Use POST." });

  try {
    const { offerId } = req.body || {};
    if (!offerId) return res.status(400).json({ error: "Falta el ID de la oferta." });

    const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_KEY || "");
    const { data: offer, error: offerError } = await supabase
      .from("ofertas")
      .select("id, activo, fecha_fin")
      .eq("id", offerId)
      .single();

    if (offerError || !offer) return res.status(404).json({ error: "Oferta no encontrada." });
    const expiresAt = offer.fecha_fin;
    if (!expiresAt || Number.isNaN(new Date(expiresAt).getTime()) || new Date(expiresAt).getTime() <= Date.now()) {
      return res.status(409).json({ error: "La oferta está vencida o no tiene una fecha válida." });
    }
    if (offer.activo === false) return res.status(409).json({ error: "La oferta no está activa." });

    const token = `OBERA-${crypto.randomBytes(24).toString("base64url")}`;
    const { data, error } = await supabase
      .from("cupones_canjeados")
      .insert([{ oferta_id: offerId, codigo_unico: token, usado: false }])
      .select("id, codigo_unico")
      .single();

    if (error) {
      console.error("Error creando cupón único:", error);
      return res.status(500).json({ error: "No se pudo generar el cupón." });
    }

    return res.status(200).json({ id: data.id, token: data.codigo_unico, codigoUnico: data.codigo_unico, expiresAt });
  } catch (err: any) {
    console.error("Error en claim:", err);
    return res.status(500).json({ error: err.message });
  }
}
