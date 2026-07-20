<p align="center">
  <strong style="font-size: 2.5rem;">ELY</strong>
</p>

<h1 align="center">ELY.pos</h1>

<p align="center">
  <em><strong>E</strong>ffortless <strong>L</strong>ocal <strong>Y</strong>ield Point of Sale</em>
</p>

<p align="center">
  <strong>Work in progress</strong><br/>
  An iPad-first POS built for my dad's store — simple enough for any small shop to use
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white" alt="PWA" />
  <img src="https://img.shields.io/badge/Status-WIP-orange" alt="Work in Progress" />
</p>

---

## About ELY.pos

**ELY.pos** — *Effortless Local Yield Point of Sale* — is a tablet-friendly point-of-sale and store operations app I built for my dad's fruits and vegetables business. It started as a personal project to get him off paper tallies and scattered price lists, but the goal is a POS any small shop can pick up: market stalls, neighborhood stores, produce stands, or any business that sells by weight and needs delivery tracking.

No bloated enterprise features — just checkout, inventory, sales history, and delivery manifests in one app that runs in the browser and installs on iPad like a native app.

**For the counter:** Browse products by category, weigh per-kg items, build a cart, and complete walk-in or delivery orders.

**For the owner:** Track daily revenue, top sellers, and transaction history from a live dashboard synced across devices.

**For riders:** Select pending delivery orders and generate a print-ready manifest for the day's route.

---

## Repository & Live App Notice

> **This project is not finished.** User authentication is not implemented yet.

Anyone with access to the hosted app URL can open the full POS — including product prices, order history, customer names, addresses, and sales figures. Treat this repository and deployment link as **sensitive**.

- Keep the GitHub repo **private** until auth and Firestore security rules are in place.
- Do not share the live URL publicly or in portfolio materials yet.
- Firebase config belongs in `.env` — never commit credentials or service account keys.

Auth and proper access controls are planned before this is considered production-ready.

---

## Why ELY.pos?

- **Built for real daily use** — born from my dad's actual store workflow, not a generic template
- **Anyone can run it** — fork the repo, plug in your own Firebase project, and manage your own catalog
- **iPad-first UI** — sidebar navigation, large tap targets, landscape-friendly layouts
- **Real-time sync** — Firestore listeners keep inventory and orders consistent across devices
- **Daily price updates** — paste a bullet-list price message and apply changes in bulk
- **Receipts & manifests** — download image receipts and print rider delivery sheets
- **Guided tour** — built-in walkthrough (driver.js) for onboarding new staff

---

## Who It's For

ELY.pos is aimed at small businesses that don't need a full ERP:

- Fruits, vegetables, and wet market vendors
- Neighborhood sari-sari or corner stores
- Home-based food businesses with delivery
- Any shop that sells items by weight (kg) or unit and wants a simple digital register

If you can set up a Firebase project and run `npm install`, you can deploy your own instance with your own products and orders.

---

## Platforms Supported

### Web / PWA (Primary)

- **Target:** iPad Safari, Chrome, and modern mobile browsers
- **Install:** Add to Home Screen for standalone, full-screen use
- **Views:**
  - **Dashboard** — revenue, transactions, top sellers, recent orders
  - **POS** — product grid, cart, checkout
  - **Inventory** — catalog management and price-list import
  - **History** — past orders, receipts, search by date/customer
  - **Delivery** — pending orders and printable manifests

---

## Core Features

### Dashboard

- Revenue, transaction count, average order value, and items sold
- Date filters: today, this week, this month, or custom date
- Top sellers ranked by revenue
- Recent orders feed

### Point of Sale

- Category filters and product search
- Per-kg quantity input for weighted items
- Customer name and delivery address on checkout
- Real-time cart with running total

### Inventory

- Add, edit, and delete products (name, price, unit, category)
- **Price List Importer** — parses a daily bullet-list text, detects price increases/decreases, new items, and warnings before applying
- Changes sync instantly to the POS view

