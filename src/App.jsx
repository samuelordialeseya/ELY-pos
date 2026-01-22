import { useState, useEffect } from "react";
import html2canvas from "html2canvas";
import "./App.css";

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).substring(2, 15);
};

function App() {
  const [view, setView] = useState("pos"); 
  const [fruits, setFruits] = useState(() => JSON.parse(localStorage.getItem("fruits")) || []);
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("cart")) || []);
  const [completedOrders, setCompletedOrders] = useState(() => JSON.parse(localStorage.getItem("completedOrders")) || []);
  
  // Track Customer Queue Number
  const [customerCount, setCustomerCount] = useState(() => {
    const saved = localStorage.getItem("customerCount");
    return saved ? parseInt(saved) : 1;
  });

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("Fruits");
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", price: "", unit: "", category: "" });

  const [customer, setCustomer] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState("");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [weights, setWeights] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Dynamic Categories from Dad's Inventory
  const dynamicCategories = ["All", ...new Set(fruits.map(f => f.category))];

  useEffect(() => { localStorage.setItem("fruits", JSON.stringify(fruits)); }, [fruits]);
  useEffect(() => { localStorage.setItem("cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("completedOrders", JSON.stringify(completedOrders)); }, [completedOrders]);
  useEffect(() => { localStorage.setItem("customerCount", customerCount); }, [customerCount]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2000); };

  const deleteOrder = (orderId) => {
    if (window.confirm("Delete this order record?")) {
      setCompletedOrders(prev => prev.filter(order => order.id !== orderId));
      showToast("Order Deleted");
    }
  };

  const downloadReceipt = (orderId) => {
    const element = document.getElementById(`receipt-${orderId}`);
    const noPrintElements = element.querySelectorAll('.no-print');
    noPrintElements.forEach(el => el.style.display = 'none');

    html2canvas(element, { backgroundColor: "#ffffff", scale: 2 }).then((canvas) => {
      const link = document.createElement("a");
      link.download = `Daddy_Ely_Receipt-${orderId.substring(0,5)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      noPrintElements.forEach(el => el.style.display = 'flex');
      showToast("PNG Downloaded");
    });
  };

  const addFruit = (e) => {
    if (e) e.preventDefault();
    if (name && price && unit) {
      setFruits([...fruits, { id: generateId(), name, price: parseFloat(price), unit, category }]);
      setName(""); setPrice(""); setUnit(""); setCategory("Fruits");
      showToast("Added to Inventory");
    }
  };

  const saveEdit = (id) => {
    setFruits(fruits.map(f => f.id === id ? { ...f, ...editFormData, price: parseFloat(editFormData.price) } : f));
    setEditingId(null);
    showToast("Product updated");
  };

  const addToCart = (product) => {
    const qty = parseFloat(weights[product.id]);
    if (!qty || qty <= 0) return showToast("Enter weight/qty");
    setCart([...cart, { 
      cartId: generateId(), 
      productId: product.id, 
      name: product.name, 
      price: product.price, 
      quantity: qty, 
      unit: product.unit, 
      subtotal: product.price * qty 
    }]);
    setWeights({ ...weights, [product.id]: "" });
    showToast(`Added ${qty} ${product.unit}`);
  };

  const completeOrder = () => {
    if (cart.length === 0) return showToast("Cart is empty!");
    const total = cart.reduce((acc, i) => acc + i.subtotal, 0);
    const now = new Date();
    setCompletedOrders([{ 
        id: generateId(), 
        customer: customer || `Customer #${customerCount}`, 
        items: [...cart], 
        total, 
        rawDate: now.toISOString().split('T')[0], 
        displayDate: now.toLocaleDateString(), 
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }, ...completedOrders]);
    
    setCustomerCount(prev => prev + 1);
    setCart([]); setCustomer("");
    showToast("Order Saved!");
  };

  const dailyOrders = completedOrders.filter(o => o.rawDate === filterDate);
  const dailyRevenue = dailyOrders.reduce((acc, o) => acc + o.total, 0);
  
  const filteredFruits = fruits.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const todayDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
  });

  return (
    <div className="pos-layout">
      <aside className="sidebar">
        <div className="brand"><div className="logo-box">DE</div><h2>Daddy Ely's</h2></div>
        <nav className="nav-links">
          <div className={`nav-item ${view === 'pos' ? 'active' : ''}`} onClick={() => setView('pos')}>🛒 POS</div>
          <div className={`nav-item ${view === 'inventory' ? 'active' : ''}`} onClick={() => setView('inventory')}>📦 Inventory</div>
          <div className={`nav-item ${view === 'orders' ? 'active' : ''}`} onClick={() => setView('orders')}>📋 History</div>
        </nav>
      </aside>

      <main className="main-viewport">
        <header className="top-header">
          <div className="header-left">
            {view === 'pos' ? (
              <div className="pos-search-wrapper">
                <input type="text" className="top-search" placeholder="Search stock..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <div className="category-filter-bar">
                  {dynamicCategories.map(cat => (
                    <button key={cat} className={`cat-filter-btn ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>
                  ))}
                </div>
              </div>
            ) : <h3 className="section-title">{view === 'inventory' ? 'Inventory Management' : 'Sales History'}</h3>}
          </div>

          <div className="header-right-info">
            <div className="info-pill">
              <span className="pill-label">Today</span>
              <span className="pill-value">{todayDate}</span>
            </div>
            <div className="info-pill queue-pill">
              <span className="pill-label">Serving</span>
              <span className="pill-value">#{customerCount}</span>
            </div>
          </div>
        </header>

        {view === 'pos' && (
          <div className="product-grid">
            {filteredFruits.map(f => (
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

        {view === 'inventory' && (
          <div className="inventory-screen">
            <div className="inv-form-card">
              <div className="form-grid">
                <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                <input placeholder="Price" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} />
                <input placeholder="Unit" value={unit} onChange={e => setUnit(e.target.value)} />
                <input placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} />
              </div>
              <button type="button" className="btn-save-inv" onClick={addFruit}>+ Add to Stock</button>
            </div>
            <table className="inv-table">
              <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Unit</th><th>Actions</th></tr></thead>
              <tbody>
                {fruits.map(f => (
                  <tr key={f.id}>
                    {editingId === f.id ? (
                      <>
                        <td><input className="edit-input" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} /></td>
                        <td><input className="edit-input" value={editFormData.category} onChange={e => setEditFormData({...editFormData, category: e.target.value})} /></td>
                        <td><input className="edit-input" type="number" step="any" value={editFormData.price} onChange={e => setEditFormData({...editFormData, price: e.target.value})} /></td>
                        <td><input className="edit-input" value={editFormData.unit} onChange={e => setEditFormData({...editFormData, unit: e.target.value})} /></td>
                        <td><button className="btn-edit-row" onClick={() => saveEdit(f.id)}>Save</button></td>
                      </>
                    ) : (
                      <>
                        <td>{f.name}</td><td>{f.category}</td><td>₱{f.price.toFixed(2)}</td><td>{f.unit}</td>
                        <td>
                          <button className="btn-edit-row" onClick={() => { setEditingId(f.id); setEditFormData(f); }}>Edit</button>
                          <button className="text-del" onClick={() => setFruits(fruits.filter(x => x.id !== f.id))}>Delete</button>
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
              <input type="date" className="date-input" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
              <div className="revenue-badge">
                <span className="revenue-label">Daily Total Revenue</span>
                <span className="revenue-amount">₱{dailyRevenue.toFixed(2)}</span>
              </div>
            </div>
            {dailyOrders.map(o => (
              <div key={o.id} className="history-card" id={`receipt-${o.id}`}>
                <div className="receipt-brand-header">
                   <h3>DADDY ELY'S FRUITS & VEGGIES</h3>
                   <p>Fresh from the farm to your table.</p>
                   <div className="receipt-divider"></div>
                </div>
                <div className="h-main-info">
                  <div className="h-customer">
                    <strong>{o.customer}</strong>
                    <p>{o.displayDate} | {o.time}</p>
                  </div>
                  <div className="h-right-side">
                    <span className="h-total-amount">₱{o.total.toFixed(2)}</span>
                    <div className="h-actions no-print">
                      <button className="btn-screenshot" onClick={() => downloadReceipt(o.id)}>📸</button>
                      <button className="btn-delete-order" onClick={() => deleteOrder(o.id)}>🗑️</button>
                    </div>
                  </div>
                </div>
                <div className="h-items-breakdown">
                  {o.items.map(it => (
                    <div key={it.cartId} className="h-item-row">
                      <span>{it.name} ({it.quantity}{it.unit})</span>
                      <span>₱{it.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="receipt-footer">
                   <div className="receipt-divider"></div>
                   <p>Thank you for shopping at Daddy Ely's!</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <aside className="bill-sidebar">
        <div className="bill-header">
          <div className="order-tag">Checkout</div>
          <input placeholder="Customer Name" value={customer} onChange={e => setCustomer(e.target.value)} className="customer-input" />
        </div>
        <div className="bill-items">
          {cart.map(item => (
            <div key={item.cartId} className="bill-row">
              <div className="bill-item-info"><strong>{item.name}</strong><p>{item.quantity}{item.unit} @ ₱{item.price.toFixed(2)}</p></div>
              <div className="bill-item-right">
                <span className="bill-item-price">₱{item.subtotal.toFixed(2)}</span>
                <button className="btn-remove-item" onClick={() => setCart(cart.filter(c => c.cartId !== item.cartId))}>✕</button>
              </div>
            </div>
          ))}
        </div>
        <div className="bill-footer">
          <div className="total-line"><span>Total:</span><span>₱{cart.reduce((a, i) => a + i.subtotal, 0).toFixed(2)}</span></div>
          <button className="btn-navy" onClick={() => setCart([])}>Clear Cart</button>
          <button className="btn-checkout" onClick={completeOrder}>Complete Transaction</button>
        </div>
      </aside>
      {toast && <div className="toast-notification">{toast}</div>}
    </div>
  );
}

export default App;