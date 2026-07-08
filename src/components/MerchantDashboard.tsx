import React, { useState } from 'react';
import { Store, Plus, TrendingUp, Users, QrCode, Trash2, CheckCircle, AlertCircle, Eye, RefreshCw, Sparkles, ChevronRight, Upload, Image, X } from 'lucide-react';
import { Offer, Shop } from '../types';
import ShopLogo from './ShopLogo';

interface MerchantDashboardProps {
  myOffers: Offer[];
  myShop: Shop;
  onAddOffer: (newOffer: Omit<Offer, 'id' | 'shopId' | 'shopName' | 'views' | 'couponsClaimed'>) => void;
  onDeleteOffer: (id: string) => void;
}

export default function MerchantDashboard({ myOffers, myShop, onAddOffer, onDeleteOffer }: MerchantDashboardProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Gastronomía');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [expiryDate, setExpiryDate] = useState('2026-07-20');
  const [hasQrCoupon, setHasQrCoupon] = useState(true);
  const [isFlashSale, setIsFlashSale] = useState(false);
  
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
            <ShopLogo logo={myShop.logo} className="text-3xl" fallbackSize="w-14 h-14" />
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
            <h2 className="font-display font-black text-2xl text-white tracking-tight">{myShop.name}</h2>
            <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
              📍 {myShop.address}
            </p>
          </div>
        </div>
      </div>

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
