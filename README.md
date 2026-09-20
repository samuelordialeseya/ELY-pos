<p align="center">
  <strong style="font-size: 2.5rem;">ELY</strong>
</p>

<h1 align="center">ELY.pos</h1>

<p align="center">
  <em><strong>E</strong>ffortless <strong>L</strong>ocal <strong>Y</strong>ield Point of Sale</em>
</p>

<p align="center">
  A modern, tablet-first POS built for local grocery, fruit, and produce shops.<br/>
  Featuring <strong>Firebase Authentication</strong> and an <strong>Instant Sandbox Demo</strong>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black" alt="Firebase 12" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white" alt="Vite 7" />
  <img src="https://img.shields.io/badge/Auth-Enabled-success" alt="Auth Enabled" />
  <img src="https://img.shields.io/badge/Demo-Interactive%20Sandbox-blue" alt="Sandbox Demo" />
  <img src="https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white" alt="PWA Ready" />
</p>

---

## 🌟 Overview

**ELY.pos** (*Effortless Local Yield Point of Sale*) is an open, iPad-first point-of-sale and store operations system. Originally created to replace pen-and-paper tallies and messy price sheets for a family fruit and vegetable store, it is built for any neighborhood shop, wet market vendor, produce stand, or small grocer selling weighted (per-kg) and unit items.

The project features a **full authentication system** (Firebase Auth) alongside an **interactive guest demo sandbox**, allowing anyone to immediately test the POS, cart, inventory importer, and reports with zero friction.

---

## 🚀 Key Highlights

- **🔒 Built-in Authentication**: Email/Password and Google OAuth login via Firebase Auth, complete with secure session management and role handling.
- **🎮 Interactive Demo Sandbox**: Visitors can launch an isolated sandbox mode with pre-seeded products and transactions to experience the full POS without touching live data.
- **📱 iPad & Tablet-First Experience**: High-touch, landscape-optimized UI with large tap targets, tactile number pads, and responsive navigation.
- **⚖️ Weighted & Unit Item Support**: Native handling for fractional quantities (e.g. 1.345 kg) as well as per-piece/per-pack inventory.
- **⚡ Real-Time Sync**: Powered by Firestore real-time listeners for instantaneous updates across counter registers and mobile devices.
- **📋 Daily Price List Importer**: Paste bulleted text from wholesale supplier messages; the intelligent parser flags price rises, price drops, and new products automatically.
- **🧾 Instant Receipts & Delivery Manifests**: Render image receipts (`html2canvas`) and generate print-ready delivery sheets for couriers.
- **🧭 Interactive Onboarding**: Contextual help and guided tours (`driver.js`) for rapid staff training.

---

## 📸 Core Modules

| Module | Features |
| :--- | :--- |
| **Landing & Auth** | Modern brand showcase, consumer story modal, Google OAuth, and instant demo launcher |
| **POS Register** | Category tabs, live product search, per-kg weight calculation, and quick customer checkout |
| **Dashboard** | Real-time revenue metrics, transaction tallies, top-selling items, and daily order stream |
| **Inventory** | Live catalog management, stock adjustments, and intelligent text-based price list parser |
| **Order History** | Historical orders archive, search by customer/date, and one-click image receipt generator |
| **Delivery Hub** | Manifest generator for pending deliveries with courier-ready formatted sheets |

---

## 🏗️ Architecture & Tech Stack

```
pos-ipad/
├── src/
│   ├── components/
│   │   ├── AuthPage.jsx & .css        # Email/password & Google login
│   │   ├── ConsumerStoryModal.jsx     # Origin & brand storytelling modal
│   │   ├── LandingPage.jsx & .css     # Public showcase & demo entry
│   │   └── OnboardingModal.jsx        # Step-by-step guided user walkthrough
│   ├── context/
│   │   └── AuthContext.jsx            # Auth state, session persistence & demo toggles
│   ├── data/
│   │   └── demoSeed.js                # Isolated sandbox catalog & mock transactions
│   ├── App.jsx                        # Main POS workspace & state management
│   ├── App.css                        # iPad-first styling & layout rules
│   ├── firebaseClient.js              # Firebase SDK initialization
│   ├── main.jsx                       # App entry point
│   └── index.css                      # Global styles & design tokens
├── public/                            # Static icons, manifest, and assets
├── firebase.json                      # Firebase Hosting configuration
├── .firebaserc                        # Firebase project aliases
└── vite.config.js                     # Vite build & PWA configuration
```

### Stack
- **Frontend Framework**: [React 19](https://react.dev/)
- **Bundler & Tooling**: [Vite 7](https://vitejs.dev/)
- **Authentication**: [Firebase Auth](https://firebase.google.com/docs/auth)
- **Database**: [Cloud Firestore](https://firebase.google.com/docs/firestore) (real-time listeners)
- **Hosting**: [Firebase Hosting](https://firebase.google.com/docs/hosting)
- **Icons**: [Phosphor Icons](https://phosphoricons.com/)
- **Guided Tour**: [driver.js](https://driverjs.com/)
- **Receipts**: [html2canvas](https://html2canvas.hertzen.com/)
- **PWA**: [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)

---

## 🛠️ Quick Start

### 1. Prerequisites
- **Node.js** 18+
- **npm** 9+
- A [Firebase Project](https://console.firebase.google.com/) with **Firestore** and **Authentication** (Email/Password & Google providers enabled)

### 2. Clone and Install

```bash
git clone https://github.com/samuelordialeseya/ely-pos.git
cd ely-pos
npm install
```

### 3. Environment Variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> 💡 *Find these credentials in your Firebase Console under **Project Settings → General → Your apps → SDK setup and configuration**.*

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`. Access it from an iPad or tablet on the same Wi-Fi network using your local IP.

---

## 📦 Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Start development server with LAN host access |
| `npm run build` | Build optimized production bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint static analysis |

---

## 🚀 Deployment

Deploy easily to Firebase Hosting:

```bash
# 1. Login to Firebase CLI
firebase login

# 2. Select your Firebase project
firebase use your_project_id

# 3. Build and deploy
npm run build
firebase deploy --only hosting
```

---

## 📄 License

This project is open source. Feel free to fork, customize, and adapt it for your own shop or market stall.
