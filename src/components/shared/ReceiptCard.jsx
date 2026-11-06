import React, { forwardRef } from "react";
import { formatReceiptText } from "../../data/receiptConfig";
import { formatPeso } from "../../utils/themeUtils";
import { isDeliveryOrder, roundCentavos } from "../../utils/moneyUtils";

/**
 * Unified 80mm Vertical Thermal Receipt Card component used across
 * InstantReceiptModal (POS Checkout & Order History) and Settings live preview.
 */
const ReceiptCard = forwardRef(function ReceiptCard(
  {
    id,
    className = "",
    order,
    storeName = "My Store",
    receiptConfig
  },
  ref
) {
  if (!order) return null;

  const isDelivery = isDeliveryOrder(order);
  const items = Array.isArray(order.items) ? order.items : [];
  const rawShortId = order.id
    ? String(order.id).replace(/^demo-order-|^demo-ord-/, "").slice(-6).toUpperCase()
    : "0000";
  const orNumber =
    order.or_number ||
    (rawShortId.startsWith("OR-") || rawShortId.startsWith("RCP-")
      ? rawShortId
      : `OR-${rawShortId}`);

  const dateStr =
    order.display_date ||
    order.raw_date ||
    (order.created_at || order.timestamp
      ? new Date(order.created_at || order.timestamp).toLocaleDateString("en-PH")
      : "");
  const timeStr =
    order.time ||
    (order.created_at || order.timestamp
      ? new Date(order.created_at || order.timestamp).toLocaleTimeString("en-PH", {
          hour: "2-digit",
          minute: "2-digit"
        })
      : "");

  const showOrNo =
    receiptConfig?.show_receipt_no !== undefined
      ? Boolean(receiptConfig.show_receipt_no)
      : true;

  const hasDeliveryAddress =
    Boolean(order.address) &&
    String(order.address).trim().toLowerCase() !== "walk-in" &&
    String(order.address).trim().toLowerCase() !== "walk in" &&
    String(order.address).trim().toLowerCase() !== "in-store";

  return (
    <div
      id={id}
      ref={ref}
      className={`receipt-thermal-paper ${className}`.trim()}
    >
      {/* Header */}
      <div className="receipt-head-center">
        <h2 className="receipt-store-title">{storeName || "My Store"}</h2>
        {receiptConfig?.tagline && (
          <p className="receipt-store-tagline">{receiptConfig.tagline}</p>
        )}
        {receiptConfig?.address && (
          <p className="receipt-store-meta">{receiptConfig.address}</p>
        )}
        {receiptConfig?.phone && (
          <p className="receipt-store-meta">Tel: {receiptConfig.phone}</p>
        )}
        <div className="receipt-divider-dash" />
        <h4 className="receipt-doc-title">
          {(receiptConfig?.subtitle || "SALES INVOICE / CASH SLIP").toUpperCase()}
        </h4>
      </div>

      {/* Metadata */}
      <div className="receipt-meta-grid">
        {showOrNo && (
          <div className="meta-line">
            <span>OR No:</span>
            <strong>{orNumber}</strong>
          </div>
        )}
        <div className="meta-line">
          <span>Date:</span>
          <span>
            {dateStr}
            {timeStr ? ` ${timeStr}` : ""}
          </span>
        </div>
        <div className="meta-line">
          <span>Customer:</span>
          <span>{order.customer_name || "Walk-in Customer"}</span>
        </div>
        {hasDeliveryAddress && (
          <div className="meta-line">
            <span>Address:</span>
            <span>{order.address}</span>
          </div>
        )}
        <div className="meta-line">
          <span>Type:</span>
          <span>{isDelivery ? "Delivery Sale" : "Walk-in Sale"}</span>
        </div>
      </div>

      <div className="receipt-divider-solid" />

      {/* Line items */}
      <div className="receipt-items-table">
        <div className="receipt-item-header">
          <span className="col-desc">ITEM DESCRIPTION</span>
          <span className="col-qty">QTY</span>
          <span className="col-price">PRICE</span>
          <span className="col-sub">TOTAL</span>
        </div>
        <div className="receipt-divider-dash" />

        {items.map((it, idx) => {
          const qty = Number(it.quantity) || 0;
          const sub = Number(it.subtotal) || 0;
          const unitRate =
            Number(it.price) > 0
              ? Number(it.price)
              : qty > 0 && sub > 0
              ? roundCentavos(sub / qty)
              : 0;

          return (
            <div key={it.cartId || `${it.name}-${idx}`} className="receipt-item-line">
              <div className="item-name-row">
                <span className="item-name">{it.name}</span>
              </div>
              <div className="item-calc-row">
                <span className="col-desc" />
                <span className="col-qty">
                  {it.quantity} {it.unit}
                </span>
                <span className="col-price">
                  {unitRate > 0 ? `@${formatPeso(unitRate)}` : ""}
                </span>
                <span className="col-sub">{formatPeso(sub)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="receipt-divider-solid" />

      {/* Grand Totals */}
      <div className="receipt-totals-area">
        <div className="totals-row total-bold">
          <span>TOTAL AMOUNT DUE:</span>
          <span className="total-highlight">{formatPeso(order.total || 0)}</span>
        </div>
        <div className="totals-row">
          <span>Total Items:</span>
          <span>
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </div>
      </div>

      <div className="receipt-divider-dash" />

      {/* Footer Notice */}
      <div className="receipt-foot-center">
        <p className="foot-phrase">
          {formatReceiptText(
            receiptConfig?.footer_line1 || "Thank you for shopping at {store}!",
            storeName
          )}
        </p>
        {receiptConfig?.footer_line2 && (
          <p className="foot-phrase-sub">
            {formatReceiptText(receiptConfig.footer_line2, storeName)}
          </p>
        )}
        <p className="foot-small">Processed by ELY.pos</p>
      </div>
    </div>
  );
});

export default ReceiptCard;
