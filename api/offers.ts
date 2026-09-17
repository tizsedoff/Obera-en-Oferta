import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const INITIAL_SHOPS: any[] = [];

const INITIAL_OFFERS: any[] = [];

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

function mapDbToShop(row: any) {
  const initial = INITIAL_SHOPS.find(s => toUUID(s.id, "shop") === row.id);
  return {
    id: row.id,
    name: row.nombre || "Comercio",
    logo: row.logo_url || row.imagen_url || row.logo || row.imagen || initial?.logo || "🛍️",
    category: row.categoria || "Otros",
    zone: initial?.zone || row.zona || "Centro",
    isOpen: initial?.isOpen !== undefined ? initial.isOpen : true,
    address: row.direccion || "Oberá, Misiones",
    phone: row.telefono || "",
    rating: initial?.rating || 5.0,
    latitude: row.latitud ? Number(row.latitud) : (initial?.latitude || -27.4856),
    longitude: row.longitud ? Number(row.longitud) : (initial?.longitude || -55.1193)
  };
}

function mapOfferToDb(offer: any) {
  return {
    id: toUUID(offer.id, "offer"),
    negocio_id: toUUID(offer.shopId, "shop"),
    titulo: offer.title || "",
    descripcion: offer.description || "",
    precio_original: Math.round(Number(offer.originalPrice || 0)),
    categoria: offer.category || "",
    imagen_url: offer.image || "",
    precio_oferta: Math.round(Number(offer.discountPrice || 0)),
    fecha_fin: offer.expiryDate || "",
    activo: true
  };
}

function mapDbToOffer(row: any, allShops: any[]) {
  const initial = INITIAL_OFFERS.find(o => toUUID(o.id, "offer") === row.id) as any;
  const shop = allShops.find(s => s.id === row.negocio_id);
  const shopName = shop ? shop.name : (initial?.shopName || "Comercio");

  return {
    id: row.id,
    shopId: row.negocio_id,
    shopName: shopName,
    title: row.titulo || "Oferta Especial",
    description: row.descripcion || "",
    originalPrice: Number(row.precio_original || 0),
    discountPrice: Number(row.precio_oferta || 0),
    image: row.imagen_url || initial?.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
    category: row.categoria || "Otros",
    expiryDate: row.fecha_fin || "",
    hasQrCoupon: initial?.hasQrCoupon !== undefined ? initial.hasQrCoupon : true,
    qrCodeValue: initial?.qrCodeValue || `OBERACLUB-${row.id.slice(0, 4).toUpperCase()}`,
    views: 0,
    couponsClaimed: initial?.couponsClaimed || 0,
    isFlashSale: initial?.isFlashSale !== undefined ? initial.isFlashSale : false,
    usado: initial?.usado !== undefined ? initial.usado : false
  };
}

const IMAGES_BUCKET = "obera-en-oferta-fotos";

