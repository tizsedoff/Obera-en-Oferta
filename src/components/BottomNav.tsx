import React from 'react';
import { Home, Grid, Map, Store, User, Sparkles } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  notificationsCount: number;
  userRole: 'customer' | 'merchant';
}

export default function BottomNav({ activeTab, setActiveTab, notificationsCount, userRole }: BottomNavProps) {
  const navItems = [
    { id: 'home' as TabType, label: 'Inicio', icon: Home },
    { id: 'feed' as TabType, label: 'Feed 🔥', icon: Sparkles },
    { id: 'categories' as TabType, label: 'Categorías', icon: Grid },
    { id: 'map' as TabType, label: 'Mapa', icon: Map },
    ...(userRole === 'merchant'
      ? [{ id: 'myshop' as TabType, label: 'Mi Negocio', icon: Store }]
      : [{ id: 'myprofile' as TabType, label: 'Mi Cuenta', icon: User }]
    )
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-900 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.4)] px-4 pb-safe-bottom">
      <div className="max-w-md mx-auto flex justify-between items-center h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full relative group transition-all duration-300 cursor-pointer ${
                isActive ? 'text-brand-orange scale-105' : 'text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300'
              }`}
              id={`nav-tab-${item.id}`}
            >
              {/* Highlight background dot for active tab */}
              {isActive && (
                <span className="absolute top-0.5 w-1 h-1 rounded-full bg-brand-orange animate-pulse" />
              )}
              
              <div className={`p-1 rounded-xl transition-colors duration-300 ${
                isActive ? 'bg-orange-50/80 dark:bg-orange-950/20 text-brand-orange' : 'group-hover:bg-slate-50 dark:group-hover:bg-zinc-900'
              }`}>
                <Icon className="w-5 h-5 transition-transform" />
              </div>
              
              <span className={`text-[9px] font-semibold mt-0.5 tracking-wide ${
                isActive ? 'text-brand-orange font-bold' : 'text-slate-500 dark:text-zinc-450'
              }`}>
                {item.label}
              </span>

              {/* Extra badges for notifications/activities */}
              {item.id === 'myshop' && (
                <span className="absolute top-2 right-6 h-2 w-2 rounded-full bg-green-500 border border-white dark:border-zinc-950" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
