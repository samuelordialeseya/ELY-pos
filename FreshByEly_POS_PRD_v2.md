# FreshByEly — POS System PRD
**Version 2.0 · May 2026 · React + Supabase**

| Project | Client | Stack | Status |
|---|---|---|---|
| FreshByEly POS v2 | Internal / Family Business | React, Vite, Supabase | Planning |

---

## 1. Project Overview

FreshByEly is a small family-owned fresh produce business selling fruits, vegetables, eggs, and dry goods. The business runs a custom React + Supabase POS system operated by a hired cashier.

This PRD covers a major update (v2.0): removing an underperforming feature (Pre-Orders tab), adding three high-value capabilities identified through direct owner feedback, and refining the UI for faster cashier operation.

> **Business Context:** Prices change frequently — sometimes daily. The owner currently updates the POS inventory by manually reading through a long product list shared on Viber/Facebook, then editing each product one by one. This is the single biggest operational pain point.

---

## 2. Goals & Success Metrics

### 2.1 Goals

- Eliminate manual price list entry by parsing the owner's Viber/Facebook price broadcast automatically.
- Give the owner a real-time daily dashboard so business performance is visible at a glance.
- Enable cashier and owner to look up any customer's full order history by name.
- Remove the Pre-Orders feature which added UI complexity without delivering real value.
- Improve overall UI polish and cashier speed for the hired staff member.

### 2.2 Success Metrics

| Feature | Metric | Target |
|---|---|---|
| Price update time | Time to update full price list | < 2 minutes |
| Dashboard load | Revenue + top items visible on open | < 1 second |
| Customer lookup | Find all orders for a name | < 3 taps |
| Cashier error rate | Wrong price entries per day | → 0 |

---

## 3. Scope of Work

### 3.1 What's Being Removed

> ❌ **Pre-Order Tab — REMOVED**
> The Pre-Order tab (sidebar nav item, pre-order cart, active orders list, master shopping list, and all related Supabase `pre_orders` table calls) will be fully removed. The feature did not serve its intended purpose in daily operations.

### 3.2 What's Being Added

| Feature | Description | Priority | Effort |
|---|---|---|---|
| AI Price Parser | Paste Viber/FB message → auto-parse all items → bulk import | High | Medium |
| Dashboard View | Replaces Pre-Order tab. Daily revenue, txn count, top sellers | High | Medium |
| Customer Search | Search order history by customer name in the History tab | Medium | Low |

### 3.3 What's Out of Scope (v2.0)

- Cash tendered / change calculator
- Numpad weight input
- Discount per order or per item
- Low stock alerts / inventory quantities
- Multi-device role management

---

## 4. Feature Specifications



### 4.1 AI Price List Parser

The owner shares a price list daily via Viber or Facebook in a consistent semi-structured text format (category headers, bullet items, name + price + unit). A local regex-based parser reads this text, extracts all products and prices, and compares them against the existing database — no external API required.

**User Story**
> As the owner, I want to paste my daily price broadcast into the app and have it automatically detect what prices changed, what's new, and what's missing — so I can review and confirm updates in one tap instead of editing each product manually.

#### Parser Logic
The parser runs entirely client-side in four stages:

**Stage 1 — Line Filter**
Split raw text by `\n`, keep only lines containing `•`, strip whitespace.

**Stage 2 — Regex Extraction**
For each bullet line, extract name and price using:
`/^(.+?)(?:\s*-\s*|\s*\.\.+\s*|\s*\.\s*|\s+)(\d+)/`
- Group 1 → product name
- Group 2 → price number
- If no price found → flagged as warning

**Stage 3 — Normalization & Matching**
Before comparing against the database, normalize both sides:
```js
function normalizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}
```
This ensures "Davao Papaya", "davao papaya", and "davao-papaya" all match the same record.

**Stage 4 — Classification**
Every parsed item is sorted into one of five buckets:

| Bucket | Condition |
|---|---|
| `increases` | Matched + parsed price > database price |
| `decreases` | Matched + parsed price < database price |
| `unchanged` | Matched + price is the same |
| `newItems` | No match found in database |
| `warnings` | Bullet found but no price extracted |

Additionally, any product in the database but absent from the pasted list is flagged as `removedOrMissingFromList` for the owner to review.

