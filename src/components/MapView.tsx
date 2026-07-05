import React, { useState } from 'react';
import { MapPin, Navigation, Info, Store, Compass, Eye, Filter, CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import { Shop, Offer } from '../types';

interface MapViewProps {
  shops: Shop[];
  offers: Offer[];
  onSelectOffer: (offer: Offer) => void;
}

export default function MapView({ shops, offers, onSelectOffer }: MapViewProps) {
  const [selectedShopId, setSelectedShopId] = useState<string | null>('shop-1');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [mapCategory, setMapCategory] = useState<string>('Todos');

  // Realistic Oberá coordinates adapted to a grid layout on a 100% responsive canvas
  const shopCoordinates: Record<string, { x: number; y: number }> = {
    'shop-1': { x: 42, y: 35 }, // Yerba Mate & Delicias - Av. Sarmiento
    'shop-2': { x: 58, y: 48 }, // Misiones Style - Av. Libertad
    'shop-3': { x: 32, y: 65 }, // Super El Condor - Av. Italia
    'shop-4': { x: 50, y: 50 }, // Electro Oberá - Plaza San Martin (Center)
    'shop-5': { x: 44, y: 22 }, // Heladeria Polar - Av. Sarmiento
    'shop-6': { x: 62, y: 55 }, // Calzados Carhue - Av. Libertad
  };

  const filteredShops = shops.filter(shop => {
    if (onlyOpen && !shop.isOpen) return false;
    if (mapCategory !== 'Todos' && shop.category !== mapCategory) return false;
    return true;
  });

  const selectedShop = shops.find(s => s.id === selectedShopId);
  const selectedShopOffers = offers.filter(o => o.shopId === selectedShopId);

  const getPinColor = (category: string) => {
    switch (category) {
      case 'Gastronomía': return 'bg-orange-500 shadow-orange-500/30 text-white';
      case 'Indumentaria': return 'bg-red-500 shadow-red-500/30 text-white';
      case 'Supermercados': return 'bg-emerald-500 shadow-emerald-500/30 text-white';
      case 'Electro': return 'bg-blue-500 shadow-blue-500/30 text-white';
      default: return 'bg-slate-500 shadow-slate-500/30 text-white';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 transition-colors">
      
      {/* Search and Filters row */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <Compass className="w-5 h-5 text-brand-orange dark:text-indigo-400 animate-spin-slow" />
            <div>
              <h3 className="font-display font-bold text-slate-900 dark:text-zinc-100 text-sm">Geolocalizador de Comercios</h3>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold">Explorá ofertas de Oberá caminando la ciudad</p>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setOnlyOpen(!onlyOpen)}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                onlyOpen
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200/60 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" /> Abiertos
            </button>

            <select
              value={mapCategory}
              onChange={(e) => setMapCategory(e.target.value)}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 focus:outline-hidden cursor-pointer"
            >
              <option value="Todos">Todas las Categorías</option>
              <option value="Gastronomía">Gastronomía</option>
              <option value="Indumentaria">Indumentaria</option>
              <option value="Supermercados">Supermercados</option>
              <option value="Electro">Electro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stylized Vector Map Canvas */}
      <div className="relative w-full aspect-[4/3] md:aspect-[16/9] bg-[#faf6f0] dark:bg-zinc-950 border border-orange-100/50 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-inner flex flex-col justify-end transition-colors duration-300">
        {/* Red dirt clay accent at top to represent Tierra Colorada of Misiones */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-orange via-brand-red to-orange-400 dark:from-indigo-600 dark:to-cyan-400" />
        
        {/* Custom Stylized Map Grid Overlay */}
        <svg className="absolute inset-0 w-full h-full text-orange-200/25 dark:text-zinc-800/40 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-map" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-map)" />

          {/* Draw stylized major avenues representing Oberá streets */}
          {/* Avenida Sarmiento (diagonal running left to right) */}
          <line x1="10%" y1="10%" x2="90%" y2="90%" stroke="currentColor" strokeWidth="18" strokeLinecap="round" className="text-amber-100/70 dark:text-zinc-900/90" />
          <line x1="10%" y1="10%" x2="90%" y2="90%" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeDasharray="4 4" className="text-white dark:text-zinc-850/50" />
          
          {/* Avenida Libertad (intersecting diagonal) */}
          <line x1="90%" y1="10%" x2="10%" y2="90%" stroke="currentColor" strokeWidth="18" strokeLinecap="round" className="text-amber-100/70 dark:text-zinc-900/90" />
          <line x1="90%" y1="10%" x2="10%" y2="90%" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeDasharray="4 4" className="text-white dark:text-zinc-850/50" />

          {/* Avenida Italia */}
          <line x1="10%" y1="65%" x2="90%" y2="65%" stroke="currentColor" strokeWidth="14" strokeLinecap="round" className="text-amber-100/70 dark:text-zinc-900/90" />
          <line x1="10%" y1="65%" x2="90%" y2="65%" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-white dark:text-zinc-850/50" />
        </svg>

        {/* Major Landmarks */}
        {/* Central Hub: Plaza San Martín */}
        <div className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border-2 border-emerald-400 flex items-center justify-center text-sm shadow-md animate-pulse">
            🌳
          </div>
          <span className="text-[9px] bg-slate-950/75 dark:bg-zinc-900/95 text-white px-2 py-0.5 rounded-full font-bold mt-1 shadow-xs tracking-wider uppercase">
            Plaza San Martín
          </span>
        </div>

        {/* Tourist landmark 1: Jardin de los Pajaros */}
        <div className="absolute left-[15%] top-[15%] flex flex-col items-center">
          <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-xs shadow-xs">
            🐦
          </div>
          <span className="text-[8px] bg-blue-900/70 dark:bg-blue-950 text-white px-1.5 py-0.5 rounded-md font-bold mt-0.5 uppercase tracking-wide">
            Jardín Pájaros
          </span>
        </div>

        {/* Tourist landmark 2: Parque de las Naciones */}
        <div className="absolute right-[12%] bottom-[15%] flex flex-col items-center">
          <div className="h-8 w-8 rounded-full bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 flex items-center justify-center text-xs shadow-xs">
            🏰
          </div>
          <span className="text-[8px] bg-amber-900/70 dark:bg-amber-950 text-white px-1.5 py-0.5 rounded-md font-bold mt-0.5 uppercase tracking-wide">
            Parque Naciones
          </span>
        </div>

        {/* Interactive Shop Pins */}
        {filteredShops.map((shop) => {
          const coord = shopCoordinates[shop.id] || { x: 50, y: 50 };
          const isSelected = selectedShopId === shop.id;
          return (
            <button
              key={shop.id}
              onClick={() => setSelectedShopId(shop.id)}
              className="absolute group transition-transform hover:scale-110 duration-200 cursor-pointer"
              style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
            >
              <div className="flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
                <div className={`p-1.5 rounded-xl border-2 border-white dark:border-zinc-900 shadow-lg flex items-center justify-center transition-all ${
                  isSelected ? 'scale-120 ring-4 ring-brand-orange/35' : ''
                } ${getPinColor(shop.category)}`}>
                  <span className="text-sm">{shop.logo}</span>
                </div>
                {/* Micro pointer triangle */}
                <div className={`w-2 h-2 rotate-45 border-r border-b border-white dark:border-zinc-900 bg-current -mt-1 ${
                  isSelected ? 'text-brand-orange' : 'text-slate-600 dark:text-zinc-500'
                }`} />

                {/* Hover bubble */}
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-10 bg-slate-900 dark:bg-zinc-800 text-white text-[9px] font-bold px-2.5 py-1 rounded-lg pointer-events-none transition-opacity whitespace-nowrap shadow-md z-30">
                  {shop.name}
                </div>
              </div>
            </button>
          );
        })}

        {/* Compass / Map Legend overlay */}
        <div className="absolute left-3 top-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-3 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm text-[9px] font-bold text-slate-600 dark:text-zinc-400 space-y-1">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Gastronomía</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Indumentaria</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Supermercados</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Electro</div>
        </div>
      </div>

      {/* Selected Shop Drawer */}
      {selectedShop && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-5 shadow-md space-y-4 animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 shadow-inner rounded-2xl">
                {selectedShop.logo}
              </span>
              <div>
                <h4 className="font-display font-extrabold text-slate-900 dark:text-zinc-50 text-base">{selectedShop.name}</h4>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase">{selectedShop.category}</span>
                  <span className="text-slate-200 dark:text-zinc-700">•</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-0.5">
                    ⭐ {selectedShop.rating}
                  </span>
                  <span className="text-slate-200 dark:text-zinc-700">•</span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                    selectedShop.isOpen ? 'text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400' : 'text-slate-500 bg-slate-50 dark:bg-zinc-800'
                  }`}>
                    {selectedShop.isOpen ? 'Abierto' : 'Cerrado'}
                  </span>
                </div>
              </div>
            </div>

            <a
              href={`https://wa.me/${selectedShop.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-center"
            >
              Contactar por WhatsApp
            </a>
          </div>

          <div className="border-t border-slate-50 dark:border-zinc-800/80 pt-4">
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase block mb-3.5">Ofertas Disponibles en este local</span>
            
            {selectedShopOffers.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No hay ofertas publicadas para este local actualmente.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedShopOffers.map((offer) => (
                  <div
                    key={offer.id}
                    onClick={() => onSelectOffer(offer)}
                    className="p-3 bg-slate-50 dark:bg-zinc-950 hover:bg-indigo-50/10 dark:hover:bg-zinc-800 border border-slate-100 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={offer.image}
                        alt={offer.title}
                        className="w-12 h-12 object-cover rounded-xl shrink-0 border border-slate-100 dark:border-zinc-800"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-snug group-hover:text-brand-orange dark:group-hover:text-indigo-400 transition-colors">
                          {offer.title}
                        </h5>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs font-black text-red-500 dark:text-red-400">
                            ${offer.discountPrice.toLocaleString('es-AR')}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 line-through">
                            ${offer.originalPrice.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="p-1.5 bg-white dark:bg-zinc-900 text-slate-400 group-hover:text-brand-orange dark:group-hover:text-indigo-400 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-xs transition-colors shrink-0">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
