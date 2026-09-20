import React, { useState } from 'react';
import { Store, Plus, TrendingUp, Users, QrCode, Trash2, CheckCircle, AlertCircle, Eye, RefreshCw, Sparkles, ChevronRight, Upload, Image, X, Camera, Keyboard, Pencil, Loader2 } from 'lucide-react';
import { Offer, Shop } from '../types';
import ShopLogo from './ShopLogo';
import PlanPanel from './PlanPanel';

interface MerchantDashboardProps {
  myOffers: Offer[];
  myShop: Shop | null | undefined;
  onAddOffer: (newOffer: Omit<Offer, 'id' | 'shopId' | 'shopName' | 'views' | 'couponsClaimed'>) => void;
  onDeleteOffer: (id: string) => void;
  onEditShop: (updatedData: { name: string; category: string; address: string; phone: string; zone: string; base64Logo?: string; logo?: string }) => void | Promise<void>;
}

export default function MerchantDashboard({ myOffers, myShop, onAddOffer, onDeleteOffer, onEditShop }: MerchantDashboardProps) {
  // Estado del modal de edición del negocio
  const [showEditShopModal, setShowEditShopModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editZone, setEditZone] = useState('');
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [editBase64Logo, setEditBase64Logo] = useState<string | undefined>(undefined);
  const [isSavingShop, setIsSavingShop] = useState(false);

  const openEditShopModal = () => {
    setEditName(myShop?.name || '');
    setEditCategory(myShop?.category || '');
    setEditAddress(myShop?.address || '');
    setEditPhone(myShop?.phone || '');
    setEditZone(myShop?.zone || '');
    setEditLogoPreview(myShop?.logo || null);
    setEditBase64Logo(undefined);
    setShowEditShopModal(true);
  };

  const handleSaveShop = async () => {
    setIsSavingShop(true);
    try {
      await onEditShop({
        name: editName,
        category: editCategory,
        address: editAddress,
        phone: editPhone,
        zone: editZone,
        base64Logo: editBase64Logo,
        logo: myShop?.logo
      });
      setShowEditShopModal(false);
    } finally {
      setIsSavingShop(false);
    }
  };
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Gastronomía');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [expiryDate, setExpiryDate] = useState('2026-07-20');
  const [hasQrCoupon, setHasQrCoupon] = useState(true);
  const [isFlashSale, setIsFlashSale] = useState(false);

  // Live QR Code coupon validation states
  const [activeScannerTab, setActiveScannerTab] = useState<'scan' | 'manual'>('scan');
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannerInstance, setScannerInstance] = useState<any>(null);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const processingScanRef = React.useRef(false);
  const lastScannedCodeRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    return () => {
      if (scannerInstance) {
        try {
          scannerInstance.stop().catch((e: any) => console.log("Clean stop error", e));
        } catch (e) {}
      }
    };
  }, [scannerInstance]);

  const startCameraScan = () => {
    setScanResult(null);
    setIsScanning(true);
    
    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const html5QrCode = new Html5Qrcode("coupon-reader-box");
        setScannerInstance(html5QrCode);

        html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.75;
              return { width: size, height: size };
            }
          },
          (decodedText) => {
            const normalizedCode = decodedText.trim();
            if (!normalizedCode || processingScanRef.current || lastScannedCodeRef.current === normalizedCode) return;
            processingScanRef.current = true;
            lastScannedCodeRef.current = normalizedCode;
            html5QrCode.stop().then(() => {
              setIsScanning(false);
              setScannerInstance(null);
              handleValidateCoupon(normalizedCode);
            }).catch((err) => {
              console.error("Stop scan error", err);
              setIsScanning(false);
              handleValidateCoupon(normalizedCode);
            });
          },
          () => {
            // verbose error logs can be bypassed
          }
        ).catch((err) => {
          console.error("Camera start failed:", err);
          setIsScanning(false);
          setScanResult({
            success: false,
            message: "No se pudo acceder a la cámara. Por favor asegurate de dar permisos de cámara o ingresá el código de cupón manualmente."
          });
        });
      } catch (err) {
        console.error("Loader failed", err);
        setIsScanning(false);
      }
    }, 150);
  };

  const stopCameraScan = () => {
    if (scannerInstance) {
      scannerInstance.stop().then(() => {
        setIsScanning(false);
        setScannerInstance(null);
      }).catch((err: any) => {
        console.error(err);
        setIsScanning(false);
        setScannerInstance(null);
      });
    } else {
      setIsScanning(false);
    }
  };

  const handleValidateCoupon = async (code: string) => {
    const normalizedCode = code.trim();
    if (!normalizedCode || processingScanRef.current && lastScannedCodeRef.current !== normalizedCode) return;
    processingScanRef.current = true;
    lastScannedCodeRef.current = normalizedCode;
    setScanLoading(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/coupons/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scannedCode: normalizedCode })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setScanResult({
          success: true,
          message: `✅ ¡CUPÓN DESACTIVADO CON ÉXITO! El beneficio "${data.offerTitle}" ha sido validado correctamente.`,
          data
        });
        setManualCode('');
        
        // Dispatch instant event to fetch updated database offers
        window.dispatchEvent(new CustomEvent('refresh-live-data'));
      } else {
        setScanResult({
          success: false,
          message: data.error || "No se pudo validar el cupón."
        });
      }
    } catch (err) {
      setScanResult({
        success: false,
        message: "Error de conexión con el servidor. Intentá de nuevo."
      });
    } finally {
      setScanLoading(false);
    }
  };

  // Custom image from gallery/device files
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Category image presets so published offers always look stunning!
  const categoryImages: Record<string, string> = {
    'Gastronomía': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
    'Indumentaria': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
    'Supermercados': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    'Electro': 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=600&q=80',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !originalPrice || !discountPrice) {
      setStatusMessage({ type: 'error', text: 'Por favor, completá los campos obligatorios.' });
      return;
    }

    const oPrice = parseFloat(originalPrice);
    const dPrice = parseFloat(discountPrice);

    if (isNaN(oPrice) || isNaN(dPrice) || oPrice <= 0 || dPrice <= 0) {
      setStatusMessage({ type: 'error', text: 'Los precios ingresados deben ser números válidos.' });
      return;
    }

    if (dPrice >= oPrice) {
      setStatusMessage({ type: 'error', text: 'El precio de oferta debe ser menor al precio original.' });
      return;
    }

    // Call the add handler with the custom uploaded image OR category preset fallback
    onAddOffer({
      title,
      description: description || `Gran descuento especial en ${title}. ¡No te lo pierdas en nuestro local en Oberá!`,
      category,
      originalPrice: oPrice,
      discountPrice: dPrice,
      expiryDate,
      hasQrCoupon,
      isFlashSale,
      image: customImage || categoryImages[category] || categoryImages['Gastronomía']
    });

    setStatusMessage({ type: 'success', text: '🎉 ¡Oferta publicada correctamente en la plataforma!' });
    
    // Reset form
    setTitle('');
    setDescription('');
    setOriginalPrice('');
    setDiscountPrice('');
    setIsFlashSale(false);
    setCustomImage(null);

    // Clear alert after 4 seconds
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  // Stats calculation
  const totalViews = myOffers.reduce((sum, offer) => sum + (offer.views || 0), 0);
  const totalClaims = myOffers.reduce((sum, offer) => sum + (offer.couponsClaimed || 0), 0);
  const claimRate = totalViews > 0 ? Math.round((totalClaims / totalViews) * 100) : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 transition-colors animate-slide-up">
      
      {/* Merchant profile header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-850 dark:from-zinc-900 dark:to-zinc-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800 dark:border-zinc-800 transition-all duration-350 hover:scale-[1.005] hover:shadow-2xl group animate-scale-up">
        <div className="absolute right-[-40px] top-[-40px] w-40 h-40 bg-brand-orange dark:bg-indigo-600 rounded-full blur-3xl opacity-20 transition-all duration-700 group-hover:scale-110" />
        <div className="absolute left-[-20px] bottom-[-20px] w-32 h-32 bg-brand-red rounded-full blur-3xl opacity-15 transition-all duration-700 group-hover:scale-110" />
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 relative z-10">
          <div className="h-16 w-16 rounded-2xl bg-brand-orange dark:bg-indigo-600 text-white text-3xl font-bold flex flex-wrap items-center justify-center shadow-lg shadow-orange-500/10 transition-transform duration-500 group-hover:rotate-6 overflow-hidden shrink-0">
            <ShopLogo logo={myShop?.logo} className="text-3xl" fallbackSize="w-14 h-14" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] bg-brand-orange dark:bg-indigo-600 text-white px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
                Comerciante Verificado
              </span>
              <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                ● Activo
              </span>
            </div>
            <h2 className="font-display font-black text-2xl text-white tracking-tight">{myShop?.name || 'Mi Comercio'}</h2>
            <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
              📍 {myShop?.address || 'Oberá, Misiones'}
            </p>
          </div>
          <button
            onClick={openEditShopModal}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold rounded-xl backdrop-blur-xs transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" /> Editar mi negocio
          </button>
        </div>
      </div>

      {/* Plan, pagos y destacados */}
      <PlanPanel myOffers={myOffers} />

      {/* Modal de edición del negocio */}
      {showEditShopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="font-display font-black text-lg text-slate-900 dark:text-zinc-50">Editar mi negocio</h3>
              <button
                onClick={() => setShowEditShopModal(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Logo */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                  Logo del negocio
                </label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-zinc-700">
                    {editLogoPreview ? (
                      <ShopLogo logo={editLogoPreview} className="text-3xl" fallbackSize="w-16 h-16" />
                    ) : (
                      <Store className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            const result = reader.result as string;
                            setEditLogoPreview(result);
                            setEditBase64Logo(result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div className="text-xs font-bold text-brand-orange dark:text-indigo-400 border border-dashed border-slate-300 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-center hover:bg-slate-50 dark:hover:bg-zinc-950 transition-colors">
                      Cambiar logo
                    </div>
                  </label>
                </div>
              </div>

              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">Nombre del negocio</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-brand-orange dark:focus:ring-indigo-500"
                />
              </div>

              {/* Categoría */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">Categoría</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-brand-orange dark:focus:ring-indigo-500"
                >
                  <option value="Gastronomía">Gastronomía</option>
                  <option value="Indumentaria">Indumentaria</option>
                  <option value="Supermercados">Supermercados</option>
                  <option value="Electro">Electro</option>
                </select>
              </div>

              {/* Dirección */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">Dirección</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-brand-orange dark:focus:ring-indigo-500"
                />
              </div>

              {/* Teléfono */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">Teléfono (WhatsApp)</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="543755400000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-brand-orange dark:focus:ring-indigo-500"
                />
              </div>

              {/* Zona */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">Zona</label>
                <input
                  type="text"
                  value={editZone}
                  onChange={(e) => setEditZone(e.target.value)}
                  placeholder="Av. Sarmiento"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-brand-orange dark:focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={handleSaveShop}
                disabled={isSavingShop || !editName}
                className="w-full py-3 bg-brand-orange hover:bg-brand-orange/95 dark:bg-indigo-600 dark:hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-md transition-colors text-sm cursor-pointer"
              >
                {isSavingShop ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Forms & Analytics) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Analytics Snapshot Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-6 transition-all duration-300 hover:shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-slate-900 dark:text-zinc-50 text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-orange dark:text-indigo-400" />
                Rendimiento del Negocio
              </h3>
              <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" /> Actualizado al instante
              </span>
            </div>

            {/* Dynamic metrics grid */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100/70 dark:border-zinc-800/60 rounded-2xl transition-all duration-300 hover:scale-103 hover:bg-slate-100/50 dark:hover:bg-zinc-900 cursor-pointer shadow-xs">
                <div className="flex items-center justify-center text-slate-400 mb-1 transition-transform group-hover:scale-110">
                  <Users className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-[10px] text-slate-450 dark:text-zinc-500 font-bold uppercase tracking-wider block">Visitas</span>
                <span className="text-xl font-display font-black text-slate-800 dark:text-zinc-100 mt-1 block">{totalViews.toLocaleString()}</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100/70 dark:border-zinc-800/60 rounded-2xl transition-all duration-300 hover:scale-103 hover:bg-slate-100/50 dark:hover:bg-zinc-900 cursor-pointer shadow-xs">
                <div className="flex items-center justify-center text-slate-400 mb-1">
                  <QrCode className="w-4 h-4 text-brand-red" />
                </div>
                <span className="text-[10px] text-slate-450 dark:text-zinc-500 font-bold uppercase tracking-wider block">Lecturas QR</span>
                <span className="text-xl font-display font-black text-slate-800 dark:text-zinc-100 mt-1 block">{totalClaims.toLocaleString()}</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100/70 dark:border-zinc-800/60 rounded-2xl transition-all duration-300 hover:scale-103 hover:bg-slate-100/50 dark:hover:bg-zinc-900 cursor-pointer shadow-xs">
                <div className="flex items-center justify-center text-slate-400 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                </div>
                <span className="text-[10px] text-slate-450 dark:text-zinc-500 font-bold uppercase tracking-wider block">Conversión</span>
                <span className="text-xl font-display font-black text-slate-800 dark:text-zinc-100 mt-1 block">{claimRate}%</span>
              </div>
            </div>

            {/* Visual Progress Bars */}
            <div className="space-y-4 pt-2 border-t border-slate-50 dark:border-zinc-800/80">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-650 dark:text-zinc-400 mb-1.5">
                  <span>Porcentaje de conversión (Lectores de QR)</span>
                  <span className="text-slate-900 dark:text-zinc-200 font-bold">{claimRate}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-850 rounded-full h-2">
                  <div
                    className="bg-red-500 dark:bg-indigo-550 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(claimRate, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-650 dark:text-zinc-400 mb-1.5">
                  <span>Presencia Digital de tus ofertas</span>
                  <span className="text-slate-900 dark:text-zinc-200 font-bold">72% de Oberá</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-850 rounded-full h-2">
                  <div
                    className="bg-brand-orange dark:bg-indigo-400 h-2 rounded-full"
                    style={{ width: '72%' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Publish New Offer Form */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-3xl p-6 shadow-xs">
            <h3 className="font-display font-bold text-slate-900 dark:text-zinc-50 text-lg flex items-center gap-2 mb-5">
              <span className="p-1.5 bg-brand-orange dark:bg-indigo-600 text-white rounded-lg"><Plus className="w-4 h-4" /></span>
              Publicar Nueva Oferta
            </h3>

            {statusMessage && (
              <div className={`p-4 rounded-xl mb-5 flex items-start gap-2.5 animate-in fade-in duration-200 ${
                statusMessage.type === 'success' ? 'bg-green-50 dark:bg-green-950/20 text-green-850 dark:text-green-300 border border-green-250/30' : 'bg-red-50 dark:bg-red-950/20 text-red-850 dark:text-red-300 border border-red-250/30'
              }`}>
                {statusMessage.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                )}
                <p className="text-xs font-semibold">{statusMessage.text}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4.5">
              {/* Offer Title */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
                  Nombre de la Oferta / Producto <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: 30% Off en Mate de Madera Tallado"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                  required
                />
              </div>

              {/* Category Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="transition-all hover:translate-y-[-1px]">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all cursor-pointer"
                  >
                    <option value="Gastronomía">Gastronomía 🧉</option>
                    <option value="Indumentaria">Indumentaria 👕</option>
                    <option value="Supermercados">Supermercados 🛒</option>
                    <option value="Electro">Electro ⚡</option>
                  </select>
                </div>

                <div className="transition-all hover:translate-y-[-1px]">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
                    Vencimiento
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                  />
                </div>
              </div>

              {/* Foto del Producto (Subir archivos / Galería o usar preset) */}
              <div className="space-y-2 animate-scale-up">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                  Foto del Producto / Oferta
                </label>
                
                {!customImage ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          setCustomImage(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 cursor-pointer relative group ${
                      isDragging
                        ? 'border-brand-orange bg-orange-50/10 dark:border-indigo-550 dark:bg-zinc-800/40 scale-[1.01]'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-brand-orange dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-zinc-950/40 hover:bg-white dark:hover:bg-zinc-900'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setCustomImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="product-photo-upload"
                    />
                    
                    <div className="flex flex-col items-center justify-center space-y-2.5">
                      <div className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-400 group-hover:text-brand-orange dark:group-hover:text-indigo-400 rounded-xl shadow-xs transition-colors group-hover:scale-110 duration-300">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                          Arrastrá tu foto acá o <span className="text-brand-orange dark:text-indigo-400 group-hover:underline">explorá tu galería/archivos</span>
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold leading-normal">
                          Soporta fotos o imágenes del dispositivo (PNG, JPG, WebP)
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-850 aspect-video group shadow-sm">
                    <img
                      src={customImage}
                      alt="Vista previa"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <p className="text-[10px] text-white font-extrabold tracking-wider uppercase bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                        <Image className="w-3.5 h-3.5" /> Foto Cargada Exitosamente
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomImage(null)}
                      className="absolute top-2.5 right-2.5 p-1.5 bg-black/75 hover:bg-red-500 text-white rounded-lg transition-colors shadow-lg cursor-pointer"
                      title="Eliminar Foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {!customImage && (
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold flex items-center gap-1 leading-normal">
                    💡 Si no seleccionás foto, usaremos una imagen predeterminada de <strong>{category}</strong>.
                  </p>
                )}
              </div>

              {/* Pricing Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
                    Precio Original ($ ARS) <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="45000"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
                    Precio de Oferta ($ ARS) <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="31500"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Optional Description */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
                  Descripción Corta (Opcional)
                </label>
                <textarea
                  placeholder="Describí los detalles de tu oferta, stock de unidades y condiciones..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all resize-none"
                />
              </div>

              {/* Toggle Options */}
              <div className="space-y-2 border-t border-slate-105 dark:border-zinc-800/80 pt-3">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasQrCoupon}
                    onChange={(e) => setHasQrCoupon(e.target.checked)}
                    className="w-4 h-4 rounded-md border-slate-300 dark:border-zinc-700 text-brand-orange dark:text-indigo-500 focus:ring-brand-orange dark:focus:ring-indigo-500 accent-brand-orange dark:accent-indigo-500"
                  />
                  <span className="text-xs text-slate-700 dark:text-zinc-300 font-bold flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-brand-orange dark:text-indigo-400" />
                    Generar Cupón QR para este producto
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isFlashSale}
                    onChange={(e) => setIsFlashSale(e.target.checked)}
                    className="w-4 h-4 rounded-md border-slate-300 dark:border-zinc-700 text-brand-orange dark:text-indigo-500 focus:ring-brand-orange dark:focus:ring-indigo-500 accent-brand-orange dark:accent-indigo-500"
                  />
                  <span className="text-xs text-slate-700 dark:text-zinc-300 font-bold flex items-center gap-1.5">
                    🔥 Clasificar como "Oferta Flash del Día"
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-brand-orange hover:bg-brand-orange/95 dark:bg-indigo-600 dark:hover:bg-indigo-750 text-white font-extrabold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all hover:translate-y-[-1px] text-xs cursor-pointer"
              >
                Publicar Oferta en Oberá
              </button>
            </form>
          </div>

        </div>

        {/* Right Column (Currently Published Campaigns list) */}
        <div className="space-y-8">

          {/* VALIDADOR DE CUPONES QR EN VIVO */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 dark:border-zinc-850 pb-3">
              <div className="p-1.5 bg-brand-orange/10 dark:bg-indigo-500/10 text-brand-orange dark:text-indigo-400 rounded-lg">
                <QrCode className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="font-display font-black text-sm text-slate-900 dark:text-zinc-100 tracking-tight">
                  Validador de Cupones
                </h3>
                <p className="text-[10px] text-slate-450 dark:text-zinc-500 font-bold uppercase tracking-wider">
                  Desactivación de códigos de clientes
                </p>
              </div>
            </div>

            {/* Selector de modo */}
            <div className="flex bg-slate-50 dark:bg-zinc-950 p-1 rounded-xl border border-slate-100 dark:border-zinc-850">
              <button
                type="button"
                onClick={() => {
                  stopCameraScan();
                  setActiveScannerTab('scan');
                  setScanResult(null);
                  processingScanRef.current = false;
                  lastScannedCodeRef.current = null;
                }}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeScannerTab === 'scan'
                    ? 'bg-white dark:bg-zinc-900 text-brand-orange dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Escáner QR Cámara
              </button>
              <button
                type="button"
                onClick={() => {
                  stopCameraScan();
                  setActiveScannerTab('manual');
                  setScanResult(null);
                  processingScanRef.current = false;
                  lastScannedCodeRef.current = null;
                }}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeScannerTab === 'manual'
                    ? 'bg-white dark:bg-zinc-900 text-brand-orange dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400'
                }`}
              >
                <Keyboard className="w-3.5 h-3.5" />
                Ingresar Código Manual
              </button>
            </div>

            {/* TAB: CÁMARA */}
            {activeScannerTab === 'scan' && (
              <div className="space-y-3">
                {isScanning ? (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden bg-black aspect-square max-w-xs mx-auto border-2 border-brand-orange dark:border-indigo-500 shadow-lg">
                      <div id="coupon-reader-box" className="w-full h-full object-cover" />
                      
                      {/* Laser scanning overlay line */}
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-bounce" style={{ animationDuration: '3s' }} />
                      <div className="absolute inset-4 border border-white/20 rounded-xl pointer-events-none flex items-center justify-center">
                        <div className="w-44 h-44 border-2 border-dashed border-white/40 rounded-lg animate-pulse" />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={stopCameraScan}
                      className="w-full py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-650 dark:text-red-400 font-extrabold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      🛑 Detener Cámara
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-5 border border-dashed border-slate-100 dark:border-zinc-800 rounded-2xl space-y-3">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-zinc-950 text-slate-400 dark:text-zinc-500 border border-slate-100 dark:border-zinc-850 rounded-full flex items-center justify-center mx-auto text-lg">
                      📸
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
                      Escaneá desde tu celular el código QR de cupón que le figura al cliente para validarlo y desactivarlo.
                    </p>
                    <button
                      type="button"
                      onClick={startCameraScan}
                      className="py-2.5 px-4 bg-brand-orange hover:bg-brand-orange/95 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-transform hover:scale-102 cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                    >
                      <Camera className="w-4 h-4" /> Iniciar Escáner en Vivo
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB: MANUAL */}
            {activeScannerTab === 'manual' && (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                  ¿La cámara no funciona o estás en PC? Ingresá el identificador de cupón que el usuario tiene en pantalla:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej: coupon_1720542304123"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-zinc-200 uppercase focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleValidateCoupon(manualCode)}
                    disabled={scanLoading || !manualCode.trim()}
                    className="px-4 bg-brand-orange dark:bg-indigo-600 hover:bg-brand-orange/95 text-white font-extrabold rounded-xl text-xs shadow-xs disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    {scanLoading ? 'Validando...' : 'Validar'}
                  </button>
                </div>
              </div>
            )}

            {/* RESULTADOS DE LA VALIDACIÓN */}
            {scanResult && (
              <div className={`p-4 rounded-2xl border text-xs leading-normal animate-scale-up ${
                scanResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-150/20 text-emerald-850 dark:text-emerald-300'
                  : 'bg-red-50 dark:bg-red-950/20 border-red-150/20 text-red-850 dark:text-red-300'
              }`}>
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0">{scanResult.success ? '🎉' : '❌'}</span>
                  <div className="space-y-1">
                    <p className="font-bold">{scanResult.message}</p>
                    {scanResult.success && scanResult.data && (
                      <div className="text-[10px] opacity-90 border-t border-emerald-200/40 pt-1.5 mt-1.5 space-y-0.5">
                        <p>💡 <strong>Oferta:</strong> {scanResult.data.offerTitle}</p>
                        <p>💰 <strong>Ahorro para el Cliente:</strong> El cliente obtuvo el descuento pactado.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-3xl p-6 shadow-xs transition-all duration-300 hover:shadow-md">
            <h3 className="font-display font-bold text-slate-900 dark:text-zinc-50 text-base mb-4 flex items-center justify-between">
              <span>Ofertas Publicadas ({myOffers.length})</span>
            </h3>

            {myOffers.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-400 dark:text-zinc-500 text-xs font-semibold animate-pulse">
                Aún no publicaste ninguna oferta. ¡Completá el formulario para lanzar tu primera campaña!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {myOffers.map((offer) => (
                  <div key={offer.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4 transition-all duration-300 hover:translate-x-1 animate-scale-up group">
                    <div className="flex items-center gap-3">
                      <div className="relative overflow-hidden rounded-xl w-12 h-12 shrink-0 border border-slate-100 dark:border-zinc-800">
                        <img
                          src={offer.image}
                          alt={offer.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-850 dark:text-zinc-200 leading-snug line-clamp-1 group-hover:text-brand-orange dark:group-hover:text-indigo-400 transition-colors">{offer.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-950 px-1.5 py-0.5 rounded-md border border-slate-100 dark:border-zinc-800">
                            {offer.category}
                          </span>
                          <span className="text-xs font-bold text-red-500 dark:text-red-400">
                            ${offer.discountPrice.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right hidden sm:block">
                        <span className="text-[9px] text-slate-400 dark:text-zinc-500 block font-semibold">Visitas</span>
                        <span className="text-xs font-bold text-slate-750 dark:text-zinc-300 flex items-center justify-end gap-1">
                          <Eye className="w-3 h-3 text-slate-400 dark:text-zinc-500" /> {offer.views}
                        </span>
                      </div>

                      <button
                        onClick={() => onDeleteOffer(offer.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 rounded-xl transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95"
                        title="Eliminar Publicación"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
