/* eslint-disable react-hooks/exhaustive-deps */
import "./App.css";
import React, { useState, useEffect, useRef, useMemo } from "react";
import html2canvas from "html2canvas";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { flushSync } from "react-dom";
import { onSnapshot, setDoc } from "firebase/firestore";

import { 
  ArrowCounterClockwise, 
  X, 
  CheckCircle 
} from "@phosphor-icons/react";

import { useAuth } from "./context/AuthContext";
import { auth } from "./firebaseClient";
import LandingPage from "./components/LandingPage";
import AuthPage from "./components/AuthPage";
import SetupWizard from "./components/SetupWizard";
import SettingsPage from "./components/SettingsPage";

// Modular feature components
import PosSidebar from "./components/navigation/PosSidebar";
import PosHeader from "./components/navigation/PosHeader";
import ProductCatalog from "./components/pos/ProductCatalog";
import CartSidebar from "./components/pos/CartSidebar";
import WeightKeypadModal from "./components/pos/WeightKeypadModal";
import AnalyticsDashboard from "./components/dashboard/AnalyticsDashboard";
import InventoryManagement from "./components/inventory/InventoryManagement";
import OrderHistoryView from "./components/history/OrderHistoryView";
import DeliveryManifestView from "./components/manifest/DeliveryManifestView";
import InstantReceiptModal from "./components/modals/InstantReceiptModal";

// Data and services
import { DEMO_PRODUCTS, getDemoOrders, getLocalDateKey } from "./data/demoSeed";
import { DEFAULT_RECEIPT_CONFIG } from "./data/receiptConfig";
import { getStorePaths } from "./services/dbPaths";
import { 
  listenToActiveOrders, 
  fetchOrdersByDate, 
  createOrderAtomic, 
  undoOrderAtomic, 
  deleteOrderRecord, 
  updateOrderStatus 
} from "./services/orderService";
import { 
  listenToProducts, 
  addProductRecord, 
  updateProductRecord, 
  deleteProductRecord 
} from "./services/productService";
import { computeAggregatesFromOrders } from "./services/statsService";
import { exportCanvasImage } from "./utils/exportImage";
import { getOrderDateKey } from "./utils/dateUtils";

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).substring(2, 15);
};

