import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  writeBatch,
  increment,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  DEFAULT_HOMEPAGE_SETTINGS,
  DEFAULT_PLATFORM_SETTINGS,
  slugify,
} from '../shared/utils';
import { STUDIO_ASSETS } from '../shared/localAssets';
import type {
  Address,
  Advertisement,
  AdPlacementType,
  AppNotification,
  Banner,
  BannerPlacement,
  CartItem,
  Category,
  HomepageSettings,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PayoutMethod,
  PlatformSettings,
  Product,
  Review,
  SellerPrivateDetails,
  SellerProfile,
  SellerStatus,
  SupportTicket,
  UserProfile,
  UserRole,
  UserStatus,
} from '../shared/types';

function toMillis(ts: unknown): number {
  if (!ts) return 0;
  if (
    typeof ts === 'object' &&
    ts !== null &&
    'toMillis' in ts &&
    typeof (ts as { toMillis: () => number }).toMillis === 'function'
  ) {
    return (ts as { toMillis: () => number }).toMillis();
  }
  if (
    typeof ts === 'object' &&
    ts !== null &&
    'seconds' in ts &&
    typeof (ts as { seconds: number }).seconds === 'number'
  ) {
    return (ts as { seconds: number }).seconds * 1000;
  }
  return 0;
}

// ========================
// CATEGORIES
// ========================

export function subscribeActiveCategories(callback: (items: Category[]) => void): () => void {
  const q = query(collection(db, 'categories'), where('isActive', '==', true));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) }))
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      callback(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'categories')
  );
}

export function subscribeAllCategories(callback: (items: Category[]) => void): () => void {
  const q = query(collection(db, 'categories'), orderBy('sortOrder', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) })));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'categories')
  );
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const q = query(collection(db, 'categories'), where('isActive', '==', true));
    const snap = await getDocs(q);
    const match = snap.docs.find((d) => (d.data() as Category).slug === slug);
    if (!match) return null;
    return { id: match.id, ...(match.data() as Omit<Category, 'id'>) };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'categories');
  }
}

export async function saveCategory(
  input: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>,
  id?: string
): Promise<string> {
  const cleanSlug = slugify(input.slug || input.nameEn);
  const docId = id || cleanSlug || `cat-${Date.now()}`;
  const path = `categories/${docId}`;
  try {
    const ref = doc(db, 'categories', docId);
    const existing = id ? await getDoc(ref) : null;
    if (existing && existing.exists()) {
      await updateDoc(ref, {
        ...input,
        slug: cleanSlug,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ...input,
        slug: cleanSlug,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return docId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'categories', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
  }
}

// ========================
// PRODUCTS
// ========================

export function subscribePublicProducts(
  options: { featuredOnly?: boolean; limitCount?: number; sellerId?: string },
  callback: (items: Product[]) => void
): () => void {
  const q = query(
    collection(db, 'products'),
    where('isActive', '==', true),
    where('isApproved', '==', true)
  );
  return onSnapshot(
    q,
    (snap) => {
      let items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }));
      if (options.featuredOnly) items = items.filter((p) => p.isFeatured);
      if (options.sellerId) items = items.filter((p) => p.sellerId === options.sellerId);
      items.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      callback(items.slice(0, options.limitCount ?? 12));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'products')
  );
}

export function subscribeAllProductsAdmin(callback: (items: Product[]) => void): () => void {
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) })));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'products')
  );
}

export function subscribeSellerProducts(sellerId: string, callback: (items: Product[]) => void): () => void {
  const q = query(collection(db, 'products'), where('sellerId', '==', sellerId));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }))
        .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      callback(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'products')
  );
}

export function subscribeProductById(id: string, callback: (item: Product | null) => void): () => void {
  const ref = doc(db, 'products', id);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback({ id: snap.id, ...(snap.data() as Omit<Product, 'id'>) });
    },
    (error) => handleFirestoreError(error, OperationType.GET, `products/${id}`)
  );
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const snap = await getDoc(doc(db, 'products', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<Product, 'id'>) };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `products/${id}`);
  }
}