#### UI Flow
1. Owner navigates to Inventory tab
2. Taps "Import from Price List"
3. Modal opens with a large textarea: "Paste your price broadcast here"
4. Taps "Parse" — runs instantly, no loading needed
5. Results shown in a 5-tab review table: Increases · Decreases · New · Warnings · Missing
6. Each row has a checkbox (all checked by default)
7. Warning rows are highlighted in amber with the raw text shown
8. Owner taps "Apply Selected" → upserts matching changes into Supabase products table
9. Toast: "XX products updated successfully"

#### Upsert Behavior
- Match on normalized product name
- If name exists → update price only
- If name is new (`newItems`) → insert as new product
- `warnings` and `removedOrMissingFromList` items are never auto-applied — owner decides manually
- Never deletes existing products automatically

> ✅ **No API cost**. This parser runs entirely in the browser with zero external dependencies. If the price list format changes significantly, the regex pattern in Stage 2 will need to be updated manually.

---

### 4.2 Dashboard View

> *A new "Dashboard" tab replaces the Pre-Order tab in the sidebar. This is the first screen the owner sees when checking on daily performance.*

**User Story**
> As the owner, I want to see today's total revenue, number of transactions, and top-selling items the moment I open the app — so I can monitor business performance without digging through the History tab.

#### Dashboard Cards

| Card | Content | Priority |
|---|---|---|
| Today's Revenue | Sum of all order totals for today's date | High |
| Transaction Count | Number of completed orders today | High |
| Top Selling Items | Top 5 items by total ₱ earned today | High |
| Recent Orders | Last 5 transactions with name + time + total | Medium |

#### Data Source

- All data comes from the existing `completedOrders` Supabase state (already loaded on mount)
- No additional API calls needed — filter by `raw_date === today`
- Top sellers: aggregate `items[]` arrays across all today's orders, group by name, sort by subtotal sum

#### UI Notes

- Dashboard is the default view on app open (replace `'pos'` as initial `view` state)
- Metric cards use green for revenue, blue for count, matching existing color system
- Top sellers shown as a ranked list with item name, total qty sold, and total ₱
- Recent orders list is read-only in v2.0

---

### 4.3 Customer Search in History

> *Adds a search input to the Orders/History tab that filters the order list by customer name, in addition to the existing date filter.*

**User Story**
> As the owner, I want to type a customer name in the History tab and see all their past orders — so I can answer questions like "how much has Maria spent this month" or "what did she order last week".

#### Behavior

- Add a text input `"Search by customer name..."` next to the date filter in the `orders-controls` bar
- When a name is typed, filter orders by `customer_name` (case-insensitive, partial match)
- Date filter and customer search work together (AND logic — must match both if both are active)
- When customer search is active, the revenue badge shows total ₱ for matching results (not just today)
- A clear button (✕) appears inside the search input when it has a value

---

## 5. Pre-Order Tab Removal Checklist

The following must be removed from the codebase:

| Item | What to Remove |
|---|---|
| Sidebar nav item | Remove 📝 Pre-Order nav item from sidebar |
| `view === 'preorder'` logic | Remove all JSX blocks conditional on preorder view |
| `preOrderCart` state | Remove `useState` and all `setPreOrderCart` calls |
| `preOrderCustomer` state | Remove `useState` and all `setPreOrderCustomer` calls |
| `preOrders` state | Remove `useState` — `pre_orders` no longer fetched |
| `savePreOrder()` | Delete function entirely |
| `deletePreOrder()` | Delete function entirely |
| `clearAllPreOrders()` | Delete function entirely |
| `getAggregatedShoppingList()` | Delete function entirely |
| `captureShoppingList()` | Delete function entirely |
| Supabase `pre_orders` fetch | Remove from `fetchAllData()` |
| `bill-sidebar` preorder branch | Remove the preorder branch in the `<aside>` element |
| CSS cleanup | Remove any preorder-specific CSS classes |

---

## 6. Build Plan & Phases

| Phase | Feature | Tasks | Status |
|---|---|---|---|
| 1 | Remove Pre-Order Tab | Delete all pre-order code, states, Supabase calls, sidebar nav item. Set default view to `'dashboard'`. | ✅ Done |
| 2 | Dashboard View | Create Dashboard tab with revenue card, transaction count, top sellers list, recent orders. Today/Weekly/Monthly date range selector. | 🟡 In Progress |
| 3 | AI Price List Parser | Add 'Import from Price List' button in Inventory. Build modal with textarea, local regex parser, 5-tab review table with checkboxes, upsert to Supabase. No Anthropic API needed. | 🔄 To Be Updated |
| 4 | Customer Search | Add customer name search input to History tab. Implement AND filtering with existing date filter. Update revenue badge for filtered results. | 🔴 Not Started |
| 5 | UI Polish | Review card layouts, button sizing for iPad touch, toast messages, general visual consistency pass. | 🔴 Not Started |

