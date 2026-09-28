import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import { db, auth } from './firebaseClient';
import { 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  setDoc,
  increment,
  onSnapshot, 
  query, 
  orderBy
} from "firebase/firestore";

import "./App.css";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { 
  SquaresFour, 
  ShoppingCart, 
  Package, 
  ClipboardText, 
  Truck, 
  ArrowClockwise, 
  Coins, 
  Receipt, 
  TrendUp, 
  Trophy, 
  Clock, 
  X, 
  Sparkle, 
  Check, 
  Camera, 
  Trash, 
  CheckCircle, 
  SignOut, 
  Gear, 
  Plus, 
  Minus,
  Backspace,
  Question,
  MagnifyingGlass, 
  Calendar, 
  ArrowUpRight, 
  Basket, 
  CaretRight,
  ArrowCounterClockwise
} from "@phosphor-icons/react";

import { useAuth } from "./context/AuthContext";
import LandingPage from "./components/LandingPage";
import AuthPage from "./components/AuthPage";
import SetupWizard from "./components/SetupWizard";
import SettingsPage from "./components/SettingsPage";
import { flushSync } from "react-dom";
import { DEMO_PRODUCTS, DEMO_ORDERS, getDemoOrders } from "./data/demoSeed";
import { DEFAULT_RECEIPT_CONFIG, formatReceiptText } from "./data/receiptConfig";

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).substring(2, 15);
};

