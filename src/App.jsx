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
  const [customerCount, setCustomerCount] = useState(() => parseInt(localStorage.getItem("customerCount")) || 1);

  // Inventory States
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("Fruits");
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", price: "", unit: "", category: "" });

  // Checkout States
  const [customer, setCustomer] = useState("");
  const [address, setAddress] = useState(""); 
  
  // Delivery & UI States
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [toast, setToast] = useState("");
  const [weights, setWeights] = useState({});

  useEffect(() => { localStorage.setItem("fruits", JSON.stringify(fruits)); }, [fruits]);
  useEffect(() => { localStorage.setItem("cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("completedOrders", JSON.stringify(completedOrders)); }, [completedOrders]);
  useEffect(() => { localStorage.setItem("customerCount", customerCount); }, [customerCount]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2000); };

  // --- LOGIC: Delivery Status & Sorting ---
  const toggleDeliveryStatus = (id) => {
    setCompletedOrders(prev => prev.map(order => 
      order.id === id ? { ...order, status: order.status === "Delivered" ? "Pending" : "Delivered" } : order
    ));
    showToast("Status Updated");
  };

  const getSortedManifest = () => {
    const selected = completedOrders.filter(o => selectedOrderIds.includes(o.id));
    const getPriority = (addr) => {
      const val = addr.trim();
      if (val.startsWith('4')) return 1;
      if (val.startsWith('3')) return 2;
      if (val.startsWith('2')) return 3;
      if (val.startsWith('1')) return 4;
      return 5; // Others
    };
    return selected.sort((a, b) => getPriority(a.address) - getPriority(b.address));
  };

  const getDeliveryList = () => {
    const filtered = completedOrders.filter(o => o.rawDate === filterDate);
    // Sort: Pending first, Delivered last
    return filtered.sort((a, b) => {
      if (a.status === "Delivered" && b.status !== "Delivered") return 1;
      if (a.status !== "Delivered" && b.status === "Delivered") return -1;
      return 0;
    });
  };

  // --- ACTIONS: Complete, Add, Save, Download ---
  const completeOrder = () => {
    if (cart.length === 0) return showToast("Cart is empty!");
    const now = new Date();
    setCompletedOrders([{ 
        id: generateId(), 
        customer: customer || `Customer #${customerCount}`, 
        address: address || "Walk-in",
        status: "Pending",
        items: [...cart], 
        total: cart.reduce((acc, i) => acc + i.subtotal, 0), 
        rawDate: now.toISOString().split('T')[0], 
        displayDate: now.toLocaleDateString(), 
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }, ...completedOrders]);
    setCustomerCount(prev => prev + 1);
    setCart([]); setCustomer(""); setAddress("");
    showToast("Transaction Saved!");
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
      link.download = `Receipt_${orderId.slice(0,5)}.png`;
      link.href = canvas.toDataURL();
      link.click();
      if(actions) actions.style.display = 'flex';
      showToast("Receipt Saved");
    });
  };

  const addFruit = (e) => {
    e.preventDefault();
    if (name && price && unit) {
      setFruits([...fruits, { id: generateId(), name, price: parseFloat(price), unit, category }]);
      setName(""); setPrice(""); setUnit(""); setCategory("Fruits");
      showToast("Added to Stock");
    }
  };

  const addToCart = (product) => {
    const qty = parseFloat(weights[product.id]);
    if (!qty || qty <= 0) return showToast("Enter weight/qty");
    setCart([...cart, { 
      cartId: generateId(), 
      name: product.name, 
      price: product.price, 
      quantity: qty, 
      unit: product.unit, 
      subtotal: product.price * qty 
    }]);
    setWeights({ ...weights, [product.id]: "" });
    showToast("Added to Cart");
  };

  const saveEdit = (id) => {
    setFruits(fruits.map(f => f.id === id ? { ...f, ...editFormData, price: parseFloat(editFormData.price) } : f));
    setEditingId(null);
    showToast("Product updated");
  };

  return (
    <div className="pos-layout">
      <aside className="sidebar">
        <div className="brand"><div className="logo-box">DE</div><h2>Daddy Ely's</h2></div>
        <nav className="nav-links">
          <div className={`nav-item ${view === 'pos' ? 'active' : ''}`} onClick={() => setView('pos')}>🛒 POS</div>
          <div className={`nav-item ${view === 'inventory' ? 'active' : ''}`} onClick={() => setView('inventory')}>📦 Inventory</div>
          <div className={`nav-item ${view === 'orders' ? 'active' : ''}`} onClick={() => setView('orders')}>📋 History</div>
          <div className={`nav-item ${view === 'delivery' ? 'active' : ''}`} onClick={() => setView('delivery')}>🚚 Delivery</div>
        </nav>
      </aside>

      <main className="main-viewport">
        <header className="top-header">
          <div className="header-left">
            {view === 'pos' ? (
              <div className="pos-search-wrapper">
                <input type="text" className="top-search" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <div className="category-filter-bar">
                  {["All", ...new Set(fruits.map(f => f.category))].map(cat => (
                    <button key={cat} className={`cat-filter-btn ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>
                  ))}
                </div>
              </div>
            ) : <h3 className="section-title">{view.toUpperCase()}</h3>}
          </div>
          <div className="header-right-info">
            <div className="info-pill"><span className="pill-label">Today</span><span className="pill-value">{new Date().toLocaleDateString()}</span></div>
            <div className="info-pill queue-pill"><span className="pill-label">Serving</span><span className="pill-value">#{customerCount}</span></div>
          </div>
        </header>

        {view === 'pos' && (
          <div className="product-grid">
            {fruits.filter(f => (selectedCategory === "All" || f.category === selectedCategory) && f.name.toLowerCase().includes(searchTerm.toLowerCase())).map(f => (
              <div key={f.id} className="food-card">
                <div className="card-cat">{f.category}</div>
                {/* Circle removed here */}
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
                {fruits.map(f => (
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
                          <button onClick={() => setFruits(fruits.filter(x => x.id !== f.id))} className="text-del" style={{marginLeft:'10px'}}>Delete</button>
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
                <span className="revenue-label">Daily Revenue</span>
                <span className="revenue-amount">₱{completedOrders.filter(o => o.rawDate === filterDate).reduce((a, b) => a + b.total, 0).toFixed(2)}</span>
              </div>
            </div>
            {completedOrders.filter(o => o.rawDate === filterDate).map(o => (
              <div key={o.id} className="history-card" id={`receipt-${o.id}`}>
                <div className="receipt-brand-header">
                   <h3>DADDY ELY'S FRUITS & VEGGIES</h3>
                   <p>Fresh from the farm to your table.</p>
                </div>
                <div className="receipt-divider"></div>
                <div className="receipt-body">
                  <div className="receipt-left">
                    <div className="h-customer-name"><strong>{o.customer}</strong></div>
                    <div className="h-meta">{o.displayDate} | {o.time}</div>
                    <div className="h-items-list">
                      {o.items.map(it => (
                        <div key={it.cartId} className="h-item-line">
                          {it.name} ({it.quantity}{it.unit}) ₱{it.subtotal.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="receipt-right">
                    <span className="h-total-amount">₱{o.total.toFixed(2)}</span>
                    <div className="h-actions no-print">
                      <button className="btn-screenshot" onClick={() => downloadReceipt(o.id)}>📸</button>
                      <button className="btn-delete-order" onClick={() => setCompletedOrders(prev => prev.filter(x => x.id !== o.id))}>🗑️</button>
                    </div>
                  </div>
                </div>
                <div className="receipt-divider"></div>
                <div className="receipt-footer"><p>Thank you for shopping at Daddy Ely's!</p></div>
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
                         <strong>{o.customer} {o.status === 'Delivered' && "✅"}</strong>
                         <p>{o.address}</p>
                       </div>
                    </div>
                    <button className="btn-status-toggle" onClick={() => toggleDeliveryStatus(o.id)}>
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
                  <h2>DADDY ELY'S RIDER MANIFEST</h2>
                  <div className="manifest-meta"><span>Date: {filterDate}</span><span>Rider: _________________</span></div>
                </div>
                <table className="manifest-table">
                  <thead><tr><th>CUSTOMER</th><th>ADDRESS</th><th style={{textAlign:'right'}}>AMOUNT</th></tr></thead>
                  <tbody>
                    {getSortedManifest().map(o => (
                      <tr key={o.id}>
                        <td><strong>{o.customer.toUpperCase()}</strong></td>
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
      {toast && <div className="toast-notification">{toast}</div>}
    </div>
  );
}

export default App;