import React from "react";
import html2canvas from "html2canvas";
import { CheckCircle, X, ArrowCounterClockwise, Camera } from "@phosphor-icons/react";
import { formatReceiptText } from "../../data/receiptConfig";
import { exportCanvasImage } from "../../utils/exportImage";
import { formatPeso } from "../../utils/themeUtils";

export default function InstantReceiptModal({
  order,
  onClose,
  storeName,
  receiptConfig,
  canUndo = false,
  onUndo,
  showToast
}) {
  if (!order) return null;

  const handleSaveReceipt = async () => {
    const element = document.getElementById(`instant-receipt-${order.id}`);
    if (!element) return;
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true
      });
      const safeName = (order.customer_name || 'Receipt').replace(/\s+/g, '_');
      await exportCanvasImage(
        canvas,
        `Receipt_${safeName}_${Date.now()}.png`,
        (msg) => showToast(msg || "Receipt Saved!"),
        (err) => showToast("Save failed: " + err)
      );
    } catch (err) {
      console.error("Instant receipt download failed:", err);
      showToast("Download failed: " + err.message);
    }
  };

  return (
    <div className="parser-modal-overlay" onClick={onClose}>
      <div className="parser-modal-content receipt-popup-modal" onClick={e => e.stopPropagation()}>
        <div className="receipt-popup-header">
          <div className="receipt-popup-badge">
            <CheckCircle size={20} weight="fill" color="#10b981" />
            <span>Transaction Complete</span>
          </div>
          <button 
            type="button" 
            className="receipt-popup-close" 
            onClick={onClose}
            aria-label="Close receipt modal"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="receipt-popup-scroll">
          <div id={`instant-receipt-${order.id}`} className="history-card instant-receipt-card">
            <div className="receipt-brand-header">
              <h3>{storeName.toUpperCase()}</h3>
              <p>{receiptConfig?.subtitle || "Official Sales Receipt"}</p>
              {receiptConfig?.tagline && (
                <p className="receipt-tagline">{receiptConfig.tagline}</p>
              )}
              {receiptConfig?.address && (
                <p className="receipt-contact-info">{receiptConfig.address}</p>
              )}
              {receiptConfig?.phone && (
                <p className="receipt-contact-info">Tel: {receiptConfig.phone}</p>
              )}
              {receiptConfig?.show_receipt_no && (
                <div className="receipt-order-no">
                  Receipt #{order.id ? order.id.slice(-6).toUpperCase() : '000000'}
                </div>
              )}
            </div>

            <div className="receipt-divider"></div>

            <div className="receipt-body">
              <div className="receipt-left">
                <div className="h-customer-name"><strong>{order.customer_name}</strong></div>
                <div className="h-meta">{order.display_date} | {order.time}</div>
                <div className="h-items-list">
                  {(order.items || []).map(it => (
                    <div key={it.cartId || `${it.name}-${it.quantity}`} className="h-item-line">
                      {it.name} ({it.quantity}{it.unit}) ₱{(it.subtotal || 0).toFixed(2)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="receipt-right">
                <span className="h-total-amount">{formatPeso(order.total || 0)}</span>
              </div>
            </div>

            <div className="receipt-divider"></div>

            <div className="receipt-footer">
              <p>{formatReceiptText(receiptConfig?.footer_line1 || "Thank you for shopping at {store}!", storeName)}</p>
              {receiptConfig?.footer_line2 && (
                <p>{formatReceiptText(receiptConfig.footer_line2, storeName)}</p>
              )}
            </div>
          </div>
        </div>

        <div className="receipt-popup-actions">
          {canUndo && (
            <button 
              type="button"
              className="btn-undo-instant-receipt"
              onClick={() => onUndo(order.id)}
              title="Undo this checkout and restore items to cart"
            >
              <ArrowCounterClockwise size={16} weight="bold" />
              <span>Undo Checkout</span>
            </button>
          )}
          <button 
            type="button" 
            className="btn-download-instant-receipt"
            onClick={handleSaveReceipt}
          >
            <Camera size={18} weight="bold" />
            <span>Save Receipt</span>
          </button>
          <button 
            type="button" 
            className="btn-new-sale" 
            onClick={onClose}
          >
            New Sale
          </button>
        </div>
      </div>
    </div>
  );
}
