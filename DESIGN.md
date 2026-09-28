---
name: ELY.pos
description: Fast, touch-first Point of Sale & Catalog Management for fresh produce and small retail.
colors:
  primary: "#00A3E0"
  primary-light: "#E0F7FF"
  secondary: "#1F2937"
  success: "#10B981"
  warning: "#F59E0B"
  accent-purple: "#8B5CF6"
  danger: "#EF4444"
  produce-roots: "#EA580C"
  produce-fruits: "#F59E0B"
  produce-vegetables: "#10B981"
  produce-general: "#00A3E0"
  undo-bg: "#0F172A"
  undo-action: "#2563EB"
  undo-accent: "#38BDF8"
  neutral-bg: "#F9FAFB"
  neutral-surface: "#FFFFFF"
  neutral-border: "#E5E7EB"
  text-main: "#111827"
  text-muted: "#6B7280"
typography:
  display:
    fontFamily: "Poppins, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.15
  headline:
    fontFamily: "Poppins, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "Poppins, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Poppins, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Poppins, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.6px"
    lineHeight: 1.4
rounded:
  sm: "8px"
  md: "14px"
  lg: "20px"
  full: "9999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.md}"
    padding: "14px 20px"
  button-secondary:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.text-main}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  card-surface:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.md}"
    padding: "20px"
  input-field:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.text-main}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
---

# Design System: ELY.pos

## Overview

**Creative North Star: "The Sunlit Market Terminal"**

ELY.pos is designed for the tactile, fast-moving energy of a busy produce stall and small neighborhood retail. The interface balances the breezy, luminous clarity of an Apple boutique with the rock-solid, glanceable ergonomics of a modern SaaS operations terminal. Every screen is engineered for zero-hesitation counter interactions: massive tap targets, clear decimal weight inputs, high-contrast typography, and immediate visual feedback under harsh shop lighting or tilted iPad glass.

Instead of heavy enterprise menus, dark industrial grids, or clutter, ELY.pos lives in clean, sunlit light mode. Soft off-white backgrounds (`#F9FAFB`) host pure white cards (`#FFFFFF`) with generous 14px rounded corners and subtle ambient diffusions. Vibrant module-specific gradients animate each functional hub, while the primary sky blue (`#00A3E0`) anchors branding, selection, and action.

**Key Characteristics:**
- **Sunlit Clarity:** Light, airy, high-contrast surface canvas designed to stay effortlessly legible on counter tablets.
- **Purpose-Driven Color Grammar:** Colors are functional indicators, not decorative noise. Green completes transactions; Sky Blue steers interaction; Amber monitors scale catalog.
- **Touch-First Precision:** Minimum 38px tap boundaries, oversized inputs, and fractional scale multipliers built for fast fingers.
- **Glanceable Hierarchy:** Distinct typographic roles in Poppins that communicate unit prices, item quantities, and total sums in a split second.

## Colors

The palette draws inspiration from open-air fruit stands and vibrant produce crates set against crisp, clean paper.

### Primary
- **Vivid Sky Cyan** (`#00A3E0`): The brand's signature accent (Pantone 2995 C). Applied to primary navigation, primary action buttons, active search tabs, focus rings, and selection indicators.
- **Ice Cyan Tint** (`#E0F7FF`): Soft background tint for active badge pills, selected row highlights, and suggestion chips.

### Secondary
- **Deep Charcoal Slate** (`#1F2937`): Primary anchor for dark headings, prominent subheads, and high-emphasis labels.
- **Deepest Slate** (`#0F172A`): Core text color for card headings, hero titles, and high-contrast table data.

### Functional Accents
- **Emerald Green** (`#10B981`): Exclusively reserved for checkout, payment confirmations, completed transaction badges, and revenue metrics.
- **Market Amber** (`#F59E0B`): Dedicated to inventory management, produce catalog alerts, and scale weight tags.
- **Violet History** (`#8B5CF6`): Signature accent for receipts, order log archives, and customer purchase histories.
- **Signal Red** (`#EF4444`): Destructive alerts, sign-out actions, and item removal triggers.
- **Produce Terracotta Ochre** (`#EA580C`): Dedicated chip color for Root Crops, Tubers, Alliums, and Spices (garlic, onion, potato, ginger).
- **Produce Fresh Amber** (`#F59E0B`): Dedicated chip color for Fresh Fruits (banana, mango, apple, calamansi).
- **Produce Emerald Leaf** (`#10B981`): Dedicated chip color for Leafy Greens and Fresh Vegetables.
- **Checkout Undo Banner Slate** (`#0F172A`): High-contrast background for 5-second non-blocking rollback toast banner.
- **Checkout Undo Action Blue** (`#2563EB`): Reversible rollback trigger on undo banner.

