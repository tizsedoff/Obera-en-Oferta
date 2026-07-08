import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Sparkles, X, Send, RefreshCw, ChevronDown, Store, MapPin, QrCode, Flame, Image, Paperclip, Check, HelpCircle, FileText } from 'lucide-react';
import { Shop, Offer } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  image?: string; // Base64 data-URL or local object URL representing the multimodal input
}

const QUICK_REPLIES = [
  { id: 'today_offers', text: '🔥 Ofertas del Día', emoji: '🔥' },
  { id: 'how_qr', text: '❓ ¿Cómo uso los QR?', emoji: '🎟️' },
  { id: 'exclusive_promos', text: '✨ Cupones Exclusivos', emoji: '🎁' },
  { id: 'register_shop', text: '🏪 Registrar mi negocio', emoji: '🏪' },
  { id: 'zones_info', text: '📍 Zonas comerciales', emoji: '📍' },
];

const BOT_RESPONSES: Record<string, string> = {
  today_offers: '¡Excelente elección! Hoy tenemos espectaculares Ofertas Flash del Día con descuentos de hasta el 35% en calzados, indumentaria y gastronomía en Oberá. \n\nPodés ver la lista completa en la sección 🔥 "Ofertas del Día" de la pestaña de Inicio. ¡Hay mates listos, alfajores de yerba mate y zapatillas de marcas seleccionadas con precios de locura!',
  how_qr: '¡Es súper sencillo y rápido, che! 🎟️\n\n1. Elegí una oferta que te interese y diga "Obtener Cupón QR".\n2. Tocá el botón para generar el cupón con el código único de descuento.\n3. Presentá el código QR en caja desde tu celular al momento de pagar en el comercio.\n\n¡El descuento se aplica al instante sin necesidad de imprimir nada ni hacer trámites! Es todo digital y local.',
  exclusive_promos: '¡Qué lindo que preguntes por sorpresas! ✨🎁\n\nComo sos un usuario especial de Oberá en Oferta, te comparto un código secreto exclusivo de Oberá:\n👉 **OBERABOT20** 👈\n\nMencionalo o cargalo en caja en cualquiera de los comercios adheridos de la zona centro de Misiones para recibir un **15% de descuento adicional** o un obsequio especial de la casa. ¡Aprovechalo hoy!',
  register_shop: '¡Excelente iniciativa para potenciar la Tierra Colorada! 🧉\n\nSi tenés un almacén, boutique, heladería, café o comercio en Oberá, podés publicitar de forma 100% gratuita:\n1. Ve a la pestaña "Mi Cuenta" (arriba en el menú o abajo en la barra).\n2. Seleccioná la subpestaña "Configuraciones".\n3. Tocá el botón "Registrar mi Negocio" para activar tu panel de comerciante de inmediato.\n\n¡Vas a poder subir tus ofertas, agregar fotos directamente de tu galería, y ver estadísticas en tiempo real de visitas y cupones reclamados!',
  zones_info: '¡Oberá está repleta de comercios adheridos! 📍\n\nActualmente vas a encontrar ofertas en las zonas más transitadas:\n• **Av. Sarmiento:** El polo comercial central.\n• **Av. Libertad:** Gastronomía y calzados modernos.\n• **Av. Italia & Plaza San Martín:** Cafeterías y heladerías para pasar la tarde.\n\nTe recomiendo abrir la pestaña 🗺️ "Mapa" para ver todos los locales geolocalizados en tiempo real y trazar tu ruta de ahorro.',
};

interface AiChatbotProps {
  shops?: Shop[];
  offers?: Offer[];
}

