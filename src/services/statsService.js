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

/**
 * Pre-aggregates daily POS transaction metrics into compact summary documents (daily_stats/{dateKey}).
 * This enables the Analytics Dashboard to load in milliseconds with 1-30 reads instead of querying
 * hundreds or thousands of raw customer order documents.
 */

export function prepareSaleStatsBatch(batch, statsPath, dateKey, totalAmount, itemsCount) {
  const statsDocRef = doc(db, statsPath, dateKey);
  batch.set(statsDocRef, {
    date: dateKey,
    revenue: increment(Number(totalAmount) || 0),
    orders_count: increment(1),
    items_sold: increment(Number(itemsCount) || 0),
    updated_at: serverTimestamp()
  }, { merge: true });
}

export function prepareRollbackStatsBatch(batch, statsPath, dateKey, totalAmount, itemsCount) {
  const statsDocRef = doc(db, statsPath, dateKey);
  batch.set(statsDocRef, {
    revenue: increment(-(Number(totalAmount) || 0)),
    orders_count: increment(-1),
    items_sold: increment(-(Number(itemsCount) || 0)),
    updated_at: serverTimestamp()
  }, { merge: true });
}

/**
 * Fetches pre-aggregated daily summaries across a date range.
 * Results are automatically cached in IndexedDB.
 */
export async function fetchStatsRange(user, isOwnerAccount, startDate, endDate) {
  if (!user) return [];
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
 * Computes dashboard aggregates directly from an array of orders.
 * Used for demo mode or as fallback when pre-aggregated daily docs don't exist yet.
 */
export function computeAggregatesFromOrders(orders) {
  const safeOrders = orders || [];
  const revenue = safeOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const txCount = safeOrders.length;
  const avg = txCount > 0 ? revenue / txCount : 0;
  const itemsSold = safeOrders.reduce((sum, o) => {
    return sum + (o.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
  }, 0);

  const itemMap = {};
  safeOrders.forEach(o => {
    (o.items || []).forEach(it => {
      const key = it.name || 'Unknown';
      if (!itemMap[key]) {
        itemMap[key] = { name: key, qty: 0, revenue: 0, unit: it.unit || 'units' };
      }
      itemMap[key].qty += (Number(it.quantity) || 0);
      itemMap[key].revenue += (Number(it.subtotal) || 0);
      if (it.unit) itemMap[key].unit = it.unit;
    });
  });

  const topSellers = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
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
    topSellers,
    maxSellerRev,
    recentOrders: sortedOrders.slice(0, 5)
  };
}
