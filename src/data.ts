import { Shop, Offer, Notification } from './types';

export const INITIAL_SHOPS: Shop[] = [];

export const INITIAL_OFFERS: Offer[] = [];

export const INITIAL_NOTIFICATIONS: Notification[] = [];

export const CATEGORIES_STORY = [
  { id: 'all', name: 'Todos', emoji: '🌟', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'Indumentaria', name: 'Indumentaria', emoji: '👕', color: 'bg-red-100 text-red-800 border-red-200' },
  { id: 'Gastronomía', name: 'Gastronomía', emoji: '🧉', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'Supermercados', name: 'Supermercados', emoji: '🛒', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'Electro', name: 'Electro', emoji: '⚡', color: 'bg-blue-100 text-blue-800 border-blue-200' }
];

export const ZONES = ['Todos', 'Av. Sarmiento', 'Av. Libertad', 'Av. Italia', 'Plaza San Martín'];
