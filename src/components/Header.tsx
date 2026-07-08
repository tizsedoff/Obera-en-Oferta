import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, X, Flame, Sparkles, Store, LogOut, Sun, Moon, Home, Grid, Map, Check, User } from 'lucide-react';
import { Notification, TabType } from '../types';
import BrandLogo from './BrandLogo';

interface HeaderProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectOfferByTitle: (title: string) => void;
  userRole: 'customer' | 'merchant' | null;
  onLogout: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Header({
  notifications,
  onMarkAsRead,
  onClearAll,
  searchQuery,
  setSearchQuery,
  onSelectOfferByTitle,
  userRole,
  onLogout,
  activeTab,
  setActiveTab,
  darkMode,
  onToggleDarkMode
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'home' as TabType, label: 'Inicio', icon: Home },
    { id: 'categories' as TabType, label: 'Categorías', icon: Grid },
    { id: 'map' as TabType, label: 'Mapa', icon: Map },
    ...(userRole === 'merchant'
      ? [{ id: 'myshop' as TabType, label: 'Mi Negocio', icon: Store }]
      : [{ id: 'myprofile' as TabType, label: 'Mi Cuenta', icon: User }]
    )
  ];

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900/90 backdrop-blur-md border-b border-slate-100 dark:border-zinc-800 shadow-xs px-4 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Logo and Brand */}
        <BrandLogo />

        {/* Sleek Desktop Top Navigation (Hidden on Mobile) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-50 dark:bg-zinc-800/60 p-1 rounded-2xl border border-slate-200/40 dark:border-zinc-700/50">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-zinc-900 text-brand-orange dark:text-indigo-400 shadow-xs scale-[1.02]'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.id === 'myshop' && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Search Bar (Hidden on Mobile) */}
        <div className="hidden lg:flex flex-1 max-w-xs relative">
          <input
            type="text"
            placeholder="Buscar descuentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200/70 dark:border-zinc-700 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-zinc-500 w-3.5 h-3.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Side Control Bar */}
        <div className="flex items-center gap-2.5 relative" ref={dropdownRef}>
          
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleDarkMode}
            className="p-2.5 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700/80 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-slate-700 dark:text-zinc-300 transition-all cursor-pointer"
            title={darkMode ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notification Bell */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700/80 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-slate-700 dark:text-zinc-300 transition-all cursor-pointer"
            id="notification-bell-btn"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold h-4.5 w-4.5 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Profile Avatar Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-zinc-800 hover:bg-indigo-100 dark:hover:bg-zinc-700 text-brand-orange dark:text-indigo-400 border border-indigo-100/50 dark:border-zinc-700 flex items-center justify-center font-bold text-xs shadow-inner cursor-pointer transition-all"
              title="Cuenta e Inicio de Sesión"
            >
              {userRole === 'merchant' ? '🏪' : 'OB'}
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 top-11 w-48 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl shadow-lg z-50 py-1.5 animate-in fade-in duration-150">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Sesión Activa</span>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-200">
                    {userRole === 'merchant' ? 'Comercio Registrado' : 'Cliente / Invitado'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 top-11 w-80 sm:w-96 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800 animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="p-4 flex items-center justify-between bg-slate-50 dark:bg-zinc-800/40">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-brand-orange dark:text-indigo-400 animate-bounce" />
                  <h3 className="font-display font-bold text-slate-900 dark:text-zinc-100 text-sm">Notificaciones Flash</h3>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={onClearAll}
                    className="text-xs text-brand-orange dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                  >
                    Marcar todo leído
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto no-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 dark:text-zinc-500 text-xs">
                    No tenés notificaciones activas.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        onMarkAsRead(notif.id);
                        if (notif.text.includes("Polar")) onSelectOfferByTitle("2x1 en Kilo de Helado Artesanal");
                        if (notif.text.includes("Yerba")) onSelectOfferByTitle("30% Off Combo Mate + Termo de Acero");
                        if (notif.text.includes("Carhué")) onSelectOfferByTitle("15% de Descuento en Zapatillas Deportivas");
                        setShowNotifications(false);
                      }}
                      className={`p-4 hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors flex gap-3 cursor-pointer relative ${
                        !notif.isRead ? 'bg-indigo-50/20 dark:bg-indigo-950/10 font-medium' : ''
                      }`}
                    >
                      {!notif.isRead && (
                        <span className="absolute top-4 left-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
                      )}
                      
                      <div className="flex-1 pl-1">
                        <p className="text-xs text-slate-800 dark:text-zinc-200 leading-snug">{notif.text}</p>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 block">{notif.time}</span>
                      </div>

                      <div className="shrink-0">
                        {notif.type === 'flash' && (
                          <span className="inline-block p-1 bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 rounded-lg text-xs">🔥</span>
                        )}
                        {notif.type === 'coupon' && (
                          <span className="inline-block p-1 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 dark:text-indigo-400 rounded-lg text-xs">🎟️</span>
                        )}
                        {notif.type === 'new_shop' && (
                          <span className="inline-block p-1 bg-blue-50 dark:bg-blue-950/20 text-blue-500 dark:text-blue-400 rounded-lg text-xs">🏪</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 text-center text-[10px] text-slate-400 dark:text-zinc-500">
                ¡Las ofertas flash expiran rápido!
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Bar (Only visible under lg) */}
      <div className="mt-3 lg:hidden relative max-w-md mx-auto">
        <input
          type="text"
          placeholder="Buscar ofertas, marcas o locales..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200/70 dark:border-zinc-700/80 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all"
        />
        <Search className="absolute left-3.5 top-2.5 text-slate-400 dark:text-zinc-500 w-3.5 h-3.5" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
