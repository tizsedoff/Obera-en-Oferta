import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

dotenv.config();

// Define fallback initial data locally on server for bulletproof execution
const INITIAL_SHOPS: any[] = [];

const INITIAL_OFFERS: any[] = [];

// Helper to convert simple mock IDs to valid UUIDs deterministically
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

// Map frontend Shop interface to Supabase negocios table row
function mapShopToDb(shop: any) {
  return {
    id: toUUID(shop.id, "shop"),
    nombre: shop.name || "",
    categoria: shop.category || "",
    direccion: shop.address || "",
    telefono: shop.phone || ""
  };
}

// Map Supabase negocios table row to frontend Shop interface
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

// Map frontend Offer interface to Supabase ofertas table row
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

// Map Supabase ofertas table row to frontend Offer interface
function mapDbToOffer(row: any, allShops: any[]) {
  const initial = INITIAL_OFFERS.find(o => toUUID(o.id, "offer") === row.id);
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
    views: initial?.views || Math.floor(Math.random() * 25) + 5,
    couponsClaimed: initial?.couponsClaimed || 0,
    isFlashSale: initial?.isFlashSale !== undefined ? initial.isFlashSale : false,
    usado: initial?.usado !== undefined ? initial.usado : false
  };
}

// Memory state copies for fallbacks, mapped to UUIDs immediately
let memoryShops: any[] = INITIAL_SHOPS.map(s => ({
  ...s,
  id: toUUID(s.id, "shop")
}));

let memoryOffers: any[] = INITIAL_OFFERS.map(o => ({
  ...o,
  id: toUUID(o.id, "offer"),
  shopId: toUUID(o.shopId, "shop")
}));

// Initialize Supabase Client Lazily and Safely
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || "";
let supabase: any = null;

if (supabaseUrl && supabaseServiceKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Supabase Client initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Supabase Client:", err);
  }
} else {
  console.warn("SUPABASE_URL or SUPABASE_SERVICE_KEY is missing. Using in-memory fallback storage.");
}

