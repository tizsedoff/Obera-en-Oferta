export interface Shop {
  id: string;
  name: string;
  logo: string;
  category: string;
  zone: string;
  isOpen: boolean;
  address: string;
  phone: string;
  rating: number;
  latitude?: number;
  longitude?: number;
}

export interface Offer {
  id: string;
  shopId: string;
  shopName: string;
  title: string;
  description: string;
  originalPrice: number;
  discountPrice: number;
  image: string;
  category: string;
  expiryDate: string;
  hasQrCoupon: boolean;
  qrCodeValue?: string;
  views: number;
  couponsClaimed: number;
  isFlashSale: boolean;
  mediaType?: 'image' | 'video';
}

export interface Notification {
  id: string;
  text: string;
  time: string;
  isRead: boolean;
  type: 'flash' | 'coupon' | 'new_shop';
}

export type TabType = 'home' | 'feed' | 'categories' | 'map' | 'shops' | 'myshop' | 'myprofile';

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface MapConfig {
  centerLat: number;
  centerLng: number;
  defaultZoom: number;
  cityName: string;
}

export interface SiteConfig {
  appTitle: string;
  appSubtitle: string;
  welcomeEmoji: string;
}