export async function fetchPaginatedProducts(params: {
  categorySlug?: string;
  searchTerm?: string;
  sortBy?: 'newest' | 'price_asc' | 'price_desc';
  minPrice?: number;
  maxPrice?: number;
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
}): Promise<{
  items: Product[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}> {
  try {
    const pageSize = params.pageSize ?? 12;
    const snap = await getDocs(
      query(
        collection(db, 'products'),
        where('isActive', '==', true),
        where('isApproved', '==', true)
      )
    );

    let entries = snap.docs.map((d) => ({
      docSnap: d,
      item: { id: d.id, ...(d.data() as Omit<Product, 'id'>) } as Product,
    }));

    if (params.categorySlug) {
      entries = entries.filter((e) => e.item.categorySlug === params.categorySlug);
    }
    if (params.minPrice !== undefined && Number.isFinite(params.minPrice)) {
      entries = entries.filter((e) => e.item.price >= params.minPrice!);
    }
    if (params.maxPrice !== undefined && Number.isFinite(params.maxPrice)) {
      entries = entries.filter((e) => e.item.price <= params.maxPrice!);
    }
    if (params.searchTerm && params.searchTerm.trim()) {
      const term = params.searchTerm.trim().toLowerCase();
      entries = entries.filter(
        ({ item: p }) =>
          p.titleEn.toLowerCase().includes(term) ||
          (p.titleBn || '').toLowerCase().includes(term) ||
          p.sellerName.toLowerCase().includes(term) ||
          (p.categoryNameEn || '').toLowerCase().includes(term) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(term))
      );
    }

    if (params.sortBy === 'price_asc') {
      entries.sort((a, b) => a.item.price - b.item.price);
    } else if (params.sortBy === 'price_desc') {
      entries.sort((a, b) => b.item.price - a.item.price);
    } else {
      entries.sort((a, b) => toMillis(b.item.createdAt) - toMillis(a.item.createdAt));
    }

    let startIndex = 0;
    if (params.cursor) {
      const idx = entries.findIndex((e) => e.docSnap.id === params.cursor!.id);
      if (idx >= 0) startIndex = idx + 1;
    }

    const slice = entries.slice(startIndex, startIndex + pageSize);
    const hasMore = startIndex + pageSize < entries.length;

    return {
      items: slice.map((e) => e.item),
      lastDoc: slice.length > 0 ? slice[slice.length - 1]!.docSnap : null,
      hasMore,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'products');
  }
}

export async function saveProduct(
  input: Omit<
    Product,
    'id' | 'ratingAverage' | 'ratingCount' | 'soldCount' | 'createdAt' | 'updatedAt'
  >,
  id?: string
): Promise<string> {
  const payload = {
    sellerId: input.sellerId,
    sellerName: input.sellerName.slice(0, 120),
    categoryId: input.categoryId || input.categorySlug,
    categorySlug: input.categorySlug,
    categoryNameEn: input.categoryNameEn.slice(0, 100),
    categoryNameBn: input.categoryNameBn.slice(0, 100),
    titleEn: input.titleEn.trim().slice(0, 180),
    titleBn: (input.titleBn || '').trim().slice(0, 180),
    descriptionEn: input.descriptionEn.trim().slice(0, 5000),
    descriptionBn: (input.descriptionBn || '').trim().slice(0, 5000),
    price: Number(input.price),
    compareAtPrice:
      input.compareAtPrice && input.compareAtPrice > 0 ? Number(input.compareAtPrice) : null,
    stock: Math.max(0, Math.floor(Number(input.stock))),
    sku: (input.sku || '').trim().slice(0, 64),
    thumbnailUrl: input.thumbnailUrl || input.images[0] || '',
    images: input.images.slice(0, 10),
    specifications: input.specifications || {},
    tags: (input.tags || []).slice(0, 20),
    isActive: Boolean(input.isActive),
    isApproved: Boolean(input.isApproved),
    isFeatured: Boolean(input.isFeatured),
  };

  try {
    if (id) {
      await updateDoc(doc(db, 'products', id), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
      return id;
    }
    const created = await addDoc(collection(db, 'products'), {
      ...payload,
      ratingAverage: 0,
      ratingCount: 0,
      soldCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return created.id;
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, id ? `products/${id}` : 'products');
  }
}

export async function updateProductQuickFields(
  id: string,
  patch: Partial<Pick<Product, 'stock' | 'isActive' | 'isApproved' | 'isFeatured' | 'price'>>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'products', id), {
      ...patch,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
  }
}

// ========================
// REVIEWS
// ========================

export function subscribeProductReviews(productId: string, callback: (items: Review[]) => void): () => void {
  const q = query(collection(db, 'products', productId, 'reviews'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, 'id'>) })));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, `products/${productId}/reviews`)
  );
}

