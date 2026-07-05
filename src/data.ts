import { Shop, Offer, Notification } from './types';

export const INITIAL_SHOPS: Shop[] = [
  {
    id: 'shop-1',
    name: 'Yerba Mate & Delicias Misioneras',
    logo: '🧉',
    category: 'Gastronomía',
    zone: 'Av. Sarmiento',
    isOpen: true,
    address: 'Av. Sarmiento 450, Oberá',
    phone: '543755421111',
    rating: 4.8
  },
  {
    id: 'shop-2',
    name: 'Misiones Style Indumentaria',
    logo: '👕',
    category: 'Indumentaria',
    zone: 'Av. Libertad',
    isOpen: true,
    address: 'Av. Libertad 120, Oberá',
    phone: '543755422222',
    rating: 4.5
  },
  {
    id: 'shop-3',
    name: 'Supermercado El Cóndor',
    logo: '🛒',
    category: 'Supermercados',
    zone: 'Av. Italia',
    isOpen: true,
    address: 'Av. Italia 890, Oberá',
    phone: '543755423333',
    rating: 4.2
  },
  {
    id: 'shop-4',
    name: 'Electro Oberá',
    logo: '⚡',
    category: 'Electro',
    zone: 'Plaza San Martín',
    isOpen: false,
    address: 'Sgto. Cabral 15, Oberá (Frente a Plaza San Martín)',
    phone: '543755424444',
    rating: 4.6
  },
  {
    id: 'shop-5',
    name: 'Heladería Polar',
    logo: '🍦',
    category: 'Gastronomía',
    zone: 'Av. Sarmiento',
    isOpen: true,
    address: 'Av. Sarmiento 210, Oberá',
    phone: '543755425555',
    rating: 4.9
  },
  {
    id: 'shop-6',
    name: 'Calzados Carhué',
    logo: '👟',
    category: 'Indumentaria',
    zone: 'Av. Libertad',
    isOpen: true,
    address: 'Av. Libertad 340, Oberá',
    phone: '543755426666',
    rating: 4.4
  }
];

export const INITIAL_OFFERS: Offer[] = [
  {
    id: 'offer-1',
    shopId: 'shop-1',
    shopName: 'Yerba Mate & Delicias Misioneras',
    title: '30% Off Combo Mate + Termo de Acero',
    description: 'Bocados de tierra colorada. Llevate un termo de acero inoxidable de 1 litro grabado con el escudo de Oberá más un paquete de yerba mate premium de 500g con un 30% de descuento directo.',
    originalPrice: 45000,
    discountPrice: 31500,
    image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80',
    category: 'Gastronomía',
    expiryDate: '2026-07-10',
    hasQrCoupon: true,
    qrCodeValue: 'OBERAMATE-30-OFF-X921',
    views: 145,
    couponsClaimed: 38,
    isFlashSale: false
  },
  {
    id: 'offer-2',
    shopId: 'shop-5',
    shopName: 'Heladería Polar',
    title: '2x1 en Kilo de Helado Artesanal',
    description: '🔥 ¡Especial de la semana! Comprando 1 kg de helado artesanal de cualquier variedad, te llevás el segundo de regalo. ¡Probá nuestro sabor autóctono de Crema de Mate Cocido!',
    originalPrice: 12000,
    discountPrice: 6000,
    image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80',
    category: 'Gastronomía',
    expiryDate: '2026-07-06',
    hasQrCoupon: true,
    qrCodeValue: 'POLAR-2X1-KILO-Y712',
    views: 312,
    couponsClaimed: 94,
    isFlashSale: false
  },
  {
    id: 'offer-3',
    shopId: 'shop-6',
    shopName: 'Calzados Carhué',
    title: '15% de Descuento en Zapatillas Deportivas',
    description: 'Zapatillas seleccionadas de primera marca para correr por las calles de Oberá. Presentá el cupón QR y obtené el beneficio inmediato en caja abonando en efectivo o transferencia.',
    originalPrice: 55000,
    discountPrice: 46750,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    category: 'Indumentaria',
    expiryDate: '2026-07-15',
    hasQrCoupon: true,
    qrCodeValue: 'CARHUE-DEPOR-15-Z882',
    views: 89,
    couponsClaimed: 14,
    isFlashSale: false
  },
  {
    id: 'offer-4',
    shopId: 'shop-4',
    shopName: 'Electro Oberá',
    title: 'Smart TV 43" Full HD Smart Tech',
    description: 'Aprovechá la súper oferta flash en televisores. Smart TV con Android TV incorporado, control de voz y conectividad fluida. ¡Últimas unidades disponibles en local!',
    originalPrice: 380000,
    discountPrice: 299990,
    image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=600&q=80',
    category: 'Electro',
    expiryDate: '2026-07-05',
    hasQrCoupon: false,
    views: 520,
    couponsClaimed: 0,
    isFlashSale: true
  },
  {
    id: 'offer-5',
    shopId: 'shop-3',
    shopName: 'Supermercado El Cóndor',
    title: 'Súper Oferta: Pack x3 Harina Favorita',
    description: 'Llevá 3 paquetes de harina común 000 por un precio imperdible. Stock limitado de 150 bultos. ¡Ideal para las tortas fritas de los días lluviosos misioneros!',
    originalPrice: 4200,
    discountPrice: 2900,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    category: 'Supermercados',
    expiryDate: '2026-07-08',
    hasQrCoupon: false,
    views: 405,
    couponsClaimed: 0,
    isFlashSale: true
  },
  {
    id: 'offer-6',
    shopId: 'shop-2',
    shopName: 'Misiones Style Indumentaria',
    title: 'Campera de Abrigo de Gabardina con Corderito',
    description: 'Camperas súper abrigadas para enfrentar las mañanas frescas de Oberá. Disponible en talles S al XXL. Varios colores disponibles. Oferta válida hasta agotar stock de 20 camperas.',
    originalPrice: 85000,
    discountPrice: 59500,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
    category: 'Indumentaria',
    expiryDate: '2026-07-07',
    hasQrCoupon: false,
    views: 182,
    couponsClaimed: 0,
    isFlashSale: true
  }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    text: '🔥 ¡Últimas 2 horas! 2x1 en Kilo de Helado Artesanal en Heladería Polar',
    time: 'Hace 10 min',
    isRead: false,
    type: 'flash'
  },
  {
    id: 'notif-2',
    text: '🧉 Yerba Mate & Delicias Misioneras publicó un nuevo cupón QR de 30% Off',
    time: 'Hace 1 hora',
    isRead: false,
    type: 'coupon'
  },
  {
    id: 'notif-3',
    text: '👟 Calzados Carhué se unió a la plataforma ¡Mirá sus ofertas exclusivas!',
    time: 'Ayer',
    isRead: true,
    type: 'new_shop'
  }
];

export const CATEGORIES_STORY = [
  { id: 'all', name: 'Todos', emoji: '🌟', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'Indumentaria', name: 'Indumentaria', emoji: '👕', color: 'bg-red-100 text-red-800 border-red-200' },
  { id: 'Gastronomía', name: 'Gastronomía', emoji: '🧉', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'Supermercados', name: 'Supermercados', emoji: '🛒', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'Electro', name: 'Electro', emoji: '⚡', color: 'bg-blue-100 text-blue-800 border-blue-200' }
];

export const ZONES = ['Todos', 'Av. Sarmiento', 'Av. Libertad', 'Av. Italia', 'Plaza San Martín'];
