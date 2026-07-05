import React, { useState, useMemo } from 'react';
import { Filter, SlidersHorizontal, MapPin, Tag, QrCode, Search, Percent, ArrowRight, CornerDownRight, Landmark } from 'lucide-react';
import { Offer, Shop } from '../types';
import { ZONES, CATEGORIES_STORY } from '../data';

interface CategoriesTabProps {
  offers: Offer[];
  shops: Shop[];
  onOpenOffer: (offer: Offer) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

export default function CategoriesTab({
  offers,
  shops,
  onOpenOffer,
  selectedCategory,
  setSelectedCategory
}: CategoriesTabProps) {
  const [selectedZone, setSelectedZone] = useState<string>('Todos');
  const [maxPrice, setMaxPrice] = useState<number>(350000);
  const [onlyQr, setOnlyQr] = useState<boolean>(false);

  // Dynamic values based on active dataset
  const maxOfferPrice = useMemo(() => {
    if (offers.length === 0) return 300000;
    return Math.max(...offers.map(o => o.discountPrice));
  }, [offers]);

  // Set the slide range correctly
  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedZone('Todos');
    setMaxPrice(maxOfferPrice + 50000);
    setOnlyQr(false);
  };

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

  return (
    <div className="space-y-8 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-colors">
      
      {/* Search and Advanced Filters container */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
        
        {/* Category horizontal badges */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block mb-2.5">
            Categoría del Producto
          </label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
            {CATEGORIES_STORY.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === 'all' ? 'all' : cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 border transition-all cursor-pointer flex items-center gap-1.5 ${
                  (selectedCategory === cat.id || (selectedCategory === 'all' && cat.id === 'all'))
                    ? 'bg-brand-orange dark:bg-indigo-600 border-brand-orange dark:border-indigo-600 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-zinc-800 border-slate-200/60 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700/80'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Oberá Zone selectors */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block mb-2.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" /> Zona comercial en Oberá
          </label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
            {ZONES.map((zone) => (
              <button
                key={zone}
                onClick={() => setSelectedZone(zone)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 border transition-all cursor-pointer ${
                  selectedZone === zone
                    ? 'bg-slate-900 dark:bg-zinc-100 border-slate-900 dark:border-zinc-100 text-white dark:text-zinc-900'
                    : 'bg-slate-50 dark:bg-zinc-800 border-slate-200/60 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700/80'
                }`}
              >
                {zone === 'Todos' ? '📍 Todas las Zonas' : zone}
              </button>
            ))}
          </div>
        </div>

        {/* Price Slider */}
        <div className="pt-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 dark:text-zinc-500 mb-2">
            <span className="uppercase tracking-wider">Precio Máximo</span>
            <span className="text-brand-orange dark:text-indigo-400 text-sm font-display font-black">
              ${maxPrice.toLocaleString('es-AR')} ARS
            </span>
          </div>
          <input
            type="range"
            min="1000"
            max={maxOfferPrice + 20000}
            step="1000"
            value={maxPrice}
            onChange={(e) => setMaxPrice(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-orange dark:accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-bold mt-1.5">
            <span>$1.000</span>
            <span>${(maxOfferPrice + 20000).toLocaleString('es-AR')}</span>
          </div>
        </div>

        {/* QR Exclusives Toggle & Clear filters */}
        <div className="flex items-center justify-between border-t border-slate-50 dark:border-zinc-800 pt-4 gap-4">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyQr}
              onChange={(e) => setOnlyQr(e.target.checked)}
              className="w-4 h-4 rounded-md border-slate-300 dark:border-zinc-700 text-brand-orange dark:text-indigo-500 focus:ring-brand-orange dark:focus:ring-indigo-500 accent-brand-orange dark:accent-indigo-500"
            />
            <span className="text-xs text-slate-700 dark:text-zinc-300 font-bold flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-brand-orange dark:text-indigo-400" />
              Exclusivos con Cupón QR
            </span>
          </label>

          <button
            onClick={handleResetFilters}
            className="text-xs text-brand-orange dark:text-indigo-400 font-bold hover:underline cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex justify-between items-center px-1">
        <h3 className="text-xs font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
          Catálogo: {filteredOffers.length} {filteredOffers.length === 1 ? 'oferta disponible' : 'ofertas disponibles'}
        </h3>
        
        {selectedCategory !== 'all' && (
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
            Filtrado
          </span>
        )}
      </div>

      {/* Grid List - FULLY RESPONSIVE */}
      {filteredOffers.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-12 text-center shadow-xs">
          <p className="text-base font-display font-extrabold text-slate-800 dark:text-zinc-200 mb-2">No encontramos resultados</p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-xs mx-auto mb-4">
            Probá ajustando los filtros de precio o seleccionando otra zona en Oberá para ver más descuentos.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-brand-orange dark:bg-indigo-600 text-white text-xs font-extrabold rounded-xl shadow-xs cursor-pointer hover:bg-brand-orange/95 dark:hover:bg-indigo-700"
          >
            Mostrar Todo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredOffers.map((offer) => {
            const shop = shops.find(s => s.id === offer.shopId);
            const discountPercentage = Math.round(((offer.originalPrice - offer.discountPrice) / offer.originalPrice) * 100);

            return (
              <div
                key={offer.id}
                onClick={() => onOpenOffer(offer)}
                className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between group"
              >
                {/* Thumb */}
                <div className="relative h-40 bg-slate-50 dark:bg-zinc-950 overflow-hidden">
                  <img
                    src={offer.image}
                    alt={offer.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent" />
                  
                  {/* Floating tags */}
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm">
                    -{discountPercentage}%
                  </div>

                  {offer.hasQrCoupon && (
                    <div className="absolute bottom-2 right-2 bg-indigo-600 dark:bg-indigo-500 text-white p-1 rounded-md shadow-md" title="Incluye cupón QR">
                      <QrCode className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Shop label inside image */}
                  <span className="absolute bottom-2 left-2 text-[10px] font-extrabold text-white bg-black/40 px-1.5 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1 border border-white/10">
                    <span>{shop?.logo}</span>
                    <span className="line-clamp-1">{shop?.name}</span>
                  </span>
                </div>

                {/* Info body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white dark:bg-zinc-900">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 line-clamp-2 leading-snug group-hover:text-brand-orange dark:group-hover:text-indigo-400 transition-colors">
                      {offer.title}
                    </h4>
                  </div>

                  {/* Pricing row & arrow */}
                  <div className="flex items-center justify-between border-t border-slate-50 dark:border-zinc-800/80 pt-2.5">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 line-through">
                        ${offer.originalPrice.toLocaleString('es-AR')}
                      </span>
                      <span className="text-sm font-display font-black text-red-500 dark:text-red-400 leading-none mt-0.5">
                        ${offer.discountPrice.toLocaleString('es-AR')}
                      </span>
                    </div>

                    <span className="p-1.5 bg-slate-50 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 text-slate-400 dark:text-zinc-500 group-hover:text-brand-orange dark:group-hover:text-indigo-400 rounded-lg border border-slate-100 dark:border-zinc-700 transition-all shrink-0">
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
