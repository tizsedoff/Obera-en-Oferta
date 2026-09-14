import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { offerId } = req.body;
    if (!offerId) {
      return res.status(400).json({ error: "Falta el ID de la oferta." });
    }

    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const codigoUnico = `OBERA-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    const { data, error } = await supabase
      .from("cupones_canjeados")
      .insert([{ oferta_id: offerId, codigo_unico: codigoUnico, usado: false }])
      .select()
      .single();

    if (error) {
      console.error("Error creando cupón único:", error);
      return res.status(500).json({ error: "No se pudo generar el cupón." });
    }

    return res.status(200).json({ codigoUnico: data.codigo_unico, id: data.id });
  } catch (err: any) {
    console.error("Error en claim:", err);
    return res.status(500).json({ error: err.message });
  }
}