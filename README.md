# 🛒 POS iPad - Daddy Ely's POS & Inventory System

A full-stack Point of Sale (POS) and inventory management web application optimized for iPad and tablet usage. Built with **React 19**, **Vite**, and **Supabase**, this system provides an intuitive interface to handle walk-in sales, track cloud-synced inventory, manage pre-orders, and generate delivery manifests.

It is also configured with PWA (Progressive Web App) support, allowing it to be installed directly on devices for a native app-like experience.

⚠️ **Note on Authentication & Security:** Currently, this system operates without user authentication and is designed as an internal, trusted-device tool. Supabase keys are intentionally kept in `src/supabaseClient.js` for ease of internal use within a **Private Repository**. A full authentication system is planned for a future update. 

## ✨ Features

- **🛒 Point of Sale (POS):** Browse products by category, specify custom weights/quantities, calculate subtotals, and process customer checkouts.
- **📝 Pre-Order Management:** Record and track advance customer orders and aggregate shopping lists.
- **📦 Cloud Inventory Management:** Add, edit, and delete products. Organize items by category, set prices, and specify units.
- **📋 Order History:** View past transactions and manage completed orders.
- **🧾 Digital Receipts:** Automatically generate and download image-based receipts for customers.
- **🚚 Delivery Dashboard:** Track pending vs. delivered orders and generate printable rider manifests.
- **⚡ Real-time Sync:** Powered by Supabase, ensuring data is instantly synchronized across devices.
- **📱 PWA Ready:** Configured for Progressive Web App capabilities for offline installation.

## 🛠️ Tech Stack

**Core:**
- [React](https://react.dev/) (v19)
- [Vite](https://vitejs.dev/) (v7)
- [Supabase](https://supabase.com/) (`@supabase/supabase-js`)

**Styling & UI:**
- Custom CSS with responsive, iPad-first media queries.
- [Lucide React](https://lucide.dev/) for crisp, scalable UI icons.
- [Fontsource Poppins](https://fontsource.org/fonts/poppins) for typography.

**Utilities:**
- `html2canvas` for rendering UI elements into downloadable receipts.
- `vite-plugin-pwa` for Progressive Web App support.

## 📁 Project Structure

- `src/App.jsx`: Core application component handling state management, view routing, and database logic.
- `src/App.css`: Detailed styling, Grid/Flexbox layouts, and iPad landscape media queries.
- `src/supabaseClient.js`: Supabase client connection initialization.
- `src/main.jsx`: React application entry point.
- `src/index.css`: Global baseline styles.
- `package.json`: Project dependencies and configuration.
