import React from "react";
import { 
  SquaresFour, 
  ShoppingCart, 
  Package, 
  ClipboardText, 
  Truck, 
  Gear, 
  Question 
} from "@phosphor-icons/react";

export default function PosSidebar({
  storeName,
  view,
  setView,
  onStartTour
}) {
  return (
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
          onClick={() => onStartTour(view)}
          title="Interactive Tour & Guide"
          aria-label="Interactive Tour & Guide"
        >
          <Question size={16} weight="bold" />
        </button>
      </div>
    </aside>
  );
}
