import React from "react";
import { ShoppingCart, X, CheckCircle } from "@phosphor-icons/react";

export default function CartSidebar({
  cart = [],
  customer = "",
  setCustomer,
  address = "",
  setAddress,
  receiptConfig,
  onRemoveItem,
  onClearCart,
  onCheckout,
  isCheckingOut = false
}) {
  const totalAmount = cart.reduce((acc, it) => acc + (it.subtotal || 0), 0);

  return (
    <aside className="bill-sidebar">
      <div className="bill-header">
        <div className="bill-header-top">
          <div className="bill-title-wrap">
            <ShoppingCart size={18} className="bill-cart-icon" />
            <h3>Current Order</h3>
          </div>
          <span className="cart-count-badge">
            {cart.length} {cart.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        
        <div className="bill-customer-inputs">
          <input
            placeholder="Customer Name (optional)"
            value={customer}
            onChange={e => setCustomer(e.target.value)}
            className="customer-input"
          />
          {receiptConfig?.show_address_field !== false && (
            <input
              placeholder="Address (e.g. Phase 4, Walk-in)"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="customer-input"
            />
          )}
        </div>
      </div>

      <div className="bill-items">
        {cart.length === 0 ? (
          <div className="cart-empty-state">
            <ShoppingCart size={38} className="cart-empty-icon" />
            <h4>Cart is empty</h4>
            <p>Tap products or enter scale weights to build this customer order.</p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.cartId} className="bill-row">
              <div className="bill-row-top">
                <strong className="bill-item-title" title={item.name}>{item.name}</strong>
                <div className="bill-row-top-right">
                  <span className="bill-item-price">₱{item.subtotal.toFixed(2)}</span>
                  <button
                    type="button"
                    className="btn-remove-item"
                    onClick={() => onRemoveItem(item.cartId)}
                    title={`Remove ${item.name}`}
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <X size={14} weight="bold" />
                  </button>
                </div>
              </div>
              <div className="bill-row-bottom">
                <span className="bill-item-rate">
                  ₱{item.price.toFixed(2)} / {item.unit}
                </span>
                <span className="bill-item-qty-badge">
                  {item.quantity} <span className="qty-unit">{item.unit}</span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bill-footer">
        <div className="total-line">
          <span className="total-label">Total Amount</span>
          <span className="total-val">₱{totalAmount.toFixed(2)}</span>
        </div>
        <div className="bill-footer-buttons">
          <button
            type="button"
            className="btn-clear-cart"
            onClick={onClearCart}
            disabled={cart.length === 0}
            title="Clear current cart"
          >
            Clear
          </button>
          <button
            type="button"
            className="btn-checkout"
            onClick={onCheckout}
            disabled={cart.length === 0 || isCheckingOut}
            style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
          >
            <CheckCircle size={18} weight="bold" style={{ color: '#ffffff' }} />
            <span style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>
              {isCheckingOut ? "Processing..." : "Complete Transaction"}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
