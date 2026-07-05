import React, { useState } from 'react';
import { User, Mail, QrCode, Settings, Shield, Store, ChevronRight, CreditCard, HelpCircle, Info, Sparkles, LogOut, Check, ArrowRight } from 'lucide-react';
import { Offer, Shop } from '../types';

interface MyProfileTabProps {
  offers: Offer[];
  shops: Shop[];
  claimedCouponIds: string[];
  onOpenCoupon: (offer: Offer) => void;
  onUpgradeToMerchant: () => void;
  onLogout: () => void;
  userEmail: string;
}

export default function MyProfileTab({
  offers,
  shops,
  claimedCouponIds,
  onOpenCoupon,
  onUpgradeToMerchant,
  onLogout,
  userEmail
}: MyProfileTabProps) {
  const [activeSubSection, setActiveSubSection] = useState<'profile' | 'settings'>('profile');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Filter actual claimed offers
  const claimedOffers = offers.filter(o => claimedCouponIds.includes(o.id));

  const handleUpgrade = () => {
    setIsUpgrading(true);
    setTimeout(() => {
      setIsUpgrading(false);
      setShowUpgradeModal(false);
      onUpgradeToMerchant();
    }, 1500);
  };

  return (
    <div className="space-y-8 pb-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 transition-colors">
      
      {/* 1. PROFILE HEADER CARD */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        {/* Decorative ambient gradient */}
        <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-brand-orange/10 dark:bg-indigo-500/5 rounded-full blur-2xl" />
        
        <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10">
          <div className="h-20 w-20 rounded-full bg-orange-100 dark:bg-zinc-800 text-brand-orange dark:text-indigo-400 border-2 border-orange-50 dark:border-zinc-700 flex items-center justify-center font-display font-black text-2xl shadow-inner">
            {userEmail.substring(0, 2).toUpperCase()}
          </div>
          
          <div className="text-center sm:text-left flex-1 space-y-1">
            <h2 className="font-display font-black text-xl text-slate-900 dark:text-zinc-50 tracking-tight">
              Tomás Sedoff
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-center sm:justify-start gap-1 font-medium">
              <Mail className="w-3.5 h-3.5" /> {userEmail || 'tizsedoff@gmail.com'}
            </p>
            <div className="pt-1 flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="text-[10px] bg-indigo-50 dark:bg-zinc-800/80 text-brand-orange dark:text-indigo-400 font-bold px-2.5 py-0.5 rounded-full border border-indigo-100/30 dark:border-zinc-700">
                Cliente Standard
              </span>
              <span className="text-[10px] bg-red-50 dark:bg-red-950/20 text-brand-red dark:text-red-400 font-bold px-2.5 py-0.5 rounded-full border border-red-100/30 dark:border-zinc-900/30">
                Oberá, Misiones 🧉
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUB-SECTION NAVIGATION */}
      <div className="bg-slate-50 dark:bg-zinc-900/50 p-1.5 rounded-2xl flex items-center border border-slate-150/40 dark:border-zinc-800/80">
        <button
          onClick={() => setActiveSubSection('profile')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubSection === 'profile'
              ? 'bg-white dark:bg-zinc-900 text-brand-orange dark:text-indigo-400 shadow-xs scale-[1.01]'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
          }`}
        >
          <User className="w-4 h-4" />
          Mi Cuenta y Cupones
        </button>
        <button
          onClick={() => setActiveSubSection('settings')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubSection === 'settings'
              ? 'bg-white dark:bg-zinc-900 text-brand-orange dark:text-indigo-400 shadow-xs scale-[1.01]'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          Configuraciones
        </button>
      </div>

      {/* 3. CONTENT AREA BASED ON SUB-SECTION */}
      {activeSubSection === 'profile' ? (
        <div className="space-y-6">
          
          {/* Saved / Claimed Coupons List */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-zinc-850 pb-3">
              <h3 className="font-display font-bold text-slate-900 dark:text-zinc-100 text-sm flex items-center gap-2">
                <QrCode className="w-4 h-4 text-brand-orange dark:text-indigo-400" />
                Mis Cupones Guardados ({claimedOffers.length})
              </h3>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                Billetera Local
              </span>
            </div>

            {claimedOffers.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-slate-100 dark:border-zinc-850 rounded-2xl space-y-3">
                <span className="text-3xl block filter grayscale opacity-60">🎟️</span>
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-350">Aún no guardaste cupones QR</p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-xs mx-auto leading-normal px-4">
                  Explorá las ofertas del Inicio o Categorías, tocá en "Obtener Cupón QR" y vas a verlos guardados acá listos para usar en caja.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {claimedOffers.map((offer) => {
                  const shop = shops.find(s => s.id === offer.shopId);
                  return (
                    <div
                      key={offer.id}
                      onClick={() => onOpenCoupon(offer)}
                      className="p-3 bg-slate-50 dark:bg-zinc-950 hover:bg-orange-50/20 dark:hover:bg-zinc-850/50 border border-slate-100 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={offer.image}
                          alt={offer.title}
                          className="w-11 h-11 object-cover rounded-xl border border-slate-100 dark:border-zinc-800 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 line-clamp-1 group-hover:text-brand-orange dark:group-hover:text-indigo-400 transition-colors">
                            {offer.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold block mt-0.5 truncate">
                            {shop?.logo} {shop?.name}
                          </span>
                        </div>
                      </div>
                      
                      <span className="p-1.5 bg-white dark:bg-zinc-900 text-slate-400 group-hover:text-brand-orange dark:group-hover:text-indigo-400 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-xs transition-colors shrink-0">
                        <QrCode className="w-4 h-4" />
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Customer stats/bento grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] text-slate-450 dark:text-zinc-500 font-bold uppercase block mb-1">Ahorro Estimado</span>
              <p className="text-xl font-display font-black text-slate-800 dark:text-zinc-100">
                ${(claimedOffers.reduce((sum, o) => sum + (o.originalPrice - o.discountPrice), 0)).toLocaleString('es-AR')} ARS
              </p>
              <p className="text-[9px] text-slate-400 dark:text-zinc-500 mt-1 font-semibold">Calculado en base a tus cupones guardados</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] text-slate-450 dark:text-zinc-500 font-bold uppercase block mb-1">Soporte Municipal</span>
              <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 leading-normal">
                ¿Tenés dudas sobre un comercio?
              </p>
              <p className="text-[9px] text-brand-orange dark:text-indigo-400 font-bold mt-1 hover:underline cursor-pointer flex items-center gap-0.5">
                Chatear con Soporte <ArrowRight className="w-3 h-3" />
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* CONFIGURATIONS OPTIONS LIST */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            
            {/* Visually distinct "Vender en Oberá en Oferta" card */}
            <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-brand-orange to-red-500 dark:from-indigo-650 dark:via-indigo-600 dark:to-purple-750 p-5 rounded-2xl text-white shadow-md border border-orange-400/20 dark:border-indigo-500/20 animate-pulse-slow">
              <div className="absolute right-[-20px] top-[-20px] w-36 h-36 bg-white/10 rounded-full blur-2xl" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-md">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 bg-white/20 rounded-md text-xs">🚀</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-100 dark:text-indigo-100">Para Comercios Locales</span>
                  </div>
                  <h4 className="font-display font-black text-lg tracking-tight">
                    ¿Tenés un Comercio en Oberá?
                  </h4>
                  <p className="text-xs text-orange-50/90 dark:text-indigo-55/90 leading-relaxed font-medium">
                    Publicá tus ofertas del día de forma gratuita, generá cupones QR y llegá a miles de vecinos de la zona centro de Misiones.
                  </p>
                </div>

                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="bg-white hover:bg-white/95 text-brand-orange dark:text-indigo-655 font-display font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg transition-transform hover:scale-103 cursor-pointer self-start md:self-center shrink-0 flex items-center gap-1.5"
                >
                  <Store className="w-4 h-4" /> Registrar mi Negocio
                </button>
              </div>
            </div>

            {/* Standard Options */}
            <div className="divide-y divide-slate-50 dark:divide-zinc-850 pt-2">
              <div className="py-3 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-slate-400" /> Privacidad de Datos</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">Activado</span>
              </div>
              
              <div className="py-3 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                <span className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-slate-400" /> Notificaciones PWA</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">Habilitadas</span>
              </div>

              <div className="py-3 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                <span className="flex items-center gap-2"><HelpCircle className="w-4 h-4 text-slate-400" /> Términos de Servicio</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <div className="py-3 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                <span className="flex items-center gap-2"><Info className="w-4 h-4 text-slate-400" /> Versión de la Aplicación</span>
                <span className="text-xs text-slate-400 dark:text-zinc-500">v1.2 Production</span>
              </div>
            </div>

            <div className="border-t border-slate-50 dark:border-zinc-850 pt-4">
              <button
                onClick={onLogout}
                className="w-full py-2.5 bg-slate-50 hover:bg-red-50 dark:bg-zinc-950 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-100 dark:border-zinc-800 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Cerrar Sesión
              </button>
            </div>

          </div>
        </div>
      )}

      {/* UPGRADE MODAL CONFIRMATION (Simulating Status Upgrade) */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 text-center animate-in scale-in-95 duration-200">
            <span className="text-4xl p-4 bg-orange-100 dark:bg-zinc-800 rounded-full inline-block animate-bounce shadow-inner">
              🧉✨
            </span>
            
            <div className="space-y-2">
              <h3 className="font-display font-black text-lg text-slate-900 dark:text-zinc-100 tracking-tight">
                ¿Querés publicar como Comercio?
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                Al confirmar, simularemos un upgrade de cuenta gratuito. Tu rol cambiará a <strong>Comercio Registrado</strong>, permitiéndote publicar ofertas flash y ver estadísticas en tiempo real en la pestaña <strong>"Mi Negocio"</strong>.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="w-full py-3 bg-brand-orange hover:bg-brand-orange/95 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-lg transition-transform hover:translate-y-[-1px] cursor-pointer text-xs flex items-center justify-center gap-2"
              >
                {isUpgrading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Registrando comercio local...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> ¡Sí, Registrar mi Negocio!
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowUpgradeModal(false)}
                disabled={isUpgrading}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-550 dark:text-zinc-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