export async function submitProductReview(input: {
  productId: string;
  sellerId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
}): Promise<void> {
  const prodRef = doc(db, 'products', input.productId);
  const reviewRef = doc(collection(db, 'products', input.productId, 'reviews'));
  try {
    await runTransaction(db, async (tx) => {
      const prodSnap = await tx.get(prodRef);
      if (!prodSnap.exists()) throw new Error('Product does not exist.');
      const prod = prodSnap.data() as Product;
      const oldCount = prod.ratingCount || 0;
      const oldAvg = prod.ratingAverage || 0;
      const newCount = oldCount + 1;
      const newAvg = Number(((oldAvg * oldCount + input.rating) / newCount).toFixed(2));

      tx.set(reviewRef, {
        productId: input.productId,
        sellerId: input.sellerId,
        userId: input.userId,
        userName: input.userName.slice(0, 120),
        rating: Math.min(5, Math.max(1, Math.round(input.rating))),
        comment: input.comment.trim().slice(0, 1500),
        verifiedPurchase: false,
        createdAt: serverTimestamp(),
      });

      tx.update(prodRef, {
        ratingAverage: newAvg,
        ratingCount: newCount,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `products/${input.productId}/reviews`);
  }
}

// ========================
// CART & WISHLIST
// ========================

export function subscribeCart(userId: string, callback: (items: CartItem[]) => void): () => void {
  return onSnapshot(
    collection(db, 'users', userId, 'cart'),
    (snap) => {
      callback(snap.docs.map((d) => d.data() as CartItem));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, `users/${userId}/cart`)
  );
}

export async function addToCart(userId: string, product: Product, quantity = 1): Promise<void> {
  const itemRef = doc(db, 'users', userId, 'cart', product.id);
  try {
    const snap = await getDoc(itemRef);
    const prevQty = snap.exists() ? (snap.data() as CartItem).quantity : 0;
    const nextQty = Math.min(99, Math.max(1, prevQty + quantity));
    await setDoc(itemRef, {
      productId: product.id,
      sellerId: product.sellerId,
      sellerName: product.sellerName,
      titleEn: product.titleEn,
      titleBn: product.titleBn || '',
      price: product.price,
      quantity: nextQty,
      thumbnailUrl: product.thumbnailUrl || product.images[0] || '',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/cart/${product.id}`);
  }
}

export async function updateCartItemQuantity(
  userId: string,
  productId: string,
  quantity: number
): Promise<void> {
  const itemRef = doc(db, 'users', userId, 'cart', productId);
  try {
    if (quantity <= 0) {
      await deleteDoc(itemRef);
      return;
    }
    await updateDoc(itemRef, {
      quantity: Math.min(99, Math.floor(quantity)),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/cart/${productId}`);
  }
}

export async function removeCartItem(userId: string, productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', userId, 'cart', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/cart/${productId}`);
  }
}

export function subscribeWishlist(userId: string, callback: (productIds: string[]) => void): () => void {
  return onSnapshot(
    collection(db, 'users', userId, 'wishlist'),
    (snap) => {
      callback(snap.docs.map((d) => d.id));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, `users/${userId}/wishlist`)
  );
}

export async function toggleWishlistProduct(userId: string, productId: string): Promise<boolean> {
  const ref = doc(db, 'users', userId, 'wishlist', productId);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await deleteDoc(ref);
      return false;
    }
    await setDoc(ref, {
      productId,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/wishlist/${productId}`);
  }
}

// ========================
// ORDERS & CHECKOUT
// ========================

export async function placeOrderTransactional(params: {
  customerId: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  shippingAddress: Address;
  settings: PlatformSettings;
}): Promise<{ checkoutGroupId: string; orderIds: string[] }> {
  const cartRef = collection(db, 'users', params.customerId, 'cart');
  const checkoutGroupId = `CHK-${Date.now()}`;
  const orderIds: string[] = [];

  try {
    const cartSnap = await getDocs(cartRef);
    if (cartSnap.empty) {
      throw new Error('Your shopping cart is empty.');
    }

    const cartItems = cartSnap.docs.map((d) => d.data() as CartItem);
    const bySeller = new Map<string, CartItem[]>();
    for (const item of cartItems) {
      const list = bySeller.get(item.sellerId) ?? [];
      list.push(item);
      bySeller.set(item.sellerId, list);
    }

    await runTransaction(db, async (tx) => {
      const grandSubtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const baseFee =
        params.shippingAddress.division === 'Dhaka'
          ? params.settings.deliveryFeeInsideDhaka
          : params.settings.deliveryFeeOutsideDhaka;
      const deliveryPerSeller =
        grandSubtotal >= params.settings.freeShippingThreshold ? 0 : baseFee;

      // Read & validate all products first
      const productSnaps = new Map<string, Product>();
      for (const item of cartItems) {
        const pSnap = await tx.get(doc(db, 'products', item.productId));
        if (!pSnap.exists()) {
          throw new Error(`Product "${item.titleEn}" is no longer available.`);
        }
        const pData = pSnap.data() as Product;
        if (pData.stock < item.quantity) {
          throw new Error(`Only ${pData.stock} unit(s) left in stock for "${item.titleEn}".`);
        }
        productSnaps.set(item.productId, pData);
      }

      // Decrement stock & create orders
      for (const item of cartItems) {
        const pData = productSnaps.get(item.productId)!;
        tx.update(doc(db, 'products', item.productId), {
          stock: pData.stock - item.quantity,
          soldCount: (pData.soldCount || 0) + item.quantity,
          updatedAt: serverTimestamp(),
        });
      }

      for (const [sellerId, sellerItems] of bySeller.entries()) {
        const subtotal = sellerItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const commissionRate = params.settings.defaultCommissionRate || 10;
        const commissionAmount = Math.round((subtotal * commissionRate) / 100);
        const sellerNetAmount = subtotal - commissionAmount;
        const totalAmount = subtotal + deliveryPerSeller;

        const orderRef = doc(collection(db, 'orders'));
        orderIds.push(orderRef.id);

        tx.set(orderRef, {
          orderNumber: `MM-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
          checkoutGroupId,
          customerId: params.customerId,
          customerName: params.customerName.slice(0, 120),
          customerPhone: params.customerPhone.slice(0, 20),
          sellerId,
          sellerName: sellerItems[0]!.sellerName.slice(0, 120),
          items: sellerItems.map((i) => ({
            productId: i.productId,
            titleEn: i.titleEn,
            titleBn: i.titleBn || '',
            price: i.price,
            quantity: i.quantity,
            thumbnailUrl: i.thumbnailUrl,
          })),
          subtotal,
          deliveryFee: deliveryPerSeller,
          commissionAmount,
          sellerNetAmount,
          totalAmount,
          paymentMethod: params.paymentMethod,
          paymentStatus: 'pending',
          orderStatus: 'pending',
          shippingAddress: params.shippingAddress,
          trackingCode: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      for (const cDoc of cartSnap.docs) {
        tx.delete(cDoc.ref);
      }
    });

    return { checkoutGroupId, orderIds };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'orders');
  }
}

