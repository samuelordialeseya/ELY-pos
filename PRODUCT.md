# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary:** Neighborhood produce stall owners, fruit stand operators, wet market cashiers, and family grocers in the Philippines.
- **Operating Scenario:** Front-counter iPad or tablet checkout station during busy market hours. Cashiers handle walk-in customers paying in cash or GCash while simultaneously queuing orders for neighborhood motorcycle delivery.
- **Jobs to be Done:**
  - Ring up items sold both by piece/bundle (*tali*, pack) and by fractional scale weight (*0.85 kg*, *1.25 kg*) without pausing to do mental math on a desktop calculator.
  - Record customer name and delivery address (including subdivision phases like Phase 1, Phase 4).
  - Generate instant digital receipt graphics (`.png`) shareable over Viber or Facebook Messenger.
  - Consolidate today's pending deliveries into an organized manifest sheet for dispatch riders.

## Product Purpose

- **Core Mission:** Eliminate pen-and-paper tallies, mental calculation bottlenecks at the digital scale, and lost delivery slips for small retail produce counters.
- **Definition of Success:** A transaction takes under 5 seconds from scale reading to cart addition; delivery manifests take 1 click to compile; counter staff can learn the entire register in a single morning shift.

## Positioning

- **What Competitors Cannot Copy:** Mainstream retail POS systems (Shopify, Square, Toast) assume fixed unit barcodes, stable packaged goods, and expensive hardware peripherals (serial scales, thermal receipt printers). ELY.pos is uniquely purpose-built for the reality of open-air produce retail: daily wholesale price fluctuations, manual digital scale readings typed into quick multiplier inputs, zero mandatory external hardware, and neighborhood rider dispatching sorted by subdivision phase.

## Operating Context

- **Environment:** Brightly lit counter setups, outdoor market stalls, or cramped grocery storefronts. Often operated on iPads or touchscreen Android tablets mounted on counter stands or held in hand.
- **Hardware Profile:** Standalone tablet browser / PWA. No physical barcode scanners, no wired receipt printers required. Scale weight is read by human eye from an adjacent hanging or counter scale and typed into the tactile weight input.
- **Rituals:**
  - Morning setup: Reviewing today's market prices, adjusting per-kg produce rates in Inventory.
  - Day operations: High-speed counter checkouts, tapping items, typing scale weights, collecting cash/GCash.
  - Afternoon/Evening dispatch: Filtering today's orders in Delivery Hub, generating a single consolidated delivery manifest image, and sending it to the delivery courier.

## Capabilities and Constraints

- **Confirmed Functionality:**
  - Dual pricing engine supporting per-kg decimal weights and per-unit/pack counts.
  - Multi-tenant Firestore architecture (root collection for owner store, scoped `users/{uid}/` for other registered shops).
  - Isolated demo sandbox pre-seeded with sample produce and orders.
  - Client-side image receipt generator via `html2canvas`.
  - Delivery Hub with subdivision phase-aware manifest sorter.
  - Interactive 3-step first-time setup wizard (`SetupWizard.jsx`) and dedicated full-page settings (`SettingsPage.jsx`).
  - Contextual guided tours powered by `driver.js`.
- **Technical & Operating Constraints:**
  - Must remain 100% functional without external POS hardware (no forced serial printer/scale drivers).
  - Landscape iPad (`100dvh`) priority — layout must never jump or hide checkout controls under mobile browser navigation bars.
  - All financial math denominated in Philippine Pesos (₱) with exact centavo precision.

## Brand Commitments

- **Name:** ELY.pos (*Effortless Local Yield Point of Sale*).
- **Heritage:** Created for *Ely's Fresh Fruits & Veggies* (Established 2021).
- **Tone & Voice:** Practical, warm, community-first, unpretentious, and laser-focused on operational speed. Zero enterprise jargon.

## Evidence on Hand

- **Existing Catalog & Price Seed:** [src/data/demoSeed.js](file:///c:/Users/laptop%20ni%20sam/Desktop/pos-ipad/src/data/demoSeed.js) containing authentic regional items (*Avocado Davao*, *Sweet Mango Carabao*, *Red Onion Baguio*, *Baguio Beans*).
- **Design Tokens & Visual Spec:** [DESIGN.md](file:///c:/Users/laptop%20ni%20sam/Desktop/pos-ipad/DESIGN.md) and [.impeccable/design.json](file:///c:/Users/laptop%20ni%20sam/Desktop/pos-ipad/.impeccable/design.json) with *The Sunlit Market Terminal* creative direction.
- **Historical Order Records:** [orders_rows.csv](file:///c:/Users/laptop%20ni%20sam/Desktop/pos-ipad/orders_rows.csv) and [products_rows.csv](file:///c:/Users/laptop%20ni%20sam/Desktop/pos-ipad/products_rows.csv) documenting real store transaction volume and Phase-based addresses.

## Product Principles

1. **Zero Mental Math at the Scale:** The cashier taps the item and types the scale reading. The system calculates to the exact centavo instantly. No physical calculators on the counter.
2. **Hardware-Free Independence:** Never require proprietary hardware dongles, barcode wands, or expensive receipt paper rolls. Receipts are digital images; scales are read by eye; couriers receive image manifests.
3. **Speed Over Ceremony:** Eliminate nested dialogs, multi-step checkout modals, and unnecessary confirmation clicks. Rushing customers in line cannot wait on loading spinners.
4. **Resilient Simplicity:** An iPad running ELY.pos should remain steady all day across network hiccups, browser reloads, and greasy counter fingers.

## Accessibility & Inclusion

- Large minimum touch targets (≥ 38px–44px) across all interactive register buttons.
- High-contrast color assignments ensuring sunlight legibility on tilted counter tablet screens.
- Generous numeric input sizing allowing rapid typing without mis-taps.
