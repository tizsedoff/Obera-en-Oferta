import React, { useEffect, useState } from 'react';
import { Cookie, X } from 'lucide-react';

const STORAGE_KEY = 'obera_ofertas_cookie_consent';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setVisible(true);
    }
  }, []);

  const handleChoice = (choice: 'accepted' | 'rejected') => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ choice, date: new Date().toISOString() })
    );
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-70 p-3 sm:p-4 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-3xl shadow-2xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-orange-50 dark:bg-indigo-950/50 text-brand-orange dark:text-indigo-400 border border-orange-100/50 dark:border-indigo-900/30 flex items-center justify-center">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">
              Usamos cookies y almacenamiento local
            </p>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mt-1">
              Usamos cookies propias y almacenamiento local esenciales para que funcione tu sesión, el modo oscuro y tus preferencias. No usamos cookies de publicidad ni de seguimiento de terceros. Podés ver el detalle en cualquier momento.
            </p>

            {showDetails && (
              <div className="mt-2 p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed space-y-1.5">
                <p><span className="font-bold text-slate-800 dark:text-zinc-200">Esenciales (siempre activas):</span> mantener tu sesión iniciada, tu rol (cliente/comercio), el modo oscuro y tus preferencias de zonas y categorías.</p>
                <p><span className="font-bold text-slate-800 dark:text-zinc-200">Opcionales:</span> por ahora no usamos cookies de analítica ni de publicidad de terceros. Si en el futuro sumamos alguna, te lo vamos a avisar acá antes de activarla.</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="text-[11px] font-bold text-brand-orange dark:text-indigo-400 mt-1.5 cursor-pointer"
            >
              {showDetails ? 'Ocultar detalle' : 'Ver detalle'}
            </button>

            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => handleChoice('rejected')}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
              >
                Solo esenciales
              </button>
              <button
                type="button"
                onClick={() => handleChoice('accepted')}
                className="flex-1 py-2.5 bg-brand-orange hover:bg-brand-orange/95 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs transition-colors cursor-pointer"
              >
                Aceptar
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleChoice('accepted')}
            className="p-1.5 -mt-1 -mr-1 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 rounded-full transition-colors cursor-pointer shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
