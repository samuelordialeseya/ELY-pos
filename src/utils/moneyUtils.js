/**
 * Precision Financial & Scale Math Engine for ELY.pos v2.0
 * Eliminates IEEE-754 floating-point drift on centavos and scale weights.
 */

/**
 * Rounds any numeric value to exact 2-decimal Philippine Centavos (₱0.01).
 */
export function roundCentavos(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Rounds scale weight/quantity to 3 decimal places (nearest gram: 0.001 kg).
 */
export function roundWeight(qty) {
  const num = Number(qty);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.round((num + Number.EPSILON) * 1000) / 1000;
}

/**
 * Computes exact item subtotal from unit price and quantity.
 */
export function computeItemSubtotal(price, quantity) {
  const p = Number(price) || 0;
  const q = roundWeight(quantity);
  return roundCentavos(p * q);
}

/**
 * Computes exact total across an array of cart/order items in integer centavos
 * to prevent cumulative floating-point drift.
 */
export function computeCartTotal(items = []) {
  if (!Array.isArray(items) || items.length === 0) return 0;
  const totalCentavos = items.reduce((sumCents, item) => {
    const itemSub = item.subtotal !== undefined
      ? roundCentavos(item.subtotal)
      : computeItemSubtotal(item.price, item.quantity);
    return sumCents + Math.round(itemSub * 100);
  }, 0);
  return totalCentavos / 100;
}

/**
 * Determines if a product unit is measured by weight (kg/kilo) vs discrete count (pc, tali, pack).
 */
export function isWeightUnit(unit = "") {
  const normalized = String(unit || "").trim().toLowerCase();
  return normalized.includes("kg") || normalized.includes("kilo") || normalized === "g";
}

/**
 * Backward-compatible helper to classify whether an order is a Delivery or Walk-in POS sale.
 * Handles historical v1 orders where order_type was hardcoded to 'pos' despite having a delivery address.
 */
export function isDeliveryOrder(order) {
  if (!order) return false;
  if (order.order_type === "delivery") return true;
  const addr = String(order.address || "").trim().toLowerCase();
  return Boolean(addr && addr !== "walk-in" && addr !== "walk in" && addr !== "in-store");
}
