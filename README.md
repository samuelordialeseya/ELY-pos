=======
# 🧺 Offline POS & Inventory System (iPad)

A simple offline Point-of-Sale (POS) and inventory system built for a small fruits and vegetables business.

This project was created as a **learning project** and a **personal-use POS** for a family business.

---

## 📌 Why this exists

Small vendors often:
- Don’t want monthly POS subscriptions
- Don’t always have internet
- Just need something simple and reliable

This app runs **entirely in the browser** and stores data locally on the device.

---

## 🛠 Tech Stack

- **React** (Vite)
- **JavaScript**
- **HTML / CSS**
- **localStorage** (acts as the database)
- **PWA-ready** (offline-capable)

---

## ✨ Features

- Add fruits & vegetables to inventory
- Support for multiple units:
  - Kilogram (kg)
  - Grams (g)
  - Per piece (pcs)
  - Tali
- Customer cart system
- Manual weight input
- Automatic price calculation
- Complete orders
- View completed orders
- Remove completed orders (mistake handling)
- Daily sales summary
- View sales by selected date
- Works offline after initial load

---

## 🧠 How data is stored

This app **does NOT use a backend or database**.

All data is stored using:

```txt
Browser localStorage
>>>>>>> f9e1d780a584324d911ca19ff747c6fafa2683c7