export function subscribeCustomerOrders(customerId: string, callback: (items: Order[]) => void): () => void {
  const q = query(collection(db, 'orders'), where('customerId', '==', customerId));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }))
        .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      callback(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'orders')
  );
}

export function subscribeSellerOrders(sellerId: string, callback: (items: Order[]) => void): () => void {
  const q = query(collection(db, 'orders'), where('sellerId', '==', sellerId));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }))
        .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      callback(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'orders')
  );
}

export function subscribeAllOrdersAdmin(callback: (items: Order[]) => void): () => void {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }))),
    (error) => handleFirestoreError(error, OperationType.LIST, 'orders')
  );
}

export function subscribeOrderById(orderId: string, callback: (item: Order | null) => void): () => void {
  return onSnapshot(
    doc(db, 'orders', orderId),
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback({ id: snap.id, ...(snap.data() as Omit<Order, 'id'>) });
    },
    (error) => handleFirestoreError(error, OperationType.GET, `orders/${orderId}`)
  );
}

export async function updateOrderStatus(
  orderId: string,
  patch: { orderStatus?: OrderStatus; paymentStatus?: PaymentStatus; trackingCode?: string }
): Promise<void> {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      ...patch,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
  }
}

// ========================
// SELLERS & USERS
// ========================

export async function getSellerById(sellerId: string): Promise<SellerProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'sellers', sellerId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<SellerProfile, 'id'>) };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `sellers/${sellerId}`);
  }
}

export function subscribeSellerById(
  sellerId: string,
  callback: (seller: SellerProfile | null) => void
): () => void {
  return onSnapshot(
    doc(db, 'sellers', sellerId),
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback({ id: snap.id, ...(snap.data() as Omit<SellerProfile, 'id'>) });
    },
    (error) => handleFirestoreError(error, OperationType.GET, `sellers/${sellerId}`)
  );
}

export async function getSellerPrivateDetails(sellerId: string): Promise<SellerPrivateDetails | null> {
  try {
    const snap = await getDoc(doc(db, 'sellers', sellerId, 'private', 'details'));
    if (!snap.exists()) return null;
    return snap.data() as SellerPrivateDetails;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `sellers/${sellerId}/private/details`);
  }
}

export async function registerOrUpdateSeller(params: {
  uid: string;
  storeName: string;
  descriptionEn: string;
  descriptionBn: string;
  division: string;
  district: string;
  logoUrl?: string;
  bannerUrl?: string;
  phone: string;
  email: string;
  payoutMethod: PayoutMethod;
  payoutNumber: string;
  nidNumber?: string;
  isNew: boolean;
}): Promise<void> {
  const sellerRef = doc(db, 'sellers', params.uid);
  const privateRef = doc(db, 'sellers', params.uid, 'private', 'details');
  try {
    const batch = writeBatch(db);
    if (params.isNew) {
      batch.set(sellerRef, {
        ownerId: params.uid,
        storeName: params.storeName.trim().slice(0, 120),
        slug: slugify(params.storeName) || `store-${params.uid.slice(0, 6)}`,
        descriptionEn: params.descriptionEn.trim().slice(0, 2000),
        descriptionBn: params.descriptionBn.trim().slice(0, 2000),
        division: params.division,
        district: params.district.trim().slice(0, 60),
        logoUrl: params.logoUrl || '',
        bannerUrl: params.bannerUrl || '',
        status: 'pending',
        verified: false,
        ratingAverage: 0,
        ratingCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.update(sellerRef, {
        storeName: params.storeName.trim().slice(0, 120),
        slug: slugify(params.storeName) || `store-${params.uid.slice(0, 6)}`,
        descriptionEn: params.descriptionEn.trim().slice(0, 2000),
        descriptionBn: params.descriptionBn.trim().slice(0, 2000),
        division: params.division,
        district: params.district.trim().slice(0, 60),
        logoUrl: params.logoUrl || '',
        bannerUrl: params.bannerUrl || '',
        updatedAt: serverTimestamp(),
      });
    }

    batch.set(privateRef, {
      ownerId: params.uid,
      phone: params.phone.trim().slice(0, 20),
      email: params.email.trim().slice(0, 200),
      payoutMethod: params.payoutMethod,
      payoutNumber: params.payoutNumber.trim().slice(0, 80),
      nidNumber: (params.nidNumber || '').trim().slice(0, 40),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `sellers/${params.uid}`);
  }
}

export function subscribeAllSellersAdmin(callback: (items: SellerProfile[]) => void): () => void {
  const q = query(collection(db, 'sellers'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SellerProfile, 'id'>) }))),
    (error) => handleFirestoreError(error, OperationType.LIST, 'sellers')
  );
}

