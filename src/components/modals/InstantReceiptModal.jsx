import React, { useState, useEffect } from "react";
import {
  Printer,
  DownloadSimple,
  X,
  CheckCircle,
  Copy,
  Check,
  CircleNotch,
  ArrowCounterClockwise
} from "@phosphor-icons/react";
import { captureElementToPng } from "../../utils/exportImage";
import { formatReceiptText } from "../../data/receiptConfig";
import { formatPeso } from "../../utils/themeUtils";
import { isDeliveryOrder, roundCentavos } from "../../utils/moneyUtils";
import ReceiptCard from "../shared/ReceiptCard";

export default function InstantReceiptModal({
  order,
  onClose,
  storeName = "My Store",
  receiptConfig,
  canUndo = false,
  onUndo,
  showToast
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!order) return null;

  const elementId = `instant-receipt-${order.id}`;
  const items = Array.isArray(order.items) ? order.items : [];
  const rawShortId = order.id
    ? String(order.id).replace(/^demo-order-|^demo-ord-/, "").slice(-6).toUpperCase()
    : "0000";
  const orNumber =
    order.or_number ||
    (rawShortId.startsWith("OR-") || rawShortId.startsWith("RCP-")
      ? rawShortId
      : `OR-${rawShortId}`);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const safeOr = (orNumber || order.customer_name || "Receipt").replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );
      await captureElementToPng(elementId, `Receipt_${safeOr}.png`, {
        onSuccess: (msg) => {
          if (showToast) showToast(msg || "Receipt Saved!");
        },
        onError: (err) => {
          if (showToast) showToast("Save failed: " + err);
        }
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyText = async () => {
    try {
      const itemsList = items
        .map((it) => {
          const qty = Number(it.quantity) || 0;
          const sub = Number(it.subtotal) || 0;
          const unitRate =
            Number(it.price) > 0
              ? Number(it.price)
              : qty > 0 && sub > 0
              ? roundCentavos(sub / qty)
              : 0;
          return `${it.name}\n  ${it.quantity} ${it.unit} @${formatPeso(unitRate)} = ${formatPeso(sub)}`;
        })
        .join("\n");

      const isDelivery = isDeliveryOrder(order);
      const hasAddress =
        Boolean(order.address) &&
        String(order.address).trim().toLowerCase() !== "walk-in" &&
        String(order.address).trim().toLowerCase() !== "walk in" &&
        String(order.address).trim().toLowerCase() !== "in-store";

      const lines = [
        storeName,
        receiptConfig?.tagline || "",
        receiptConfig?.address || "",
        receiptConfig?.phone ? `Tel: ${receiptConfig.phone}` : "",
        "================================",
        (receiptConfig?.subtitle || "SALES INVOICE / CASH SLIP").toUpperCase(),
        receiptConfig?.show_receipt_no !== false ? `OR No: ${orNumber}` : "",
        `Date: ${order.display_date || order.raw_date || ""} ${order.time || ""}`.trim(),
        `Customer: ${order.customer_name || "Walk-in Customer"}`,
        hasAddress ? `Address: ${order.address}` : "",
        `Type: ${isDelivery ? "Delivery Sale" : "Walk-in Sale"}`,
        "--------------------------------",
        "ITEM DESCRIPTION",
        itemsList,
        "--------------------------------",
        `TOTAL AMOUNT DUE: ${formatPeso(order.total || 0)}`,
        `Total Items: ${items.length}`,
        "================================",
        formatReceiptText(
          receiptConfig?.footer_line1 || "Thank you for shopping at {store}!",
          storeName
        ),
        receiptConfig?.footer_line2
          ? formatReceiptText(receiptConfig.footer_line2, storeName)
          : ""
      ]
        .filter(Boolean)
        .join("\n");

      await navigator.clipboard.writeText(lines);
      setCopied(true);
      if (showToast) showToast("Receipt text copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy receipt text:", err);
    }
  };

  return (
    <div
      className="receipt-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="receipt-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="receipt-modal-actions no-print">
          <div className="receipt-success-badge">
            <CheckCircle size={18} weight="fill" />
            <span>{canUndo ? "Sale Completed" : "Official Receipt"}</span>
          </div>

          <div className="receipt-action-btns">
            <button
              type="button"
              className="receipt-btn-action"
              onClick={handlePrint}
              title="Print thermal receipt or Save as PDF"
            >
              <Printer size={15} weight="bold" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              className="receipt-btn-action"
              onClick={handleDownload}
              disabled={isSaving}
              title="Save full continuous receipt as high-res PNG image"
            >
              {isSaving ? (
                <CircleNotch size={15} weight="bold" className="receipt-spin" />
              ) : (
                <DownloadSimple size={15} weight="bold" />
              )}
              <span>{isSaving ? "Saving..." : "Save PNG"}</span>
            </button>
            <button
              type="button"
              className={`receipt-btn-action ${copied ? "receipt-btn-copied" : ""}`}
              onClick={handleCopyText}
              title="Copy receipt text to clipboard"
            >
              {copied ? (
                <Check size={15} weight="bold" />
              ) : (
                <Copy size={15} weight="bold" />
              )}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
            <button
              type="button"
              className="receipt-btn-close"
              onClick={onClose}
              aria-label="Close receipt"
              title="Close (Esc)"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Container for Long Thermal Receipts */}
        <div className="receipt-scroll-container">
          <ReceiptCard
            id={elementId}
            order={order}
            storeName={storeName}
            receiptConfig={receiptConfig}
          />
        </div>

        {/* Dismiss / Footer Button Row */}
        <div className="receipt-footer-btn-row no-print">
          <div className="receipt-footer-summary">
            <span>{items.length} Line {items.length === 1 ? "Item" : "Items"}</span>
            <strong>Total: {formatPeso(order.total || 0)}</strong>
          </div>
          <div className="receipt-footer-btn-group">
            {canUndo && onUndo && (
              <button
                type="button"
                className="receipt-undo-sale-btn"
                onClick={() => onUndo(order.id)}
                title="Undo this checkout and restore items to cart"
              >
                <ArrowCounterClockwise size={16} weight="bold" />
                <span>Undo Checkout</span>
              </button>
            )}
            <button
              type="button"
              className="receipt-new-sale-btn"
              onClick={onClose}
            >
              {canUndo ? "Done / Next Transaction" : "Close Receipt"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
