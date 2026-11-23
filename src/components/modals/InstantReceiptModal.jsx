import React, { useState, useEffect, useMemo } from "react";
import {
  CheckCircle,
  CircleNotch
} from "@phosphor-icons/react";
import ButtonIcon from "../common/ButtonIcon";
import { captureElementToPng } from "../../utils/exportImage";
import { formatReceiptText } from "../../data/receiptConfig";
import { formatPeso } from "../../utils/themeUtils";
import { isDeliveryOrder, roundCentavos } from "../../utils/moneyUtils";
import ReceiptCard from "../shared/ReceiptCard";

function extractContactInfo(order) {
  if (!order) return { phone: "", email: "" };
  const pool = [
    order.customer_phone,
    order.phone,
    order.customer_name,
    order.address
  ];
  let phone = "";
  let email = "";
  for (const str of pool) {
    if (!str || typeof str !== "string") continue;
    if (!phone) {
      const match = str.match(/(?:\+63|0)?9\d{2}[-\s]?\d{3}[-\s]?\d{4}/) || str.match(/(?:\+63|0)?9\d{9}/);
      if (match) {
        phone = match[0].replace(/[-\s]/g, "");
      }
    }
    if (!email) {
      const match = str.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (match) {
        email = match[0];
      }
    }
  }
  return { phone, email };
}

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

  const detectedContact = useMemo(() => extractContactInfo(order), [order]);
  const [sendTarget, setSendTarget] = useState(() => detectedContact.phone || detectedContact.email || "");

  useEffect(() => {
    const c = extractContactInfo(order);
    setSendTarget(c.phone || c.email || "");
  }, [order]);

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

  const getReceiptText = () => {
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
        return `• ${it.name}: ${it.quantity} ${it.unit} @${formatPeso(unitRate)} = ${formatPeso(sub)}`;
      })
      .join("\n");

    const isDelivery = isDeliveryOrder(order);
    const hasAddress =
      Boolean(order.address) &&
      String(order.address).trim().toLowerCase() !== "walk-in" &&
      String(order.address).trim().toLowerCase() !== "walk in" &&
      String(order.address).trim().toLowerCase() !== "in-store";

    return [
      `🛒 ${storeName.toUpperCase()}`,
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
      `TOTAL AMOUNT: ${formatPeso(order.total || 0)}`,
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
  };

  const handleCopyText = async () => {
    try {
      const lines = getReceiptText();
      await navigator.clipboard.writeText(lines);
      setCopied(true);
      if (showToast) showToast("Receipt text copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy receipt text:", err);
    }
  };

  const handleSendSMS = () => {
    const text = getReceiptText();
    const cleanNum = sendTarget.trim().replace(/[^0-9+]/g, "");
    const url = cleanNum
      ? `sms:${cleanNum}?&body=${encodeURIComponent(text)}`
      : `sms:?&body=${encodeURIComponent(text)}`;
    if (showToast) showToast(cleanNum ? `Opening SMS for ${cleanNum}...` : "Opening Messages...");
    window.location.href = url;
  };

  const handleSendWhatsApp = () => {
    const text = getReceiptText();
    let num = sendTarget.trim().replace(/[^0-9]/g, "");
    if (num.startsWith("09") && num.length === 11) {
      num = "63" + num.slice(1);
    }
    const url = num
      ? `https://wa.me/${num}?text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    if (showToast) showToast(num ? `Opening WhatsApp for +${num}...` : "Opening WhatsApp...");
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSendViber = () => {
    const text = getReceiptText();
    const viberUrl = `viber://forward?text=${encodeURIComponent(text)}`;
    if (showToast) showToast("Opening Viber with receipt...");
    window.location.href = viberUrl;
  };

  const handleSendEmail = () => {
    const text = getReceiptText();
    const targetEmail = sendTarget.includes("@") ? sendTarget.trim() : "";
    const subject = `${storeName} Receipt — ${orNumber}`;
    const mailto = `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    if (showToast) showToast(targetEmail ? `Opening Email for ${targetEmail}...` : "Opening Mail app...");
    window.location.href = mailto;
  };

  const handleNativeShare = async () => {
    const text = getReceiptText();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${storeName} Receipt — ${orNumber}`,
          text: text
        });
        if (showToast) showToast("Receipt shared!");
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Share error:", err);
        }
      }
    } else {
      await handleCopyText();
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
              <ButtonIcon name="printer" size={14} color="#27272a" />
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
                <CircleNotch size={14} weight="bold" className="receipt-spin" />
              ) : (
                <ButtonIcon name="download" size={14} color="#27272a" />
              )}
              <span>{isSaving ? "Saving..." : "Save PNG"}</span>
            </button>
            <button
              type="button"
              className={`receipt-btn-action ${copied ? "receipt-btn-copied" : ""}`}
              onClick={handleCopyText}
              title="Copy receipt text to clipboard"
            >
              <ButtonIcon name={copied ? "check" : "copy"} size={14} color={copied ? "#ffffff" : "#27272a"} />
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
            {typeof navigator !== "undefined" && navigator.share && (
              <button
                type="button"
                className="receipt-btn-action"
                onClick={handleNativeShare}
                title="Send / Share receipt via iOS Share Sheet"
              >
                <ButtonIcon name="share" size={14} color="#00A3E0" />
                <span>Share</span>
              </button>
            )}
            <button
              type="button"
              className="receipt-btn-close"
              onClick={onClose}
              aria-label="Close receipt"
              title="Close (Esc)"
            >
              <ButtonIcon name="x" size={14} color="#71717a" />
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

        {/* ─── Send To Customer Directly ─── */}
        <div className="receipt-send-bar no-print">
          <div className="receipt-send-header">
            <div className="receipt-send-title">
              <ButtonIcon name="paperPlane" size={13} color="#00A3E0" />
              <span>Send To Customer:</span>
            </div>
            {detectedContact.phone && sendTarget !== detectedContact.phone && (
              <button
                type="button"
                className="receipt-use-detected-btn"
                onClick={() => setSendTarget(detectedContact.phone)}
                title={`Use detected phone ${detectedContact.phone}`}
              >
                Auto-fill: {detectedContact.phone}
              </button>
            )}
          </div>

          <div className="receipt-send-controls">
            <div className="receipt-send-input-wrap">
              <input
                type="text"
                className="receipt-send-input"
                placeholder="Enter mobile (09XX-XXX-XXXX) or email..."
                value={sendTarget}
                onChange={(e) => setSendTarget(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (sendTarget.includes("@")) {
                      handleSendEmail();
                    } else {
                      handleSendSMS();
                    }
                  }
                }}
              />
              {sendTarget && (
                <button
                  type="button"
                  className="receipt-send-clear-btn"
                  onClick={() => setSendTarget("")}
                  title="Clear input"
                  aria-label="Clear recipient input"
                >
                  <ButtonIcon name="x" size={12} color="#94a3b8" />
                </button>
              )}
            </div>

            <div className="receipt-send-channels">
              <button
                type="button"
                className="receipt-channel-btn btn-sms"
                onClick={handleSendSMS}
                title="Send receipt directly via SMS / Messages"
              >
                <ButtonIcon name="chatDots" size={13} color="#0284c7" />
                <span>SMS</span>
              </button>

              <button
                type="button"
                className="receipt-channel-btn btn-viber"
                onClick={handleSendViber}
                title="Send receipt via Viber"
              >
                <ButtonIcon name="chatDots" size={13} color="#7c3aed" />
                <span>Viber</span>
              </button>

              <button
                type="button"
                className="receipt-channel-btn btn-whatsapp"
                onClick={handleSendWhatsApp}
                title="Send receipt directly via WhatsApp"
              >
                <ButtonIcon name="whatsapp" size={13} color="#16a34a" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                className="receipt-channel-btn btn-email"
                onClick={handleSendEmail}
                title="Send receipt via Email"
              >
                <ButtonIcon name="envelope" size={13} color="#475569" />
                <span>Email</span>
              </button>

              {typeof navigator !== "undefined" && navigator.share && (
                <button
                  type="button"
                  className="receipt-channel-btn btn-share"
                  onClick={handleNativeShare}
                  title="Send via iPadOS Share Sheet"
                >
                  <ButtonIcon name="share" size={13} color="#00A3E0" />
                  <span>Share</span>
                </button>
              )}
            </div>
          </div>
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
                <ButtonIcon name="arrowClockwise" size={14} color="#27272a" />
                <span>Undo Checkout</span>
              </button>
            )}
            <button
              type="button"
              className="receipt-new-sale-btn"
              onClick={onClose}
            >
              <ButtonIcon name="check" size={15} color="#ffffff" />
              <span>{canUndo ? "Done / Next Transaction" : "Close Receipt"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