export async function updateSellerStatusAdmin(
  sellerId: string,
  patch: { status?: SellerStatus; verified?: boolean }
): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'sellers', sellerId), {
      ...patch,
      updatedAt: serverTimestamp(),
    });
    if (patch.status === 'approved') {
      batch.update(doc(db, 'users', sellerId), {
        role: 'seller',
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `sellers/${sellerId}`);
  }
}

export function subscribeAllUsersAdmin(callback: (items: UserProfile[]) => void): () => void {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data() as UserProfile)),
    (error) => handleFirestoreError(error, OperationType.LIST, 'users')
  );
}

export async function updateUserProfileSelf(
  uid: string,
  patch: Partial<Pick<UserProfile, 'displayName' | 'phone' | 'preferredLang' | 'addresses'>>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...patch,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function updateUserAdmin(
  uid: string,
  patch: Partial<Pick<UserProfile, 'role' | 'status'>>
): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', uid), {
      ...patch,
      updatedAt: serverTimestamp(),
    });
    if (patch.role === 'admin') {
      batch.set(doc(db, 'admins', uid), {
        uid,
        email: '',
        createdAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

// ========================
// BANNERS & ADVERTISEMENTS
// ========================

export function subscribeActiveBanners(
  placement: BannerPlacement,
  callback: (items: Banner[]) => void,
  categorySlug?: string
): () => void {
  const q = query(collection(db, 'banners'), where('isActive', '==', true));
  return onSnapshot(
    q,
    (snap) => {
      let items = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Banner, 'id'>) }))
        .filter((b) => b.placement === placement);
      if (categorySlug) {
        items = items.filter((b) => !b.categorySlug || b.categorySlug === categorySlug);
      }
      items.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      callback(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'banners')
  );
}

export function subscribeAllBannersAdmin(callback: (items: Banner[]) => void): () => void {
  const q = query(collection(db, 'banners'), orderBy('sortOrder', 'asc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Banner, 'id'>) }))),
    (error) => handleFirestoreError(error, OperationType.LIST, 'banners')
  );
}

export async function saveBanner(
  input: Omit<Banner, 'id' | 'impressions' | 'clicks' | 'createdAt' | 'updatedAt'>,
  id?: string
): Promise<void> {
  try {
    if (id) {
      await updateDoc(doc(db, 'banners', id), { ...input, updatedAt: serverTimestamp() });
      return;
    }
    await addDoc(collection(db, 'banners'), {
      ...input,
      impressions: 0,
      clicks: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, id ? `banners/${id}` : 'banners');
  }
}

export async function deleteBanner(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'banners', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `banners/${id}`);
  }
}

export function subscribeActiveAdvertisements(
  placement: AdPlacementType,
  callback: (items: Advertisement[]) => void,
  categorySlug?: string
): () => void {
  const q = query(collection(db, 'advertisements'), where('isActive', '==', true));
  return onSnapshot(
    q,
    (snap) => {
      let items = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Advertisement, 'id'>) }))
        .filter((a) => a.placement === placement);
      if (categorySlug) {
        items = items.filter((a) => !a.categorySlug || a.categorySlug === categorySlug);
      }
      callback(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'advertisements')
  );
}

export function subscribeAllAdsAdmin(callback: (items: Advertisement[]) => void): () => void {
  return onSnapshot(
    collection(db, 'advertisements'),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Advertisement, 'id'>) }))),
    (error) => handleFirestoreError(error, OperationType.LIST, 'advertisements')
  );
}

export async function saveAdvertisement(
  input: Omit<Advertisement, 'id' | 'impressions' | 'clicks' | 'createdAt' | 'updatedAt'>,
  id?: string
): Promise<void> {
  try {
    if (id) {
      await updateDoc(doc(db, 'advertisements', id), { ...input, updatedAt: serverTimestamp() });
      return;
    }
    await addDoc(collection(db, 'advertisements'), {
      ...input,
      impressions: 0,
      clicks: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, id ? `advertisements/${id}` : 'advertisements');
  }
}

export async function deleteAdvertisement(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'advertisements', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `advertisements/${id}`);
  }
}

