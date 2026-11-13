import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

admin.initializeApp();
const db = admin.firestore();

export const placeOrder = onCall({ region: 'asia-south1' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication is required to place an order.');
  }

  const uid = request.auth.uid;
  const { customerPhone, paymentMethod, shippingAddress } = request.data || {};
  if (!customerPhone || !paymentMethod || !shippingAddress) {
    throw new HttpsError('invalid-argument', 'Missing required checkout payload.');
  }

  const cartSnap = await db.collection(`users/${uid}/cart`).get();
  if (cartSnap.empty) {
    throw new HttpsError('failed-precondition', 'Your cart is empty.');
  }

  const settingsSnap = await db.doc('settings/platform').get();
  const settings = settingsSnap.data() || {
    defaultCommissionRate: 10,
    deliveryFeeInsideDhaka: 70,
    deliveryFeeOutsideDhaka: 130,
    freeShippingThreshold: 3000,
  };

  const cartItems = cartSnap.docs.map((d) => d.data());
  const bySeller = new Map<string, typeof cartItems>();
  for (const item of cartItems) {
    const list = bySeller.get(item.sellerId) ?? [];
    list.push(item);
    bySeller.set(item.sellerId, list);
  }

  const checkoutGroupId = `CHK-${Date.now()}`;
  const orderIds: string[] = [];

  await db.runTransaction(async (tx) => {
    const grandSubtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const baseDelivery =
      shippingAddress.division === 'Dhaka'
        ? settings.deliveryFeeInsideDhaka
        : settings.deliveryFeeOutsideDhaka;
    const deliveryPerSeller = grandSubtotal >= settings.freeShippingThreshold ? 0 : baseDelivery;

    for (const [sellerId, items] of bySeller.entries()) {
      for (const item of items) {
        const prodRef = db.doc(`products/${item.productId}`);
        const prodSnap = await tx.get(prodRef);
        if (!prodSnap.exists) {
          throw new HttpsError('not-found', `Product ${item.titleEn} is no longer available.`);
        }
        const prodData = prodSnap.data()!;
        if ((prodData.stock ?? 0) < item.quantity) {
          throw new HttpsError('failed-precondition', `Insufficient stock for ${item.titleEn}.`);
        }
        tx.update(prodRef, {
          stock: admin.firestore.FieldValue.increment(-item.quantity),
          soldCount: admin.firestore.FieldValue.increment(item.quantity),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
      const commissionRate = settings.defaultCommissionRate ?? 10;
      const commissionAmount = Math.round((subtotal * commissionRate) / 100);
      const sellerNetAmount = subtotal - commissionAmount;
      const totalAmount = subtotal + deliveryPerSeller;

      const orderRef = db.collection('orders').doc();
      orderIds.push(orderRef.id);

      tx.set(orderRef, {
        orderNumber: `MM-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
        checkoutGroupId,
        customerId: uid,
        customerName: shippingAddress.fullName || request.auth?.token.name || 'Customer',
        customerPhone,
        sellerId,
        sellerName: items[0].sellerName,
        items,
        subtotal,
        deliveryFee: deliveryPerSeller,
        commissionAmount,
        sellerNetAmount,
        totalAmount,
        paymentMethod,
        paymentStatus: 'pending',
        orderStatus: 'pending',
        shippingAddress,
        trackingCode: '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    for (const docSnap of cartSnap.docs) {
      tx.delete(docSnap.ref);
    }
  });

  return { checkoutGroupId, orderIds };
});

export const trackPromo = onCall({ region: 'asia-south1' }, async (request) => {
  const { targetCollection, targetId, eventType } = request.data || {};
  if (!['banners', 'advertisements'].includes(targetCollection) || !targetId) {
    throw new HttpsError('invalid-argument', 'Invalid target.');
  }
  const field = eventType === 'click' ? 'clicks' : 'impressions';
  await db.doc(`${targetCollection}/${targetId}`).update({
    [field]: admin.firestore.FieldValue.increment(1),
  });
  return { ok: true };
});

export const onReviewCreated = onDocumentCreated(
  { document: 'products/{productId}/reviews/{reviewId}', region: 'asia-south1' },
  async (event) => {
    const productId = event.params.productId;
    const reviewsSnap = await db.collection(`products/${productId}/reviews`).get();
    if (reviewsSnap.empty) return;
    const ratings = reviewsSnap.docs.map((d) => Number(d.data().rating || 0));
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    await db.doc(`products/${productId}`).update({
      ratingAverage: Number(avg.toFixed(2)),
      ratingCount: ratings.length,
    });
  }
);
