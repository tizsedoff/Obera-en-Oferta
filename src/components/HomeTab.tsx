import React from 'react';
import { ArrowRight, QrCode, Sparkles, Flame, Percent, Star, Compass, LayoutGrid } from 'lucide-react';
import { Offer, Shop } from '../types';
import { CATEGORIES_STORY } from '../data';

interface HomeTabProps {
  offers: Offer[];
  shops: Shop[];
  onOpenCoupon: (offer: Offer) => void;
  onOpenOffer: (offer: Offer) => void;
  onSelectCategoryStory: (category: string) => void;
  onSelectShopOnMap: (shopId: string) => void;
}

export default function HomeTab({
  offers,
  shops,
  onOpenCoupon,
  onOpenOffer,
  onSelectCategoryStory,
  onSelectShopOnMap
}: HomeTabProps) {
  // Filter offers
  const qrOffers = offers.filter(o => o.hasQrCoupon);
  const flashOffers = offers.filter(o => o.isFlashSale);

  return (
    <div className="space-y-10 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-colors">
      
      {/* 1. STORIES/QUICK LINKS CIRCLES */}
      <section className="space-y-4">
        <h3 className="font-display font-extrabold text-slate-900 dark:text-zinc-50 text-sm tracking-wide uppercase flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-orange dark:text-indigo-400" />
          Categorías Destacadas
        </h3>
        <div className="flex gap-5 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth snap-x snap-mandatory">
          {CATEGORIES_STORY.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategoryStory(cat.id)}
              className="flex flex-col items-center gap-2 shrink-0 snap-start focus:outline-hidden group cursor-pointer"
            >
              <div className={`h-16 w-16 rounded-full border-2 p-0.5 flex items-center justify-center transition-transform group-hover:scale-105 ${cat.color} dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs`}>
                <span className="text-3xl filter drop-shadow-sm">{cat.emoji}</span>
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 tracking-tight group-hover:text-brand-orange dark:group-hover:text-indigo-400 transition-colors">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 2. "OFERTAS CON CUPÓN QR" CAROUSEL */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h3 className="font-display font-black text-slate-900 dark:text-zinc-50 text-lg flex items-center gap-2">
            <span className="p-1 bg-indigo-50 dark:bg-zinc-800 text-brand-orange dark:text-indigo-400 rounded-lg">🎟️</span>
            Ofertas con Cupón QR
          </h3>
          <span className="text-xs font-bold text-brand-orange dark:text-indigo-400 flex items-center gap-1">
            Descuentos directos en caja
          </span>
        </div>

        <div className="flex gap-5 overflow-x-auto pb-4 pt-1 no-scrollbar snap-x snap-mandatory">
          {qrOffers.map((offer) => {
            const shop = shops.find(s => s.id === offer.shopId);
            const discountPercentage = Math.round(((offer.originalPrice - offer.discountPrice) / offer.originalPrice) * 100);

            return (
              <div
                key={offer.id}
                className="w-[280px] sm:w-[320px] shrink-0 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 snap-start flex flex-col justify-between"
              >
                {/* Image & overlay */}
                <div className="relative h-44 bg-slate-100 dark:bg-zinc-950 overflow-hidden">
                  <img
                    src={offer.image}
                    alt={offer.title}
                    className="w-full h-full object-cover hover:scale-103 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                  
                  {/* Category logo */}
                  <div className="absolute top-3 left-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs text-slate-800 dark:text-zinc-200 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1.5 border border-slate-200/50 dark:border-zinc-700">
                    <span>{shop?.logo || '🏪'}</span>
                    <span className="text-[10px] tracking-tight">{offer.category}</span>
                  </div>

                  {/* Discount percentage tag */}
                  <div className="absolute top-3 right-3 bg-red-500 dark:bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-xl shadow-xs">
                    {discountPercentage}% OFF
                  </div>

                  {/* Shop name overlay */}
                  <span className="absolute bottom-3 left-3 text-xs font-extrabold text-orange-200 dark:text-indigo-200 uppercase tracking-wider drop-shadow-xs">
                    {offer.shopName}
                  </span>
                </div>

                {/* Body Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white dark:bg-zinc-900">
                  <div>
                    <h4
                      onClick={() => onOpenOffer(offer)}
                      className="font-display font-bold text-slate-900 dark:text-zinc-100 text-sm leading-snug line-clamp-2 hover:text-brand-orange dark:hover:text-indigo-400 cursor-pointer transition-colors"
                    >
                      {offer.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 line-clamp-2">{offer.description}</p>
                  </div>

                  {/* Price Row */}
                  <div className="flex items-baseline gap-2 pt-1 border-t border-slate-50 dark:border-zinc-800/80">
                    <span className="text-lg font-display font-black text-red-500 dark:text-red-400">
                      ${offer.discountPrice.toLocaleString('es-AR')}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-zinc-500 line-through">
                      ${offer.originalPrice.toLocaleString('es-AR')}
                    </span>
                  </div>

                  {/* Action button */}
                  <button
                    onClick={() => onOpenCoupon(offer)}
                    className="w-full py-2.5 bg-brand-orange hover:bg-brand-orange/95 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-500/10 cursor-pointer transition-colors"
                  >
                    <QrCode className="w-4 h-4" /> Obtener Cupón QR
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. "OFERTAS DEL DÍA" (FLASH SALES) CAROUSEL */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-black text-slate-900 dark:text-zinc-50 text-lg flex items-center gap-2">
            <span className="p-1 bg-red-50 dark:bg-zinc-800 text-brand-red rounded-lg">🔥</span>
            Ofertas del Día (Flash Sales)
          </h3>
          <span className="text-[10px] px-2 py-0.5 bg-red-100 dark:bg-red-950/50 text-brand-red dark:text-red-400 font-bold rounded-full animate-pulse uppercase tracking-wider">
            Expira Hoy
          </span>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar snap-x snap-mandatory">
          {flashOffers.map((offer) => {
            const discountPercentage = Math.round(((offer.originalPrice - offer.discountPrice) / offer.originalPrice) * 100);

            return (
              <div
                key={offer.id}
                className="w-[200px] shrink-0 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-sm transition-all snap-start flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative h-32 bg-slate-50 dark:bg-zinc-950">
                    <img
                      src={offer.image}
                      alt={offer.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 right-2 bg-red-500 dark:bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md">
                      -{discountPercentage}%
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-3 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                      {offer.shopName}
                    </span>
                    <h4
                      onClick={() => onOpenOffer(offer)}
                      className="text-xs font-bold text-slate-800 dark:text-zinc-200 line-clamp-2 leading-tight hover:text-brand-orange dark:hover:text-indigo-400 cursor-pointer transition-colors"
                    >
                      {offer.title}
                    </h4>
                  </div>
                </div>

                {/* Price and Action Footer */}
                <div className="p-3 pt-0">
                  <div className="flex flex-col mb-2 pt-2 border-t border-slate-50 dark:border-zinc-800/50">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 line-through">
                      ${offer.originalPrice.toLocaleString('es-AR')}
                    </span>
                    <span className="text-xs font-display font-extrabold text-red-500 dark:text-red-400">
                      ${offer.discountPrice.toLocaleString('es-AR')}
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenOffer(offer)}
                    className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-slate-700 dark:text-zinc-300 font-bold text-[10px] border border-slate-100 dark:border-zinc-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Ver Oferta
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. "LOCALES DESTACADOS" GRID - FULLY RESPONSIVE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-black text-slate-900 dark:text-zinc-50 text-lg flex items-center gap-2">
            <span className="p-1 bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 rounded-lg">🏪</span>
            Locales Destacados en Oberá
          </h3>
          <span className="text-xs font-bold text-slate-400 dark:text-zinc-500">Tierra colorada</span>
        </div>

        {/* CSS GRID: 2 columns on mobile, 3 columns on tablet, 4-5 columns on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {shops.map((shop) => (
            <div
              key={shop.id}
              onClick={() => onSelectShopOnMap(shop.id)}
              className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-5 flex flex-col items-center text-center justify-between gap-4 shadow-xs hover:shadow-md hover:border-indigo-100 dark:hover:border-zinc-700 cursor-pointer transition-all duration-300"
            >
              <div className="flex flex-col items-center gap-3">
                <span className="text-4xl p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-inner">
                  {shop.logo}
                </span>
                <div>
                  <h4 className="font-display font-bold text-xs text-slate-800 dark:text-zinc-200 leading-tight line-clamp-2">
                    {shop.name}
                  </h4>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5 block">
                    {shop.category}
                  </span>
                </div>
              </div>

              <div className="w-full flex items-center justify-between pt-3 border-t border-slate-50 dark:border-zinc-800/80">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-0.5">
                  ⭐ {shop.rating}
                </span>
                
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                  shop.isOpen 
                    ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400' 
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                }`}>
                  {shop.isOpen ? 'Abierto' : 'Cerrado'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
