import { Shop, Offer, Notification } from './types';

export const INITIAL_SHOPS: Shop[] = [];

export const INITIAL_OFFERS: Offer[] = [];

export const INITIAL_NOTIFICATIONS: Notification[] = [];

export const CATEGORIES_STORY = [
  { id: 'all', name: 'Todos', emoji: '🌟', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'indumentaria', name: 'Indumentaria', emoji: '👕', color: 'bg-red-100 text-red-800 border-red-200' },
  { id: 'gastronomia', name: 'Gastronomía', emoji: '🧉', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'supermercados', name: 'Supermercados', emoji: '🛒', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'electro', name: 'Electro', emoji: '⚡', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'otros', name: 'Otros', emoji: '✨', color: 'bg-slate-100 text-slate-800 border-slate-200' }
];

const CATEGORY_ALIASES: Record<string, string> = {
  'indumentaria': 'indumentaria', 'gastronomía': 'gastronomia', 'gastronomia': 'gastronomia',
  'supermercados': 'supermercados', 'electro': 'electro', 'otros': 'otros', 'sin categoría': ''
};

export function normalizeCategoryId(value: unknown): string {
  const key = String(value ?? '').trim().toLocaleLowerCase('es');
  return CATEGORY_ALIASES[key] || (key === 'all' ? 'all' : '');
}

export function getCategoryLabel(value: unknown): string {
  const id = normalizeCategoryId(value);
  return CATEGORIES_STORY.find(category => category.id === id)?.name || 'Sin categoría';
}

export const ZONES = ['Todos', 'Av. Sarmiento', 'Av. Libertad', 'Av. Italia', 'Plaza San Martín'];
