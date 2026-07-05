import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Sparkles, X, Send, RefreshCw, ChevronDown, Store, MapPin, QrCode, Flame } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

const QUICK_REPLIES = [
  { id: 'today_offers', text: '🔥 Ofertas del Día', emoji: '🔥' },
  { id: 'how_qr', text: '❓ ¿Cómo uso los QR?', emoji: '🎟️' },
  { id: 'register_shop', text: '🏪 Registrar mi negocio', emoji: '🏪' },
  { id: 'zones_info', text: '📍 Zonas comerciales', emoji: '📍' },
];

const BOT_RESPONSES: Record<string, string> = {
  today_offers: '¡Excelente elección! Hoy tenemos espectaculares Ofertas Flash del Día con descuentos de hasta el 35% en calzados, indumentaria y gastronomía en Oberá. Podés ver la lista completa en la sección 🔥 "Ofertas del Día" de la pestaña de Inicio.',
  how_qr: '¡Es súper sencillo y rápido! 🎟️\n\n1. Elegí una oferta que diga "Obtener Cupón QR".\n2. Tocá el botón para generar el cupón con el código único.\n3. Presentá el código QR en caja desde tu celular al momento de pagar.\n\n¡El descuento se aplica al instante sin necesidad de imprimir nada!',
  register_shop: '¡Excelente iniciativa para potenciar la Tierra Colorada! 🧉\n\nSi tenés un local en Oberá, podés publicitar de forma 100% gratuita:\n1. Ve a la pestaña "Mi Cuenta" (arriba en el menú o abajo en la barra).\n2. Seleccioná la subpestaña "Configuraciones".\n3. Tocá el botón "Registrar mi Negocio" para activar tu panel de comerciante de inmediato.',
  zones_info: '¡Oberá está repleta de comercios adheridos! 📍\n\nActualmente vas a encontrar ofertas en las zonas más transitadas: Av. Sarmiento, Av. Libertad, Av. Italia y la zona de Plaza San Martín. Te recomiendo abrir la pestaña 🗺️ "Mapa" para ver todos los locales geolocalizados en tiempo real.',
};

export default function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: '¡Hola! Soy MateBot, tu asistente de Oberá en Oferta. 🧉✨\n\n¿En qué puedo ayudarte hoy a ahorrar o a potenciar tu negocio en la ciudad?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;

    // 1. Add User Message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // 2. Simulate Bot Typing & Response
    setTimeout(() => {
      let botText = '¡Qué buena pregunta! Como asistente de Oberá en Oferta, te recomiendo revisar la sección de Inicio para enterarte de los últimos descuentos en el centro, o escribirme una de las consultas de ayuda rápida. 🧉';
      
      // Basic smart matching
      const lowerText = textToSend.toLowerCase();
      if (lowerText.includes('oferta') || lowerText.includes('descuento') || lowerText.includes('hoy') || lowerText.includes('flash')) {
        botText = BOT_RESPONSES.today_offers;
      } else if (lowerText.includes('qr') || lowerText.includes('cupon') || lowerText.includes('cómo usar') || lowerText.includes('cómo uso')) {
        botText = BOT_RESPONSES.how_qr;
      } else if (lowerText.includes('vender') || lowerText.includes('registrar') || lowerText.includes('comercio') || lowerText.includes('negocio') || lowerText.includes('local')) {
        botText = BOT_RESPONSES.register_shop;
      } else if (lowerText.includes('zona') || lowerText.includes('calle') || lowerText.includes('sarmiento') || lowerText.includes('libertad') || lowerText.includes('donde') || lowerText.includes('mapa')) {
        botText = BOT_RESPONSES.zones_info;
      }

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleQuickReply = (replyId: string, replyText: string) => {
    // 1. Add User message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: replyText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // 2. Reply with accurate matched answer
    setTimeout(() => {
      const botText = BOT_RESPONSES[replyId] || BOT_RESPONSES.today_offers;
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
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
        className={`fixed inset-y-0 right-0 sm:right-6 sm:inset-y-6 w-full sm:max-w-md bg-white dark:bg-zinc-900 border-l sm:border border-slate-100 dark:border-zinc-800 sm:rounded-3xl shadow-2xl z-40 transition-all duration-300 flex flex-col justify-between overflow-hidden ${
          isOpen 
            ? 'opacity-100 translate-y-0 sm:translate-x-0' 
            : 'opacity-0 translate-y-10 sm:translate-y-0 sm:translate-x-full pointer-events-none'
        }`}
        id="ai-chatbot-panel"
      >
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-brand-orange to-brand-red dark:from-indigo-650 dark:to-indigo-850 p-4 text-white flex items-center justify-between border-b border-orange-100/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-1.5 bg-white/10 dark:bg-black/20 rounded-xl">🧉</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-black text-xs uppercase tracking-wider">MateBot</h3>
                <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold">AI</span>
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
                className={`flex gap-2.5 max-w-[85%] ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
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
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-semibold block px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-2.5 max-w-[80%] mr-auto">
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
          <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider block">Preguntas Frecuentes:</span>
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

        {/* Input Form area */}
        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Escribí tu consulta..."
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
