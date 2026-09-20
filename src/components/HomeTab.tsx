import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Heart, 
  Bookmark, 
  Share2, 
  QrCode, 
  MapPin, 
  Clock, 
  Search, 
  X, 
  Sun, 
  Moon, 
  Flame, 
  Sparkles, 
  Map, 
  Store,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Offer, Shop, Category } from '../types';
import ShopLogo from './ShopLogo';

interface HomeTabProps {
  offers: Offer[];
  shops: Shop[];
  categories: Category[];
  onOpenCoupon: (offer: Offer) => void;
  onOpenOffer: (offer: Offer) => void;
  onSelectCategoryStory: (category: string) => void;
  onSelectShopOnMap: (shopId: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export default function HomeTab({
  offers,
  shops,
  categories,
  onOpenCoupon,
  onOpenOffer,
  onSelectCategoryStory,
  onSelectShopOnMap,
  darkMode,
  onToggleDarkMode,
  activeTab,
  setActiveTab
}: HomeTabProps) {
  // Localized states for likes, bookmarks, and counts
  const [likedOffers, setLikedOffers] = useState<{ [key: string]: boolean }>(() => {
    const saved = localStorage.getItem('obera_feed_likes');
    return saved ? JSON.parse(saved) : {};
  });

  const [bookmarkedOffers, setBookmarkedOffers] = useState<{ [key: string]: boolean }>(() => {
    const saved = localStorage.getItem('obera_feed_bookmarks');
    return saved ? JSON.parse(saved) : {};
  });

  // Keep a map of custom likes count for each offer to simulate social traction
  const [likesCount, setLikesCount] = useState<{ [key: string]: number }>(() => {
    const counts: { [key: string]: number } = {};
    offers.forEach(o => {
      // Seed a realistic number of likes based on views
      counts[o.id] = Math.floor(o.views * 1.5) + 24;
    });
    return counts;
  });

  // Track double tap visual hearts popping
  const [poppingHearts, setPoppingHearts] = useState<{ id: string; x: number; y: number; time: number }[]>([]);

  // Search and Category filters
  const [feedSearch, setFeedSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Save interactions to localStorage
  useEffect(() => {
    localStorage.setItem('obera_feed_likes', JSON.stringify(likedOffers));
  }, [likedOffers]);

  useEffect(() => {
    localStorage.setItem('obera_feed_bookmarks', JSON.stringify(bookmarkedOffers));
  }, [bookmarkedOffers]);

  // Handle double tap or click to like
  const lastTapRef = useRef<{ [key: string]: number }>({});
  
  const handleCardTouchOrClick = (offerId: string, e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[offerId] || 0;
    const delay = 300; // ms

    if (now - lastTap < delay) {
      // Double tap triggered!
      handleLikeToggle(offerId, true);
      
      // Get click position relative to the target card
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Add a popping heart
      const newHeart = {
        id: `${offerId}-${now}`,
        x,
        y,
        time: now
      };
      setPoppingHearts(prev => [...prev, newHeart]);

      // Remove after animation completes
      setTimeout(() => {
        setPoppingHearts(prev => prev.filter(h => h.id !== newHeart.id));
      }, 800);
    }
    
    lastTapRef.current[offerId] = now;
  };

  const handleLikeToggle = (offerId: string, forceLike = false) => {
    setLikedOffers(prev => {
      const isLiked = prev[offerId];
      const nextState = forceLike ? true : !isLiked;
      
      // Update the count accordingly
      if (nextState !== isLiked) {
        setLikesCount(prevCount => ({
          ...prevCount,
          [offerId]: prevCount[offerId] + (nextState ? 1 : -1)
        }));
      }
      
      return {
        ...prev,
        [offerId]: nextState
      };
    });
  };

  const handleBookmarkToggle = (offerId: string) => {
    setBookmarkedOffers(prev => ({
      ...prev,
      [offerId]: !prev[offerId]
    }));
  };

  // Filter offers based on search and category
  const filteredOffers = useMemo(() => {
    return offers.filter(o => {
      const matchesSearch = feedSearch === '' || 
        o.title.toLowerCase().includes(feedSearch.toLowerCase()) ||
        o.description.toLowerCase().includes(feedSearch.toLowerCase()) ||
        o.shopName.toLowerCase().includes(feedSearch.toLowerCase()) ||
        o.category.toLowerCase().includes(feedSearch.toLowerCase());

      const matchesCategory = selectedCategoryFilter === 'all' || 
        o.category.toLowerCase() === selectedCategoryFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [offers, feedSearch, selectedCategoryFilter]);

  // Construct custom WhatsApp message
  const getWhatsAppShareUrl = (offer: Offer) => {
    const message = `¡Che, mirá este ofertón imperdible en Oberá en Oferta! 🔥🧉\n\n🛍️ *${offer.title}*\n🏪 Comercio: *${offer.shopName}*\n💵 Precio: *$${offer.discountPrice.toLocaleString('es-AR')}* (Antes ~$$${offer.originalPrice.toLocaleString('es-AR')}~)\n\n🎁 ¡Reclamá tu cupón QR de descuento GRATIS desde la app acá! 👇\nhttps://obera-en-oferta.vercel.app/`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="relative w-full flex justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 min-h-[calc(100vh-56px)] min-h-[calc(100dvh-56px)] md:min-h-[calc(100vh-80px)] md:min-h-[calc(100dvh-80px)] md:py-2 overflow-hidden pb-[calc(3.5rem+var(--safe-bottom))] md:pb-0">
      
      {/* Outer Phone Mockup wrapper on Desktop, full screen on Mobile */}
      <div className="relative w-full max-w-md md:max-w-3xl lg:max-w-4xl min-h-0 h-full bg-black shadow-2xl md:rounded-3xl overflow-hidden border border-zinc-800/20 flex flex-col justify-between">
        
        {/* FLOATING TOP OVERLAY HEADER - STATIC ABOVE SCROLLING CARDS */}
        <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4 flex flex-col gap-3">
          
          {/* Logo row */}
          <div className="flex items-center justify-between md:hidden">
            <div className="flex items-center gap-2 select-none">
              <span className="text-2xl filter drop-shadow-md">🧉</span>
              <div className="flex flex-col leading-none">
                <span className="font-display font-black text-sm tracking-wide text-white uppercase drop-shadow-md">
                  OBERÁ
                </span>
                <span className="font-sans font-bold text-[9px] tracking-[0.16em] text-emerald-400 mt-0.5 uppercase drop-shadow-md">
                  EN OFERTA
                </span>
              </div>
            </div>

            {/* Top row actions (Theme Switcher and Developer Tag) */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] bg-emerald-500/25 text-emerald-400 font-extrabold px-2 py-0.5 rounded-lg border border-emerald-500/20 shadow-xs uppercase tracking-wider">
                Feed Vivo
              </span>
              <button
                onClick={onToggleDarkMode}
                className="p-1.5 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 rounded-xl text-white transition-all cursor-pointer backdrop-blur-xs"
                title={darkMode ? 'Modo Claro' : 'Modo Oscuro'}
              >
                {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-slate-200" />}
              </button>
            </div>
          </div>

          {/* Search bar inside header overlay */}
          <div className="relative w-full md:hidden">
            <input
              type="text"
              placeholder="Buscar descuentos y locales..."
              value={feedSearch}
              onChange={(e) => setFeedSearch(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-md border border-white/15 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-white/60 focus:outline-hidden focus:border-emerald-400 focus:bg-white/20 transition-all shadow-md"
            />
            <Search className="absolute left-3 top-2.5 text-white/60 w-3.5 h-3.5" />
            {feedSearch && (
              <button
                onClick={() => setFeedSearch('')}
                className="absolute right-2.5 top-2.5 text-white/60 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Inline horizontal Category Stories filter */}
          <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar scroll-smooth md:justify-center">
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-extrabold transition-all shrink-0 cursor-pointer border ${
                selectedCategoryFilter === 'all'
                  ? 'bg-emerald-500 border-emerald-400 text-white shadow-xs'
                  : 'bg-black/40 border-white/10 text-white/80 hover:bg-black/60'
              }`}
            >
              Todos 🔥
            </button>
            {categories.filter(cat => cat.id !== 'all').map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-extrabold transition-all shrink-0 cursor-pointer flex items-center gap-1 border ${
                  selectedCategoryFilter.toLowerCase() === cat.id.toLowerCase()
                    ? 'bg-emerald-500 border-emerald-400 text-white shadow-xs'
                    : 'bg-black/40 border-white/10 text-white/80 hover:bg-black/60'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FEED SCROLL CONTAINER */}
        <div 
          className="flex-1 overflow-y-auto snap-y snap-mandatory w-full h-full bg-zinc-950 scroll-smooth no-scrollbar"
          style={{ scrollBehavior: 'smooth' }}
        >
          {filteredOffers.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-center p-8 bg-zinc-950 text-white gap-4">
              <span className="text-4xl animate-bounce">🔍🧉</span>
              <div className="space-y-1">
                <h4 className="font-display font-black text-sm">¡Sin ofertas encontradas!</h4>
                <p className="text-xs text-zinc-400 max-w-[240px]">
                  No hay resultados para tu búsqueda actual. Probá con otra categoría o palabra clave.
                </p>
              </div>
              <button
                onClick={() => {
                  setFeedSearch('');
                  setSelectedCategoryFilter('all');
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Restablecer Filtros
              </button>
            </div>
          ) : (
            filteredOffers.map((offer, idx) => {
              const isLiked = likedOffers[offer.id] || false;
              const isBookmarked = bookmarkedOffers[offer.id] || false;
              const currentLikes = likesCount[offer.id] || 0;
              const discountPercentage = Math.round(((offer.originalPrice - offer.discountPrice) / offer.originalPrice) * 100);
              
              // Find matching shop
              const shop = shops.find(s => s.id === offer.shopId);

              return (
                <div 
                  key={offer.id}
                  onClick={(e) => handleCardTouchOrClick(offer.id, e)}
                  className="snap-start h-full w-full relative flex flex-col justify-end overflow-hidden select-none"
                  style={{ height: '100%' }}
                >
                  {/* Full Size Background Image */}
                  <img
                    src={offer.image}
                    alt={offer.title}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none transition-transform duration-500 hover:scale-103"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Dark Gradient legibility overlays */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/95 pointer-events-none" />

                  {/* DOUBLE TAP HEART SPLASH POPPING */}
                  <AnimatePresence>
                    {poppingHearts
                      .filter(h => h.id.startsWith(offer.id))
                      .map(heart => (
                        <motion.div
                          key={heart.id}
                          initial={{ scale: 0, opacity: 0, rotate: Math.random() * 30 - 15 }}
                          animate={{ scale: [1, 1.4, 1.2], opacity: [0, 1, 1, 0] }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.7, ease: 'easeOut' }}
                          style={{
                            position: 'absolute',
                            left: heart.x - 48,
                            top: heart.y - 48,
                            width: 96,
                            height: 96,
                            pointerEvents: 'none',
                            zIndex: 40
                          }}
                        >
                          <Heart className="w-full h-full text-rose-500 fill-rose-500 drop-shadow-xl" />
                        </motion.div>
                      ))}
                  </AnimatePresence>

                  {/* BOTTOM OVERLAYS & CONTENT GRID */}
                  <div className="relative z-10 w-full px-3 md:px-6 pb-2 md:pb-4 flex items-end justify-between gap-3 md:gap-6">
                    
                    {/* LEFT COLUMN: INFO OVERLAY */}
                    <div className="flex-1 flex flex-col items-start gap-1.5 md:gap-2 text-white">
                      
                      {/* Shop Info with pulse open green dot */}
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="relative">
                          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white dark:bg-zinc-900 border border-white/20 flex items-center justify-center text-lg md:text-xl shadow-md select-none overflow-hidden">
                            <ShopLogo logo={shop?.logo} className="text-lg md:text-xl" fallbackSize="w-8 h-8 md:w-9 md:h-9" />
                          </div>
                          {shop?.isOpen && (
                            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-zinc-900 rounded-full animate-pulse" />
                          )}
                        </div>
                        <div className="flex flex-col leading-none">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (shop) onSelectShopOnMap(shop.id);
                            }}
                            className="font-bold text-[11px] md:text-xs lg:text-sm hover:underline cursor-pointer flex items-center gap-1 text-zinc-100 drop-shadow-xs text-left"
                          >
                            {offer.shopName}
                          </button>
                          <span className="text-[9px] md:text-[10px] text-zinc-400 flex items-center gap-0.5 drop-shadow-xs mt-0.5">
                            <MapPin className="w-2.5 h-2.5 text-zinc-400" />
                            {shop?.zone || 'Oberá'}
                          </span>
                        </div>
                      </div>

                      {/* Filter badges */}
                      <div className="flex flex-wrap gap-1 md:gap-1.5">
                        <span className="bg-red-500 text-white text-[9px] md:text-[10px] font-black px-1.5 py-0.5 rounded-lg shadow-sm flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5 text-white fill-white animate-bounce" />
                          -{discountPercentage}%
                        </span>
                        <span className="bg-white/10 backdrop-blur-md text-white text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-lg border border-white/10">
                          {offer.category}
                        </span>
                        {offer.isFeatured && (
                          <span className="bg-amber-500/90 text-zinc-950 text-[9px] md:text-[10px] font-black px-1.5 py-0.5 rounded-lg">
                            ⭐ Destacada
                          </span>
                        )}
                      </div>

                      {/* Offer Details */}
                      <div className="space-y-0.5 w-full">
                        <h3 className="font-display font-extrabold text-xs sm:text-sm md:text-base leading-tight drop-shadow-md text-white line-clamp-1">
                          {offer.title}
                        </h3>
                        <p className="text-[10px] md:text-[11px] text-zinc-350 drop-shadow-xs line-clamp-1 leading-snug font-medium">
                          {offer.description}
                        </p>
                      </div>

                      {/* Prices & urgency block */}
                      <div className="flex items-center gap-2.5 w-full pt-0.5">
                        <div className="flex flex-col leading-none">
                          <span className="text-[8px] md:text-[9px] text-zinc-400 line-through">
                            ${offer.originalPrice.toLocaleString('es-AR')}
                          </span>
                          <span className="text-sm md:text-base lg:text-lg font-display font-black text-emerald-400">
                            ${offer.discountPrice.toLocaleString('es-AR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/20 text-amber-400 rounded-md text-[8px] md:text-[9px] font-black uppercase tracking-wider animate-pulse">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{offer.isFlashSale ? 'Faltan horas' : 'Solo hoy'}</span>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCoupon(offer);
                        }}
                        className="w-full mt-1 py-2 md:py-2.5 bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-extrabold rounded-xl text-[10px] md:text-[11px] uppercase tracking-wider shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-orange-400/20"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        RECLAMAR CUPÓN GRATIS
                      </button>

                    </div>

                    {/* RIGHT COLUMN: VERTICAL INTERACTION BAR */}
                    <div className="flex flex-col items-center gap-2 md:gap-2.5 shrink-0 pb-2">
                      
                      {/* Like Action */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikeToggle(offer.id);
                        }}
                        className="flex flex-col items-center gap-0.5 cursor-pointer focus:outline-hidden group"
                      >
                        <div className="w-9 h-9 md:w-10 md:h-10 bg-black/45 backdrop-blur-md border border-white/15 hover:scale-105 active:scale-90 rounded-full flex items-center justify-center text-white transition-all shadow-md">
                          <Heart className={`w-4.5 h-4.5 md:w-5 md:h-5 transition-transform ${isLiked ? 'text-rose-500 fill-rose-500 scale-110' : 'group-hover:scale-110'}`} />
                        </div>
                        <span className="text-[8px] md:text-[9px] font-bold text-zinc-300 drop-shadow-md">
                          {currentLikes}
                        </span>
                      </button>

                      {/* Bookmark/Save Action */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookmarkToggle(offer.id);
                        }}
                        className="flex flex-col items-center gap-0.5 cursor-pointer focus:outline-hidden group"
                      >
                        <div className="w-9 h-9 md:w-10 md:h-10 bg-black/45 backdrop-blur-md border border-white/15 hover:scale-105 active:scale-90 rounded-full flex items-center justify-center text-white transition-all shadow-md">
                          <Bookmark className={`w-4.5 h-4.5 md:w-5 md:h-5 transition-transform ${isBookmarked ? 'text-amber-500 fill-amber-500 scale-110' : 'group-hover:scale-110'}`} />
                        </div>
                        <span className="text-[8px] md:text-[9px] font-bold text-zinc-300 drop-shadow-md">
                          {isBookmarked ? 'Guardado' : 'Guardar'}
                        </span>
                      </button>

                      {/* Share WhatsApp Action */}
                      <a
                        href={getWhatsAppShareUrl(offer)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex flex-col items-center gap-0.5 cursor-pointer focus:outline-hidden group"
                        title="Compartir por WhatsApp"
                      >
                        <div className="w-9 h-9 md:w-10 md:h-10 bg-black/45 backdrop-blur-md border border-white/15 hover:scale-105 active:scale-90 rounded-full flex items-center justify-center text-white transition-all shadow-md">
                          <Share2 className="w-4.5 h-4.5 md:w-5 md:h-5 text-white group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="text-[8px] md:text-[9px] font-bold text-zinc-300 drop-shadow-md">
                          Compartir
                        </span>
                      </a>

                      {/* Map Location shortcut */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (shop) onSelectShopOnMap(shop.id);
                        }}
                        className="flex flex-col items-center gap-0.5 cursor-pointer focus:outline-hidden group"
                        title="Ver en Mapa"
                      >
                        <div className="w-9 h-9 md:w-10 md:h-10 bg-black/45 backdrop-blur-md border border-white/15 hover:scale-105 active:scale-90 rounded-full flex items-center justify-center text-white transition-all shadow-md">
                          <Map className="w-4.5 h-4.5 md:w-5 md:h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="text-[8px] md:text-[9px] font-bold text-zinc-300 drop-shadow-md">
                          Mapa
                        </span>
                      </button>

                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Swipe indicators footer */}
        {filteredOffers.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
            <span className="text-[9px] font-extrabold text-white/50 tracking-wider flex items-center gap-1">
              Deslizá para ver más <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
            </span>
          </div>
        )}

      </div>
    </div>
  );
}
