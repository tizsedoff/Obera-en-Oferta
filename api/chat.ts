import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Fallback initial data locally for bulletproof execution
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
3.  **Calzados Carhué** 👟: 15% de descuento en zapatillas deportivas ($46.750).
4.  **Electro Oberá** ⚡: Smart TV 43" ($299.990).
5.  **Supermercado El Cóndor** 🛒: Harina pack x3 ($2.900).
6.  **Misiones Style Indumentaria** 👕: Campera con corderito ($59.500).

Decime de qué tenés ganas de hablar o si querés saber más detalles sobre alguna promoción o comercio de nuestra hermosa ciudad, ¡chamigo!`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { message, image } = req.body;

    // Load credentials
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || "";
    
    let supabase: any = null;
    if (supabaseUrl && supabaseServiceKey) {
      try {
        supabase = createClient(supabaseUrl, supabaseServiceKey);
      } catch (err) {
        console.error("Failed to initialize Supabase inside Serverless Handler:", err);
      }
    }

    // Load active shops and offers from database or local fallbacks
    let currentShops: any[] = [];
    let currentOffers: any[] = [];

    if (supabase) {
      try {
        const { data: dbShops, error: shopErr } = await supabase.from("negocios").select("*");
        if (!shopErr && dbShops && dbShops.length > 0) {
          currentShops = dbShops.map(mapDbToShop);
        } else {
          currentShops = INITIAL_SHOPS.map(s => ({
            ...s,
            id: toUUID(s.id, "shop")
          }));
        }

        const { data: dbOffers, error: offerErr } = await supabase.from("ofertas").select("*");
        if (!offerErr && dbOffers && dbOffers.length > 0) {
          currentOffers = dbOffers.map((d: any) => mapDbToOffer(d, currentShops));
        } else {
          currentOffers = INITIAL_OFFERS.map(o => ({
            ...o,
            id: toUUID(o.id, "offer"),
            shopId: toUUID(o.shopId, "shop")
          }));
        }
      } catch (dbEx) {
        console.error("Failed to fetch shops/offers in serverless chat handler:", dbEx);
        currentShops = INITIAL_SHOPS.map(s => ({ ...s, id: toUUID(s.id, "shop") }));
        currentOffers = INITIAL_OFFERS.map(o => ({ ...o, id: toUUID(o.id, "offer"), shopId: toUUID(o.shopId, "shop") }));
      }
    } else {
      currentShops = INITIAL_SHOPS.map(s => ({ ...s, id: toUUID(s.id, "shop") }));
      currentOffers = INITIAL_OFFERS.map(o => ({ ...o, id: toUUID(o.id, "offer"), shopId: toUUID(o.shopId, "shop") }));
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "YOUR_API_KEY") {
      const fallbackText = getLocalFallbackResponse(message);
      return res.status(200).json({
        text: `🧉 **[Asistente Local Serverless]** ${fallbackText}`,
        isFallback: true
      });
    }

    // Format dynamic database content for live prompt
    const liveShopsText = currentShops.map((s) => 
      `- "${s.name}" (Logo: ${s.logo}) - Categoría: ${s.category}, Dirección: ${s.address}, Abierto: ${s.isOpen ? 'Sí' : 'No'}, Rating: ${s.rating}.`
    ).join("\n");

    const liveOffersText = currentOffers.map((o) => 
      `- "${o.title}" en "${o.shopName}" (${o.category}). ${o.description}. Cupón QR: ${o.hasQrCoupon ? (o.qrCodeValue || 'Sí') : 'No'}. Precio Normal: $${o.originalPrice}, Precio Oferta: $${o.discountPrice}. Vence: ${o.expiryDate}. Estado: ${o.usado ? 'Ya fue canjeado/usado por alguien' : 'Disponible y activo'}`
    ).join("\n");

    const systemPrompt = `Eres el Asistente Inteligente oficial de "Oberá en Oferta", una plataforma para comercios locales en la hermosa ciudad de Oberá, Misiones, Argentina.
Hablas con un tono muy amigable, cálido, característico del interior de Misiones (usando expresiones locales como "che", "gurí/gurisa", "mate", "tereré", "tierra colorada" de forma natural y sin exagerar). Tu objetivo es ayudar a los compradores a ahorrar dinero mediante ofertas vigentes y cupones QR, y guiar a los comerciantes locales a registrar sus negocios y potenciar las ventas locales de forma 100% gratuita.

A continuación tienes el contexto EN TIEMPO REAL cargado dinámicamente desde Supabase de los comercios adheridos y las ofertas activas en Oberá para que tus respuestas sean 100% precisas, verídicas y útiles. NUNCA inventes locales u ofertas que no figuren en este listado. NUNCA inventes cupones, códigos secretos, descuentos adicionales, puntos de fidelidad ni ningún beneficio que no esté explícitamente en este listado o en estas instrucciones — solo existen las ofertas y cupones QR que figuran abajo:

---
COMERCIOS ADHERIDOS (Shops):
${liveShopsText}

OFERTAS ACTIVAS Y CUPONES (Offers):
${liveOffersText}

---
REGISTRO DE COMERCIOS Y CUENTAS:
- Si un usuario pregunta cómo crear una cuenta, cómo registrar su negocio, cómo sumarse como comercio, o cómo empezar a publicar ofertas, respondé SIEMPRE con el link directo que ya abre en la pantalla de registro: https://obera-en-oferta.vercel.app/?accion=registrarse&tipo=comercio
- Si en cambio pregunta cómo crear una cuenta de cliente para ver ofertas (sin tener un comercio propio), usá este otro link: https://obera-en-oferta.vercel.app/?accion=registrarse&tipo=cliente
- Aclarále que el link ya lo va a abrir directamente en el formulario de registro correspondiente, sin pasos extra.
- No expliques pasos técnicos de más ni inventes formularios o campos que no existan; con el link alcanza.

---
INSTRUCCIONES MULTIMODALES (Si te envían una imagen):
- Si el usuario te envía una imagen, analízala con detenimiento. Puede ser una foto de un producto, un ticket de compra (recibo), o una captura de pantalla de una oferta.
- Si parece un calzado, ropa u otro producto: dale sugerencias de dónde conseguirlo en Oberá según los comercios reales listados arriba, y recordále que puede reclamar el cupón QR de la oferta correspondiente si existe.
- Si es cualquier otra imagen, di qué logras identificar con tu visión artificial de Gemini y cómo se conecta con la cultura de Misiones o el ahorro local de Oberá.

Mantén tus respuestas bien redactadas, amigables, con párrafos breves, emojis y un formateo en Markdown impecable para que se lee hermoso en la pantalla móvil del chat de la app.`;

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

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
      console.warn("Primary model 'gemini-3.5-flash' is unavailable. Trying gemini-3.1-flash-lite...", primaryError);
      try {
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
        console.warn("Secondary model 'gemini-3.1-flash-lite' also failed. Trying stable backup model gemini-flash-latest...", liteError);
        try {
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
          responseText = `🧉 **[Asistente de Respaldo Local Serverless]** ${fallbackText}`;
        }
      }
    }

    if (!responseText) {
      const fallbackText = getLocalFallbackResponse(message);
      responseText = `🧉 **[Asistente de Respaldo Local Serverless]** ${fallbackText}`;
    }

    return res.status(200).json({ text: responseText });
  } catch (error: any) {
    console.error("Error in serverless API handler:", error);
    const fallbackText = getLocalFallbackResponse(req.body?.message || "");
    return res.status(200).json({ text: `🧉 **[Asistente de Respaldo Local Serverless]** ${fallbackText}` });
  }
}