import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
  }

  try {
    const { scannedCode } = req.body;
    if (!scannedCode) {
      return res.status(400).json({ success: false, error: "No se proporcionó ningún código QR" });
    }

    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar el cupón individual por su código único
    const { data: cupon, error: cuponError } = await supabase
      .from("cupones_canjeados")
      .select("*, ofertas(titulo, precio_original, precio_oferta)")
      .eq("codigo_unico", scannedCode.trim())
      .single();

    if (cuponError || !cupon) {
      return res.status(404).json({ success: false, error: "Código de cupón inválido o no encontrado." });
    }

    if (cupon.usado) {
      return res.status(200).json({
        success: false,
        error: "⚠️ ¡Este cupón ya fue canjeado previamente! No es válido para una segunda compra.",
        offerTitle: cupon.ofertas?.titulo
      });
    }

    // Marcar SOLO este cupón como usado — la oferta sigue activa para el resto
    const { error: updateError } = await supabase
      .from("cupones_canjeados")
      .update({ usado: true, fecha_canje: new Date().toISOString() })
      .eq("id", cupon.id);

    if (updateError) {
      console.error("Error marcando cupón como usado:", updateError);
      return res.status(500).json({ success: false, error: "No se pudo procesar el canje." });
    }

    const originalPrice = Number(cupon.ofertas?.precio_original || 0);
    const discountPrice = Number(cupon.ofertas?.precio_oferta || 0);

    return res.status(200).json({
      success: true,
      message: "¡Enhorabuena! El cupón ha sido validado e ingresado correctamente.",
      offerTitle: cupon.ofertas?.titulo,
      discountPrice,
      originalPrice,
      savings: originalPrice - discountPrice
    });
  } catch (err: any) {
    console.error("Error en redeem:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}