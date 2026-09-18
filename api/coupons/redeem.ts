import { createClient } from "@supabase/supabase-js";

function extractToken(value: string): string {
  const trimmed = value.trim();
  try {
    const url = new URL(trimmed);
    return url.searchParams.get("token") || url.searchParams.get("codigo") || trimmed;
  } catch {
    return trimmed;
  }
}

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
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });

  try {
    const scannedCode = extractToken(String(req.body?.scannedCode || ""));
    if (!scannedCode) return res.status(400).json({ success: false, error: "No se proporcionó ningún código QR" });

    const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_KEY || "");
    const { data: coupon, error: lookupError } = await supabase
      .from("cupones_canjeados")
      .select("id, oferta_id, codigo_unico, usado, ofertas(titulo, precio_original, precio_oferta, fecha_fin, activo)")
      .eq("codigo_unico", scannedCode)
      .maybeSingle();

    if (lookupError) {
      console.error("Error buscando cupón:", lookupError);
      return res.status(500).json({ success: false, error: "No se pudo buscar el cupón." });
    }
    if (!coupon) return res.status(404).json({ success: false, error: "Código de cupón inválido o no encontrado." });
    if (coupon.usado) return res.status(409).json({ success: false, error: "Este cupón ya fue utilizado." });

    const offer = Array.isArray(coupon.ofertas) ? coupon.ofertas[0] : coupon.ofertas;
    if (!offer || offer.activo === false) return res.status(409).json({ success: false, error: "La oferta no está activa." });
    const expiry = parseExpiryDate(offer.fecha_fin);
    if (!expiry || expiry.getTime() <= Date.now()) return res.status(409).json({ success: false, error: "El cupón está vencido o la oferta no tiene una fecha válida." });

    const now = new Date().toISOString();
    const { data: redeemed, error: updateError } = await supabase
      .from("cupones_canjeados")
      .update({ usado: true, fecha_canje: now })
      .eq("id", coupon.id)
      .eq("usado", false)
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("Error marcando cupón como usado:", updateError);
      return res.status(500).json({ success: false, error: "No se pudo procesar el canje." });
    }
    if (!redeemed) return res.status(409).json({ success: false, error: "El cupón ya fue utilizado." });

    const originalPrice = Number(offer.precio_original || 0);
    const discountPrice = Number(offer.precio_oferta || 0);
    return res.status(200).json({ success: true, message: "¡Cupón validado correctamente!", offerTitle: offer.titulo, discountPrice, originalPrice, savings: originalPrice - discountPrice });
  } catch (err: any) {
    console.error("Error en redeem:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