export default function App() {
  const { 
    user, 
    isDemoMode, 
    isOwnerAccount, 
    loading: authLoading, 
    logoutUser 
  } = useAuth();

  // Screen routing: 'landing' | 'auth' | 'app'
  const [screen, setScreen] = useState(() => {
    const hasAuth = Boolean(auth.currentUser || localStorage.getItem("elypos_is_demo") === "true");
    if (window.location.hash === "#app") return hasAuth ? "app" : "landing";
    if (window.location.hash === "#auth" || window.location.hash === "#login") return hasAuth ? "app" : "auth";
    return "landing";
  });

  // Keep screen state synchronized with window hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const isAuthenticated = Boolean(user || auth.currentUser || isDemoMode);
      if (hash === "#app") {
        if (isAuthenticated) setScreen("app");
        else {
          window.location.hash = "#auth";
          setScreen("auth");
        }
      } else if (hash === "#auth" || hash === "#login") {
        if (isAuthenticated) {
          window.location.hash = "#app";
          setScreen("app");
        } else {
          setScreen("auth");
        }
      } else if (hash === "#landing" || hash === "") {
        setScreen("landing");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [user, isDemoMode]);

  // Auth state redirects
  useEffect(() => {
    const isAuthenticated = Boolean(user || auth.currentUser || isDemoMode);
    if (!authLoading && screen === "app" && !isAuthenticated) {
      setScreen("landing");
      window.location.hash = "#landing";
    }
  }, [authLoading, user, isDemoMode, screen]);

  useEffect(() => {
    const isAuthenticated = Boolean(user || auth.currentUser);
    if (!authLoading && isAuthenticated && (screen === "auth" || (screen === "landing" && window.location.hash !== "#landing"))) {
      setScreen("app");
      window.location.hash = "#app";
    }
  }, [authLoading, user, screen]);

  // Active terminal view: 'dashboard' | 'pos' | 'inventory' | 'orders' | 'delivery' | 'settings'
  const [view, setView] = useState("dashboard");
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  useEffect(() => {
    if (screen === "app" && view === "settings") {
      setView("dashboard");
    }
  }, [screen]);

  // Cloud & Domain Data States
  const [fruits, setFruits] = useState(() => isDemoMode ? DEMO_PRODUCTS : []);
  const [activeOrders, setActiveOrders] = useState(() => isDemoMode ? getDemoOrders() : []);
  const [historyOrders, setHistoryOrders] = useState(() => isDemoMode ? getDemoOrders() : []);
  const [customerCount, setCustomerCount] = useState(() => isDemoMode ? 5 : 1);

  // Cart & POS input states
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState("");
  const [address, setAddress] = useState("");
  const [weights, setWeights] = useState({});
  const [weighInProduct, setWeighInProduct] = useState(null);
  const [modalQtyStr, setModalQtyStr] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Filters & selections
  const [posSearchTerm, setPosSearchTerm] = useState("");
  const [posSelectedCategory, setPosSelectedCategory] = useState("All");
  const [invSearchTerm, setInvSearchTerm] = useState("");
  const [invSelectedCategory, setInvSelectedCategory] = useState("All");
  const [filterDate, setFilterDate] = useState(() => getLocalDateKey(new Date()));
  const [historySearch, setHistorySearch] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [dashboardRange, setDashboardRange] = useState("today");
  const [dashboardCustomDate, setDashboardCustomDate] = useState(() => getLocalDateKey(new Date()));

  // UI feedback & modals
  const [toast, setToast] = useState("");
  const [undoBanner, setUndoBanner] = useState(null);
  const undoTimerRef = useRef(null);
  const [completedReceiptModal, setCompletedReceiptModal] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  // Store branding & receipts
  const [storeName, setStoreName] = useState(() => {
    if (isDemoMode) return "Fresh Express Demo";
    const saved = localStorage.getItem("elypos_store_name");
    if (saved && saved !== "ElyPOS") return saved;
    if (user?.displayName) return user.displayName;
    return isOwnerAccount ? "Ely's Store" : "My Store";
  });

  const [receiptConfig, setReceiptConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("elypos_receipt_config");
      if (saved) return { ...DEFAULT_RECEIPT_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Error reading receipt config:", e);
    }
    return DEFAULT_RECEIPT_CONFIG;
  });

  // Sync store name
  useEffect(() => {
    if (user && !isDemoMode) {
      const saved = localStorage.getItem("elypos_store_name");
      if (saved && saved !== "ElyPOS") {
        setStoreName(saved);
      } else if (user.displayName) {
        setStoreName(user.displayName);
        localStorage.setItem("elypos_store_name", user.displayName);
      }
    }
  }, [user, isDemoMode]);

  // Clean undo timer
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  // --- REAL-TIME DATA LISTENERS ---
  useEffect(() => {
    if (isDemoMode) {
      setFruits(DEMO_PRODUCTS);
      setActiveOrders(getDemoOrders());
      setCustomerCount(5);
      setStoreName("Fresh Express Demo");
      return;
    }

    if (!user) {
      setFruits([]);
      setActiveOrders([]);
      return;
    }

    const { settingsDocRef } = getStorePaths(user, isOwnerAccount);

    // 1. Listen to Products catalog
    const unsubProducts = listenToProducts(user, isOwnerAccount, (list) => {
      setFruits(list);
    }, (err) => console.error("Products error:", err));

    // 2. Listen to Active Recent Orders (Capped at 50, low-read footprint)
    const unsubOrders = listenToActiveOrders(user, isOwnerAccount, (list) => {
      setActiveOrders(list);
    }, (err) => console.error("Active orders error:", err));

    // 3. Listen to Settings document
    const unsubSettings = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCustomerCount(data.customer_count || 1);
        if (data.store_name) {
          setStoreName(data.store_name);
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
        setStoreName(user.displayName);
        localStorage.setItem("elypos_store_name", user.displayName);
      }
    }, (err) => console.error("Settings error:", err));

    return () => {
      unsubProducts();
      unsubOrders();
      unsubSettings();
    };
  }, [isDemoMode, user, isOwnerAccount]);

  // --- ON-DEMAND HISTORICAL ORDERS SYNC ---
  // When the user views History or Manifest, load specific date on demand and cache in memory
  const todayKey = getLocalDateKey(new Date());

  useEffect(() => {
    if (isDemoMode) {
      const demoList = getDemoOrders().filter(o => getOrderDateKey(o) === filterDate || o.raw_date === filterDate);
      setHistoryOrders(demoList);
      return;
    }
    if (!user) return;

    if (filterDate === todayKey) {
      // For today, use real-time activeOrders stream (0 extra reads)
      const todays = activeOrders.filter(o => (o.raw_date || getOrderDateKey(o)) === filterDate);
      setHistoryOrders(todays);
    } else {
      // For past dates, query and cache on demand
      fetchOrdersByDate(user, isOwnerAccount, filterDate).then((fetched) => {
        setHistoryOrders(fetched);
      });
    }
  }, [filterDate, activeOrders, user, isOwnerAccount, isDemoMode, todayKey]);

  // --- DASHBOARD AGGREGATES ---
  const dashAggregates = useMemo(() => {
    const dashToday = getLocalDateKey(new Date());
    const dashWeekStart = (() => { const d = new Date(); d.setDate(d.getDate() - 6); return getLocalDateKey(d); })();
    const dashMonthStart = (() => { const d = new Date(); d.setDate(1); return getLocalDateKey(d); })();

    let targetOrders = [];
    if (dashboardRange === "today") {
      targetOrders = activeOrders.filter(o => (o.raw_date || getOrderDateKey(o)) === dashToday);
    } else if (dashboardRange === "week") {
      targetOrders = activeOrders.filter(o => {
        const d = o.raw_date || getOrderDateKey(o);
        return d >= dashWeekStart && d <= dashToday;
      });
    } else if (dashboardRange === "month") {
      targetOrders = activeOrders.filter(o => {
        const d = o.raw_date || getOrderDateKey(o);
        return d >= dashMonthStart && d <= dashToday;
      });
    } else if (dashboardRange === "custom") {
      targetOrders = (filterDate === dashboardCustomDate ? historyOrders : activeOrders).filter(o => {
        const d = o.raw_date || getOrderDateKey(o);
        return d === dashboardCustomDate;
      });
    }

    return computeAggregatesFromOrders(targetOrders);
  }, [dashboardRange, dashboardCustomDate, activeOrders, historyOrders, filterDate]);

  // --- WEIGH-IN & CART ACTIONS ---
  const openWeighInModal = (product) => {
    setWeighInProduct(product);
    setModalQtyStr("");
  };

  const closeWeighInModal = () => {
    setWeighInProduct(null);
  };

  const handleConfirmWeighIn = () => {
    if (!weighInProduct) return;
    const parsed = parseFloat(modalQtyStr);
    if (!parsed || parsed <= 0) {
      showToast("Please enter a valid quantity or weight");
      return;
    }
    addToCart(weighInProduct, parsed);
    closeWeighInModal();
  };

  const addToCart = (product, customQty = null) => {
    const rawVal = customQty !== null ? customQty : weights[product.id];
    const qty = parseFloat(rawVal) || 0;
    if (!qty || qty <= 0) return showToast("Enter weight or quantity");

    const roundedQty = Math.round(qty * 1000) / 1000;
    const item = {
      cartId: generateId(),
      name: product.name,
      price: product.price,
      quantity: roundedQty,
      unit: product.unit,
      subtotal: Math.round(product.price * roundedQty * 100) / 100,
      special_flag: product.special_flag || ""
    };

    setCart(prev => [...prev, item]);
    setWeights(prev => ({ ...prev, [product.id]: 0 }));
    showToast(`Added ${roundedQty} ${product.unit} ${product.name}`);
  };

  const handleRemoveCartItem = (cartId) => {
    setCart(prev => prev.filter(c => c.cartId !== cartId));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (!window.confirm("Are you sure you want to clear all items in the current cart?")) return;
    setCart([]);
    setWeights({});
    showToast("Cart cleared");
  };

  // --- ATOMIC CHECKOUT & UNDO ---
  const completeOrder = async () => {
    if (isCheckingOut) return;
    if (cart.length === 0) return showToast("Cart is empty!");

    setIsCheckingOut(true);
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    const now = new Date();
    const rawDate = getLocalDateKey(now);
    const newOrder = {
      customer_name: customer.trim() || `Customer #${customerCount}`,
      address: address.trim() || "Walk-in",
      status: "Pending",
      items: cart,
      total: cart.reduce((acc, i) => acc + (i.subtotal || 0), 0),
      created_at: now.toISOString(),
      raw_date: rawDate,
      display_date: now.toLocaleDateString(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      order_type: 'pos'
    };

    const cartSnapshot = [...cart];
    const customerSnapshot = customer;
    const addressSnapshot = address;
    const weightsSnapshot = { ...weights };

    try {
      let createdId = "";
      if (isDemoMode) {
        createdId = `demo-order-${Date.now()}`;
        const demoOrd = { id: createdId, ...newOrder };
        setActiveOrders(prev => [demoOrd, ...prev]);
        setCustomerCount(prev => prev + 1);
        setCart([]); setCustomer(""); setAddress(""); setWeights({});
        setCompletedReceiptModal(demoOrd);
      } else {
        createdId = await createOrderAtomic(user, isOwnerAccount, newOrder);
        setCart([]); setCustomer(""); setAddress(""); setWeights({});
        setCompletedReceiptModal({ id: createdId, ...newOrder });
      }

      setUndoBanner({
        id: createdId,
        customerName: newOrder.customer_name,
        total: newOrder.total,
        raw_date: rawDate,
        items: cartSnapshot,
        customer: customerSnapshot,
        address: addressSnapshot,
        weights: weightsSnapshot
      });

      showToast("Transaction Saved!");
    } catch (orderError) {
      showToast("Error: " + orderError.message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleUndoOrder = async (orderId) => {
    const snapshot = undoBanner;
    setUndoBanner(null);
    setCompletedReceiptModal(null);

    try {
      if (isDemoMode) {
        setActiveOrders(prev => prev.filter(o => o.id !== orderId));
        setCustomerCount(prev => Math.max(1, prev - 1));
      } else {
        await undoOrderAtomic(user, isOwnerAccount, orderId, snapshot);
      }

      if (snapshot && snapshot.items) {
        setCart(snapshot.items);
        setCustomer(snapshot.customer || "");
        setAddress(snapshot.address || "");
        setWeights(snapshot.weights || {});
      }
      showToast("Order Undone · Cart Restored");
    } catch (err) {
      showToast("Failed to undo order: " + err.message);
    }
  };

  const handleDeleteOrder = async (orderId, rawDate) => {
    if (!window.confirm("Delete this order record permanently?")) return;
    if (isDemoMode) {
      setActiveOrders(prev => prev.filter(o => o.id !== orderId));
      setHistoryOrders(prev => prev.filter(o => o.id !== orderId));
      showToast("Demo Order Deleted");
      return;
    }
    try {
      await deleteOrderRecord(user, isOwnerAccount, orderId, rawDate);
      showToast("Order Deleted");
    } catch (err) {
      showToast("Error: " + err.message);
    }
  };

  const handleToggleDeliveryStatus = async (orderId, currentStatus, rawDate) => {
    const newStatus = currentStatus === "Delivered" ? "Pending" : "Delivered";
    if (isDemoMode) {
      setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      setHistoryOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      showToast("Status Updated");
      return;
    }
    try {
      await updateOrderStatus(user, isOwnerAccount, orderId, newStatus, rawDate);
      showToast("Status Updated");
    } catch (err) {
      showToast("Error: " + err.message);
    }
  };

  // --- PRODUCT CATALOG ACTIONS ---
  const handleAddProduct = async (productData) => {
    if (isDemoMode) {
      const newProd = { id: `demo-prod-${Date.now()}`, ...productData };
      setFruits(prev => [...prev, newProd]);
      showToast("Added to Demo Catalog");
      return;
    }
    try {
      await addProductRecord(user, isOwnerAccount, productData);
      showToast("Added to Inventory");
    } catch (err) {
      showToast("Error: " + err.message);
    }
  };

  const handleUpdateProduct = async (id, updates) => {
    if (isDemoMode) {
      setFruits(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
      showToast("Demo Product Updated");
      return;
    }
    try {
      await updateProductRecord(user, isOwnerAccount, id, updates);
      showToast("Updated!");
    } catch (err) {
      showToast("Error: " + err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    if (isDemoMode) {
      setFruits(prev => prev.filter(f => f.id !== id));
      showToast("Demo Product Deleted");
      return;
    }
    try {
      await deleteProductRecord(user, isOwnerAccount, id);
      showToast("Deleted");
    } catch (err) {
      showToast("Error: " + err.message);
    }
  };

  // --- EXPORT & DOWNLOAD CAPTURES ---
  const captureManifest = async () => {
    const element = document.getElementById("manifest-area-capture");
    if (!element) return;
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true
      });
      await exportCanvasImage(
        canvas,
        `Delivery_List_${filterDate}.png`,
        (msg) => showToast(msg || "Manifest Saved"),
        (err) => showToast("Save failed: " + err)
      );
    } catch (err) {
      showToast("Manifest save failed: " + err.message);
    }
  };

  const downloadReceipt = async (orderId) => {
    const element = document.getElementById(`receipt-${orderId}`);
    if (!element) return;
    const actions = element.querySelector('.no-print');
    if (actions) actions.style.display = 'none';

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true
      });
      await exportCanvasImage(
        canvas,
        `Receipt_${orderId}.png`,
        (msg) => showToast(msg || "Receipt Saved"),
        (err) => showToast("Save failed: " + err)
      );
    } catch (err) {
      showToast("Receipt save failed: " + err.message);
    } finally {
      if (actions) actions.style.display = 'flex';
    }
  };

  // --- SPOTLIGHT TOURS ---
  const startTour = (targetView = null) => {
    const runDriver = (activeView) => {
      let steps = [];
      if (activeView === "pos") {
        steps = [
          { element: '.product-grid', popover: { title: '1. Product Catalog', description: 'Tap produce items to select them. Items support both per-kg weight scale pricing and per-piece counts.', side: "right", align: 'start' } },
          { element: '.weight-selector', popover: { title: '2. Scale Weight Input', description: 'Enter the weight from your digital scale (e.g., 0.85 kg or 2 pcs) and tap Add.', side: "bottom", align: 'start' } },
          { element: '.bill-sidebar', popover: { title: '3. Cart & Customer Info', description: 'Current order items calculate live. Type customer name or delivery address here.', side: "left", align: 'start' } },
          { element: '.btn-checkout', popover: { title: '4. Complete Transaction', description: 'Click to record the sale, increment customer count, and generate a printable digital receipt.', side: "top", align: 'center' } },
          { element: '.nav-links', popover: { title: '5. POS Navigation', description: 'Quickly switch between Register, Analytics Dashboard, Inventory Catalog, Receipts History, Delivery Sheets, and Settings.', side: "right", align: 'start' } }
        ];
      } else if (activeView === "dashboard") {
        steps = [
          { element: '.nav-links', popover: { title: 'Navigation', description: 'Switch between Dashboard, POS, Inventory, History, Delivery, and Settings here.', side: "right", align: 'start' } },
          { element: '.dash-range-btns', popover: { title: 'Date Filter', description: 'Select the time period you want to analyze.', side: "bottom", align: 'start' } },
          { element: '.dash-metric-grid', popover: { title: 'Key Metrics', description: 'Get a quick overview of your total revenue, transaction counts, and average order values.', side: "bottom", align: 'start' } },
          { element: '.dash-panels', popover: { title: 'Deep Insights', description: 'See your top selling products and a list of the most recent transactions.', side: "top", align: 'start' } },
        ];
      } else if (activeView === "inventory") {
        steps = [
          { element: '.inv-search-wrapper', popover: { title: 'Search Inventory', description: 'Quickly find an item to edit or delete.', side: "bottom", align: 'start' } },
          { element: '.inv-form-card', popover: { title: 'Add New Item', description: 'Fill in the details to add a completely new product to your catalog.', side: "bottom", align: 'start' } },
          { element: '.inv-table', popover: { title: 'Product List', description: 'View, edit, or delete existing products. Changes here will reflect immediately on the POS.', side: "top", align: 'start' } },
        ];
      } else if (activeView === "orders") {
        steps = [
          { element: '.orders-controls', popover: { title: 'History Filters', description: 'Search for specific customers or select a date to review past orders.', side: "bottom", align: 'start' } },
          { element: '.history-card', popover: { title: 'Digital Receipts', description: 'View detailed receipts for each order. You can download them or delete records if a mistake was made.', side: "top", align: 'start' } },
        ];
      } else if (activeView === "delivery") {
        steps = [
          { element: '.delivery-step-select', popover: { title: 'Pending Orders', description: 'Select the orders you want to include in today\'s delivery manifest.', side: "right", align: 'start' } },
          { element: '.manifest-sheet', popover: { title: 'Rider Manifest', description: 'A beautifully formatted, print-ready manifest will be generated here based on your selection.', side: "left", align: 'start' } },
        ];
      } else if (activeView === "settings") {
        steps = [
          { element: '.settings-page', popover: { title: 'Store Settings', description: 'Customize your store name, type, and account settings here.', side: "top", align: "start" } }
        ];
      }

      const activeSteps = steps.filter(step => {
        if (typeof step.element === 'string') {
          const el = document.querySelector(step.element);
          return el !== null && el.getBoundingClientRect().width > 0;
        }
        return true;
      });

      if (activeSteps.length === 0) {
        showToast("Spotlight tour ready on current screen!");
        return;
      }

      const tourInstance = driver({
        showProgress: true,
        animate: true,
        steps: activeSteps,
        popoverClass: 'driverjs-theme'
      });
      tourInstance.drive();
    };

    if (targetView && targetView !== view) {
      setView(targetView);
      setTimeout(() => runDriver(targetView), 250);
    } else {
      runDriver(view);
    }
  };

  const startFullSiteTour = () => {
    setView("dashboard");
    setTimeout(() => {
      const viewSwitches = { 1: "dashboard", 3: "pos", 7: "inventory", 8: "orders", 9: "delivery", 11: "settings" };
      const rawSteps = [
        { element: '.sidebar', popover: { title: '1. Navigation', description: 'Welcome. These 6 sections are your entire POS terminal.', side: 'right', align: 'start' } },
        { element: '.dash-metric-grid', popover: { title: '2. Daily Metrics', description: 'Your daily revenue, transaction count, and averages live here.', side: 'bottom', align: 'start' } },
        { element: '.dash-panels', popover: { title: '3. Store Insights', description: 'Top-selling products and recent orders at a glance.', side: 'top', align: 'start' } },
        { element: '.product-grid', popover: { title: '4. Product Catalog', description: 'Tap any item to start ringing it up.', side: 'right', align: 'start' } },
        { element: '.bill-sidebar', popover: { title: '5. Live Cart', description: 'Your current order builds here in real time.', side: 'left', align: 'start' } },
        { element: '.btn-checkout', popover: { title: '6. Checkout', description: 'Complete Transaction saves the sale and generates a receipt.', side: 'top', align: 'center' } },
        { element: '.inv-form-card', popover: { title: '7. Inventory Management', description: 'Add and manage your entire product catalog here.', side: 'bottom', align: 'start' } },
        { element: '.orders-controls', popover: { title: '8. Transaction History', description: 'Filter past transactions by date or customer name.', side: 'bottom', align: 'start' } },
        { element: '.delivery-step-select', popover: { title: '9. Delivery Planning', description: 'Select today\'s delivery orders to build a manifest.', side: 'right', align: 'start' } },
        { element: '.manifest-sheet', popover: { title: '10. Rider Manifest', description: 'Your rider sheet generates automatically — download as image.', side: 'left', align: 'start' } },
        { element: '.settings-page', popover: { title: '11. Store Settings', description: 'Customize your store name, type, and account settings here.', side: 'top', align: 'start' } }
      ];

      const tour = driver({
        showProgress: true,
        animate: true,
        steps: rawSteps,
        popoverClass: 'driverjs-theme',
        onDestroyed: () => {
          setView("dashboard");
        },
        onHighlightStarted: (el, step, { state, driver: dInstance }) => {
          if (viewSwitches[state.activeIndex] !== undefined) {
            flushSync(() => {
              setView(viewSwitches[state.activeIndex]);
            });
            if (dInstance && dInstance.refresh) {
              dInstance.refresh();
              setTimeout(() => dInstance.refresh(), 50);
            }
          }
        }
      });

      tour.drive();
    }, 150);
  };

  // --- SCREEN RENDERS ---
  if (authLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg, #0f172a)', flexDirection: 'column', gap: '16px'
      }}>
        <div style={{
          width: 48, height: 48, border: '4px solid rgba(255,255,255,0.1)',
          borderTop: '4px solid #6366f1', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'inherit', fontSize: '14px', margin: 0 }}>
          Loading ELY.pos…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (screen === "landing") {
    return (
      <LandingPage 
        onOpenAuth={() => {
          if (user || auth.currentUser || isDemoMode) {
            setScreen("app");
            window.location.hash = "#app";
          } else {
            setScreen("auth");
            window.location.hash = "#auth";
          }
        }}
        onStartTour={() => {
          setScreen("app");
          window.location.hash = "#app";
          setTimeout(() => startFullSiteTour(), 300);
        }}
      />
    );
  }

  if (screen === "auth") {
    return (
      <AuthPage 
        onSuccess={() => {
          setScreen("app");
          window.location.hash = "#app";
        }}
        onBackToLanding={() => {
          setScreen("landing");
          window.location.hash = "#landing";
        }}
      />
    );
  }

  // --- MAIN APP TERMINAL ---
  return (
    <div className={`pos-layout${view !== 'pos' ? ' no-cart' : ''}`}>
      <PosSidebar 
        storeName={storeName}
        view={view}
        setView={setView}
        onStartTour={startTour}
      />

      <main className="main-viewport">
        <PosHeader 
          view={view}
          storeName={storeName}
          isDemoMode={isDemoMode}
          onExitDemo={async () => {
            await logoutUser();
            setFruits([]);
            setActiveOrders([]);
            setStoreName("My Store");
            localStorage.removeItem("elypos_store_name");
            setReceiptConfig(DEFAULT_RECEIPT_CONFIG);
            localStorage.removeItem("elypos_receipt_config");
            setView("dashboard");
            setScreen("landing");
            window.location.hash = "#landing";
          }}
          onStartTour={startTour}
          fruits={fruits}
          posSearchTerm={posSearchTerm}
          setPosSearchTerm={setPosSearchTerm}
          posSelectedCategory={posSelectedCategory}
          setPosSelectedCategory={setPosSelectedCategory}
        />

        {view === 'pos' && (
          <ProductCatalog 
            fruits={fruits}
            cart={cart}
            posSelectedCategory={posSelectedCategory}
            posSearchTerm={posSearchTerm}
            onSelectProduct={openWeighInModal}
            onNavigateToInventory={() => setView('inventory')}
            onClearFilters={() => {
              setPosSearchTerm('');
              setPosSelectedCategory('All');
            }}
          />
        )}

        {view === 'dashboard' && (
          <AnalyticsDashboard 
            dashboardRange={dashboardRange}
            setDashboardRange={setDashboardRange}
            dashboardCustomDate={dashboardCustomDate}
            setDashboardCustomDate={setDashboardCustomDate}
            aggregates={dashAggregates}
            orders={activeOrders}
            onNavigateToPos={() => setView('pos')}
            onNavigateToOrders={() => setView('orders')}
          />
        )}

        {view === 'inventory' && (
          <InventoryManagement 
            fruits={fruits}
            invSearchTerm={invSearchTerm}
            setInvSearchTerm={setInvSearchTerm}
            invSelectedCategory={invSelectedCategory}
            setInvSelectedCategory={setInvSelectedCategory}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {view === 'orders' && (
          <OrderHistoryView 
            orders={historyOrders}
            filterDate={filterDate}
            setFilterDate={setFilterDate}
            historySearch={historySearch}
            setHistorySearch={setHistorySearch}
            storeName={storeName}
            receiptConfig={receiptConfig}
            onDownloadReceipt={downloadReceipt}
            onDeleteOrder={handleDeleteOrder}
          />
        )}

        {view === 'delivery' && (
          <DeliveryManifestView 
            orders={historyOrders}
            filterDate={filterDate}
            setFilterDate={setFilterDate}
            selectedOrderIds={selectedOrderIds}
            setSelectedOrderIds={setSelectedOrderIds}
            storeName={storeName}
            onToggleStatus={handleToggleDeliveryStatus}
            onCaptureManifest={captureManifest}
          />
        )}

        {view === 'settings' && (
          <SettingsPage 
            storeName={storeName}
            onUpdateStoreName={async (newName) => {
              setStoreName(newName);
              localStorage.setItem("elypos_store_name", newName);
              if (!isDemoMode && user) {
                const { settingsDocRef } = getStorePaths(user, isOwnerAccount);
                await setDoc(settingsDocRef, { store_name: newName }, { merge: true });
              }
            }}
            receiptConfig={receiptConfig}
            onUpdateReceiptConfig={async (newConfig) => {
              const updated = { ...DEFAULT_RECEIPT_CONFIG, ...newConfig };
              setReceiptConfig(updated);
              localStorage.setItem("elypos_receipt_config", JSON.stringify(updated));
              if (!isDemoMode && user) {
                const { settingsDocRef } = getStorePaths(user, isOwnerAccount);
                await setDoc(settingsDocRef, { receipt_config: updated }, { merge: true });
              }
              showToast("Receipt Template Saved!");
            }}
            isDemoMode={isDemoMode}
            user={user}
            onRerunWizard={() => setShowSetupWizard(true)}
            onStartFullTour={startFullSiteTour}
            onReload={() => {
              if (window.confirm("Reload the POS? Unsaved checkout items will be cleared.")) {
                window.location.reload();
              }
            }}
            onSignOut={async () => {
              await logoutUser();
              setFruits([]);
              setActiveOrders([]);
              setStoreName("My Store");
              localStorage.removeItem("elypos_store_name");
              setReceiptConfig(DEFAULT_RECEIPT_CONFIG);
              localStorage.removeItem("elypos_receipt_config");
              setView("dashboard");
              setScreen("landing");
              window.location.hash = "#landing";
            }}
          />
        )}
      </main>

      {/* POS Cart Sidebar */}
      {view === 'pos' && (
        <CartSidebar 
          cart={cart}
          customer={customer}
          setCustomer={setCustomer}
          address={address}
          setAddress={setAddress}
          receiptConfig={receiptConfig}
          onRemoveItem={handleRemoveCartItem}
          onClearCart={handleClearCart}
          onCheckout={completeOrder}
          isCheckingOut={isCheckingOut}
        />
      )}

      {/* Scale Weigh-In Modal */}
      {weighInProduct && (
        <WeightKeypadModal 
          product={weighInProduct}
          qtyStr={modalQtyStr}
          setQtyStr={setModalQtyStr}
          onClose={closeWeighInModal}
          onConfirm={handleConfirmWeighIn}
        />
      )}

      {/* Rollback Undo Banner */}
      {undoBanner && (
        <div className="checkout-undo-banner" role="status" aria-live="polite">
          <div className="undo-banner-left">
            <span className="undo-pulse-dot" aria-hidden="true" />
            <span className="undo-banner-text">
              Order for <strong>{undoBanner.customerName}</strong> completed (₱{undoBanner.total?.toFixed(2)})
            </span>
          </div>
          <div className="undo-banner-actions">
            <button 
              type="button" 
              className="btn-undo-checkout"
              onClick={() => handleUndoOrder(undoBanner.id)}
              style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
            >
              <ArrowCounterClockwise size={14} weight="bold" style={{ color: '#ffffff' }} />
              <span style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>Undo Checkout</span>
            </button>
            <button 
              type="button" 
              className="btn-undo-dismiss"
              onClick={() => {
                if (undoTimerRef.current) {
                  clearTimeout(undoTimerRef.current);
                  undoTimerRef.current = null;
                }
                setUndoBanner(null);
              }}
              aria-label="Dismiss undo notification"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* Completed Sale Receipt Modal */}
      {completedReceiptModal && (
        <InstantReceiptModal 
          order={completedReceiptModal}
          onClose={() => setCompletedReceiptModal(null)}
          storeName={storeName}
          receiptConfig={receiptConfig}
          canUndo={Boolean(undoBanner && undoBanner.id === completedReceiptModal.id)}
          onUndo={handleUndoOrder}
          showToast={showToast}
        />
      )}

      {/* Setup Wizard */}
      {showSetupWizard && (
        <SetupWizard
          user={user}
          isDemoMode={isDemoMode}
          currentStoreName={storeName}
          onComplete={async (newStoreName, storeType) => {
            setStoreName(newStoreName);
            localStorage.setItem("elypos_store_name", newStoreName);
            localStorage.setItem("elypos_store_type", storeType);
            localStorage.setItem("elypos_setup_done", "true");
            if (user?.uid) {
              localStorage.setItem(`elypos_setup_done_${user.uid}`, "true");
            }
            if (!isDemoMode && user) {
              const { settingsDocRef } = getStorePaths(user, isOwnerAccount);
              setDoc(settingsDocRef, {
                store_name: newStoreName,
                store_type: storeType,
                setup_done: true
              }, { merge: true }).catch(console.error);
            }
            setShowSetupWizard(false);
            setTimeout(() => startFullSiteTour(), 300);
          }}
          onSkip={() => {
            localStorage.setItem("elypos_setup_done", "true");
            if (user?.uid) {
              localStorage.setItem(`elypos_setup_done_${user.uid}`, "true");
            }
            if (!isDemoMode && user) {
              const { settingsDocRef } = getStorePaths(user, isOwnerAccount);
              setDoc(settingsDocRef, { setup_done: true }, { merge: true }).catch(console.error);
            }
            setShowSetupWizard(false);
          }}
        />
      )}

      {/* Global Toast */}
      {toast && (
        <div className="toast">
          <CheckCircle size={16} weight="fill" className="toast-icon" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}