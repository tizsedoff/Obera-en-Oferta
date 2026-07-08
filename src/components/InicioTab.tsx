import React from 'react';
import { 
  Sparkles, 
  Map, 
  Grid, 
  Flame, 
  ArrowRight, 
  Compass, 
  Store, 
  TrendingUp, 
  Clock, 
  QrCode,
  MapPin
} from 'lucide-react';
import { motion } from 'motion/react';
import { Offer, Shop, Category, SiteConfig } from '../types';
import ShopLogo from './ShopLogo';

interface InicioTabProps {
  offers: Offer[];
  shops: Shop[];
  categories: Category[];
  siteConfig: SiteConfig;
  onOpenOffer: (offer: Offer) => void;
  onOpenCoupon: (offer: Offer) => void;
  onSelectCategoryStory: (category: string) => void;
  onSelectShopOnMap: (shopId: string) => void;
  setActiveTab: (tab: any) => void;
}

export default function InicioTab({
  offers,
  shops,
  categories,
  siteConfig,
  onOpenOffer,
  onOpenCoupon,
  onSelectCategoryStory,
  onSelectShopOnMap,
  setActiveTab
}: InicioTabProps) {
  
  // Highlight flash sales and other high discount offers
  const featuredOffers = offers.filter(o => o.isFlashSale).slice(0, 3);
  const otherOffers = offers.filter(o => !o.isFlashSale).slice(0, 4);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24 space-y-8 animate-in fade-in duration-300">
      
      {/* Dynamic Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-zinc-900 to-indigo-950 text-white p-6 sm:p-8 border border-indigo-500/10 shadow-xl">
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-80 h-80 bg-[#5CE1B2]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl animate-pulse duration-3000" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-black uppercase tracking-wider text-[#5CE1B2]">
              <Sparkles className="w-3.5 h-3.5 fill-[#5CE1B2]/20 text-[#5CE1B2]" /> ¡Estás en {siteConfig.appTitle}!
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-[#5CE1B2] to-indigo-300">
              {siteConfig.appSubtitle}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-350 leading-relaxed max-w-xl font-medium">
              Explorá cupones gratis, ofertas flash de comercios locales y recorré la ciudad interactiva geolocalizada en tiempo real. ¡Todo listo para ahorrar!
            </p>
          </div>
          <span className="text-5xl sm:text-6xl self-end md:self-center select-none animate-bounce">{siteConfig.welcomeEmoji}</span>
        </div>
      </div>

      {/* Circle Category Stories Bar */}
      <div className="space-y-3">
        <div className="flex justify-between items-baseline">
          <h3 className="font-display font-black text-xs uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-[#5CE1B2]" /> Explorar Categorías
          </h3>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map((cat) => {
            const count = cat.id === 'all' 
              ? offers.length 
              : offers.filter(o => o.category === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategoryStory(cat.id)}
                className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0 transition-all hover:scale-105"
              >
                <div className={`w-14 h-14 rounded-full border-2 border-slate-200 dark:border-zinc-800 flex items-center justify-center text-2xl shadow-sm bg-white dark:bg-zinc-900 transition-all group-hover:border-emerald-400`}>
                  {cat.emoji}
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-extrabold text-slate-800 dark:text-zinc-350 block leading-tight">
                    {cat.name}
                  </span>
                  <span className="text-[9px] text-slate-450 dark:text-zinc-500 font-bold block">
                    {count} {count === 1 ? 'oferta' : 'ofertas'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Quick Links (Feed, Map, Categories) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Immersive Feed Card */}
        <div 
          onClick={() => setActiveTab('feed')}
          className="relative group overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white p-5 shadow-md hover:shadow-xl cursor-pointer transition-all duration-300 border border-orange-400/20"
        >
          {/* Animated Wave visual */}
          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-36 h-36 bg-white/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
          
          <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-[9px] font-black uppercase tracking-wider">
                🍿 Pantalla Completa
              </span>
              <h3 className="font-display font-black text-lg leading-tight tracking-tight">
                Ir al Feed de Descuentos
              </h3>
              <p className="text-[11px] text-red-100 font-semibold leading-normal">
                Desliza ofertas al instante estilo videos, dale me gusta, guardá tus favoritos y canjeá códigos QR directos.
              </p>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider self-start group-hover:translate-x-1.5 transition-transform duration-300">
              Ver Feed 🔥 <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Interactive Google Map Card */}
        <div 
          onClick={() => setActiveTab('map')}
          className="relative group overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white p-5 shadow-md hover:shadow-xl cursor-pointer transition-all duration-300 border border-indigo-400/20"
        >
          {/* Animated Wave visual */}
          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-36 h-36 bg-white/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />

          <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-[9px] font-black uppercase tracking-wider">
                🗺️ Mapa Real Conectado
              </span>
              <h3 className="font-display font-black text-lg leading-tight tracking-tight">
                Mapa Interactivo Oberá
              </h3>
              <p className="text-[11px] text-indigo-100 font-semibold leading-normal">
                Recorré la ciudad de Oberá por avenidas principales. Ubicá comercios reales y canjeá descuentos desde el mapa.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider self-start group-hover:translate-x-1.5 transition-transform duration-300">
              Abrir Mapa 🗺️ <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

      </div>

      {/* Super Flash Sales Section */}
      {featuredOffers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-black text-xs uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-red-500 animate-bounce" /> Ofertas Flash de Horas
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredOffers.map((offer) => {
              const shop = shops.find(s => s.id === offer.shopId);
              const discountPercentage = Math.round(((offer.originalPrice - offer.discountPrice) / offer.originalPrice) * 100);

              return (
                <div 
                  key={offer.id}
                  onClick={() => onOpenOffer(offer)}
                  className="relative group flex md:flex-col items-center bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl overflow-hidden p-3 gap-3 cursor-pointer shadow-xs hover:border-[#5CE1B2]/50 transition-all"
                >
                  <div className="relative w-20 h-20 md:w-full md:h-32 rounded-xl overflow-hidden shrink-0">
                    <img 
                      src={offer.image} 
                      alt={offer.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                      -{discountPercentage}%
                    </div>
                  </div>

                  <div className="flex-1 md:w-full flex flex-col justify-between leading-tight py-1">
                    <div className="space-y-1">
                      <span className="text-[8px] font-extrabold uppercase tracking-wide text-zinc-400 dark:text-zinc-550 flex items-center gap-1">
                        <ShopLogo logo={shop?.logo} className="text-xs" fallbackSize="w-4 h-4 rounded-md" /> {offer.shopName}
                      </span>
                      <h4 className="text-[11px] md:text-xs font-extrabold text-slate-800 dark:text-zinc-200 line-clamp-2 md:line-clamp-1 leading-snug group-hover:text-[#5CE1B2] transition-colors">
                        {offer.title}
                      </h4>
                    </div>

                    <div className="flex items-baseline gap-1.5 mt-2">
                      <span className="text-xs md:text-sm font-display font-black text-red-500 dark:text-red-400">
                        ${offer.discountPrice.toLocaleString('es-AR')}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 line-through">
                        ${offer.originalPrice.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Hot Offers List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-black text-xs uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Destacados de la semana
          </h3>
          <button 
            onClick={() => setActiveTab('categories')}
            className="text-[10px] font-black uppercase text-brand-orange hover:underline cursor-pointer flex items-center gap-0.5"
          >
            Ver todos <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {otherOffers.map((offer) => {
            const discountPercentage = Math.round(((offer.originalPrice - offer.discountPrice) / offer.originalPrice) * 100);

            return (
              <div
                key={offer.id}
                onClick={() => onOpenOffer(offer)}
                className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div className="relative h-28 bg-slate-50 dark:bg-zinc-950 overflow-hidden">
                  <img 
                    src={offer.image} 
                    alt={offer.title} 
                    className="w-full h-full object-cover group-hover:scale-105 duration-300 transition-transform" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                    -{discountPercentage}%
                  </div>
                </div>
                
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">{offer.shopName}</span>
                    <h4 className="text-[10px] md:text-[11px] font-bold text-slate-800 dark:text-zinc-200 line-clamp-2 leading-tight group-hover:text-brand-orange mt-0.5">{offer.title}</h4>
                  </div>
                  
                  <div className="flex items-baseline gap-1.5 pt-1.5 border-t border-slate-50 dark:border-zinc-800/80">
                    <span className="text-xs font-display font-black text-red-500 dark:text-red-400">${offer.discountPrice.toLocaleString('es-AR')}</span>
                    <span className="text-[9px] text-slate-400 dark:text-zinc-500 line-through">${offer.originalPrice.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
