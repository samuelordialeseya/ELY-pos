/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { onSnapshot, setDoc } from "firebase/firestore";
import { useAuth } from "./AuthContext";
import { DEMO_PRODUCTS, getDemoOrders, getLocalDateKey } from "../data/demoSeed";
import { DEFAULT_RECEIPT_CONFIG } from "../data/receiptConfig";
import { getStorePaths } from "../services/dbPaths";
import {
  listenToActiveOrders,
  fetchOrdersByDate,
  fetchOrdersByDateRange,
  deleteOrderRecord,
  updateOrderStatus
} from "../services/orderService";
import {
  listenToProducts,
  addProductRecord,
  updateProductRecord,
  deleteProductRecord
} from "../services/productService";
import { computeAggregatesFromOrders } from "../services/statsService";
import { getOrderDateKey } from "../utils/dateUtils";

const StoreContext = createContext(null);

export function StoreProvider({ children, showToast }) {
  const { user, isDemoMode, isOwnerAccount } = useAuth();

  // Separate demo vs cloud state so switching modes never requires synchronous setState in useEffect
  const [demoFruits, setDemoFruits] = useState(() => DEMO_PRODUCTS);
  const [demoOrders, setDemoOrders] = useState(() => getDemoOrders());
  const [demoCustomerCount, setDemoCustomerCount] = useState(5);

  const [cloudFruits, setCloudFruits] = useState([]);
  const [cloudOrders, setCloudOrders] = useState([]);
  const [pastDateOrders, setPastDateOrders] = useState([]);
  const [rangeOrders, setRangeOrders] = useState([]);
  const [cloudCustomerCount, setCloudCustomerCount] = useState(1);
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  // Filters & dates
  const [filterDate, setFilterDate] = useState(() => getLocalDateKey(new Date()));
  const [dashboardRange, setDashboardRange] = useState("today");
  const [dashboardCustomDate, setDashboardCustomDate] = useState(() => getLocalDateKey(new Date()));

  // Store identity & receipt branding
  const [customStoreName, setCustomStoreName] = useState(() => {
    const saved = localStorage.getItem("elypos_store_name");
    return saved && saved !== "ElyPOS" ? saved : "";
  });

  const storeName = useMemo(() => {
    if (isDemoMode) return "Fresh Express Demo";
    if (customStoreName) return customStoreName;
    if (user?.displayName) return user.displayName;
    return isOwnerAccount ? "Ely's Store" : "My Store";
  }, [isDemoMode, customStoreName, user, isOwnerAccount]);

  const setStoreName = useCallback((newName) => {
    setCustomStoreName(newName);
  }, []);

  const [receiptConfig, setReceiptConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("elypos_receipt_config");
      if (saved) return { ...DEFAULT_RECEIPT_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Error reading receipt config:", e);
    }
    return DEFAULT_RECEIPT_CONFIG;
  });

  // Real-time Firestore listeners (Cloud mode only)
  useEffect(() => {
    if (isDemoMode || !user) {
      return;
    }

    const { settingsDocRef } = getStorePaths(user, isOwnerAccount);

    const unsubProducts = listenToProducts(
      user,
      isOwnerAccount,
      (list) => setCloudFruits(list),
      (err) => console.error("Products error:", err)
    );

    const unsubOrders = listenToActiveOrders(
      user,
      isOwnerAccount,
      (list) => setCloudOrders(list),
      (err) => console.error("Active orders error:", err)
    );

    const unsubSettings = onSnapshot(
      settingsDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCloudCustomerCount(data.customer_count || 1);
          if (data.store_name) {
            setCustomStoreName(data.store_name);
            localStorage.setItem("elypos_store_name", data.store_name);
          }
          if (data.receipt_config) {
            const merged = { ...DEFAULT_RECEIPT_CONFIG, ...data.receipt_config };
            setReceiptConfig(merged);
            localStorage.setItem("elypos_receipt_config", JSON.stringify(merged));
          }
          if (data.setup_done === true) {
            localStorage.setItem(`elypos_setup_done_${user.uid}`, "true");
            localStorage.setItem("elypos_setup_done", "true");
          } else if (data.setup_done === false) {
            if (localStorage.getItem(`elypos_setup_done_${user.uid}`) !== "true") {
              setShowSetupWizard(true);
            }
          }
        } else if (user?.displayName) {
          setCustomStoreName(user.displayName);
          localStorage.setItem("elypos_store_name", user.displayName);
        }
      },
      (err) => console.error("Settings error:", err)
    );

    return () => {
      unsubProducts();
      unsubOrders();
      unsubSettings();
    };
  }, [isDemoMode, user, isOwnerAccount]);

  const fruits = isDemoMode ? demoFruits : (user ? cloudFruits : []);
  const activeOrders = useMemo(
    () => (isDemoMode ? demoOrders : (user ? cloudOrders : [])),
    [isDemoMode, demoOrders, user, cloudOrders]
  );
  const customerCount = isDemoMode ? demoCustomerCount : cloudCustomerCount;
  const setCustomerCount = isDemoMode ? setDemoCustomerCount : setCloudCustomerCount;
  const setActiveOrders = isDemoMode ? setDemoOrders : setCloudOrders;

  const todayKey = getLocalDateKey(new Date());

  // Fetch past-date orders asynchronously when filterDate is not today
  useEffect(() => {
    if (isDemoMode || !user || filterDate === todayKey) return;
    let active = true;
    fetchOrdersByDate(user, isOwnerAccount, filterDate).then((fetched) => {
      if (active) setPastDateOrders(fetched);
    });
    return () => {
      active = false;
    };
  }, [filterDate, activeOrders, user, isOwnerAccount, isDemoMode, todayKey]);

  // Derived historyOrders (0 synchronous effect cascades!)
  const historyOrders = useMemo(() => {
    if (isDemoMode || filterDate === todayKey) {
      return activeOrders.filter(
        (o) => (o.raw_date || getOrderDateKey(o)) === filterDate
      );
    }
    return pastDateOrders;
  }, [isDemoMode, filterDate, todayKey, activeOrders, pastDateOrders]);

  // Fetch full range orders when 7-Days or This Month is selected (Fixes v1 50-order cap bug)
  useEffect(() => {
    if (isDemoMode || !user) return;
    if (dashboardRange !== "week" && dashboardRange !== "month") return;

    const endDate = getLocalDateKey(new Date());
    const startDate = (() => {
      const d = new Date();
      if (dashboardRange === "week") {
        d.setDate(d.getDate() - 6);
      } else {
        d.setDate(1);
      }
      return getLocalDateKey(d);
    })();

    let active = true;
    fetchOrdersByDateRange(user, isOwnerAccount, startDate, endDate).then((fetched) => {
      if (active) setRangeOrders(fetched);
    });
    return () => {
      active = false;
    };
  }, [dashboardRange, activeOrders, user, isOwnerAccount, isDemoMode]);

  // Compute Dashboard Aggregates
  const dashAggregates = useMemo(() => {
    const dashToday = getLocalDateKey(new Date());
    const dashWeekStart = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      return getLocalDateKey(d);
    })();
    const dashMonthStart = (() => {
      const d = new Date();
      d.setDate(1);
      return getLocalDateKey(d);
    })();

    let targetOrders = [];
    if (dashboardRange === "today") {
      targetOrders = activeOrders.filter(
        (o) => (o.raw_date || getOrderDateKey(o)) === dashToday
      );
    } else if (dashboardRange === "week") {
      const source = isDemoMode || rangeOrders.length === 0 ? activeOrders : rangeOrders;
      targetOrders = source.filter((o) => {
        const d = o.raw_date || getOrderDateKey(o);
        return d >= dashWeekStart && d <= dashToday;
      });
    } else if (dashboardRange === "month") {
      const source = isDemoMode || rangeOrders.length === 0 ? activeOrders : rangeOrders;
      targetOrders = source.filter((o) => {
        const d = o.raw_date || getOrderDateKey(o);
        return d >= dashMonthStart && d <= dashToday;
      });
    } else if (dashboardRange === "custom") {
      targetOrders = (filterDate === dashboardCustomDate ? historyOrders : activeOrders).filter(
        (o) => {
          const d = o.raw_date || getOrderDateKey(o);
          return d === dashboardCustomDate;
        }
      );
    }

    return computeAggregatesFromOrders(targetOrders);
  }, [dashboardRange, dashboardCustomDate, activeOrders, historyOrders, rangeOrders, filterDate, isDemoMode]);

  // --- Product Catalog CRUD ---
  const handleAddProduct = useCallback(async (productData) => {
    if (isDemoMode) {
      const newProd = { id: `demo-prod-${Date.now()}`, ...productData };
      setDemoFruits((prev) => [...prev, newProd]);
      showToast("Added to Demo Catalog");
      return;
    }
    try {
      await addProductRecord(user, isOwnerAccount, productData);
      showToast("Added to Inventory");
    } catch (err) {
      showToast("Error: " + err.message);
    }
  }, [isDemoMode, user, isOwnerAccount, showToast]);

  const handleUpdateProduct = useCallback(async (id, updates) => {
    if (isDemoMode) {
      setDemoFruits((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
      showToast("Demo Product Updated");
      return;
    }
    try {
      await updateProductRecord(user, isOwnerAccount, id, updates);
      showToast("Updated!");
    } catch (err) {
      showToast("Error: " + err.message);
    }
  }, [isDemoMode, user, isOwnerAccount, showToast]);

  const handleDeleteProduct = useCallback(async (id) => {
    if (isDemoMode) {
      setDemoFruits((prev) => prev.filter((f) => f.id !== id));
      showToast("Demo Product Deleted");
      return;
    }
    try {
      await deleteProductRecord(user, isOwnerAccount, id);
      showToast("Deleted");
    } catch (err) {
      showToast("Error: " + err.message);
    }
  }, [isDemoMode, user, isOwnerAccount, showToast]);

  // --- Order History & Delivery Status ---
  const handleDeleteOrder = useCallback(async (orderId, rawDate, orderObj = null) => {
    if (isDemoMode) {
      setDemoOrders((prev) => prev.filter((o) => o.id !== orderId));
      showToast("Demo Order Deleted");
      return;
    }
    try {
      await deleteOrderRecord(user, isOwnerAccount, orderId, rawDate, orderObj);
      setPastDateOrders((prev) => prev.filter((o) => o.id !== orderId));
      showToast("Order Deleted");
    } catch (err) {
      showToast("Error: " + err.message);
    }
  }, [isDemoMode, user, isOwnerAccount, showToast]);

  const handleToggleDeliveryStatus = useCallback(async (orderId, currentStatus, rawDate) => {
    const newStatus = currentStatus === "Delivered" ? "Pending" : "Delivered";
    if (isDemoMode) {
      setDemoOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      showToast("Status Updated");
      return;
    }
    try {
      await updateOrderStatus(user, isOwnerAccount, orderId, newStatus, rawDate);
      setPastDateOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      showToast("Status Updated");
    } catch (err) {
      showToast("Error: " + err.message);
    }
  }, [isDemoMode, user, isOwnerAccount, showToast]);

  // --- Store Identity & Settings ---
  const updateStoreName = useCallback(async (newName) => {
    setCustomStoreName(newName);
    localStorage.setItem("elypos_store_name", newName);
    if (!isDemoMode && user) {
      const { settingsDocRef } = getStorePaths(user, isOwnerAccount);
      await setDoc(settingsDocRef, { store_name: newName }, { merge: true });
    }
  }, [isDemoMode, user, isOwnerAccount]);

  const updateReceiptConfig = useCallback(async (newConfig) => {
    const updated = { ...DEFAULT_RECEIPT_CONFIG, ...newConfig };
    setReceiptConfig(updated);
    localStorage.setItem("elypos_receipt_config", JSON.stringify(updated));
    if (!isDemoMode && user) {
      const { settingsDocRef } = getStorePaths(user, isOwnerAccount);
      await setDoc(settingsDocRef, { receipt_config: updated }, { merge: true });
    }
    showToast("Receipt Template Saved!");
  }, [isDemoMode, user, isOwnerAccount, showToast]);

  const resetStoreStateOnLogout = useCallback(() => {
    setCloudFruits([]);
    setCloudOrders([]);
    setPastDateOrders([]);
    setRangeOrders([]);
    setCustomStoreName("");
    localStorage.removeItem("elypos_store_name");
    setReceiptConfig(DEFAULT_RECEIPT_CONFIG);
    localStorage.removeItem("elypos_receipt_config");
  }, []);

  const value = {
    fruits,
    activeOrders,
    setActiveOrders,
    historyOrders,
    customerCount,
    setCustomerCount,
    storeName,
    setStoreName,
    receiptConfig,
    showSetupWizard,
    setShowSetupWizard,
    filterDate,
    setFilterDate,
    dashboardRange,
    setDashboardRange,
    dashboardCustomDate,
    setDashboardCustomDate,
    dashAggregates,
    handleAddProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleDeleteOrder,
    handleToggleDeliveryStatus,
    updateStoreName,
    updateReceiptConfig,
    resetStoreStateOnLogout
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}
