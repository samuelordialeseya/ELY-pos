import React, { useState } from "react";
import "./StoreSetupLaunchpad.css";
import { 
  Store, 
  Package, 
  Compass, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  Sparkles, 
  Plus, 
  ShoppingCart,
  Scale
} from "lucide-react";

export default function StoreSetupLaunchpad({ 
  isOpen, 
  onClose, 
  storeName, 
  onUpdateStoreName, 
  onAddStarterProducts, 
  onStartTour,
  onNavigateView 
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(storeName || "My Store");
  const [startersAdded, setStartersAdded] = useState(false);

  if (!isOpen) return null;

  const handleSaveName = (e) => {
    e.preventDefault();
    const trimmed = nameInput.trim() || "My Store";
    onUpdateStoreName(trimmed);
    setEditingName(false);
  };

  const handleAddStarters = async () => {
    if (onAddStarterProducts) {
      await onAddStarterProducts();
      setStartersAdded(true);
    }
  };

  return (
    <div className="launchpad-overlay">
      <div className="launchpad-card">
        {/* Header */}
        <div className="launchpad-header">
          <div className="launchpad-header-left">
            <div className="launchpad-badge">
              <Sparkles size={14} />
              <span>Interactive Store Setup Launchpad</span>
            </div>
            <h2 className="launchpad-title">Welcome to {storeName}!</h2>
            <p className="launchpad-subtitle">
              Your POS terminal is ready. Complete these quick steps to get fully oriented and start ringing up transactions.
            </p>
          </div>
          <button className="launchpad-close-btn" onClick={onClose} title="Skip & Open Terminal">
            <X size={18} />
          </button>
        </div>

        {/* Steps Grid */}
        <div className="launchpad-steps-list">
          {/* Step 1: Store Name */}
          <div className="launchpad-step-item completed">
            <div className="launchpad-step-icon bg-blue">
              <Store size={20} />
            </div>
            <div className="launchpad-step-content">
              <div className="launchpad-step-title-row">
                <h4>1. Store Identity & Receipts Branding</h4>
                <span className="launchpad-status-pill green">Active</span>
              </div>
              <p>Your shop name appears on the customer receipt, dashboard greeting, and rider delivery manifests.</p>
              
              {editingName ? (
                <form onSubmit={handleSaveName} className="launchpad-inline-form">
                  <input 
                    type="text" 
                    value={nameInput} 
                    onChange={e => setNameInput(e.target.value)} 
                    className="launchpad-input"
                    placeholder="Enter store name..."
                    autoFocus
                  />
                  <button type="submit" className="launchpad-btn-sm primary">Save</button>
                  <button type="button" onClick={() => setEditingName(false)} className="launchpad-btn-sm neutral">Cancel</button>
                </form>
              ) : (
                <div className="launchpad-name-preview">
                  <span className="launchpad-store-pill">{storeName}</span>
                  <button onClick={() => { setNameInput(storeName); setEditingName(true); }} className="launchpad-link-btn">
                    Change Name
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Catalog Setup */}
          <div className="launchpad-step-item">
            <div className="launchpad-step-icon bg-orange">
              <Package size={20} />
            </div>
            <div className="launchpad-step-content">
              <div className="launchpad-step-title-row">
                <h4>2. Product Catalog & Scale Pricing</h4>
                {startersAdded && <span className="launchpad-status-pill green">Items Loaded</span>}
              </div>
              <p>
                ELY.pos supports dual pricing: selling produce by weight (<strong>per kg</strong>) with fractional digital scales, or by unit (<strong>per pc / pack / tali</strong>).
              </p>
              <div className="launchpad-actions-row">
                <button 
                  className={`launchpad-btn-sm ${startersAdded ? 'success' : 'primary'}`}
                  onClick={handleAddStarters}
                  disabled={startersAdded}
                >
                  {startersAdded ? (
                    <>
                      <CheckCircle2 size={14} />
                      <span>3 Starter Items Added to Catalog</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>Load 3 Starter Produce Items (Avocado, Mango, Onion)</span>
                    </>
                  )}
                </button>
                <button 
                  className="launchpad-btn-sm neutral"
                  onClick={() => {
                    if (onNavigateView) onNavigateView("inventory");
                    onClose();
                  }}
                >
                  Open Inventory Manager
                </button>
              </div>
            </div>
          </div>

          {/* Step 3: Interactive Tour via Driver.js */}
          <div className="launchpad-step-item highlight-step">
            <div className="launchpad-step-icon bg-teal">
              <Compass size={20} />
            </div>
            <div className="launchpad-step-content">
              <div className="launchpad-step-title-row">
                <h4>3. Spotlight Interactive Tour (Driver.js)</h4>
                <span className="launchpad-status-pill blue">Recommended</span>
              </div>
              <p>
                Take a zero-blur spotlight walkthrough of the POS terminal. Learn how to tap produce, enter scale weights (e.g. 1.25 kg), add to cart, and print receipts.
              </p>
              <button 
                className="launchpad-btn-tour"
                onClick={() => {
                  onClose();
                  if (onStartTour) onStartTour();
                }}
              >
                <Sparkles size={16} />
                <span>Start Interactive Spotlight Tour</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="launchpad-footer">
          <span className="launchpad-footer-note">
            💡 You can re-open this launchpad anytime from <strong>Settings</strong> at the bottom-left.
          </span>
          <button className="launchpad-btn-finish" onClick={onClose}>
            <span>Open POS Terminal</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
