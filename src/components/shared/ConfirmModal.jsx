import React, { useEffect } from "react";
import { WarningCircle, X } from "@phosphor-icons/react";

export default function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onCancel?.();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onConfirm?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen) return null;

  return (
    <div
      className="confirm-modal-overlay"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="confirm-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-modal-header">
          <div className={`confirm-modal-icon confirm-icon-${variant}`}>
            <WarningCircle size={22} weight="fill" />
          </div>
          <button
            type="button"
            className="confirm-modal-close"
            onClick={onCancel}
            aria-label="Close confirmation dialog"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="confirm-modal-body">
          <h4 id="confirm-modal-title" className="confirm-modal-title">
            {title}
          </h4>
          <p className="confirm-modal-message">{message}</p>
        </div>

        <div className="confirm-modal-actions">
          <button
            type="button"
            className="btn-confirm-cancel"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn-confirm-action btn-confirm-${variant}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