---

## 7. Technical Notes

### 7.1 Existing Stack

- React 18 + Vite
- Supabase (PostgreSQL) — cloud database with real-time subscriptions
- Single-file architecture: `App.jsx` + `App.css` (monolithic, no component splitting in v2.0)
- `html2canvas` for receipt and manifest screenshot export
- Deployed as PWA (manifest + iOS meta tags in `index.html`)

### 7.2 Supabase Tables (Existing)

| Table | Columns | Purpose |
|---|---|---|
| `products` | id, name, price, unit, category | Inventory items |
| `orders` | id, customer_name, address, items[], total, status, raw_date, created_at | Completed transactions |
| `app_settings` | id='global', customer_count | Running customer counter |
| `pre_orders` | id, customer, items[], date, status | **Abandoned in v2.0** |

| `VITE_SUPABASE_URL` | Currently hardcoded in `supabaseClient.js` | Move to `.env` |
| `VITE_SUPABASE_KEY` | Currently hardcoded in `supabaseClient.js` | Move to `.env` |

> 🔴 **Security:** The Supabase URL and anon key are currently hardcoded in `supabaseClient.js`. Move these to `.env` before starting the v2.0 build.

---

## 8. Acceptance Criteria

### Phase 1 — Pre-Order Removal
- No Pre-Order tab appears in the sidebar
- App opens to Dashboard by default
- No console errors related to pre-order state or Supabase calls
- All other tabs (POS, Inventory, History, Delivery) function identically to v1

### Phase 2 — Dashboard
- Today's revenue shows correct sum of completed orders
- Transaction count matches number of orders for today
- Top 5 items are correct and sorted by ₱ descending
- Recent orders list shows last 5 orders with name, time, and total
- Date range selector (Today / This Week / This Month) works correctly
- Dashboard data updates in real time via Firestore listener

### Phase 3 — AI Price Parser
- Modal opens cleanly from Inventory tab
- Parser correctly identifies bulleted items and ignores headers/footer
- Regex successfully extracts name and price from at least 90% of the sample broadcast
- Review table tabs correctly filter items into the 5 buckets
- Applying selected items successfully updates Firebase (not Supabase) `products` collection

### Phase 4 — Customer Search
- Typing a partial name filters the order list in real time
- Date filter and name search work together correctly
- Revenue badge updates to reflect filtered results
- Clear button resets the search

---

## 9. Open Questions

| Question | Priority | Owner |
|---|---|---|
| Should the Anthropic API key be client-side or proxied through a Supabase Edge Function? | High | Owner to decide |
| Should low-confidence parsed items require manual confirmation before import? | Medium | Owner to decide |
| Should Dashboard support viewing past dates or always show today only? | Low | Owner to decide |
| Should existing `pre_orders` table data be exported before the table is abandoned? | Medium | Owner to decide |

---

## 10. Appendix — Sample Price List Input

The following is the actual owner price broadcast format the AI parser must handle:

```
Ely's Fruits and Veggies  MGA SUKI!!

🍎 FRUITS
  • Davao lacatan 155 kg
  • Davao Papaya- 80/kg.
  • Fuji apple xxl 55 pesos/pc
  • Kiwi-50/pc
  • Lemon -45/pc.
  • Melon-130/kg
  • Watermelon red pahaba- 75/ kg

🍆 VEGETABLES
  • Ampalaya -160/kg
  • Bawang -180/kg
  • Brocolli-250/kg
  • Chicharo-500/kg.
  • Kang kong -25/ tali
  • Petchay tagalog -30 pesos/ tali
  • Sitaw green- 30/tali

🥚 EGGS & SEAFOOD / DRY GOODS
  • Dry Dilis puti-450/kg
  • Egg white large -270 /tray
  • Quail egg-20 pcs/90pesos
  • Salted egg-24 pesos/pc
  • Wrapper lumpia big.-75/ bundle

NOTICE: prices may change without prior notice… thank you!!!
```

---

*Document prepared: May 2026 · FreshByEly POS PRD v2.0 · For use with Antigravity IDE or any AI coding assistant.*
