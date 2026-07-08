import React, { useState } from 'react';
import { X, QrCode, MapPin, Calendar, Check, Copy, Share2 } from 'lucide-react';
import { Offer, Shop } from '../types';
import ShopLogo from './ShopLogo';

interface CouponModalProps {
  offer: Offer;
  shop: Shop | undefined;
  onClose: () => void;
  onClaim: (offerId: string) => void;
}

export default function CouponModal({ offer, shop, onClose, onClaim }: CouponModalProps) {
  const [copied, setCopied] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);

  const couponCode = offer.qrCodeValue || `OBERA-${offer.id.toUpperCase()}-QR`;

  const handleClaim = () => {
    setIsClaimed(true);
    onClaim(offer.id);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 dark:bg-zinc-950/85 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl animate-in scale-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 rounded-full text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal content styled as a realistic Ticket */}
        <div className="bg-gradient-to-br from-brand-orange to-brand-red dark:from-indigo-600 dark:to-indigo-800 p-6 text-white text-center pb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex items-center justify-center bg-white/20 dark:bg-black/30 rounded-lg backdrop-blur-xs border border-white/10 w-8 h-8 overflow-hidden shrink-0">
              <ShopLogo logo={shop?.logo} className="text-2xl" fallbackSize="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest opacity-90">{shop?.name}</span>
          </div>
          <h3 className="font-display font-black text-xl leading-tight mb-2">
            {offer.title}
          </h3>
          <p className="text-xs text-orange-100 dark:text-indigo-100 opacity-90 max-w-xs mx-auto">
            Cupón de Descuento Exclusivo
          </p>
        </div>

        {/* Skeuomorphic Ticket Notch (Left and Right) */}
        <div className="relative h-4 bg-slate-100 dark:bg-zinc-950 flex items-center justify-between">
          <div className="absolute -left-3 w-6 h-6 rounded-full bg-zinc-950/70 dark:bg-zinc-950/85" />
          <div className="w-full border-t-2 border-dashed border-slate-200 dark:border-zinc-800 mx-3" />
          <div className="absolute -right-3 w-6 h-6 rounded-full bg-zinc-950/70 dark:bg-zinc-950/85" />
        </div>

        {/* Coupon Main Body */}
        <div className="p-6 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">
          {/* QR Code Container (CRITICAL: MUST remain bright white background for optical scanning) */}
          <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl p-5 mb-4 shadow-sm relative">
            
            {/* Expiration Badge */}
            <div className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs animate-pulse">
              Vence hoy 23:59 hs
            </div>

            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`https://obera-en-oferta.vercel.app/canjear?id=${offer.id}`)}&color=09090b`}
              alt="Código QR de Descuento"
              className="w-40 h-40 object-contain transition-transform hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="mt-4 flex items-center gap-1.5 px-3 py-1 bg-red-50 text-brand-red rounded-lg text-xs font-bold font-mono border border-red-100/50">
              <QrCode className="w-3.5 h-3.5 text-red-500" />
              {couponCode}
            </div>
          </div>

          {/* Instructions */}
          <div className="text-center mb-4 px-1">
            <p className="text-xs text-slate-600 dark:text-zinc-350 leading-relaxed font-bold">
              Presentá este código QR en la caja del comercio para registrar el descuento.
            </p>
          </div>

          {/* Details list */}
          <div className="space-y-3.5 border-t border-slate-100 dark:border-zinc-850 pt-4">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 mt-0.5 text-slate-400 dark:text-zinc-500 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 block font-bold uppercase tracking-wider">Dirección del Comercio</span>
                <span className="text-xs text-slate-800 dark:text-zinc-300 font-semibold">{shop?.address || 'Oberá, Misiones'}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 mt-0.5 text-slate-400 dark:text-zinc-500 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 block font-bold uppercase tracking-wider">Vencimiento del Cupón</span>
                <span className="text-xs text-slate-800 dark:text-zinc-300 font-semibold">Válido hasta el {offer.expiryDate}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 space-y-2">
            {!isClaimed ? (
              <button
                onClick={handleClaim}
                className="w-full py-3 bg-brand-orange hover:bg-brand-orange/95 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all hover:translate-y-[-1px] cursor-pointer text-xs"
              >
                <Check className="w-4 h-4" /> Activar Cupón Ahora
              </button>
            ) : (
              <div className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm">
                <Check className="w-4 h-4" /> ¡Cupón Activado con Éxito!
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copiado' : 'Copiar código'}
              </button>
              
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: offer.title,
                      text: `¡Mirá este cupón de descuento en Oberá! ${offer.title} en ${shop?.name}`,
                      url: window.location.href
                    }).catch(console.error);
                  } else {
                    alert('¡Compartí esta oferta con tus amigos enviándoles una captura de pantalla!');
                  }
                }}
                className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 rounded-xl transition-colors cursor-pointer"
                title="Compartir"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
