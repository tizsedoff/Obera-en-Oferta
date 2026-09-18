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

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });

  try {
    const scannedCode = extractToken(String(req.body?.scannedCode || ""));
    if (!scannedCode) return res.status(400).json({ success: false, error: "No se proporcionó ningún código QR" });

    const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_KEY || "");
    const now = new Date().toISOString();
    const { data: redeemed, error } = await supabase
      .from("cupones_canjeados")
      .update({ usado: true, fecha_canje: now, redeemed_at: now })
      .eq("codigo_unico", scannedCode)
      .eq("usado", false)
      .gt("expires_at", now)
      .select("id, oferta_id, ofertas(titulo, precio_original, precio_oferta)")
      .maybeSingle();

    if (error) {
      console.error("Error marcando cupón como usado:", error);
      return res.status(500).json({ success: false, error: "No se pudo procesar el canje." });
    }
    if (!redeemed) return res.status(409).json({ success: false, error: "Cupón inválido, vencido o ya utilizado." });

    const offer = Array.isArray(redeemed.ofertas) ? redeemed.ofertas[0] : redeemed.ofertas;
    const originalPrice = Number(offer?.precio_original || 0);
    const discountPrice = Number(offer?.precio_oferta || 0);
    return res.status(200).json({ success: true, message: "¡Cupón validado correctamente!", offerTitle: offer?.titulo, discountPrice, originalPrice, savings: originalPrice - discountPrice });
  } catch (err: any) {
    console.error("Error en redeem:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
