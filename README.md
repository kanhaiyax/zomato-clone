# Zomato Full-Stack Clone — Food Delivery & Restaurant Discovery

A production-ready full-stack food delivery web application inspired by Zomato. Built with React 19, TypeScript, Express, WebSockets, Tailwind CSS, and secure JWT authentication.

---

## 🌟 Key Features

### 1. Customer Experience
- **Location Selector & Discovery**: Switch between neighborhoods (Indiranagar, Koramangala, HSR Layout, Church Street, Whitefield) with automatic distance filtering.
- **Dynamic Restaurant Catalog**: Search by restaurant name, cuisine, rating (4.0+), delivery time (<30 mins), and pure vegetarian filters.
- **Restaurant Details & Menu**: Categorized menu sections (Dum Biryanis, Pizzas, Burgers, Starters, Desserts), search in menu, vegetarian indicators, and instant quantity steppers (`+` / `-`).
- **Smart Cart Isolation**: Prevents mixed-restaurant carts with intuitive conflict resolution dialogs.
- **Coupon & Promo Engine**: Real-time server-side coupon validation (`WELCOME50`, `ZOMATOFEAST`, `FREEFEE`) with minimum order requirements and maximum discount caps.
- **Checkout Flow**: Saved address management (Home, Work, Other), delivery instructions note, and payment selection.
- **Razorpay Test Gateway**: Interactive test payment modal supporting simulated UPI, Credit/Debit Cards, and Netbanking with backend cryptographic HMAC SHA-256 signature verification. Also supports Cash on Delivery (COD).
- **Live Real-Time Order Tracking**:
  - Live progress stepper (`placed` → `confirmed` → `preparing` → `ready_for_pickup` → `out_for_delivery` → `delivered`).
  - Animated driver tracking map (`LiveDriverMap`) with real-time SVG route progression.
  - WebSocket connection (`/api/ws`) providing instant updates when the restaurant owner advances order stages.
- **Reviews & Ratings**: Star ratings and authentic reviews with automatic restaurant average rating recalculation.

### 2. Restaurant Owner Dashboard
- **Kitchen Console**: Real-time incoming orders queue with 1-click status transitions (`Accept Order` → `Start Preparing` → `Mark Ready` → `Handover to Driver` → `Mark Delivered`).
- **Live Online / Offline Switch**: Instant store open/closed toggle.
- **Menu Management**: Add new dishes, edit prices, set descriptions, and toggle item availability (In Stock / Sold Out).
- **Sales Analytics**: Gross sales revenue, total orders, active orders count, and average order value.

### 3. Administrator Console
- **Platform Analytics**: Gross platform volume, 15% platform take-rate, active restaurants, and total users.
- **Restaurant Moderation**: Review, approve, or reject new restaurant applications.
- **Customer Oversight**: View registered accounts and suspend/reactivate users.
- **Promo Code Creator**: Create new coupon codes with percentage or flat discounts, minimum order thresholds, and expiry limits.
- **Global Order Oversight**: Complete audit log of all transactions across all restaurants.

---

## 🔑 Demo Accounts (1-Click Switcher Available in UI)

The application includes pre-configured demo credentials accessible via the 1-click switcher banner:

| Role | Email | Password | Access |
|---|---|---|---|
| **Customer** | `alex@example.com` | `password123` | Ordering, Cart, Address book, Live Tracking, Reviews |
| **Restaurant Owner** | `chef@paradise.com` | `password123` | Kitchen console, Menu editor, Order status progression |
| **Platform Admin** | `admin@zomato.com` | `admin123` | Approvals, User moderation, Coupon creation, Platform oversight |

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend**: Node.js, Express, WebSockets (`ws`), JWT (`jsonwebtoken`), Bcrypt (`bcryptjs`), Cookie Parser (`cookie-parser`)
- **Data & Storage**: High-performance persistent JSON document store with Mongoose/MongoDB compatibility, atomic file syncing in `data/database.json`.
- **Payments**: Razorpay test mode integration with cryptographic HMAC-SHA256 signature verification.
- **Real-Time**: Native WebSocket server on `/api/ws` with channel subscriptions (`order:${id}`, `restaurant:${id}`, `admin`).

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```
The server will start at `http://localhost:3000` with both Express API and Vite frontend active on the same port.

### 4. Run Automated Test Suite
```bash
npm test
```
Executes all 20 end-to-end tests covering bcrypt hashing, JWT authentication, coupon calculations, pricing rules, Razorpay HMAC verification, and order progression.

### 5. Production Build
```bash
npm run build
npm start
```

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/register` — Register a customer or owner account.
- `POST /api/auth/login` — Sign in and receive JWT token + secure HTTP-only cookie.
- `POST /api/auth/logout` — Invalidate session and clear auth cookie.
- `GET /api/auth/me` — Retrieve currently authenticated user profile.
- `PUT /api/auth/profile` — Update name and phone number.
- `POST /api/auth/addresses` — Add saved delivery address.
- `DELETE /api/auth/addresses/:id` — Remove saved address.

### Restaurants & Menus
- `GET /api/restaurants` — Search restaurants with cuisine, rating, price, and area filters.
- `GET /api/restaurants/:id` — Retrieve restaurant details, categorized menu, and reviews.
- `POST /api/restaurants` — Create new restaurant (Owner/Admin).
- `PUT /api/restaurants/:id` — Update restaurant profile and open/close status.
- `GET /api/menu/restaurant/:restaurantId` — Retrieve menu items.
- `POST /api/menu/restaurant/:restaurantId` — Add new dish.
- `PATCH /api/menu/:itemId/toggle-availability` — Toggle dish in stock / sold out.
- `DELETE /api/menu/:itemId` — Remove dish.

### Orders & Real-Time Tracking
- `POST /api/orders` — Create order with server-side price validation, taxes, and coupons.
- `GET /api/orders/my-orders` — Customer order history.
- `GET /api/orders/:id` — Order status, item breakdown, and delivery coordinates.
- `PATCH /api/orders/:id/status` — Advance order status (broadcasts via WebSocket).
- `POST /api/orders/:id/cancel` — Cancel order (if eligible).

### Payments
- `POST /api/payments/create-order` — Create Razorpay order in paise (INR).
- `POST /api/payments/verify` — Verify cryptographic HMAC-SHA256 signature.
- `POST /api/payments/simulate-signature` — Test mode signature generator for development.

### Coupons & Reviews
- `GET /api/coupons` — List active promotional offers.
- `POST /api/coupons/validate` — Validate promo code against cart subtotal.
- `POST /api/reviews` — Submit restaurant review with 1-5 star rating.
- `GET /api/reviews/restaurant/:restaurantId` — Read customer reviews.

### Owner & Admin Dashboards
- `GET /api/owner/my-restaurant` — Get owner's restaurant profile.
- `GET /api/owner/orders` — Incoming kitchen orders queue.
- `GET /api/owner/analytics` — Revenue and dish sales analytics.
- `GET /api/admin/overview` — Platform Gross Volume and take-rate statistics.
- `GET /api/admin/restaurants` — Full list of restaurants with approval controls.
- `PATCH /api/admin/restaurants/:id/approval` — Approve or reject restaurant.
- `PATCH /api/admin/users/:id/status` — Suspend or reactivate user accounts.
- `POST /api/admin/coupons` — Create promotional coupon.
