import React, { useState, useMemo } from "react";
import {
  X,
  Trash,
  CaretDown,
  TrendUp,
  Receipt,
  Storefront,
  Truck,
  MagnifyingGlass,
  Calendar,
  DownloadSimple,
  Clock,
  Printer
} from "@phosphor-icons/react";
import { formatPeso } from "../../utils/themeUtils";
import { roundCentavos, isDeliveryOrder } from "../../utils/moneyUtils";
import { getLocalDateKey } from "../../data/demoSeed";
import { getOrderDateKey } from "../../utils/dateUtils";
import ConfirmModal from "../shared/ConfirmModal";

const PAGE_SIZE = 24;

function escapeCSV(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

function exportSalesJournalCSV(orders = [], dateLabel = "All_Dates") {
  const headers = [
    "Date",
    "Time",
    "OR Number",
    "Customer Name",
    "Order Type",
    "Delivery Address",
    "Items Count",
    "Items Summary",
    "Grand Total (PHP)",
    "Status"
  ];

  const rows = [headers];

  orders.forEach((o) => {
    const rawShortId = o.id
      ? String(o.id).replace(/^demo-order-|^demo-ord-/, "").slice(-6).toUpperCase()
      : "0000";
    const orNo =
      o.or_number ||
      (rawShortId.startsWith("OR-") || rawShortId.startsWith("RCP-")
        ? rawShortId
        : `OR-${rawShortId}`);
    const items = Array.isArray(o.items) ? o.items : [];
    const itemsSummary = items
      .map((it) => `${it.quantity} ${it.unit} ${it.name}`)
      .join("; ");
    const isDeliv = isDeliveryOrder(o);

    rows.push([
      o.display_date || o.raw_date || "",
      o.time || "",
      orNo,
      o.customer_name || "Walk-in Customer",
      isDeliv ? "Delivery" : "Walk-In",
      o.address || "Walk-in",
      items.length,
      itemsSummary,
      Number(o.total || 0).toFixed(2),
      o.status || "Completed"
    ]);
  });

  const csvContent =
    "\uFEFF" + rows.map((row) => row.map(escapeCSV).join(",")).join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeLabel = String(dateLabel).replace(/\s+/g, "_");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `Sales_Journal_${safeLabel}_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function OrderHistoryView({
  orders = [],
  allOrders = [],
  filterDate,
  setFilterDate,
  onSelectOrder,
  onDeleteOrder,
  showToast
}) {
  const todayKey = useMemo(() => getLocalDateKey(new Date()), []);

  const [historySearch, setHistorySearch] = useState("");
  const [historyDateMode, setHistoryDateMode] = useState(() =>
    filterDate && filterDate !== todayKey ? "custom" : "today"
  );
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [pendingDeleteOrder, setPendingDeleteOrder] = useState(null);

  const sourceOrders = useMemo(() => {
    if (historyDateMode === "all") {
      return allOrders && allOrders.length > 0 ? allOrders : orders;
    }
    return orders;
  }, [historyDateMode, allOrders, orders]);

  const filteredOrders = useMemo(() => {
    const query = historySearch.trim().toLowerCase();

    return sourceOrders.filter((o) => {
      const oDate = o.raw_date || getOrderDateKey(o);

      let matchDate = true;
      if (historyDateMode === "today") {
        matchDate = oDate === todayKey;
      } else if (historyDateMode === "custom") {
        matchDate = !filterDate || oDate === filterDate;
      }

      const rawShortId = o.id
        ? String(o.id).replace(/^demo-order-|^demo-ord-/, "").slice(-6).toLowerCase()
        : "";
      const orNo = (o.or_number || `or-${rawShortId}`).toLowerCase();

      const matchSearch =
        query === "" ||
        (o.customer_name || "").toLowerCase().includes(query) ||
        orNo.includes(query) ||
        String(o.id || "").toLowerCase().includes(query) ||
        (o.address || "").toLowerCase().includes(query) ||
        (o.items || []).some((it) =>
          (it.name || "").toLowerCase().includes(query)
        );

      const isDeliv = isDeliveryOrder(o);
      const matchType =
        orderTypeFilter === "all" ||
        (orderTypeFilter === "delivery" && isDeliv) ||
        (orderTypeFilter === "walkin" && !isDeliv);

      return matchDate && matchSearch && matchType;
    });
  }, [sourceOrders, historyDateMode, todayKey, filterDate, historySearch, orderTypeFilter]);

  const filteredRevenue = useMemo(
    () =>
      roundCentavos(
        filteredOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0)
      ),
    [filteredOrders]
  );

  const walkInOrders = useMemo(
    () => filteredOrders.filter((o) => !isDeliveryOrder(o)),
    [filteredOrders]
  );
  const walkInRevenue = useMemo(
    () =>
      roundCentavos(
        walkInOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0)
      ),
    [walkInOrders]
  );

  const deliveryOrders = useMemo(
    () => filteredOrders.filter((o) => isDeliveryOrder(o)),
    [filteredOrders]
  );
  const deliveryRevenue = useMemo(
    () =>
      roundCentavos(
        deliveryOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0)
      ),
    [deliveryOrders]
  );

  const avgTicket = useMemo(
    () =>
      filteredOrders.length > 0
        ? Math.round(filteredRevenue / filteredOrders.length)
        : 0,
    [filteredOrders.length, filteredRevenue]
  );

  const visibleOrders = useMemo(
    () => filteredOrders.slice(0, visibleCount),
    [filteredOrders, visibleCount]
  );

  const remainingCount = Math.max(0, filteredOrders.length - visibleCount);

  const handleConfirmDelete = async () => {
    if (!pendingDeleteOrder) return;
    const target = pendingDeleteOrder;
    setPendingDeleteOrder(null);
    await onDeleteOrder(target.id, target.raw_date, target);
  };

  const handleResetFilters = () => {
    setHistorySearch("");
    setHistoryDateMode("today");
    setFilterDate(todayKey);
    setOrderTypeFilter("all");
    setVisibleCount(PAGE_SIZE);
  };

  const hasActiveFilters =
    Boolean(historySearch) ||
    historyDateMode !== "today" ||
    orderTypeFilter !== "all";

  return (
    <div className="orders-screen">
      {/* 4-Card KPI Summary Banner */}
      <div className="orders-kpi-banner">
        <div className="orders-kpi-card kpi-sales">
          <div className="orders-kpi-header">
            <span className="orders-kpi-label">Filtered Gross Sales</span>
            <TrendUp size={18} className="orders-kpi-icon icon-sales" weight="bold" />
          </div>
          <div className="orders-kpi-val text-success">
            {formatPeso(filteredRevenue)}
          </div>
          <span className="orders-kpi-sub">
            {historyDateMode === "today"
              ? "Total sales settled today"
              : historyDateMode === "all"
              ? "Cumulative historical total"
              : `Sales on ${filterDate}`}
          </span>
        </div>

        <div className="orders-kpi-card kpi-receipts">
          <div className="orders-kpi-header">
            <span className="orders-kpi-label">Completed Receipts</span>
            <Receipt size={18} className="orders-kpi-icon icon-receipts" weight="duotone" />
          </div>
          <div className="orders-kpi-val">
            {filteredOrders.length}{" "}
            {filteredOrders.length === 1 ? "Order" : "Orders"}
          </div>
          <span className="orders-kpi-sub">
            Avg Ticket: <strong>{formatPeso(avgTicket)}</strong>
          </span>
        </div>

        <div className="orders-kpi-card kpi-cash">
          <div className="orders-kpi-header">
            <span className="orders-kpi-label">Walk-In / In-Store</span>
            <Storefront size={18} className="orders-kpi-icon icon-cash" weight="duotone" />
          </div>
          <div className="orders-kpi-val">{formatPeso(walkInRevenue)}</div>
          <span className="orders-kpi-sub">
            {walkInOrders.length}{" "}
            {walkInOrders.length === 1 ? "settlement" : "settlements"} in store
          </span>
        </div>

        <div className="orders-kpi-card kpi-digital">
          <div className="orders-kpi-header">
            <span className="orders-kpi-label">For Delivery</span>
            <Truck size={18} className="orders-kpi-icon icon-digital" weight="duotone" />
          </div>
          <div className="orders-kpi-val">{formatPeso(deliveryRevenue)}</div>
          <span className="orders-kpi-sub">
            {deliveryOrders.length}{" "}
            {deliveryOrders.length === 1 ? "order" : "orders"} for delivery
          </span>
        </div>
      </div>

      {/* Controls Bar: Search, Date Filter Buttons & Order Type Chips */}
      <div className="orders-controls-bar">
        <div className="orders-search-filter-row">
          <div className="orders-search-box">
            <MagnifyingGlass size={18} className="orders-search-icon" />
            <input
              type="text"
              className="orders-search-input"
              placeholder="Search by customer name, OR number, or item..."
              value={historySearch}
              onChange={(e) => {
                setHistorySearch(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              aria-label="Filter orders by customer, OR number, or items"
            />
            {historySearch && (
              <button
                type="button"
                className="orders-search-clear"
                onClick={() => {
                  setHistorySearch("");
                  setVisibleCount(PAGE_SIZE);
                }}
                aria-label="Clear order search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Date Mode Filter Buttons */}
          <div className="orders-date-filters" role="group" aria-label="Order Date Filters">
            <button
              type="button"
              className={`orders-chip-btn ${historyDateMode === "today" ? "active" : ""}`}
              onClick={() => {
                setHistoryDateMode("today");
                setFilterDate(todayKey);
                setVisibleCount(PAGE_SIZE);
              }}
            >
              Today
            </button>
            <button
              type="button"
              className={`orders-chip-btn ${historyDateMode === "all" ? "active" : ""}`}
              onClick={() => {
                setHistoryDateMode("all");
                setVisibleCount(PAGE_SIZE);
              }}
            >
              All Dates
            </button>

            <div
              className={`orders-date-picker-wrap ${
                historyDateMode === "custom" ? "custom-active" : ""
              }`}
            >
              <Calendar size={15} className="orders-calendar-icon" />
              <input
                type="date"
                className="orders-date-input"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setHistoryDateMode("custom");
                  setVisibleCount(PAGE_SIZE);
                }}
                title="Select custom audit date"
              />
            </div>
          </div>
        </div>

        {/* Order Type Quick Filter Chips & Export */}
        <div className="orders-payment-filter-row">
          <span className="orders-filter-label">Fulfillment:</span>
          <div className="orders-payment-chips">
            <button
              type="button"
              className={`orders-pay-chip ${orderTypeFilter === "all" ? "active" : ""}`}
              onClick={() => {
                setOrderTypeFilter("all");
                setVisibleCount(PAGE_SIZE);
              }}
            >
              All Orders
            </button>
            <button
              type="button"
              className={`orders-pay-chip ${orderTypeFilter === "walkin" ? "active" : ""}`}
              onClick={() => {
                setOrderTypeFilter("walkin");
                setVisibleCount(PAGE_SIZE);
              }}
            >
              Walk-In Only
            </button>
            <button
              type="button"
              className={`orders-pay-chip ${orderTypeFilter === "delivery" ? "active" : ""}`}
              onClick={() => {
                setOrderTypeFilter("delivery");
                setVisibleCount(PAGE_SIZE);
              }}
            >
              For Delivery
            </button>
          </div>

          <div className="orders-export-actions">
            <button
              type="button"
              className="btn-export-orders-csv"
              onClick={() => {
                exportSalesJournalCSV(
                  filteredOrders,
                  historyDateMode === "custom" ? filterDate : historyDateMode
                );
                if (showToast) {
                  showToast(`Exported ${filteredOrders.length} orders to CSV`);
                }
              }}
              title="Export filtered transaction journal to CSV"
            >
              <DownloadSimple size={15} weight="bold" />
              <span>Export Journal</span>
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                className="btn-reset-order-filters"
                onClick={handleResetFilters}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Compact Customer Cards Grid */}
      <div className="history-cards-grid">
        {filteredOrders.length === 0 ? (
          <div className="orders-empty-state">
            <Receipt size={44} className="orders-empty-icon" weight="duotone" />
            <h4>No Transactions Recorded</h4>
            <p>
              No orders match the current search term, date selection, or
              fulfillment filter.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                className="btn-clear-order-filters"
                onClick={handleResetFilters}
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        ) : (
          visibleOrders.map((ord) => {
            const isDelivery = isDeliveryOrder(ord);
            const items = Array.isArray(ord.items) ? ord.items : [];
            const rawShortId = ord.id
              ? String(ord.id).replace(/^demo-order-|^demo-ord-/, "").slice(-6).toUpperCase()
              : "0000";
            const orNumber =
              ord.or_number ||
              (rawShortId.startsWith("OR-") || rawShortId.startsWith("RCP-")
                ? rawShortId
                : `OR-${rawShortId}`);

            const dateStr =
              ord.display_date ||
              ord.raw_date ||
              (ord.created_at || ord.timestamp
                ? new Date(ord.created_at || ord.timestamp).toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })
                : "Today");
            const timeStr =
              ord.time ||
              (ord.created_at || ord.timestamp
                ? new Date(ord.created_at || ord.timestamp).toLocaleTimeString("en-PH", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })
                : "");

            return (
              <div
                key={ord.id}
                className="history-card history-summary-card"
                onClick={() => onSelectOrder && onSelectOrder(ord)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (onSelectOrder) onSelectOrder(ord);
                  }
                }}
                title="Click to view & print full official receipt"
              >
                <div className="history-card-header">
                  <div className="history-header-left">
                    <div className="history-or-wrap">
                      <span className="order-or-number">{orNumber}</span>
                      {isDelivery && (
                        <span className="order-type-badge delivery">
                          <Truck size={12} weight="bold" /> Delivery
                        </span>
                      )}
                    </div>
                    <h4
                      className="history-customer-name"
                      title={ord.customer_name || "Walk-in Customer"}
                    >
                      {ord.customer_name || "Walk-in Customer"}
                    </h4>
                    <div className="history-time-stamp">
                      <Clock size={13} />
                      <span>
                        {dateStr}
                        {timeStr ? ` · ${timeStr}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="history-total-badge">
                    <strong className="history-total-num">
                      {formatPeso(ord.total || 0)}
                    </strong>
                    <span
                      className={`history-pay-type ${
                        isDelivery ? "pay-gcash" : "pay-cash"
                      }`}
                    >
                      {isDelivery ? "DELIVERY" : "WALK-IN"}
                    </span>
                  </div>
                </div>

                <div className="history-items-summary">
                  {items.length === 0 ? (
                    <span className="history-item-pill-empty">No items recorded</span>
                  ) : (
                    <>
                      {items.slice(0, 5).map((it, i) => (
                        <span
                          key={it.cartId || `${it.name}-${i}`}
                          className="history-item-pill"
                          title={`${it.quantity} ${it.unit} ${it.name}`}
                        >
                          <strong>
                            {it.quantity} {it.unit}
                          </strong>{" "}
                          {it.name}
                        </span>
                      ))}
                      {items.length > 5 && (
                        <span className="history-item-pill-more">
                          +{items.length - 5} more items
                        </span>
                      )}
                    </>
                  )}
                </div>

                <div
                  className="history-card-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="history-card-meta">
                    <span className="history-items-count">
                      {items.length} {items.length === 1 ? "item" : "items"}
                    </span>
                  </div>

                  <div className="history-actions-btns">
                    <button
                      type="button"
                      className="btn-view-receipt"
                      onClick={() => onSelectOrder && onSelectOrder(ord)}
                      title="Reprint Official Sales Receipt"
                    >
                      <Printer size={15} weight="bold" />
                      <span>Reprint Receipt</span>
                    </button>
                    <button
                      type="button"
                      className="btn-delete-order"
                      title="Delete transaction record"
                      aria-label={`Delete order ${orNumber}`}
                      onClick={() => setPendingDeleteOrder(ord)}
                    >
                      <Trash size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {remainingCount > 0 && (
        <div className="history-load-more-wrap">
          <button
            type="button"
            className="btn-load-more-orders"
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
          >
            <CaretDown size={16} weight="bold" />
            <span>Load More Receipts ({remainingCount} remaining)</span>
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(pendingDeleteOrder)}
        title="Delete Order Record?"
        message={
          pendingDeleteOrder
            ? `Permanently delete the order for "${
                pendingDeleteOrder.customer_name || "Walk-in Customer"
              }" (${formatPeso(pendingDeleteOrder.total || 0)})?`
            : ""
        }
        confirmLabel="Delete Order"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteOrder(null)}
      />
    </div>
  );
}
