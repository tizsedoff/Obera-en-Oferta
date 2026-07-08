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

  // API Route for Gemini Chatbot with Vision & Reasoning
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, image } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is not defined. Falling back to advanced local reasoning.");
        return res.json({
          text: "🧉 **[Modo Offline Local]** ¡Hola, che! En este momento no tengo conexión directa con la llave de la API de Gemini, pero como tu Asistente de Oberá en Oferta te puedo ayudar con toda la información sobre comercios, zonas y ofertas de Oberá. ¿Qué te gustaría consultar?",
          isFallback: true
        });
      }

      const systemPrompt = `Eres el Asistente Inteligente oficial de "Oberá en Oferta", una plataforma para comercios locales en la hermosa ciudad de Oberá, Misiones, Argentina.
Hablas con un tono muy amigable, cálido, característico del interior de Misiones (usando expresiones locales como "che", "gurí/gurisa", "mate", "tereré", "tierra colorada" de forma natural y sin exagerar). Tu objetivo es ayudar a los compradores a ahorrar dinero mediante ofertas vigentes y cupones QR, y guiar a los comerciantes locales a registrar sus negocios y potenciar las ventas locales de forma 100% gratuita.

A continuación tienes el contexto en tiempo real de comercios adheridos, zonas y ofertas activas en Oberá para que tus respuestas sean 100% precisas, verídicas y útiles. NUNCA inventes locales u ofertas que no figuren en este listado:

---
COMERCIOS ADHERIDOS (Shops):
1. "Yerba Mate & Delicias Misioneras" (Logo: 🧉) - Gastronomía - Av. Sarmiento 450, Oberá. Especialistas en yerba orgánica y panificados regionales (chipa caliente).
2. "Misiones Style Indumentaria" (Logo: 👕) - Indumentaria - Av. Libertad 120, Oberá. Camperas, buzos y ropa moderna de temporada.
3. "Supermercado El Cóndor" (Logo: 🛒) - Supermercados - Av. Italia 890, Oberá. Alimentos, harina favorita y artículos de consumo familiar.
4. "Electro Oberá" (Logo: ⚡) - Electrodomésticos - Sgto. Cabral 15, Oberá (frente a Plaza San Martín). Smart TVs, celulares y tecnología. (Actualmente cerrado pero con ofertas publicadas).
5. "Heladería Polar" (Logo: 🍦) - Gastronomía - Av. Sarmiento 210, Oberá. Helados artesanales (¡tienen sabor Crema de Mate Cocido!).
6. "Calzados Carhué" (Logo: 👟) - Indumentaria - Av. Libertad 340, Oberá. Calzado urbano y deportivo de primeras marcas.

OFERTAS ACTIVAS Y CUPONES (Offers):
1. "30% Off Combo Mate + Termo de Acero" en "Yerba Mate & Delicias Misioneras". Termo inox 1L + Yerba Mate 500g. Cupón QR: OBERAMATE-30-OFF-X921. Precio normal: $45000, Precio oferta: $31500. Vence el 10 de julio de 2026.
2. "2x1 en Kilo de Helado Artesanal" en "Heladería Polar". Kilo de helado con sabor Crema de Mate Cocido y otros. Cupón QR: POLAR-2X1-KILO-Y712. Precio normal: $12000, Precio oferta: $6000. Vence el 6 de julio de 2026.
3. "15% de Descuento en Zapatillas Deportivas" en "Calzados Carhué". Zapatillas de primera marca. Cupón QR: CARHUE-DEPOR-15-Z882. Precio normal: $55000, Precio oferta: $46750. Vence el 15 de julio de 2026.
4. "Smart TV 43\\" Full HD Smart Tech" en "Electro Oberá". Súper Oferta Flash sin cupón QR. Precio normal: $380000, Precio oferta: $299990. Vence el 5 de julio de 2026.
5. "Pack x3 Harina Favorita" en "Supermercado El Cóndor". Oferta Flash sin cupón QR, ideal para tortas fritas misioneras en días lluviosos. Precio normal: $4200, Precio oferta: $2900. Vence el 8 de julio de 2026.
6. "Campera de Abrigo de Gabardina con Corderito" en "Misiones Style Indumentaria". Oferta Flash sin cupón QR, talles S al XXL. Precio normal: $85000, Precio oferta: $59500. Vence el 7 de julio de 2026.

INFORMACIÓN EXTRA SOBRE CÓDIGOS EXCLUSIVOS:
- Existe un cupón secreto exclusivo para el centro de Oberá: CÓDIGO "OBERABOT20" para recibir un 15% de descuento adicional en compras presenciales en tiendas de la zona centro.
- Puntos de fidelidad: Si un usuario te muestra una foto de su ticket, puedes otorgar 100 puntos ficticios que se acumulan para la Fiesta Nacional del Inmigrante.

---
INSTRUCCIONES MULTIMODALES (Si te envían una imagen):
- Si el usuario te envía una imagen, analízala con detenimiento. Puede ser una foto de un producto, un ticket de compra (recibo), o una captura de pantalla de una oferta.
- Si parece un ticket o recibo: extrae los datos visibles (tienda, monto, fecha) y confírmale al usuario que has validado su compra en Oberá y que sumó 100 puntos de fidelidad de la plataforma para canjear en la Fiesta Nacional del Inmigrante.
- Si parece un calzado, ropa u otro producto: dale sugerencias de dónde conseguirlo en Oberá (por ejemplo, Calzados Carhué para zapatillas, Misiones Style para ropa) y menciónale que puede usar un cupón QR o el código secreto OBERABOT20.
- Si es cualquier otra imagen, di qué logras identificar con tu visión artificial de Gemini y cómo se conecta con la cultura de Misiones o el ahorro local de Oberá.

Mantén tus respuestas bien redactadas, amigables, con párrafos breves, emojis y un formateo en Markdown impecable para que se lea hermoso en la pantalla móvil del chat de la app.`;

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

      // Generate content using Gemini 3.5 Flash
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts },
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        }
      });

      const responseText = response.text || "¡Che! Recibí tu mensaje pero no pude procesar la respuesta en este momento. ¿Me volvés a preguntar?";
      return res.json({ text: responseText });

    } catch (error: any) {
      console.error("Gemini API Error in server.ts:", error);
      return res.status(500).json({
        error: "Internal Server Error",
        details: error.message || String(error)
      });
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
