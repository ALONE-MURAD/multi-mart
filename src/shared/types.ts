export type Language = 'en' | 'bn';

export type UserRole = 'customer' | 'seller' | 'admin';
export type UserStatus = 'active' | 'suspended';
export type SellerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type PayoutMethod = 'bkash' | 'nagad' | 'bank';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'cod' | 'bkash' | 'nagad' | 'sslcommerz';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type BannerPlacement = 'hero' | 'category';
export type AdPlacementType = 'homepage_mid' | 'category_top' | 'bottom_page';

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  division: string;
  district: string;
  area: string;
  streetAddress: string;
  isDefault: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  preferredLang?: Language;
  addresses: Address[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SellerProfile {
  id: string;
  ownerId: string;
  storeName: string;
  slug: string;
  descriptionEn?: string;
  descriptionBn?: string;
  division: string;
  district: string;
  logoUrl?: string;
  bannerUrl?: string;
  status: SellerStatus;
  verified: boolean;
  ratingAverage: number;
  ratingCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SellerPrivateDetails {
  ownerId: string;
  phone: string;
  email: string;
  payoutMethod: PayoutMethod;
  payoutNumber: string;
  nidNumber?: string;
  updatedAt?: unknown;
}

export interface Category {
  id: string;
  nameEn: string;
  nameBn: string;
  slug: string;
  descriptionEn?: string;
  descriptionBn?: string;
  iconName?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
  categoryId?: string;
  categorySlug: string;
  categoryNameEn: string;
  categoryNameBn: string;
  titleEn: string;
  titleBn?: string;
  descriptionEn: string;
  descriptionBn?: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  sku?: string;
  thumbnailUrl: string;
  images: string[];
  specifications: Record<string, string>;
  tags: string[];
  isActive: boolean;
  isApproved: boolean;
  isFeatured: boolean;
  ratingAverage: number;
  ratingCount: number;
  soldCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Review {
  id: string;
  productId: string;
  sellerId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  verifiedPurchase?: boolean;
  createdAt?: unknown;
}

export interface CartItem {
  productId: string;
  sellerId: string;
  sellerName: string;
  titleEn: string;
  titleBn?: string;
  price: number;
  quantity: number;
  thumbnailUrl: string;
  updatedAt?: unknown;
}

export interface OrderItem {
  productId: string;
  titleEn: string;
  titleBn?: string;
  price: number;
  quantity: number;
  thumbnailUrl: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  checkoutGroupId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  sellerId: string;
  sellerName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  commissionAmount: number;
  sellerNetAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  shippingAddress: Address;
  trackingCode?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Banner {
  id: string;
  titleEn: string;
  titleBn?: string;
  subtitleEn?: string;
  subtitleBn?: string;
  imageUrl: string;
  destinationUrl: string;
  placement: BannerPlacement;
  categorySlug?: string;
  sortOrder: number;
  isActive: boolean;
  impressions: number;
  clicks: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Advertisement {
  id: string;
  titleEn: string;
  titleBn?: string;
  sponsorName?: string;
  imageUrl: string;
  destinationUrl: string;
  placement: AdPlacementType;
  categorySlug?: string;
  isActive: boolean;
  impressions: number;
  clicks: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AppNotification {
  id: string;
  titleEn: string;
  titleBn?: string;
  messageEn: string;
  messageBn?: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt?: unknown;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  orderNumber?: string;
  status: 'open' | 'in_progress' | 'resolved';
  adminReply?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PlatformSettings {
  siteName: string;
  supportPhone: string;
  supportEmail: string;
  defaultCommissionRate: number;
  deliveryFeeInsideDhaka: number;
  deliveryFeeOutsideDhaka: number;
  freeShippingThreshold: number;
  updatedAt?: unknown;
}

export interface HomepageSectionConfig {
  id: string;
  type: 'hero' | 'categories' | 'featured' | 'mid_ad' | 'new_arrivals' | 'bottom_ad';
  titleEn: string;
  titleBn: string;
  isEnabled: boolean;
  order: number;
}

export interface HomepageSettings {
  announcementActive: boolean;
  announcementEn: string;
  announcementBn: string;
  sections: HomepageSectionConfig[];
  updatedAt?: unknown;
}