export default async function handler(req: any, res: any) {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || "";
  
  let supabase: any = null;
  if (supabaseUrl && supabaseServiceKey) {
    try {
      supabase = createClient(supabaseUrl, supabaseServiceKey);
    } catch (err) {
      console.error("Failed to initialize Supabase inside offers handler:", err);
    }
  }

  async function uploadImageToSupabase(base64DataUrl: string, bucket: string): Promise<string | null> {
    if (!supabase) return null;
    try {
      const match = base64DataUrl.match(/^data:([^;]+);base64,(.*)$/);
      if (!match) return null;
      const mimeType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, "base64");
      
      const fileExt = mimeType.split("/")[1] || "png";
      const fileName = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, buffer, {
          contentType: mimeType,
          upsert: true
        });

      if (error) {
        console.error(`Error uploading to bucket ${bucket}:`, error);
        return null;
      }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return urlData?.publicUrl || null;
    } catch (e) {
      console.error("Storage upload helper exception:", e);
      return null;
    }
  }

  // GET Live Offers
  if (req.method === "GET") {
    let currentShops = INITIAL_SHOPS.map(s => ({ ...s, id: toUUID(s.id, "shop") }));
    if (supabase) {
      try {
        const { data: dbShops } = await supabase.from("negocios").select("*");
        if (dbShops && dbShops.length > 0) {
          currentShops = dbShops.map(mapDbToShop);
        }
      } catch (err) {
        console.error("Error reading shops inside offers handler:", err);
      }

      try {
        const { data, error } = await supabase.from("ofertas").select("*");
        if (error) throw error;

        if (data && data.length > 0) {
          const formatted = data.map((d: any) => mapDbToOffer(d, currentShops));
          return res.status(200).json(formatted);
        } else {
          console.log("Supabase ofertas table is empty. Seeding INITIAL_OFFERS...");
          const dbOffers = INITIAL_OFFERS.map(mapOfferToDb);
          const { error: seedError } = await supabase.from("ofertas").insert(dbOffers);
          if (seedError) {
            console.error("Error seeding ofertas table:", seedError);
          }
          
          const formattedOffers = INITIAL_OFFERS.map(o => ({
            ...o,
            id: toUUID(o.id, "offer"),
            shopId: toUUID(o.shopId, "shop")
          }));
          return res.status(200).json(formattedOffers);
        }
      } catch (err: any) {
        console.error("Error reading from Supabase ofertas table inside serverless handler:", err.message);
        const formattedOffers = INITIAL_OFFERS.map(o => ({
          ...o,
          id: toUUID(o.id, "offer"),
          shopId: toUUID(o.shopId, "shop")
        }));
        return res.status(200).json(formattedOffers);
      }
    }

    const formattedOffers = INITIAL_OFFERS.map(o => ({
      ...o,
      id: toUUID(o.id, "offer"),
      shopId: toUUID(o.shopId, "shop")
    }));
    return res.status(200).json(formattedOffers);
  }

  // POST Add Offer
  if (req.method === "POST") {
    try {
      const { shopId, shopName, title, description, originalPrice, discountPrice, category, expiryDate, hasQrCoupon, isFlashSale, image, base64Image } = req.body;
      let finalImage = image;

      if (base64Image && base64Image.startsWith("data:")) {
        const uploadUrl = await uploadImageToSupabase(base64Image, IMAGES_BUCKET);
        if (uploadUrl) {
          finalImage = uploadUrl;
        }
      }

      const cleanShopId = toUUID(shopId || "shop-1", "shop");
      const cleanShopName = shopName || "Yerba Mate & Delicias Misioneras";

      const newOfferId = crypto.randomUUID();
      const newOffer = {
        id: newOfferId,
        shopId: cleanShopId,
        shopName: cleanShopName,
        title,
        description: description || `Gran descuento especial en ${title}. ¡Aprovechalo hoy en Oberá!`,
        originalPrice: Number(originalPrice),
        discountPrice: Number(discountPrice),
        image: finalImage,
        category,
        expiryDate,
        hasQrCoupon: hasQrCoupon !== undefined ? hasQrCoupon : true,
        qrCodeValue: hasQrCoupon ? `OBERACLUB-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
        views: 0,
        couponsClaimed: 0,
        isFlashSale: isFlashSale !== undefined ? isFlashSale : false,
        usado: false,
      };

      if (supabase) {
        const dbOffer = mapOfferToDb(newOffer);
        const { error } = await supabase.from("ofertas").insert([dbOffer]);
        if (error) {
          console.error("Error inserting offer into Supabase:", error);
        }
      }

      return res.status(200).json(newOffer);
    } catch (err: any) {
      console.error("Error posting offer in serverless:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // DELETE Offer
  if (req.method === "DELETE") {
    try {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: "Missing offer ID in request query." });
      }
      const cleanId = toUUID(id as string, "offer");
      
      if (supabase) {
        const { error } = await supabase.from("ofertas").delete().eq("id", cleanId);
        if (error) {
          console.error("Error deleting offer from Supabase inside serverless handler:", error);
        }
      }
      
      return res.status(200).json({ success: true, message: "Oferta eliminada correctamente." });
    } catch (err: any) {
      console.error("Error deleting offer in serverless:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
}