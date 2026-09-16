import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const INITIAL_SHOPS: any[] = [];

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

function mapShopToDb(shop: any) {
  return {
    id: toUUID(shop.id, "shop"),
    nombre: shop.name || "",
    categoria: shop.category || "",
    direccion: shop.address || "",
    telefono: shop.phone || ""
  };
}

function mapDbToShop(row: any) {
  const initial = INITIAL_SHOPS.find(s => toUUID(s.id, "shop") === row.id);
  return {
    id: row.id,
    ownerId: row.owner_id || null,
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

// NOTA: nombres de bucket ajustados a los reales creados en Supabase
const LOGOS_BUCKET = "obera en oferta logos";
const IMAGES_BUCKET = "obera en oferta fotos";

export default async function handler(req: any, res: any) {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || "";

  let supabase: any = null;
  if (supabaseUrl && supabaseServiceKey) {
    try {
      supabase = createClient(supabaseUrl, supabaseServiceKey);
    } catch (err) {
      console.error("Failed to initialize Supabase inside shops handler:", err);
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

  if (req.method === "GET") {
    if (supabase) {
      try {
        const { data, error } = await supabase.from("negocios").select("*");
        if (error) throw error;

        if (data && data.length > 0) {
          const formatted = data.map(mapDbToShop);
          return res.status(200).json(formatted);
        } else {
          const dbShops = INITIAL_SHOPS.map(mapShopToDb);
          const { error: seedError } = await supabase.from("negocios").insert(dbShops);
          if (seedError) {
            console.error("Error seeding negocios table:", seedError);
          }

          const formattedShops = INITIAL_SHOPS.map(s => ({
            ...s,
            id: toUUID(s.id, "shop")
          }));
          return res.status(200).json(formattedShops);
        }
      } catch (err: any) {
        console.error("Error reading from Supabase negocios table in shops handler:", err.message);
        const formattedShops = INITIAL_SHOPS.map(s => ({
          ...s,
          id: toUUID(s.id, "shop")
        }));
        return res.status(200).json(formattedShops);
      }
    }
    const formattedShops = INITIAL_SHOPS.map(s => ({
      ...s,
      id: toUUID(s.id, "shop")
    }));
    return res.status(200).json(formattedShops);
  }

  if (req.method === "POST") {
    try {
      const { ownerId, name, logo, category, zone, address, phone, latitude, longitude, base64Logo, initialOffer } = req.body;
      let finalLogo = logo || "🛍️";

      if (base64Logo && base64Logo.startsWith("data:")) {
        const uploadUrl = await uploadImageToSupabase(base64Logo, LOGOS_BUCKET);
        if (uploadUrl) {
          finalLogo = uploadUrl;
        }
      }

      const newShopId = crypto.randomUUID();
      const newShop = {
        id: newShopId,
        name,
        logo: finalLogo,
        category,
        zone,
        isOpen: true,
        address,
        phone,
        rating: 5.0,
        latitude: latitude ? Number(latitude) : -27.4856,
        longitude: longitude ? Number(longitude) : -55.1193,
      };

      if (supabase) {
        const dbShop = mapShopToDb(newShop);
        const { error: fullError } = await supabase.from("negocios").insert([{
          ...dbShop,
          logo_url: finalLogo,
          imagen_url: finalLogo,
          zona: zone,
          latitud: latitude ? Number(latitude) : -27.4856,
          longitud: longitude ? Number(longitude) : -55.1193,
          owner_id: ownerId || null
        }]);

        if (fullError) {
          console.warn("Retrying with minimal columns due to column mismatches:", fullError.message);
          const { error: fallbackError } = await supabase.from("negocios").insert([{ ...dbShop, owner_id: ownerId || null }]);
          if (fallbackError) {
            console.error("Failed completely to insert negocio into Supabase:", fallbackError);
          }
        }
      }

      if (initialOffer) {
        let finalOfferImage = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";
        if (initialOffer.base64Image && initialOffer.base64Image.startsWith("data:")) {
          const uploadUrl = await uploadImageToSupabase(initialOffer.base64Image, IMAGES_BUCKET);
          if (uploadUrl) {
            finalOfferImage = uploadUrl;
          }
        }

        const newOfferId = crypto.randomUUID();
        const createdOffer = {
          id: newOfferId,
          shopId: newShopId,
          shopName: name,
          title: initialOffer.title,
          description: initialOffer.description || `Gran descuento especial en ${initialOffer.title}. ¡Aprovechalo hoy en Oberá!`,
          originalPrice: Number(initialOffer.originalPrice),
          discountPrice: Number(initialOffer.discountPrice),
          image: finalOfferImage,
          category: initialOffer.category || category,
          expiryDate: initialOffer.expiryDate || "2026-07-20",
          hasQrCoupon: initialOffer.hasQrCoupon !== undefined ? initialOffer.hasQrCoupon : true,
          qrCodeValue: initialOffer.hasQrCoupon ? `OBERACLUB-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
          isFlashSale: initialOffer.isFlashSale !== undefined ? initialOffer.isFlashSale : false,
          views: 0,
          couponsClaimed: 0,
          activo: true
        };

        if (supabase) {
          const dbOffer = mapOfferToDb(createdOffer);
          const { error } = await supabase.from("ofertas").insert([dbOffer]);
          if (error) {
            console.error("Failed to insert initial offer into Supabase:", error);
          }
        }
      }

      return res.status(200).json(newShop);
    } catch (err: any) {
      console.error("Error registering shop in shops handler:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // PUT: editar negocio existente (solo el dueño autenticado puede hacerlo)
  if (req.method === "PUT") {
    try {
      const authHeader = req.headers.authorization || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
      if (!token || !supabase) {
        return res.status(401).json({ error: "No autenticado." });
      }

      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData?.user) {
        return res.status(401).json({ error: "Sesión inválida o expirada." });
      }

      const { id, name, category, address, phone, zone, base64Logo, logo } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Falta el ID del negocio a editar." });
      }

      const cleanId = toUUID(id, "shop");

      // Confirmar que el negocio realmente le pertenece a este usuario
      const { data: existingShop, error: fetchError } = await supabase
        .from("negocios")
        .select("owner_id")
        .eq("id", cleanId)
        .single();

      if (fetchError || !existingShop) {
        return res.status(404).json({ error: "Negocio no encontrado." });
      }

      if (existingShop.owner_id !== userData.user.id) {
        return res.status(403).json({ error: "No tenés permiso para editar este negocio." });
      }

      let finalLogo = logo;
      if (base64Logo && base64Logo.startsWith("data:")) {
        const uploadUrl = await uploadImageToSupabase(base64Logo, LOGOS_BUCKET);
        if (uploadUrl) {
          finalLogo = uploadUrl;
        }
      }

      const updateData: any = {
        nombre: name,
        categoria: category,
        direccion: address,
        telefono: phone,
        zona: zone
      };
      if (finalLogo) {
        updateData.logo_url = finalLogo;
        updateData.imagen_url = finalLogo;
      }

      if (supabase) {
        const { error } = await supabase
          .from("negocios")
          .update(updateData)
          .eq("id", cleanId);
        if (error) {
          console.error("Error updating negocio:", error);
          return res.status(500).json({ error: error.message });
        }
      }

      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.error("Error editing shop:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // DELETE: eliminar negocio (solo admin). Las ofertas asociadas se borran en cascada por la base de datos.
  if (req.method === "DELETE") {
    const ADMIN_PASSWORD = process.env.ADMIN_PANEL_PASSWORD || "apsdev";
    const providedPassword = req.headers["x-admin-password"] || "";
    if (providedPassword !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "No autorizado." });
    }

    try {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: "Falta el ID del negocio a eliminar." });
      }
      if (!supabase) {
        return res.status(500).json({ error: "Configuración de Supabase faltante en el servidor." });
      }

      const cleanId = toUUID(id as string, "shop");
      const { error } = await supabase.from("negocios").delete().eq("id", cleanId);
      if (error) {
        console.error("Error eliminando negocio:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.error("Error eliminando negocio:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
}