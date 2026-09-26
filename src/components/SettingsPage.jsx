import React, { useState, useEffect } from "react";
import { RotateCw, Compass, RefreshCw, LogOut } from "lucide-react";
import ReceiptTemplateEditor from "./ReceiptTemplateEditor";
import "./SettingsPage.css";

export default function SettingsPage({
  storeName,
  onUpdateStoreName,
  receiptConfig,
  onUpdateReceiptConfig,
  isDemoMode,
  user,
  onRerunWizard,
  onStartFullTour,
  onReload,
  onSignOut
}) {
  const [localName, setLocalName] = useState(storeName || "My Store");
  const [storeType, setStoreType] = useState(
    () => localStorage.getItem("elypos_store_type") || "Fresh Produce"
  );
  const [showSavedConfirm, setShowSavedConfirm] = useState(false);
  const [showTypeSaved, setShowTypeSaved] = useState(false);

  useEffect(() => {
    setLocalName(storeName || "My Store");
  }, [storeName]);

  const handleNameBlur = async () => {
    const trimmed = localName.trim() || "My Store";
    setLocalName(trimmed);
    if (onUpdateStoreName) {
      await onUpdateStoreName(trimmed);
    }
    setShowSavedConfirm(true);
    setTimeout(() => setShowSavedConfirm(false), 2000);
  };

  const handleTypeChange = (e) => {
    const val = e.target.value;
    setStoreType(val);
    localStorage.setItem("elypos_store_type", val);
    setShowTypeSaved(true);
    setTimeout(() => setShowTypeSaved(false), 2000);
  };

  const avatarLetter = (user?.email?.[0] || user?.displayName?.[0] || "G").toUpperCase();

  return (
    <div className="settings-page">
      {/* ─── 1. STORE IDENTITY ─── */}
      <section className="settings-section">
        <h3 className="settings-section-title">Store Identity</h3>
        <div className="settings-card">
          <div className="settings-row">
            <label htmlFor="settings-store-name">
              Store Name
              {showSavedConfirm && <span className="saved-confirm">Saved ✓</span>}
            </label>
            <input
              id="settings-store-name"
              type="text"
              className="settings-input-field"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={handleNameBlur}
              placeholder="Enter store name..."
            />
          </div>

          <div className="settings-row">
            <label htmlFor="settings-store-type">
              Store Type
              {showTypeSaved && <span className="saved-confirm">Saved ✓</span>}
            </label>
            <select
              id="settings-store-type"
              className="settings-input-field settings-select-field"
              value={storeType}
              onChange={handleTypeChange}
            >
              <option value="Fresh Produce">Fresh Produce</option>
              <option value="General Grocery">General Grocery</option>
              <option value="Meat & Seafood">Meat & Seafood</option>
            </select>
          </div>
        </div>
      </section>

      {/* ─── 2. RECEIPT TEMPLATE ─── */}
      <section className="settings-section">
        <h3 className="settings-section-title">Receipt Template</h3>
        <div className="settings-card receipt-settings-card">
          <ReceiptTemplateEditor
            receiptConfig={receiptConfig}
            storeName={localName}
            onSave={onUpdateReceiptConfig}
          />
        </div>
      </section>

      {/* ─── 3. ACCOUNT ─── */}
      <section className="settings-section">
        <h3 className="settings-section-title">Account</h3>
        <div className="settings-card">
          <div className="settings-row account-profile-row">
            <div className="account-avatar-circle">
              {avatarLetter}
            </div>
            <div className="account-details">
              <span className="account-name">
                {isDemoMode ? "Demo Mode" : (user?.displayName || "Store User")}
              </span>
              <span className="account-email">
                {isDemoMode ? "Guest Sandbox" : (user?.email || "No email provided")}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. ONBOARDING ─── */}
      <section className="settings-section">
        <h3 className="settings-section-title">Onboarding & Tutorials</h3>
        <div className="settings-card settings-actions-card">
          <button
            type="button"
            className="settings-btn"
            onClick={onRerunWizard}
          >
            <RotateCw size={16} />
            <span>Re-run Setup Wizard</span>
          </button>
          <button
            type="button"
            className="settings-btn"
            onClick={onStartFullTour}
          >
            <Compass size={16} />
            <span>Take Full Guided Tour</span>
          </button>
        </div>
      </section>

      {/* ─── 5. TERMINAL ─── */}
      <section className="settings-section">
        <h3 className="settings-section-title">Terminal Maintenance</h3>
        <div className="settings-card settings-actions-card">
          <button
            type="button"
            className="settings-btn"
            onClick={() => {
              if (onReload) {
                onReload();
              } else if (window.confirm("Reload the POS? Unsaved checkout items will be cleared.")) {
                window.location.reload();
              }
            }}
          >
            <RefreshCw size={16} />
            <span>Reload Terminal</span>
          </button>
        </div>
      </section>

      {/* ─── 6. DANGER ZONE ─── */}
      <section className="settings-section">
        <h3 className="settings-section-title text-danger">Danger Zone</h3>
        <div className="settings-card settings-actions-card">
          <button
            type="button"
            className="settings-btn settings-btn-danger"
            onClick={onSignOut}
          >
            <LogOut size={16} />
            <span>{isDemoMode ? "Exit Demo" : "Sign Out"}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
