import React, { useState } from "react";
import { Check, ArrowCounterClockwise, Sparkle } from "@phosphor-icons/react";
import { DEFAULT_RECEIPT_CONFIG } from "../data/receiptConfig";
import ReceiptCard from "./shared/ReceiptCard";
import ConfirmModal from "./shared/ConfirmModal";
import "./ReceiptTemplateEditor.css";

const SAMPLE_PREVIEW_ORDER = {
  id: "RCP-94821",
  customer_name: "Juan Dela Cruz",
  address: "Phase 4, Lot 12 Blk 3",
  order_type: "delivery",
  display_date: "Nov 7, 2026",
  time: "11:30 AM",
  total: 195,
  items: [
    {
      cartId: "sample-1",
      name: "Avocado Davao",
      quantity: 0.5,
      unit: "kg",
      price: 150,
      subtotal: 75
    },
    {
      cartId: "sample-2",
      name: "Fresh Mango Carabao",
      quantity: 1,
      unit: "kg",
      price: 120,
      subtotal: 120
    }
  ]
};

export default function ReceiptTemplateEditor({
  receiptConfig = DEFAULT_RECEIPT_CONFIG,
  storeName = "My Store",
  onSave
}) {
  const [localConfig, setLocalConfig] = useState(() => ({
    ...DEFAULT_RECEIPT_CONFIG,
    ...(receiptConfig || {})
  }));
  const [prevReceiptConfig, setPrevReceiptConfig] = useState(receiptConfig);
  if (receiptConfig !== prevReceiptConfig) {
    setPrevReceiptConfig(receiptConfig);
    if (receiptConfig) {
      setLocalConfig({
        ...DEFAULT_RECEIPT_CONFIG,
        ...receiptConfig
      });
    }
  }

  const [savedStatus, setSavedStatus] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleChange = (field, value) => {
    setLocalConfig((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (onSave) {
      await onSave(localConfig);
    }
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2200);
  };

  const handleResetDefaults = () => {
    setShowResetConfirm(true);
  };

  return (
    <div className="receipt-editor-container">
      {/* LEFT: Editor Controls */}
      <div className="receipt-editor-form-col">
        <form onSubmit={handleSave} className="receipt-editor-form">
          {/* Header Subtitle */}
          <div className="receipt-field-group">
            <label htmlFor="receipt-subtitle">Receipt Subtitle</label>
            <input
              id="receipt-subtitle"
              type="text"
              className="settings-input-field receipt-field-input"
              value={localConfig.subtitle ?? ""}
              onChange={(e) => handleChange("subtitle", e.target.value)}
              placeholder="e.g. Official Sales Receipt"
            />
            <span className="receipt-field-hint">Appears directly below the store name</span>
          </div>

          {/* Tagline / Slogan */}
          <div className="receipt-field-group">
            <label htmlFor="receipt-tagline">Tagline or Slogan (Optional)</label>
            <input
              id="receipt-tagline"
              type="text"
              className="settings-input-field receipt-field-input"
              value={localConfig.tagline ?? ""}
              onChange={(e) => handleChange("tagline", e.target.value)}
              placeholder="e.g. Daily Fresh, Daily Blessed"
            />
          </div>

          {/* Store Address */}
          <div className="receipt-field-group">
            <label htmlFor="receipt-address">Store Address (Optional)</label>
            <input
              id="receipt-address"
              type="text"
              className="settings-input-field receipt-field-input"
              value={localConfig.address ?? ""}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="e.g. Phase 4, Bagong Silang, Caloocan City"
            />
          </div>

          {/* Phone / Contact */}
          <div className="receipt-field-group">
            <label htmlFor="receipt-phone">Contact Phone / Tel (Optional)</label>
            <input
              id="receipt-phone"
              type="text"
              className="settings-input-field receipt-field-input"
              value={localConfig.phone ?? ""}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="e.g. 0917-555-1234"
            />
          </div>

          {/* Footer Line 1 */}
          <div className="receipt-field-group">
            <label htmlFor="receipt-footer1">
              Footer Message (Line 1)
              <span className="receipt-var-pill">Variable: <code>{'{store}'}</code></span>
            </label>
            <input
              id="receipt-footer1"
              type="text"
              className="settings-input-field receipt-field-input"
              value={localConfig.footer_line1 ?? ""}
              onChange={(e) => handleChange("footer_line1", e.target.value)}
              placeholder="e.g. Thank you for shopping at {store}!"
            />
            <span className="receipt-field-hint">Use <code>{'{store}'}</code> to automatically insert your store name</span>
          </div>

          {/* Footer Line 2 */}
          <div className="receipt-field-group">
            <label htmlFor="receipt-footer2">Footer Message (Line 2, Optional)</label>
            <input
              id="receipt-footer2"
              type="text"
              className="settings-input-field receipt-field-input"
              value={localConfig.footer_line2 ?? ""}
              onChange={(e) => handleChange("footer_line2", e.target.value)}
              placeholder="e.g. FB: /ElyFreshFruits · BIR Registered"
            />
          </div>

          {/* Toggles */}
          <div className="receipt-toggles-box">
            <label className="receipt-toggle-row">
              <input
                type="checkbox"
                className="receipt-checkbox"
                checked={!!localConfig.show_receipt_no}
                onChange={(e) => handleChange("show_receipt_no", e.target.checked)}
              />
              <div className="receipt-toggle-text">
                <span className="receipt-toggle-title">Show Receipt Reference Number</span>
                <span className="receipt-toggle-desc">Displays Order # / Receipt ID on the paper slip</span>
              </div>
            </label>

            <label className="receipt-toggle-row">
              <input
                type="checkbox"
                className="receipt-checkbox"
                checked={localConfig.show_address_field !== false}
                onChange={(e) => handleChange("show_address_field", e.target.checked)}
              />
              <div className="receipt-toggle-text">
                <span className="receipt-toggle-title">Show Delivery Address in POS</span>
                <span className="receipt-toggle-desc">Enables customer delivery address field in checkout sidebar</span>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="receipt-actions-bar">
            <button
              type="button"
              className="receipt-btn-reset"
              onClick={handleResetDefaults}
              title="Reset fields to defaults"
            >
              <ArrowCounterClockwise size={15} weight="bold" />
              <span>Defaults</span>
            </button>

            <button
              type="submit"
              className={`receipt-btn-save ${savedStatus ? "is-saved" : ""}`}
            >
              {savedStatus ? (
                <>
                  <Check size={16} weight="bold" />
                  <span>Saved ✓</span>
                </>
              ) : (
                <>
                  <Check size={16} weight="bold" />
                  <span>Save Receipt Template</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT: Live Preview Panel */}
      <div className="receipt-preview-col">
        <div className="receipt-preview-header">
          <div className="receipt-preview-badge">
            <Sparkle size={14} weight="fill" className="preview-sparkle-icon" />
            <span>Live Preview</span>
          </div>
          <span className="receipt-preview-sub">Real-time receipt layout</span>
        </div>

        <div className="receipt-preview-wrapper">
          <ReceiptCard
            className="receipt-preview-card"
            order={SAMPLE_PREVIEW_ORDER}
            storeName={storeName}
            receiptConfig={localConfig}
          />
        </div>
      </div>

      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset Receipt Template?"
        message="Restore the receipt subtitle, contact lines, and footer messages to their original defaults?"
        confirmLabel="Reset Defaults"
        cancelLabel="Cancel"
        variant="primary"
        onConfirm={() => {
          setLocalConfig({ ...DEFAULT_RECEIPT_CONFIG });
          setShowResetConfirm(false);
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
