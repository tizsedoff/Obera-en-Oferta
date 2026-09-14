import React from 'react';
import { MapPin, ChevronRight, Tag } from 'lucide-react';
import { Shop, Offer } from '../types';
import ShopLogo from './ShopLogo';

interface ShopsDirectoryProps {
  shops: Shop[];
  offers: Offer[];
  onSelectShop: (shop: Shop) => void;
}

export default function ShopsDirectory({ shops, offers, onSelectShop }: ShopsDirectoryProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-24 space-y-5 animate-slide-up">
      <div className="pt-2">
        <h2 className="font-display font-black text-2xl text-slate-900 dark:text-zinc-50">Negocios Adheridos</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          {shops.length} {shops.length === 1 ? 'comercio' : 'comercios'} en Oberá en Oferta
        </p>
      </div>

      {shops.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-2xl">
            🏪
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400 font-semibold">
            Todavía no hay negocios registrados.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shops.map((shop) => {
            const activeOffersCount = offers.filter(o => o.shopId === shop.id).length;
            return (
              <button
                key={shop.id}
                onClick={() => onSelectShop(shop)}
                className="w-full flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-2xl shadow-xs hover:shadow-md hover:border-brand-orange/30 dark:hover:border-indigo-500/30 transition-all duration-300 text-left cursor-pointer group"
              >
                <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                  <ShopLogo logo={shop.logo} className="text-2xl" fallbackSize="w-12 h-12" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-slate-900 dark:text-zinc-50 text-sm truncate">
                      {shop.name}
                    </h3>
                    <span className={`shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                      shop.isOpen
                        ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-500'
                    }`}>
                      {shop.isOpen ? 'Abierto' : 'Cerrado'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium mt-0.5">{shop.category}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-1 truncate">
                    <MapPin className="w-3 h-3 shrink-0" /> {shop.address}
                  </p>
                  {activeOffersCount > 0 && (
                    <p className="text-[10px] text-brand-orange dark:text-indigo-400 font-bold flex items-center gap-1 mt-1.5">
                      <Tag className="w-3 h-3" /> {activeOffersCount} {activeOffersCount === 1 ? 'oferta activa' : 'ofertas activas'}
                    </p>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-zinc-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
