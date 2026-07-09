import { createClient } from "@supabase/supabase-js";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

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

  // Initialize Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

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

*   *Tip Secreto:* Usá el código \`OBERABOT20\` para un 15% extra en el centro.
¿De cuál de estos locales u ofertas te gustaría conocer más detalles, gurí?`;
  }

  // API Route for Gemini Chatbot with Vision & Reasoning
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, image } = req.body;

      // Consultar ofertas activas en Supabase para armar el contexto dinámico
      const { data: ofertas, error: ofertasError } = await supabase
        .from("ofertas")
        .select(`
          titulo, descripcion, precio_original, precio_oferta, categoria, fecha_fin,
          negocios ( nombre, categoria, direccion, telefono )
        `)
        .eq("activo", true)
        .or(`fecha_fin.is.null,fecha_fin.gt.${new Date().toISOString()}`);

      if (ofertasError) {
        console.error("Error consultando Supabase:", ofertasError);
      }

      const contextoTexto = (ofertas || []).map((o: any) =>
        `"${o.titulo}" en "${o.negocios?.nombre}" (${o.negocios?.direccion}). ${o.descripcion}. Precio normal: $${o.precio_original}, oferta: $${o.precio_oferta}. Vence: ${o.fecha_fin ?? "sin vencimiento"}.`
      ).join("\n");

      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "YOUR_API_KEY") {
        console.warn("GEMINI_API_KEY is not defined. Falling back to advanced local reasoning.");
        const fallbackText = getLocalFallbackResponse(message);
        return res.json({
          text: `🧉 **[Asistente Local]** ${fallbackText}`,
          isFallback: true
        });
      }

      const systemPrompt = `Eres el Asistente Inteligente oficial de "Oberá en Oferta", una plataforma para comercios locales en la hermosa ciudad de Oberá, Misiones, Argentina.
Hablas con un tono muy amigable, cálido, característico del interior de Misiones (usando expresiones locales como "che", "gurí/gurisa", "mate", "tereré", "tierra colorada" de forma natural y sin exagerar). Tu objetivo es ayudar a los compradores a ahorrar dinero mediante ofertas vigentes y cupones QR, y guiar a los comerciantes locales a registrar sus negocios y potenciar las ventas locales de forma 100% gratuita.

A continuación tienes el contexto en tiempo real de comercios adheridos y ofertas activas en Oberá para que tus respuestas sean 100% precisas, verídicas y útiles. NUNCA inventes locales u ofertas que no figuren en este listado:

---
COMERCIOS Y OFERTAS ACTIVOS HOY EN OBERÁ:
${contextoTexto || "No hay ofertas activas en este momento."}
---

INSTRUCCIONES MULTIMODALES (Si te envían una imagen):
- Si el usuario te envía una imagen, analízala con detenimiento. Puede ser una foto de un producto, un ticket de compra (recibo), o una captura de pantalla de una oferta.
- Si parece un ticket o recibo: extrae los datos visibles (tienda, monto, fecha) y confírmale al usuario que has validado su compra en Oberá.
- Si parece un calzado, ropa u otro producto: dale sugerencias de dónde conseguirlo en Oberá según el listado de comercios activos de arriba.
- Si es cualquier otra imagen, di qué logras identificar con tu visión artificial de Gemini y cómo se conecta con la cultura de Misiones o el ahorro local de Oberá.

Mantén tus respuestas bien redactadas, amigables, con párrafos breves, emojis y un formateo en Markdown impecable para que se lea hermoso en la pantalla móvil del chat de la app.`;

      const parts: any[] = [];

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
        console.warn("Primary model 'gemini-3.5-flash' is unavailable. Trying 'gemini-3.1-flash-lite'...", primaryError);
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
          console.warn("Secondary model also failed. Trying 'gemini-flash-latest'...", liteError);
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
            console.error("All Gemini API models failed. Activating local fallback...", backupError);
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