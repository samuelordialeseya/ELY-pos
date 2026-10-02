import React from "react";
import { X, Camera, Trash } from "@phosphor-icons/react";
import { formatReceiptText } from "../../data/receiptConfig";
import { formatPeso } from "../../utils/themeUtils";

export default function OrderHistoryView({
  orders = [],
  filterDate,
  setFilterDate,
  historySearch,
  setHistorySearch,
  storeName,
  receiptConfig,
  onDownloadReceipt,
  onDeleteOrder
}) {
  const filteredOrders = orders.filter(o => {
    const oDate = o.raw_date || (o.created_at ? o.created_at.slice(0, 10) : "");
    const matchDate = !filterDate || oDate === filterDate;
    const matchName = historySearch.trim() === '' || 
      (o.customer_name || '').toLowerCase().includes(historySearch.trim().toLowerCase());
    return matchDate && matchName;
  });

  const filteredRevenue = filteredOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);

  return (
    <div className="orders-screen">
      <div className="orders-controls">
        <div className="history-filters">
          <input 
            type="date" 
            className="date-input" 
            value={filterDate} 
            onChange={e => setFilterDate(e.target.value)} 
          />
          <div className="history-search-wrap">
            <input
              type="text"
              className="history-search-input"
              placeholder="Search by customer name..."
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
            />
            {historySearch && (
              <button 
                type="button" 
                className="history-search-clear" 
                onClick={() => setHistorySearch('')}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="revenue-badge">
          <span className="revenue-label">
            {historySearch ? 'Filtered Revenue' : 'Daily Revenue'}
          </span>
          <span className="revenue-amount">{formatPeso(filteredRevenue)}</span>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="history-empty">
          No orders found{historySearch ? ` for “${historySearch}”` : ''} on {filterDate}.
        </div>
      ) : (
        filteredOrders.map(o => (
          <div key={o.id} className="history-card" id={`receipt-${o.id}`}>
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
                  Receipt #{o.id ? o.id.slice(-6).toUpperCase() : '000000'}
                </div>
              )}
            </div>

            <div className="receipt-divider"></div>

            <div className="receipt-body">
              <div className="receipt-left">
                <div className="h-customer-name">
                  <strong>{o.customer_name || 'Walk-in Customer'}</strong>
                </div>
                <div className="h-meta">{o.display_date || o.raw_date} | {o.time || ''}</div>
                <div className="h-items-list">
                  {(o.items || []).map(it => (
                    <div key={it.cartId || `${it.name}-${it.quantity}`} className="h-item-line">
                      {it.name} ({it.quantity}{it.unit}) ₱{(Number(it.subtotal) || 0).toFixed(2)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="receipt-right">
                <span className="h-total-amount">{formatPeso(o.total || 0)}</span>
                <div className="h-actions no-print">
                  <button 
                    type="button" 
                    className="btn-screenshot" 
                    onClick={() => onDownloadReceipt(o.id)} 
                    title="Download Receipt"
                    aria-label="Download Receipt"
                  >
                    <Camera size={16} />
                  </button>
                  <button 
                    type="button" 
                    className="btn-delete-order" 
                    onClick={() => onDeleteOrder(o.id, o.raw_date)} 
                    title="Delete Order"
                    aria-label="Delete Order"
                  >
                    <Trash size={16} />
                  </button>
                </div>
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
        ))
      )}
    </div>
  );
}
