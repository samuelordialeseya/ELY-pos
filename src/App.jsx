import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import { db } from './firebaseClient';
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
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  ClipboardList, 
  Truck, 
  RotateCw, 
  Coins, 
  Receipt, 
  TrendingUp, 
  Trophy, 
  Clock, 
  X, 
  Sparkles, 
  Check, 
  Camera, 
  Trash2, 
  CheckCircle2, 
  Info,
  LogOut,
  Store,
  User as UserIcon,
  Settings,
  ChevronUp,
  ChevronDown,
  Compass
} from "lucide-react";

import { useAuth } from "./context/AuthContext";
import LandingPage from "./components/LandingPage";
import AuthPage from "./components/AuthPage";
import OnboardingModal from "./components/OnboardingModal";
import ConsumerStoryModal from "./components/ConsumerStoryModal";
import StoreSetupLaunchpad from "./components/StoreSetupLaunchpad";
import { DEMO_PRODUCTS, DEMO_ORDERS, getDemoOrders } from "./data/demoSeed";

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).substring(2, 15);
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
    if (window.location.hash === "#app") {
      if (localStorage.getItem("elypos_is_demo") === "true") return "app";
      return "landing";
    }
    if (window.location.hash === "#auth" || window.location.hash === "#login") return "auth";
    return "landing";
  });

  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === "undefined") return false;
    const isHidden = localStorage.getItem("elypos_hide_onboarding") === "true";
    const isApp = window.location.hash === "#app" || localStorage.getItem("elypos_is_demo") === "true";
    return isApp && !isHidden;
  });

  // Sync hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === "#app") {
        if (user || isDemoMode) {
          setScreen("app");
        } else {
          setScreen("landing");
          window.location.hash = "#landing";
        }
      } else if (hash === "#auth" || hash === "#login") {
        setScreen("auth");
      } else if (hash === "#landing" || hash === "") {
        setScreen("landing");
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [user, isDemoMode]);

  // Auth route guard: protect #app from unauthenticated visits
  useEffect(() => {
    if (!authLoading && screen === "app" && !user && !isDemoMode) {
      setScreen("landing");
      window.location.hash = "#landing";
    }
  }, [authLoading, screen, user, isDemoMode]);

  // Auto-forward authenticated users to #app unless they explicitly opened #landing
  useEffect(() => {
    if (!authLoading && user && screen === "landing" && window.location.hash !== "#landing") {
      setScreen("app");
      window.location.hash = "#app";
    }
  }, [authLoading, user, screen]);

  const [view, setView] = useState("dashboard"); 
  const [showSettings, setShowSettings] = useState(false);
  const [showLaunchpad, setShowLaunchpad] = useState(() => {
    return localStorage.getItem("elypos_show_launchpad") === "true";
  });
  const settingsRef = useRef(null);

  // Close settings popup when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    };
    if (showSettings) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [showSettings]);
  
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [historySearch, setHistorySearch] = useState("");
  const [dashboardRange, setDashboardRange] = useState('today');
  const [dashboardCustomDate, setDashboardCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [toast, setToast] = useState("");
  const [weights, setWeights] = useState({});

  // --- STORE BRANDING & STORY STATES ---
  const [storeName, setStoreName] = useState(() => {
    if (isDemoMode) return "Fresh Express Demo";
    const saved = localStorage.getItem("elypos_store_name");
    if (saved && saved !== "ElyPOS") return saved;
    if (user?.displayName) return user.displayName;
    return isOwnerAccount ? "Ely's Store" : "My Store";
  });
  const [showConsumerStory, setShowConsumerStory] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [completedReceiptModal, setCompletedReceiptModal] = useState(null);

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

  const viewInfo = {
    dashboard: { title: "Dashboard Overview", text: "View your daily, weekly, or monthly store revenue and performance metrics. Use the date filters to see top-selling items and overall sales trends." },
    pos: { title: "Point of Sale (POS)", text: "Tap items to add them to the cart. For items sold per kg, adjust the quantity to match the exact weight. Add customer details and click 'Complete Transaction' to record the sale." },
    inventory: { title: "Inventory Management", text: "Manage your product catalog. Add new items, edit prices, set categories, and configure per-kg or per-unit pricing for all your products." },
    orders: { title: "Order History", text: "Review all past transactions. You can filter by date or search for a specific customer. Select an order to view its detailed receipt, which you can also download or print." },
    delivery: { title: "Delivery Manifests", text: "Create daily delivery sheets for your riders. Select the pending orders for the day, and a combined manifest will be generated for printing or saving." }
  };

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
        setCustomerCount(docSnap.data().customer_count || 1);
        if (docSnap.data().store_name) {
          setStoreName(docSnap.data().store_name);
          localStorage.setItem("elypos_store_name", docSnap.data().store_name);
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

  // --- POS / CHECKOUT ACTIONS ---
  const addToCart = (product) => {
    const qty = parseFloat(weights[product.id]);
    if (!qty || qty <= 0) return showToast("Enter weight/qty");
    
    const item = { 
      cartId: generateId(), 
      name: product.name, 
      price: product.price, 
      quantity: qty, 
      unit: product.unit, 
      subtotal: product.price * qty 
    };

    setCart([...cart, item]);
    showToast("Added to Cart");
    setWeights({ ...weights, [product.id]: "" });
  };

  const completeOrder = async () => {
    if (cart.length === 0) return showToast("Cart is empty!");
    
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

    if (isDemoMode) {
      const demoOrd = { id: `demo-order-${Date.now()}`, ...newOrder };
      setCompletedOrders(prev => [demoOrd, ...prev]);
      setCustomerCount(prev => prev + 1);
      setCart([]); setCustomer(""); setAddress("");
      setCompletedReceiptModal(demoOrd);
      showToast("Demo Transaction Saved!");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, ordCol()), newOrder);
      await setDoc(settDoc(), { customer_count: increment(1) }, { merge: true });
      setCart([]); setCustomer(""); setAddress("");
      setCompletedReceiptModal({ id: docRef.id, ...newOrder });
      showToast("Transaction Saved!");
    } catch (orderError) {
      showToast("Error: " + orderError.message);
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
  const dashItemsSold = dashOrders.reduce((s, o) => s + (o.items || []).length, 0);

  const dashItemMap = {};
  dashOrders.forEach(o => {
    (o.items || []).forEach(it => {
      const key = it.name || 'Unknown';
      if (!dashItemMap[key]) dashItemMap[key] = { name: key, qty: 0, revenue: 0 };
      dashItemMap[key].qty += (it.quantity || 0);
      dashItemMap[key].revenue += (it.subtotal || 0);
    });
  });
  const dashTopSellers = Object.values(dashItemMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const dashRecentOrders = dashOrders.slice(0, 5);
  const dashRangeLabel = dashboardRange === 'today' ? 'Today' : dashboardRange === 'week' ? 'This Week' : dashboardRange === 'month' ? 'This Month' : dashboardCustomDate;

  // --- HISTORY COMPUTATIONS ---
  const historyFilteredOrders = completedOrders.filter(o => {
    const matchDate = o.raw_date === filterDate;
    const matchName = historySearch.trim() === '' || (o.customer_name || '').toLowerCase().includes(historySearch.trim().toLowerCase());
    return matchDate && matchName;
  });
  const historyFilteredRevenue = historyFilteredOrders.reduce((a, b) => a + (b.total || 0), 0);

  // --- STARTER PRODUCE LOADER FOR NEW STORES ---
  const handleAddStarterProducts = async () => {
    const starters = [
      { name: "Avocado Davao", price: 150, unit: "kg", category: "Fruits", created_at: new Date().toISOString() },
      { name: "Sweet Mango (Carabao)", price: 160, unit: "kg", category: "Fruits", created_at: new Date().toISOString() },
      { name: "Red Onion (Baguio)", price: 140, unit: "kg", category: "Vegetables", created_at: new Date().toISOString() }
    ];

    if (isDemoMode) {
      setFruits(prev => [
        ...starters.map((s, idx) => ({ id: `starter-${Date.now()}-${idx}`, ...s })),
        ...prev
      ]);
      showToast("3 starter produce items loaded!");
      return;
    }

    if (!user) return;
    try {
      for (const item of starters) {
        await addDoc(collection(db, prodCol()), item);
      }
      showToast("3 starter produce items added to catalog!");
    } catch (err) {
      console.error("Error adding starter items:", err);
      showToast("Error adding starter items: " + err.message);
    }
  };

  // --- GUIDED TOUR (driver.js spotlight highlighting) ---
  const startTour = (targetView = null) => {
    const runDriver = (activeView) => {
      let steps = [];
      if (activeView === "pos") {
        steps = [
          { element: '.product-grid', popover: { title: '1. Product Catalog', description: 'Tap produce items to select them. Items support both per-kg weight scale pricing and per-piece counts.', side: "right", align: 'start' } },
          { element: '.weight-selector', popover: { title: '2. Scale Weight Input', description: 'Enter the weight from your digital scale (e.g., 0.85 kg or 2 pcs) and tap Add.', side: "bottom", align: 'start' } },
          { element: '.bill-sidebar', popover: { title: '3. Cart & Customer Info', description: 'Current order items calculate live. Type customer name or delivery address here.', side: "left", align: 'start' } },
          { element: '.btn-checkout', popover: { title: '4. Complete Transaction', description: 'Click to record the sale, increment customer count, and generate a printable digital receipt.', side: "top", align: 'center' } },
          { element: '.nav-links', popover: { title: '5. POS Navigation', description: 'Quickly switch between Register, Analytics Dashboard, Inventory Catalog, Receipts History, and Delivery Sheets.', side: "right", align: 'start' } },
          { element: '.settings-tab-trigger', popover: { title: '6. Settings & Launchpad', description: 'Access store settings, onboarding launchpad, reload terminal, and account actions here.', side: "top", align: 'start' } }
        ];
      } else if (activeView === "dashboard") {
        steps = [
          { element: '.nav-links', popover: { title: 'Navigation', description: 'Switch between Dashboard, POS, Inventory, History, and Delivery here.', side: "right", align: 'start' } },
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
      }

      const activeSteps = steps.filter(step => {
        if (typeof step.element === 'string') {
          const el = document.querySelector(step.element);
          return el !== null && el.getBoundingClientRect().width > 0;
        }
        return true;
      });

      if (activeSteps.length === 0) {
        showToast("Spotlight tour ready on POS screen!");
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
          setScreen("auth");
          window.location.hash = "#auth";
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
          setTimeout(() => {
            startTour("pos");
          }, 350);
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
        onSuccessLogin={() => {
          if (localStorage.getItem("elypos_show_launchpad") === "true") {
            setShowLaunchpad(true);
          }
          setScreen("app");
          window.location.hash = "#app";
        }}
      />
    );
  }

  // --- RENDER MAIN POS TERMINAL ---
  return (
    <div className="pos-layout">
      <aside className="sidebar">
        <div className="brand" title="Active Store">
          <img src="/ely-logo.png" alt="ELY" className="brand-logo-img" />
          <h2 className="brand-text">{storeName}</h2>
        </div>
        <nav className="nav-links">
          <div className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => { setView('dashboard'); setShowSettings(false); }}>
            <span className="nav-icon nav-icon-dashboard"><LayoutDashboard size={18} /></span>
            <span className="nav-text">Dashboard</span>
          </div>
          <div className={`nav-item ${view === 'pos' ? 'active' : ''}`} onClick={() => { setView('pos'); setShowSettings(false); }}>
            <span className="nav-icon nav-icon-pos"><ShoppingCart size={18} /></span>
            <span className="nav-text">POS</span>
          </div>
          <div className={`nav-item ${view === 'inventory' ? 'active' : ''}`} onClick={() => { setView('inventory'); setShowSettings(false); }}>
            <span className="nav-icon nav-icon-inventory"><Package size={18} /></span>
            <span className="nav-text">Inventory</span>
          </div>
          <div className={`nav-item ${view === 'orders' ? 'active' : ''}`} onClick={() => { setView('orders'); setShowSettings(false); }}>
            <span className="nav-icon nav-icon-orders"><ClipboardList size={18} /></span>
            <span className="nav-text">History</span>
          </div>
          <div className={`nav-item ${view === 'delivery' ? 'active' : ''}`} onClick={() => { setView('delivery'); setShowSettings(false); }}>
            <span className="nav-icon nav-icon-delivery"><Truck size={18} /></span>
            <span className="nav-text">Delivery</span>
          </div>
        </nav>

        <div className="sidebar-footer" ref={settingsRef}>
          {/* Collapsible Settings Popover */}
          {showSettings && (
            <div className="settings-popup">
              <div className="settings-popup-header">
                <div className="settings-user-row">
                  <div className="settings-user-avatar">
                    {isDemoMode ? <Sparkles size={16} /> : <UserIcon size={16} />}
                  </div>
                  <div className="settings-user-meta">
                    <span className="settings-user-name">
                      {isDemoMode ? "Demo Mode" : (user?.displayName || user?.email?.split('@')[0] || "Store User")}
                    </span>
                    <span className="settings-user-email">
                      {isDemoMode ? "Guest Sandbox" : user?.email}
                    </span>
                  </div>
                </div>
              </div>

              <div className="settings-store-section">
                <label className="settings-field-label">Store Name</label>
                <div className="settings-input-group">
                  <input
                    type="text"
                    className="settings-input"
                    value={storeName}
                    placeholder="Enter store name..."
                    onChange={e => setStoreName(e.target.value)}
                    onBlur={async () => {
                      const trimmed = storeName.trim() || "My Store";
                      setStoreName(trimmed);
                      localStorage.setItem("elypos_store_name", trimmed);
                      if (!isDemoMode && user) {
                        try {
                          await setDoc(settDoc(), { store_name: trimmed }, { merge: true });
                          showToast("Store name updated");
                        } catch (err) {
                          console.error("Store name update error:", err);
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="settings-divider" />

              <div className="settings-actions-group">
                <button
                  className="settings-action-btn"
                  onClick={() => {
                    setShowSettings(false);
                    setShowLaunchpad(true);
                  }}
                  title="Store Setup Launchpad"
                >
                  <span className="settings-action-icon"><Compass size={15} /></span>
                  <span>Store Setup Launchpad</span>
                </button>

                <button
                  className="settings-action-btn"
                  onClick={() => {
                    setShowSettings(false);
                    startTour("pos");
                  }}
                  title="Interactive Spotlight Tour"
                >
                  <span className="settings-action-icon"><Sparkles size={15} /></span>
                  <span>Interactive Tour (Driver.js)</span>
                </button>

                <button
                  className="settings-action-btn"
                  onClick={() => {
                    if (window.confirm("Reload the POS? Unsaved checkout items will be cleared.")) {
                      window.location.reload();
                    }
                  }}
                  title="Reload App"
                >
                  <span className="settings-action-icon"><RotateCw size={15} /></span>
                  <span>Reload Terminal</span>
                </button>

                <button
                  className="settings-action-btn settings-action-signout"
                  onClick={async () => {
                    setShowSettings(false);
                    await logoutUser();
                    setFruits([]);
                    setCompletedOrders([]);
                    setStoreName("My Store");
                    localStorage.removeItem("elypos_store_name");
                    setScreen("landing");
                    window.location.hash = "#landing";
                  }}
                  title="Sign Out"
                >
                  <span className="settings-action-icon"><LogOut size={15} /></span>
                  <span>{isDemoMode ? "Exit Demo" : "Sign Out"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Bottom Left Settings Tab Trigger */}
          <div
            className={`nav-item settings-tab-trigger ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(prev => !prev)}
            title="Settings & Account"
          >
            <div className="settings-trigger-left">
              <span className="nav-icon nav-icon-settings"><Settings size={18} /></span>
              <span className="nav-text">Settings</span>
            </div>
            <span className="settings-trigger-chevron">
              {showSettings ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
            </span>
          </div>
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
                <h3 className="section-title">{view.toUpperCase()}</h3>
              )}
            </div>
            <div className="header-right-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isDemoMode && (
                <div className="demo-indicator-pill">
                  <Sparkles size={13} className="demo-pill-sparkle" />
                  <span>Demo Sandbox</span>
                  <button
                    className="btn-exit-demo-pill"
                    onClick={async () => {
                      await logoutUser();
                      setFruits([]);
                      setCompletedOrders([]);
                      setStoreName("My Store");
                      localStorage.removeItem("elypos_store_name");
                      setScreen("landing");
                      window.location.hash = "#landing";
                    }}
                    title="Exit Demo to Landing Page"
                  >
                    Exit Demo
                  </button>
                </div>
              )}
              <button className="btn-help-icon" onClick={() => setShowOnboarding(true)} title="Setup Guide & Tour">
                ?
              </button>
              <div className="info-pill"><span className="pill-label">Today</span><span className="pill-value">{new Date().toLocaleDateString()}</span></div>
            </div>
          </div>

          {view === 'pos' && (
            <div className="pos-search-wrapper">
              <input type="text" className="top-search" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <div className="category-filter-bar">
                {['All', ...new Set(fruits.map(f => f.category))].map(cat => (
                  <button key={cat} className={`cat-filter-btn ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>
                ))}
              </div>
            </div>
          )}
        </header>

        {(view === 'pos' || view === 'preorder') && (
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
            ) : (
              fruits.filter(f => (selectedCategory === "All" || f.category === selectedCategory) && f.name.toLowerCase().includes(searchTerm.toLowerCase())).map(f => (
                <div key={f.id} className="food-card">
                  <div className="card-cat">{f.category}</div>
                  <div className="food-img-circle"></div>
                  <h4>{f.name}</h4>
                  <p className="food-price">₱{f.price.toFixed(2)} / {f.unit}</p>
                  <div className="weight-selector">
                    <input type="number" step="any" placeholder={f.unit} value={weights[f.id] || ""} onChange={e => setWeights({...weights, [f.id]: e.target.value})} />
                    <button className="add-btn" onClick={() => addToCart(f)}>Add</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === 'dashboard' && (
          <div className="dashboard-screen">
            {/* Range Selector */}
            <div className="dash-range-bar">
              <div className="dash-range-btns">
                {['today', 'week', 'month'].map(r => (
                  <button
                    key={r}
                    className={`dash-range-btn ${dashboardRange === r ? 'active' : ''}`}
                    onClick={() => setDashboardRange(r)}
                  >
                    {r === 'today' ? 'Today' : r === 'week' ? 'This Week' : 'This Month'}
                  </button>
                ))}
                <div className="dash-custom-wrap">
                  <input
                    type="date"
                    className={`date-input dash-date-pick ${dashboardRange === 'custom' ? 'active' : ''}`}
                    value={dashboardCustomDate}
                    onChange={e => { setDashboardCustomDate(e.target.value); setDashboardRange('custom'); }}
                  />
                </div>
              </div>
              <div className="dash-range-label">Showing: <strong>{dashRangeLabel}</strong></div>
            </div>

            {/* Metric Cards */}
            <div className="dash-metric-grid">
              <div className="dash-metric-card dash-revenue">
                <div className="dash-metric-icon"><Coins size={28} /></div>
                <div className="dash-metric-body">
                  <span className="dash-metric-label">Total Revenue</span>
                  <span className="dash-metric-value">₱{dashRevenue.toFixed(2)}</span>
                </div>
              </div>
              <div className="dash-metric-card dash-tx">
                <div className="dash-metric-icon"><Receipt size={28} /></div>
                <div className="dash-metric-body">
                  <span className="dash-metric-label">Transactions</span>
                  <span className="dash-metric-value">{dashTxCount}</span>
                </div>
              </div>
              <div className="dash-metric-card dash-avg">
                <div className="dash-metric-icon"><TrendingUp size={28} /></div>
                <div className="dash-metric-body">
                  <span className="dash-metric-label">Avg. Order Value</span>
                  <span className="dash-metric-value">₱{dashAvg.toFixed(2)}</span>
                </div>
              </div>
              <div className="dash-metric-card dash-items">
                <div className="dash-metric-icon"><Package size={28} /></div>
                <div className="dash-metric-body">
                  <span className="dash-metric-label">Items Sold</span>
                  <span className="dash-metric-value">{dashItemsSold}</span>
                </div>
              </div>
            </div>

            {/* Bottom Panels */}
            <div className="dash-panels">
              <div className="dash-panel">
                <div className="dash-panel-header">
                  <h4><span className="panel-header-icon panel-icon-trophy"><Trophy size={16} /></span> Top Sellers</h4>
                  <span className="dash-panel-sub">by revenue</span>
                </div>
                {dashTopSellers.length === 0 ? (
                  <div className="dash-empty">No orders in this period.</div>
                ) : (
                  <div className="dash-sellers-list">
                    {dashTopSellers.map((item, i) => (
                      <div key={item.name} className="dash-seller-row">
                        <div className="dash-seller-rank">{i + 1}</div>
                        <div className="dash-seller-info">
                          <span className="dash-seller-name">{item.name}</span>
                          <span className="dash-seller-qty">{item.qty.toFixed(2)} units sold</span>
                        </div>
                        <div className="dash-seller-rev">₱{item.revenue.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="dash-panel">
                <div className="dash-panel-header">
                  <h4><span className="panel-header-icon panel-icon-recent"><Clock size={16} /></span> Recent Orders</h4>
                  <span className="dash-panel-sub">last 5</span>
                </div>
                {dashRecentOrders.length === 0 ? (
                  <div className="dash-empty">No orders in this period.</div>
                ) : (
                  <div className="dash-recent-list">
                    {dashRecentOrders.map(o => (
                      <div key={o.id} className="dash-recent-row">
                        <div className="dash-recent-info">
                          <span className="dash-recent-name">{o.customer_name}</span>
                          <span className="dash-recent-time">{o.display_date} · {o.time}</span>
                        </div>
                        <div className="dash-recent-total">₱{(o.total || 0).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'inventory' && (
          <div className="inventory-screen">
            <div className="inv-actions-top" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0', gap: '15px' }}>
              <div className="pos-search-wrapper" style={{ flex: '1 1 200px', minWidth: 0 }}>
                <input type="text" className="top-search" placeholder="Search inventory..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <div className="category-filter-bar">
                  {['All', ...new Set(fruits.map(f => f.category))].map(cat => (
                    <button key={cat} className={`cat-filter-btn ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>
                  ))}
                </div>
              </div>
            </div>
             <div className="inv-form-card">
              <div className="form-grid">
                <input placeholder="Product Name" value={name} onChange={e => setName(e.target.value)} />
                <input placeholder="Price" type="number" value={price} onChange={e => setPrice(e.target.value)} />
                <input placeholder="Unit (kg/pc)" value={unit} onChange={e => setUnit(e.target.value)} />
                <input placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} />
              </div>
              <button className="btn-save-inv" onClick={addFruit}>+ Add to Inventory</button>
            </div>

            <table className="inv-table">
              <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Unit</th><th>Actions</th></tr></thead>
              <tbody>
                {fruits.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '35px 20px', color: 'var(--text-muted)' }}>
                      No products in your catalog yet. Fill out the form above to add your first product.
                    </td>
                  </tr>
                )}
                {fruits
                  .filter(f => (selectedCategory === "All" || f.category === selectedCategory))
                  .filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(f => (
                  <tr key={f.id}>
                    {editingId === f.id ? (
                      <>
                        <td><input value={editFormData.name} onChange={e=>setEditFormData({...editFormData, name:e.target.value})} /></td>
                        <td><input value={editFormData.category} onChange={e=>setEditFormData({...editFormData, category:e.target.value})} /></td>
                        <td><input value={editFormData.price} onChange={e=>setEditFormData({...editFormData, price:e.target.value})} /></td>
                        <td><input value={editFormData.unit} onChange={e=>setEditFormData({...editFormData, unit:e.target.value})} /></td>
                        <td><button className="btn-edit-row" onClick={()=>saveEdit(f.id)}>Save</button></td>
                      </>
                    ) : (
                      <>
                        <td>{f.name}</td><td>{f.category}</td><td>₱{f.price.toFixed(2)}</td><td>{f.unit}</td>
                        <td>
                          <button className="btn-edit-row" onClick={()=>{setEditingId(f.id); setEditFormData(f)}}>Edit</button>
                          <button onClick={() => deleteFruit(f.id)} className="text-del" style={{marginLeft:'10px'}}>Delete</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
                    <p>Point of Sale Terminal</p>
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
                      <button className="btn-delete-order" onClick={() => deleteOrder(o.id)} title="Delete Order"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
                <div className="receipt-divider"></div>
                <div className="receipt-footer"><p>Thank you for shopping at {storeName}!</p></div>
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
                         <strong>{o.customer_name} {o.status === 'Delivered' && <CheckCircle2 size={16} className="status-delivered-icon" />}</strong>
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
                  <h2>ELY'S RIDER MANIFEST</h2>
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
      </main>

      <aside className="bill-sidebar">
  <div className="bill-header">
    <div className="order-tag">Checkout</div>
    <input placeholder="Customer Name" value={customer} onChange={e => setCustomer(e.target.value)} className="customer-input" />
    <input placeholder="Address (Type '4' for Phase 4)" value={address} onChange={e => setAddress(e.target.value)} className="customer-input" />
  </div>
  <div className="bill-items">
    {cart.map(item => (
      <div key={item.cartId} className="bill-row">
        <div className="bill-item-info"><strong>{item.name}</strong><p>{item.quantity}{item.unit}</p></div>
        <div className="bill-item-right">
          <span className="bill-item-price">₱{item.subtotal.toFixed(2)}</span>
          <button className="btn-remove-item" onClick={() => setCart(cart.filter(c => c.cartId !== item.cartId))} title="Remove item"><X size={14} /></button>
        </div>
      </div>
    ))}
  </div>
  <div className="bill-footer">
    <div className="total-line"><span>Total:</span><span>₱{cart.reduce((a, i) => a + i.subtotal, 0).toFixed(2)}</span></div>
    <button className="btn-navy" onClick={() => setCart([])}>Clear</button>
    <button className="btn-checkout" onClick={completeOrder}>Complete Transaction</button>
  </div>
</aside>
      {completedReceiptModal && (
        <div className="parser-modal-overlay" onClick={() => setCompletedReceiptModal(null)}>
          <div className="parser-modal-content receipt-popup-modal" onClick={e => e.stopPropagation()}>
            <div className="receipt-popup-header">
              <div className="receipt-popup-badge">
                <CheckCircle2 size={18} color="#10b981" />
                <span>Transaction Complete</span>
              </div>
              <button className="receipt-popup-close" onClick={() => setCompletedReceiptModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div id={`instant-receipt-${completedReceiptModal.id}`} className="instant-receipt-paper">
              <div className="receipt-brand-header">
                <h3>{storeName.toUpperCase()}</h3>
                <p>Official Sales Receipt</p>
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
                <p>Thank you for shopping at {storeName}!</p>
              </div>
            </div>

            <div className="receipt-popup-actions">
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

      {showInfoModal && (
        <div className="parser-modal-overlay" onClick={() => setShowInfoModal(false)}>
          <div className="parser-modal-content info-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px', color: 'var(--primary)' }}><Info size={40} /></div>
            <h3 style={{ marginBottom: '10px', color: 'var(--secondary)' }}>{viewInfo[view]?.title}</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '15px', marginBottom: '25px' }}>
              {viewInfo[view]?.text}
            </p>
            <button className="btn-navy" style={{ width: '100%', padding: '12px', borderRadius: '10px' }} onClick={() => setShowInfoModal(false)}>
              Got it!
            </button>
          </div>
        </div>
      )}

      <StoreSetupLaunchpad
        isOpen={showLaunchpad}
        onClose={() => {
          setShowLaunchpad(false);
          localStorage.removeItem("elypos_show_launchpad");
        }}
        storeName={storeName}
        onUpdateStoreName={async (newName) => {
          setStoreName(newName);
          localStorage.setItem("elypos_store_name", newName);
          if (!isDemoMode && user) {
            try {
              await setDoc(settDoc(), { store_name: newName }, { merge: true });
            } catch (e) {
              console.error(e);
            }
          }
          showToast(`Store renamed to ${newName}!`);
        }}
        onAddStarterProducts={handleAddStarterProducts}
        onStartTour={() => {
          setShowLaunchpad(false);
          localStorage.removeItem("elypos_show_launchpad");
          startTour("pos");
        }}
        onNavigateView={(newView) => setView(newView)}
      />

      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
        onStartTour={startTour} 
      />

      <ConsumerStoryModal 
        isOpen={showConsumerStory}
        onClose={() => setShowConsumerStory(false)}
        currentStoreName={storeName}
        onUpdateStoreName={(newName) => {
          setStoreName(newName);
          localStorage.setItem("elypos_store_name", newName);
          showToast(`Store renamed to ${newName}!`);
        }}
        onNavigateView={(newView) => setView(newView)}
        onAddSampleProduct={(sample) => {
          const newProd = {
            id: `sample-${Date.now()}`,
            name: sample.name,
            price: sample.price,
            unit: sample.unit,
            category: sample.category,
            created_at: new Date().toISOString()
          };
          setFruits(prev => [newProd, ...prev]);
          showToast(`Added ${sample.name} to Catalog!`);
        }}
        onOpenAuth={() => {
          setScreen("auth");
          window.location.hash = "#auth";
        }}
      />

      {toast && <div className="toast-notification">{toast}</div>}
    </div>
  );
}


export default App;