import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// POST /api/payments/webhook  (notificaciones de Mercado Pago)
// No se confía en lo que llega en el cuerpo: solo se toma el ID del pago, se vuelve a consultar a Mercado Pago
// con nuestro token, y recién ahí se valida el estado, la referencia y el monto antes de dar el plan.
// Responder 200 = "recibido" (MP no reintenta). Responder 5xx = MP reintenta más tarde.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function firmaValida(req: any, dataId: string, secret: string): boolean {
  const signature = String(req.headers?.["x-signature"] || "");
  const requestId = String(req.headers?.["x-request-id"] || "");
  const parts: Record<string, string> = {};
  for (const piece of signature.split(",")) {
    const [k, v] = piece.split("=").map((s) => s.trim());
    if (k && v) parts[k] = v;
  }
  if (!parts.ts || !parts.v1) return false;

  let manifest = "";
  if (dataId) manifest += `id:${dataId.toLowerCase()};`;
  if (requestId) manifest += `request-id:${requestId};`;
  manifest += `ts:${parts.ts};`;

  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  const supabaseUrl = process.env.SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || "";
  const mpToken = process.env.MP_ACCESS_TOKEN || "";
  if (!supabaseUrl || !serviceKey || !mpToken) {
    console.error("Webhook de pagos sin configuración completa (Supabase o MP_ACCESS_TOKEN).");
    return res.status(503).json({ error: "Pagos no configurados." });
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const query = req.query || {};
    const body = req.body || {};
    const tipo = String(body.type || query.type || query.topic || "");
    const dataId = String(body?.data?.id || query["data.id"] || (query.topic === "payment" ? query.id : "") || "");

    // Solo nos interesan las notificaciones de pagos
    if (tipo !== "payment" || !dataId) {
      return res.status(200).json({ ignored: true });
    }

    const secret = process.env.MP_WEBHOOK_SECRET || "";
    if (secret) {
      if (!firmaValida(req, dataId, secret)) {
        console.warn("Webhook de pagos con firma inválida.");
        return res.status(401).json({ error: "Firma inválida." });
      }
    } else {
      console.warn("MP_WEBHOOK_SECRET no configurado: se valida solo consultando el pago a Mercado Pago.");
    }

    // Consultar el pago real a Mercado Pago
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
    });
    if (mpRes.status === 404) return res.status(200).json({ ignored: true });
    if (!mpRes.ok) {
      console.error("No se pudo consultar el pago en Mercado Pago:", mpRes.status);
      return res.status(502).json({ error: "No se pudo consultar el pago." });
    }
    const payment = await mpRes.json();

    const pagoId = String(payment.external_reference || "");
    if (!UUID_RE.test(pagoId)) return res.status(200).json({ ignored: true });

    const { data: pago, error: pagoError } = await supabase.from("pagos").select("*").eq("id", pagoId).maybeSingle();
    if (pagoError) return res.status(500).json({ error: "Error leyendo el pago." });
    if (!pago) return res.status(200).json({ ignored: true });

    const status = String(payment.status || "");
    const now = new Date().toISOString();

    if (status === "approved") {
      const montoOk = Math.abs(Number(payment.transaction_amount) - Number(pago.monto_ars)) < 0.01;
      if (!montoOk || payment.currency_id !== "ARS") {
        console.error("Pago aprobado con monto o moneda que no coinciden:", pagoId, payment.transaction_amount, payment.currency_id);
        await supabase.from("pagos").update({ mp_status: "monto_no_coincide", updated_at: now }).eq("id", pagoId).neq("estado", "aprobado");
        return res.status(200).json({ ignored: true });
      }
      const { data: aplicado, error: rpcError } = await supabase.rpc("aplicar_pago_aprobado", {
        p_pago_id: pagoId,
        p_mp_payment_id: String(payment.id),
        p_mp_status: status,
      });
      if (rpcError) {
        console.error("Error aplicando el pago aprobado:", rpcError);
        return res.status(500).json({ error: "No se pudo aplicar el pago." });
      }
      if (!aplicado && String(pago.mp_payment_id || "") !== String(payment.id) && pago.estado === "aprobado") {
        console.warn("Segundo pago aprobado para un mismo pedido (posible cobro duplicado, revisar reembolso):", pagoId, payment.id);
      }
      return res.status(200).json({ ok: true, applied: !!aplicado });
    }

    if (status === "rejected" || status === "cancelled") {
      await supabase
        .from("pagos")
        .update({ estado: status === "rejected" ? "rechazado" : "cancelado", mp_status: status, updated_at: now })
        .eq("id", pagoId)
        .neq("estado", "aprobado");
      return res.status(200).json({ ok: true });
    }

    if (status === "refunded" || status === "charged_back") {
      // Se marca; retirar el plan o el destacado por un reembolso se revisa a mano por ahora.
      await supabase.from("pagos").update({ estado: "reembolsado", mp_status: status, updated_at: now }).eq("id", pagoId);
      return res.status(200).json({ ok: true });
    }

    // pending / in_process / authorized: solo guardamos el estado informativo
    await supabase.from("pagos").update({ mp_status: status, updated_at: now }).eq("id", pagoId).neq("estado", "aprobado");
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("Error en /api/payments/webhook:", err);
    return res.status(500).json({ error: "Error interno." });
  }
}