const formatPeso = (amount) => {
  return "₱" + Number(amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};


function App() {
  const { 
    user, 
    isDemoMode, 
    isOwnerAccount,
    loading: authLoading,
    enterDemoMode, 
    logoutUser 
  } = useAuth();

  // Screen routing state: 'landing' | 'auth' | 'app'
  const [screen, setScreen] = useState(() => {
    const hasAuth = !!(auth.currentUser || localStorage.getItem("elypos_is_demo") === "true");
    if (window.location.hash === "#app") {
      if (hasAuth) return "app";
      return "landing";
    }
    if (window.location.hash === "#auth" || window.location.hash === "#login") {
      if (hasAuth) return "app";
      return "auth";
    }
    return "landing";
  });

  // Sync hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const isAuthenticated = !!(user || auth.currentUser || isDemoMode);
      if (hash === "#app") {
        if (isAuthenticated) {
          setScreen("app");
        } else {
          setScreen("landing");
          window.location.hash = "#landing";
        }
      } else if (hash === "#auth" || hash === "#login") {
        if (isAuthenticated) {
          setScreen("app");
          window.location.hash = "#app";
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

  // Auth route guard: protect #app from unauthenticated visits
  useEffect(() => {
    const isAuthenticated = !!(user || auth.currentUser || isDemoMode);
    if (!authLoading && screen === "app" && !isAuthenticated) {
      setScreen("landing");
      window.location.hash = "#landing";
    }
  }, [authLoading, screen, user, isDemoMode]);

  // Auto-forward authenticated users to #app when logged in from auth screen or landing
  useEffect(() => {
    const isAuthenticated = !!(user || auth.currentUser);
    if (!authLoading && isAuthenticated && (screen === "auth" || (screen === "landing" && window.location.hash !== "#landing"))) {
      setScreen("app");
      window.location.hash = "#app";
    }
  }, [authLoading, user, screen]);

  const [view, setView] = useState("dashboard"); 
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  // Ensure view always defaults away from 'settings' when entering the app screen
  useEffect(() => {
    if (screen === "app" && view === "settings") {
      setView("dashboard");
    }
  }, [screen]);
  
  // --- CLOUD DATA STATES (pre-seeded with demo data if in demo mode) ---
  const [fruits, setFruits] = useState(() => isDemoMode ? DEMO_PRODUCTS : []);
  const [completedOrders, setCompletedOrders] = useState(() => isDemoMode ? getDemoOrders() : []);
  const [customerCount, setCustomerCount] = useState(() => isDemoMode ? 5 : 1);

  // --- LOCAL SESSION STATES ---
  const [cart, setCart] = useState([]); 
  
  // Input States
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", price: "", unit: "", category: "" });

  const [customer, setCustomer] = useState("");
  const [address, setAddress] = useState(""); 
  
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [posSearchTerm, setPosSearchTerm] = useState("");
  const [invSearchTerm, setInvSearchTerm] = useState("");
  const [posSelectedCategory, setPosSelectedCategory] = useState("All");
  const [invSelectedCategory, setInvSelectedCategory] = useState("All");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [historySearch, setHistorySearch] = useState("");
  const [dashboardRange, setDashboardRange] = useState('today');
  const [dashboardCustomDate, setDashboardCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [toast, setToast] = useState("");
  const [weights, setWeights] = useState({});
  const [weighInProduct, setWeighInProduct] = useState(null);
  const [modalQtyStr, setModalQtyStr] = useState("1");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [undoBanner, setUndoBanner] = useState(null);
  const undoTimerRef = useRef(null);

  // --- STORE BRANDING & STORY STATES ---
  const [storeName, setStoreName] = useState(() => {
    if (isDemoMode) return "Fresh Express Demo";
    const saved = localStorage.getItem("elypos_store_name");
    if (saved && saved !== "ElyPOS") return saved;
    if (user?.displayName) return user.displayName;
    return isOwnerAccount ? "Ely's Store" : "My Store";
  });
  const [completedReceiptModal, setCompletedReceiptModal] = useState(null);
  const [receiptConfig, setReceiptConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("elypos_receipt_config");
      if (saved) return { ...DEFAULT_RECEIPT_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Error parsing elypos_receipt_config from localStorage:", e);
    }
    return DEFAULT_RECEIPT_CONFIG;
  });

  // Sync store name with active user profile if available
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

  // Clean up checkout undo timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  // --- 1. INITIAL DATA LOADING ---
  useEffect(() => {
    // Demo Mode: use isolated seeded data only
    if (isDemoMode) {
      setFruits(DEMO_PRODUCTS);
      setCompletedOrders(getDemoOrders());
      setCustomerCount(5);
      setStoreName("Fresh Express Demo");
      return;
    }

    // Not logged in: show nothing
    if (!user) {
      setFruits([]);
      setCompletedOrders([]);
      return;
    }

    // Owner account (samuelordialesyt@gmail.com) → root Firestore collections (Dad's live store)
    // Any other authenticated user → their own scoped sub-collections
    const productsPath = isOwnerAccount ? "products" : `users/${user.uid}/products`;
    const ordersPath   = isOwnerAccount ? "orders"   : `users/${user.uid}/orders`;
    const settingsRef  = isOwnerAccount
      ? doc(db, "app_settings", "global")
      : doc(db, "users", user.uid, "app_settings", "global");

    const qProducts = query(collection(db, productsPath), orderBy("name"));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const prodList = [];
      snapshot.forEach((d) => {
        prodList.push({ id: d.id, ...d.data() });
      });
      setFruits(prodList);
    }, (error) => {
      console.error("Products listener error:", error);
    });

    const qOrders = query(collection(db, ordersPath), orderBy("created_at", "desc"));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const orderList = [];
      snapshot.forEach((d) => {
        orderList.push({ id: d.id, ...d.data() });
      });
      setCompletedOrders(orderList);
    }, (error) => {
      console.error("Orders listener error:", error);
    });

    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCustomerCount(data.customer_count || 1);
        if (data.store_name) {
          setStoreName(data.store_name);
          localStorage.setItem("elypos_store_name", data.store_name);
        }
        if (data.receipt_config) {
          const mergedConfig = { ...DEFAULT_RECEIPT_CONFIG, ...data.receipt_config };
          setReceiptConfig(mergedConfig);
          localStorage.setItem("elypos_receipt_config", JSON.stringify(mergedConfig));
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
    }, (error) => {
      console.error("Settings listener error:", error);
    });

    return () => {
      unsubProducts();
      unsubOrders();
      unsubSettings();
    };
  }, [isDemoMode, user, isOwnerAccount]);



  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2000); };

  // Helper: return the correct Firestore collection path for the active user
  const prodCol  = () => isOwnerAccount ? "products" : `users/${user?.uid}/products`;
  const ordCol   = () => isOwnerAccount ? "orders"   : `users/${user?.uid}/orders`;
  const settDoc  = () => isOwnerAccount
    ? doc(db, "app_settings", "global")
    : doc(db, "users", user?.uid, "app_settings", "global");

  // --- RECEIPT CONFIGURATION ACTIONS ---
  const handleUpdateReceiptConfig = async (newConfig) => {
    const updated = { ...DEFAULT_RECEIPT_CONFIG, ...newConfig };
    setReceiptConfig(updated);
    localStorage.setItem("elypos_receipt_config", JSON.stringify(updated));
    if (!isDemoMode && user) {
      try {
        await setDoc(settDoc(), { receipt_config: updated }, { merge: true });
      } catch (err) {
        console.error("Error saving receipt config to Firestore:", err);
      }
    }
    showToast("Receipt Template Saved!");
  };

  // --- INVENTORY ACTIONS ---
  const addFruit = async (e) => {
    e.preventDefault();
    if (!name || !price || !unit) return showToast("Please fill all required fields (Name, Price, Unit)");
    if (name && price && unit) {
      const newFruit = { 
        name, 
        price: parseFloat(price), 
        unit, 
        category: category || "Uncategorized",
        created_at: new Date().toISOString()
      };
      if (isDemoMode) {
        setFruits(prev => [{ id: `demo-prod-${Date.now()}`, ...newFruit }, ...prev]);
        setName(""); setPrice(""); setUnit(""); setCategory("");
        showToast("Added to Demo Catalog");
        return;
      }
      try {
        await addDoc(collection(db, prodCol()), newFruit);
        setName(""); setPrice(""); setUnit(""); setCategory("");
        showToast("Added to Inventory");
      } catch (error) {
        showToast("Error: " + error.message);
      }
    }
  };

  const deleteFruit = async (id) => {
    const itemToDelete = fruits.find(f => f.id === id);
    if (!window.confirm(`Are you sure you want to remove "${itemToDelete?.name || 'this item'}" from inventory?`)) return;

    if (isDemoMode) {
      setFruits(prev => prev.filter(f => f.id !== id));
      showToast("Removed from Demo");
      return;
    }
    try {
      await deleteDoc(doc(db, prodCol(), id));
      showToast("Removed from Cloud");
    } catch (error) {
      showToast("Error: " + error.message);
    }
  };

  const saveEdit = async (id) => {
    const updates = { 
      name: editFormData.name, 
      price: parseFloat(editFormData.price), 
      unit: editFormData.unit, 
      category: editFormData.category 
    };
    if (isDemoMode) {
      setFruits(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
      setEditingId(null); 
      showToast("Demo Updated!");
      return;
    }
    try {
      await updateDoc(doc(db, prodCol(), id), updates);
      setEditingId(null); 
      showToast("Updated!");
    } catch (error) {
      showToast("Error: " + error.message);
    }
  };

  // --- PRODUCE CATEGORY THEME & SCANNING HELPER ---
  const getCategoryTheme = (category = "", name = "") => {
    const cat = (category || "").toLowerCase();
    const n = (name || "").toLowerCase();

    // Roots, Tubers, Alliums, Spices (Garlic, Onion, Potatoes, Carrots, Ginger)
    if (
      cat.includes("root") || cat.includes("tuber") || cat.includes("spice") ||
      n.includes("garlic") || n.includes("bawang") || n.includes("onion") ||
      n.includes("sibuyas") || n.includes("potato") || n.includes("patatas") ||
      n.includes("ginger") || n.includes("luya") || n.includes("carrot")
    ) {
      return {
        chipClass: "cat-chip-roots",
        cardClass: "card-cat-roots",
        dotColor: "#EA580C",
        label: "Roots & Spices"
      };
    }

    // Fresh Fruits
    if (
      cat.includes("fruit") || n.includes("banana") || n.includes("apple") || 
      n.includes("mango") || n.includes("orange") || n.includes("watermelon") || 
      n.includes("papaya") || n.includes("dragonfruit") || n.includes("lemon") || 
      n.includes("calamansi") || n.includes("avocado")
    ) {
      return {
        chipClass: "cat-chip-fruits",
        cardClass: "card-cat-fruits",
        dotColor: "#F59E0B",
        label: "Fruits"
      };
    }

    // Vegetables & Leafy Greens
    if (
      cat.includes("veg") || cat.includes("green") || cat.includes("leaf") || 
      n.includes("ampalaya") || n.includes("beans") || n.includes("kangkong") || 
      n.includes("pechay") || n.includes("broccoli") || n.includes("cabbage") || 
      n.includes("repolyo") || n.includes("talong") || n.includes("kamatis") || 
      n.includes("tomato") || n.includes("sili")
    ) {
      return {
        chipClass: "cat-chip-vegetables",
        cardClass: "card-cat-vegetables",
        dotColor: "#10B981",
        label: "Vegetables"
      };
    }

    return {
      chipClass: "cat-chip-general",
      cardClass: "card-cat-general",
      dotColor: "#00A3E0",
      label: category || "Produce"
    };
  };

  // --- TOUCH-FIRST WEIGH-IN & STEPPER HELPERS ---
  const getProductQty = (product) => {
    if (weights[product.id] !== undefined && weights[product.id] !== "") {
      const parsed = parseFloat(weights[product.id]);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
    return 0;
  };

  const handleCardStep = (product, delta) => {
    const isKg = (product.unit || '').toLowerCase().includes('kg');
    const step = isKg ? 0.25 : 1;
    const current = getProductQty(product);
    let next;
    if (current === 0 && delta > 0) {
      next = isKg ? 1.0 : 1;
    } else {
      next = Math.max(0, Math.round((current + delta * step) * 1000) / 1000);
    }
    setWeights(prev => ({ ...prev, [product.id]: next }));
  };

  const openWeighInModal = (product) => {
    setWeighInProduct(product);
    const isKg = (product.unit || '').toLowerCase().includes('kg');
    const curr = getProductQty(product);
    if (curr > 0) {
      setModalQtyStr(String(curr));
    } else if (!isKg) {
      // Piece / unit items default to 1 so the cashier can immediately confirm or tap presets/numpad
      setModalQtyStr("1");
    } else {
      setModalQtyStr("");
    }
  };

  const closeWeighInModal = () => {
    setWeighInProduct(null);
  };

  const handleModalNumpad = (val) => {
    if (val === 'backspace') {
      setModalQtyStr(prev => (prev.length > 1 ? prev.slice(0, -1) : ''));
    } else if (val === 'clear') {
      setModalQtyStr('');
    } else if (val === '.') {
      setModalQtyStr(prev => {
        if (!prev) return '0.';
        if (prev.includes('.')) return prev;
        return prev + '.';
      });
    } else {
      setModalQtyStr(prev => {
        if (prev === '0') return val === '0' ? '0' : val;
        const parts = prev.split('.');
        // Allow up to 3 decimal places for high-precision scales (e.g. 0.000 / 0.125 kg)
        if (parts.length === 2 && parts[1].length >= 3) return prev;
        if (prev.replace('.', '').length >= 7) return prev;
        return prev + val;
      });
    }
  };

  const handleModalPreset = (presetVal) => {
    setModalQtyStr(String(presetVal));
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

  // --- POS / CHECKOUT ACTIONS ---
  const addToCart = (product, customQty = null) => {
    const rawVal = customQty !== null ? customQty : weights[product.id];
    const isUnitItem = ['pc', 'pcs', 'pack', 'packs', 'tali', 'bundle', 'piece', 'pieces'].includes((product.unit || '').toLowerCase().trim());
    const isKgItem = (product.unit || '').toLowerCase().includes('kg');
    const qty = parseFloat(rawVal) || (customQty === null && isUnitItem ? 1 : 0);
    
    if (!qty || qty <= 0) return showToast("Enter weight or quantity");
    
    const roundedQty = Math.round(qty * 1000) / 1000;
    const item = { 
      cartId: generateId(), 
      name: product.name, 
      price: product.price, 
      quantity: roundedQty, 
      unit: product.unit, 
      subtotal: Math.round(product.price * roundedQty * 100) / 100
    };

    setCart(prev => [...prev, item]);
    // Reset product weight to 0 on the card so it never stays stuck on high volumes
    setWeights(prev => ({ ...prev, [product.id]: 0 }));
    showToast(`Added ${roundedQty} ${product.unit} ${product.name}`);
  };

  const handleCardAdd = (product) => {
    // Open the Touch Weigh-In & Numpad modal for all items (both kg and pc)
    openWeighInModal(product);
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (!window.confirm("Are you sure you want to clear all items in the current cart?")) return;
    setCart([]);
    setWeights({});
    showToast("Cart cleared");
  };

  const handleUndoOrder = async (orderId) => {
    if (!orderId) return;
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    const snapshot = undoBanner;
    setUndoBanner(null);
    if (completedReceiptModal && completedReceiptModal.id === orderId) {
      setCompletedReceiptModal(null);
    }

    try {
      if (isDemoMode) {
        setCompletedOrders(prev => prev.filter(o => o.id !== orderId));
        setCustomerCount(prev => Math.max(1, prev - 1));
      } else {
        await deleteDoc(doc(db, ordCol(), orderId));
        try {
          await setDoc(settDoc(), { customer_count: increment(-1) }, { merge: true });
        } catch (_) {}
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

  const completeOrder = async () => {
    if (isCheckingOut) return;
    if (cart.length === 0) return showToast("Cart is empty!");
    
    setIsCheckingOut(true);
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    
    const now = new Date();
    const newOrder = { 
        customer_name: customer || `Customer #${customerCount}`, 
        address: address || "Walk-in",
        status: "Pending",
        items: cart, 
        total: cart.reduce((acc, i) => acc + i.subtotal, 0), 
        created_at: now.toISOString(),
        raw_date: now.toISOString().split('T')[0], 
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
        setCompletedOrders(prev => [demoOrd, ...prev]);
        setCustomerCount(prev => prev + 1);
        setCart([]); setCustomer(""); setAddress(""); setWeights({});
        setCompletedReceiptModal(demoOrd);
      } else {
        const docRef = await addDoc(collection(db, ordCol()), newOrder);
        createdId = docRef.id;
        await setDoc(settDoc(), { customer_count: increment(1) }, { merge: true });
        setCart([]); setCustomer(""); setAddress(""); setWeights({});
        setCompletedReceiptModal({ id: createdId, ...newOrder });
      }

      // Activate 5-second non-blocking rollback undo window
      const undoData = {
        id: createdId,
        customerName: newOrder.customer_name,
        total: newOrder.total,
        items: cartSnapshot,
        customer: customerSnapshot,
        address: addressSnapshot,
        weights: weightsSnapshot
      };
      setUndoBanner(undoData);
      undoTimerRef.current = setTimeout(() => {
        setUndoBanner(null);
        undoTimerRef.current = null;
      }, 5500);

      showToast("Transaction Saved!");
    } catch (orderError) {
      showToast("Error: " + orderError.message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const deleteOrder = async (id) => {
    if(!window.confirm("Delete this order record permanently?")) return;
    if (isDemoMode) {
      setCompletedOrders(prev => prev.filter(o => o.id !== id));
      showToast("Demo Order Deleted");
      return;
    }
    try {
      await deleteDoc(doc(db, ordCol(), id));
      showToast("Order Deleted");
    } catch (error) {
      showToast("Error: " + error.message);
    }
  };

  const toggleDeliveryStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "Delivered" ? "Pending" : "Delivered";
    if (isDemoMode) {
      setCompletedOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      showToast("Status Updated");
      return;
    }
    try {
      await updateDoc(doc(db, ordCol(), id), { status: newStatus });
      showToast("Status Updated");
    } catch (error) {
      showToast("Error: " + error.message);
    }
  };

  // Pre-order features removed; code omitted.

  const getSortedManifest = () => {
    const selected = completedOrders.filter(o => selectedOrderIds.includes(o.id) && o.raw_date === filterDate);
    const getPriority = (addr) => {
      const val = addr ? addr.trim() : "";
      if (val.startsWith('4')) return 1;
      if (val.startsWith('3')) return 2;
      if (val.startsWith('2')) return 3;
      if (val.startsWith('1')) return 4;
      return 5;
    };
    return selected.sort((a, b) => getPriority(a.address) - getPriority(b.address));
  };

  const getDeliveryList = () => {
    const filtered = completedOrders.filter(o => o.raw_date === filterDate);
    return filtered.sort((a, b) => {
      if (a.status === "Delivered" && b.status !== "Delivered") return 1;
      if (a.status !== "Delivered" && b.status === "Delivered") return -1;
      return 0;
    });
  };

  const captureManifest = () => {
    const element = document.getElementById("manifest-area-capture");
    html2canvas(element, { scale: 2, backgroundColor: "#ffffff" }).then(canvas => {
      const link = document.createElement("a");
      link.download = `Delivery_List_${filterDate}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  const downloadReceipt = (orderId) => {
    const element = document.getElementById(`receipt-${orderId}`);
    const actions = element.querySelector('.no-print');
    if(actions) actions.style.display = 'none';
    html2canvas(element, { scale: 2 }).then(canvas => {
      const link = document.createElement("a");
      link.download = `Receipt.png`;
      link.href = canvas.toDataURL();
      link.click();
      if(actions) actions.style.display = 'flex';
      showToast("Receipt Saved");
    });
  };

  // --- DASHBOARD COMPUTATIONS (run always, cheap since they just filter arrays) ---
  const toLocalISOString = (d) => {
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
  };

  const dashToday = toLocalISOString(new Date());
  const dashWeekStart = (() => { const d = new Date(); d.setDate(d.getDate() - 6); return toLocalISOString(d); })();
  const dashMonthStart = (() => { const d = new Date(); d.setDate(1); return toLocalISOString(d); })();

  const dashOrders = completedOrders.filter(o => {
    if (dashboardRange === 'today') return o.raw_date === dashToday;
    if (dashboardRange === 'week') return o.raw_date >= dashWeekStart && o.raw_date <= dashToday;
    if (dashboardRange === 'month') return o.raw_date >= dashMonthStart && o.raw_date <= dashToday;
    if (dashboardRange === 'custom') return o.raw_date === dashboardCustomDate;
    return false;
  });

  const dashRevenue = dashOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const dashTxCount = dashOrders.length;
  const dashAvg = dashTxCount > 0 ? dashRevenue / dashTxCount : 0;
  const dashItemsSold = dashOrders.reduce((s, o) => s + (o.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 1), 0), 0);

  const dashItemMap = {};
  dashOrders.forEach(o => {
    (o.items || []).forEach(it => {
      const key = it.name || 'Unknown';
      if (!dashItemMap[key]) dashItemMap[key] = { name: key, qty: 0, revenue: 0, unit: it.unit || 'units' };
      dashItemMap[key].qty += (Number(it.quantity) || 0);
      dashItemMap[key].revenue += (Number(it.subtotal) || 0);
      if (it.unit) dashItemMap[key].unit = it.unit;
    });
  });
  const dashTopSellers = Object.values(dashItemMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const dashMaxSellerRev = dashTopSellers.length > 0 ? dashTopSellers[0].revenue : 1;

  const sortedDashOrders = [...dashOrders].sort((a, b) => {
    const tA = new Date(a.created_at || a.raw_date || 0).getTime();
    const tB = new Date(b.created_at || b.raw_date || 0).getTime();
    return tB - tA;
  });
  const dashRecentOrders = sortedDashOrders.slice(0, 5);
  const dashRangeLabel = dashboardRange === 'today' ? 'Today' : dashboardRange === 'week' ? 'This Week (7 Days)' : dashboardRange === 'month' ? 'This Month' : (dashboardCustomDate || 'Selected Date');

  // --- HISTORY COMPUTATIONS ---
  const historyFilteredOrders = completedOrders.filter(o => {
    const matchDate = o.raw_date === filterDate;
    const matchName = historySearch.trim() === '' || (o.customer_name || '').toLowerCase().includes(historySearch.trim().toLowerCase());
    return matchDate && matchName;
  });
  const historyFilteredRevenue = historyFilteredOrders.reduce((a, b) => a + (b.total || 0), 0);



  // --- GUIDED TOUR (driver.js spotlight highlighting for single view) ---
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
          { element: '.top-search', popover: { title: 'Search Inventory', description: 'Quickly find an item to edit or delete.', side: "bottom", align: 'start' } },
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

      const tour = driver({
        showProgress: true,
        animate: true,
        steps: activeSteps,
        popoverClass: 'driverjs-theme'
      });
      
      tour.drive();
    };

    if (targetView && targetView !== view) {
      setView(targetView);
      setTimeout(() => runDriver(targetView), 250);
    } else {
      runDriver(view);
    }
  };

  // --- FULL SITE AUTO-NAVIGATING TOUR (Driver.js) ---
  const startFullSiteTour = () => {
    setView("dashboard");
    setTimeout(() => {
      const viewSwitches = { 1: "dashboard", 3: "pos", 7: "inventory", 8: "orders", 9: "delivery", 11: "settings" };
      const rawSteps = [
        { element: '.sidebar', popover: { title: '1. Navigation', description: 'Welcome. These 6 sections are your entire POS terminal.', side: 'right', align: 'start' } },
        { element: '.dash-metric-grid', popover: { title: '2. Daily Metrics', description: 'Your daily revenue, transaction count, and averages live here.', side: 'bottom', align: 'start' } },
        { element: '.dash-panels', popover: { title: '3. Store Insights', description: 'Top-selling products and recent orders at a glance.', side: 'top', align: 'start' } },
        { element: '.product-grid', popover: { title: '4. Product Catalog', description: 'Tap any item to start ringing it up.', side: 'right', align: 'start' } },
        { element: '.weight-selector', popover: { title: '5. Scale Weight Input', description: 'Enter the scale weight here — the math is instant.', side: 'bottom', align: 'start' } },
        { element: '.bill-sidebar', popover: { title: '6. Live Cart', description: 'Your current order builds here in real time.', side: 'left', align: 'start' } },
        { element: '.btn-checkout', popover: { title: '7. Checkout', description: 'Complete Transaction saves the sale and generates a receipt.', side: 'top', align: 'center' } },
        { element: '.inv-form-card', popover: { title: '8. Inventory Management', description: 'Add and manage your entire product catalog here.', side: 'bottom', align: 'start' } },
        { element: '.orders-controls', popover: { title: '9. Transaction History', description: 'Filter past transactions by date or customer name.', side: 'bottom', align: 'start' } },
        { element: '.delivery-step-select', popover: { title: '10. Delivery Planning', description: 'Select today\'s delivery orders to build a manifest.', side: 'right', align: 'start' } },
        { element: '.manifest-sheet', popover: { title: '11. Rider Manifest', description: 'Your rider sheet generates automatically — download as image.', side: 'left', align: 'start' } },
        { element: '.settings-page', popover: { title: '12. Store Settings', description: 'Customize your store name, type, and account settings here.', side: 'top', align: 'start' } }
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

  // --- RENDER SCREEN DISPATCH ---
  // Show a loading screen while Firebase Auth resolves the session (prevents flash on iPad reload)
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
        onLaunchDemo={() => {
          enterDemoMode();
          setFruits(DEMO_PRODUCTS);
          setCompletedOrders(getDemoOrders());
          setCustomerCount(5);
          setStoreName("Fresh Express Demo");
          setView("pos");
          setScreen("app");
          window.location.hash = "#app";
          setTimeout(() => startFullSiteTour(), 400);
        }}
      />
    );
  }

  if (screen === "auth") {
    return (
      <AuthPage 
        onBackToLanding={() => {
          setScreen("landing");
          window.location.hash = "#landing";
        }}
        onSuccessLogin={({ isSignUp, storeName: registeredStoreName, user: authedUser } = {}) => {
          setView("dashboard");
          if (registeredStoreName) {
            setStoreName(registeredStoreName);
          }
          if (isSignUp) {
            localStorage.removeItem("elypos_setup_done");
            if (authedUser?.uid) localStorage.removeItem(`elypos_setup_done_${authedUser.uid}`);
            setShowSetupWizard(true);
          } else {
            const uid = authedUser?.uid || user?.uid || auth.currentUser?.uid;
            const userSetupDone = uid ? localStorage.getItem(`elypos_setup_done_${uid}`) : null;
            const globalSetupDone = localStorage.getItem("elypos_setup_done");
            if (userSetupDone !== "true" && globalSetupDone !== "true") {
              setShowSetupWizard(true);
            }
          }
          setScreen("app");
          window.location.hash = "#app";
        }}
      />
    );
  }

  const viewLabels = { dashboard: "Dashboard", pos: "Point of Sale", inventory: "Inventory Management", orders: "Order History", delivery: "Delivery", settings: "Settings" };

  // --- RENDER MAIN POS TERMINAL ---
  return (
    <div className={`pos-layout${view !== 'pos' ? ' no-cart' : ''}`}>
      <aside className="sidebar">
        <div className="brand" title={`Active Store: ${storeName}`}>
          <div className="brand-logo-wrap">
            <img src="/ely-logo.png" alt="ELY" className="brand-logo-img" />
            <span className="brand-active-dot" title="Terminal Online" />
          </div>
          <h2 className="brand-text">{storeName}</h2>
        </div>
        <nav className="nav-links" aria-label="Terminal Navigation">
          <button
            type="button"
            className={`nav-item ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => setView('dashboard')}
            aria-label="Dashboard"
            aria-current={view === 'dashboard' ? 'page' : undefined}
            title="Dashboard Overview"
          >
            <span className="nav-icon nav-icon-dashboard"><SquaresFour size={18} weight="bold" /></span>
            <span className="nav-text">Dashboard</span>
            <span className="nav-label-ipad">Dash</span>
          </button>
          <button
            type="button"
            className={`nav-item ${view === 'pos' ? 'active' : ''}`}
            onClick={() => setView('pos')}
            aria-label="Point of Sale Register"
            aria-current={view === 'pos' ? 'page' : undefined}
            title="POS Cashier Register"
          >
            <span className="nav-icon nav-icon-pos"><ShoppingCart size={18} weight="bold" /></span>
            <span className="nav-text">POS</span>
            <span className="nav-label-ipad">POS</span>
          </button>
          <button
            type="button"
            className={`nav-item ${view === 'inventory' ? 'active' : ''}`}
            onClick={() => setView('inventory')}
            aria-label="Product Catalog and Inventory"
            aria-current={view === 'inventory' ? 'page' : undefined}
            title="Inventory Catalog"
          >
            <span className="nav-icon nav-icon-inventory"><Package size={18} weight="bold" /></span>
            <span className="nav-text">Inventory</span>
            <span className="nav-label-ipad">Catalog</span>
          </button>
          <button
            type="button"
            className={`nav-item ${view === 'orders' ? 'active' : ''}`}
            onClick={() => setView('orders')}
            aria-label="Transaction and Order History"
            aria-current={view === 'orders' ? 'page' : undefined}
            title="Transaction History"
          >
            <span className="nav-icon nav-icon-orders"><ClipboardText size={18} weight="bold" /></span>
            <span className="nav-text">History</span>
            <span className="nav-label-ipad">History</span>
          </button>
          <button
            type="button"
            className={`nav-item ${view === 'delivery' ? 'active' : ''}`}
            onClick={() => setView('delivery')}
            aria-label="Delivery Manifests"
            aria-current={view === 'delivery' ? 'page' : undefined}
            title="Delivery Manifests"
          >
            <span className="nav-icon nav-icon-delivery"><Truck size={18} weight="bold" /></span>
            <span className="nav-text">Delivery</span>
            <span className="nav-label-ipad">Delivery</span>
          </button>
          <button
            type="button"
            className={`nav-item ${view === 'settings' ? 'active' : ''}`}
            onClick={() => setView('settings')}
            aria-label="Store Settings and Customization"
            aria-current={view === 'settings' ? 'page' : undefined}
            title="Store Settings"
          >
            <span className="nav-icon nav-icon-settings"><Gear size={18} weight="bold" /></span>
            <span className="nav-text">Settings</span>
            <span className="nav-label-ipad">Settings</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-status-pill" title="Store Terminal Online">
            <span className="status-indicator-dot" />
            <span className="sidebar-status-text">Online</span>
          </div>
          <button
            type="button"
            className="sidebar-help-btn"
            onClick={() => startTour(view)}
            title="Interactive Tour & Guide"
            aria-label="Interactive Tour & Guide"
          >
            <Question size={16} weight="bold" />
          </button>
        </div>
      </aside>

      <main className="main-viewport">
        <header className="top-header">
          <div className="header-top-row">
            <div className="header-left">
              {view === 'dashboard' ? (
                <div className="dash-header-greeting">
                  <h2 className="dash-greeting-text">
                    {(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; })()}, {storeName}!
                  </h2>
                  <p className="dash-greeting-sub">Here's your store overview.</p>
                </div>
              ) : (
                <h3 className="section-title">{viewLabels[view] || view}</h3>
              )}
            </div>
            <div className="header-right-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isDemoMode && (
                <div className="demo-indicator-pill">
                  <Sparkle size={13} weight="fill" className="demo-pill-sparkle" />
                  <span>Demo Sandbox</span>
                  <button
                    className="btn-exit-demo-pill"
                    onClick={async () => {
                      await logoutUser();
                      setFruits([]);
                      setCompletedOrders([]);
                      setStoreName("My Store");
                      localStorage.removeItem("elypos_store_name");
                      setReceiptConfig(DEFAULT_RECEIPT_CONFIG);
                      localStorage.removeItem("elypos_receipt_config");
                      setView("dashboard");
                      setScreen("landing");
                      window.location.hash = "#landing";
                    }}
                    title="Exit Demo to Landing Page"
                  >
                    Exit Demo
                  </button>
                </div>
              )}
              <button className="btn-help-icon" onClick={() => startTour(view)} title="Setup Guide & Tour">
                ?
              </button>
              <div className="info-pill"><span className="pill-label">Today</span><span className="pill-value">{new Date().toLocaleDateString()}</span></div>
            </div>
          </div>

          {view === 'pos' && (
            <div className="pos-search-wrapper">
              <div className="pos-search-bar-row">
                <div className="pos-search-box">
                  <MagnifyingGlass size={18} className="pos-search-icon" />
                  <input
                    type="text"
                    className="pos-search-input"
                    placeholder="Search products by name..."
                    value={posSearchTerm}
                    onChange={e => setPosSearchTerm(e.target.value)}
                  />
                  {posSearchTerm && (
                    <button
                      type="button"
                      className="pos-search-clear"
                      onClick={() => setPosSearchTerm('')}
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="pos-catalog-count">
                  <span><strong>{fruits.length}</strong> items</span>
                </div>
              </div>
              <div className="category-filter-bar">
                {['All', ...new Set(fruits.map(f => f.category).filter(Boolean))].map(cat => (
                  <button
                    key={cat}
                    className={`cat-filter-btn ${posSelectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setPosSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        {view === 'pos' && (
          <div className="product-grid">
            {fruits.length === 0 ? (
              <div className="empty-catalog-state">
                <Package size={44} className="empty-catalog-icon" />
                <h3>Your Product Catalog is Empty</h3>
                <p>No products added yet. Visit Inventory to add your first item and start ringing up sales.</p>
                <button className="btn-empty-add" onClick={() => setView('inventory')}>
                  Go to Inventory
                </button>
              </div>
            ) : (() => {
              const filteredPosFruits = fruits
                .filter(f => (posSelectedCategory === "All" || f.category === posSelectedCategory))
                .filter(f => f.name.toLowerCase().includes(posSearchTerm.toLowerCase()));

              if (filteredPosFruits.length === 0) {
                return (
                  <div className="pos-empty-filter-state">
                    <MagnifyingGlass size={38} className="empty-search-icon" />
                    <h3>No products found</h3>
                    <p>No items match "{posSearchTerm}" in {posSelectedCategory}.</p>
                    <button
                      className="btn-clear-pos-filters"
                      onClick={() => { setPosSearchTerm(''); setPosSelectedCategory('All'); }}
                    >
                      Clear Search & Filters
                    </button>
                  </div>
                );
              }

              return filteredPosFruits.map(f => {
                const catTheme = getCategoryTheme(f.category, f.name);
                const cartQty = cart
                  .filter(c => c.name === f.name)
                  .reduce((acc, c) => acc + c.quantity, 0);

                return (
                  <div
                    key={f.id}
                    className="food-card"
                    onClick={() => handleCardAdd(f)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardAdd(f);
                      }
                    }}
                    aria-label={`${f.name}, ₱${f.price.toFixed(2)} per ${f.unit}. Tap to add.`}
                  >
                    <div className="card-top-row">
                      <span className={`card-cat ${catTheme.chipClass}`}>
                        {catTheme.label}
                      </span>
                      {cartQty > 0 && (
                        <span className="card-cart-badge" title={`${cartQty} ${f.unit} in current cart`}>
                          <ShoppingCart size={11} weight="bold" />
                          <span>{cartQty} {f.unit}</span>
                        </span>
                      )}
                    </div>

                    <div className="card-body">
                      <h4 className="food-name" title={f.name}>{f.name}</h4>
                      <p className="food-price">
                        <span className="price-amount">₱{f.price.toFixed(2)}</span>
                        <span className="price-unit"> / {f.unit}</span>
                      </p>
                    </div>

                    <div className="card-action" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn-card-add"
                        onClick={() => handleCardAdd(f)}
                        title={`Add ${f.name} to cart`}
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* --- TOUCH WEIGH-IN & NUMPAD MODAL --- */}
        {weighInProduct && (
          <div className="weighin-modal-overlay" onClick={closeWeighInModal}>
            <div className="weighin-modal-content" onClick={e => e.stopPropagation()}>
              <div className="weighin-header">
                <div className="weighin-title-group">
                  <span className="weighin-cat-badge">{weighInProduct.category || "Produce"}</span>
                  <h3 className="weighin-prod-name">{weighInProduct.name}</h3>
                  <p className="weighin-rate">₱{weighInProduct.price.toFixed(2)} per {weighInProduct.unit}</p>
                </div>
                <button 
                  type="button" 
                  className="weighin-close-btn" 
                  onClick={closeWeighInModal}
                  aria-label="Close weigh-in dialog"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>

              <div className="weighin-display-card">
                <div className="weighin-display-left">
                  <span className="weighin-display-label">
                    {(weighInProduct.unit || '').toLowerCase().includes('kg') ? "Scale Weight" : "Quantity"}
                  </span>
                  <div className="weighin-display-value">
                    <span className="weighin-num">
                      {modalQtyStr || ((weighInProduct.unit || '').toLowerCase().includes('kg') ? "0.000" : "1")}
                    </span>
                    <span className="weighin-unit">{weighInProduct.unit}</span>
                  </div>
                </div>
                <div className="weighin-display-right">
                  <span className="weighin-display-label">Item Total</span>
                  <span className="weighin-subtotal">
                    ₱{((parseFloat(modalQtyStr) || 0) * weighInProduct.price).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="weighin-presets-section">
                <span className="weighin-presets-label">Quick Presets</span>
                <div className="weighin-presets-grid">
                  {(weighInProduct.unit || '').toLowerCase().includes('kg') ? (
                    [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 5.0].map(val => (
                      <button
                        key={val}
                        type="button"
                        className={`weighin-preset-chip ${parseFloat(modalQtyStr) === val ? 'active' : ''}`}
                        onClick={() => handleModalPreset(val)}
                      >
                        {val} kg
                      </button>
                    ))
                  ) : (
                    [1, 2, 3, 4, 5, 6, 10, 12].map(val => (
                      <button
                        key={val}
                        type="button"
                        className={`weighin-preset-chip ${parseFloat(modalQtyStr) === val ? 'active' : ''}`}
                        onClick={() => handleModalPreset(val)}
                      >
                        {val} {weighInProduct.unit}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Touch Numpad (Virtual Keyboard Never Invoked) */}
              <div className="weighin-numpad-grid">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map(digit => (
                  <button
                    key={digit}
                    type="button"
                    className="weighin-key-btn"
                    onClick={() => handleModalNumpad(digit)}
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  className="weighin-key-btn weighin-key-backspace"
                  onClick={() => handleModalNumpad('backspace')}
                  aria-label="Backspace"
                >
                  <Backspace size={22} weight="bold" />
                </button>
              </div>

              <div className="weighin-actions">
                <button
                  type="button"
                  className="weighin-clear-btn"
                  onClick={() => handleModalNumpad('clear')}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="weighin-confirm-btn"
                  onClick={handleConfirmWeighIn}
                  disabled={!parseFloat(modalQtyStr) || parseFloat(modalQtyStr) <= 0}
                >
                  <Check size={18} weight="bold" />
                  <span>Add to Cart · ₱{((parseFloat(modalQtyStr) || 0) * weighInProduct.price).toFixed(2)}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'dashboard' && (
          <div className="dashboard-screen">
            {/* Range & Action Bar */}
            <div className="dash-range-bar">
              <div className="dash-range-left">
                <div className="dash-range-btns" role="tablist" aria-label="Time period">
                  {[
                    { id: 'today', label: 'Today' },
                    { id: 'week', label: 'This Week' },
                    { id: 'month', label: 'This Month' }
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      role="tab"
                      aria-selected={dashboardRange === r.id}
                      className={`dash-range-btn ${dashboardRange === r.id ? 'active' : ''}`}
                      onClick={() => setDashboardRange(r.id)}
                    >
                      {r.label}
                    </button>
                  ))}
                  <div className="dash-custom-wrap">
                    <Calendar size={15} className="dash-custom-calendar-icon" />
                    <input
                      type="date"
                      aria-label="Filter by specific date"
                      className={`date-input dash-date-pick ${dashboardRange === 'custom' ? 'active' : ''}`}
                      value={dashboardCustomDate}
                      onChange={e => { setDashboardCustomDate(e.target.value); setDashboardRange('custom'); }}
                    />
                  </div>
                </div>
                <div className="dash-range-label">
                  <Calendar size={13} className="dash-range-label-icon" />
                  <span>Showing: <strong>{dashRangeLabel}</strong></span>
                </div>
              </div>

              <div className="dash-range-right">
                <button
                  type="button"
                  className="dash-quick-sale-btn"
                  onClick={() => setView('pos')}
                  title="Open Point of Sale register"
                >
                  <ShoppingCart size={15} />
                  <span>New Sale</span>
                </button>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="dash-metric-grid">
              <div className="dash-metric-card dash-metric-revenue">
                <div className="dash-metric-card-top">
                  <span className="dash-metric-label">Total Revenue</span>
                  <div className="dash-metric-icon-box icon-revenue">
                    <Coins size={20} />
                  </div>
                </div>
                <div className="dash-metric-card-bottom">
                  <div className="dash-metric-value">{formatPeso(dashRevenue)}</div>
                  <div className="dash-metric-hint">
                    {dashTxCount > 0 
                      ? `${dashTxCount} completed ${dashTxCount === 1 ? 'sale' : 'sales'}`
                      : 'No transactions yet'}
                  </div>
                </div>
              </div>

              <div className="dash-metric-card dash-metric-tx">
                <div className="dash-metric-card-top">
                  <span className="dash-metric-label">Transactions</span>
                  <div className="dash-metric-icon-box icon-tx">
                    <Receipt size={20} />
                  </div>
                </div>
                <div className="dash-metric-card-bottom">
                  <div className="dash-metric-value">{dashTxCount}</div>
                  <div className="dash-metric-hint">
                    {dashTxCount > 0
                      ? `${dashRecentOrders.filter(o => o.order_type === 'delivery').length} delivery · ${dashRecentOrders.filter(o => o.order_type !== 'delivery').length} in-store`
                      : 'Awaiting register checkouts'}
                  </div>
                </div>
              </div>

              <div className="dash-metric-card dash-metric-avg">
                <div className="dash-metric-card-top">
                  <span className="dash-metric-label">Avg. Order Value</span>
                  <div className="dash-metric-icon-box icon-avg">
                    <TrendUp size={20} weight="bold" />
                  </div>
                </div>
                <div className="dash-metric-card-bottom">
                  <div className="dash-metric-value">{formatPeso(dashAvg)}</div>
                  <div className="dash-metric-hint">
                    {dashTxCount > 0 ? 'Per customer ticket' : 'Requires at least 1 order'}
                  </div>
                </div>
              </div>

              <div className="dash-metric-card dash-metric-items">
                <div className="dash-metric-card-top">
                  <span className="dash-metric-label">Items Sold</span>
                  <div className="dash-metric-icon-box icon-items">
                    <Package size={20} weight="bold" />
                  </div>
                </div>
                <div className="dash-metric-card-bottom">
                  <div className="dash-metric-value">
                    {dashItemsSold % 1 === 0 ? dashItemsSold : dashItemsSold.toFixed(1)}
                  </div>
                  <div className="dash-metric-hint">
                    {dashItemsSold > 0 
                      ? `Units across ${dashOrders.reduce((s, o) => s + (o.items || []).length, 0)} product lines`
                      : 'No items scanned'}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Panels */}
            <div className="dash-panels">
              {/* Top Sellers Panel */}
              <div className="dash-panel">
                <div className="dash-panel-header">
                  <div className="dash-panel-title-wrap">
                    <div className="panel-header-icon-box icon-trophy">
                      <Trophy size={16} weight="bold" />
                    </div>
                    <div>
                      <h4 className="dash-panel-title">Top Sellers</h4>
                      <span className="dash-panel-desc">Ranked by gross sales volume</span>
                    </div>
                  </div>
                  <span className="dash-panel-badge">{dashTopSellers.length} items ranked</span>
                </div>

                {dashTopSellers.length === 0 ? (
                  <div className="dash-panel-empty">
                    <Basket size={36} weight="bold" className="dash-empty-icon" />
                    <h5>No produce sales recorded</h5>
                    <p>Once orders are rung up at the register, your top performers will appear here automatically.</p>
                    <button
                      type="button"
                      className="dash-empty-btn"
                      onClick={() => setView('pos')}
                    >
                      <ShoppingCart size={14} weight="bold" />
                      <span>Open POS Register</span>
                    </button>
                  </div>
                ) : (
                  <div className="dash-sellers-list">
                    {dashTopSellers.map((item, i) => {
                      const sharePct = dashMaxSellerRev > 0 ? Math.round((item.revenue / dashMaxSellerRev) * 100) : 0;
                      const formattedQty = item.qty % 1 === 0 ? item.qty : item.qty.toFixed(1);
                      return (
                        <div key={item.name} className="dash-seller-row">
                          <div className={`dash-seller-rank rank-${i + 1}`}>
                            {i === 0 ? '1' : i === 1 ? '2' : i === 2 ? '3' : i + 1}
                          </div>
                          <div className="dash-seller-info">
                            <div className="dash-seller-info-top">
                              <span className="dash-seller-name" title={item.name}>{item.name}</span>
                              <span className="dash-seller-rev">{formatPeso(item.revenue)}</span>
                            </div>
                            <div className="dash-seller-info-sub">
                              <span className="dash-seller-qty">{formattedQty} {item.unit || 'units'} sold</span>
                              <span className="dash-seller-pct">{sharePct}% of top volume</span>
                            </div>
                            <div className="dash-seller-bar-track">
                              <div className="dash-seller-bar-fill" style={{ width: `${Math.max(8, sharePct)}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent Orders Panel */}
              <div className="dash-panel">
                <div className="dash-panel-header">
                  <div className="dash-panel-title-wrap">
                    <div className="panel-header-icon-box icon-recent">
                      <Clock size={16} weight="bold" />
                    </div>
                    <div>
                      <h4 className="dash-panel-title">Recent Transactions</h4>
                      <span className="dash-panel-desc">Latest counter & delivery tickets</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="dash-panel-action-btn"
                    onClick={() => setView('orders')}
                    title="View full Order History"
                  >
                    <span>View All</span>
                    <ArrowUpRight size={14} weight="bold" />
                  </button>
                </div>

                {dashRecentOrders.length === 0 ? (
                  <div className="dash-panel-empty">
                    <Receipt size={36} weight="bold" className="dash-empty-icon" />
                    <h5>No transactions in this period</h5>
                    <p>Tickets printed and sales checked out will be logged here in chronological order.</p>
                    <button
                      type="button"
                      className="dash-empty-btn"
                      onClick={() => setView('pos')}
                    >
                      <ShoppingCart size={14} weight="bold" />
                      <span>Start First Sale</span>
                    </button>
                  </div>
                ) : (
                  <div className="dash-recent-list">
                    {dashRecentOrders.map(o => {
                      const itemCount = (o.items || []).length;
                      const isDelivery = o.order_type === 'delivery';
                      return (
                        <div 
                          key={o.id} 
                          className="dash-recent-row"
                          onClick={() => setView('orders')}
                          title="Click to view details in Order History"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setView('orders'); }}
                        >
                          <div className="dash-recent-avatar">
                            {isDelivery ? <Truck size={16} weight="bold" /> : <Receipt size={16} weight="bold" />}
                          </div>
                          <div className="dash-recent-info">
                            <div className="dash-recent-top-line">
                              <span className="dash-recent-name">{o.customer_name || 'Walk-in Customer'}</span>
                              <span className="dash-recent-total">{formatPeso(o.total || 0)}</span>
                            </div>
                            <div className="dash-recent-sub-line">
                              <span className={`dash-recent-type-badge ${isDelivery ? 'badge-delivery' : 'badge-pos'}`}>
                                {isDelivery ? 'Delivery' : 'POS'}
                              </span>
                              <span className="dash-recent-meta">
                                {itemCount} {itemCount === 1 ? 'item' : 'items'} · {o.display_date || ''} {o.time ? `(${o.time})` : ''}
                              </span>
                              <span className="dash-recent-status-pill">
                                {o.status || 'Completed'}
                              </span>
                            </div>
                          </div>
                          <div className="dash-recent-arrow">
                            <CaretRight size={15} weight="bold" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'inventory' && (() => {
          const filteredFruits = fruits
            .filter(f => (invSelectedCategory === "All" || f.category === invSelectedCategory))
            .filter(f => f.name.toLowerCase().includes(invSearchTerm.toLowerCase()));

          return (
            <div className="inventory-screen">
              <div className="inv-top-bar">
                <div className="inv-search-wrapper">
                  <div className="inv-search-box">
                    <MagnifyingGlass size={18} className="inv-search-icon" />
                    <input
                      type="text"
                      className="inv-search-input"
                      placeholder="Search inventory by product name..."
                      value={invSearchTerm}
                      onChange={e => setInvSearchTerm(e.target.value)}
                    />
                    {invSearchTerm && (
                      <button
                        type="button"
                        className="inv-search-clear"
                        onClick={() => setInvSearchTerm('')}
                        title="Clear search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div className="inv-stats-pill">
                    <span><strong>{fruits.length}</strong> items</span>
                    <span className="dot-divider">•</span>
                    <span><strong>{[...new Set(fruits.map(f => f.category).filter(Boolean))].length}</strong> categories</span>
                  </div>
                </div>

                <div className="category-filter-bar">
                  {['All', ...new Set(fruits.map(f => f.category).filter(Boolean))].map(cat => (
                    <button
                      key={cat}
                      className={`cat-filter-btn ${invSelectedCategory === cat ? 'active' : ''}`}
                      onClick={() => setInvSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="inv-form-card">
                <div className="inv-form-header">
                  <div>
                    <h4>Add New Product</h4>
                    <p>Register new produce or goods into your store catalog</p>
                  </div>
                </div>
                <form onSubmit={addFruit}>
                  <div className="form-grid">
                    <div className="form-field-group">
                      <label>Product Name</label>
                      <input
                        placeholder="e.g. Avocado Davao"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-field-group">
                      <label>Price (₱)</label>
                      <div className="input-with-prefix">
                        <span className="input-prefix">₱</span>
                        <input
                          placeholder="0.00"
                          type="number"
                          step="any"
                          min="0"
                          value={price}
                          onChange={e => setPrice(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-field-group">
                      <label>Pricing Unit</label>
                      <input
                        placeholder="kg, pc, pack, tali..."
                        value={unit}
                        onChange={e => setUnit(e.target.value)}
                        required
                      />
                      <div className="unit-quick-picks">
                        {['kg', 'pc', 'pack', 'tali'].map(u => (
                          <button
                            type="button"
                            key={u}
                            className={`unit-pick-btn ${unit.toLowerCase() === u ? 'selected' : ''}`}
                            onClick={() => setUnit(u)}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="form-field-group">
                      <label>Category</label>
                      <input
                        list="category-suggestions"
                        placeholder="e.g. Fruits, Veggies"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                      />
                      <datalist id="category-suggestions">
                        {[...new Set(fruits.map(f => f.category).filter(Boolean))].map(cat => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                  <button type="submit" className="btn-save-inv">
                    <Plus size={16} />
                    <span>Add to Inventory</span>
                  </button>
                </form>
              </div>

              <div className="inv-table-wrapper">
                <table className="inv-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Unit</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fruits.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="inv-empty-cell">
                          <div className="inv-empty-state">
                            <Package size={36} className="inv-empty-icon" />
                            <h4>Your catalog is empty</h4>
                            <p>Fill out the form above to add your first product.</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredFruits.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="inv-empty-cell">
                          <div className="inv-empty-state">
                            <MagnifyingGlass size={36} className="inv-empty-icon" />
                            <h4>No matching products</h4>
                            <p>No items found matching “{invSearchTerm}” in “{invSelectedCategory}”.</p>
                            <button
                              type="button"
                              className="btn-clear-filters"
                              onClick={() => { setInvSearchTerm(''); setInvSelectedCategory('All'); }}
                            >
                              Clear Search & Filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredFruits.map(f => (
                        <tr key={f.id} className={editingId === f.id ? "row-editing" : ""}>
                          {editingId === f.id ? (
                            <>
                              <td>
                                <input
                                  className="inv-edit-input"
                                  value={editFormData.name}
                                  placeholder="Product Name"
                                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                />
                              </td>
                              <td>
                                <input
                                  className="inv-edit-input"
                                  value={editFormData.category}
                                  placeholder="Category"
                                  onChange={e => setEditFormData({ ...editFormData, category: e.target.value })}
                                />
                              </td>
                              <td>
                                <div className="input-with-prefix">
                                  <span className="input-prefix">₱</span>
                                  <input
                                    className="inv-edit-input"
                                    type="number"
                                    step="any"
                                    value={editFormData.price}
                                    placeholder="Price"
                                    onChange={e => setEditFormData({ ...editFormData, price: e.target.value })}
                                  />
                                </div>
                              </td>
                              <td>
                                <input
                                  className="inv-edit-input"
                                  value={editFormData.unit}
                                  placeholder="Unit"
                                  onChange={e => setEditFormData({ ...editFormData, unit: e.target.value })}
                                />
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div className="inv-edit-actions">
                                  <button
                                    type="button"
                                    className="btn-save-row"
                                    onClick={() => saveEdit(f.id)}
                                    title="Save changes"
                                  >
                                    <Check size={14} />
                                    <span>Save</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-cancel-row"
                                    onClick={() => setEditingId(null)}
                                    title="Cancel editing"
                                  >
                                    <X size={14} />
                                    <span>Cancel</span>
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td>
                                <div className="inv-product-name">
                                  <strong>{f.name}</strong>
                                </div>
                              </td>
                              <td>
                                <span className="inv-cat-pill">{f.category || "Uncategorized"}</span>
                              </td>
                              <td>
                                <span className="inv-price-val">₱{f.price.toFixed(2)}</span>
                              </td>
                              <td>
                                <span className="inv-unit-tag">{f.unit}</span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div className="inv-row-actions">
                                  <button
                                    type="button"
                                    className="btn-edit-row"
                                    onClick={() => { setEditingId(f.id); setEditFormData(f); }}
                                    title="Edit product"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteFruit(f.id)}
                                    className="btn-delete-row"
                                    title="Delete product"
                                  >
                                    <Trash size={14} />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {view === 'orders' && (
          <div className="orders-screen">
            <div className="orders-controls">
              <div className="history-filters">
                <input type="date" className="date-input" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                <div className="history-search-wrap">
                  <input
                    type="text"
                    className="history-search-input"
                    placeholder="Search by customer name..."
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                  />
                  {historySearch && (
                    <button className="history-search-clear" onClick={() => setHistorySearch('')}><X size={14} /></button>
                  )}
                </div>
              </div>
              <div className="revenue-badge">
                <span className="revenue-label">{historySearch ? 'Filtered Revenue' : 'Daily Revenue'}</span>
                <span className="revenue-amount">₱{historyFilteredRevenue.toFixed(2)}</span>
              </div>
            </div>
            {historyFilteredOrders.length === 0 && (
              <div className="history-empty">No orders found{historySearch ? ` for “${historySearch}”` : ''} on {filterDate}.</div>
            )}
            {historyFilteredOrders.map(o => (
              <div key={o.id} className="history-card" id={`receipt-${o.id}`}>
                 <div className="receipt-brand-header">
                    <h3>{storeName.toUpperCase()}</h3>
                    <p>{receiptConfig?.subtitle || "Official Sales Receipt"}</p>
                    {receiptConfig?.tagline && (
                      <p className="receipt-tagline">{receiptConfig.tagline}</p>
                    )}
                    {receiptConfig?.address && (
                      <p className="receipt-contact-info">{receiptConfig.address}</p>
                    )}
                    {receiptConfig?.phone && (
                      <p className="receipt-contact-info">Tel: {receiptConfig.phone}</p>
                    )}
                    {receiptConfig?.show_receipt_no && (
                      <div className="receipt-order-no">Receipt #{o.id ? o.id.slice(-6).toUpperCase() : '000000'}</div>
                    )}
                 </div>
                <div className="receipt-divider"></div>
                <div className="receipt-body">
                  <div className="receipt-left">
                    <div className="h-customer-name"><strong>{o.customer_name}</strong></div>
                    <div className="h-meta">{o.display_date} | {o.time}</div>
                    <div className="h-items-list">
                      {o.items.map(it => (
                        <div key={it.cartId} className="h-item-line">
                          {it.name} ({it.quantity}{it.unit}) ₱{(it.subtotal || 0).toFixed(2)}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="receipt-right">
                    <span className="h-total-amount">₱{(o.total || 0).toFixed(2)}</span>
                    <div className="h-actions no-print">
                      <button className="btn-screenshot" onClick={() => downloadReceipt(o.id)} title="Download Receipt"><Camera size={16} /></button>
                      <button className="btn-delete-order" onClick={() => deleteOrder(o.id)} title="Delete Order"><Trash size={16} /></button>
                    </div>
                  </div>
                </div>
                <div className="receipt-divider"></div>
                <div className="receipt-footer">
                  <p>{formatReceiptText(receiptConfig?.footer_line1 || "Thank you for shopping at {store}!", storeName)}</p>
                  {receiptConfig?.footer_line2 && (
                    <p>{formatReceiptText(receiptConfig.footer_line2, storeName)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'delivery' && (
          <div className="delivery-grid">
            <div className="delivery-step-select">
              <div className="pane-header">
                <h4>1. Selection (Delivered at Bottom)</h4>
                <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="date-input" />
              </div>
              <div className="order-selection-list">
                {getDeliveryList().map(o => (
                  <div key={o.id} className={`order-sel-card ${o.status === 'Delivered' ? 'is-delivered' : ''} ${selectedOrderIds.includes(o.id) ? 'active' : ''}`}>
                    <div className="sel-click-area" onClick={() => setSelectedOrderIds(prev => prev.includes(o.id) ? prev.filter(i => i !== o.id) : [...prev, o.id])}>
                       <input type="checkbox" checked={selectedOrderIds.includes(o.id)} readOnly />
                       <div className="o-info">
                         <strong>{o.customer_name} {o.status === 'Delivered' && <CheckCircle size={16} weight="fill" className="status-delivered-icon" />}</strong>
                         <p>{o.address}</p>
                       </div>
                    </div>
                    <button className="btn-status-toggle" onClick={() => toggleDeliveryStatus(o.id, o.status)}>
                      {o.status === 'Delivered' ? "Undo" : "Done"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="delivery-step-preview">
              <div className="preview-top-bar">
                <h4>2. Manifest Preview</h4>
                {selectedOrderIds.length > 0 && <button className="btn-download-manifest" onClick={captureManifest}><Camera size={16} /> Download Image</button>}
              </div>
              <div id="manifest-area-capture" className="manifest-sheet">
                <div className="manifest-header">
                  <h2>{storeName.toUpperCase()}'S RIDER MANIFEST</h2>
                  <div className="manifest-meta"><span>Date: {filterDate}</span><span>Rider: _________________</span></div>
                </div>
                <table className="manifest-table">
                  <thead><tr><th>CUSTOMER</th><th>ADDRESS</th><th style={{textAlign:'right'}}>AMOUNT</th></tr></thead>
                  <tbody>
                    {getSortedManifest().map(o => (
                      <tr key={o.id}>
                        <td><strong>{o.customer_name ? o.customer_name.toUpperCase() : "CUSTOMER"}</strong></td>
                        <td>{o.address.startsWith('4') || o.address.startsWith('3') || o.address.startsWith('2') || o.address.startsWith('1') ? `Phase ${o.address}` : o.address}</td>
                        <td style={{textAlign:'right', fontWeight:'800'}}>₱{o.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="manifest-total-line">TOTAL: ₱{getSortedManifest().reduce((a,b)=>a+b.total,0).toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}

        {view === 'settings' && (
          <SettingsPage
            storeName={storeName}
            onUpdateStoreName={async (newName) => {
              setStoreName(newName);
              localStorage.setItem("elypos_store_name", newName);
              if (!isDemoMode && user) {
                await setDoc(settDoc(), { store_name: newName }, { merge: true });
              }
            }}
            receiptConfig={receiptConfig}
            onUpdateReceiptConfig={handleUpdateReceiptConfig}
            isDemoMode={isDemoMode}
            user={user}
            onRerunWizard={() => setShowSetupWizard(true)}
            onStartFullTour={startFullSiteTour}
            onReload={() => { if (window.confirm("Reload the POS? Unsaved checkout items will be cleared.")) window.location.reload(); }}
            onSignOut={async () => {
              await logoutUser();
              setFruits([]);
              setCompletedOrders([]);
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

      {view === 'pos' && (
        <aside className="bill-sidebar">
          <div className="bill-header">
            <div className="bill-header-top">
              <div className="bill-title-wrap">
                <ShoppingCart size={18} className="bill-cart-icon" />
                <h3>Current Order</h3>
              </div>
              <span className="cart-count-badge">
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            
            <div className="bill-customer-inputs">
              <input
                placeholder="Customer Name (optional)"
                value={customer}
                onChange={e => setCustomer(e.target.value)}
                className="customer-input"
              />
              {receiptConfig?.show_address_field !== false && (
                <input
                  placeholder="Address (e.g. Phase 4, Walk-in)"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="customer-input"
                />
              )}
            </div>
          </div>

          <div className="bill-items">
            {cart.length === 0 ? (
              <div className="cart-empty-state">
                <ShoppingCart size={38} className="cart-empty-icon" />
                <h4>Cart is empty</h4>
                <p>Tap products or enter scale weights to build this customer order.</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.cartId} className="bill-row">
                  <div className="bill-row-top">
                    <strong className="bill-item-title" title={item.name}>{item.name}</strong>
                    <div className="bill-row-top-right">
                      <span className="bill-item-price">₱{item.subtotal.toFixed(2)}</span>
                      <button
                        type="button"
                        className="btn-remove-item"
                        onClick={() => setCart(cart.filter(c => c.cartId !== item.cartId))}
                        title={`Remove ${item.name}`}
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <X size={14} weight="bold" />
                      </button>
                    </div>
                  </div>
                  <div className="bill-row-bottom">
                    <span className="bill-item-rate">
                      ₱{item.price.toFixed(2)} / {item.unit}
                    </span>
                    <span className="bill-item-qty-badge">
                      {item.quantity} <span className="qty-unit">{item.unit}</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bill-footer">
            <div className="total-line">
              <span className="total-label">Total Amount</span>
              <span className="total-val">₱{cart.reduce((a, i) => a + i.subtotal, 0).toFixed(2)}</span>
            </div>
            <div className="bill-footer-buttons">
              <button
                type="button"
                className="btn-clear-cart"
                onClick={handleClearCart}
                disabled={cart.length === 0}
                title="Clear current cart"
              >
                Clear
              </button>
              <button
                type="button"
                className="btn-checkout"
                onClick={completeOrder}
                disabled={cart.length === 0 || isCheckingOut}
              >
                <CheckCircle size={18} weight="bold" />
                <span>{isCheckingOut ? "Processing..." : "Complete Transaction"}</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 5-Second Non-Blocking Rollback Undo Banner */}
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
            >
              <ArrowCounterClockwise size={14} weight="bold" />
              <span>Undo Checkout</span>
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
          <div className="undo-progress-bar" />
        </div>
      )}
      {completedReceiptModal && (
        <div className="parser-modal-overlay" onClick={() => setCompletedReceiptModal(null)}>
          <div className="parser-modal-content receipt-popup-modal" onClick={e => e.stopPropagation()}>
            <div className="receipt-popup-header">
              <div className="receipt-popup-badge">
                <CheckCircle size={18} weight="fill" color="#10b981" />
                <span>Transaction Complete</span>
              </div>
              <button className="receipt-popup-close" onClick={() => setCompletedReceiptModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div id={`instant-receipt-${completedReceiptModal.id}`} className="instant-receipt-paper">
              <div className="receipt-brand-header">
                <h3>{storeName.toUpperCase()}</h3>
                <p>{receiptConfig?.subtitle || "Official Sales Receipt"}</p>
                {receiptConfig?.tagline && (
                  <p className="receipt-tagline">{receiptConfig.tagline}</p>
                )}
                {receiptConfig?.address && (
                  <p className="receipt-contact-info">{receiptConfig.address}</p>
                )}
                {receiptConfig?.phone && (
                  <p className="receipt-contact-info">Tel: {receiptConfig.phone}</p>
                )}
                {receiptConfig?.show_receipt_no && (
                  <div className="receipt-order-no">Receipt #{completedReceiptModal.id ? completedReceiptModal.id.slice(-6).toUpperCase() : '000000'}</div>
                )}
                <div className="receipt-meta-line">
                  <span>{completedReceiptModal.display_date} · {completedReceiptModal.time}</span>
                  <span>{completedReceiptModal.customer_name}</span>
                </div>
              </div>
              <div className="receipt-divider"></div>
              <div className="receipt-popup-items">
                {completedReceiptModal.items.map(item => (
                  <div key={item.cartId} className="receipt-popup-row">
                    <div>
                      <strong>{item.name}</strong>
                      <span className="receipt-popup-sub">{item.quantity} {item.unit} × ₱{item.price.toFixed(2)}</span>
                    </div>
                    <span className="receipt-popup-item-price">₱{item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="receipt-divider"></div>
              <div className="receipt-popup-total">
                <span>TOTAL PAID</span>
                <span className="receipt-popup-total-value">₱{completedReceiptModal.total.toFixed(2)}</span>
              </div>
              <div className="receipt-popup-footer">
                <p>{formatReceiptText(receiptConfig?.footer_line1 || "Thank you for shopping at {store}!", storeName)}</p>
                {receiptConfig?.footer_line2 && (
                  <p>{formatReceiptText(receiptConfig.footer_line2, storeName)}</p>
                )}
              </div>
            </div>

            <div className="receipt-popup-actions">
              {undoBanner && undoBanner.id === completedReceiptModal.id && (
                <button 
                  type="button"
                  className="btn-undo-instant-receipt"
                  onClick={() => handleUndoOrder(completedReceiptModal.id)}
                  title="Undo this checkout and restore items to cart"
                >
                  <ArrowCounterClockwise size={16} weight="bold" />
                  <span>Undo Checkout</span>
                </button>
              )}
              <button 
                className="btn-download-instant-receipt"
                onClick={() => {
                  const element = document.getElementById(`instant-receipt-${completedReceiptModal.id}`);
                  if (!element) return;
                  html2canvas(element, { scale: 2, backgroundColor: "#ffffff" }).then(canvas => {
                    const link = document.createElement("a");
                    link.download = `Receipt_${completedReceiptModal.customer_name.replace(/\s+/g, '_')}_${Date.now()}.png`;
                    link.href = canvas.toDataURL("image/png");
                    link.click();
                    showToast("Receipt Downloaded!");
                  });
                }}
              >
                <Camera size={16} />
                <span>Download Receipt PNG</span>
              </button>
              <button className="btn-new-sale" onClick={() => setCompletedReceiptModal(null)}>
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}

      <SetupWizard
        isOpen={showSetupWizard}
        onComplete={(newStoreName, storeType) => {
          setStoreName(newStoreName);
          localStorage.setItem("elypos_store_name", newStoreName);
          localStorage.setItem("elypos_store_type", storeType);
          localStorage.setItem("elypos_setup_done", "true");
          if (user?.uid) {
            localStorage.setItem(`elypos_setup_done_${user.uid}`, "true");
          }
          if (!isDemoMode && user) {
            setDoc(settDoc(), { store_name: newStoreName, store_type: storeType, setup_done: true }, { merge: true }).catch(console.error);
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
            setDoc(settDoc(), { setup_done: true }, { merge: true }).catch(console.error);
          }
          setShowSetupWizard(false);
        }}
      />

      {toast && <div className="toast-notification">{toast}</div>}
    </div>
  );
}


export default App;