export async function trackPromoEvent(params: {
  targetCollection: 'banners' | 'advertisements';
  targetId: string;
  eventType: 'impression' | 'click';
}): Promise<void> {
  try {
    const field = params.eventType === 'click' ? 'clicks' : 'impressions';
    await updateDoc(doc(db, params.targetCollection, params.targetId), {
      [field]: increment(1),
    });
  } catch {
    // Non-blocking analytics increment
  }
}

// ========================
// SETTINGS, NOTIFICATIONS & SUPPORT
// ========================

export function subscribePlatformSettings(callback: (settings: PlatformSettings) => void): () => void {
  return onSnapshot(
    doc(db, 'settings', 'platform'),
    (snap) => {
      if (!snap.exists()) {
        callback(DEFAULT_PLATFORM_SETTINGS);
        return;
      }
      callback({ ...DEFAULT_PLATFORM_SETTINGS, ...(snap.data() as Partial<PlatformSettings>) });
    },
    (error) => handleFirestoreError(error, OperationType.GET, 'settings/platform')
  );
}

export function subscribeHomepageSettings(callback: (settings: HomepageSettings) => void): () => void {
  return onSnapshot(
    doc(db, 'settings', 'homepage'),
    (snap) => {
      if (!snap.exists()) {
        callback(DEFAULT_HOMEPAGE_SETTINGS);
        return;
      }
      callback({ ...DEFAULT_HOMEPAGE_SETTINGS, ...(snap.data() as Partial<HomepageSettings>) });
    },
    (error) => handleFirestoreError(error, OperationType.GET, 'settings/homepage')
  );
}

