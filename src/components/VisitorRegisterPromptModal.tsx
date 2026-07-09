import React from 'react';
import { X, ShieldAlert, Sparkles, LogIn, ArrowRight } from 'lucide-react';

interface VisitorRegisterPromptModalProps {
  onClose: () => void;
  onRegisterClick: () => void;
}

export default function VisitorRegisterPromptModal({ onClose, onRegisterClick }: VisitorRegisterPromptModalProps) {
  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-zinc-950/70 dark:bg-zinc-950/85 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl text-center space-y-5 animate-in scale-in-95 duration-200">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-500 dark:text-zinc-400 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Lock / Alert Header Icon */}
        <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-indigo-950/50 text-brand-orange dark:text-indigo-400 border border-orange-100/50 dark:border-indigo-900/30 flex items-center justify-center mx-auto text-3xl shadow-inner animate-bounce duration-3000">
          🎟️
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="font-display font-black text-slate-900 dark:text-zinc-50 text-lg leading-tight tracking-tight">
            ¡Función para usuarios registrados!
          </h3>
          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-medium px-2">
            Los cupones de descuento son <span className="font-bold text-slate-800 dark:text-zinc-200">exclusivos para personas con una cuenta verificada</span>. 
            Creá tu cuenta gratis en 10 segundos para empezar a ahorrar y acceder a todos los beneficios de Oberá en Oferta.
          </p>
        </div>

        {/* Features Preview Badge */}
        <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl border border-slate-100 dark:border-zinc-800 text-left space-y-2">
          <span className="text-[9px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider block">Beneficios de tener cuenta:</span>
          <ul className="text-[11px] text-slate-700 dark:text-zinc-300 space-y-1 font-semibold">
            <li className="flex items-center gap-1.5">
              <span className="text-emerald-500">✓</span> Activar cupones QR ilimitados
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-emerald-500">✓</span> Billetera de descuentos guardados
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-emerald-500">✓</span> Notificaciones de ofertas flash del día
            </li>
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={onRegisterClick}
            className="w-full py-3 bg-brand-orange hover:bg-brand-orange/95 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all hover:translate-y-[-1px] text-xs cursor-pointer"
          >
            <LogIn className="w-4 h-4" /> Registrarme o Iniciar Sesión <ArrowRight className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-750 text-slate-500 dark:text-zinc-400 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Seguir explorando como Invitado
          </button>
        </div>
      </div>
    </div>
  );
}
