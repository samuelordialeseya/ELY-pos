import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  where, 
  getDocs, 
  onSnapshot, 
  doc, 
  writeBatch, 
  updateDoc, 
  increment 
} from "firebase/firestore";
import { db } from "../firebaseClient";
import { getStorePaths } from "./dbPaths";
import { prepareSaleStatsBatch, prepareRollbackStatsBatch } from "./statsService";

// In-memory cache for historical date lookups to avoid repeat Firestore reads
const historicalOrdersCache = new Map();

/**
 * Real-time listener for active POS transactions.
 * Limits to the latest 50 transactions to optimize memory on iPad WebKit and prevent read quotas exhaustion.
 */
export function listenToActiveOrders(user, isOwnerAccount, onData, onError) {
  if (!user) return () => {};
  const { ordersPath } = getStorePaths(user, isOwnerAccount);

  const qOrders = query(
    collection(db, ordersPath), 
    orderBy("created_at", "desc"), 
    limit(50)
  );

  return onSnapshot(qOrders, (snapshot) => {
    const list = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    onData(list);
  }, (err) => {
    console.error("Orders listener error:", err);
    if (onError) onError(err);
  });
}

/**
 * On-demand query for historical orders by specific calendar date (e.g. History view & Delivery Manifest).
 * Leverages in-memory cache + IndexedDB to minimize cloud reads.
 */
export async function fetchOrdersByDate(user, isOwnerAccount, dateKey, forceRefresh = false) {
  if (!user || !dateKey) return [];
  
  if (!forceRefresh && historicalOrdersCache.has(dateKey)) {
    return historicalOrdersCache.get(dateKey);
  }

  const { ordersPath } = getStorePaths(user, isOwnerAccount);
  try {
    const qByDate = query(
      collection(db, ordersPath),
      where("raw_date", "==", dateKey)
    );
    const snap = await getDocs(qByDate);
    const dateOrders = [];
    snap.forEach((d) => {
      dateOrders.push({ id: d.id, ...d.data() });
    });

    // Cache results for the session
    historicalOrdersCache.set(dateKey, dateOrders);
    return dateOrders;
  } catch (err) {
    console.error(`Failed to fetch orders for ${dateKey}:`, err);
    return [];
  }
}

/**
 * Atomically commits a completed transaction:
 * 1. Creates order document
 * 2. Increments global customer queue count
 * 3. Updates pre-aggregated daily stats
 */
export async function createOrderAtomic(user, isOwnerAccount, orderData) {
  const { ordersPath, settingsDocRef, statsPath } = getStorePaths(user, isOwnerAccount);
  const newOrderRef = doc(collection(db, ordersPath));
  const batch = writeBatch(db);

  // 1. Write Order Doc
  batch.set(newOrderRef, orderData);

  // 2. Increment customer queue number
  batch.set(settingsDocRef, { customer_count: increment(1) }, { merge: true });

  // 3. Pre-aggregate daily analytics
  const itemsCount = (orderData.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
  prepareSaleStatsBatch(batch, statsPath, orderData.raw_date, orderData.total, itemsCount);

  await batch.commit();

  // Invalidate any cached entries for this date so fresh data is visible
  historicalOrdersCache.delete(orderData.raw_date);

  return newOrderRef.id;
}

/**
 * Atomically rolls back a transaction when cashier taps "Undo":
 * 1. Deletes order document
 * 2. Decrements customer counter
 * 3. Reverses daily stats totals
 */
export async function undoOrderAtomic(user, isOwnerAccount, orderId, orderData) {
  const { ordersPath, settingsDocRef, statsPath } = getStorePaths(user, isOwnerAccount);
  const batch = writeBatch(db);

  // 1. Delete order doc
  batch.delete(doc(db, ordersPath, orderId));

  // 2. Decrement customer count
  batch.set(settingsDocRef, { customer_count: increment(-1) }, { merge: true });

  // 3. Roll back stats
  if (orderData && orderData.raw_date) {
    const itemsCount = (orderData.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
    prepareRollbackStatsBatch(batch, statsPath, orderData.raw_date, orderData.total, itemsCount);
    historicalOrdersCache.delete(orderData.raw_date);
  }

  await batch.commit();
}

/**
 * Permanently deletes an order from history.
 */
export async function deleteOrderRecord(user, isOwnerAccount, orderId, rawDate) {
  const { ordersPath } = getStorePaths(user, isOwnerAccount);
  const orderDocRef = doc(db, ordersPath, orderId);
  const batch = writeBatch(db);
  batch.delete(orderDocRef);
  await batch.commit();
  if (rawDate) {
    historicalOrdersCache.delete(rawDate);
  }
}

/**
 * Toggles an order's fulfillment / delivery status.
 */
export async function updateOrderStatus(user, isOwnerAccount, orderId, newStatus, rawDate) {
  const { ordersPath } = getStorePaths(user, isOwnerAccount);
  await updateDoc(doc(db, ordersPath, orderId), { status: newStatus });
  if (rawDate) {
    historicalOrdersCache.delete(rawDate);
  }
}
