import React, { useState } from "react";
import {
  ShoppingCart,
  X,
  CheckCircle,
  Minus,
  Plus,
  PencilSimple,
  Truck,
  CaretUp,
  CaretDown
} from "@phosphor-icons/react";
import { formatPeso } from "../../utils/themeUtils";
import { computeCartTotal, isWeightUnit } from "../../utils/moneyUtils";
import ConfirmModal from "../shared/ConfirmModal";

export default function CartSidebar({
  cart = [],
  customer = "",
  setCustomer,
  address = "",
  setAddress,
  receiptConfig,
  onEditItem,
  onStepItemQty,
  onRemoveItem,
  onClearCart,
  onCheckout,
  isCheckingOut = false
}) {
  // Expandable bottom cart drawer state for iPad Portrait (<=900px) & Mobile
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const totalAmount = computeCartTotal(cart);
  const trimmedAddress = address.trim();
  const isDelivery = Boolean(
    trimmedAddress &&
      trimmedAddress.toLowerCase() !== "walk-in" &&
      trimmedAddress.toLowerCase() !== "walk in"
  );

  const handleCheckoutClick = async () => {
    setIsMobileCartOpen(false);
    await onCheckout();
  };

  const handleConfirmClear = () => {
    setShowClearConfirm(false);
    setIsMobileCartOpen(false);
    onClearCart();
  };

  return (
    <>
      {isMobileCartOpen && (
        <div
          className="mobile-cart-backdrop"
          onClick={() => setIsMobileCartOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`bill-sidebar ${
          isMobileCartOpen ? "mobile-cart-expanded" : ""
        }`}
      >
        <div className="bill-header">
          <div className="bill-header-top">
            <div className="bill-title-wrap">
              <ShoppingCart size={18} className="bill-cart-icon" />
              <h3>Current Order</h3>
            </div>
            <div className="bill-header-badges">
              {isDelivery && (
                <span
                  className="cart-count-badge badge-delivery-mode"
                  title="Order will be logged as a Delivery"
                >
                  <Truck size={12} weight="bold" />
                  <span>Delivery</span>
                </span>
              )}
              <span className="cart-count-badge">
                {cart.length} {cart.length === 1 ? "item" : "items"}
              </span>
              <button
                type="button"
                className="btn-close-mobile-cart"
                onClick={() => setIsMobileCartOpen(false)}
                aria-label="Collapse cart drawer"
                title="Collapse cart drawer"
              >
                <CaretDown size={16} weight="bold" />
              </button>
            </div>
          </div>

          <div className="bill-customer-inputs">
            <input
              placeholder="Customer Name (optional)"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="customer-input"
            />
            {receiptConfig?.show_address_field !== false && (
              <input
                placeholder="Address (e.g. Phase 4, or leave blank for Walk-in)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
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
              <p>
                Tap products or enter scale weights to build this customer
                order.
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const isKg = isWeightUnit(item.unit);
              return (
                <div key={item.cartId} className="bill-row">
                  <div className="bill-row-top">
                    <strong className="bill-item-title" title={item.name}>
                      {item.name}
                    </strong>
                    <div className="bill-row-top-right">
                      <span className="bill-item-price">
                        {formatPeso(item.subtotal)}
                      </span>
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
                      {formatPeso(item.price)} / {item.unit}
                    </span>
                    <div className="bill-qty-controls">
                      {!isKg && onStepItemQty && (
                        <button
                          type="button"
                          className="qty-step-btn"
                          onClick={() => onStepItemQty(item.cartId, -1)}
                          title="Decrease quantity by 1"
                          aria-label={`Decrease ${item.name} quantity`}
                        >
                          <Minus size={12} weight="bold" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="bill-item-qty-badge"
                        onClick={() => onEditItem && onEditItem(item)}
                        title="Tap to change quantity or weight"
                      >
                        <span>
                          {item.quantity}{" "}
                          <span className="qty-unit">{item.unit}</span>
                        </span>
                        {onEditItem && (
                          <PencilSimple
                            size={11}
                            weight="bold"
                            className="qty-edit-icon"
                          />
                        )}
                      </button>
                      {!isKg && onStepItemQty && (
                        <button
                          type="button"
                          className="qty-step-btn"
                          onClick={() => onStepItemQty(item.cartId, 1)}
                          title="Increase quantity by 1"
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          <Plus size={12} weight="bold" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="bill-footer">
          {/* Portrait iPad & Mobile Expand/Collapse Toggle Bar */}
          <button
            type="button"
            className="mobile-cart-toggle-pill"
            onClick={() => setIsMobileCartOpen((prev) => !prev)}
            aria-expanded={isMobileCartOpen}
          >
            <ShoppingCart size={15} weight="bold" />
            <span>
              {cart.length} {cart.length === 1 ? "Item" : "Items"}
              {customer.trim() ? ` · ${customer.trim()}` : " · Review / Info"}
            </span>
            {isMobileCartOpen ? (
              <CaretDown size={14} weight="bold" />
            ) : (
              <CaretUp size={14} weight="bold" />
            )}
          </button>

          <div className="total-line">
            <span className="total-label">Total Amount</span>
            <span className="total-val">{formatPeso(totalAmount)}</span>
          </div>
          <div className="bill-footer-buttons">
            <button
              type="button"
              className="btn-clear-cart"
              onClick={() => setShowClearConfirm(true)}
              disabled={cart.length === 0}
              title="Clear current cart"
            >
              Clear
            </button>
            <button
              type="button"
              className="btn-checkout"
              onClick={handleCheckoutClick}
              disabled={cart.length === 0 || isCheckingOut}
              style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
            >
              <CheckCircle
                size={18}
                weight="bold"
                style={{ color: "#ffffff" }}
              />
              <span
                style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
              >
                {isCheckingOut ? "Processing..." : "Complete Transaction"}
              </span>
            </button>
          </div>
        </div>
      </aside>

      <ConfirmModal
        isOpen={showClearConfirm}
        title="Clear Current Order?"
        message={`Remove all ${cart.length} ${
          cart.length === 1 ? "item" : "items"
        } and reset customer details from the active cart?`}
        confirmLabel="Clear Cart"
        cancelLabel="Keep Items"
        variant="danger"
        onConfirm={handleConfirmClear}
        onCancel={() => setShowClearConfirm(false)}
      />
    </>
  );
}
