import React, { useState, useEffect } from "react";
import { Receipt, Check, RotateCcw, Sparkles } from "lucide-react";
import { DEFAULT_RECEIPT_CONFIG, formatReceiptText } from "../data/receiptConfig";
import "./ReceiptTemplateEditor.css";

export default function ReceiptTemplateEditor({
  receiptConfig = DEFAULT_RECEIPT_CONFIG,
  storeName = "My Store",
  onSave
}) {
  const [localConfig, setLocalConfig] = useState(() => ({
    ...DEFAULT_RECEIPT_CONFIG,
    ...(receiptConfig || {})
  }));

  const [savedStatus, setSavedStatus] = useState(false);

  useEffect(() => {
    if (receiptConfig) {
      setLocalConfig({
        ...DEFAULT_RECEIPT_CONFIG,
        ...receiptConfig
      });
    }
  }, [receiptConfig]);

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
    if (window.confirm("Reset receipt template to default layout?")) {
      setLocalConfig({ ...DEFAULT_RECEIPT_CONFIG });
    }
  };

  // Live rendered footer lines
  const renderedFooter1 = formatReceiptText(
    localConfig.footer_line1 || "Thank you for shopping at {store}!",
    storeName
  );
  const renderedFooter2 = formatReceiptText(localConfig.footer_line2 || "", storeName);

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
              <RotateCcw size={15} />
              <span>Defaults</span>
            </button>

            <button
              type="submit"
              className={`receipt-btn-save ${savedStatus ? "is-saved" : ""}`}
            >
              {savedStatus ? (
                <>
                  <Check size={16} />
                  <span>Saved ✓</span>
                </>
              ) : (
                <>
                  <Check size={16} />
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
            <Sparkles size={14} className="preview-sparkle-icon" />
            <span>Live Preview</span>
          </div>
          <span className="receipt-preview-sub">Real-time receipt layout</span>
        </div>

        <div className="receipt-preview-wrapper">
          <div className="instant-receipt-paper receipt-preview-card">
            {/* Store Brand Header */}
            <div className="receipt-brand-header">
              <h3>{(storeName || "MY STORE").toUpperCase()}</h3>
              <p>{localConfig.subtitle || "Official Sales Receipt"}</p>
              
              {localConfig.tagline && (
                <p className="receipt-tagline">{localConfig.tagline}</p>
              )}

              {localConfig.address && (
                <p className="receipt-contact-info">{localConfig.address}</p>
              )}

              {localConfig.phone && (
                <p className="receipt-contact-info">Tel: {localConfig.phone}</p>
              )}

              {localConfig.show_receipt_no && (
                <div className="receipt-order-no">Receipt #RCP-94821</div>
              )}

              <div className="receipt-meta-line">
                <span>Sep 26, 2026 · 11:30 AM</span>
                <span>Juan Dela Cruz</span>
              </div>
            </div>

            <div className="receipt-divider"></div>

            {/* Sample items list */}
            <div className="receipt-popup-items">
              <div className="receipt-popup-row">
                <div>
                  <strong>Avocado Davao</strong>
                  <span className="receipt-popup-sub">0.5 kg × ₱150.00</span>
                </div>
                <span className="receipt-popup-item-price">₱75.00</span>
              </div>
              <div className="receipt-popup-row">
                <div>
                  <strong>Fresh Mango Carabao</strong>
                  <span className="receipt-popup-sub">1 kg × ₱120.00</span>
                </div>
                <span className="receipt-popup-item-price">₱120.00</span>
              </div>
            </div>

            <div className="receipt-divider"></div>

            {/* Total Paid */}
            <div className="receipt-popup-total">
              <span>TOTAL PAID</span>
              <span className="receipt-popup-total-value">₱195.00</span>
            </div>

            {/* Footer lines */}
            <div className="receipt-popup-footer">
              <p>{renderedFooter1}</p>
              {renderedFooter2 && <p>{renderedFooter2}</p>}
            </div>

            {/* Stylized Paper Zigzag / Barcode accent */}
            <div className="receipt-preview-cut-edge"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
