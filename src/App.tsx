import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, QrCode, Phone, CheckCircle, Info, Bookmark, ExternalLink, RefreshCw, Smartphone, Star } from 'lucide-react';

import { Shop, Offer, Notification, TabType, Category, MapConfig, SiteConfig, Coupon } from './types';
import { INITIAL_NOTIFICATIONS, CATEGORIES_STORY, ZONES, normalizeCategoryId } from './data';
import { supabase } from './supabaseClient';

import Header from './components/Header';
import BottomNav from './components/BottomNav';
import InicioTab from './components/InicioTab';
import HomeTab from './components/HomeTab';
import CategoriesTab from './components/CategoriesTab';
import MapView from './components/MapView';
import MerchantDashboard from './components/MerchantDashboard';
import MyProfileTab from './components/MyProfileTab';
import CouponModal from './components/CouponModal';
import OfferDetailModal from './components/OfferDetailModal';
import ShopsDirectory from './components/ShopsDirectory';
import ShopProfileModal from './components/ShopProfileModal';
import LoginScreen from './components/LoginScreen';
import AiChatbot from './components/AiChatbot';
import AdminPanel from './components/AdminPanel';
import VisitorRegisterPromptModal from './components/VisitorRegisterPromptModal';

export default function App() {
  // Loading/Welcome state
  const [isLoadingApp, setIsLoadingApp] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      const increment = Math.floor(Math.random() * 20) + 12;
      current = Math.min(current + increment, 100);
      setLoadingProgress(current);
      
      if (current >= 100) {
        clearInterval(interval);
        const timeout = setTimeout(() => {
          setIsLoadingApp(false);
        }, 500);
        return () => clearTimeout(timeout);
      }
    }, 120);
    return () => clearInterval(interval);
  }, []);

  // Tab control state
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedShopIdOnMap, setSelectedShopIdOnMap] = useState<string | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Dark/Light Mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('obera_ofertas_dark_mode');
    return saved === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('obera_ofertas_dark_mode', String(darkMode));
  }, [darkMode]);

  // User Authentication role state.
  // 'visitor' sigue usando localStorage (no tiene cuenta real).
  // 'customer'/'merchant' se restauran desde la sesión real de Supabase (ver useEffect de abajo).
  const [userRole, setUserRole] = useState<'customer' | 'merchant' | 'visitor' | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Restaura la sesión al cargar la app
  useEffect(() => {
    let forceRegisterScreen = false;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('accion') === 'registrarse') {
        forceRegisterScreen = true;
      }
    } catch {
      // noop
    }

    const restoreSession = async () => {
      if (forceRegisterScreen) {
        setAuthChecked(true);
        return;
      }

      // Modo invitado: sigue viviendo en localStorage
      const savedVisitor = localStorage.getItem('obera_ofertas_user_role');
      if (savedVisitor === 'visitor') {
        setUserRole('visitor');
        setUserEmail(localStorage.getItem('obera_ofertas_user_email') || '');
        setAuthChecked(true);
        return;
      }

      // Cuenta real: restaurar desde la sesión de Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('rol, nombre')
          .eq('id', session.user.id)
          .single();

        if (profile && (profile.rol === 'customer' || profile.rol === 'merchant')) {
          setUserRole(profile.rol);
          setUserEmail(session.user.email || '');
          setSupabaseUserId(session.user.id);
          if (profile.nombre) {
            localStorage.setItem('obera_ofertas_user_name', profile.nombre);
          }
        }
      }
      setAuthChecked(true);
    };

    restoreSession();

    // Mantiene todo sincronizado si la sesión cambia (ej: se cierra en otra pestaña)
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUserRole((current) => (current === 'visitor' ? current : null));
        setUserEmail('');
        setSupabaseUserId(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (role: 'customer' | 'merchant' | 'visitor', email?: string, name?: string, userId?: string) => {
    setUserRole(role);

    if (role === 'visitor') {
      // El invitado no tiene cuenta real: se guarda en localStorage como antes
      localStorage.setItem('obera_ofertas_user_role', role);
      const resolvedEmail = email || '';
      setUserEmail(resolvedEmail);
      if (resolvedEmail) {
        localStorage.setItem('obera_ofertas_user_email', resolvedEmail);
      } else {
        localStorage.removeItem('obera_ofertas_user_email');
      }
      localStorage.setItem('obera_ofertas_user_name', 'Invitado');
    } else {
      // Cuenta real de Supabase: la sesión ya la maneja supabase-js, no hace falta localStorage
      setUserEmail(email || '');
      setSupabaseUserId(userId || null);
      if (name) {
        localStorage.setItem('obera_ofertas_user_name', name);
      }
    }

    if (role === 'merchant') {
      setActiveTab('myshop');
    } else {
      setActiveTab('home');
    }
  };

  const handleLogout = async () => {
    if (userRole !== 'visitor') {
      await supabase.auth.signOut();
    }
    setUserRole(null);
    setUserEmail('');
    setSupabaseUserId(null);
    localStorage.removeItem('obera_ofertas_user_role');
    localStorage.removeItem('obera_ofertas_user_email');
    localStorage.removeItem('obera_ofertas_user_name');
  };

  // Live API Fetcher function
  const fetchLiveData = async () => {
    try {
      const [shopsRes, offersRes] = await Promise.all([
        fetch('/api/shops'),
        fetch('/api/offers')
      ]);
      if (shopsRes.ok) {
        const shopsData = await shopsRes.json();
        setShops(shopsData.map((shop: Shop) => ({ ...shop, category: normalizeCategoryId(shop.category) })));
      }
      if (offersRes.ok) {
        const offersData = await offersRes.json();
        setOffers(offersData.map((offer: Offer) => ({ ...offer, category: normalizeCategoryId(offer.category) })));
      }
    } catch (err) {
      console.error("Error loading live database data from API:", err);
    }
  };

  // Persistence backed collections
  const [shops, setShops] = useState<Shop[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('obera_ofertas_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('obera_ofertas_categories');
    return saved ? JSON.parse(saved) : CATEGORIES_STORY;
  });

  const [zones, setZones] = useState<string[]>(() => {
    const saved = localStorage.getItem('obera_ofertas_zones');
    return saved ? JSON.parse(saved) : ZONES;
  });

  const [mapConfig, setMapConfig] = useState<MapConfig>(() => {
    const saved = localStorage.getItem('obera_ofertas_map_config');
    return saved ? JSON.parse(saved) : {
      centerLat: -27.4856,
      centerLng: -55.1193,
      defaultZoom: 15,
      cityName: 'Oberá'
    };
  });

  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    const saved = localStorage.getItem('obera_ofertas_site_config');
    return saved ? JSON.parse(saved) : {
      appTitle: 'Oberá en Oferta!',
      appSubtitle: 'Los mejores descuentos de la Tierra Colorada',
      welcomeEmoji: '🧉'
    };
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Category state (shared between Home stories and Categories filter)
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Pop-up details states
  const [selectedCouponOffer, setSelectedCouponOffer] = useState<Offer | null>(null);
  const [selectedDetailOffer, setSelectedDetailOffer] = useState<Offer | null>(null);
  const [selectedShopProfile, setSelectedShopProfile] = useState<Shop | null>(null);
  const [showVisitorRegisterPrompt, setShowVisitorRegisterPrompt] = useState(false);

  // Success Claim toast
  const [showToast, setShowToast] = useState<string | null>(null);

  // Claimed coupons state
  const [claimedCoupons, setClaimedCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('obera_ofertas_claimed_coupons');
    return saved ? JSON.parse(saved) : [];
  });

  const claimedCouponIds = claimedCoupons.map(coupon => coupon.offerId);

  // Redeemed deactivated coupons state
  const [redeemedCouponIds, setRedeemedCouponIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('obera_ofertas_redeemed_coupons');
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch database data on mount and subscribe to refresh events
  useEffect(() => {
    fetchLiveData();

    const handleRefresh = () => {
      fetchLiveData();
    };

    window.addEventListener('refresh-live-data', handleRefresh);
    return () => {
      window.removeEventListener('refresh-live-data', handleRefresh);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('obera_ofertas_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('obera_ofertas_claimed_coupons', JSON.stringify(claimedCoupons));
  }, [claimedCoupons]);

  useEffect(() => {
    localStorage.setItem('obera_ofertas_redeemed_coupons', JSON.stringify(redeemedCouponIds));
  }, [redeemedCouponIds]);

  useEffect(() => {
    localStorage.setItem('obera_ofertas_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('obera_ofertas_zones', JSON.stringify(zones));
  }, [zones]);

  useEffect(() => {
    localStorage.setItem('obera_ofertas_map_config', JSON.stringify(mapConfig));
  }, [mapConfig]);

  useEffect(() => {
    localStorage.setItem('obera_ofertas_site_config', JSON.stringify(siteConfig));
  }, [siteConfig]);

  // Listen to admin panel request event
  useEffect(() => {
    const handleOpenAdmin = () => {
      setShowAdminPanel(true);
    };
    window.addEventListener('open-admin-panel', handleOpenAdmin);
    return () => {
      window.removeEventListener('open-admin-panel', handleOpenAdmin);
    };
  }, []);

  // Handle claims - updates both coupon counts and merchant analytics dynamically
  const handleClaimCoupon = async (offerId: string): Promise<Coupon | null> => {
    const response = await fetch('/api/coupons/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'No se pudo activar el cupón.');

    const coupon: Coupon = {
      id: payload.id,
      offerId,
      token: payload.token || payload.codigoUnico,
      expiresAt: payload.expiresAt || offers.find(offer => offer.id === offerId)?.expiryDate || ''
    };
    setClaimedCoupons(previous => previous.some(item => item.id === coupon.id) ? previous : [...previous, coupon]);
    setOffers(previous => previous.map(offer => offer.id === offerId ? { ...offer, couponsClaimed: offer.couponsClaimed + 1 } : offer));
    setShowToast('🎟️ ¡Cupón guardado con éxito! Se añadió a tu billetera.');
    setTimeout(() => setShowToast(null), 3500);
    return coupon;
  };

  // Upgrade customer to merchant role & create real shop in Supabase
  const handleUpgradeToMerchant = async (
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
  ) => {
    try {
      const { data: { session: shopSession } } = await supabase.auth.getSession();
      const res = await fetch("/api/shops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(shopSession ? { "Authorization": `Bearer ${shopSession.access_token}` } : {})
        },
        body: JSON.stringify({
          ownerId: supabaseUserId,
          name: shopData.name,
          category: shopData.category,
          zone: shopData.zone,
          logo: shopData.logo,
          address: shopData.address,
          phone: shopData.phone,
          latitude: shopData.latitude,
          longitude: shopData.longitude,
          base64Logo: shopData.base64Logo,
          initialOffer: initialOffer || null
        })
      });

      if (!res.ok) {
        throw new Error("No se pudo registrar el negocio en el servidor.");
      }

      const registeredShop = await res.json();

      // Persistir el cambio de rol en el perfil real (Supabase), no solo en memoria/localStorage
      if (supabaseUserId) {
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ rol: 'merchant' })
          .eq('id', supabaseUserId);
        if (profileUpdateError) {
          console.error('Error actualizando el rol del perfil:', profileUpdateError);
        }
      }

      setUserRole('merchant');
      setActiveTab('myshop');

      setShowToast('🚀 ¡Negocio Registrado! Bienvenidos a Oberá en Oferta.');
      setTimeout(() => setShowToast(null), 4000);

      const newNotif: Notification = {
        id: `notif-upgrade-${Date.now()}`,
        text: `🎉 ¡Bienvenido! Tu negocio "${shopData.name}" ahora está verificado en la plataforma. Comenzá a publicar ofertas.`,
        time: 'Hace 1 min',
        isRead: false,
        type: 'new_shop'
      };
      setNotifications(prev => [newNotif, ...prev]);

      // Re-fetch all data from database so it's fully synchronized
      await fetchLiveData();

    } catch (err: any) {
      console.error(err);
      setShowToast(`❌ Error: ${err.message || 'No se pudo conectar con el servidor.'}`);
      setTimeout(() => setShowToast(null), 4000);
    }
  };

  // Add new offer via Merchant panel in database
  const handleAddOffer = async (newOfferData: Omit<Offer, 'id' | 'shopId' | 'shopName' | 'views' | 'couponsClaimed'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Tu sesión expiró, volvé a iniciar sesión.");
      }
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
        body: JSON.stringify({
          ...newOfferData,
          shopId: activeMerchantShop?.id || 'shop-fallback',
          shopName: activeMerchantShop?.name || 'Yerba Mate & Delicias Misioneras'
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Error al publicar la oferta.");
      }

      const savedOffer = await res.json();

      // Show toast
      setShowToast('📢 ¡Oferta publicada con éxito en Oberá!');
      setTimeout(() => setShowToast(null), 3000);

      // Send simulated flash notification so the top bell badge lights up
      const newNotif: Notification = {
        id: `notif-${Date.now()}`,
        text: `📢 ${activeMerchantShop?.name || 'Comercio'} acaba de publicar una súper oferta: ¡${savedOffer.title}!`,
        time: 'Hace 1 min',
        isRead: false,
        type: savedOffer.hasQrCoupon ? 'coupon' : 'flash'
      };

      setNotifications(prev => [newNotif, ...prev]);

      // Re-fetch everything to guarantee state alignment
      await fetchLiveData();

    } catch (err: any) {
      console.error("Error creating offer:", err);
      setShowToast(`❌ Error: ${err.message}`);
      setTimeout(() => setShowToast(null), 4000);
    }
  };

  // Delete offer from database and memory
  const handleDeleteOffer = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Sesión expirada.");
      }
      const res = await fetch(`/api/offers?id=${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        setOffers(prev => prev.filter(o => o.id !== id));
        setShowToast('🗑️ Oferta eliminada correctamente.');
        setTimeout(() => setShowToast(null), 3000);
      } else {
        throw new Error("No se pudo eliminar de la base de datos.");
      }
    } catch (err: any) {
      console.error("Error deleting offer:", err);
      setShowToast('⚠️ No se pudo eliminar la oferta. Probá de nuevo.');
      setTimeout(() => setShowToast(null), 3000);
    }
  };

  const handleEditShop = async (updatedData: { name: string; category: string; address: string; phone: string; zone: string; base64Logo?: string; logo?: string }) => {
    if (!activeMerchantShop) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setShowToast('⚠️ Tu sesión expiró, volvé a iniciar sesión.');
        setTimeout(() => setShowToast(null), 3000);
        return;
      }

      const res = await fetch("/api/shops", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ id: activeMerchantShop.id, ...updatedData })
      });
      if (res.ok) {
        setShowToast('✅ Datos del negocio actualizados.');
        setTimeout(() => setShowToast(null), 3000);
        await fetchLiveData();
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "No se pudo actualizar el negocio.");
      }
    } catch (err: any) {
      console.error("Error editing shop:", err);
      setShowToast(`⚠️ ${err.message || 'No se pudo actualizar el negocio.'}`);
      setTimeout(() => setShowToast(null), 3000);
    }
  };

  // Notification handlers
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleClearNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Search filter logic
  const searchedOffers = useMemo(() => {
    if (!searchQuery) return offers;
    const query = searchQuery.toLowerCase();
    return offers.filter(offer => 
      offer.title.toLowerCase().includes(query) ||
      offer.description.toLowerCase().includes(query) ||
      offer.shopName.toLowerCase().includes(query) ||
      offer.category.toLowerCase().includes(query)
    );
  }, [offers, searchQuery]);

  // Click on Story Category circle - transitions views
  const handleSelectCategoryStory = (category: string) => {
    setSelectedCategory(category);
    setActiveTab('categories');
    // Scroll window to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Click on a Shop - redirects to Map view and centers it
  const handleSelectShopOnMap = (shopId: string) => {
    setSelectedShopIdOnMap(shopId);
    setActiveTab('map');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select offer directly from Notifications clicks
  const handleSelectOfferByTitle = (title: string) => {
    const matched = offers.find(o => o.title === title);
    if (matched) {
      setSelectedDetailOffer(matched);
    }
  };

  // Open coupon with verification check (coupons only for users with account)
  const handleOpenCoupon = (offer: Offer) => {
    if (userRole === 'visitor') {
      setShowVisitorRegisterPrompt(true);
    } else {
      setSelectedCouponOffer(offer);
    }
  };

  // Active Merchant Shop: resuelto por el dueño real autenticado (ownerId), no por un id guardado a mano
  const activeMerchantShop = useMemo(() => {
    if (userRole === 'merchant' && supabaseUserId) {
      return shops.find(s => s.ownerId === supabaseUserId) || null;
    }
    return null;
  }, [shops, userRole, supabaseUserId]);

  const merchantOffers = activeMerchantShop ? offers.filter(o => o.shopId === activeMerchantShop.id) : [];

  if (isLoadingApp || !authChecked) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-indigo-950 to-zinc-950 text-white p-6 overflow-hidden select-none">
        {/* Animated Background Orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse duration-4000" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse duration-3000" />

        <div className="relative z-10 flex flex-col items-center max-w-sm w-full text-center">
          {/* Glowing Animated Mate Logo Container */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-xl animate-ping opacity-75 duration-2000" />
            <div className="relative w-24 h-24 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105">
              <span className="text-5xl animate-bounce">🧉</span>
            </div>
          </div>

          {/* Elegant Display Title */}
          <h1 className="font-display font-black text-3xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-[#5CE1B2] uppercase leading-none">
            Oberá
          </h1>
          <h2 className="font-sans font-extrabold text-sm tracking-[0.25em] text-[#5CE1B2] uppercase mt-2 mb-6">
            En Oferta
          </h2>

          {/* Welcome Tag */}
          <div className="mb-8 px-4 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-wider text-zinc-300 uppercase">
            ¡BIENVENIDO! cargando descuentos...
          </div>

          {/* Premium Loading Progress Bar */}
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-white/5 shadow-inner mb-3">
            <div 
              className="h-full bg-gradient-to-r from-[#5CE1B2] to-emerald-400 transition-all duration-200 ease-out rounded-full shadow-[0_0_8px_rgba(92,225,178,0.5)]"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>

          {/* Counter percent */}
          <span className="font-mono text-xs text-[#5CE1B2] font-semibold animate-pulse">
            {loadingProgress}%
          </span>
        </div>

        {/* Footer info */}
        <div className="absolute bottom-8 text-center flex flex-col gap-1 z-10">
          <p className="text-[10px] text-zinc-500 font-extrabold tracking-widest uppercase">
            Plataforma PWA v1.2
          </p>
          <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">
            Desarrollado y Optimizado por APS Developer
          </p>
        </div>
      </div>
    );
  }

  if (userRole === null) {
    return (
      <>
        <LoginScreen onLogin={handleLogin} />
        <AiChatbot shops={shops} offers={offers} />
      </>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 flex flex-col justify-between transition-colors ${activeTab === 'home' && !searchQuery ? 'pb-16 md:pb-0' : 'pb-20'}`}>
      
      {/* Super Prominent APS DEVELOPER Premium Header Banner */}
      <div className={activeTab === 'home' && !searchQuery ? 'hidden md:block' : 'block'}>
        <div className="bg-gradient-to-r from-[#2B0E67] via-[#5CE1B2] to-[#1e074d] text-white py-2 px-4 shadow-sm select-none relative overflow-hidden transition-all duration-300 border-b border-indigo-950/20">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <p className="text-[11px] sm:text-xs font-sans font-black tracking-wide uppercase">
                Plataforma Desarrollada y Optimizada por <span className="text-[#5CE1B2] font-black underline decoration-[#5CE1B2]/50 hover:text-white transition-colors">APS DEVELOPER</span>
              </p>
            </div>
            <a
              href="https://aps-web-tau.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/15 hover:bg-white/25 active:scale-95 text-white font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 shrink-0 border border-white/20 shadow-xs"
            >
              Visitar Web Oficial <ExternalLink className="w-3.5 h-3.5 text-[#5CE1B2]" />
            </a>
          </div>
        </div>
      </div>
      
      {/* Dynamic Claim/Action Toast */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white font-semibold text-xs py-3 px-5 rounded-full shadow-2xl border border-slate-800 dark:border-zinc-800 flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4.5 h-4.5 text-green-400" />
          <span>{showToast}</span>
        </div>
      )}

      {/* Main Top Header */}
      <div className={activeTab === 'home' && !searchQuery ? 'hidden md:block' : 'block'}>
        <Header
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onClearAll={handleClearNotifications}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSelectOfferByTitle={handleSelectOfferByTitle}
          userRole={userRole}
          onLogout={handleLogout}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />
      </div>

      {/* Primary Container View */}
      <main className={`flex-1 ${activeTab === 'home' && !searchQuery ? 'py-0' : 'py-8'}`}>
        
        {/* If Search Query is active, show search results panel instead of normal tab content */}
        {searchQuery ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200">
                Resultados de búsqueda: <span className="text-brand-orange dark:text-indigo-400">"{searchQuery}"</span>
              </h3>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 font-bold"
              >
                Limpiar búsqueda
              </button>
            </div>

            {searchedOffers.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-12 text-center shadow-xs">
                <p className="font-display font-extrabold text-slate-800 dark:text-zinc-200 text-sm">No encontramos ofertas para tu búsqueda</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Probá escribiendo una palabra clave como "helado", "mate" o "campera".</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {searchedOffers.map((offer) => {
                  const discountPercentage = Math.round(((offer.originalPrice - offer.discountPrice) / offer.originalPrice) * 100);
                  const shop = shops.find(s => s.id === offer.shopId);
                  
                  return (
                    <div
                      key={offer.id}
                      onClick={() => setSelectedDetailOffer(offer)}
                      className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs hover:shadow-lg hover:border-indigo-100 dark:hover:border-zinc-800 cursor-pointer transition-all flex flex-col justify-between group"
                    >
                      <div className="relative h-40 bg-slate-50 dark:bg-zinc-950 overflow-hidden">
                        <img src={offer.image} alt={offer.title} className="w-full h-full object-cover group-hover:scale-105 duration-500 transition-transform" referrerPolicy="no-referrer" />
                        <div className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                          -{discountPercentage}%
                        </div>
                      </div>
                      
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">{offer.shopName}</span>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 line-clamp-2 leading-snug group-hover:text-brand-orange dark:group-hover:text-indigo-400 transition-colors mt-1">{offer.title}</h4>
                        </div>
                        
                        <div className="flex items-baseline gap-1.5 pt-2 border-t border-slate-50 dark:border-zinc-800">
                          <span className="text-sm font-display font-black text-red-500 dark:text-red-400">${offer.discountPrice.toLocaleString('es-AR')}</span>
                          <span className="text-xs text-slate-400 dark:text-zinc-500 line-through">${offer.originalPrice.toLocaleString('es-AR')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Normal Tab Router */
          <>
            {activeTab === 'home' && (
              <InicioTab
                offers={offers}
                shops={shops}
                categories={categories}
                siteConfig={siteConfig}
                onOpenOffer={(offer) => setSelectedDetailOffer(offer)}
                onOpenCoupon={handleOpenCoupon}
                onSelectCategoryStory={handleSelectCategoryStory}
                onSelectShopOnMap={handleSelectShopOnMap}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'feed' && (
              <HomeTab
                offers={offers}
                shops={shops}
                categories={categories}
                onOpenCoupon={handleOpenCoupon}
                onOpenOffer={(offer) => setSelectedDetailOffer(offer)}
                onSelectCategoryStory={handleSelectCategoryStory}
                onSelectShopOnMap={handleSelectShopOnMap}
                darkMode={darkMode}
                onToggleDarkMode={() => setDarkMode(!darkMode)}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'categories' && (
              <CategoriesTab
                offers={offers}
                shops={shops}
                categories={categories}
                zones={zones}
                onOpenOffer={(offer) => setSelectedDetailOffer(offer)}
                onOpenCoupon={handleOpenCoupon}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />
            )}

            {activeTab === 'shops' && (
              <ShopsDirectory
                shops={shops}
                offers={offers}
                onSelectShop={(shop) => setSelectedShopProfile(shop)}
              />
            )}

            {activeTab === 'map' && (
              <MapView
                shops={shops}
                offers={offers}
                mapConfig={mapConfig}
                onSelectOffer={(offer) => setSelectedDetailOffer(offer)}
                initialSelectedShopId={selectedShopIdOnMap}
              />
            )}

            {activeTab === 'myshop' && (
              userRole === 'merchant' ? (
                <MerchantDashboard
                  myShop={activeMerchantShop}
                  myOffers={merchantOffers}
                  onAddOffer={handleAddOffer}
                  onDeleteOffer={handleDeleteOffer}
                  onEditShop={handleEditShop}
                />
              ) : (
                <div className="max-w-md mx-auto px-4 py-12 text-center space-y-6">
                  <div className="w-16 h-16 bg-indigo-50 dark:bg-zinc-900 text-brand-orange dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto text-2xl shadow-inner border border-indigo-100/10 dark:border-zinc-800">
                    🏪
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display font-extrabold text-slate-900 dark:text-zinc-100 text-lg">Sección Exclusiva de Comercios</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                      El panel de control "Mi Negocio" está reservado para comerciantes registrados de Oberá. Desde aquí podés publicar ofertas del día, cupones QR y ver las estadísticas de tus visitas.
                    </p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-4 rounded-2xl shadow-xs text-left">
                    <h4 className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-widest mb-1">Prueba Rápida de la Demo:</h4>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-normal">
                      Podés cambiar tu rol a comerciante en cualquier momento cerrando sesión desde el menú de tu perfil (arriba a la derecha 👤) o tocando el botón de abajo.
                    </p>
                  </div>
                  <button
                    onClick={() => handleLogin('merchant')}
                    className="w-full py-3 bg-brand-orange hover:bg-brand-orange/95 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md"
                  >
                    Ingresar como Comercio Demo
                  </button>
                </div>
              )
            )}

            {activeTab === 'myprofile' && (
              <MyProfileTab
                offers={offers}
                shops={shops}
                claimedCouponIds={claimedCouponIds}
                onOpenCoupon={handleOpenCoupon}
                onUpgradeToMerchant={handleUpgradeToMerchant}
                onLogout={handleLogout}
                userEmail={userEmail}
                categories={categories}
                zones={zones}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Bottom Nav for Mobile (Hidden on Desktop/Tablet) */}
      <div className="md:hidden">
        <BottomNav
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setSearchQuery(''); // Clear search on tab switch
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          notificationsCount={notifications.filter(n => !n.isRead).length}
          userRole={userRole}
        />
      </div>

      {/* Overlays / Modals */}
      {selectedCouponOffer && (
        <CouponModal
          offer={selectedCouponOffer}
          shop={shops.find(s => s.id === selectedCouponOffer.shopId)}
          onClose={() => setSelectedCouponOffer(null)}
          onClaim={handleClaimCoupon}
        />
      )}

      {selectedDetailOffer && (
        <OfferDetailModal
          offer={selectedDetailOffer}
          shop={shops.find(s => s.id === selectedDetailOffer.shopId)}
          onClose={() => setSelectedDetailOffer(null)}
          onOpenCoupon={handleOpenCoupon}
          onViewShop={(shopId) => {
            const shop = shops.find(s => s.id === shopId);
            if (shop) {
              setSelectedShopProfile(shop);
              setSelectedDetailOffer(null);
            }
          }}
        />
      )}

      {selectedShopProfile && (
        <ShopProfileModal
          shop={selectedShopProfile}
          offers={offers}
          onClose={() => setSelectedShopProfile(null)}
          onSelectOffer={(offer) => {
            setSelectedShopProfile(null);
            setSelectedDetailOffer(offer);
          }}
          onViewOnMap={(shopId) => {
            setSelectedShopProfile(null);
            setSelectedShopIdOnMap(shopId);
            setActiveTab('map');
          }}
        />
      )}

      {showVisitorRegisterPrompt && (
        <VisitorRegisterPromptModal
          onClose={() => setShowVisitorRegisterPrompt(false)}
          onRegisterClick={() => {
            setShowVisitorRegisterPrompt(false);
            handleLogout();
          }}
        />
      )}

      {/* Exclusive Developer Admin Panel */}
      {showAdminPanel && (
        <AdminPanel
          shops={shops}
          onUpdateShops={setShops}
          offers={offers}
          onUpdateOffers={setOffers}
          notifications={notifications}
          onUpdateNotifications={setNotifications}
          categories={categories}
          onUpdateCategories={setCategories}
          zones={zones}
          onUpdateZones={setZones}
          mapConfig={mapConfig}
          onUpdateMapConfig={setMapConfig}
          siteConfig={siteConfig}
          onUpdateSiteConfig={setSiteConfig}
          onClose={() => setShowAdminPanel(false)}
        />
      )}

      {/* Persistent Interactive AI Chatbot */}
      {userRole && <AiChatbot shops={shops} offers={offers} />}

    </div>
  );
}
