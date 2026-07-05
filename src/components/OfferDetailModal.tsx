import React from 'react';
import { X, MessageCircle, MapPin, Store, Calendar, CheckCircle, Percent, QrCode } from 'lucide-react';
import { Offer, Shop } from '../types';

interface OfferDetailModalProps {
  offer: Offer;
  shop: Shop | undefined;
  onClose: () => void;
  onOpenCoupon: (offer: Offer) => void;
}

export default function OfferDetailModal({ offer, shop, onClose, onOpenCoupon }: OfferDetailModalProps) {
  const discountPercentage = Math.round(((offer.originalPrice - offer.discountPrice) / offer.originalPrice) * 100);

  // Generate customized WhatsApp pre-filled link
  const shopPhone = shop?.phone || '543755400000';
  const whatsappMessage = `¡Hola! Vi la oferta de "${offer.title}" de tu local "${shop?.name}" en la plataforma "Oberá en Oferta" y me interesaría hacerte una consulta.`;
  const whatsappUrl = `https://wa.me/${shopPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 dark:bg-zinc-950/85 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6 duration-300 border border-slate-100 dark:border-zinc-800">
        
        {/* Header Image section */}
        <div className="relative h-64 sm:h-72 w-full bg-slate-100 dark:bg-zinc-950">
          <img
            src={offer.image}
            alt={offer.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent" />
          
          {/* Close button inside image */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-xs cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Floating discount tag */}
          <div className="absolute top-4 left-4 bg-red-500 dark:bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1">
            <Percent className="w-4 h-4" />
            {discountPercentage}% OFF
          </div>

          {/* Shop details overlay at the bottom of the image */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl px-2 py-0.5 bg-white/20 dark:bg-black/30 rounded-lg backdrop-blur-xs border border-white/10">
                {shop?.logo || '🏪'}
              </span>
              <span className="text-xs font-extrabold uppercase tracking-widest text-orange-200 dark:text-indigo-200 drop-shadow-xs">
                {shop?.name}
              </span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                shop?.isOpen ? 'bg-green-500/80' : 'bg-slate-500/80'
              }`}>
                {shop?.isOpen ? 'Abierto' : 'Cerrado'}
              </span>
            </div>
            <h3 className="font-display font-black text-xl leading-snug drop-shadow-md">
              {offer.title}
            </h3>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Prices block */}
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-display font-black text-red-500 dark:text-red-400">
              ${offer.discountPrice.toLocaleString('es-AR')}
            </span>
            <span className="text-base text-slate-400 line-through">
              ${offer.originalPrice.toLocaleString('es-AR')}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100/10 px-2.5 py-1 rounded-lg">
              Ahorrás ${(offer.originalPrice - offer.discountPrice).toLocaleString('es-AR')}
            </span>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1.5">Sobre el Producto</h4>
            <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">
              {offer.description}
            </p>
          </div>

          {/* Shop Location & Expiry Details */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/80 p-4 rounded-2xl">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-brand-orange dark:text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold block uppercase tracking-wider">Dirección</span>
                <span className="text-xs text-slate-700 dark:text-zinc-300 font-semibold">{shop?.address || 'Oberá, Misiones'}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-brand-orange dark:text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold block uppercase tracking-wider">Válido hasta</span>
                <span className="text-xs text-slate-700 dark:text-zinc-300 font-semibold">{offer.expiryDate}</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-2.5">
            {/* Direct WhatsApp button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2.5 transition-all hover:translate-y-[-1px] text-xs cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-white" /> Consultar al Vendedor
            </a>

            {/* Claim QR Coupon button if applicable */}
            {offer.hasQrCoupon ? (
              <button
                onClick={() => {
                  onClose();
                  onOpenCoupon(offer);
                }}
                className="w-full py-3 bg-brand-orange hover:bg-brand-orange/95 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-md transition-colors text-xs cursor-pointer"
              >
                <QrCode className="w-4.5 h-4.5" /> Obtener Cupón de Descuento QR
              </button>
            ) : (
              <div className="flex items-center justify-center gap-1.5 py-3 text-xs text-slate-450 dark:text-zinc-500 font-semibold bg-slate-50 dark:bg-zinc-950 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Compra directa en sucursal (sin cupón)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