// Helper to upload images to Supabase Storage
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing json and urlencoded data
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ limit: '20mb', extended: true }));

  // Initialize Gemini client with proper telemetry header
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Local matching function for robust offline/emergency reasoning fallback
  function getLocalFallbackResponse(message: string): string {
    const msg = (message || "").toLowerCase();
    
    if (msg.includes("mate") || msg.includes("yerba") || msg.includes("chipa") || msg.includes("delicias")) {
      return `Te cuento sobre **Yerba Mate & Delicias Misioneras** (Av. Sarmiento 450). 
Tienen un ofertón espectacular: **30% de Descuento en Combo Mate + Termo de Acero** (Termo inox 1L + Yerba Mate de 500g).
*   **Precio Oferta:** $31.500 (Precio normal: $45.000)
*   **Código de Cupón QR:** \`OBERAMATE-30-OFF-X921\`
*   **Vence:** 10 de julio de 2026.
¡Ideal para arrancar el día bien misionero, chamigo!`;
    }
    
    if (msg.includes("helado") || msg.includes("polar") || msg.includes("crema") || msg.includes("frío") || msg.includes("frio")) {
      return `Si querés refrescarte, en **Heladería Polar** (Av. Sarmiento 210) tienen una promo imperdible:
**2x1 en Kilo de Helado Artesanal** (¡tenés que probar el sabor único de Crema de Mate Cocido!).
*   **Precio Oferta:** $6.000 (Precio normal: $12.000)
*   **Código de Cupón QR:** \`POLAR-2X1-KILO-Y712\`
*   **Vence:** 6 de julio de 2026.
¡Para disfrutar con amigos o la familia!`;
    }
    
    if (msg.includes("zapatilla") || msg.includes("zapato") || msg.includes("calzado") || msg.includes("carhue") || msg.includes("pie")) {
      return `En **Calzados Carhué** (Av. Libertad 340) tienen calzado de primera calidad:
**15% de Descuento en Zapatillas Deportivas** de primeras marcas.
*   **Precio Oferta:** $46.750 (Precio normal: $55.000)
*   **Código de Cupón QR:** \`CARHUE-DEPOR-15-Z882\`
*   **Vence:** 15 de julio de 2026.
¡Para andar cómodo por toda la Tierra Colorada!`;
    }
    
    if (msg.includes("tv") || msg.includes("smart") || msg.includes("tele") || msg.includes("electro") || msg.includes("televisor")) {
      return `Te paso el dato de **Electro Oberá** (Sgto. Cabral 15, frente a Plaza San Martín):
Tienen una Oferta Flash sin cupón QR para un **Smart TV 43" Full HD Smart Tech**.
*   **Precio Oferta:** $299.990 (Precio normal: $380.000)
*   **Vence:** 5 de julio de 2026.
*   *Nota:* Actualmente el local físico está cerrado, ¡pero podés aprovechar la oferta online de la plataforma!`;
    }
    
    if (msg.includes("harina") || msg.includes("favorita") || msg.includes("condor") || msg.includes("cóndor") || msg.includes("super")) {
      return `En el **Supermercado El Cóndor** (Av. Italia 890) podés encontrar:
**Pack x3 Harina Favorita** en Oferta Flash (sin cupón QR), ideal para unas buenas tortas fritas misioneras en días lluviosos.
*   **Precio Oferta:** $2.900 (Precio normal: $4.200)
*   **Vence:** 8 de julio de 2026.
¡Para que no falte nada en la mesa, chamigo!`;
    }
    
    if (msg.includes("campera") || msg.includes("abrigo") || msg.includes("ropa") || msg.includes("indumentaria") || msg.includes("style")) {
      return `En **Misiones Style Indumentaria** (Av. Libertad 120) tienen una promo para el frío:
**Campera de Abrigo de Gabardina con Corderito** (Oferta Flash sin cupón, talles S al XXL).
*   **Precio Oferta:** $59.500 (Precio normal: $85.000)
*   **Vence:** 7 de julio de 2026.
¡Especial para abrigarse con estilo!`;
    }
    
    if (msg.includes("cupón") || msg.includes("cupon") || msg.includes("descuento") || msg.includes("secreto") || msg.includes("promoción") || msg.includes("codigo") || msg.includes("código")) {
      return `¡Te tiro un secreto de Oberá en Oferta! 
Utilizá el código secreto **\`OBERABOT20\`** para recibir un **15% de descuento adicional** en tus compras presenciales en tiendas de la zona centro adheridas.
Además, si realizás una compra y subís una foto de tu ticket/recibo acá en el chat, te sumamos **100 puntos de fidelidad** para canjear en la Fiesta Nacional del Inmigrante. ¡Una locura!`;
    }

    return `¡Hola, che! ¿Cómo andás? Como tu Asistente local de la Tierra Colorada, tengo todos los comercios y ofertas de Oberá memorizados en mi chip local:

1.  **Yerba Mate & Delicias Misioneras** 🧉: 30% de descuento en Combo Mate + Termo ($31.500).
2.  **Heladería Polar** 🍦: 2x1 en Kilo de Helado Artesanal (¡con sabor de Crema de Mate Cocido!).
3.  **Calzados Carhué** 👟: 15% off en Zapatillas Deportivas ($46.750).
4.  **Electro Oberá** ⚡: Smart TV 43" en Oferta Flash ($299.990).
5.  **Supermercado El Cóndor** 🛒: Pack x3 Harina Favorita ($2.900).
6.  **Misiones Style Indumentaria** 👕: Campera de abrigo con corderito ($59.500).

*   *Tip Secreto:* Usá el código OBERABOT20 para recibir un 15% de descuento adicional.`;
  }

  // --- BUSINESSES AND OFFERS API ENDPOINTS ---

  // GET Live Shops
  app.get("/api/shops", async (req, res) => {
    if (supabase) {
      try {
        const { data, error } = await supabase.from("negocios").select("*");
        if (error) throw error;
        
        if (data && data.length > 0) {
          const formatted = data.map(mapDbToShop);
          memoryShops = formatted; // Sync memory
          return res.json(formatted);
        } else {
          // Seed INITIAL_SHOPS to Supabase to make it user-ready
          console.log("Supabase negocios table is empty. Seeding INITIAL_SHOPS...");
          const dbShops = INITIAL_SHOPS.map(mapShopToDb);
          const { error: seedError } = await supabase.from("negocios").insert(dbShops);
          if (seedError) {
            console.error("Error seeding negocios table:", seedError);
          } else {
            console.log("Seeding negocios table succeeded!");
          }
          
          const formattedShops = INITIAL_SHOPS.map(s => ({
            ...s,
            id: toUUID(s.id, "shop")
          }));
          memoryShops = formattedShops;
          return res.json(formattedShops);
        }
      } catch (err: any) {
        console.error("Error reading from Supabase negocios table:", err.message);
        // Fallback using UUIDs for safety
        const formattedShops = memoryShops.map(s => ({
          ...s,
          id: toUUID(s.id, "shop")
        }));
        return res.json(formattedShops);
      }
    }
    return res.json(memoryShops);
  });

  // GET Live Offers
  app.get("/api/offers", async (req, res) => {
    if (supabase) {
      try {
        const { data, error } = await supabase.from("ofertas").select("*");
        if (error) throw error;

        const currentShops = memoryShops.length > 0 ? memoryShops : INITIAL_SHOPS.map(s => ({ ...s, id: toUUID(s.id, "shop") }));

        if (data && data.length > 0) {
          const formatted = data.map((d: any) => mapDbToOffer(d, currentShops));
          memoryOffers = formatted; // Sync memory
          return res.json(formatted);
        } else {
          console.log("Supabase ofertas table is empty. Seeding INITIAL_OFFERS...");
          const dbOffers = INITIAL_OFFERS.map(mapOfferToDb);
          const { error: seedError } = await supabase.from("ofertas").insert(dbOffers);
          if (seedError) {
            console.error("Error seeding ofertas table:", seedError);
          } else {
            console.log("Seeding ofertas table succeeded!");
          }
          
          const formattedOffers = INITIAL_OFFERS.map(o => ({
            ...o,
            id: toUUID(o.id, "offer"),
            shopId: toUUID(o.shopId, "shop")
          }));
          memoryOffers = formattedOffers;
          return res.json(formattedOffers);
        }
      } catch (err: any) {
        console.error("Error reading from Supabase ofertas table:", err.message);
        const formattedOffers = memoryOffers.map(o => ({
          ...o,
          id: toUUID(o.id, "offer"),
          shopId: toUUID(o.shopId, "shop")
        }));
        return res.json(formattedOffers);
      }
    }
    return res.json(memoryOffers);
  });

  // POST Add/Register Shop
  app.post("/api/shops", async (req, res) => {
    try {
      const { name, logo, category, zone, address, phone, latitude, longitude, base64Logo, initialOffer } = req.body;
      let finalLogo = logo || "🛍️";

      if (base64Logo && base64Logo.startsWith("data:")) {
        const uploadUrl = await uploadImageToSupabase(base64Logo, "logos");
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
        // Try to insert with optional columns if the schema has them, fallback otherwise
        const { error: fullError } = await supabase.from("negocios").insert([{
          ...dbShop,
          logo_url: finalLogo,
          imagen_url: finalLogo,
          logo: finalLogo,
          zona: zone,
          latitud: latitude ? Number(latitude) : -27.4856,
          longitud: longitude ? Number(longitude) : -55.1193
        }]);

        if (fullError) {
          console.warn("Retrying with minimal columns due to column mismatches:", fullError.message);
          const { error: fallbackError } = await supabase.from("negocios").insert([dbShop]);
          if (fallbackError) {
            console.error("Failed completely to insert negocio into Supabase:", fallbackError);
          }
        }
      }

      memoryShops.push(newShop);

      // Handle linked initial offer insertion in the same flow if provided
      if (initialOffer) {
        let finalOfferImage = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";
        if (initialOffer.base64Image && initialOffer.base64Image.startsWith("data:")) {
          const uploadUrl = await uploadImageToSupabase(initialOffer.base64Image, "images");
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

        memoryOffers.push(createdOffer);
      }

      return res.json(newShop);
    } catch (err: any) {
      console.error("Error registering shop:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // POST Add/Register Offer
  app.post("/api/offers", async (req, res) => {
    try {
      const { shopId, shopName, title, description, originalPrice, discountPrice, category, expiryDate, hasQrCoupon, isFlashSale, image, base64Image } = req.body;
      let finalImage = image;

      if (base64Image && base64Image.startsWith("data:")) {
        const uploadUrl = await uploadImageToSupabase(base64Image, "images");
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
        views: Math.floor(Math.random() * 15) + 3,
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

      memoryOffers.unshift(newOffer);
      return res.json(newOffer);
    } catch (err: any) {
      console.error("Error posting offer:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // DELETE Offer
  app.delete("/api/offers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const cleanId = toUUID(id, "offer");
      
      // Update in-memory fallback list
      const index = memoryOffers.findIndex(o => toUUID(o.id, "offer") === cleanId);
      if (index !== -1) {
        memoryOffers.splice(index, 1);
      }
      
      // Delete from Supabase if available
      if (supabase) {
        const { error } = await supabase.from("ofertas").delete().eq("id", cleanId);
        if (error) {
          console.error("Error deleting offer from Supabase:", error);
        }
      }
      
      return res.json({ success: true, message: "Oferta eliminada correctamente." });
    } catch (err: any) {
      console.error("Error deleting offer:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // POST Redeem/Validate Coupon QR Code
  app.post("/api/coupons/redeem", async (req, res) => {
    try {
      const { scannedCode } = req.body;
      if (!scannedCode) {
        return res.status(400).json({ success: false, error: "No se proporcionó ningún código QR" });
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

      const offerIndex = memoryOffers.findIndex(o => 
        (searchId && toUUID(o.id, "offer") === toUUID(searchId, "offer")) || 
        (searchCode && o.qrCodeValue && o.qrCodeValue.toLowerCase() === searchCode.toLowerCase())
      );

      if (offerIndex === -1) {
        return res.json({ success: false, error: "Código de cupón inválido o no encontrado en el sistema." });
      }

      const offer = memoryOffers[offerIndex];

      if (offer.usado) {
        return res.json({ 
          success: false, 
          error: "⚠️ ¡Este cupón ya fue canjeado y desactivado previamente! No es válido para una segunda compra.",
          offerTitle: offer.title,
          shopName: offer.shopName
        });
      }

      // Mark as used
      memoryOffers[offerIndex].usado = true;
      memoryOffers[offerIndex].couponsClaimed += 1;

      // Update Supabase if available (marking active=false since usado column does not exist)
      if (supabase) {
        try {
          const { error } = await supabase
            .from("ofertas")
            .update({ activo: false })
            .eq("id", toUUID(offer.id, "offer"));
          if (error) throw error;
        } catch (dbErr) {
          console.error("Failed to update coupon usado status in Supabase:", dbErr);
        }
      }

      return res.json({
        success: true,
        message: "¡Enhorabuena! El cupón ha sido validado e ingresado correctamente.",
        offerTitle: offer.title,
        shopName: offer.shopName,
        discountPrice: offer.discountPrice,
        originalPrice: offer.originalPrice,
        savings: offer.originalPrice - offer.discountPrice
      });
    } catch (err: any) {
      console.error("Error in redeem route:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Route for Gemini Chatbot with Vision & Reasoning
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, image } = req.body;

      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "YOUR_API_KEY") {
        console.warn("GEMINI_API_KEY is not defined. Falling back to advanced local reasoning.");
        const fallbackText = getLocalFallbackResponse(message);
        return res.json({
          text: `🧉 **[Asistente Local]** ${fallbackText}`,
          isFallback: true
        });
      }

      // Format dynamic database content for live prompt
      const liveShopsText = memoryShops.map((s, i) => 
        `- "${s.name}" (Logo: ${s.logo}) - Categoría: ${s.category}, Dirección: ${s.address}, Abierto: ${s.isOpen ? 'Sí' : 'No'}, Rating: ${s.rating}.`
      ).join("\n");

      const liveOffersText = memoryOffers.map((o, i) => 
        `- "${o.title}" en "${o.shopName}" (${o.category}). ${o.description}. Cupón QR: ${o.hasQrCoupon ? (o.qrCodeValue || 'Sí') : 'No'}. Precio Normal: $${o.originalPrice}, Precio Oferta: $${o.discountPrice}. Vence: ${o.expiryDate}. Estado: ${o.usado ? 'Ya fue canjeado/usado por alguien' : 'Disponible y activo'}`
      ).join("\n");

      const systemPrompt = `Eres el Asistente Inteligente oficial de "Oberá en Oferta", una plataforma para comercios locales en la hermosa ciudad de Oberá, Misiones, Argentina.
Hablas con un tono muy amigable, cálido, característico del interior de Misiones (usando expresiones locales como "che", "gurí/gurisa", "mate", "tereré", "tierra colorada" de forma natural y sin exagerar). Tu objetivo es ayudar a los compradores a ahorrar dinero mediante ofertas vigentes y cupones QR, y guiar a los comerciantes locales a registrar sus negocios y potenciar las ventas locales de forma 100% gratuita.

A continuación tienes el contexto EN TIEMPO REAL cargado dinámicamente desde Supabase de los comercios adheridos y las ofertas activas en Oberá para que tus respuestas sean 100% precisas, verídicas y útiles. NUNCA inventes locales u ofertas que no figuren en este listado:

---
COMERCIOS ADHERIDOS (Shops):
${liveShopsText}

OFERTAS ACTIVAS Y CUPONES (Offers):
${liveOffersText}

INFORMACIÓN EXTRA SOBRE CÓDIGOS EXCLUSIVOS:
- Existe un cupón secreto exclusivo para el centro de Oberá: CÓDIGO "OBERABOT20" para recibir un 15% de descuento adicional en compras presenciales en tiendas de la zona centro.
- Puntos de fidelidad: Si un usuario te muestra una foto de su ticket, puedes otorgar 100 puntos ficticios que se acumulan para la Fiesta Nacional del Inmigrante.

---
INSTRUCCIONES MULTIMODALES (Si te envían una imagen):
- Si el usuario te envía una imagen, analízala con detenimiento. Puede ser una foto de un producto, un ticket de compra (recibo), o una captura de pantalla de una oferta.
- Si parece un ticket o recibo: extrae los datos visibles (tienda, monto, fecha) y confírmale al usuario que has validado su compra en Oberá y que sumó 100 puntos de fidelidad de la plataforma para canjear en la Fiesta Nacional del Inmigrante.
- Si parece un calzado, ropa u otro producto: dale sugerencias de dónde conseguirlo en Oberá (por ejemplo, Calzados Carhué para zapatillas, Misiones Style para ropa) y menciónale que puede usar un cupón QR o el código secreto OBERABOT20.
- Si es cualquier otra imagen, di qué logras identificar con tu visión artificial de Gemini y cómo se conecta con la cultura de Misiones o el ahorro local de Oberá.

Mantén tus respuestas bien redactadas, amigables, con párrafos breves, emojis y un formateo en Markdown impecable para que se lee hermoso en la pantalla móvil del chat de la app.`;

      // Construct Gemini request parts
      const parts: any[] = [];

      // If an image is provided (Base64 data-URL), split MIME type and data
      if (image && image.startsWith("data:")) {
        const mimeTypeMatch = image.match(/^data:([^;]+);base64,/);
        if (mimeTypeMatch) {
          const mimeType = mimeTypeMatch[1];
          const base64Data = image.replace(/^data:[^;]+;base64,/, "");
          parts.push({
            inlineData: {
              mimeType,
              data: base64Data
            }
          });
        }
      }

      // Add user message text or placeholder
      parts.push({ text: message || "Analiza esta foto adjunta con respecto a Oberá en Oferta." });

      let responseText = "";

      try {
        // Generate content using Gemini 3.5 Flash (preferred primary)
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: { parts },
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
          }
        });
        responseText = response.text || "";
      } catch (primaryError: any) {
        console.warn("Primary model 'gemini-3.5-flash' is unavailable (possibly 503 high demand). Trying resilient model 'gemini-3.1-flash-lite'...", primaryError);
        try {
          // Attempt secondary model (gemini-3.1-flash-lite)
          const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: { parts },
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.7,
            }
          });
          responseText = response.text || "";
        } catch (liteError: any) {
          console.warn("Secondary model 'gemini-3.1-flash-lite' also failed. Trying stable backup model 'gemini-flash-latest'...", liteError);
          try {
            // Attempt tertiary backup model
            const response = await ai.models.generateContent({
              model: "gemini-flash-latest",
              contents: { parts },
              config: {
                systemInstruction: systemPrompt,
                temperature: 0.7,
              }
            });
            responseText = response.text || "";
          } catch (backupError: any) {
            console.error("All Gemini API models failed. Activating robust offline/emergency local matching system...", backupError);
            const fallbackText = getLocalFallbackResponse(message);
            responseText = `🧉 **[Asistente de Respaldo Local]** ${fallbackText}`;
          }
        }
      }

      if (!responseText) {
        const fallbackText = getLocalFallbackResponse(message);
        responseText = `🧉 **[Asistente de Respaldo Local]** ${fallbackText}`;
      }

      return res.json({ text: responseText });

    } catch (error: any) {
      console.error("Error outside generation cycle in server.ts:", error);
      const fallbackText = getLocalFallbackResponse(req.body?.message || "");
      return res.json({ text: `🧉 **[Asistente de Respaldo Local]** ${fallbackText}` });
    }
  });

  // Serve static assets in production, otherwise use Vite in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