### Order History

- Filter by date and search by customer name
- View order details and download receipt images (`html2canvas`)
- Delete mistaken records

### Delivery

- Select pending delivery orders for the day
- Generate a formatted, print-ready rider manifest
- Capture manifest as an image for sharing

### Onboarding

- Contextual help modals per view
- Guided tour highlighting key UI elements

---

## Technical Architecture

### Project Structure

```
pos-ipad/
├── src/
│   ├── App.jsx             # Main app — views, state, Firestore logic
│   ├── App.css             # iPad-first layout and styling
│   ├── firebaseClient.js   # Firebase / Firestore init
│   ├── main.jsx            # React entry point
│   └── index.css           # Global styles
├── public/                 # Static assets, PWA icons
├── firebase.json           # Firebase Hosting config
├── .firebaserc             # Firebase project config
└── vite.config.js          # Vite + PWA plugin
```

### Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 7 |
| **Database** | Firebase Firestore (real-time listeners) |
| **Hosting** | Firebase Hosting |
| **Styling** | Custom CSS, Fontsource Poppins |
| **Icons** | Lucide React |
| **Receipts** | html2canvas |
| **Onboarding** | driver.js |
| **PWA** | vite-plugin-pwa |

### Firestore Collections

```
/products/{productId}
/orders/{orderId}
```

---

## Installation & Setup

### Prerequisites

- **Node.js** 18+
- **npm** 9+
- **Firebase CLI** (for deployment): `npm install -g firebase-tools`
- A Firebase project with Firestore enabled

### Clone & Install

```bash
git clone https://github.com/samuelordialeseya/store-pos.git
cd store-pos
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Get these values from the [Firebase Console](https://console.firebase.google.com/) → Project Settings → Your apps → Web app config.

---

## Running the App

### Development

```bash
npm run dev
```

Opens at `http://localhost:5173` with `--host` for LAN access from iPad.

### Production Build

```bash
npm run build
npm run preview
```

### Deploy to Firebase Hosting

```bash
firebase login
firebase use your_project_id
npm run build
firebase deploy --only hosting
```

---

## App Flow

1. **Owner** pastes the daily price-list text into Inventory → Import from Price List
2. **Parser** highlights increases, decreases, new items, and unmatched entries for review
3. **Staff** opens POS, filters by category, taps products into the cart
4. **Checkout** — enter customer details, complete the transaction
5. **Firestore** syncs the order; Dashboard metrics update in real time
6. **History** — staff can pull up and download a receipt image
7. **Delivery** — select today's pending orders and print the rider manifest

---

## Feature Overview

| Feature | Dashboard | POS | Inventory | History | Delivery |
|---|:---:|:---:|:---:|:---:|:---:|
| Revenue metrics | Yes | — | — | — | — |
| Product checkout | — | Yes | — | — | — |
| Catalog management | — | — | Yes | — | — |
| Price list import | — | — | Yes | — | — |
| Order search | — | — | — | Yes | — |
| Receipt download | — | — | — | Yes | — |
| Rider manifest | — | — | — | — | Yes |
| Guided tour | Yes | Yes | Yes | Yes | Yes |

---

## Development

```bash
npm install       # Install dependencies
npm run dev       # Dev server (with LAN host)
npm run lint      # ESLint
npm run build     # Production build
npm run preview   # Preview production build
```

---

## Roadmap

- [ ] User authentication (Firebase Auth)
- [ ] Firestore security rules locked to authenticated users
- [ ] Role-based access (owner vs. staff)
- [ ] Multi-tenant setup so others can deploy isolated instances easily

---

## License

Personal project. Fork and adapt for your own store — auth and security hardening recommended before going live.

---

<p align="center">
  <strong>ELY.pos</strong><br/>
  <em>Effortless Local Yield Point of Sale</em><br/>
  Built for my dad. Open for anyone who needs a simple shop register.
</p>
