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
}

export interface Notification {
  id: string;
  text: string;
  time: string;
  isRead: boolean;
  type: 'flash' | 'coupon' | 'new_shop';
}

export type TabType = 'home' | 'categories' | 'map' | 'myshop' | 'myprofile';
