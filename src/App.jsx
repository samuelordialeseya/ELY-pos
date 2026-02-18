import { useState, useEffect, useCallback } from "react";
import html2canvas from "html2canvas";
import { supabase } from './supabaseClient'; 
import "./App.css";

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).substring(2, 15);
};

function App() {
  const [view, setView] = useState("pos"); 
  
  // --- CLOUD DATA STATES ---
  const [fruits, setFruits] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [preOrders, setPreOrders] = useState([]);
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
  const [preOrderCustomer, setPreOrderCustomer] = useState(""); 
  const [preOrderCart, setPreOrderCart] = useState([]); 
  
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [toast, setToast] = useState("");
  const [weights, setWeights] = useState({});

  // --- 1. SAFE DATA FETCHER (Wrapped in useCallback to prevent crashes) ---
  const fetchAllData = useCallback(async () => {
    // Inventory
    const { data: fruitData } = await supabase.from('products').select('*').order('name');
    if (fruitData) setFruits(fruitData);

    // History
    const { data: orderData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (orderData) setCompletedOrders(orderData);

    // Pre-Orders
    const { data: preOrderData } = await supabase.from('pre_orders').select('*').order('created_at', { ascending: false });
    if (preOrderData) setPreOrders(preOrderData);

    // Counter
    const { data: settingsData } = await supabase.from('app_settings').select('customer_count').eq('id', 'global').single();
    if (settingsData) setCustomerCount(settingsData.customer_count);
  }, []);

  // --- 2. INITIAL DATA LOADING ---
  useEffect(() => {
    fetchAllData();
    
    // Real-time subscription (Safe Syntax)
    const subscription = supabase
      .channel('public:any')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchAllData(); 
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [fetchAllData]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2000); };

  // --- INVENTORY ACTIONS ---
  const addFruit = async (e) => {
    e.preventDefault();
    if (name && price && unit) {
      const newFruit = { name, price: parseFloat(price), unit, category: category || "Uncategorized" };
      const { error } = await supabase.from('products').insert([newFruit]);
      
      if (!error) {
        setName(""); setPrice(""); setUnit(""); setCategory("");
        showToast("Added to Cloud Stock");
        fetchAllData(); 
      } else {
        showToast("Error: " + error.message);
      }
    }
  };

  const deleteFruit = async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) { showToast("Removed from Cloud"); fetchAllData(); }
  };

  const saveEdit = async (id) => {
    const updates = { name: editFormData.name, price: parseFloat(editFormData.price), unit: editFormData.unit, category: editFormData.category };
    const { error } = await supabase.from('products').update(updates).eq('id', id);
    if (!error) { setEditingId(null); showToast("Updated!"); fetchAllData(); }
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

    if (view === 'preorder') {
      setPreOrderCart([...preOrderCart, item]);
    } else {
      setCart([...cart, item]);
      showToast("Added to Cart");
    }
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

    const { error: orderError } = await supabase.from('orders').insert([newOrder]);

    if (!orderError) {
      // Fallback increment
      await supabase.from('app_settings').update({ customer_count: customerCount + 1 }).eq('id', 'global');
      
      setCart([]); setCustomer(""); setAddress("");
      showToast("Transaction Saved!");
      fetchAllData();
    } else {
      showToast("Error: " + orderError.message);
    }
  };

  const deleteOrder = async (id) => {
    if(!window.confirm("Delete this order record permanently?")) return;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (!error) { showToast("Order Deleted"); fetchAllData(); }
  };

  const toggleDeliveryStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "Delivered" ? "Pending" : "Delivered";
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    if (!error) { showToast("Status Updated"); fetchAllData(); }
  };

  // --- PRE-ORDER ACTIONS ---
  const savePreOrder = async () => {
    if (!preOrderCustomer) return showToast("Enter Customer Name");
    if (preOrderCart.length === 0) return showToast("No items selected");

    const newPreOrder = {
      customer: preOrderCustomer,
      items: preOrderCart,
      date: new Date().toLocaleDateString(),
      status: 'pending'
    };

    const { error } = await supabase.from('pre_orders').insert([newPreOrder]);
    
    if (!error) {
      setPreOrderCustomer(""); setPreOrderCart([]);
      showToast("Pre-Order Saved to Cloud!");
      fetchAllData();
    }
  };

  const deletePreOrder = async (id) => {
    if(!window.confirm("Delete this pre-order?")) return;
    const { error } = await supabase.from('pre_orders').delete().eq('id', id);
    if(!error) fetchAllData();
  };

  const clearAllPreOrders = async () => {
    if(window.confirm("Clear ALL pre-orders?")) {
      const { error } = await supabase.from('pre_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
      if(!error) fetchAllData();
    }
  };

  // --- UTILS ---
  const getAggregatedShoppingList = () => {
    const masterList = {};
    preOrders.forEach(order => {
      order.items.forEach(item => {
        if (masterList[item.name]) {
          masterList[item.name].quantity += item.quantity;
        } else {
          masterList[item.name] = { ...item };
        }
      });
    });
    return Object.values(masterList);
  };

  const captureShoppingList = () => {
    const element = document.getElementById("shopping-list-capture");
    html2canvas(element, { scale: 2, backgroundColor: "#ffffff" }).then(canvas => {
      const link = document.createElement("a");
      link.download = `Shopping_List.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  const getSortedManifest = () => {
    const selected = completedOrders.filter(o => selectedOrderIds.includes(o.id));
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

  // --- RENDER ---
  return (
    <div className="pos-layout">
      <aside className="sidebar">
        <div className="brand"><div className="logo-box">DE</div><h2>Daddy Ely's</h2></div>
        <nav className="nav-links">
          <div className={`nav-item ${view === 'pos' ? 'active' : ''}`} onClick={() => setView('pos')}>🛒 POS</div>
          <div className={`nav-item ${view === 'preorder' ? 'active' : ''}`} onClick={() => setView('preorder')}>📝 Pre-Order</div>
          <div className={`nav-item ${view === 'inventory' ? 'active' : ''}`} onClick={() => setView('inventory')}>📦 Inventory</div>
          <div className={`nav-item ${view === 'orders' ? 'active' : ''}`} onClick={() => setView('orders')}>📋 History</div>
          <div className={`nav-item ${view === 'delivery' ? 'active' : ''}`} onClick={() => setView('delivery')}>🚚 Delivery</div>
        </nav>
        <div className="sidebar-footer" style={{marginTop: 'auto', padding: '20px'}}>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            background: 'rgba(255,255,255,0.1)', 
            border: '1px solid rgba(255,255,255,0.2)', 
            color: '#fff', 
            width: '100%', 
            padding: '10px', 
            borderRadius: '8px', 
            cursor: 'pointer',
            fontSize: '12px'
          }}>
          🔄 Reload App
        </button>
      </div>
      </aside>

      <main className="main-viewport">
        <header className="top-header">
          <div className="header-left">
            {(view === 'pos' || view === 'preorder' || view === 'inventory') ? (
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
          </div>
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
                  <button className="add-btn" onClick={() => (view === 'preorder' ? addToCart(f) : addToCart(f))}>Add</button>
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
              <button className="btn-save-inv" onClick={addFruit}>+ Add to Cloud Stock</button>
            </div>
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
              <input type="date" className="date-input" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
              <div className="revenue-badge">
                <span className="revenue-label">Daily Revenue</span>
                <span className="revenue-amount">₱{completedOrders.filter(o => o.raw_date === filterDate).reduce((a, b) => a + b.total, 0).toFixed(2)}</span>
              </div>
            </div>
            {completedOrders.filter(o => o.raw_date === filterDate).map(o => (
              <div key={o.id} className="history-card" id={`receipt-${o.id}`}>
                <div className="receipt-brand-header">
                   <h3>DADDY ELY'S FRUITS & VEGGIES</h3>
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
                          {it.name} ({it.quantity}{it.unit}) ₱{it.subtotal.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="receipt-right">
                    <span className="h-total-amount">₱{o.total.toFixed(2)}</span>
                    <div className="h-actions no-print">
                      <button className="btn-screenshot" onClick={() => downloadReceipt(o.id)}>📸</button>
                      <button className="btn-delete-order" onClick={() => deleteOrder(o.id)}>🗑️</button>
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
                  <h2>DADDY ELY'S RIDER MANIFEST</h2>
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
        {view === 'preorder' ? (
           <>
            <div className="bill-header">
              <div className="order-tag">PRE-ORDER BUILDER</div>
              <input placeholder="Customer Name" value={preOrderCustomer} onChange={e => setPreOrderCustomer(e.target.value)} className="customer-input" />
            </div>
            
            <div className="bill-items">
              {preOrderCart.map(item => (
                <div key={item.cartId} className="bill-row">
                  <div className="bill-item-info"><strong>{item.name}</strong><p>{item.quantity}{item.unit}</p></div>
                  <button className="btn-remove-item" onClick={() => setPreOrderCart(preOrderCart.filter(i => i.cartId !== item.cartId))}>✕</button>
                </div>
              ))}
              {preOrderCart.length === 0 && <p style={{textAlign:'center', marginTop:'20px', color:'#aaa'}}>Select items from grid to add.</p>}
            </div>

            <button className="btn-checkout" onClick={savePreOrder}>Save Pre-Order</button>
            
            <div className="preorder-summary-area" style={{marginTop: '30px', borderTop:'2px dashed #eee', paddingTop:'20px'}}>
               <div className="order-tag">ACTIVE ORDERS</div>
               <div style={{maxHeight:'150px', overflowY:'auto', margin:'10px 0', border:'1px solid #f3f4f6', borderRadius:'8px'}}>
                 {preOrders.map(po => (
                   <div key={po.id} style={{display:'flex', justifyContent:'space-between', padding:'8px', borderBottom:'1px solid #eee', fontSize:'12px'}}>
                     <span><strong>{po.customer}</strong> ({po.date})</span>
                     <button onClick={() => deletePreOrder(po.id)} style={{color:'red', border:'none', background:'none', cursor:'pointer'}}>🗑️</button>
                   </div>
                 ))}
               </div>

               <div className="order-tag">MASTER SHOPPING LIST</div>
               <div id="shopping-list-capture" style={{background:'white', padding:'15px', border:'1px solid #eee', borderRadius:'8px', marginTop:'10px'}}>
                  <h4 style={{textAlign:'center', marginBottom:'10px', color:'#00A3E0'}}>SHOPPING LIST</h4>
                  <table style={{width:'100%', fontSize:'13px'}}>
                    <tbody>
                      {getAggregatedShoppingList().map((item, i) => (
                        <tr key={i} style={{borderBottom:'1px solid #f3f4f6'}}>
                          <td style={{padding:'5px 0'}}>{item.name}</td>
                          <td style={{textAlign:'right', fontWeight:'bold'}}>{item.quantity}{item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
               <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                  <button className="btn-navy" onClick={clearAllPreOrders}>Clear All</button>
                  <button className="btn-download-manifest" style={{fontSize:'12px', flex:1}} onClick={captureShoppingList}>📸 Print List</button>
               </div>
            </div>
           </>
        ) : (
           <>
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
           </>
        )}
      </aside>
      {toast && <div className="toast-notification">{toast}</div>}
    </div>
  );
}

export default App;