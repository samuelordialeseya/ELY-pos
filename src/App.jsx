import { useState, useEffect } from "react";
import html2canvas from "html2canvas";
import { db } from './firebaseClient';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  getDocs,
  writeBatch
} from "firebase/firestore";
import "./App.css";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).substring(2, 15);
};

function App() {
  const [view, setView] = useState("dashboard"); 
  
  // --- CLOUD DATA STATES ---
  const [fruits, setFruits] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  // const [preOrders, setPreOrders] = useState([]); // Pre-order feature removed
  const [customerCount, setCustomerCount] = useState(1);

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
  // const [preOrderCustomer, setPreOrderCustomer] = useState(""); // Pre-order feature removed 
  // const [preOrderCart, setPreOrderCart] = useState([]); // Pre-order feature removed 
  
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [historySearch, setHistorySearch] = useState("");
  const [dashboardRange, setDashboardRange] = useState('today');
  const [dashboardCustomDate, setDashboardCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [toast, setToast] = useState("");
  const [weights, setWeights] = useState({});

  // --- PARSER STATES ---
  const [showParserModal, setShowParserModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const viewInfo = {
    dashboard: { title: "Dashboard Overview", text: "View your daily, weekly, or monthly store revenue and performance metrics. Use the date filters to see top-selling items and overall sales trends." },
    pos: { title: "Point of Sale (POS)", text: "Tap items to add them to the cart. For items sold per kg, adjust the quantity to match the exact weight. Add customer details and click 'Complete Transaction' to record the sale." },
    inventory: { title: "Inventory Management", text: "Manage your product catalog. Add new items, edit prices, or delete outdated products. Use the 'Import from Price List' button to automatically update prices using the owner's daily text message." },
    orders: { title: "Order History", text: "Review all past transactions. You can filter by date or search for a specific customer. Select an order to view its detailed receipt, which you can also download or print." },
    delivery: { title: "Delivery Manifests", text: "Create daily delivery sheets for your riders. Select the pending orders for the day, and a combined manifest will be generated for printing or saving." }
  };
  const [parserInputText, setParserInputText] = useState("");
  const [parsedResults, setParsedResults] = useState(null);
  const [activeParserTab, setActiveParserTab] = useState("increases"); 
  const [selectedParsedItems, setSelectedParsedItems] = useState({});

  // --- 1. INITIAL DATA LOADING (Firestore real-time listeners) ---
  useEffect(() => {
    // 1. Products listener (ordered by name)
    const qProducts = query(collection(db, "products"), orderBy("name"));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const prodList = [];
      snapshot.forEach((doc) => {
        prodList.push({ id: doc.id, ...doc.data() });
      });
      setFruits(prodList);
    }, (error) => {
      console.error("Products listener error:", error);
    });

    // 2. Orders listener (ordered by created_at desc)
    const qOrders = query(collection(db, "orders"), orderBy("created_at", "desc"));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const orderList = [];
      snapshot.forEach((doc) => {
        orderList.push({ id: doc.id, ...doc.data() });
      });
      setCompletedOrders(orderList);
    }, (error) => {
      console.error("Orders listener error:", error);
    });

    // Pre-order listener removed (feature deprecated)

    // 4. App settings listener (global)
    const unsubSettings = onSnapshot(doc(db, "app_settings", "global"), (docSnap) => {
      if (docSnap.exists()) {
        setCustomerCount(docSnap.data().customer_count);
      }
    }, (error) => {
      console.error("Settings listener error:", error);
    });

    return () => {
      unsubProducts();
      unsubOrders();
      // unsubPreOrders(); // Pre-order listener removed
      unsubSettings();
    };
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2000); };

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
      try {
        await addDoc(collection(db, 'products'), newFruit);
        setName(""); setPrice(""); setUnit(""); setCategory("");
        showToast("Added to Inventory");
      } catch (error) {
        showToast("Error: " + error.message);
      }
    }
  };

  const deleteFruit = async (id) => {
    try {
      await deleteDoc(doc(db, 'products', id));
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
    try {
      await updateDoc(doc(db, 'products', id), updates);
      setEditingId(null); 
      showToast("Updated!");
    } catch (error) {
      showToast("Error: " + error.message);
    }
  };

  // --- PARSER ACTIONS ---
  const runParser = () => {
    if (!parserInputText.trim()) return;
    
    // Robust Matching Logic for Out-of-order words and Typos
    const getSortedTokensStr = (n) => n.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean).sort().join('');
    
    const levenshtein = (a, b) => {
      if (a.length === 0) return b.length;
      if (b.length === 0) return a.length;
      const matrix = Array.from({ length: b.length + 1 }, () => new Array(a.length + 1).fill(0));
      for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
      for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
      for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
          if (b[j - 1] === a[i - 1]) matrix[j][i] = matrix[j - 1][i - 1];
          else matrix[j][i] = Math.min(matrix[j - 1][i - 1] + 1, matrix[j][i - 1] + 1, matrix[j - 1][i] + 1);
        }
      }
      return matrix[b.length][a.length];
    };

    const isMatch = (rawName, dbName) => {
      const sortedRaw = getSortedTokensStr(rawName);
      const sortedDb = getSortedTokensStr(dbName);
      if (sortedRaw === sortedDb) return true;
      
      // If not an exact token match, check typo distance
      if (Math.abs(sortedRaw.length - sortedDb.length) > 2) return false;
      const dist = levenshtein(sortedRaw, sortedDb);
      const maxAllowed = sortedRaw.length > 5 ? 2 : 1;
      return dist <= maxAllowed;
    };

    const results = {
      increases: [],
      decreases: [],
      unchanged: [],
      newItems: [],
      warnings: [],
      missing: []
    };

    // Stage 1: Filter lines
    const lines = parserInputText.split('\n').filter(line => line.includes('•')).map(line => line.trim());
    
    const parsedItemsMap = {};

    lines.forEach((line, index) => {
      // Stage 2: Regex Extraction
      // Look for everything before a separator (dash, multiple dots, single dot, or just space) and a number
      const match = line.match(/^(.+?)(?:\s*-\s*|\s*\.\.+\s*|\s*\.\s*|\s+)(\d+)/);
      
      if (match) {
        const rawName = match[1].replace(/^[•\s]+/, '').trim();
        const price = parseFloat(match[2]);

        // Stage 3 & 4: Normalize & Classify
        const matchingItems = fruits.filter(f => isMatch(rawName, f.name));
        let existingItem = null;

        if (matchingItems.length === 1) {
          existingItem = matchingItems[0];
        } else if (matchingItems.length > 1) {
          // Handle items with the same name but different units (e.g., okra kg vs okra tali)
          const lineLower = line.toLowerCase();
          existingItem = matchingItems.find(f => lineLower.includes(f.unit.toLowerCase()));
          if (!existingItem) existingItem = matchingItems[0]; // fallback
        }

        if (existingItem) {
          parsedItemsMap[existingItem.id] = true;
          if (price > existingItem.price) {
            results.increases.push({ ...existingItem, newPrice: price, rawLine: line, id: existingItem.id });
          } else if (price < existingItem.price) {
            results.decreases.push({ ...existingItem, newPrice: price, rawLine: line, id: existingItem.id });
          } else {
            results.unchanged.push({ ...existingItem, newPrice: price, rawLine: line, id: existingItem.id });
          }
        } else {
          // Intelligent unit guessing for new items
          let guessedUnit = 'kg'; // Default fallback
          const unitMatch = line.toLowerCase().match(/\/\s*([a-z]+)/);
          if (unitMatch && unitMatch[1] && unitMatch[1] !== 'pesos') {
            guessedUnit = unitMatch[1];
          } else {
            const lineLower = line.toLowerCase();
            if (lineLower.includes('tali')) guessedUnit = 'tali';
            else if (lineLower.includes('tray')) guessedUnit = 'tray';
            else if (lineLower.includes('bundle')) guessedUnit = 'bundle';
            else if (lineLower.includes('pcs')) guessedUnit = 'pcs';
            else if (lineLower.includes('pc')) guessedUnit = 'pc';
          }

          results.newItems.push({ 
            id: `new_${index}`, 
            name: rawName, 
            newPrice: price, 
            unit: guessedUnit,
            rawLine: line 
          });
        }
      } else {
        // Warning: Bullet found but no price extracted
        results.warnings.push({ id: `warn_${index}`, rawLine: line });
      }
    });

    // Find Missing Items
    fruits.forEach(f => {
      if (!parsedItemsMap[f.id]) {
        results.missing.push({ ...f, id: f.id });
      }
    });

    // Initialize all parsed non-warning/non-missing items as selected
    const initialSelected = {};
    [...results.increases, ...results.decreases, ...results.newItems, ...results.unchanged].forEach(item => {
      initialSelected[item.id] = true;
    });

    setParsedResults(results);
    setSelectedParsedItems(initialSelected);
    
    // Auto-switch tab to the first one with items
    if (results.increases.length > 0) setActiveParserTab('increases');
    else if (results.decreases.length > 0) setActiveParserTab('decreases');
    else if (results.newItems.length > 0) setActiveParserTab('newItems');
    else if (results.warnings.length > 0) setActiveParserTab('warnings');
    else if (results.missing.length > 0) setActiveParserTab('missing');
    else setActiveParserTab('unchanged');
  };

  const applyParsedUpdates = async () => {
    if (!parsedResults) return;

    try {
      const batch = writeBatch(db);
      let updateCount = 0;
      let insertCount = 0;

      // Handle Increases, Decreases (do not update Unchanged to save database writes)
      const allExistingToUpdate = [...parsedResults.increases, ...parsedResults.decreases];
      allExistingToUpdate.forEach(item => {
        if (selectedParsedItems[item.id]) {
          const docRef = doc(db, 'products', item.id);
          batch.update(docRef, { price: item.newPrice });
          updateCount++;
        }
      });

      // Handle New Items
      const newItemsRef = collection(db, 'products');
      parsedResults.newItems.forEach(item => {
        if (selectedParsedItems[item.id]) {
          const newDocRef = doc(newItemsRef); // Auto-generate ID
          batch.set(newDocRef, {
            name: item.name,
            price: item.newPrice,
            unit: item.unit, // Use the guessed unit
            category: 'Uncategorized', // Default
            created_at: new Date().toISOString()
          });
          insertCount++;
        }
      });

      await batch.commit();
      
      showToast(`Applied ${updateCount} updates and ${insertCount} new items!`);
      setShowParserModal(false);
      setParsedResults(null);
      setParserInputText("");
      
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

    try {
      await addDoc(collection(db, 'orders'), newOrder);
      await updateDoc(doc(db, 'app_settings', 'global'), { customer_count: customerCount + 1 });
      setCart([]); setCustomer(""); setAddress("");
      showToast("Transaction Saved!");
    } catch (orderError) {
      showToast("Error: " + orderError.message);
    }
  };

  const deleteOrder = async (id) => {
    if(!window.confirm("Delete this order record permanently?")) return;
    try {
      await deleteDoc(doc(db, 'orders', id));
      showToast("Order Deleted");
    } catch (error) {
      showToast("Error: " + error.message);
    }
  };

  const toggleDeliveryStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "Delivered" ? "Pending" : "Delivered";
    try {
      await updateDoc(doc(db, 'orders', id), { status: newStatus });
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

  // --- GUIDED TOUR ---
  const startTour = () => {
    let steps = [];
    if (view === "dashboard") {
      steps = [
        { element: '.nav-links', popover: { title: 'Navigation', description: 'Switch between Dashboard, POS, Inventory, History, and Delivery here.', side: "right", align: 'start' } },
        { element: '.dash-range-btns', popover: { title: 'Date Filter', description: 'Select the time period you want to analyze.', side: "bottom", align: 'start' } },
        { element: '.dash-metric-grid', popover: { title: 'Key Metrics', description: 'Get a quick overview of your total revenue, transaction counts, and average order values.', side: "bottom", align: 'start' } },
        { element: '.dash-panels', popover: { title: 'Deep Insights', description: 'See your top selling products and a list of the most recent transactions.', side: "top", align: 'start' } },
      ];
    } else if (view === "pos") {
      steps = [
        { element: '.top-search', popover: { title: 'Search Items', description: 'Type to quickly find a specific product by its name.', side: "bottom", align: 'start' } },
        { element: '.category-filter-bar', popover: { title: 'Filter by Category', description: 'Tap a category to narrow down the list of products.', side: "bottom", align: 'start' } },
        { element: '.product-grid', popover: { title: 'Product Catalog', description: 'Tap a product to add it to the cart. For items sold by weight, adjust the quantity first.', side: "right", align: 'start' } },
        { element: '.bill-sidebar', popover: { title: 'Current Cart', description: 'Review the items in the cart, add customer details, and hit Checkout to complete the order.', side: "left", align: 'start' } },
      ];
    } else if (view === "inventory") {
      steps = [
        { element: '.top-search', popover: { title: 'Search Inventory', description: 'Quickly find an item to edit or delete.', side: "bottom", align: 'start' } },
        { element: '.btn-save-inv', popover: { title: 'Price List Importer', description: 'Use the automated parser to import the daily price text message from the owner.', side: "left", align: 'start' } },
        { element: '.inv-form-card', popover: { title: 'Add New Item', description: 'Fill in the details to add a completely new product to your catalog.', side: "bottom", align: 'start' } },
        { element: '.inv-table', popover: { title: 'Product List', description: 'View, edit, or delete existing products. Changes here will reflect immediately on the POS.', side: "top", align: 'start' } },
      ];
    } else if (view === "orders") {
      steps = [
        { element: '.orders-controls', popover: { title: 'History Filters', description: 'Search for specific customers or select a date to review past orders.', side: "bottom", align: 'start' } },
        { element: '.history-card', popover: { title: 'Digital Receipts', description: 'View detailed receipts for each order. You can download them or delete records if a mistake was made.', side: "top", align: 'start' } },
      ];
    } else if (view === "delivery") {
      steps = [
        { element: '.delivery-step-select', popover: { title: 'Pending Orders', description: 'Select the orders you want to include in today\'s delivery manifest.', side: "right", align: 'start' } },
        { element: '.manifest-sheet', popover: { title: 'Rider Manifest', description: 'A beautifully formatted, print-ready manifest will be generated here based on your selection.', side: "left", align: 'start' } },
      ];
    }

    const tour = driver({
      showProgress: true,
      animate: true,
      steps: steps,
      popoverClass: 'driverjs-theme'
    });
    
    tour.drive();
  };

  // --- RENDER ---
  return (
    <div className="pos-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo-box">FBE</div>
          <h2 className="brand-text">FreshByEly</h2>
        </div>
        <nav className="nav-links">
          <div className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </div>
          <div className={`nav-item ${view === 'pos' ? 'active' : ''}`} onClick={() => setView('pos')}>
            <span className="nav-icon">🛒</span>
            <span className="nav-text">POS</span>
          </div>
          <div className={`nav-item ${view === 'inventory' ? 'active' : ''}`} onClick={() => setView('inventory')}>
            <span className="nav-icon">📦</span>
            <span className="nav-text">Inventory</span>
          </div>
          <div className={`nav-item ${view === 'orders' ? 'active' : ''}`} onClick={() => setView('orders')}>
            <span className="nav-icon">📋</span>
            <span className="nav-text">History</span>
          </div>
          <div className={`nav-item ${view === 'delivery' ? 'active' : ''}`} onClick={() => setView('delivery')}>
            <span className="nav-icon">🚚</span>
            <span className="nav-text">Delivery</span>
          </div>
        </nav>
        <div className="sidebar-footer">
          <button 
            onClick={() => {
              if (window.confirm("⚠️ Are you sure you want to reload the app? Any unsaved items in your checkout cart will be completely lost.")) {
                window.location.reload();
              }
            }} 
            className="btn-reload" 
            title="Reload App"
          >
            <span className="reload-icon">🔄</span>
            <span className="reload-text">Reload App</span>
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
                    {(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; })()}, FreshByEly! 👋
                  </h2>
                  <p className="dash-greeting-sub">Here's your store overview.</p>
                </div>
              ) : (
                <h3 className="section-title">{view.toUpperCase()}</h3>
              )}
            </div>
            <div className="header-right-info" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button className="btn-help-icon" onClick={startTour} title="Guided Tour">
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
            {fruits.filter(f => (selectedCategory === "All" || f.category === selectedCategory) && f.name.toLowerCase().includes(searchTerm.toLowerCase())).map(f => (
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
            ))}
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
                <div className="dash-metric-icon">💰</div>
                <div className="dash-metric-body">
                  <span className="dash-metric-label">Total Revenue</span>
                  <span className="dash-metric-value">₱{dashRevenue.toFixed(2)}</span>
                </div>
              </div>
              <div className="dash-metric-card dash-tx">
                <div className="dash-metric-icon">🧾</div>
                <div className="dash-metric-body">
                  <span className="dash-metric-label">Transactions</span>
                  <span className="dash-metric-value">{dashTxCount}</span>
                </div>
              </div>
              <div className="dash-metric-card dash-avg">
                <div className="dash-metric-icon">📈</div>
                <div className="dash-metric-body">
                  <span className="dash-metric-label">Avg. Order Value</span>
                  <span className="dash-metric-value">₱{dashAvg.toFixed(2)}</span>
                </div>
              </div>
              <div className="dash-metric-card dash-items">
                <div className="dash-metric-icon">📦</div>
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
                  <h4>🏆 Top Sellers</h4>
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
                  <h4>🕐 Recent Orders</h4>
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
              <button className="btn-save-inv" style={{ background: 'var(--success)', whiteSpace: 'nowrap', width: 'auto', flexShrink: 0 }} onClick={() => setShowParserModal(true)}>
                Import from Price List
              </button>
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

            {/* PARSER MODAL */}
            {showParserModal && (
              <div className="parser-modal-overlay">
                <div className="parser-modal-content">
                  <div className="parser-modal-header">
                    <h3>Import Daily Price List</h3>
                    <button className="parser-close-btn" onClick={() => { setShowParserModal(false); setParsedResults(null); setParserInputText(""); }}>✕</button>
                  </div>
                  
                  {!parsedResults ? (
                    <div className="parser-input-step">
                      <p>Paste the owner's daily price broadcast below. The local parser will automatically extract items and prices.</p>
                      <textarea 
                        className="parser-textarea" 
                        placeholder="Paste text here..."
                        value={parserInputText}
                        onChange={(e) => setParserInputText(e.target.value)}
                      />
                      <button className="btn-parse-run" onClick={runParser}>🚀 Parse Text</button>
                    </div>
                  ) : (
                    <div className="parser-review-step">
                      <div className="parser-tabs">
                        {['increases', 'decreases', 'newItems', 'warnings', 'missing'].map(tabKey => (
                          <button 
                            key={tabKey}
                            className={`parser-tab-btn ${activeParserTab === tabKey ? 'active' : ''}`}
                            onClick={() => setActiveParserTab(tabKey)}
                          >
                            {tabKey.replace('newItems', 'New').charAt(0).toUpperCase() + tabKey.replace('newItems', 'New').slice(1)} 
                            <span className="parser-badge">{parsedResults[tabKey].length}</span>
                          </button>
                        ))}
                      </div>

                      <div className="parser-table-container">
                        <table className="parser-table">
                          <thead>
                            <tr>
                              <th>Select</th>
                              <th>Product</th>
                              {(activeParserTab === 'newItems' || activeParserTab === 'missing') && <th>Unit</th>}
                              {activeParserTab !== 'warnings' && activeParserTab !== 'missing' && <th>New Price</th>}
                              {(activeParserTab === 'increases' || activeParserTab === 'decreases' || activeParserTab === 'missing') && <th>{activeParserTab === 'missing' ? 'Current Price' : 'Old Price'}</th>}
                              {activeParserTab === 'warnings' && <th>Raw Line</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {parsedResults[activeParserTab].map((item, idx) => (
                              <tr key={item.id || idx} className={
                                activeParserTab === 'increases' ? 'row-increase' : 
                                activeParserTab === 'decreases' ? 'row-decrease' : 
                                activeParserTab === 'warnings' ? 'row-warning' : ''
                              }>
                                <td>
                                  {activeParserTab !== 'warnings' && activeParserTab !== 'missing' ? (
                                    <input 
                                      type="checkbox" 
                                      checked={!!selectedParsedItems[item.id]}
                                      onChange={() => setSelectedParsedItems(prev => ({...prev, [item.id]: !prev[item.id]}))}
                                    />
                                  ) : (
                                    <span>-</span>
                                  )}
                                </td>
                                <td>{item.name || "Unknown"}</td>
                                {(activeParserTab === 'newItems' || activeParserTab === 'missing') && <td><span style={{color: 'var(--primary)', fontWeight: 'bold'}}>{item.unit}</span></td>}
                                {activeParserTab !== 'warnings' && activeParserTab !== 'missing' && <td>₱{item.newPrice}</td>}
                                {(activeParserTab === 'increases' || activeParserTab === 'decreases' || activeParserTab === 'missing') && <td>₱{item.price}</td>}
                                {activeParserTab === 'warnings' && <td><code>{item.rawLine}</code></td>}
                              </tr>
                            ))}
                            {parsedResults[activeParserTab].length === 0 && (
                              <tr>
                                <td 
                                  colSpan={
                                    activeParserTab === 'increases' || activeParserTab === 'decreases' ? 5 :
                                    activeParserTab === 'newItems' || activeParserTab === 'missing' ? 4 :
                                    activeParserTab === 'warnings' ? 3 : 4
                                  } 
                                  style={{textAlign: 'center', padding: '20px', color: 'var(--text-muted)'}}
                                >
                                  No items in this category.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="parser-modal-footer">
                        <button className="btn-apply-parsed" onClick={applyParsedUpdates}>
                          ✓ Apply Selected Updates
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <table className="inv-table">
              <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Unit</th><th>Actions</th></tr></thead>
              <tbody>
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
                    <button className="history-search-clear" onClick={() => setHistorySearch('')}>✕</button>
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
                   <h3>FRESH BY ELY FRUITS &amp; VEGGIES</h3>
                   <p>Fresh from the farm to your table.</p>
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
                      <button className="btn-screenshot" onClick={() => downloadReceipt(o.id)}>📸</button>
                      <button className="btn-delete-order" onClick={() => deleteOrder(o.id)}>🗑️</button>
                    </div>
                  </div>
                </div>
                <div className="receipt-divider"></div>
                <div className="receipt-footer"><p>Thank you for shopping at Fresh By Ely!</p></div>
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
                         <strong>{o.customer_name} {o.status === 'Delivered' && "✅"}</strong>
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
                {selectedOrderIds.length > 0 && <button className="btn-download-manifest" onClick={captureManifest}>📸 Download Image</button>}
              </div>
              <div id="manifest-area-capture" className="manifest-sheet">
                <div className="manifest-header">
                  <h2>FRESH BY ELY RIDER MANIFEST</h2>
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
          <button className="btn-remove-item" onClick={() => setCart(cart.filter(c => c.cartId !== item.cartId))}>✕</button>
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
      {showInfoModal && (
        <div className="parser-modal-overlay" onClick={() => setShowInfoModal(false)}>
          <div className="parser-modal-content info-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '30px' }}>
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>ℹ️</div>
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
      {toast && <div className="toast-notification">{toast}</div>}
    </div>
  );
}

export default App;