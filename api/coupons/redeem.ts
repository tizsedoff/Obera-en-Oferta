import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const INITIAL_OFFERS = [
  {
    id: 'offer-1',
    shopId: 'shop-1',
    shopName: 'Yerba Mate & Delicias Misioneras',
    title: '30% Off Combo Mate + Termo de Acero',
    description: 'Bocados de tierra colorada. Llevate un termo de acero inoxidable de 1 litro grabado con el escudo de Oberá más un paquete de yerba mate premium de 500g con un 30% de descuento directo.',
    originalPrice: 45000,
    discountPrice: 31500,
    image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80',
    category: 'Gastronomía',
    expiryDate: '2026-07-10',
    hasQrCoupon: true,
    qrCodeValue: 'OBERAMATE-30-OFF-X921',
    views: 145,
    couponsClaimed: 38,
    isFlashSale: false
  },
  {
    id: 'offer-2',
    shopId: 'shop-5',
    shopName: 'Heladería Polar',
    title: '2x1 en Kilo de Helado Artesanal',
    description: '🔥 ¡Especial de la semana! Comprando 1 kg de helado artesanal de cualquier variedad, te llevás el segundo de regalo. ¡Probá nuestro sabor autóctono de Crema de Mate Cocido!',
    originalPrice: 12000,
    discountPrice: 6000,
    image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80',
    category: 'Gastronomía',
    expiryDate: '2026-07-06',
    hasQrCoupon: true,
    qrCodeValue: 'POLAR-2X1-KILO-Y712',
    views: 312,
    couponsClaimed: 94,
    isFlashSale: false
  },
  {
    id: 'offer-3',
    shopId: 'shop-6',
    shopName: 'Calzados Carhué',
    title: '15% de Descuento en Zapatillas Deportivas',
    description: 'Zapatillas seleccionadas de primera marca para correr por las calles de Oberá. Presentá el cupón QR y obtené el beneficio inmediato en caja abonando en efectivo o transferencia.',
    originalPrice: 55000,
    discountPrice: 46750,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    category: 'Indumentaria',
    expiryDate: '2026-07-15',
    hasQrCoupon: true,
    qrCodeValue: 'CARHUE-DEPOR-15-Z882',
    views: 89,
    couponsClaimed: 14,
    isFlashSale: false
  }
];

function toUUID(id: string, prefix: 'shop' | 'offer'): string {
  if (!id) return crypto.randomUUID();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  const num = parseInt(id.replace(/[^0-9]/g, "")) || Math.floor(Math.random() * 100000);
  const hex = num.toString(16).padStart(12, "0");
  if (prefix === "shop") {
    return `00000000-0000-0000-0000-${hex}`;
  } else {
    return `11111111-1111-1111-1111-${hex}`;
  }
}

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
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || "";
    
    let supabase: any = null;
    if (supabaseUrl && supabaseServiceKey) {
      try {
        supabase = createClient(supabaseUrl, supabaseServiceKey);
      } catch (err) {
        console.error("Failed to initialize Supabase inside redeem handler:", err);
      }
    }

    let searchId = "";
    let searchCode = "";

    if (scannedCode.includes("id=")) {
      const urlParams = new URLSearchParams(scannedCode.split("?")[1]);
      searchId = urlParams.get("id") || "";
    } else {
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(scannedCode) || scannedCode.startsWith("offer-")) {
        searchId = toUUID(scannedCode, "offer");
      } else {
        searchCode = scannedCode;
      }
    }

    let targetOffer: any = null;

    if (supabase) {
      // Find the offer in Supabase
      const { data: dbOffers, error } = await supabase.from("ofertas").select("*");
      if (!error && dbOffers && dbOffers.length > 0) {
        targetOffer = dbOffers.find((o: any) => {
          const uId = toUUID(o.id, "offer");
          const codeMatches = searchCode && o.qrCodeValue && o.qrCodeValue.toLowerCase() === searchCode.toLowerCase();
          const idMatches = searchId && uId === toUUID(searchId, "offer");
          return idMatches || codeMatches;
        });

        if (targetOffer) {
          // Map to frontend properties
          targetOffer = {
            id: targetOffer.id,
            title: targetOffer.titulo,
            originalPrice: Number(targetOffer.precio_original || 0),
            discountPrice: Number(targetOffer.precio_oferta || 0),
            activo: targetOffer.activo
          };
        }
      }
    }

    // Fallback to INITIAL_OFFERS if not found or no Supabase
    if (!targetOffer) {
      targetOffer = INITIAL_OFFERS.find(o => 
        (searchId && toUUID(o.id, "offer") === toUUID(searchId, "offer")) || 
        (searchCode && o.qrCodeValue && o.qrCodeValue.toLowerCase() === searchCode.toLowerCase())
      );
    }

    if (!targetOffer) {
      return res.status(404).json({ success: false, error: "Código de cupón inválido o no encontrado en el sistema de Oberá." });
    }

    // Check if deactivated already
    if (targetOffer.activo === false || targetOffer.usado === true) {
      return res.status(200).json({ 
        success: false, 
        error: "⚠️ ¡Este cupón ya fue canjeado y desactivado previamente! No es válido para una segunda compra.",
        offerTitle: targetOffer.title
      });
    }

    // Deactivate in Supabase
    if (supabase) {
      try {
        const { error } = await supabase
          .from("ofertas")
          .update({ activo: false })
          .eq("id", toUUID(targetOffer.id, "offer"));
        if (error) throw error;
      } catch (dbErr) {
        console.error("Failed to update coupon status in Supabase:", dbErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: "¡Enhorabuena! El cupón ha sido validado e ingresado correctamente.",
      offerTitle: targetOffer.title,
      discountPrice: targetOffer.discountPrice,
      originalPrice: targetOffer.originalPrice,
      savings: (targetOffer.originalPrice || 0) - (targetOffer.discountPrice || 0)
    });
  } catch (err: any) {
    console.error("Error in serverless redeem route:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
