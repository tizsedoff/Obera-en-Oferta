import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function parseExpiryDate(value: unknown): Date | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(`${raw}T23:59:59-03:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [day, month, year] = raw.split('/').map(Number);
    const date = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T23:59:59-03:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

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
    const expiry = parseExpiryDate(offer.fecha_fin);
    if (!expiry || expiry.getTime() <= Date.now()) {
      return res.status(409).json({ error: "La oferta está vencida o no tiene una fecha válida." });
    }
    const expiresAt = expiry.toISOString();
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