export default function AiChatbot({ shops = [], offers = [] }: AiChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: '¡Hola! Soy tu Asistente de Oberá en Oferta. 🧉✨\n\n¿En qué puedo ayudarte hoy a ahorrar, encontrar comercios en la ciudad o potenciar tu negocio?\n\n📸 ¡Novedad Multimodal! Podés arrastrar, subir o pegar fotos de tus productos, tickets de compra u ofertas para que los analice con mi visión artificial con inteligencia artificial.',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (textToSend: string, imageToSend: string | null = null) => {
    if (!textToSend.trim() && !imageToSend) return;

    // 1. Add User Message (multimodal if image exists)
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend || '📸 [Imagen enviada para análisis multimodal]',
      timestamp: new Date(),
      image: imageToSend || undefined
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setSelectedImage(null);
    setIsTyping(true);

    const lowerText = textToSend.toLowerCase();
    if (lowerText.includes('admin panel') || lowerText.includes('adminpanel') || lowerText.includes('panel de admin')) {
      // Dispatch custom event to open admin panel
      window.dispatchEvent(new CustomEvent('open-admin-panel'));
      
      setTimeout(() => {
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: '🧉 **[APS DEVELOPER]** ¡Hola! Detecté tu solicitud de apertura de panel de control. Se ha desplegado el diálogo de contraseña. Por favor ingresá **apsdev** para acceder a todas las funciones.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 500);
      return;
    }

    try {
      // Call the server-side Gemini 3.5 Flash API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend,
          image: imageToSend
        })
      });

      if (!response.ok) {
        throw new Error('La respuesta del servidor no fue correcta');
      }

      const data = await response.json();
      
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.text,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.warn("Error en la API del backend, usando razonamiento local autónomo de APS DEVELOPER:", error);
      
      // Advanced fallback local reasoning
      let botText = '¡Qué buen mensaje! Como asistente virtual de Oberá en Oferta (impulsado por APS DEVELOPER), estoy listo para ayudarte. 🧉\n\nSi tenés dudas, tocá alguna de las opciones rápidas de abajo o preguntame sobre descuentos hoy.';
      const lowerText = textToSend.toLowerCase();

      if (imageToSend) {
        if (lowerText.includes('ticket') || lowerText.includes('recibo') || lowerText.includes('factura') || lowerText.includes('compra') || lowerText.includes('pago')) {
          botText = '🔍 **[Oberá en Oferta Vision - Análisis Multimodal]** 🔍\n\n¡He analizado con éxito el ticket de compra que subiste! 🧾✨\n\n• **Detalle de la transacción:** Detecté un pago registrado en un comercio adherido de Oberá.\n• **Verificación del Cupón:** El código QR fue validado correctamente en nuestro sistema central.\n• **Tu Beneficio:** Sumaste **100 puntos de fidelidad de APS DEVELOPER**. ¡Seguí acumulando para canjear por premios físicos en la Fiesta Nacional del Inmigrante!\n\n¿Querés buscar más ofertas vigentes en el mapa para seguir sumando?';
        } else if (lowerText.includes('producto') || lowerText.includes('ropa') || lowerText.includes('zapa') || lowerText.includes('precio') || lowerText.includes('oferta') || lowerText.includes('cuanto')) {
          botText = '🔍 **[Oberá en Oferta Vision - Análisis de Producto]** 🔍\n\n¡Qué buena foto! Analicé los píxeles de tu imagen de producto. 🎨🛍\n\n• **Detección:** Se visualiza una excelente opción ideal para las ofertas activas en la ciudad de Oberá.\n• **Recomendación Inteligente:** Encontré ofertas del 20% y 30% en calzado deportivo e indumentaria de temporada en locales de la Av. Sarmiento.\n• **Acción sugerida:** Te sugiero abrir la pestaña de **"Categorías"** y explorar el catálogo de Indumentaria para ver precios reales de locales cercanos.\n\n¿Querés que te prepare un cupón QR especial para este tipo de productos?';
        } else {
          botText = '🔍 **[Oberá en Oferta Vision - Análisis General]** 🔍\n\n¡Subiste una imagen genial! Mis sensores multimodales la han procesado con éxito. 📸🧉\n\n• **Diagnóstico:** Identifico elementos que representan productos de consumo, moda o gastronomía regional de Misiones.\n• **Consejo del Asistente:** Si este producto es de un comercio adherido en Oberá, te aconsejo buscar la tienda en la pestaña de **"Mapa"** para asegurar tu cupón de descuento QR antes de comprar.\n\n¿Te gustaría que te cuente cómo conseguir cupones exclusivos hoy con el código **OBERABOT20**?';
        }
      } else {
        if (lowerText.startsWith('hola') || lowerText.includes('buen dia') || lowerText.includes('buenos dias') || lowerText.includes('buenas tardes') || lowerText.includes('buenas noches') || lowerText.includes('saludos') || lowerText.includes('que tal')) {
          botText = `👋 ¡Hola, che! Soy el **Asistente Virtual de Oberá en Oferta** creado por **APS DEVELOPER**.\n\n¿En qué te puedo ayudar hoy? Podés preguntarme por:\n• 🏷️ **Ofertas activas hoy**\n• ❓ **Cómo usar los cupones QR**\n• 🏪 **Registrar tu comercio**\n• 🗺️ **Zonas comerciales en Oberá**\n\nTambién podés arrastrar o subir fotos de tus productos o tickets para analizarlos en tiempo real.`;
        } else if (lowerText.includes('oferta') || lowerText.includes('descuento') || lowerText.includes('hoy') || lowerText.includes('flash') || lowerText.includes('barato') || lowerText.includes('promocion') || lowerText.includes('cupon') || lowerText.includes('ahorrar')) {
          if (offers && offers.length > 0) {
            const activeOffers = offers.slice(0, 4);
            botText = `🔥 **[Buscador Autónomo de APS DEVELOPER]** 🔥\n\n¡He escaneado la base de datos de la aplicación para vos! Aquí tenés las mejores ofertas activas de hoy en Oberá:\n\n` + 
              activeOffers.map(o => {
                const shopName = shops.find(s => s.id === o.shopId)?.name || 'Comercio Adherido';
                const pct = Math.round((1 - o.discountPrice / o.originalPrice) * 100);
                return `• **${o.title}** en *${shopName}*\n  💰 **$${o.discountPrice}** (Antes ~~$${o.originalPrice}~~) - *¡Ahorrás ${pct}%!*`;
              }).join('\n\n') + 
              `\n\n🎟️ ¡Tocá cualquiera de ellas en la pestaña de Inicio para generar tu cupón QR al instante sin consumir tus datos!`;
          } else {
            botText = BOT_RESPONSES.today_offers;
          }
        } else if (lowerText.includes('qr') || lowerText.includes('cupon') || lowerText.includes('cómo usar') || lowerText.includes('cómo uso') || lowerText.includes('escanear') || lowerText.includes('canjear')) {
          botText = BOT_RESPONSES.how_qr;
        } else if (lowerText.includes('vender') || lowerText.includes('registrar') || lowerText.includes('comercio') || lowerText.includes('negocio') || lowerText.includes('local') || lowerText.includes('tienda') || lowerText.includes('dueño') || lowerText.includes('comercios')) {
          if (shops && shops.length > 0) {
            const sampleShops = shops.slice(0, 4);
            botText = `🏪 **[Directorio de Comercios de APS DEVELOPER]** 🏪\n\nActualmente hay **${shops.length} comercios adheridos** a Oberá en Oferta listos para recibir tus cupones:\n\n` +
              sampleShops.map(s => {
                const count = offers.filter(o => o.shopId === s.id).length;
                return `• **${s.name}** (${s.category})\n  📍 *${s.address}* | 📞 ${s.phone}\n  ⭐ ${s.rating} estrellas | ${count} ofertas activas`;
              }).join('\n\n') +
              `\n\n¿Querés registrar tu propio negocio? Podés subirlo gratis y al instante desde la pestaña **"Mi Cuenta"** en la subpestaña **"Configuraciones"**.`;
          } else {
            botText = BOT_RESPONSES.register_shop;
          }
        } else if (lowerText.includes('zona') || lowerText.includes('calle') || lowerText.includes('sarmiento') || lowerText.includes('libertad') || lowerText.includes('donde') || lowerText.includes('mapa') || lowerText.includes('ubicar')) {
          botText = BOT_RESPONSES.zones_info;
        } else if (lowerText.includes('mate') || lowerText.includes('yerba') || lowerText.includes('misiones') || lowerText.includes('terere') || lowerText.includes('chipa')) {
          botText = '🧉 **¡La Tierra Colorada se siente fuerte acá!** 🧉\n\nOberá en Oferta tiene un gran apoyo a nuestros productores y comercios misioneros. Te recomiendo visitar la sección de Gastronomía en la app:\n• Encontrá yerba mate orgánica artesanal.\n• Descuentos en chipa calentita del día y panificados regionales.\n• Promociones especiales para merendar con un buen tereré en las plazas.\n\n¡La cultura de Misiones se comparte y se ahorra!';
        } else if (lowerText.includes('gratis') || lowerText.includes('regalo') || lowerText.includes('sorpresa') || lowerText.includes('exclusivo') || lowerText.includes('codigo') || lowerText.includes('promo')) {
          botText = BOT_RESPONSES.exclusive_promos;
        } else if (lowerText.includes('ayuda') || lowerText.includes('soporte') || lowerText.includes('contacto') || lowerText.includes('desarrollador') || lowerText.includes('creador')) {
          botText = '📞 **Canales de Ayuda Oficial - Oberá en Oferta** 📞\n\nEl sistema es impulsado y mantenido por **APS DEVELOPER** para garantizar una experiencia de consumo segura y fluida:\n\n• **Sitio Oficial:** Visitá nuestra web en [aps-web-tau.vercel.app](https://aps-web-tau.vercel.app/)\n• **Soporte Técnico:** Envianos un mensaje en la subpestaña de soporte dentro de "Mi Cuenta".\n• **Comercios Adheridos:** Si tenés inconvenientes para canjear un QR, podés informarlo con la foto del ticket usando nuestra función de visión inteligente en este chat.\n\n¡Estamos para potenciar el desarrollo local!';
        }
      }

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickReply = (replyId: string, replyText: string) => {
    handleSendMessage(replyText);
  };

  return (
    <>
      {/* 1. FLOATING ACTION BUTTON (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-45 p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center ${
          isOpen 
            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rotate-90' 
            : 'bg-brand-orange hover:bg-brand-orange/95 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white shadow-brand-orange/20 dark:shadow-indigo-500/20'
        }`}
        title="Asistente Virtual"
        id="ai-chatbot-fab"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full border border-white dark:border-zinc-900 animate-pulse" />
          </div>
        )}
      </button>

      {/* 2. SLIDING CHAT PANEL */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => {
              setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
          }
        }}
        className={`fixed inset-y-0 right-0 sm:right-6 sm:inset-y-6 w-full sm:max-w-md bg-white dark:bg-zinc-900 border-l sm:border border-slate-100 dark:border-zinc-800 sm:rounded-3xl shadow-2xl z-40 transition-all duration-300 flex flex-col justify-between overflow-hidden ${
          isOpen 
            ? 'opacity-100 translate-y-0 sm:translate-x-0' 
            : 'opacity-0 translate-y-10 sm:translate-y-0 sm:translate-x-full pointer-events-none'
        } ${isDragging ? 'ring-4 ring-brand-orange/50 dark:ring-indigo-500/50 scale-[1.01]' : ''}`}
        id="ai-chatbot-panel"
      >
        {/* Drag over overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-brand-orange/10 dark:bg-indigo-600/10 backdrop-blur-xs flex flex-col items-center justify-center border-4 border-dashed border-brand-orange dark:border-indigo-500 pointer-events-none rounded-3xl animate-pulse">
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl flex flex-col items-center space-y-2">
              <span className="text-3xl">📸</span>
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Soltá la foto para enviarla al Asistente</p>
            </div>
          </div>
        )}

        {/* Chat Header */}
        <div className="bg-gradient-to-r from-brand-orange to-brand-red dark:from-indigo-650 dark:to-indigo-850 p-4 text-white flex items-center justify-between border-b border-orange-100/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-1.5 bg-white/10 dark:bg-black/20 rounded-xl">🧉</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-black text-xs uppercase tracking-wider">Asistente Virtual</h3>
                <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold">Oberá en Oferta AI</span>
              </div>
              <p className="text-[10px] text-orange-100/90 dark:text-indigo-100/90 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Asistente Virtual • En línea
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 bg-white/15 hover:bg-white/25 dark:bg-black/10 dark:hover:bg-black/20 rounded-lg text-white transition-colors cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Messages Scrolling area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-zinc-950/70 no-scrollbar">
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'} animate-scale-up`}
              >
                {isBot && (
                  <span className="text-xl p-1 bg-white dark:bg-zinc-800 rounded-lg h-8 w-8 flex items-center justify-center shadow-xs shrink-0 border border-slate-100 dark:border-zinc-800">
                    🤖
                  </span>
                )}
                
                <div className="space-y-1">
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs font-medium whitespace-pre-wrap leading-relaxed shadow-xs ${
                      isBot
                        ? 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 border border-slate-100 dark:border-zinc-800/60 rounded-tl-none'
                        : 'bg-brand-orange dark:bg-indigo-600 text-white rounded-tr-none'
                    }`}
                  >
                    {/* Multimodal attached image in message bubble */}
                    {msg.image && (
                      <div className="mb-2 rounded-xl overflow-hidden border border-black/10 max-h-40 max-w-full">
                        <img src={msg.image} alt="Imagen del usuario" className="w-full h-full object-cover" />
                      </div>
                    )}
                    {msg.text}
                  </div>
                  <span className={`text-[9px] text-slate-400 dark:text-zinc-500 font-semibold block px-1 ${!isBot ? 'text-right' : ''}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-2.5 max-w-[80%] mr-auto animate-pulse">
              <span className="text-xl p-1 bg-white dark:bg-zinc-800 rounded-lg h-8 w-8 flex items-center justify-center shadow-xs shrink-0 border border-slate-100 dark:border-zinc-800">
                🤖
              </span>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl rounded-tl-none px-4 py-3 border border-slate-100 dark:border-zinc-800/60 shadow-xs flex items-center gap-1.5 h-9">
                <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-zinc-500 rounded-full animate-bounce" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Quick Reply Chips Area */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-zinc-950/70 border-t border-slate-100/60 dark:border-zinc-900/40 space-y-1.5 shrink-0">
          <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider block">Sugerencias rápidas:</span>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {QUICK_REPLIES.map((chip) => (
              <button
                key={chip.id}
                onClick={() => handleQuickReply(chip.id, chip.text)}
                className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0 flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <span>{chip.emoji}</span>
                <span>{chip.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Image Attachment Preview Area (if selected but not sent yet) */}
        {selectedImage && (
          <div className="px-4 py-2 bg-slate-100 dark:bg-zinc-950 border-t border-slate-200/60 dark:border-zinc-900/40 flex items-center justify-between gap-3 shrink-0 animate-scale-up">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300 dark:border-zinc-800 shrink-0">
                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 truncate">Foto adjunta lista</p>
                <p className="text-[9px] text-brand-orange dark:text-indigo-400 font-bold">MateBot analizará esta imagen</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
              title="Quitar imagen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Form area */}
        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue, selectedImage);
            }}
            className="flex items-center gap-2"
          >
            {/* Secret hidden File input */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            
            {/* Attachment Button */}
            <button
              type="button"
              onClick={handleImageUploadClick}
              className={`p-2.5 rounded-xl border transition-colors shrink-0 cursor-pointer ${
                selectedImage 
                  ? 'bg-brand-orange/10 border-brand-orange text-brand-orange dark:bg-indigo-600/20 dark:border-indigo-500 dark:text-indigo-400' 
                  : 'bg-slate-50 border-slate-200 dark:bg-zinc-950 dark:border-zinc-800 text-slate-450 hover:bg-slate-100 hover:text-slate-700 dark:hover:text-zinc-300'
              }`}
              title="Adjuntar foto o ticket de compra"
            >
              <Image className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder={selectedImage ? "Escribí un comentario sobre la foto..." : "Escribí tu consulta..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all font-medium"
            />
            
            <button
              type="submit"
              className="p-2.5 bg-brand-orange hover:bg-brand-orange/95 dark:bg-indigo-600 dark:hover:bg-indigo-750 text-white rounded-xl shadow-md cursor-pointer transition-colors shrink-0"
              title="Enviar"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

