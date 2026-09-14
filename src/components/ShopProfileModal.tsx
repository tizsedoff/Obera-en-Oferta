import React from 'react';
import { X, MapPin, Phone, MessageCircle, Map as MapIcon, Percent } from 'lucide-react';
import { Shop, Offer } from '../types';
import ShopLogo from './ShopLogo';

interface ShopProfileModalProps {
  shop: Shop;
  offers: Offer[];
  onClose: () => void;
  onSelectOffer: (offer: Offer) => void;
  onViewOnMap: (shopId: string) => void;
}

export default function ShopProfileModal({ shop, offers, onClose, onSelectOffer, onViewOnMap }: ShopProfileModalProps) {
  const shopOffers = offers.filter(o => o.shopId === shop.id);
  const whatsappUrl = `https://wa.me/${shop.phone || '543755400000'}?text=${encodeURIComponent(
    `¡Hola! Vi tu negocio "${shop.name}" en la plataforma "Oberá en Oferta" y me gustaría hacerte una consulta.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 dark:bg-zinc-950/85 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-zinc-800 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-slate-900 to-slate-850 dark:from-zinc-950 dark:to-zinc-900 p-6 shrink-0">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 pr-10">
            <div className="h-16 w-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden shrink-0">
              <ShopLogo logo={shop.logo} className="text-3xl" fallbackSize="w-14 h-14" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display font-black text-xl text-white truncate">{shop.name}</h2>
                <span className={`shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full ${
                  shop.isOpen ? 'bg-green-500/80 text-white' : 'bg-slate-500/80 text-white'
                }`}>
                  {shop.isOpen ? 'Abierto' : 'Cerrado'}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-semibold mt-0.5">{shop.category}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Info */}
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-zinc-300">
              <MapPin className="w-4 h-4 text-brand-orange dark:text-indigo-400 mt-0.5 shrink-0" />
              <span>{shop.address}</span>
            </div>
            {shop.phone && (
              <div className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-zinc-300">
                <Phone className="w-4 h-4 text-brand-orange dark:text-indigo-400 mt-0.5 shrink-0" />
                <span>{shop.phone}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" /> Consultar
            </a>
            <button
              onClick={() => onViewOnMap(shop.id)}
              className="py-2.5 bg-brand-orange hover:bg-brand-orange/95 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer"
            >
              <MapIcon className="w-4 h-4" /> Ver en mapa
            </button>
          </div>

          {/* Offers list */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Ofertas activas ({shopOffers.length})
            </h4>

            {shopOffers.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium py-4 text-center">
                Este negocio no tiene ofertas activas por el momento.
              </p>
            ) : (
              <div className="space-y-2">
                {shopOffers.map((offer) => {
                  const discountPct = Math.round(((offer.originalPrice - offer.discountPrice) / offer.originalPrice) * 100);
                  return (
                    <button
                      key={offer.id}
                      onClick={() => onSelectOffer(offer)}
                      className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl hover:border-brand-orange/30 dark:hover:border-indigo-500/30 transition-colors text-left cursor-pointer"
                    >
                      <img
                        src={offer.image}
                        alt={offer.title}
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">{offer.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-black text-red-500 dark:text-red-400">
                            ${offer.discountPrice.toLocaleString('es-AR')}
                          </span>
                          <span className="text-[10px] text-slate-400 line-through">
                            ${offer.originalPrice.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                      <span className="shrink-0 text-[10px] font-black text-red-500 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded-lg flex items-center gap-0.5">
                        <Percent className="w-2.5 h-2.5" /> {discountPct}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
