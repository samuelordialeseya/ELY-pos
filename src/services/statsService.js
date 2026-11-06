import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  increment, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebaseClient";
import { getStorePaths } from "./dbPaths";
import { roundCentavos, roundWeight, isDeliveryOrder } from "../utils/moneyUtils";

/**
 * Pre-aggregates daily POS transaction metrics into compact summary documents (daily_stats/{dateKey}).
 * This enables the Analytics Dashboard to load in milliseconds with 1-30 reads instead of querying
 * hundreds or thousands of raw customer order documents.
 */

export function prepareSaleStatsBatch(batch, statsPath, dateKey, totalAmount, itemsCount) {
  if (!dateKey) return;
  const statsDocRef = doc(db, statsPath, dateKey);
  batch.set(statsDocRef, {
    date: dateKey,
    revenue: increment(roundCentavos(totalAmount)),
    orders_count: increment(1),
    items_sold: increment(roundWeight(itemsCount)),
    updated_at: serverTimestamp()
  }, { merge: true });
}

export function prepareRollbackStatsBatch(batch, statsPath, dateKey, totalAmount, itemsCount) {
  if (!dateKey) return;
  const statsDocRef = doc(db, statsPath, dateKey);
  batch.set(statsDocRef, {
    revenue: increment(-roundCentavos(totalAmount)),
    orders_count: increment(-1),
    items_sold: increment(-roundWeight(itemsCount)),
    updated_at: serverTimestamp()
  }, { merge: true });
}

/**
 * Fetches pre-aggregated daily summaries across a date range.
 * Results are automatically cached in IndexedDB.
 */
export async function fetchStatsRange(user, isOwnerAccount, startDate, endDate) {
  if (!user || !startDate || !endDate) return [];
  const { statsPath } = getStorePaths(user, isOwnerAccount);
  
  try {
    const qStats = query(
      collection(db, statsPath),
      where("date", ">=", startDate),
      where("date", "<=", endDate)
    );
    const snap = await getDocs(qStats);
    const stats = [];
    snap.forEach(d => stats.push({ id: d.id, ...d.data() }));
    return stats;
  } catch (err) {
    console.warn("fetchStatsRange note:", err.message);
    return [];
  }
}

/**
 * Computes dashboard aggregates directly from an array of orders with centavo-exact math.
 */
export function computeAggregatesFromOrders(orders) {
  const safeOrders = Array.isArray(orders) ? orders : [];
  const revenue = roundCentavos(
    safeOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
  );
  const txCount = safeOrders.length;
  const avg = txCount > 0 ? roundCentavos(revenue / txCount) : 0;
  const itemsSold = roundWeight(
    safeOrders.reduce((sum, o) => {
      return sum + (o.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
    }, 0)
  );

  let deliveryCount = 0;
  let walkInCount = 0;
  let totalProductLines = 0;

  const itemMap = {};
  safeOrders.forEach(o => {
    if (isDeliveryOrder(o)) {
      deliveryCount += 1;
    } else {
      walkInCount += 1;
    }

    const items = o.items || [];
    totalProductLines += items.length;

    items.forEach(it => {
      const key = it.name || "Unknown";
      if (!itemMap[key]) {
        itemMap[key] = { name: key, qty: 0, revenue: 0, unit: it.unit || "units" };
      }
      itemMap[key].qty = roundWeight(itemMap[key].qty + (Number(it.quantity) || 0));
      itemMap[key].revenue = roundCentavos(itemMap[key].revenue + (Number(it.subtotal) || 0));
      if (it.unit) itemMap[key].unit = it.unit;
    });
  });

  const topSellers = Object.values(itemMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  const maxSellerRev = topSellers.length > 0 ? topSellers[0].revenue : 1;

  const sortedOrders = [...safeOrders].sort((a, b) => {
    const tA = new Date(a.created_at || a.raw_date || 0).getTime();
    const tB = new Date(b.created_at || b.raw_date || 0).getTime();
    return tB - tA;
  });

  return {
    revenue,
    txCount,
    avg,
    itemsSold,
    deliveryCount,
    walkInCount,
    totalProductLines,
    topSellers,
    maxSellerRev,
    recentOrders: sortedOrders.slice(0, 5)
  };
}
