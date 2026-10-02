import React from "react";
import { MagnifyingGlass, X, Sparkle, Question } from "@phosphor-icons/react";

export default function PosHeader({
  view,
  storeName,
  isDemoMode,
  onExitDemo,
  onStartTour,
  fruits = [],
  posSearchTerm,
  setPosSearchTerm,
  posSelectedCategory,
  setPosSelectedCategory
}) {
  const viewLabels = {
    pos: "POS Cashier Register",
    dashboard: "Analytics Dashboard",
    inventory: "Inventory Management",
    orders: "Transaction History",
    delivery: "Delivery Manifests",
    settings: "Store Settings",
    receipt_maker: "Receipt Designer"
  };

  const categories = ['All', ...new Set(fruits.map(f => f.category).filter(Boolean))];

  return (
    <header className="top-header">
      <div className="header-top-row">
        <div className="header-left">
          {view === 'dashboard' ? (
            <div className="dash-header-greeting">
              <h2 className="dash-greeting-text">
                {(() => { 
                  const h = new Date().getHours(); 
                  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; 
                })()}, {storeName}!
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
                type="button"
                className="btn-exit-demo-pill"
                onClick={onExitDemo}
                title="Exit Demo to Landing Page"
              >
                Exit Demo
              </button>
            </div>
          )}
          <button 
            type="button"
            className="btn-help-icon" 
            onClick={() => onStartTour(view)} 
            title="Interactive Guide & Tour"
            aria-label="Interactive Guide & Tour"
          >
            <Question size={20} weight="bold" />
          </button>
          <div className="info-pill">
            <span className="pill-label">Today</span>
            <span className="pill-value">{new Date().toLocaleDateString()}</span>
          </div>
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
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
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
  );
}