### Neutral
- **Market Paper Background** (`#F9FAFB`): Primary application viewport canvas.
- **Pure Surface White** (`#FFFFFF`): Elevated cards, sidebar canvas, input fields at rest, and receipt modals.
- **Light Border Gray** (`#E5E7EB` / `#E2E8F0`): Crisp 1px boundary dividers between cards, list rows, and table cells.
- **Text Main** (`#111827`): Body copy and high-density line items.
- **Text Muted** (`#6B7280` / `#64748B`): Secondary timestamps, units, measurement hints, and inactive nav labels.

### Named Rules
**The Emerald Checkout Rule.** Green (`#10B981`) is never used for generic UI buttons, links, or decoration. It is strictly reserved for finalizing transactions, earning revenue, and signifying completed order fulfillment.

**The One Blue Rule.** Sky Cyan (`#00A3E0`) commands active focus. Only one primary blue CTA should claim prominence per visual view.

## Typography

**Display Font:** Poppins, with system sans-serif fallback (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`)
**Body Font:** Poppins, with system sans-serif fallback
**Numeric / Monospace Font:** `monospace, 'Courier New'` (used strictly for receipt layouts and variable tags)

**Character:** Geometric, friendly, open letterforms that remain crisp and legible at small sizes on low-glare counter screens.

### Hierarchy
- **Display** (700 Bold, `clamp(2rem, 5vw, 3rem)`, line-height 1.15): Hero marketing titles and terminal welcome greetings.
- **Headline** (700 Bold, `24px` / `1.5rem`, line-height 1.25): Modal titles, setup wizard headings, and primary screen headers.
- **Title** (600 SemiBold, `18px` / `1.125rem`, line-height 1.35): Product card names, card headers, and stat summary labels.
- **Body** (400 Regular / 500 Medium, `14px` / `0.875rem`, line-height 1.5): Standard data fields, customer names, addresses, and instruction copy.
- **Label** (700 Bold, `11px` / `0.6875rem`, letter-spacing `0.6px`, uppercase): Pill badges, category tags, table header columns, and status pills.

### Named Rules
**The Peso Prominence Rule.** Currency amounts are always bolded (`600` or `700`) and lead with the Philippine Peso symbol (`₱`). Product list prices always display with decimal cents (`₱150.00 / kg`).

## Layout

ELY.pos operates on a purpose-built 3-column operational layout engine tuned for 10-inch to 13-inch counter iPads and desktop monitors:

- **Sidebar (Left, 260px Fixed):** Fixed vertical navigation containing brand identity, module icons, and quick account access. Never scrolls independently.
- **Main Viewport (Center, 1fr Flexible):** The primary operational canvas (Dashboard, POS Catalog, Inventory, History, Manifests, or Settings). Scrolls smoothly with touch momentum (`-webkit-overflow-scrolling: touch`).
- **Cart Sidebar (Right, 360px Fixed):** Visible during active POS mode for real-time ticket calculation. When on non-POS views, the grid seamlessly collapses into a spacious 2-column layout (`260px 1fr`) using `.pos-layout.no-cart`.
- **Dynamic Viewport Height (`100dvh`):** Layout boundaries lock to dynamic viewport height to prevent iOS Safari address-bar jumps during rapid checkouts.

## Elevation & Depth

ELY.pos avoids heavy dark drop-shadows. Depth is articulated through clean tonal contrast (pure white floating over off-white) paired with delicate multi-layer ambient glows.

### Shadow Vocabulary
- **Subtle Surface (`--shadow-sm`):** `0 4px 6px -1px rgba(0, 0, 0, 0.05)` — inputs, filter bars, and card containers at rest.
- **Card Lift (`--shadow-md`):** `0 10px 15px -3px rgba(0, 0, 0, 0.08)` — active product cards, floating bill sidebar, and interactive tables.
- **Elevated Modal (`--shadow-lg` / `--shadow-float`):** `0 25px 60px -15px rgba(0, 0, 0, 0.35)` — setup wizard cards, receipt modals, and centered dialogs.
- **Cyan Glow:** `0 4px 12px rgba(0, 163, 224, 0.35)` — primary buttons and active branding icons.

### Named Rules
**The Flat-At-Rest Rule.** All interface cards sit grounded on the canvas with 1px soft borders (`#E5E7EB`). Elevating shadows and micro-transforms (`translateY(-2px)`) emerge only as direct responses to touch, hover, or modal focus.

## Shapes

The form language is friendly, approachable, and ergonomic:

- **Small Radius (`rounded.sm: 8px`):** Used for scale inputs, search boxes, table action buttons, and variable chips.
- **Medium Radius (`rounded.md: 14px`):** The foundational container shape for food cards, nav item hover states, and settings cards.
- **Large Radius (`rounded.lg: 20px`):** Used for setup wizard cards, onboarding dialogs, and instant receipt paper sheets.
- **Pill Radius (`rounded.full: 9999px`):** Status indicators, category filter tabs, and user avatars.

## Components

### Buttons
- **Shape:** Rounded rectangle (`12px` to `14px`).
- **Primary Action (`button-primary`):** Background `#00A3E0`, color `#FFFFFF`, padding `12px 24px`, font-weight `600`. On hover: `box-shadow: 0 6px 16px rgba(0, 163, 224, 0.4)`, `transform: translateY(-1px)`.
- **Complete Transaction (`button-success`):** Background `#10B981`, color `#FFFFFF`, padding `14px 20px`, font-weight `700`, font-size `16px`. Full-width checkout anchor.
- **Secondary / Neutral:** Background `#FFFFFF`, border `1px solid #E2E8F0`, color `#374151`, hover background `#F8FAFC`.

### Inputs & Quantity Fields
- **Style:** Clean light gray background (`#F8FAFC`), border `1px solid #E2E8F0`, radius `8px` to `12px`, padding `10px 14px`.
- **Focus:** Border transitions to `#00A3E0` with a 3px ambient focus halo `rgba(0, 163, 224, 0.15)`.
- **Scale Stepper Inputs:** Integrated alongside produce cards with unit suffix placeholder (`kg`, `pc`, `pack`).

### Product Food Cards
- **Structure:** White container (`#FFFFFF`), radius `14px`, border `1px solid #F1F5F9`, box-shadow `--shadow-sm`.
- **Top Badge:** Category tag in upper corner (e.g. `Fruits`, `Vegetables`).
- **Typography:** Product title in `16px` Bold, unit price in `14px` Medium (`₱150.00 / kg`).
- **Interaction:** Embedded numeric weight input and instant "Add" button for immediate cart addition.

### Navigation Items
- **Structure:** Horizontal pill container (`padding: 10px 16px`, radius `14px`).
- **Icon Box:** Distinct 38x38px gradient square with `11px` radius and inner glass highlight (`inset 0 1px 0 rgba(255, 255, 255, 0.4)`).
- **Active State:** Text color switches to `#111827`, background takes subtle `#F3F4F6` tint, icon box springs slightly.

### Digital Receipt Card
- **Structure:** Clean thermal-style paper card (`#FFFFFF`) with dashed divider borders, dark brand header, itemized breakdown, and high-visibility total footer.
- **Export Mode:** Optimized for high-resolution PNG rendering via `html2canvas` with clean 2x pixel density.

### Iconography
- **System:** Phosphor Icons (`@phosphor-icons/react`).
- **Styles & Weights:**
  - `bold`: Primary interactive controls, navigation tabs, table action buttons, and secondary badges (`weight="bold"`).
  - `fill`: Status affirmation indicators (completed order checkmarks, active delivery status, live preview badges) (`weight="fill"`).
  - `regular`: Supplementary descriptive hints and search input indicators.
- **Visual Character:** Curved corner terminals, optical balance, and friendly geometry that natively matches Poppins and iPad tactile touch ergonomics.

## Do's and Don'ts

### Do:
- **Do** maintain a minimum touch target size of 38px x 38px for every clickable element on iPad screens.
- **Do** format all currency numbers with the Philippine Peso symbol and two decimal places (e.g., `₱1,250.00`).
- **Do** use `100dvh` for full-height root views to prevent mobile Safari viewport clipping.
- **Do** keep the Cart Sidebar hidden (`no-cart` grid) on all non-register views to give data tables breathing room.
- **Do** provide instant visual feedback (toast notification or button state) within 100ms of any cart or inventory action.

### Don't:
- **Don't** use Emerald Green (`#10B981`) for navigation tabs, informational tags, or secondary buttons.
- **Don't** introduce dark-mode inverted surfaces inside the main cashier workflow; maintain sunlit high legibility.
- **Don't** allow the root POS window or sidebar to scroll vertically; keep scrolling strictly inside `.main-viewport` and `.bill-items`.
- **Don't** use pure black (`#000000`) for text; use `#111827` or `#0F172A` to prevent eye strain during long counter shifts.
