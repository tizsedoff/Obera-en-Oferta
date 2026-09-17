import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  QrCode, 
  MapPin, 
  Sparkles, 
  Share2, 
  Film, 
  Compass, 
  Plus, 
  Check, 
  ShoppingBag, 
  ArrowRight, 
  MoreHorizontal, 
  SlidersHorizontal,
  BookmarkCheck,
  Sparkle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Offer, Shop, Category } from '../types';
import ShopLogo from './ShopLogo';
import { supabase } from '../supabaseClient';

interface CategoriesTabProps {
  offers: Offer[];
  shops: Shop[];
  categories: Category[];
  zones: string[];
  onOpenOffer: (offer: Offer) => void;
  onOpenCoupon?: (offer: Offer) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

interface Comment {
  id: string;
  user: string;
  text: string;
  time: string;
  avatar: string;
}

export default function CategoriesTab({
  offers,
  shops,
  categories,
  zones,
  onOpenOffer,
  onOpenCoupon,
  selectedCategory,
  setSelectedCategory
}: CategoriesTabProps) {
  // Feed views: 'instagram' (scrolling feed) or 'tiktok' (immersive vertical player)
  const [feedMode, setFeedMode] = useState<'instagram' | 'tiktok'>('instagram');
  const [selectedZone, setSelectedZone] = useState<string>('Todos');
  const [maxPrice, setMaxPrice] = useState<number>(350000);
  const [onlyQr, setOnlyQr] = useState<boolean>(false);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState<boolean>(false);

  // Dynamic state for likes, bookmarks, comments, and double-click heart animations
  const [likes, setLikes] = useState<{ [key: string]: boolean }>({});
  const [bookmarks, setBookmarks] = useState<{ [key: string]: boolean }>({});
  const [customLikesCount, setCustomLikesCount] = useState<{ [key: string]: number }>({});
  const [heartSplash, setHeartSplash] = useState<{ [key: string]: boolean }>({});
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [newCommentText, setNewCommentText] = useState<{ [key: string]: string }>({});
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({});
  const [showShareToast, setShowShareToast] = useState<string | null>(null);

  // TikTok vertical active index
  const [activeTikTokIndex, setActiveTikTokIndex] = useState<number>(0);
  const tiktokContainerRef = useRef<HTMLDivElement>(null);

  // Populate initial likes, bookmarks and comments once
  useEffect(() => {
    const initialLikes: { [key: string]: number } = {};
    const initialComments: { [key: string]: Comment[] } = {};
    
    offers.forEach(o => {
      // Create seed values for likes based on view count
      initialLikes[o.id] = Math.floor(o.views * 1.8) + 42;

    });

    setCustomLikesCount(initialLikes);
  }, [offers]);

  useEffect(() => {
    async function fetchComments() {
      if (!supabase) return;
      const { data, error } = await supabase.from('comentarios').select('*');
      if (!error && data) {
        const mapped: { [key: string]: Comment[] } = {};
        data.forEach((c: any) => {
          if (!mapped[c.oferta_id]) mapped[c.oferta_id] = [];
          mapped[c.oferta_id].push({
            id: c.id,
            user: c.usuario,
            text: c.texto,
            time: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            avatar: c.avatar || '💬'
          });
        });
        setComments(mapped);
      }
    }
    fetchComments();
  }, [offers]);

  const handleAddComment = async (offerId: string) => {
    const text = newCommentText[offerId]?.trim();
    if (!text) return;

    const newComment = {
      oferta_id: offerId,
      usuario: 'Vecino de Oberá',
      avatar: '🧉',
      texto: text
    };

    if (supabase) {
      const { data, error } = await supabase.from('comentarios').insert([newComment]).select().single();
      if (!error && data) {
        const formattedComment: Comment = {
          id: data.id,
          user: data.usuario,
          text: data.texto,
          time: 'Reciente',
          avatar: data.avatar
        };
        setComments(prev => ({
          ...prev,
          [offerId]: [...(prev[offerId] || []), formattedComment]
        }));
      }
    }

    setNewCommentText(prev => ({ ...prev, [offerId]: '' }));
  };

  // Handle price bounds dynamically
  const maxOfferPrice = useMemo(() => {
    if (offers.length === 0) return 300000;
    return Math.max(...offers.map(o => o.discountPrice));
  }, [offers]);

  // Handle dynamic filters
  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      // 1. Category Filter
      if (selectedCategory !== 'all' && offer.category !== selectedCategory) {
        return false;
      }

      // 2. Zone Filter
      const shop = shops.find(s => s.id === offer.shopId);
      if (selectedZone !== 'Todos' && shop?.zone !== selectedZone) {
        return false;
      }

      // 3. Price Filter
      if (offer.discountPrice > maxPrice) {
        return false;
      }

      // 4. QR filter
      if (onlyQr && !offer.hasQrCoupon) {
        return false;
      }

      return true;
    });
  }, [offers, shops, selectedCategory, selectedZone, maxPrice, onlyQr]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedZone('Todos');
    setMaxPrice(maxOfferPrice + 50000);
    setOnlyQr(false);
  };

  // Double Click Like Logic
  const handleDoubleTap = (offerId: string) => {
    // Show splash heart animation
    setHeartSplash(prev => ({ ...prev, [offerId]: true }));
    setTimeout(() => {
      setHeartSplash(prev => ({ ...prev, [offerId]: false }));
    }, 850);

    // Like post if not already liked
    if (!likes[offerId]) {
      setLikes(prev => ({ ...prev, [offerId]: true }));
      setCustomLikesCount(prev => ({
        ...prev,
        [offerId]: (prev[offerId] || 0) + 1
      }));
    }
  };

  // Single Click Like Logic
  const handleLike = (offerId: string) => {
    const isLiked = likes[offerId];
    setLikes(prev => ({ ...prev, [offerId]: !isLiked }));
    setCustomLikesCount(prev => ({
      ...prev,
      [offerId]: isLiked ? (prev[offerId] || 1) - 1 : (prev[offerId] || 0) + 1
    }));
  };

  // Bookmark toggler
  const handleBookmark = (offerId: string) => {
    const isBookmarked = bookmarks[offerId];
    setBookmarks(prev => ({ ...prev, [offerId]: !isBookmarked }));
    
    if (!isBookmarked) {
      triggerToast('🔖 Guardado en tus favoritos');
    }
  };

  // Comment submitter
  const handleAddComment = (offerId: string) => {
    const text = newCommentText[offerId]?.trim();
    if (!text) return;

    const newComment: Comment = {
      id: `c-user-${Date.now()}`,
      user: 'tu_usuario_local',
      text: text,
      time: 'ahora',
      avatar: '🧉'
    };

    setComments(prev => ({
      ...prev,
      [offerId]: [newComment, ...(prev[offerId] || [])]
    }));

    setNewCommentText(prev => ({ ...prev, [offerId]: '' }));
    setExpandedComments(prev => ({ ...prev, [offerId]: true }));
  };

  // Share action
  const triggerToast = (msg: string) => {
    setShowShareToast(msg);
    setTimeout(() => setShowShareToast(null), 3000);
  };

  const handleShare = (offer: Offer) => {
    const shareMessage = `¡Che, mirá este ofertón de ${offer.shopName} en Oberá en Oferta! 🔥\n👉 ${offer.title} a solo $${offer.discountPrice.toLocaleString('es-AR')} (Antes $${offer.originalPrice.toLocaleString('es-AR')}). Descargá tu cupón QR acá!`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareMessage);
      triggerToast('🔗 ¡Enlace de oferta copiado! Compartilo por WhatsApp.');
    } else {
      triggerToast('🔗 ¡Copiado con éxito para compartir!');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 transition-colors">
      
      {/* Dynamic Notifications Overlay */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-zinc-900/95 backdrop-blur-md text-[#5CE1B2] font-semibold text-xs py-3 px-6 rounded-full shadow-2xl border border-[#5CE1B2]/30 flex items-center gap-2"
          >
            <Sparkle className="w-4 h-4 animate-spin text-[#5CE1B2]" />
            <span>{showShareToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP DECK - STORIES BAR & VIEW TOGGLE */}
      <div className="flex flex-col gap-5 mb-8">
        
        {/* Toggle Pills - Premium Design */}
        <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-xs">
          <div className="flex gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setFeedMode('instagram')}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                feedMode === 'instagram'
                  ? 'bg-gradient-to-r from-[#2B0E67] to-indigo-800 text-white shadow-md shadow-indigo-900/10'
                  : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Feed Instagram</span>
            </button>
            <button
              onClick={() => setFeedMode('tiktok')}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                feedMode === 'tiktok'
                  ? 'bg-gradient-to-r from-red-500 via-zinc-900 to-emerald-500 text-white shadow-md shadow-red-500/10'
                  : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              <Film className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>Reels TikTok</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2.5">
            <button
              onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                showFiltersDrawer || selectedZone !== 'Todos' || onlyQr || maxPrice < maxOfferPrice
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                  : 'bg-transparent border-slate-200/80 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filtros avanzados</span>
            </button>
          </div>
        </div>

        {/* INSTAGRAM & TIKTOK STORIES (CATEGORIES FILTER) */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-3.5 px-1.5">
            <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#5CE1B2]" /> Historias de Ahorro en Oberá
            </span>
            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold hover:underline cursor-pointer" onClick={handleResetFilters}>
              Mostrar todo
            </span>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
            {categories.map((cat) => {
              const isActive = (selectedCategory === cat.id || (selectedCategory === 'all' && cat.id === 'all'));
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id === 'all' ? 'all' : cat.id)}
                  className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer focus:outline-none group relative"
                >
                  {/* Glowing custom story border ring */}
                  <div className={`p-[3px] rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-tr from-[#2B0E67] via-[#5CE1B2] to-[#ff6b6b] scale-105 shadow-md shadow-indigo-500/10'
                      : 'bg-slate-200 dark:bg-zinc-800 group-hover:scale-103'
                  }`}>
                    <div className="bg-white dark:bg-zinc-900 p-1 rounded-full">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-lg sm:text-xl transition-all ${
                        isActive ? 'bg-slate-50 dark:bg-zinc-850' : 'bg-slate-100 dark:bg-zinc-800'
                      }`}>
                        {cat.emoji}
                      </div>
                    </div>
                  </div>
                  
                  <span className={`text-[10px] sm:text-xs font-bold transition-colors ${
                    isActive ? 'text-slate-900 dark:text-white font-black' : 'text-slate-500 dark:text-zinc-400 group-hover:text-slate-800 dark:group-hover:text-zinc-200'
                  }`}>
                    {cat.name}
                  </span>

                  {/* Active small dot indicator */}
                  {isActive && (
                    <span className="absolute -bottom-1 h-1 w-4 rounded-full bg-[#5CE1B2]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* FLOATING OR COLLAPSED FILTERS DRAWER */}
        <AnimatePresence>
          {(showFiltersDrawer || selectedZone !== 'Todos' || onlyQr || maxPrice < maxOfferPrice) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-50 dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 overflow-hidden shadow-inner"
            >
              <div className="p-5 sm:p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-zinc-800 pb-3">
                  <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-brand-orange dark:text-indigo-400" /> Ajustar mi Feed
                  </h4>
                  <button 
                    onClick={() => { handleResetFilters(); setShowFiltersDrawer(false); }} 
                    className="text-[10px] font-black text-rose-500 uppercase cursor-pointer hover:underline"
                  >
                    Resetear Filtros
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Zones */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                      📍 Filtrar por Zona de Oberá
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {zones.map((zone) => (
                        <button
                          key={zone}
                          onClick={() => setSelectedZone(zone)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            selectedZone === zone
                              ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                              : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-100 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {zone === 'Todos' ? '📍 Todas las Zonas' : zone}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                      <span>💸 Precio Máximo</span>
                      <span className="text-indigo-600 dark:text-indigo-400 text-xs font-black">
                        ${maxPrice.toLocaleString('es-AR')}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1000"
                      max={maxOfferPrice + 20000}
                      step="1000"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#5CE1B2]"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 dark:text-zinc-500 font-bold">
                      <span>$1.000</span>
                      <span>${(maxOfferPrice + 20000).toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200/40 dark:border-zinc-800/50 pt-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={onlyQr}
                      onChange={(e) => setOnlyQr(e.target.checked)}
                      className="w-4 h-4 rounded-md border-slate-300 dark:border-zinc-700 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-500 accent-[#5CE1B2]"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-indigo-500" /> Solo Ofertas con Cupón QR Guardable
                    </span>
                  </label>
                  
                  <button 
                    onClick={() => setShowFiltersDrawer(false)}
                    className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FEED CONTENT GRID / CONTAINER */}
      {filteredOffers.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-12 text-center shadow-xs">
          <p className="text-base font-display font-extrabold text-slate-800 dark:text-zinc-200 mb-2">No encontramos resultados en el feed</p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-xs mx-auto mb-4">
            Probá ajustando los filtros o seleccionando una historia diferente para cargar más ofertas de Oberá.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white text-xs font-extrabold rounded-xl shadow-xs cursor-pointer"
          >
            Mostrar Todo el Feed
          </button>
        </div>
      ) : (
        <>
          {/* ======================================= */}
          {/* 📸 INSTAGRAM FEED MODE                  */}
          {/* ======================================= */}
          {feedMode === 'instagram' && (
            <div className="max-w-2xl mx-auto space-y-10">
              {filteredOffers.map((offer) => {
                const shop = shops.find(s => s.id === offer.shopId);
                const discountPercentage = Math.round(((offer.originalPrice - offer.discountPrice) / offer.originalPrice) * 100);
                const isLiked = likes[offer.id] || false;
                const isBookmarked = bookmarks[offer.id] || false;
                const activeLikes = customLikesCount[offer.id] || 0;
                const postComments = comments[offer.id] || [];
                const isExpanded = expandedComments[offer.id] || false;

                return (
                  <motion.article
                    key={offer.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300"
                  >
                    {/* Post Header: Shop profile */}
                    <div className="p-4 flex items-center justify-between border-b border-slate-50 dark:border-zinc-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700 flex items-center justify-center text-xl shadow-xs select-none overflow-hidden shrink-0">
                          <ShopLogo logo={shop?.logo} className="text-xl" fallbackSize="w-10 h-10" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 
                              onClick={() => onOpenOffer(offer)}
                              className="text-xs font-black text-slate-900 dark:text-zinc-100 hover:underline cursor-pointer flex items-center gap-1"
                            >
                              {offer.shopName}
                              <Check className="w-3.5 h-3.5 text-blue-500 fill-blue-500 shrink-0" />
                            </h4>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-300" /> {shop?.zone || 'Oberá, Misiones'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="bg-[#5CE1B2]/10 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                          Verificado
                        </span>
                        <button className="text-slate-400 dark:text-zinc-500 p-1.5 hover:text-slate-600 dark:hover:text-zinc-300">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Post Media: Big product image with double click to like */}
                    <div 
                      onDoubleClick={() => handleDoubleTap(offer.id)}
                      className="relative h-96 sm:h-[420px] bg-slate-900 overflow-hidden cursor-pointer select-none group"
                    >
                      <img
                        src={offer.image}
                        alt={offer.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Black fade overlay on bottom */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                      {/* Promo overlay tags */}
                      <div className="absolute top-4 left-4 bg-red-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-md uppercase tracking-wider">
                        -{discountPercentage}% Off
                      </div>

                      {offer.isFlashSale && (
                        <div className="absolute top-4 right-4 bg-amber-500 text-zinc-950 font-black text-[10px] px-2.5 py-1 rounded-xl shadow-md uppercase tracking-wider flex items-center gap-1">
                          ⚡ Oferta Relámpago
                        </div>
                      )}

                      {/* Giant Floating Double Tap Heart Splash */}
                      <AnimatePresence>
                        {heartSplash[offer.id] && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0] }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                          >
                            <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-[0_10px_15px_rgba(244,63,94,0.4)]" />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Click indicator helper */}
                      <div className="absolute bottom-3 right-3 bg-black/40 text-white text-[9px] font-bold px-2 py-1 rounded-md backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-wide">
                        Doblo clic para dar amor 🧉
                      </div>
                    </div>

                    {/* Action buttons bar */}
                    <div className="p-4 bg-white dark:bg-zinc-900">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <motion.button
                            whileTap={{ scale: 1.3 }}
                            onClick={() => handleLike(offer.id)}
                            className="focus:outline-none"
                          >
                            <Heart className={`w-6 h-6 transition-colors ${
                              isLiked ? 'text-rose-500 fill-rose-500' : 'text-slate-700 dark:text-zinc-200 hover:text-rose-500'
                            }`} />
                          </motion.button>

                          <button
                            onClick={() => setExpandedComments(prev => ({ ...prev, [offer.id]: !isExpanded }))}
                            className="text-slate-700 dark:text-zinc-200 hover:text-indigo-500 transition-colors"
                          >
                            <MessageCircle className="w-6 h-6" />
                          </button>

                          <button
                            onClick={() => handleShare(offer)}
                            className="text-slate-700 dark:text-zinc-200 hover:text-indigo-500 transition-colors"
                          >
                            <Share2 className="w-5 h-5" />
                          </button>
                        </div>

                        <motion.button
                          whileTap={{ scale: 1.2 }}
                          onClick={() => handleBookmark(offer.id)}
                          className="text-slate-700 dark:text-zinc-200 hover:text-[#5CE1B2] transition-colors"
                        >
                          {isBookmarked ? (
                            <BookmarkCheck className="w-6 h-6 text-[#5CE1B2] fill-[#5CE1B2]" />
                          ) : (
                            <Bookmark className="w-6 h-6" />
                          )}
                        </motion.button>
                      </div>

                      {/* Likes count info */}
                      <p className="text-xs font-black text-slate-800 dark:text-zinc-200 mb-1.5">
                        Le gusta a <span className="underline">aps_developer</span> y {activeLikes.toLocaleString()} personas más
                      </p>

                      {/* Caption block */}
                      <div className="space-y-1 mb-3">
                        <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
                          <span className="font-black text-slate-900 dark:text-zinc-100 mr-2 hover:underline cursor-pointer" onClick={() => onOpenOffer(offer)}>
                            {offer.shopName}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white mr-1.5">{offer.title}</span>
                          — {offer.description}
                        </p>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold block pt-1">
                          ⌛ Expira el: {offer.expiryDate}
                        </span>
                      </div>

                      {/* Interactive Price Banner inside Card */}
                      <div className="bg-slate-50 dark:bg-zinc-950 p-3.5 rounded-2xl flex items-center justify-between border border-slate-100/50 dark:border-zinc-800/80 mb-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold line-through">
                            Antes: ${offer.originalPrice.toLocaleString('es-AR')} ARS
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-base font-display font-black text-red-500 dark:text-red-400 leading-none">
                              ${offer.discountPrice.toLocaleString('es-AR')}
                            </span>
                            <span className="bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                              Ahorrás {discountPercentage}%
                            </span>
                          </div>
                        </div>

                        {offer.hasQrCoupon && onOpenCoupon ? (
                          <button
                            onClick={() => onOpenCoupon(offer)}
                            className="bg-gradient-to-r from-[#2B0E67] to-indigo-800 hover:from-indigo-900 hover:to-indigo-950 text-white font-extrabold text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-xs transition-all duration-300 flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95 border border-indigo-500/20"
                          >
                            <QrCode className="w-3.5 h-3.5 text-[#5CE1B2]" /> Reclamar QR
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenOffer(offer)}
                            className="bg-slate-950 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold text-[10px] px-3.5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors"
                          >
                            Ver Detalles
                          </button>
                        )}
                      </div>

                      {/* Comments Drawer / Collapsible list */}
                      <div className="border-t border-slate-50 dark:border-zinc-800/60 pt-3">
                        <button
                          onClick={() => setExpandedComments(prev => ({ ...prev, [offer.id]: !isExpanded }))}
                          className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider hover:text-indigo-500 block mb-2"
                        >
                          {isExpanded 
                            ? `▲ Ocultar comentarios (${postComments.length})` 
                            : `▼ Ver los ${postComments.length} comentarios de la comunidad...`
                          }
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-3 overflow-hidden"
                            >
                              <div className="max-h-56 overflow-y-auto space-y-3 pr-1.5 py-1">
                                {postComments.map((comment) => (
                                  <motion.div
                                    key={comment.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-start gap-2.5 bg-slate-50 dark:bg-zinc-950/50 p-2 rounded-xl border border-slate-100/50 dark:border-zinc-850"
                                  >
                                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-xs shadow-xs shrink-0 select-none">
                                      {comment.avatar || '🧉'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[11px] text-slate-700 dark:text-zinc-300 leading-snug">
                                        <span className="font-black text-slate-900 dark:text-zinc-100 mr-1.5 hover:underline cursor-pointer">
                                          {comment.user}
                                        </span>
                                        {comment.text}
                                      </p>
                                      <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold block mt-0.5">
                                        {comment.time}
                                      </span>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>

                              {/* Add local comment input */}
                              <div className="flex items-center gap-2 pt-2 border-t border-slate-50 dark:border-zinc-800/50">
                                <input
                                  type="text"
                                  placeholder="Escribí un comentario en este post..."
                                  value={newCommentText[offer.id] || ''}
                                  onChange={(e) => setNewCommentText(prev => ({ ...prev, [offer.id]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddComment(offer.id);
                                  }}
                                  className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200/50 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white"
                                />
                                <button
                                  onClick={() => handleAddComment(offer.id)}
                                  className="p-2 bg-[#5CE1B2]/20 hover:bg-[#5CE1B2]/30 text-[#2B0E67] dark:text-emerald-400 rounded-xl transition-colors cursor-pointer"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}

          {/* ======================================= */}
          {/* 🎬 TIKTOK REELS MODE (MOBILE ENCLOSURE) */}
          {/* ======================================= */}
          {feedMode === 'tiktok' && (
            <div className="max-w-md md:max-w-lg lg:max-w-xl mx-auto">
              
              {/* TikTok Phone container mockup */}
              <div className="relative aspect-[9/16] w-full bg-zinc-950 rounded-[40px] overflow-hidden shadow-2xl border-4 border-zinc-800 dark:border-zinc-850 flex flex-col justify-between">
                
                {/* Simulated Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-zinc-800 rounded-b-2xl z-40 flex items-center justify-center pointer-events-none">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-950 mr-4" />
                  <div className="w-8 h-1 bg-zinc-900 rounded-full" />
                </div>

                {/* TikTok Header Overlay */}
                <div className="absolute top-6 left-0 right-0 z-30 px-6 flex items-center justify-between text-white pointer-events-none">
                  <div className="text-[10px] font-black uppercase tracking-widest bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#5CE1B2] animate-pulse" /> APS REELS
                  </div>
                  <div className="flex gap-3 text-xs font-black">
                    <span className="opacity-60">Siguiendo</span>
                    <span className="border-b-2 border-[#5CE1B2] pb-0.5 text-[#5CE1B2]">Para ti</span>
                  </div>
                  <div className="w-12" /> {/* spacing spacer */}
                </div>

                {/* TikTok Slides content viewport */}
                <div 
                  ref={tiktokContainerRef}
                  className="flex-1 w-full relative overflow-hidden bg-zinc-950"
                  onDoubleClick={() => handleDoubleTap(filteredOffers[activeTikTokIndex].id)}
                >
                  <AnimatePresence mode="wait">
                    {filteredOffers.map((offer, index) => {
                      if (index !== activeTikTokIndex) return null;

                      const shop = shops.find(s => s.id === offer.shopId);
                      const discountPercentage = Math.round(((offer.originalPrice - offer.discountPrice) / offer.originalPrice) * 100);
                      const isLiked = likes[offer.id] || false;
                      const activeLikes = customLikesCount[offer.id] || 0;
                      const postComments = comments[offer.id] || [];

                      return (
                        <motion.div
                          key={offer.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.05 }}
                          transition={{ duration: 0.35 }}
                          className="absolute inset-0 w-full h-full flex flex-col justify-end"
                        >
                          {/* Post Media background */}
                          <div className="absolute inset-0 w-full h-full">
                            <img
                              src={offer.image}
                              alt={offer.title}
                              className="w-full h-full object-cover select-none"
                              referrerPolicy="no-referrer"
                            />
                            {/* Dark Gradient Overlay to guarantee text legibility */}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />
                          </div>

                          {/* Giant Floating Double Tap Heart Splash */}
                          <AnimatePresence>
                            {heartSplash[offer.id] && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 0] }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ duration: 0.7 }}
                                className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
                              >
                                <Heart className="w-28 h-28 text-rose-500 fill-rose-500 drop-shadow-[0_10px_20px_rgba(244,63,94,0.5)]" />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* RIGHT FLOATING OVERLAY ACTION BUTTONS */}
                          <div className="absolute right-3.5 bottom-28 z-30 flex flex-col items-center gap-5">
                            
                            {/* Shop Profile Logo */}
                            <div className="relative mb-2">
                              <div className="w-11 h-11 rounded-full bg-slate-900 border-2 border-[#5CE1B2] flex items-center justify-center text-xl shadow-lg select-none overflow-hidden shrink-0">
                                <ShopLogo logo={shop?.logo} className="text-xl" fallbackSize="w-11 h-11" />
                              </div>
                              <button 
                                onClick={() => handleLike(offer.id)}
                                className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#5CE1B2] hover:bg-emerald-400 text-[#2B0E67] font-black rounded-full p-0.5 shadow-md flex items-center justify-center cursor-pointer transition-transform active:scale-90"
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[3.5]" />
                              </button>
                            </div>

                            {/* Heart/Like Button */}
                            <div className="flex flex-col items-center">
                              <motion.button
                                whileTap={{ scale: 1.4 }}
                                onClick={() => handleLike(offer.id)}
                                className={`w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white cursor-pointer hover:bg-black/60 transition-colors ${
                                  isLiked ? 'text-rose-500' : ''
                                }`}
                              >
                                <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                              </motion.button>
                              <span className="text-[10px] text-white font-black mt-1 shadow-xs">{activeLikes}</span>
                            </div>

                            {/* Comments Button */}
                            <div className="flex flex-col items-center">
                              <button
                                onClick={() => {
                                  setExpandedComments(prev => ({ ...prev, [offer.id]: true }));
                                  triggerToast('💬 Desplazá hacia abajo para ver comentarios de este Reels.');
                                }}
                                className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white cursor-pointer hover:bg-black/60 transition-colors"
                              >
                                <MessageCircle className="w-5 h-5" />
                              </button>
                              <span className="text-[10px] text-white font-black mt-1 shadow-xs">{postComments.length}</span>
                            </div>

                            {/* Share button */}
                            <div className="flex flex-col items-center">
                              <button
                                onClick={() => handleShare(offer)}
                                className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white cursor-pointer hover:bg-black/60 transition-colors"
                              >
                                <Share2 className="w-5 h-5 text-indigo-400" />
                              </button>
                              <span className="text-[10px] text-white font-black mt-1 shadow-xs">Share</span>
                            </div>

                            {/* Spinning QR / Vinyl icon - Premium claim indicator */}
                            {offer.hasQrCoupon && onOpenCoupon && (
                              <motion.button
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                                onClick={() => onOpenCoupon(offer)}
                                className="w-11 h-11 rounded-full bg-gradient-to-r from-[#2B0E67] via-[#5CE1B2] to-indigo-800 border-2 border-white flex items-center justify-center text-white shadow-xl cursor-pointer"
                                title="Reclamar QR"
                              >
                                <QrCode className="w-4 h-4 text-[#5CE1B2]" />
                              </motion.button>
                            )}

                          </div>

                          {/* BOTTOM DETAIL TEXT & PRICE OVERLAY */}
                          <div className="p-4 sm:p-5 z-20 text-white space-y-3 pointer-events-auto bg-gradient-to-t from-black via-black/30 to-transparent">
                            
                            {/* Shop Name & Info */}
                            <div className="space-y-1">
                              <h4 className="text-sm font-black text-white hover:underline cursor-pointer flex items-center gap-1.5" onClick={() => onOpenOffer(offer)}>
                                @{offer.shopName.toLowerCase().replace(/\s+/g, '_')}
                                <Check className="w-3.5 h-3.5 text-blue-400 fill-blue-400 shrink-0" />
                              </h4>
                              <p className="text-xs text-zinc-200 line-clamp-2 leading-relaxed">
                                <span className="font-extrabold text-[#5CE1B2]">{offer.title}</span> — {offer.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                                <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-white/10">
                                  📍 {shop?.zone || 'Oberá'}
                                </span>
                                <span className="text-[9px] bg-[#5CE1B2]/25 text-[#5CE1B2] px-2 py-0.5 rounded-full font-black border border-[#5CE1B2]/30">
                                  #{offer.category}
                                </span>
                              </div>
                            </div>

                            {/* Floating Price Tag Banner */}
                            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-2xl flex items-center justify-between gap-3">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-zinc-400 line-through">Antes: ${offer.originalPrice.toLocaleString('es-AR')}</span>
                                <span className="text-base font-display font-black text-[#5CE1B2] leading-none mt-1">
                                  ${offer.discountPrice.toLocaleString('es-AR')}
                                </span>
                              </div>

                              {offer.hasQrCoupon && onOpenCoupon ? (
                                <button
                                  onClick={() => onOpenCoupon(offer)}
                                  className="bg-[#5CE1B2] hover:bg-emerald-400 text-zinc-950 font-black text-[11px] uppercase tracking-wider px-3.5 py-2.5 rounded-xl transition-all shadow-md shrink-0 cursor-pointer flex items-center gap-1"
                                >
                                  <QrCode className="w-3.5 h-3.5" /> Obtener QR
                                </button>
                              ) : (
                                <button
                                  onClick={() => onOpenOffer(offer)}
                                  className="bg-white text-zinc-950 font-bold text-[10px] px-3 py-2 rounded-lg"
                                >
                                  Ver Más
                                </button>
                              )}
                            </div>

                          </div>

                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* TikTok Bottom Mockup Controls (Navigation) */}
                <div className="bg-zinc-950/95 border-t border-zinc-900 p-3 flex items-center justify-between z-30">
                  <button 
                    onClick={() => {
                      setActiveTikTokIndex(prev => (prev === 0 ? filteredOffers.length - 1 : prev - 1));
                    }}
                    className="text-white hover:text-[#5CE1B2] text-xs font-black uppercase px-3 py-1.5 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 cursor-pointer"
                  >
                    ◀ Anterior
                  </button>
                  <span className="text-[10px] text-zinc-500 font-bold">
                    Reel {activeTikTokIndex + 1} de {filteredOffers.length}
                  </span>
                  <button 
                    onClick={() => {
                      setActiveTikTokIndex(prev => (prev === filteredOffers.length - 1 ? 0 : prev + 1));
                    }}
                    className="text-white hover:text-[#5CE1B2] text-xs font-black uppercase px-3 py-1.5 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 cursor-pointer"
                  >
                    Siguiente ▶
                  </button>
                </div>

              </div>

              {/* TikTok Swipe helper text */}
              <p className="text-center text-[10px] text-slate-400 dark:text-zinc-500 font-bold mt-4 uppercase tracking-widest flex items-center justify-center gap-2 select-none">
                <Sparkles className="w-3.5 h-3.5 text-[#5CE1B2]" /> Tocá anterior/siguiente para explorar ofertas de Oberá
              </p>

            </div>
          )}
        </>
      )}

    </div>
  );
}
