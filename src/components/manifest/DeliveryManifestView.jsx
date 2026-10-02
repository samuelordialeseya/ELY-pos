import React from "react";
import { CheckCircle, Camera } from "@phosphor-icons/react";
import { formatPeso } from "../../utils/themeUtils";

export default function DeliveryManifestView({
  orders = [],
  filterDate,
  setFilterDate,
  selectedOrderIds,
  setSelectedOrderIds,
  storeName,
  onToggleStatus,
  onCaptureManifest
}) {
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

  const totalManifestAmount = selectedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

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
                    onClick={() => {
                      setSelectedOrderIds(prev => 
                        prev.includes(o.id) ? prev.filter(i => i !== o.id) : [...prev, o.id]
                      );
                    }}
                  >
                    <input type="checkbox" checked={isSelected} readOnly />
                    <div className="o-info">
                      <strong>
                        {o.customer_name} 
                        {isDelivered && (
                          <CheckCircle size={16} weight="fill" className="status-delivered-icon" />
                        )}
                      </strong>
                      <p>{o.address}</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="btn-status-toggle" 
                    onClick={() => onToggleStatus(o.id, o.status, o.raw_date)}
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
