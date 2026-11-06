import React, { useEffect, useCallback } from "react";
import { X, Backspace, Check } from "@phosphor-icons/react";
import { computeItemSubtotal, isWeightUnit } from "../../utils/moneyUtils";

export default function WeightKeypadModal({
  product,
  qtyStr,
  setQtyStr,
  isEditingCartItem = false,
  onClose,
  onConfirm
}) {
  const isKg = isWeightUnit(product?.unit);
  const parsedQty = parseFloat(qtyStr) || 0;
  const subtotal = computeItemSubtotal(product?.price || 0, parsedQty);

  const handleNumpad = useCallback((action) => {
    if (action === "clear") {
      setQtyStr("");
      return;
    }
    if (action === "backspace") {
      setQtyStr(prev => prev.slice(0, -1));
      return;
    }
    if (action === ".") {
      if (!isKg) return; // Integer counts only for piece/pack items
      setQtyStr(prev => (prev.includes(".") ? prev : (prev === "" ? "0." : prev + ".")));
      return;
    }
    // Digit key '0'-'9'
    setQtyStr(prev => {
      if (prev === "0" && action !== ".") return action;
      if (prev.includes(".") && prev.split(".")[1].length >= 3) return prev; // max 3 decimals for scales
      if (prev.length >= 7) return prev;
      return prev + action;
    });
  }, [isKg, setQtyStr]);

  // Support physical numpad/keyboard input when modal is open
  useEffect(() => {
    if (!product) return;
    const handleKeyDown = (e) => {
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleNumpad(e.key);
      } else if (e.key === ".") {
        e.preventDefault();
        handleNumpad(".");
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleNumpad("backspace");
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter" && parsedQty > 0) {
        e.preventDefault();
        onConfirm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [product, handleNumpad, onClose, onConfirm, parsedQty]);

  if (!product) return null;

  const handlePreset = (val) => {
    setQtyStr(String(val));
  };

  const kgPresets = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 5.0];
  const pcsPresets = [1, 2, 3, 4, 5, 6, 10, 12];

  return (
    <div className="weighin-modal-overlay" onClick={onClose}>
      <div className="weighin-modal-content" onClick={e => e.stopPropagation()}>
        <div className="weighin-header">
          <div className="weighin-title-group">
            <span className="weighin-cat-badge">
              {isEditingCartItem ? "Edit Cart Quantity" : (product.category || "Produce")}
            </span>
            <h3 className="weighin-prod-name">{product.name}</h3>
            <p className="weighin-rate">₱{Number(product.price || 0).toFixed(2)} / {product.unit}</p>
          </div>
          <button 
            type="button" 
            className="weighin-close-btn" 
            onClick={onClose}
            aria-label="Close weigh-in dialog"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className="weighin-display-card">
          <div className="weighin-display-left">
            <span className="weighin-display-label">
              Quantity ({product.unit || "unit"})
            </span>
            <div className="weighin-display-value">
              <span className="weighin-num">
                {qtyStr || (isKg ? "0.000" : "0")}
              </span>
              <span className="weighin-unit">{product.unit}</span>
            </div>
          </div>
          <div className="weighin-display-right">
            <span className="weighin-display-label">Subtotal</span>
            <span className="weighin-subtotal">
              ₱{subtotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="weighin-presets-section">
          <span className="weighin-presets-label">Quick Presets</span>
          <div className="weighin-presets-grid">
            {isKg ? (
              kgPresets.map(val => (
                <button
                  key={val}
                  type="button"
                  className={`weighin-preset-chip ${parseFloat(qtyStr) === val ? "active" : ""}`}
                  onClick={() => handlePreset(val)}
                >
                  {val} kg
                </button>
              ))
            ) : (
              pcsPresets.map(val => (
                <button
                  key={val}
                  type="button"
                  className={`weighin-preset-chip ${parseFloat(qtyStr) === val ? "active" : ""}`}
                  onClick={() => handlePreset(val)}
                >
                  {val} {product.unit}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Touch Numpad */}
        <div className="weighin-numpad-grid">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"].map(digit => (
            <button
              key={digit}
              type="button"
              className="weighin-key-btn"
              onClick={() => handleNumpad(digit)}
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            className="weighin-key-btn weighin-key-backspace"
            onClick={() => handleNumpad("backspace")}
            aria-label="Backspace"
          >
            <Backspace size={22} weight="bold" />
          </button>
        </div>

        <div className="weighin-actions">
          <button
            type="button"
            className="weighin-clear-btn"
            onClick={() => handleNumpad("clear")}
          >
            Clear
          </button>
          <button
            type="button"
            className="weighin-confirm-btn"
            onClick={onConfirm}
            disabled={!parsedQty || parsedQty <= 0}
            style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
          >
            <Check size={18} weight="bold" style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}>
              {isEditingCartItem ? "Update Cart" : "Add to Cart"} · ₱{subtotal.toFixed(2)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
