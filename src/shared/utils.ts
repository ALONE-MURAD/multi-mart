import type { HomepageSettings, Language, PlatformSettings } from './types';

export const BANGLADESH_DIVISIONS = [
  'Dhaka',
  'Chattogram',
  'Rajshahi',
  'Khulna',
  'Sylhet',
  'Rangpur',
  'Barishal',
  'Mymensingh',
] as const;

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  siteName: 'MultiMart BD',
  supportPhone: '+880 1700-000000',
  supportEmail: 'support@multimartbd.com',
  defaultCommissionRate: 10,
  deliveryFeeInsideDhaka: 70,
  deliveryFeeOutsideDhaka: 130,
  freeShippingThreshold: 3000,
};

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  announcementActive: true,
  announcementEn: 'Nationwide 64-District Delivery · Free shipping on orders over ৳3,000',
  announcementBn: 'সারা দেশে ৬৪ জেলায় হোম ডেলিভারি · ৩,০০০৳+ অর্ডারে ফ্রি ডেলিভারি',
  sections: [
    { id: 'hero', type: 'hero', titleEn: 'Featured Campaign', titleBn: 'বিশেষ ক্যাম্পেইন', isEnabled: true, order: 1 },
    { id: 'categories', type: 'categories', titleEn: 'Shop by Category', titleBn: 'ক্যাটাগরি অনুযায়ী কিনুন', isEnabled: true, order: 2 },
    { id: 'featured', type: 'featured', titleEn: 'Featured Collection', titleBn: 'নির্বাচিত পণ্যসমূহ', isEnabled: true, order: 3 },
    { id: 'mid_ad', type: 'mid_ad', titleEn: 'Sponsored Spotlight', titleBn: 'স্পন্সরড অফার', isEnabled: true, order: 4 },
    { id: 'new_arrivals', type: 'new_arrivals', titleEn: 'Latest Arrivals', titleBn: 'নতুন আগমন', isEnabled: true, order: 5 },
    { id: 'bottom_ad', type: 'bottom_ad', titleEn: 'Partner Showcase', titleBn: 'পার্টনার শোকেস', isEnabled: true, order: 6 },
  ],
};

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBanglaDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => BN_DIGITS[Number(d)] ?? d);
}

export function formatBDT(amount: number, lang: Language = 'en'): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  const formatted = new Intl.NumberFormat('en-IN').format(safe);
  return lang === 'bn' ? `৳${toBanglaDigits(formatted)}` : `৳${formatted}`;
}

export function calculateDiscountPercent(price: number, compareAtPrice?: number | null): number {
  if (!compareAtPrice || compareAtPrice <= price || compareAtPrice <= 0) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function isValidBDPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^(?:\+?880|0)1[3-9]\d{8}$/.test(cleaned);
}

export function isValidSafeUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('/')) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function formatTimestamp(ts: unknown): string {
  if (!ts) return '—';
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  if (ts instanceof Date) {
    return ts.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return 'Just now';
}

export function getReadableErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    try {
      const parsed = JSON.parse(err.message) as { error?: string };
      if (parsed && parsed.error) return parsed.error;
    } catch {
      // plain error message
    }
    if (err.message.includes('auth/operation-not-allowed')) {
      return 'Email/Password sign-in is not enabled in Firebase Console yet. Please use Google Sign-In or enable Email/Password in Firebase Auth settings.';
    }
    if (err.message.includes('auth/popup-closed-by-user')) {
      return 'Sign-in popup was closed before completing authentication.';
    }
    if (err.message.includes('auth/invalid-credential')) {
      return 'Invalid email or password.';
    }
    if (err.message.includes('auth/email-already-in-use')) {
      return 'An account with this email already exists.';
    }
    if (err.message.includes('permission-denied') || err.message.includes('Missing or insufficient permissions')) {
      return 'Permission denied by Firestore security rules. Ensure you are signed in with the proper account role.';
    }
    return err.message;
  }
  return 'An unexpected error occurred. Please try again.';
}
