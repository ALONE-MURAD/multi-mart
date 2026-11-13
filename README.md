# MultiMart BD — Multi-Vendor Bangladesh Marketplace

MultiMart BD is a complete, bilingual (**English / বাংলা**) multi-vendor e-commerce platform priced in **BDT (৳)**, built with React 19, TypeScript, Tailwind CSS v4, and Firebase (Authentication, Cloud Firestore, Cloud Storage, and Cloud Functions).

## Architecture Overview

- **Customer Storefront (`/`, `/category/:slug`, `/search`, `/product/:id`, `/store/:sellerId`, `/cart`, `/wishlist`, `/checkout`, `/orders`, `/profile`, `/support`)**
  - Bilingual English & Bangla UI switcher (`EN / বাংলা`) with BDT (`৳`) numeral formatting
  - Real-time category strip, hero banners, sponsored ad placements, featured & latest products
  - Persistent user cart & wishlist synced with Firestore
  - 64-district / 8-division Bangladesh shipping address checkout with Cash on Delivery, bKash, Nagad, and SSLCommerz options
  - Live order history, order tracking timeline, and verified customer reviews
- **Seller Dashboard (`/seller`, `/seller/onboarding`, `/seller/products`, `/seller/orders`, `/seller/earnings`, `/seller/profile`)**
  - Seller registration with store profile & isolated private payout/KYC details
  - Real-time inventory management, EN/BN product upload & editing, specification builder
  - Order fulfillment workflow (`pending` → `confirmed` → `packed` → `shipped` → `delivered`) and net earnings breakdown
- **Admin Dashboard (`/admin`, `/admin/login`, `/admin/products`, `/admin/categories`, `/admin/sellers`, `/admin/users`, `/admin/orders`, `/admin/banners`, `/admin/ads`, `/admin/settings`)**
  - Full product CRUD (add, edit, delete, publish/unpublish, feature/unfeature) synchronized in real time with the Customer Storefront
  - Category, User, Seller approval/verification, Order, Banner, Advertisement, Support Ticket, and Platform/Homepage Settings management
  - One-click **Initialize Catalog** utility in the Admin Overview to populate starter categories, banners, and products directly into Firestore

## Folder Structure

```text
├── src/
│   ├── admin/          # Admin dashboard layout & management pages
│   ├── customer/       # Storefront layout, components, & customer pages
│   ├── seller/         # Seller onboarding & vendor console pages
│   ├── services/       # Firebase init, Auth, Firestore, and Storage services
│   └── shared/         # Types, EN/BN i18n, BDT utils, contexts, shared UI
├── functions/          # Firebase Cloud Functions v2 (order transaction, triggers)
├── firebase-blueprint.json
├── firestore.rules     # Hardened ABAC Firestore security rules
├── firestore.indexes.json
├── storage.rules
└── firebase.json
```

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Firebase
The project reads Firebase configuration from `firebase-applet-config.json` or `VITE_FIREBASE_*` environment variables in `.env`:

```bash
cp .env.example .env
```

In your Firebase Console:
1. Enable **Authentication** → **Sign-in method** → **Google** (and optionally **Email/Password** if you want email+password sign-ups in addition to 1-click Google Sign-In).
2. Create a **Cloud Firestore** database.
3. Enable **Cloud Storage** (optional for uploading product photos directly; image URLs also work out of the box).
4. Deploy security rules & composite indexes:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```
5. (Optional) Deploy Cloud Functions:
   ```bash
   cd functions && npm install && npm run build && cd ..
   firebase deploy --only functions
   ```

### 3. Run Locally
```bash
npm run dev
```

### 4. Type-Check & Production Build
```bash
npm run lint
npm run build
```

### 5. Deploy Hosting
```bash
firebase deploy --only hosting
```
