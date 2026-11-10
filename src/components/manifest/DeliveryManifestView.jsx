import React, { useState } from "react";
import { CheckCircle, Camera, Check, Minus } from "@phosphor-icons/react";
import { formatPeso } from "../../utils/themeUtils";
import { roundCentavos } from "../../utils/moneyUtils";

export default function DeliveryManifestView({
  orders = [],
  filterDate,
  setFilterDate,
  storeName,
  onToggleStatus,
  onCaptureManifest
}) {
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

  // Sort delivered to the bottom
  const deliveryList = [...orders].filter(o => {
    const oDate = o.raw_date || (o.created_at ? o.created_at.slice(0, 10) : "");
    return !filterDate || oDate === filterDate;
  }).sort((a, b) => {
    if (a.status === "Delivered" && b.status !== "Delivered") return 1;
    if (a.status !== "Delivered" && b.status === "Delivered") return -1;
    return 0;
  });

  const getPriority = (addr) => {
    const val = addr ? addr.trim() : "";
    if (val.startsWith('4')) return 1;
    if (val.startsWith('3')) return 2;
    if (val.startsWith('2')) return 3;
    if (val.startsWith('1')) return 4;
    return 5;
  };

  const selectedOrders = orders
    .filter(o => selectedOrderIds.includes(o.id))
    .sort((a, b) => getPriority(a.address) - getPriority(b.address));

  const totalManifestAmount = roundCentavos(
    selectedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
  );

  const FLAG_LABELS = { 
    fragile: "🥚 Fragile", 
    cold: "🧊 Keep Cold", 
    bulky: "📦 Bulky", 
    care: "⚠️ Handle Care" 
  };

  const flagCounts = {};
  selectedOrders.forEach(o => {
    (o.items || []).forEach(it => {
      if (it.special_flag) {
        flagCounts[it.special_flag] = (flagCounts[it.special_flag] || 0) + 1;
      }
    });
  });
  const flagEntries = Object.entries(flagCounts);

  const allSelected = deliveryList.length > 0 && deliveryList.every(o => selectedOrderIds.includes(o.id));
  const someSelected = selectedOrderIds.length > 0 && !allSelected;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(deliveryList.map(o => o.id));
    }
  };

  const handleToggleOrder = (orderId) => {
    setSelectedOrderIds(prev => 
      prev.includes(orderId) ? prev.filter(i => i !== orderId) : [...prev, orderId]
    );
  };

  return (
    <div className="delivery-grid">
      <div className="delivery-step-select">
        <div className="pane-header">
          <h4>1. Selection (Delivered at Bottom)</h4>
          <input 
            type="date" 
            value={filterDate} 
            onChange={e => setFilterDate(e.target.value)} 
            className="date-input" 
          />
        </div>

        {deliveryList.length > 0 && (
          <div className="delivery-selection-toolbar">
            <button 
              type="button" 
              className="btn-select-all"
              onClick={handleToggleSelectAll}
              title={allSelected ? "Deselect all orders" : "Select all orders"}
            >
              <span className={`custom-checklist-box ${allSelected ? "checked" : someSelected ? "indeterminate" : ""}`}>
                {allSelected && <Check size={12} weight="bold" className="custom-check-icon" />}
                {someSelected && <Minus size={12} weight="bold" className="custom-check-icon" />}
              </span>
              <span>{allSelected ? "Deselect All" : "Select All"}</span>
            </button>
            <span className="selection-count-badge">
              {selectedOrderIds.length} of {deliveryList.length} selected
            </span>
          </div>
        )}

        <div className="order-selection-list">
          {deliveryList.length === 0 ? (
            <div className="history-empty">No orders for delivery on {filterDate}.</div>
          ) : (
            deliveryList.map(o => {
              const isDelivered = o.status === 'Delivered';
              const isSelected = selectedOrderIds.includes(o.id);
              return (
                <div 
                  key={o.id} 
                  className={`order-sel-card ${isDelivered ? 'is-delivered' : ''} ${isSelected ? 'active' : ''}`}
                >
                  <div 
                    className="sel-click-area" 
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() => handleToggleOrder(o.id)}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        handleToggleOrder(o.id);
                      }
                    }}
                  >
                    <span 
                      className={`custom-checklist-box ${isSelected ? "checked" : ""}`}
                      aria-hidden="true"
                    >
                      {isSelected && <Check size={12} weight="bold" className="custom-check-icon" />}
                    </span>
                    <div className="o-info">
                      <div className="o-info-top">
                        <strong className="o-customer-name">
                          {o.customer_name || "Customer"} 
                          {isDelivered && (
                            <span className="delivered-tag" title="Delivered">
                              <CheckCircle size={13} weight="fill" /> Delivered
                            </span>
                          )}
                        </strong>
                        {o.total ? (
                          <span className="o-amount-tag">{formatPeso(o.total)}</span>
                        ) : null}
                      </div>
                      <p className="o-address">{o.address || "No address provided"}</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="btn-status-toggle" 
                    onClick={() => onToggleStatus(o.id, o.status, o.raw_date)}
                    title={isDelivered ? "Mark as Pending Delivery" : "Mark as Delivered"}
                  >
                    {isDelivered ? "Undo" : "Done"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="delivery-step-preview">
        <div className="preview-top-bar">
          <h4>2. Manifest Preview</h4>
          {selectedOrderIds.length > 0 && (
            <button 
              type="button" 
              className="btn-download-manifest" 
              onClick={onCaptureManifest}
            >
              <Camera size={16} /> Download Image
            </button>
          )}
        </div>
        <div id="manifest-area-capture" className="manifest-sheet">
          <div className="manifest-header">
            <h2>{storeName.toUpperCase()}'S RIDER MANIFEST</h2>
            <div className="manifest-meta">
              <span>Date: {filterDate}</span>
              <span>Rider: _________________</span>
            </div>
          </div>

          {flagEntries.length > 0 && (
            <div className="manifest-flag-alert">
              <div className="manifest-flag-list">
                {flagEntries.map(([key, count]) => (
                  <span key={key} className={`manifest-flag-pill flag-${key}`}>
                    {FLAG_LABELS[key]} — {count} order{count > 1 ? "s" : ""}
                  </span>
                ))}
              </div>
            </div>
          )}

          <table className="manifest-table">
            <thead>
              <tr>
                <th>CUSTOMER</th>
                <th>ADDRESS</th>
                <th style={{ textAlign: 'right' }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {selectedOrders.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center", padding: "24px", color: "var(--text-subtle)" }}>
                    Select one or more orders from the left list to populate the rider manifest.
                  </td>
                </tr>
              ) : (
                selectedOrders.map(o => (
                  <tr key={o.id}>
                    <td>
                      <div className="manifest-customer-cell">
                        <strong>{o.customer_name ? o.customer_name.toUpperCase() : "CUSTOMER"}</strong>
                        {(o.items || []).filter(it => it.special_flag).map((it, i) => {
                          const emoji = 
                            it.special_flag === "fragile" ? "🥚" : 
                            it.special_flag === "cold" ? "🧊" : 
                            it.special_flag === "bulky" ? "📦" : "⚠️";
                          return (
                            <span key={i} className={`manifest-item-flag flag-${it.special_flag}`}>
                              {emoji} {it.name}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      {o.address && (o.address.startsWith('4') || o.address.startsWith('3') || o.address.startsWith('2') || o.address.startsWith('1')) 
                        ? `Phase ${o.address}` 
                        : o.address}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '800' }}>
                      {formatPeso(o.total || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="manifest-total-line">
            TOTAL: {formatPeso(totalManifestAmount)}
          </div>
        </div>
      </div>
    </div>
  );
}
