import React from "react";
import { X, Backspace, Check } from "@phosphor-icons/react";

export default function WeightKeypadModal({
  product,
  qtyStr,
  setQtyStr,
  onClose,
  onConfirm
}) {
  if (!product) return null;

  const isKg = (product.unit || "").toLowerCase().includes("kg");
  const parsedQty = parseFloat(qtyStr) || 0;
  const subtotal = parsedQty * (product.price || 0);

  const handleNumpad = (action) => {
    if (action === 'clear') {
      setQtyStr('');
      return;
    }
    if (action === 'backspace') {
      setQtyStr(prev => prev.slice(0, -1));
      return;
    }
    if (action === '.') {
      if (!isKg) return; // Integer counts only for piece/pack items
      setQtyStr(prev => (prev.includes('.') ? prev : (prev === '' ? '0.' : prev + '.')));
      return;
    }
    // Digit key '0'-'9'
    setQtyStr(prev => {
      if (prev === '0' && action !== '.') return action;
      if (prev.includes('.') && prev.split('.')[1].length >= 3) return prev; // max 3 decimals for scales
      if (prev.length >= 7) return prev;
      return prev + action;
    });
  };

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
            <span className="weighin-cat-badge">{product.category || "Produce"}</span>
            <h3 className="weighin-prod-name">{product.name}</h3>
            <p className="weighin-rate">₱{product.price.toFixed(2)} / {product.unit}</p>
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
              Quantity ({product.unit || 'unit'})
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
                  className={`weighin-preset-chip ${parseFloat(qtyStr) === val ? 'active' : ''}`}
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
                  className={`weighin-preset-chip ${parseFloat(qtyStr) === val ? 'active' : ''}`}
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
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map(digit => (
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
            onClick={() => handleNumpad('backspace')}
            aria-label="Backspace"
          >
            <Backspace size={22} weight="bold" />
          </button>
        </div>

        <div className="weighin-actions">
          <button
            type="button"
            className="weighin-clear-btn"
            onClick={() => handleNumpad('clear')}
          >
            Clear
          </button>
          <button
            type="button"
            className="weighin-confirm-btn"
            onClick={onConfirm}
            disabled={!parsedQty || parsedQty <= 0}
            style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
          >
            <Check size={18} weight="bold" style={{ color: '#ffffff' }} />
            <span style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>
              Add to Cart · ₱{subtotal.toFixed(2)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
