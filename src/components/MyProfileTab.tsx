import React, { useState } from 'react';
import { User, Mail, QrCode, Settings, Shield, Store, ChevronRight, CreditCard, HelpCircle, Info, Sparkles, LogOut, Check, ArrowRight, MapPin, Phone, AlertCircle } from 'lucide-react';
import { Offer, Shop, Category } from '../types';
import ShopLogo from './ShopLogo';

interface MyProfileTabProps {
  offers: Offer[];
  shops: Shop[];
  categories: Category[];
  zones: string[];
  claimedCouponIds: string[];
  onOpenCoupon: (offer: Offer) => void;
  onUpgradeToMerchant: (
    shopData: Omit<Shop, 'id' | 'rating' | 'isOpen'> & { base64Logo?: string | null },
    initialOffer?: {
      title: string;
      description: string;
      originalPrice: number;
      discountPrice: number;
      category: string;
      expiryDate: string;
      hasQrCoupon: boolean;
      isFlashSale: boolean;
      base64Image: string | null;
    } | null
  ) => void;
  onLogout: () => void;
  userEmail: string;
}

export default function MyProfileTab({
  offers,
  shops,
  categories,
  zones,
  claimedCouponIds,
  onOpenCoupon,
  onUpgradeToMerchant,
  onLogout,
  userEmail
}: MyProfileTabProps) {
  const [activeSubSection, setActiveSubSection] = useState<'profile' | 'settings'>('profile');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Multi-step form states for shop registration
  const [regStep, setRegStep] = useState(1);
  const [shopName, setShopName] = useState('');
  const [shopCategory, setShopCategory] = useState('Gastronomía');
  const [shopZone, setShopZone] = useState('Centro');
  const [shopLogo, setShopLogo] = useState('🛍️');
  const [shopLogoBase64, setShopLogoBase64] = useState<string | null>(null);
  const [shopAddress, setShopAddress] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [useAutoCoords, setUseAutoCoords] = useState(true);
  const [shopLat, setShopLat] = useState('-27.4856');
  const [shopLng, setShopLng] = useState('-55.1193');
  const [formError, setFormError] = useState('');

  // Initial offer states (Required for Pre-launch)
  const [addInitialOffer, setAddInitialOffer] = useState(true);
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [offerOriginalPrice, setOfferOriginalPrice] = useState('');
  const [offerDiscountPrice, setOfferDiscountPrice] = useState('');
  const [offerExpiryDate, setOfferExpiryDate] = useState('2026-07-20');
  const [offerImageBase64, setOfferImageBase64] = useState<string | null>(null);
  const [offerIsFlash, setOfferIsFlash] = useState(false);
  const [offerHasQr, setOfferHasQr] = useState(true);

  // Logo preset emoji list
  const LOGO_PRESETS = ['🛍️', '🍔', '🍕', '👚', '🔌', '🛒', '🍦', '🧉', '💈', '💻', '🍰', '🛠️', '🚗', '📚'];

  // Filter actual claimed offers
  const claimedOffers = offers.filter(o => claimedCouponIds.includes(o.id));

  const getZoneCoordinates = (zoneName: string) => {
    switch (zoneName) {
      case 'Centro': return { lat: -27.4856, lng: -55.1193 };
      case 'Villa Svea': return { lat: -27.4985, lng: -55.1112 };
      case 'Villa Lutz': return { lat: -27.4789, lng: -55.1054 };
      case 'Villa Barreyro': return { lat: -27.4721, lng: -55.1156 };
      case 'Cien Hectáreas': return { lat: -27.5102, lng: -55.1324 };
      case 'Loma Porá': return { lat: -27.4695, lng: -55.1278 };
      default: return { lat: -27.4856, lng: -55.1193 };
    }
  };

  // Sync coords on zone change if auto is checked
  const handleZoneChange = (zone: string) => {
    setShopZone(zone);
    if (useAutoCoords) {
      const coords = getZoneCoordinates(zone);
      setShopLat(String(coords.lat));
      setShopLng(String(coords.lng));
    }
  };

  const validateStep1 = () => {
    if (!shopName.trim()) {
      setFormError('Por favor, ingresá el nombre de tu negocio.');
      return false;
    }
    setFormError('');
    return true;
  };

  const validateStep2 = () => {
    if (!shopAddress.trim()) {
      setFormError('Por favor, ingresá la dirección física.');
      return false;
    }
    if (!shopPhone.trim()) {
      setFormError('Por favor, ingresá un teléfono de contacto.');
      return false;
    }
    const latNum = parseFloat(shopLat);
    const lngNum = parseFloat(shopLng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      setFormError('Las coordenadas deben ser números decimales válidos.');
      return false;
    }
    setFormError('');
    return true;
  };

  const validateStep3 = () => {
    if (!addInitialOffer) {
      setFormError('');
      return true;
    }
    if (!offerTitle.trim()) {
      setFormError('Por favor, ingresá el título de tu oferta inicial.');
      return false;
    }
    const oPrice = parseFloat(offerOriginalPrice);
    const dPrice = parseFloat(offerDiscountPrice);
    if (isNaN(oPrice) || isNaN(dPrice) || oPrice <= 0 || dPrice <= 0) {
      setFormError('Los precios de la oferta deben ser números válidos mayores a cero.');
      return false;
    }
    if (dPrice >= oPrice) {
      setFormError('El precio de oferta debe ser menor al precio original.');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleNextStep = () => {
    if (regStep === 1) {
      if (validateStep1()) setRegStep(2);
    } else if (regStep === 2) {
      if (validateStep2()) setRegStep(3);
    } else if (regStep === 3) {
      if (validateStep3()) setRegStep(4);
    }
  };

  const handlePrevStep = () => {
    setRegStep(prev => Math.max(prev - 1, 1));
    setFormError('');
  };

  const handleUpgradeSubmit = () => {
    setIsUpgrading(true);
    setTimeout(() => {
      setIsUpgrading(false);
      setShowUpgradeModal(false);
      
      const coords = useAutoCoords ? getZoneCoordinates(shopZone) : { lat: parseFloat(shopLat), lng: parseFloat(shopLng) };

      onUpgradeToMerchant({
        name: shopName,
        category: shopCategory,
        zone: shopZone,
        logo: shopLogo,
        address: shopAddress,
        phone: shopPhone,
        latitude: coords.lat,
        longitude: coords.lng,
        base64Logo: shopLogoBase64
      }, addInitialOffer ? {
        title: offerTitle,
        description: offerDescription || `Súper descuento de inauguración en ${shopName}. ¡Aprovechalo hoy mismo!`,
        originalPrice: parseFloat(offerOriginalPrice),
        discountPrice: parseFloat(offerDiscountPrice),
        category: shopCategory,
        expiryDate: offerExpiryDate,
        hasQrCoupon: offerHasQr,
        isFlashSale: offerIsFlash,
        base64Image: offerImageBase64
      } : null);
    }, 1500);
  };

  const openUpgradeFlow = () => {
    // Reset states
    setRegStep(1);
    setShopName('');
    setShopCategory(categories.filter(c => c.id !== 'all')[0]?.name || 'Gastronomía');
    setShopZone(zones[0] || 'Centro');
    setShopLogo('🛍️');
    setShopLogoBase64(null);
    setShopAddress('');
    setShopPhone('');
    setUseAutoCoords(true);
    const initialCoords = getZoneCoordinates(zones[0] || 'Centro');
    setShopLat(String(initialCoords.lat));
    setShopLng(String(initialCoords.lng));
    
    // Initial offer resets
    setAddInitialOffer(true);
    setOfferTitle('');
    setOfferDescription('');
    setOfferOriginalPrice('');
    setOfferDiscountPrice('');
    setOfferExpiryDate('2026-07-20');
    setOfferImageBase64(null);
    setOfferIsFlash(false);
    setOfferHasQr(true);

    setFormError('');
    setShowUpgradeModal(true);
  };

  return (
    <div className="space-y-8 pb-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 transition-colors">
      
      {/* 1. PROFILE HEADER CARD */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        {/* Decorative ambient gradient */}
        <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-brand-orange/10 dark:bg-indigo-500/5 rounded-full blur-2xl" />
        
        <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10">
          {!userEmail ? (
            <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-2 border-slate-50 dark:border-zinc-700 flex items-center justify-center font-display font-black text-2xl shadow-inner">
              👤
            </div>
          ) : (
            <div className="h-20 w-20 rounded-full bg-orange-100 dark:bg-zinc-800 text-brand-orange dark:text-indigo-400 border-2 border-orange-50 dark:border-zinc-700 flex items-center justify-center font-display font-black text-2xl shadow-inner">
              {userEmail.substring(0, 2).toUpperCase()}
            </div>
          )}
          
          <div className="text-center sm:text-left flex-1 space-y-1">
            <h2 className="font-display font-black text-xl text-slate-900 dark:text-zinc-50 tracking-tight">
              {!userEmail ? 'Invitado / Visitante' : (localStorage.getItem('obera_ofertas_user_name') || 'Usuario Registrado')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-center sm:justify-start gap-1 font-medium">
              <Mail className="w-3.5 h-3.5" /> {!userEmail ? 'Sesión de Invitado temporal' : userEmail}
            </p>
            <div className="pt-1 flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="text-[10px] bg-indigo-50 dark:bg-zinc-800/80 text-brand-orange dark:text-indigo-400 font-bold px-2.5 py-0.5 rounded-full border border-indigo-100/30 dark:border-zinc-700">
                {!userEmail ? 'Visitante' : 'Cliente Verificado'}
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

            {!userEmail ? (
              <div className="py-10 text-center border-2 border-dashed border-slate-150 dark:border-zinc-800/80 rounded-2xl space-y-4 px-4">
                <span className="text-4xl block">🔒</span>
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Cupones exclusivos para usuarios registrados</p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  Para guardar y activar cupones de descuento, necesitás tener una cuenta verificada. ¡Registrate gratis en segundos para empezar a ahorrar!
                </p>
                <button
                  onClick={onLogout}
                  className="px-5 py-2.5 bg-brand-orange hover:bg-brand-orange/95 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-transform hover:scale-102 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" /> Registrarme o Iniciar Sesión
                </button>
              </div>
            ) : claimedOffers.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-slate-100 dark:border-zinc-850 rounded-2xl space-y-3">
                <span className="text-3xl block filter grayscale opacity-60">🎟️</span>
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-355">Aún no guardaste cupones QR</p>
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
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold flex items-center gap-1 mt-0.5 truncate">
                            <ShopLogo logo={shop?.logo} className="text-xs" fallbackSize="w-4 h-4 rounded-md" /> {shop?.name}
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
              <span className="text-[10px] text-slate-450 dark:text-zinc-500 font-bold uppercase block mb-1">APS DEVELOPER</span>
              <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 leading-normal">
                ¿Tenés dudas sobre un comercio?
              </p>
              <a
                href="https://aps-web-tau.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] text-brand-orange dark:text-indigo-400 font-bold mt-1 hover:underline flex items-center gap-0.5"
              >
                Visitar APS DEVELOPER <ArrowRight className="w-3 h-3" />
              </a>
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
                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-100 dark:text-indigo-100 font-black">Para Comercios Locales</span>
                  </div>
                  <h4 className="font-display font-black text-lg tracking-tight text-white">
                    ¿Tenés un Comercio en Oberá?
                  </h4>
                  <p className="text-xs text-orange-50/90 dark:text-indigo-50/90 leading-relaxed font-medium">
                    Publicá tus ofertas del día de forma gratuita, generá cupones QR y llegá a miles de vecinos de la zona centro de Misiones.
                  </p>
                </div>

                <button
                  onClick={openUpgradeFlow}
                  className="bg-white hover:bg-white/95 text-brand-orange dark:text-indigo-600 font-display font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg transition-transform hover:scale-103 cursor-pointer self-start md:self-center shrink-0 flex items-center gap-1.5"
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

              <div 
                onClick={() => window.dispatchEvent(new CustomEvent('open-admin-panel'))} 
                className="py-3 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-850 px-2 rounded-lg transition-colors"
              >
                <span className="flex items-center gap-2"><Settings className="w-4 h-4 text-brand-orange dark:text-indigo-400" /> Panel de Control (Admin)</span>
                <span className="text-[10px] text-brand-orange dark:text-indigo-400 font-bold underline">Abrir</span>
              </div>

              <div className="py-3 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                <span className="flex items-center gap-2"><Info className="w-4 h-4 text-slate-400" /> Versión de la Aplicación</span>
                <span className="text-xs text-slate-400 dark:text-zinc-500">v1.2 Production</span>
              </div>
            </div>

            <div className="border-t border-slate-50 dark:border-zinc-850 pt-4">
              <button
                onClick={onLogout}
                className="w-full py-2.5 bg-slate-50 hover:bg-red-50 dark:bg-zinc-950 dark:hover:bg-red-950/20 text-red-650 dark:text-red-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-100 dark:border-zinc-800 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Cerrar Sesión
              </button>
            </div>

          </div>
        </div>
      )}

      {/* COMPREHENSIVE MULTI-STEP BUSINESS REGISTRATION MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in scale-in-95 duration-200">
            
            {/* Header: Progress indicators */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-brand-orange/10 dark:bg-indigo-500/10 text-brand-orange dark:text-indigo-400 rounded-lg">
                  <Store className="w-4 h-4" />
                </div>
                <h3 className="font-display font-black text-sm text-slate-900 dark:text-zinc-100 tracking-tight">
                  Registrar mi Negocio
                </h3>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      s === regStep 
                        ? 'w-5 bg-brand-orange dark:bg-indigo-500' 
                        : s < regStep 
                        ? 'w-1.5 bg-emerald-500' 
                        : 'w-1.5 bg-slate-200 dark:bg-zinc-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Error alerts */}
            {formError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-150/20 text-red-750 dark:text-red-300 rounded-xl text-xs font-semibold flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p>{formError}</p>
              </div>
            )}

            {/* STEP 1: General Business Identity */}
            {regStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
                    Nombre del Negocio / Marca <span className="text-red-550">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Panadería El Sol, Electrónica Oberá"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
                      Categoría Principal
                    </label>
                    <select
                      value={shopCategory}
                      onChange={(e) => setShopCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-550 transition-all cursor-pointer font-bold"
                    >
                      {categories.filter(c => c.id !== 'all').map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name} {cat.emoji}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
                      Zona Comercial
                    </label>
                    <select
                      value={shopZone}
                      onChange={(e) => handleZoneChange(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-550 transition-all cursor-pointer font-bold"
                    >
                      {zones.map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Brand emoji preset selector */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-2">
                    Elegí un Logo/Icono de tu Marca o subí una foto ({shopLogo})
                  </label>
                  <div className="grid grid-cols-6 gap-2 bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl border border-slate-100 dark:border-zinc-850">
                    {LOGO_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setShopLogo(p);
                          setShopLogoBase64(null);
                        }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                          shopLogo === p && !shopLogoBase64
                            ? 'bg-brand-orange text-white dark:bg-indigo-600 scale-110 shadow-md ring-2 ring-emerald-400' 
                            : 'bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block mb-1">
                      O subí una Imagen/Logo de tu Negocio (.png, .jpg)
                    </label>
                    <div className="relative border border-dashed border-slate-200 dark:border-zinc-850 hover:border-brand-orange/60 dark:hover:border-indigo-400/60 rounded-2xl p-3 text-center transition-colors">
                      {shopLogoBase64 ? (
                        <div className="flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2">
                            <img
                              src={shopLogoBase64}
                              alt="Custom Logo Preview"
                              className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-zinc-800"
                            />
                            <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">¡Imagen cargada!</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setShopLogoBase64(null);
                              setShopLogo('🛍️');
                            }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-red-500 rounded-lg transition-colors text-[10px] font-bold cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block py-1">
                          <span className="text-[10px] text-brand-orange dark:text-indigo-400 font-extrabold hover:underline">
                            📂 Seleccionar Logo de tu Dispositivo
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setShopLogoBase64(reader.result as string);
                                  setShopLogo('🖼️');
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Address and Contact details */}
            {regStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
                    Dirección Física <span className="text-red-550">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ej: Av. Libertad 240, Oberá"
                      value={shopAddress}
                      onChange={(e) => setShopAddress(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all font-bold"
                    />
                    <MapPin className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
                    WhatsApp de Contacto (Código de País + Área) <span className="text-red-550">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ej: 543755412345"
                      value={shopPhone}
                      onChange={(e) => setShopPhone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all font-mono font-bold"
                    />
                    <Phone className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">
                    💡 Los clientes podrán consultarte por tus ofertas haciendo clic en "Consultar Vendedor".
                  </p>
                </div>

                {/* Coordinates helper */}
                <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-3">
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useAutoCoords}
                      onChange={(e) => {
                        setUseAutoCoords(e.target.checked);
                        if (e.target.checked) {
                          const coords = getZoneCoordinates(shopZone);
                          setShopLat(String(coords.lat));
                          setShopLng(String(coords.lng));
                        }
                      }}
                      className="w-4 h-4 mt-0.5 rounded-md border-slate-300 dark:border-zinc-700 text-brand-orange dark:text-indigo-500 focus:ring-brand-orange"
                    />
                    <div className="leading-tight">
                      <span className="text-[11px] text-slate-700 dark:text-zinc-350 font-bold block">
                        Auto-geolocalizar coordenadas en Oberá
                      </span>
                      <span className="text-[9px] text-slate-450 dark:text-zinc-500 font-semibold leading-relaxed">
                        Ubica tu comercio en el mapa principal basado en la zona seleccionada: <strong>{shopZone}</strong>.
                      </span>
                    </div>
                  </label>

                  {!useAutoCoords && (
                    <div className="grid grid-cols-2 gap-3 pt-1 animate-scale-up">
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 block uppercase mb-1">Latitud</span>
                        <input
                          type="text"
                          value={shopLat}
                          onChange={(e) => setShopLat(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-800 dark:text-zinc-200"
                        />
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 block uppercase mb-1">Longitud</span>
                        <input
                          type="text"
                          value={shopLng}
                          onChange={(e) => setShopLng(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-800 dark:text-zinc-200"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: Initial Offer (Required) */}
            {regStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200 text-left">
                <div className="bg-orange-50/40 dark:bg-zinc-950 p-4 rounded-2xl border border-brand-orange/20 dark:border-zinc-800 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="p-1.5 bg-brand-orange/10 rounded-lg text-xs shrink-0">🎁</span>
                    <div className="leading-tight">
                      <span className="text-[11px] text-slate-900 dark:text-zinc-350 font-black block">
                        Cargar tu primera Oferta Destacada (Requerido)
                      </span>
                      <span className="text-[9px] text-slate-500 dark:text-zinc-400 font-semibold leading-relaxed">
                        Para el prelanzamiento de la plataforma, cada comercio registrado debe publicar al menos una oferta activa inicial para sus clientes.
                      </span>
                    </div>
                  </div>
                </div>

                {addInitialOffer && (
                  <div className="space-y-3 pt-1 animate-scale-up">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
                        Título de la Oferta <span className="text-red-555">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: 2x1 en Medialunas, 30% Off en Jeans"
                        value={offerTitle}
                        onChange={(e) => setOfferTitle(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-955 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
                        Descripción de la Oferta
                      </label>
                      <textarea
                        placeholder="Ej: Vení a probar las mejores medialunas de manteca de Oberá."
                        value={offerDescription}
                        onChange={(e) => setOfferDescription(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-50 dark:bg-zinc-955 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
                          Precio Original ($ ARS) <span className="text-red-555">*</span>
                        </label>
                        <input
                          type="number"
                          placeholder="4500"
                          value={offerOriginalPrice}
                          onChange={(e) => setOfferOriginalPrice(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-zinc-955 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
                          Precio Oferta ($ ARS) <span className="text-red-555">*</span>
                        </label>
                        <input
                          type="number"
                          placeholder="3000"
                          value={offerDiscountPrice}
                          onChange={(e) => setOfferDiscountPrice(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-zinc-955 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
                          Vence el:
                        </label>
                        <input
                          type="date"
                          value={offerExpiryDate}
                          onChange={(e) => setOfferExpiryDate(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-zinc-955 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden font-bold"
                        />
                      </div>
                      <div className="flex flex-col justify-end pb-1.5">
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={offerIsFlash}
                            onChange={(e) => setOfferIsFlash(e.target.checked)}
                            className="w-4 h-4 rounded-md text-brand-orange focus:ring-brand-orange"
                          />
                          <span className="text-[10px] text-slate-650 dark:text-zinc-400 font-bold">
                            ⚡ Es Oferta Flash
                          </span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block mb-1">
                        Imagen de la Oferta (.png, .jpg)
                      </label>
                      <div className="relative border border-dashed border-slate-200 dark:border-zinc-850 hover:border-brand-orange/60 dark:hover:border-indigo-400/60 rounded-2xl p-2 text-center transition-colors">
                        {offerImageBase64 ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <img
                                src={offerImageBase64}
                                alt="Offer Preview"
                                className="w-8 h-8 rounded-lg object-cover border border-slate-100 dark:border-zinc-800"
                              />
                              <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">¡Imagen cargada!</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setOfferImageBase64(null)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-red-500 rounded-lg transition-colors text-[10px] font-bold cursor-pointer"
                            >
                              Eliminar
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer block py-0.5">
                            <span className="text-[10px] text-brand-orange dark:text-indigo-400 font-extrabold hover:underline">
                              📂 Subir Foto de la Oferta
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setOfferImageBase64(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: Preview and Confirmation */}
            {regStep === 4 && (
              <div className="space-y-4 animate-in fade-in duration-200 text-left">
                <p className="text-xs text-slate-600 dark:text-zinc-350 font-semibold text-center mb-1">
                  Revisá la tarjeta de presentación de tu local comercial:
                </p>

                {/* Previews the registered shop card */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 flex items-center gap-4 shadow-xl">
                  {shopLogoBase64 ? (
                    <img
                      src={shopLogoBase64}
                      alt="Custom Shop Logo"
                      className="w-14 h-14 rounded-xl object-cover border border-slate-800 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-brand-orange rounded-xl flex items-center justify-center text-3xl font-bold shadow-md shrink-0">
                      {shopLogo}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[8px] bg-brand-orange text-white font-extrabold uppercase px-1.5 py-0.5 rounded-full">
                        {shopCategory}
                      </span>
                      <span className="text-[8px] text-green-400 font-extrabold flex items-center gap-0.5">
                        ● ABIERTO
                      </span>
                    </div>
                    <h4 className="font-display font-black text-sm truncate text-white">{shopName}</h4>
                    <p className="text-[9px] text-slate-300 truncate mt-0.5 flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5 text-slate-400" /> {shopAddress} ({shopZone})
                    </p>
                  </div>
                </div>

                {addInitialOffer && offerTitle && (
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl space-y-2">
                    <span className="text-[9px] font-black bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase">
                      🎁 Oferta Inicial Vinculada
                    </span>
                    <div className="flex items-center gap-2">
                      {offerImageBase64 && (
                        <img
                          src={offerImageBase64}
                          alt="Offer preview"
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-zinc-800 shrink-0"
                        />
                      )}
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{offerTitle}</h5>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium leading-tight">
                          Precio Especial: <strong className="text-green-600 dark:text-green-400">${parseFloat(offerDiscountPrice)}</strong> <span className="line-through text-slate-400">${parseFloat(offerOriginalPrice)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 dark:bg-zinc-950 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-2 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-450 dark:text-zinc-550">Contacto WhatsApp:</span>
                    <span className="font-mono text-slate-800 dark:text-zinc-300 font-bold">+{shopPhone}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-450 dark:text-zinc-550">Ubicación Georeferenciada:</span>
                    <span className="font-mono text-slate-800 dark:text-zinc-300 font-bold">
                      {parseFloat(shopLat).toFixed(4)}, {parseFloat(shopLng).toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-450 dark:text-zinc-550">Calificación Inicial:</span>
                    <span className="text-amber-500 font-bold">★ 5.0 Excelente</span>
                  </div>
                </div>
              </div>
            )}

            {/* Modal actions / steps navigation */}
            <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
              {regStep > 1 ? (
                <button
                  onClick={handlePrevStep}
                  disabled={isUpgrading}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-350 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Atrás
                </button>
              ) : (
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  disabled={isUpgrading}
                  className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-600 dark:text-zinc-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Volver
                </button>
              )}

              {regStep < 4 ? (
                <button
                  onClick={handleNextStep}
                  className="flex-1 py-2.5 bg-brand-orange hover:bg-brand-orange/95 dark:bg-indigo-650 dark:hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md transition-transform hover:translate-y-[-1px] text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Siguiente <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleUpgradeSubmit}
                  disabled={isUpgrading}
                  className="flex-1 py-2.5 bg-brand-orange hover:bg-brand-orange/95 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-lg transition-transform hover:translate-y-[-1px] text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isUpgrading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Registrando Negocio...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Registrar mi Local
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
