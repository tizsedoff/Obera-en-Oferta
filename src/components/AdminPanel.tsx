import React, { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, KeyRound, Save, CheckCircle, AlertTriangle, Building, Tag, Compass, Sparkles, ExternalLink, MapPin, Map as MapIcon, Sliders, Settings, Check, RefreshCw, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Shop, Offer, Notification, Category, MapConfig, SiteConfig } from '../types';
import ShopLogo from './ShopLogo';

interface AdminPanelProps {
  shops: Shop[];
  onUpdateShops: (shops: Shop[]) => void;
  offers: Offer[];
  onUpdateOffers: (offers: Offer[]) => void;
  notifications: Notification[];
  onUpdateNotifications: (notifs: Notification[]) => void;
  categories: Category[];
  onUpdateCategories: (categories: Category[]) => void;
  zones: string[];
  onUpdateZones: (zones: string[]) => void;
  mapConfig: MapConfig;
  onUpdateMapConfig: (config: MapConfig) => void;
  siteConfig: SiteConfig;
  onUpdateSiteConfig: (config: SiteConfig) => void;
  onClose: () => void;
}

export default function AdminPanel({
  shops,
  onUpdateShops,
  offers,
  onUpdateOffers,
  notifications,
  onUpdateNotifications,
  categories,
  onUpdateCategories,
  zones,
  onUpdateZones,
  mapConfig,
  onUpdateMapConfig,
  siteConfig,
  onUpdateSiteConfig,
  onClose,
}: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'shops' | 'offers' | 'clients' | 'categories' | 'zones' | 'map' | 'site'>('shops');

  // Estado de la pestaña de clientes/comercios (usuarios reales de Supabase Auth)
  interface AdminUser {
    id: string;
    email: string;
    nombre: string | null;
    rol: string;
    createdAt: string;
    shopName: string | null;
  }
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState<'all' | 'customer' | 'merchant'>('all');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const tabScrollRef = React.useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabScrollRef.current) {
      tabScrollRef.current.scrollBy({ left: direction === 'left' ? -160 : 160, behavior: 'smooth' });
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-admin-password': password }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'No se pudo cargar la lista de usuarios.');
      }
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setUsersError(err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'clients' && isAuthenticated) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleDeleteUser = async (id: string, label: string) => {
    if (!window.confirm(`¿Seguro que querés eliminar la cuenta de "${label}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setDeletingUserId(id);
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'No se pudo eliminar el usuario.');
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingUserId(null);
    }
  };
  
  // Shop forms state
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [isAddingShop, setIsAddingShop] = useState(false);
  const [shopForm, setShopForm] = useState<Omit<Shop, 'id'> & { latitude: string | number; longitude: string | number }>({
    name: '',
    logo: '🏬',
    category: 'Gastronomía',
    zone: 'Av. Sarmiento',
    isOpen: true,
    address: '',
    phone: '',
    rating: 4.5,
    latitude: -27.4856,
    longitude: -55.1193
  });

  // Offer forms state
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [isAddingOffer, setIsAddingOffer] = useState(false);
  const [offerForm, setOfferForm] = useState<Omit<Offer, 'id' | 'shopName' | 'views' | 'couponsClaimed'>>({
    shopId: shops[0]?.id || '',
    title: '',
    description: '',
    originalPrice: 1000,
    discountPrice: 800,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
    category: 'Gastronomía',
    expiryDate: '2026-12-31',
    hasQrCoupon: true,
    qrCodeValue: '',
    isFlashSale: false
  });

  // --- NEW CONFIGURATION FORM STATES & SUCCESS FLASHER STATES ---
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState<Category>({
    id: '',
    name: '',
    emoji: '⭐',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  });

  const [editingZoneIndex, setEditingZoneIndex] = useState<number | null>(null);
  const [isAddingZone, setIsAddingZone] = useState(false);
  const [zoneForm, setZoneForm] = useState<string>('');

  const [mapForm, setMapForm] = useState<MapConfig>({ ...mapConfig });
  const [mapSaved, setMapSaved] = useState(false);

  const [siteForm, setSiteForm] = useState<SiteConfig>({ ...siteConfig });
  const [siteSaved, setSiteSaved] = useState(false);

  // handlers
  const saveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.id.trim() || !categoryForm.name.trim()) return;
    
    // Normalize id
    const cleanId = categoryForm.id.trim().toLowerCase().replace(/\s+/g, '-');
    const finalCat = { ...categoryForm, id: cleanId };

    if (isAddingCategory) {
      onUpdateCategories([...categories, finalCat]);
    } else if (editingCategory) {
      onUpdateCategories(categories.map(c => c.id === editingCategory.id ? finalCat : c));
    }
    setEditingCategory(null);
    setIsAddingCategory(false);
    setCategoryForm({ id: '', name: '', emoji: '⭐', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' });
  };

  const startEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm(cat);
    setIsAddingCategory(false);
  };

  const startAddCategory = () => {
    setCategoryForm({ id: '', name: '', emoji: '⭐', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' });
    setIsAddingCategory(true);
    setEditingCategory(null);
  };

  const deleteCategory = (id: string) => {
    if (id === 'all') return;
    onUpdateCategories(categories.filter(c => c.id !== id));
  };

  const saveZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneForm.trim()) return;

    if (isAddingZone) {
      onUpdateZones([...zones, zoneForm.trim()]);
    } else if (editingZoneIndex !== null) {
      onUpdateZones(zones.map((z, idx) => idx === editingZoneIndex ? zoneForm.trim() : z));
    }
    setEditingZoneIndex(null);
    setIsAddingZone(false);
    setZoneForm('');
  };

  const startEditZone = (index: number) => {
    setEditingZoneIndex(index);
    setZoneForm(zones[index]);
    setIsAddingZone(false);
  };

  const startAddZone = () => {
    setZoneForm('');
    setIsAddingZone(true);
    setEditingZoneIndex(null);
  };

  const deleteZone = (index: number) => {
    if (zones[index] === 'Todos') return;
    onUpdateZones(zones.filter((_, idx) => idx !== index));
  };

  const saveMapConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMapConfig({
      ...mapForm,
      centerLat: Number(mapForm.centerLat),
      centerLng: Number(mapForm.centerLng),
      defaultZoom: Number(mapForm.defaultZoom)
    });
    setMapSaved(true);
    setTimeout(() => setMapSaved(false), 3000);
  };

  const saveSiteConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSiteConfig(siteForm);
    setSiteSaved(true);
    setTimeout(() => setSiteSaved(false), 3000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'apsdev') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Contraseña incorrecta. ¡Che, probá de nuevo!');
    }
  };

  // --- SHOP ACTIONS ---
  const [savingShop, setSavingShop] = useState(false);
  const saveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingShop(true);

    // Safely parse latitude and longitude, supporting both dot and comma as decimal separator
    const cleanLatStr = String(shopForm.latitude).trim().replace(',', '.');
    const cleanLngStr = String(shopForm.longitude).trim().replace(',', '.');

    let parsedLat = parseFloat(cleanLatStr);
    let parsedLng = parseFloat(cleanLngStr);

    if (isNaN(parsedLat)) parsedLat = -27.4856;
    if (isNaN(parsedLng)) parsedLng = -55.1193;

    // Si el logo es un archivo recién cargado (data URL), va como base64Logo para que
    // el backend lo suba de verdad al bucket de Storage. Si es un emoji o una URL externa, va tal cual.
    const isUploadedFile = shopForm.logo && shopForm.logo.startsWith('data:');
    const logoPayload = isUploadedFile
      ? { base64Logo: shopForm.logo }
      : { logo: shopForm.logo };

    const finalShopForm = {
      name: shopForm.name,
      category: shopForm.category,
      zone: shopForm.zone,
      address: shopForm.address,
      phone: shopForm.phone,
      latitude: parsedLat,
      longitude: parsedLng,
      ...logoPayload
    };

    try {
      if (editingShop) {
        // Edit existing shop
        const res = await fetch('/api/shops', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
          body: JSON.stringify({ id: editingShop.id, ...finalShopForm })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'No se pudo actualizar el negocio.');
        }

        const updated = shops.map(s => s.id === editingShop.id
          ? { ...s, ...finalShopForm, logo: isUploadedFile ? s.logo : shopForm.logo }
          : s);
        onUpdateShops(updated);

        const updatedOffers = offers.map(o => o.shopId === editingShop.id ? { ...o, shopName: finalShopForm.name, category: finalShopForm.category } : o);
        onUpdateOffers(updatedOffers);

        setEditingShop(null);
      } else {
        // Add new shop
        const res = await fetch('/api/shops', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalShopForm)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'No se pudo registrar el negocio.');
        }
        const newShop: Shop = await res.json();
        onUpdateShops([...shops, newShop]);
        setIsAddingShop(false);

        // Trigger notification
        const newNotif: Notification = {
          id: `notif-${Date.now()}`,
          text: `🆕 ¡Nuevo comercio adherido! Se sumó "${newShop.name}" en la zona de ${newShop.zone}.`,
          time: 'Hace 1 min',
          isRead: false,
          type: 'new_shop'
        };
        onUpdateNotifications([newNotif, ...notifications]);
      }
      resetShopForm();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSavingShop(false);
    }
  };

  const startEditShop = (shop: Shop) => {
    setEditingShop(shop);

    // Retrieve real coordinates if they are undefined (to preserve accuracy of initial shops)
    let defaultLat = -27.4856;
    let defaultLng = -55.1193;

    const REAL_COORDINATES: Record<string, { lat: number; lng: number }> = {
      'shop-1': { lat: -27.484224, lng: -55.120531 },
      'shop-2': { lat: -27.486214, lng: -55.118811 },
      'shop-3': { lat: -27.489512, lng: -55.115201 },
      'shop-4': { lat: -27.485633, lng: -55.119312 },
      'shop-5': { lat: -27.483011, lng: -55.122045 },
      'shop-6': { lat: -27.487512, lng: -55.116521 },
    };

    if (shop.latitude !== undefined) {
      defaultLat = shop.latitude;
    } else if (REAL_COORDINATES[shop.id]) {
      defaultLat = REAL_COORDINATES[shop.id].lat;
    }

    if (shop.longitude !== undefined) {
      defaultLng = shop.longitude;
    } else if (REAL_COORDINATES[shop.id]) {
      defaultLng = REAL_COORDINATES[shop.id].lng;
    }

    setShopForm({
      name: shop.name,
      logo: shop.logo,
      category: shop.category,
      zone: shop.zone,
      isOpen: shop.isOpen,
      address: shop.address,
      phone: shop.phone,
      rating: shop.rating,
      latitude: defaultLat,
      longitude: defaultLng
    });
    setIsAddingShop(false);
  };

  const deleteShop = async (shopId: string) => {
    if (!confirm('¿Seguro que querés eliminar este comercio? También se eliminarán todas sus ofertas asociadas.')) {
      return;
    }
    try {
      const res = await fetch(`/api/shops?id=${shopId}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'No se pudo eliminar el negocio.');
      }
      onUpdateShops(shops.filter(s => s.id !== shopId));
      onUpdateOffers(offers.filter(o => o.shopId !== shopId));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const resetShopForm = () => {
    // Generate slight random offset near Oberá center so each new business has a realistic distinct point by default
    const randomLatOffset = (Math.random() - 0.5) * 0.009;
    const randomLngOffset = (Math.random() - 0.5) * 0.009;
    setShopForm({
      name: '',
      logo: '🏬',
      category: 'Gastronomía',
      zone: 'Av. Sarmiento',
      isOpen: true,
      address: '',
      phone: '',
      rating: 4.5,
      latitude: parseFloat((-27.4856 + randomLatOffset).toFixed(6)),
      longitude: parseFloat((-55.1193 + randomLngOffset).toFixed(6))
    });
  };

  // --- OFFER ACTIONS ---
  const saveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    const parentShop = shops.find(s => s.id === offerForm.shopId);
    if (!parentShop) return;

    if (editingOffer) {
      // Edit existing offer
      const updated = offers.map(o => o.id === editingOffer.id ? {
        ...o,
        ...offerForm,
        shopName: parentShop.name,
        category: parentShop.category
      } : o);
      const res = await fetch('/api/offers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingOffer.id, ...offerForm, originalPrice: Number(offerForm.originalPrice), discountPrice: Number(offerForm.discountPrice) })
      });
      if (!res.ok) throw new Error('No se pudo guardar la oferta en la base de datos.');
      const savedOffer = await res.json();
      onUpdateOffers(updated.map(offer => offer.id === editingOffer.id ? { ...offer, ...savedOffer } : offer));
      setEditingOffer(null);
    } else {
      // Add new offer
      const newOffer: Offer = {
        id: `offer-${Date.now()}`,
        shopId: offerForm.shopId,
        shopName: parentShop.name,
        title: offerForm.title,
        description: offerForm.description,
        originalPrice: Number(offerForm.originalPrice),
        discountPrice: Number(offerForm.discountPrice),
        image: offerForm.image,
        category: parentShop.category, // auto match shop category
        expiryDate: offerForm.expiryDate,
        hasQrCoupon: offerForm.hasQrCoupon,
        qrCodeValue: offerForm.qrCodeValue || `QR-EXC-${Date.now().toString().slice(-4)}`,
        views: Math.floor(Math.random() * 20) + 1,
        couponsClaimed: 0,
        isFlashSale: offerForm.isFlashSale
      };
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newOffer, shopId: parentShop.id, shopName: parentShop.name })
      });
      if (!res.ok) throw new Error('No se pudo guardar la oferta en la base de datos.');
      const savedOffer = await res.json();
      onUpdateOffers([savedOffer, ...offers]);
      setIsAddingOffer(false);

      // Trigger notification
      const newNotif: Notification = {
        id: `notif-${Date.now()}`,
        text: `🔥 Nueva oferta: "${newOffer.title}" en ${parentShop.name} ¡Aprovechala hoy!`,
        time: 'Hace 1 min',
        isRead: false,
        type: newOffer.isFlashSale ? 'flash' : 'coupon'
      };
      onUpdateNotifications([newNotif, ...notifications]);
    }
    // Reset offer form
    resetOfferForm();
  };

  const startEditOffer = (offer: Offer) => {
    setEditingOffer(offer);
    setOfferForm({
      shopId: offer.shopId,
      title: offer.title,
      description: offer.description,
      originalPrice: offer.originalPrice,
      discountPrice: offer.discountPrice,
      image: offer.image,
      category: offer.category,
      expiryDate: offer.expiryDate,
      hasQrCoupon: offer.hasQrCoupon,
      qrCodeValue: offer.qrCodeValue || '',
      isFlashSale: offer.isFlashSale
    });
    setIsAddingOffer(false);
  };

  const deleteOffer = async (offerId: string) => {
    if (!confirm('¿Seguro que querés eliminar esta oferta?')) {
      return;
    }
    try {
      const res = await fetch(`/api/offers?id=${offerId}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'No se pudo eliminar la oferta.');
      }
      onUpdateOffers(offers.filter(o => o.id !== offerId));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const resetOfferForm = () => {
    setOfferForm({
      shopId: shops[0]?.id || '',
      title: '',
      description: '',
      originalPrice: 1000,
      discountPrice: 800,
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
      category: 'Gastronomía',
      expiryDate: '2026-12-31',
      hasQrCoupon: true,
      qrCodeValue: '',
      isFlashSale: false
    });
  };

  // If not authenticated, render beautiful password overlay
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-brand-orange/10 rounded-full blur-2xl" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center space-y-4">
            <div className="bg-orange-50 dark:bg-zinc-800 text-brand-orange dark:text-indigo-400 p-4 rounded-2xl">
              <KeyRound className="w-8 h-8 animate-pulse" />
            </div>
            
            <div className="space-y-1.5">
              <h2 className="font-display font-black text-slate-900 dark:text-zinc-50 text-xl tracking-tight">APS DEVELOPER PANEL</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Sección exclusiva de administración de Oberá en Oferta. Introducí tu contraseña.
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full space-y-4 pt-2">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider block">Contraseña del Administrador</label>
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-800 dark:text-zinc-100 placeholder-slate-400 text-xs font-bold focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
                  autoFocus
                />
              </div>

              {authError && (
                <p className="text-[11px] text-red-500 font-bold flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {authError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-[#2B0E67] hover:bg-[#2B0E67]/90 text-white font-extrabold rounded-2xl text-xs transition-colors cursor-pointer shadow-md"
              >
                Acceder al Panel
              </button>
            </form>

            <a
              href="https://aps-web-tau.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-slate-400 hover:text-brand-orange dark:hover:text-indigo-400 flex items-center gap-1 transition-colors pt-2 underline"
            >
              Desarrollado por APS DEVELOPER <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[90vh] md:h-[85vh]">
        
        {/* Admin Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-950">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#5CE1B2]/20 text-emerald-600 dark:text-emerald-400 rounded-md text-[9px] font-black uppercase tracking-wider">
                APS Developer Modo Dios
              </span>
            </div>
            <h2 className="font-display font-black text-slate-900 dark:text-zinc-50 text-base sm:text-lg tracking-tight mt-0.5">
              Panel de Control Completo
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="relative flex items-center bg-slate-50/50 dark:bg-zinc-950/50 border-b border-slate-100 dark:border-zinc-800 shrink-0">
          <button
            onClick={() => scrollTabs('left')}
            className="shrink-0 p-2 ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Desplazar pestañas a la izquierda"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div ref={tabScrollRef} className="px-2 py-2 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => { setActiveTab('shops'); setEditingShop(null); setIsAddingShop(false); }}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 shrink-0 ${activeTab === 'shops' ? 'bg-[#2B0E67] text-white' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
          >
            <Building className="w-4 h-4" />
            Comercios ({shops.length})
          </button>
          <button
            onClick={() => { setActiveTab('offers'); setEditingOffer(null); setIsAddingOffer(false); }}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 shrink-0 ${activeTab === 'offers' ? 'bg-[#2B0E67] text-white' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
          >
            <Tag className="w-4 h-4" />
            Ofertas ({offers.length})
          </button>
          <button
            onClick={() => { setActiveTab('clients'); }}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 shrink-0 ${activeTab === 'clients' ? 'bg-[#2B0E67] text-white' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
          >
            <Users className="w-4 h-4" />
            Clientes y Comercios
          </button>
          <button
            onClick={() => { setActiveTab('categories'); }}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 shrink-0 ${activeTab === 'categories' ? 'bg-[#2B0E67] text-white' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
          >
            <Compass className="w-4 h-4" />
            Categorías ({categories.length})
          </button>
          <button
            onClick={() => { setActiveTab('zones'); }}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 shrink-0 ${activeTab === 'zones' ? 'bg-[#2B0E67] text-white' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
          >
            <MapPin className="w-4 h-4" />
            Zonas / Filtros ({zones.length})
          </button>
          <button
            onClick={() => { setActiveTab('map'); setMapForm({ ...mapConfig }); }}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 shrink-0 ${activeTab === 'map' ? 'bg-[#2B0E67] text-white' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
          >
            <MapIcon className="w-4 h-4" />
            Mapa Settings
          </button>
          <button
            onClick={() => { setActiveTab('site'); setSiteForm({ ...siteConfig }); }}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 shrink-0 ${activeTab === 'site' ? 'bg-[#2B0E67] text-white' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
          >
            <Sparkles className="w-4 h-4" />
            Personalizar Sitio
          </button>
          </div>
          <button
            onClick={() => scrollTabs('right')}
            className="shrink-0 p-2 mr-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Desplazar pestañas a la derecha"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          
          {/* --- TAB COMERCIOS --- */}
          {activeTab === 'shops' && (
            <div className="space-y-6">
              {!isAddingShop && !editingShop ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Listado de Comercios</span>
                    <button
                      onClick={() => { resetShopForm(); setIsAddingShop(true); }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4" /> Agregar Comercio
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {shops.map((shop) => (
                      <div
                        key={shop.id}
                        className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl shadow-xs shrink-0 p-2 w-14 h-14 flex items-center justify-center overflow-hidden">
                            <ShopLogo logo={shop.logo} className="text-3xl" fallbackSize="w-10 h-10" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900 dark:text-zinc-100">{shop.name}</h4>
                            <p className="text-[10px] text-slate-450 dark:text-zinc-500 font-semibold">{shop.category} • {shop.zone}</p>
                            <p className="text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5">{shop.address}</p>
                          </div>
                        </div>

                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => startEditShop(shop)}
                            className="p-2 text-indigo-650 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-zinc-850 rounded-xl transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteShop(shop.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-zinc-850 rounded-xl transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                // Shop Add/Edit Form
                <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
                    <h3 className="font-display font-black text-slate-900 dark:text-zinc-100 text-xs uppercase tracking-wide">
                      {editingShop ? `Editar Comercio: ${editingShop.name}` : 'Registrar Nuevo Comercio'}
                    </h3>
                    <button
                      onClick={() => { setEditingShop(null); setIsAddingShop(false); }}
                      className="text-xs text-slate-400 dark:text-zinc-500 hover:text-slate-600 font-bold"
                    >
                      Cancelar
                    </button>
                  </div>

                  <form onSubmit={saveShop} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1 col-span-1 md:col-span-2">
                      <label className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">Nombre del Negocio</label>
                      <input
                        type="text"
                        required
                        value={shopForm.name}
                        onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none"
                        placeholder="Ej: Yerba Mate & Delicias Misioneras"
                      />
                    </div>

                    <div className="space-y-1 col-span-1 md:col-span-2">
                      <label className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">Logo del Comercio (Emoji, URL o Cargar Foto)</label>
                      <div className="flex gap-2">
                        <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                          <ShopLogo logo={shopForm.logo} className="text-xl" fallbackSize="w-11 h-11" />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={shopForm.logo && shopForm.logo.startsWith('data:') ? '' : shopForm.logo}
                            onChange={(e) => setShopForm({ ...shopForm, logo: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none"
                            placeholder={shopForm.logo && shopForm.logo.startsWith('data:') ? 'Foto nueva cargada, lista para guardar' : 'Ej: 🧉 o enlace de imagen'}
                          />
                        </div>
                        <label className="bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 font-bold text-xs rounded-xl px-4 py-2.5 cursor-pointer flex items-center justify-center shrink-0 transition-colors">
                          Cargar Foto Logo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  if (typeof reader.result === 'string') {
                                    setShopForm({ ...shopForm, logo: reader.result });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>


                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">Categoría</label>
                      <select
                        value={shopForm.category}
                        onChange={(e) => setShopForm({ ...shopForm, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none"
                      >
                        {categories.filter(cat => cat.id !== 'all').map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">Zona de Oberá</label>
                      <select
                        value={shopForm.zone}
                        onChange={(e) => setShopForm({ ...shopForm, zone: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none"
                      >
                        {zones.filter(z => z !== 'Todos').map((zone) => (
                          <option key={zone} value={zone}>{zone}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">Dirección Exacta</label>
                      <input
                        type="text"
                        required
                        value={shopForm.address}
                        onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none"
                        placeholder="Ej: Av. Sarmiento 450, Oberá"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">Teléfono de Contacto</label>
                      <input
                        type="text"
                        value={shopForm.phone}
                        onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none"
                        placeholder="Ej: 543755421111"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">Latitud (Mapa)</label>
                      <input
                        type="text"
                        required
                        value={shopForm.latitude !== undefined && shopForm.latitude !== null ? shopForm.latitude : ''}
                        onChange={(e) => setShopForm({ ...shopForm, latitude: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none"
                        placeholder="Ej: -27.4856"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">Longitud (Mapa)</label>
                      <input
                        type="text"
                        required
                        value={shopForm.longitude !== undefined && shopForm.longitude !== null ? shopForm.longitude : ''}
                        onChange={(e) => setShopForm({ ...shopForm, longitude: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none"
                        placeholder="Ej: -55.1193"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-4 col-span-1 md:col-span-2">
                      <input
                        type="checkbox"
                        id="isOpen"
                        checked={shopForm.isOpen}
                        onChange={(e) => setShopForm({ ...shopForm, isOpen: e.target.checked })}
                        className="rounded text-emerald-500 focus:ring-emerald-400 w-4 h-4"
                      />
                      <label htmlFor="isOpen" className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 cursor-pointer">
                        ¿Abierto actualmente?
                      </label>
                    </div>

                    <div className="md:col-span-2 pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { setEditingShop(null); setIsAddingShop(false); }}
                        className="px-5 py-2.5 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-xl"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
                      >
                        <Save className="w-4 h-4" /> Guardar Comercio
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* --- TAB OFERTAS --- */}
          {activeTab === 'offers' && (
            <div className="space-y-6">
              {!isAddingOffer && !editingOffer ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Listado de Ofertas</span>
                    <button
                      onClick={() => { resetOfferForm(); setIsAddingOffer(true); }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4" /> Agregar Oferta
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {offers.map((offer) => (
                      <div
                        key={offer.id}
                        className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <img
                            src={offer.image}
                            alt={offer.title}
                            className="w-14 h-14 object-cover rounded-xl border border-slate-200/40 dark:border-zinc-800 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="overflow-hidden">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-zinc-100 truncate" title={offer.title}>{offer.title}</h4>
                            <p className="text-[10px] text-slate-450 dark:text-zinc-500 font-semibold truncate">
                              En: <span className="text-brand-orange font-bold">{offer.shopName}</span>
                            </p>
                            <p className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                              ${offer.discountPrice.toLocaleString('es-AR')} <span className="line-through text-[9px] text-slate-400 dark:text-zinc-500">${offer.originalPrice.toLocaleString('es-AR')}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => startEditOffer(offer)}
                            className="p-2 text-indigo-650 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-zinc-850 rounded-xl transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteOffer(offer.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-zinc-850 rounded-xl transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                // Offer Add/Edit Form
                <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
                    <h3 className="font-display font-black text-slate-900 dark:text-zinc-100 text-xs uppercase tracking-wide">
                      {editingOffer ? `Editar Oferta: ${editingOffer.title}` : 'Publicar Nueva Oferta'}
                    </h3>
                    <button
                      onClick={() => { setEditingOffer(null); setIsAddingOffer(false); }}
                      className="text-xs text-slate-400 dark:text-zinc-500 hover:text-slate-600 font-bold"
                    >
                      Cancelar
                    </button>
                  </div>

                  <form onSubmit={saveOffer} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-widest">Comercio Propietario</label>
                      <select
                        value={offerForm.shopId}
                        onChange={(e) => setOfferForm({ ...offerForm, shopId: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-150 focus:outline-none"
                      >
                        {shops.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-widest">Título de la Oferta</label>
                      <input
                        type="text"
                        required
                        value={offerForm.title}
                        onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-150 focus:outline-none"
                        placeholder="Ej: 30% Off en Mate Pampa"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[9px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-widest">Descripción / Detalles</label>
                      <textarea
                        required
                        value={offerForm.description}
                        onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-150 focus:outline-none h-20 resize-none"
                        placeholder="Describí los detalles de la oferta, qué incluye, etc."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-widest">Precio Normal ($)</label>
                      <input
                        type="number"
                        required
                        value={offerForm.originalPrice}
                        onChange={(e) => setOfferForm({ ...offerForm, originalPrice: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-150 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-widest">Precio Oferta ($)</label>
                      <input
                        type="number"
                        required
                        value={offerForm.discountPrice}
                        onChange={(e) => setOfferForm({ ...offerForm, discountPrice: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-150 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-widest">Fecha de Vencimiento</label>
                      <input
                        type="date"
                        required
                        value={offerForm.expiryDate}
                        onChange={(e) => setOfferForm({ ...offerForm, expiryDate: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-150 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-widest">URL de Imagen</label>
                      <input
                        type="text"
                        required
                        value={offerForm.image}
                        onChange={(e) => setOfferForm({ ...offerForm, image: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-150 focus:outline-none"
                        placeholder="Cargá un enlace de imagen"
                      />
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="hasQrCoupon"
                          checked={offerForm.hasQrCoupon}
                          onChange={(e) => setOfferForm({ ...offerForm, hasQrCoupon: e.target.checked })}
                          className="rounded text-brand-orange focus:ring-brand-orange w-4 h-4"
                        />
                        <label htmlFor="hasQrCoupon" className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                          ¿Requiere Cupón QR?
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isFlashSale"
                          checked={offerForm.isFlashSale}
                          onChange={(e) => setOfferForm({ ...offerForm, isFlashSale: e.target.checked })}
                          className="rounded text-brand-orange focus:ring-brand-orange w-4 h-4"
                        />
                        <label htmlFor="isFlashSale" className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                          ¿Es Oferta Flash del Día? (Poco stock)
                        </label>
                      </div>
                    </div>

                    {offerForm.hasQrCoupon && (
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-widest">Código Único de Cupón QR</label>
                        <input
                          type="text"
                          value={offerForm.qrCodeValue}
                          onChange={(e) => setOfferForm({ ...offerForm, qrCodeValue: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-150 focus:outline-none"
                          placeholder="Ej: OBERAMATE-30-OFF"
                        />
                      </div>
                    )}

                    <div className="md:col-span-2 pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => { setEditingOffer(null); setIsAddingOffer(false); }}
                        className="px-5 py-2.5 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-xl"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
                      >
                        <Save className="w-4 h-4" /> Guardar Oferta
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* --- TAB CLIENTES Y COMERCIOS --- */}
          {activeTab === 'clients' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setUserFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${userFilter === 'all' ? 'bg-[#2B0E67] text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'}`}
                  >
                    Todos ({users.length})
                  </button>
                  <button
                    onClick={() => setUserFilter('customer')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${userFilter === 'customer' ? 'bg-[#2B0E67] text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'}`}
                  >
                    Clientes ({users.filter(u => u.rol === 'customer').length})
                  </button>
                  <button
                    onClick={() => setUserFilter('merchant')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${userFilter === 'merchant' ? 'bg-[#2B0E67] text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'}`}
                  >
                    Comercios ({users.filter(u => u.rol === 'merchant').length})
                  </button>
                </div>
                <button
                  onClick={fetchUsers}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${usersLoading ? 'animate-spin' : ''}`} /> Actualizar
                </button>
              </div>

              {usersError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {usersError}
                </div>
              )}

              {usersLoading ? (
                <div className="text-center py-12 text-sm text-slate-400 dark:text-zinc-500 font-semibold">
                  Cargando usuarios...
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-400 dark:text-zinc-500 font-semibold">
                  Todavía no hay usuarios registrados.
                </div>
              ) : (
                <div className="space-y-2">
                  {users
                    .filter(u => userFilter === 'all' || u.rol === userFilter)
                    .map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 p-3.5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl"
                      >
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${
                          u.rol === 'merchant'
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-[#2B0E67] dark:text-indigo-300'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {(u.nombre || u.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                              {u.nombre || 'Sin nombre'}
                            </p>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase ${
                              u.rol === 'merchant'
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                            }`}>
                              {u.rol === 'merchant' ? 'Comercio' : 'Cliente'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{u.email}</p>
                          {u.shopName && (
                            <p className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1 mt-0.5">
                              <Building className="w-3 h-3" /> {u.shopName}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.nombre || u.email)}
                          disabled={deletingUserId === u.id}
                          className="shrink-0 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                          title="Eliminar cuenta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* --- TAB CATEGORIAS --- */}
          {activeTab === 'categories' && (
            <div className="space-y-6 animate-fadeIn">
              {!isAddingCategory && !editingCategory ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Listado de Categorías</span>
                    <button
                      onClick={startAddCategory}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4" /> Agregar Categoría
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="text-3xl p-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-xs border border-slate-100 dark:border-zinc-800 shrink-0">
                            {cat.emoji}
                          </span>
                          <div className="overflow-hidden">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-zinc-100 truncate">{cat.name}</h4>
                            <p className="text-[10px] text-slate-450 dark:text-zinc-500 font-semibold truncate font-mono">
                              ID: {cat.id}
                            </p>
                            <span className="inline-block text-[9px] px-2 py-0.5 mt-1 rounded-md bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:text-zinc-300 font-bold">
                              {cat.color}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => startEditCategory(cat)}
                            className="p-2 text-indigo-650 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-zinc-850 rounded-xl transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {cat.id !== 'all' && (
                            <button
                              onClick={() => deleteCategory(cat.id)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-zinc-850 rounded-xl transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-5 sm:p-6 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-zinc-800">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                      <Compass className="w-5 h-5 text-indigo-500" />
                      {isAddingCategory ? 'Agregar Nueva Categoría' : 'Editar Categoría'}
                    </h3>
                    <button
                      onClick={() => { setEditingCategory(null); setIsAddingCategory(false); }}
                      className="text-xs text-slate-400 dark:text-zinc-500 hover:text-slate-600 font-bold"
                    >
                      Cancelar
                    </button>
                  </div>

                  <form onSubmit={saveCategory} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">ID Único (Filtro)</label>
                        <input
                          type="text"
                          required
                          disabled={!isAddingCategory}
                          value={categoryForm.id}
                          onChange={(e) => setCategoryForm({ ...categoryForm, id: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none disabled:opacity-50"
                          placeholder="Ej: gastronomia, indumentaria, electro"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">Nombre Visible</label>
                        <input
                          type="text"
                          required
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none"
                          placeholder="Ej: Gastronomía, Indumentaria, Juguetería"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">Emoji Identificador</label>
                        <input
                          type="text"
                          required
                          value={categoryForm.emoji}
                          onChange={(e) => setCategoryForm({ ...categoryForm, emoji: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none"
                          placeholder="Ej: 🍕, 👕, 🔌"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">Clases CSS de Color</label>
                        <input
                          type="text"
                          required
                          value={categoryForm.color}
                          onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none"
                          placeholder="Ej: bg-orange-100 text-orange-800 border-orange-200"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2 border-t border-slate-200/50 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => { setEditingCategory(null); setIsAddingCategory(false); }}
                        className="px-5 py-2.5 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-xl"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
                      >
                        <Save className="w-4 h-4" /> Guardar Categoría
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* --- TAB ZONAS --- */}
          {activeTab === 'zones' && (
            <div className="space-y-6 animate-fadeIn">
              {!isAddingZone && editingZoneIndex === null ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Listado de Zonas de Oberá</span>
                    <button
                      onClick={startAddZone}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4" /> Agregar Zona
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {zones.map((zone, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="text-xl p-2 bg-white dark:bg-zinc-900 rounded-xl shadow-xs border border-slate-100 dark:border-zinc-800">
                            📍
                          </span>
                          <div className="overflow-hidden">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-zinc-100 truncate">{zone}</h4>
                            <p className="text-[10px] text-slate-450 dark:text-zinc-500 font-semibold truncate font-mono">
                              Index: {idx}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => startEditZone(idx)}
                            className="p-2 text-indigo-650 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-zinc-850 rounded-xl transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {zone !== 'Todos' && (
                            <button
                              onClick={() => deleteZone(idx)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-zinc-850 rounded-xl transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-5 sm:p-6 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-zinc-800">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-indigo-500" />
                      {isAddingZone ? 'Agregar Nueva Zona' : 'Editar Zona'}
                    </h3>
                    <button
                      onClick={() => { setEditingZoneIndex(null); setIsAddingZone(false); }}
                      className="text-xs text-slate-400 dark:text-zinc-500 hover:text-slate-600 font-bold"
                    >
                      Cancelar
                    </button>
                  </div>

                  <form onSubmit={saveZone} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">Nombre de la Zona / Filtro de Ubicación</label>
                      <input
                        type="text"
                        required
                        value={zoneForm}
                        onChange={(e) => setZoneForm(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none"
                        placeholder="Ej: Av. Sarmiento, Av. Libertad, Microcentro"
                      />
                    </div>

                    <div className="pt-4 flex justify-end gap-2 border-t border-slate-200/50 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => { setEditingZoneIndex(null); setIsAddingZone(false); }}
                        className="px-5 py-2.5 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-xl"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
                      >
                        <Save className="w-4 h-4" /> Guardar Zona
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* --- TAB MAPCONFIG --- */}
          {activeTab === 'map' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-5 sm:p-6 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-3xl space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-zinc-800">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    <MapIcon className="w-5 h-5 text-indigo-500" />
                    Parámetros del Mapa Central de la App
                  </h3>
                  {mapSaved && (
                    <span className="text-emerald-500 font-bold text-xs flex items-center gap-1">
                      <Check className="w-4 h-4 animate-bounce" /> ¡Cambios guardados!
                    </span>
                  )}
                </div>

                <form onSubmit={saveMapConfig} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">Nombre de la Ciudad</label>
                      <input
                        type="text"
                        required
                        value={mapForm.cityName}
                        onChange={(e) => setMapForm({ ...mapForm, cityName: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none"
                        placeholder="Ej: Oberá, Misiones"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">Zoom Inicial por Defecto</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="22"
                        value={mapForm.defaultZoom}
                        onChange={(e) => setMapForm({ ...mapForm, defaultZoom: parseInt(e.target.value) || 15 })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none"
                        placeholder="Ej: 15"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">Latitud Central</label>
                      <input
                        type="text"
                        required
                        value={mapForm.centerLat}
                        onChange={(e) => setMapForm({ ...mapForm, centerLat: parseFloat(e.target.value) || -27.4856 })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none"
                        placeholder="-27.4856"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">Longitud Central</label>
                      <input
                        type="text"
                        required
                        value={mapForm.centerLng}
                        onChange={(e) => setMapForm({ ...mapForm, centerLng: parseFloat(e.target.value) || -55.1193 })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none"
                        placeholder="-55.1193"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex gap-3">
                    <Sliders className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs text-indigo-900 dark:text-indigo-400">¿Cómo funciona?</h4>
                      <p className="text-[10px] text-indigo-700 dark:text-indigo-500 font-semibold mt-0.5 leading-relaxed">
                        Estas coordenadas determinan el centro geográfico donde se iniciará el mapa de la app. Los comercios sin coordenadas geográficas reales se dispersarán automáticamente alrededor de este punto central.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-2 border-t border-slate-200/50 dark:border-zinc-800">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#2B0E67] text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Save className="w-4 h-4" /> Guardar Cambios del Mapa
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* --- TAB SITECONFIG --- */}
          {activeTab === 'site' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-5 sm:p-6 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-3xl space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-zinc-800">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    Personalización Estética del Sitio (No-Code Branding)
                  </h3>
                  {siteSaved && (
                    <span className="text-emerald-500 font-bold text-xs flex items-center gap-1">
                      <Check className="w-4 h-4 animate-bounce" /> ¡Branding guardado!
                    </span>
                  )}
                </div>

                <form onSubmit={saveSiteConfig} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">Título de la Plataforma</label>
                      <input
                        type="text"
                        required
                        value={siteForm.appTitle}
                        onChange={(e) => setSiteForm({ ...siteForm, appTitle: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none"
                        placeholder="Ej: Oberá en Oferta"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">Subtítulo / Eslogan Descriptivo</label>
                      <input
                        type="text"
                        required
                        value={siteForm.appSubtitle}
                        onChange={(e) => setSiteForm({ ...siteForm, appSubtitle: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none"
                        placeholder="Ej: Todos los comercios, ofertas y descuentos en un solo mapa interactivo."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-1">Emoji de Bienvenida / Icono Principal</label>
                      <input
                        type="text"
                        required
                        value={siteForm.welcomeEmoji}
                        onChange={(e) => setSiteForm({ ...siteForm, welcomeEmoji: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none"
                        placeholder="Ej: 🧉 o 🛒"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-2 border-t border-slate-200/50 dark:border-zinc-800">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#2B0E67] text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Save className="w-4 h-4" /> Guardar Configuración Estética
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Footer APS Web */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">
            © 2026 Oberá en Oferta • Panel Exclusivo
          </p>
          <a
            href="https://aps-web-tau.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-black text-brand-orange hover:text-brand-orange/90 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 transition-all underline decoration-brand-orange/40"
          >
            Soporte por APS DEVELOPER 🚀
          </a>
        </div>
      </div>
    </div>
  );
}