export async function savePlatformSettings(settings: PlatformSettings): Promise<void> {
  try {
    await setDoc(doc(db, 'settings', 'platform'), {
      ...settings,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/platform');
  }
}

export async function saveHomepageSettings(settings: HomepageSettings): Promise<void> {
  try {
    await setDoc(doc(db, 'settings', 'homepage'), {
      ...settings,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/homepage');
  }
}

export function subscribeUserNotifications(
  userId: string,
  callback: (items: AppNotification[]) => void
): () => void {
  const q = query(collection(db, 'users', userId, 'notifications'), orderBy('createdAt', 'desc'), limit(20));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AppNotification, 'id'>) }))),
    (error) => handleFirestoreError(error, OperationType.LIST, `users/${userId}/notifications`)
  );
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), { isRead: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/notifications/${notificationId}`);
  }
}

export async function submitSupportTicket(input: {
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  orderNumber?: string;
}): Promise<string> {
  try {
    const res = await addDoc(collection(db, 'supportTickets'), {
      ...input,
      status: 'open',
      adminReply: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return res.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'supportTickets');
  }
}

export function subscribeUserTickets(userId: string, callback: (items: SupportTicket[]) => void): () => void {
  const q = query(collection(db, 'supportTickets'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<SupportTicket, 'id'>) }))
        .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      callback(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'supportTickets')
  );
}

export function subscribeAllTicketsAdmin(callback: (items: SupportTicket[]) => void): () => void {
  const q = query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SupportTicket, 'id'>) }))),
    (error) => handleFirestoreError(error, OperationType.LIST, 'supportTickets')
  );
}

export async function updateSupportTicketAdmin(
  ticketId: string,
  patch: { status: SupportTicket['status']; adminReply?: string }
): Promise<void> {
  try {
    await updateDoc(doc(db, 'supportTickets', ticketId), {
      ...patch,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `supportTickets/${ticketId}`);
  }
}

// ========================
// ADMIN CATALOG INITIALIZER (REAL FIRESTORE BATCH WRITE)
// ========================

export async function seedMarketplaceCatalog(adminUid: string): Promise<void> {
  try {
    const batch = writeBatch(db);

    const categories = [
      {
        id: 'mens-apparel',
        nameEn: "Men's Apparel",
        nameBn: 'পুরুষদের পোশাক',
        slug: 'mens-apparel',
        descriptionEn: 'Tailored Panjabis, linen shirts, and everyday heritage wear.',
        descriptionBn: 'পাঞ্জাবি, লিনেন শার্ট ও ঐতিহ্যবাহী পোশাক।',
        iconName: 'Shirt',
        sortOrder: 1,
      },
      {
        id: 'audio-gadgets',
        nameEn: 'Audio & Gadgets',
        nameBn: 'অডিও ও গ্যাজেট',
        slug: 'audio-gadgets',
        descriptionEn: 'Wireless headphones, earbuds, and everyday tech accessories.',
        descriptionBn: 'ওয়্যারলেস হেডফোন, ইয়ারবাড ও স্মার্ট গ্যাজেট।',
        iconName: 'Headphones',
        sortOrder: 2,
      },
      {
        id: 'watches-wearables',
        nameEn: 'Watches & Wearables',
        nameBn: 'ঘড়ি ও স্মার্টওয়াচ',
        slug: 'watches-wearables',
        descriptionEn: 'Precision timepieces and fitness-ready smartwatches.',
        descriptionBn: 'আধুনিক স্মার্টওয়াচ ও স্টাইলিশ ঘড়ি।',
        iconName: 'Watch',
        sortOrder: 3,
      },
      {
        id: 'home-living',
        nameEn: 'Home & Living',
        nameBn: 'হোম ও লিভিং',
        slug: 'home-living',
        descriptionEn: 'Handcrafted ceramic lighting, desk decor, and modern essentials.',
        descriptionBn: 'সিরামিক ল্যাম্প, হোম ডেকোর ও আধুনিক আসবাব।',
        iconName: 'Sofa',
        sortOrder: 4,
      },
    ];

    for (const c of categories) {
      batch.set(doc(db, 'categories', c.id), {
        nameEn: c.nameEn,
        nameBn: c.nameBn,
        slug: c.slug,
        descriptionEn: c.descriptionEn,
        descriptionBn: c.descriptionBn,
        iconName: c.iconName,
        imageUrl: '',
        sortOrder: c.sortOrder,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    batch.set(doc(db, 'sellers', adminUid), {
      ownerId: adminUid,
      storeName: 'Dhaka Craft & Tech Flagship',
      slug: 'dhaka-craft-tech-flagship',
      descriptionEn: 'Official curated flagship vendor for verified apparel, electronics, and home living in Bangladesh.',
      descriptionBn: 'বাংলাদেশের যাচাইকৃত পোশাক, ইলেকট্রনিক্স ও হোম লিভিং ফ্ল্যাগশিপ স্টোর।',
      division: 'Dhaka',
      district: 'Dhaka',
      logoUrl: '',
      bannerUrl: STUDIO_ASSETS.heroDhakaMarketplace,
      status: 'approved',
      verified: true,
      ratingAverage: 4.9,
      ratingCount: 24,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const starterProducts = [
      {
        id: 'prod-linen-panjabi-olive',
        categoryId: 'mens-apparel',
        categorySlug: 'mens-apparel',
        categoryNameEn: "Men's Apparel",
        categoryNameBn: 'পুরুষদের পোশাক',
        titleEn: 'Rajshahi Emerald Linen Panjabi',
        titleBn: 'রাজশাহী এমারেল্ড লিনেন পাঞ্জাবি',
        descriptionEn:
          'Breathable 100% pure cotton-linen weave tailored for Bangladeshi weather. Features mandarin collar, coconut-shell buttons, and reinforced side pockets.',
        descriptionBn:
          'বাংলাদেশের আবহাওয়ার উপযোগী ১০০% খাঁটি সুতি-লিনেন কাপড়ে তৈরি। ম্যান্ডারিন কলার ও প্রিমিয়াম বাটনসহ নিখুঁত ফিনিশিং।',
        price: 2250,
        compareAtPrice: 2800,
        stock: 34,
        sku: 'MM-PNJ-101',
        thumbnailUrl: STUDIO_ASSETS.productPanjabiLinen,
        images: [STUDIO_ASSETS.productPanjabiLinen],
        specifications: { Material: '100% Cotton Linen', Fit: 'Tailored Regular', Origin: 'Bangladesh' },
        tags: ['panjabi', 'linen', 'eid', 'mens'],
        isFeatured: true,
      },
      {
        id: 'prod-obsidian-anc-headphones',
        categoryId: 'audio-gadgets',
        categorySlug: 'audio-gadgets',
        categoryNameEn: 'Audio & Gadgets',
        categoryNameBn: 'অডিও ও গ্যাজেট',
        titleEn: 'Obsidian Pro Active Noise-Cancelling Headphones',
        titleBn: 'অবসিডিয়ান প্রো এএনসি ওয়্যারলেস হেডফোন',
        descriptionEn:
          'Hybrid 42dB active noise cancellation, 50-hour USB-C fast-charge battery, and memory-foam ear cushions for studio clarity during Dhaka commutes.',
        descriptionBn:
          '৪২ ডেসিবেল অ্যাক্টিভ নয়েজ ক্যান্সেলেশন, ৫০ ঘণ্টা ব্যাটারি ব্যাকআপ ও প্রিমিয়াম সাউন্ড কোয়ালিটি।',
        price: 5490,
        compareAtPrice: 6900,
        stock: 18,
        sku: 'MM-AUD-204',
        thumbnailUrl: STUDIO_ASSETS.productAncHeadphones,
        images: [STUDIO_ASSETS.productAncHeadphones],
        specifications: { Bluetooth: '5.3 Low Latency', Battery: '50 Hours', Charging: 'USB-C Fast' },
        tags: ['headphones', 'wireless', 'anc', 'audio'],
        isFeatured: true,
      },
      {
        id: 'prod-titanium-smartwatch-espresso',
        categoryId: 'watches-wearables',
        categorySlug: 'watches-wearables',
        categoryNameEn: 'Watches & Wearables',
        categoryNameBn: 'ঘড়ি ও স্মার্টওয়াচ',
        titleEn: 'Aether Titanium Hybrid Smartwatch (Espresso Leather)',
        titleBn: 'অ্যাথার টাইটানিয়াম হাইব্রিড স্মার্টওয়াচ',
        descriptionEn:
          'Brushed aerospace titanium bezel paired with genuine stitched leather strap, AMOLED always-on dial, SpO2 & heart-rate tracking, and 14-day battery.',
        descriptionBn:
          'ব্রাশড টাইটানিয়াম বেজেল, জেনুইন লেদার স্ট্র্যাপ ও ১৪ দিনের ব্যাটারি ব্যাকআপসহ প্রিমিয়াম স্মার্টওয়াচ।',
        price: 7800,
        compareAtPrice: 9200,
        stock: 12,
        sku: 'MM-WTC-309',
        thumbnailUrl: STUDIO_ASSETS.productSmartwatchPro,
        images: [STUDIO_ASSETS.productSmartwatchPro],
        specifications: { Case: '44mm Titanium', WaterResistance: '5 ATM', Battery: '14 Days' },
        tags: ['watch', 'smartwatch', 'leather', 'titanium'],
        isFeatured: true,
      },
      {
        id: 'prod-ceramic-linen-lamp',
        categoryId: 'home-living',
        categorySlug: 'home-living',
        categoryNameEn: 'Home & Living',
        categoryNameBn: 'হোম ও লিভিং',
        titleEn: 'Ribbed Stoneware Ceramic Table Lamp',
        titleBn: 'হ্যান্ডক্রাফটেড সিরামিক টেবিল ল্যাম্প',
        descriptionEn:
          'Wheel-thrown matte ribbed stoneware base with a warm natural jute-linen drum shade and braided textile power cord.',
        descriptionBn:
          'আধুনিক ইন্টেরিয়রের জন্য হাতে তৈরি সিরামিক বেস ও প্রাকৃতিক লিনেন শেডের টেবিল ল্যাম্প।',
        price: 3450,
        compareAtPrice: 4100,
        stock: 15,
        sku: 'MM-HOM-412',
        thumbnailUrl: STUDIO_ASSETS.productCeramicLamp,
        images: [STUDIO_ASSETS.productCeramicLamp],
        specifications: { Height: '42 cm', Bulb: 'E27 Warm LED Included', Material: 'Stoneware & Linen' },
        tags: ['lamp', 'ceramic', 'decor', 'home'],
        isFeatured: true,
      },
    ];

    for (const p of starterProducts) {
      batch.set(doc(db, 'products', p.id), {
        sellerId: adminUid,
        sellerName: 'Dhaka Craft & Tech Flagship',
        categoryId: p.categoryId,
        categorySlug: p.categorySlug,
        categoryNameEn: p.categoryNameEn,
        categoryNameBn: p.categoryNameBn,
        titleEn: p.titleEn,
        titleBn: p.titleBn,
        descriptionEn: p.descriptionEn,
        descriptionBn: p.descriptionBn,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        stock: p.stock,
        sku: p.sku,
        thumbnailUrl: p.thumbnailUrl,
        images: p.images,
        specifications: p.specifications,
        tags: p.tags,
        isActive: true,
        isApproved: true,
        isFeatured: p.isFeatured,
        ratingAverage: 4.8,
        ratingCount: 6,
        soldCount: 14,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    batch.set(doc(db, 'banners', 'hero-dhaka-launch'), {
      titleEn: 'Curated Essentials Across Bangladesh',
      titleBn: 'সারা বাংলাদেশে মানসম্মত পণ্যের সংগ্রহ',
      subtitleEn: 'Verified local merchants, transparent BDT pricing, and reliable 64-district delivery.',
      subtitleBn: 'যাচাইকৃত বিক্রেতা, সঠিক মূল্য এবং ৬৪ জেলায় দ্রুত হোম ডেলিভারি।',
      imageUrl: STUDIO_ASSETS.heroDhakaMarketplace,
      destinationUrl: '/search',
      placement: 'hero',
      categorySlug: '',
      sortOrder: 1,
      isActive: true,
      impressions: 0,
      clicks: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(doc(db, 'settings', 'platform'), {
      ...DEFAULT_PLATFORM_SETTINGS,
      updatedAt: serverTimestamp(),
    });

    batch.set(doc(db, 'settings', 'homepage'), {
      ...DEFAULT_HOMEPAGE_SETTINGS,
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'catalog-seed');
  }
}
