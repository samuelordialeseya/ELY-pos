import React from "react";
import { 
  Calendar, 
  ShoppingCart, 
  Coins, 
  Receipt, 
  TrendUp, 
  Package, 
  Trophy, 
  Clock, 
  Basket, 
  ArrowUpRight, 
  Truck 
} from "@phosphor-icons/react";
import { formatPeso } from "../../utils/themeUtils";

export default function AnalyticsDashboard({
  dashboardRange,
  setDashboardRange,
  dashboardCustomDate,
  setDashboardCustomDate,
  aggregates,
  orders = [],
  onNavigateToPos,
  onNavigateToOrders
}) {
  const rangeOptions = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: '7 Days' },
    { key: 'month', label: 'This Month' }
  ];

  const dashRangeLabel = 
    dashboardRange === 'today' ? 'Today' : 
    dashboardRange === 'week' ? 'This Week (7 Days)' : 
    dashboardRange === 'month' ? 'This Month' : 
    (dashboardCustomDate || 'Selected Date');

  const {
    revenue = 0,
    txCount = 0,
    avg = 0,
    itemsSold = 0,
    topSellers = [],
    maxSellerRev = 1,
    recentOrders = []
  } = aggregates;

  return (
    <div className="dash-container">
      {/* Range Bar */}
      <div className="dash-range-bar">
        <div className="dash-range-left">
          <span className="dash-range-title">Timeframe:</span>
          <div className="dash-range-btns">
            {rangeOptions.map(r => (
              <button
                key={r.key}
                type="button"
                className={`dash-range-btn ${dashboardRange === r.key ? 'active' : ''}`}
                onClick={() => setDashboardRange(r.key)}
              >
                {r.label}
              </button>
            ))}
            <div className="dash-custom-wrap">
              <Calendar size={15} className="dash-custom-calendar-icon" />
              <input
                type="date"
                aria-label="Filter by specific date"
                className={`date-input dash-date-pick ${dashboardRange === 'custom' ? 'active' : ''}`}
                value={dashboardCustomDate}
                onChange={e => { 
                  setDashboardCustomDate(e.target.value); 
                  setDashboardRange('custom'); 
                }}
              />
            </div>
          </div>
          <div className="dash-range-label">
            <Calendar size={13} className="dash-range-label-icon" />
            <span>Showing: <strong>{dashRangeLabel}</strong></span>
          </div>
        </div>

        <div className="dash-range-right">
          <button
            type="button"
            className="dash-quick-sale-btn"
            onClick={onNavigateToPos}
            title="Open Point of Sale register"
            style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
          >
            <ShoppingCart size={15} style={{ color: '#ffffff' }} />
            <span style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>New Sale</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="dash-metric-grid">
        <div className="dash-metric-card dash-metric-revenue">
          <div className="dash-metric-card-top">
            <span className="dash-metric-label">Total Revenue</span>
            <div className="dash-metric-icon-box icon-revenue">
              <Coins size={20} />
            </div>
          </div>
          <div className="dash-metric-card-bottom">
            <div className="dash-metric-value">{formatPeso(revenue)}</div>
            <div className="dash-metric-hint">
              {txCount > 0 
                ? `${txCount} completed ${txCount === 1 ? 'sale' : 'sales'}`
                : 'No transactions yet'}
            </div>
          </div>
        </div>

        <div className="dash-metric-card dash-metric-tx">
          <div className="dash-metric-card-top">
            <span className="dash-metric-label">Transactions</span>
            <div className="dash-metric-icon-box icon-tx">
              <Receipt size={20} />
            </div>
          </div>
          <div className="dash-metric-card-bottom">
            <div className="dash-metric-value">{txCount}</div>
            <div className="dash-metric-hint">
              {txCount > 0
                ? `${recentOrders.filter(o => o.order_type === 'delivery').length} delivery · ${recentOrders.filter(o => o.order_type !== 'delivery').length} in-store`
                : 'Awaiting register checkouts'}
            </div>
          </div>
        </div>

        <div className="dash-metric-card dash-metric-avg">
          <div className="dash-metric-card-top">
            <span className="dash-metric-label">Avg. Order Value</span>
            <div className="dash-metric-icon-box icon-avg">
              <TrendUp size={20} weight="bold" />
            </div>
          </div>
          <div className="dash-metric-card-bottom">
            <div className="dash-metric-value">{formatPeso(avg)}</div>
            <div className="dash-metric-hint">
              {txCount > 0 ? 'Per customer ticket' : 'Requires at least 1 order'}
            </div>
          </div>
        </div>

        <div className="dash-metric-card dash-metric-items">
          <div className="dash-metric-card-top">
            <span className="dash-metric-label">Items Sold</span>
            <div className="dash-metric-icon-box icon-items">
              <Package size={20} weight="bold" />
            </div>
          </div>
          <div className="dash-metric-card-bottom">
            <div className="dash-metric-value">
              {itemsSold % 1 === 0 ? itemsSold : itemsSold.toFixed(1)}
            </div>
            <div className="dash-metric-hint">
              {itemsSold > 0 
                ? `Units across ${orders.reduce((s, o) => s + (o.items || []).length, 0)} product lines`
                : 'No items scanned'}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Panels */}
      <div className="dash-panels">
        {/* Top Sellers Panel */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <div className="dash-panel-title-wrap">
              <div className="panel-header-icon-box icon-trophy">
                <Trophy size={16} weight="bold" />
              </div>
              <div>
                <h4 className="dash-panel-title">Top Sellers</h4>
                <span className="dash-panel-desc">Ranked by gross sales volume</span>
              </div>
            </div>
            <span className="dash-panel-badge">{topSellers.length} items ranked</span>
          </div>

          {topSellers.length === 0 ? (
            <div className="dash-panel-empty">
              <Basket size={36} weight="bold" className="dash-empty-icon" />
              <h5>No produce sales recorded</h5>
              <p>Once orders are rung up at the register, your top performers will appear here automatically.</p>
              <button
                type="button"
                className="dash-empty-btn"
                onClick={onNavigateToPos}
              >
                <ShoppingCart size={14} weight="bold" />
                <span>Open POS Register</span>
              </button>
            </div>
          ) : (
            <div className="dash-sellers-list">
              {topSellers.map((item, i) => {
                const sharePct = maxSellerRev > 0 ? Math.round((item.revenue / maxSellerRev) * 100) : 0;
                const formattedQty = item.qty % 1 === 0 ? item.qty : item.qty.toFixed(1);
                return (
                  <div key={item.name} className="dash-seller-row">
                    <div className={`dash-seller-rank rank-${i + 1}`}>
                      {i === 0 ? '1' : i === 1 ? '2' : i === 2 ? '3' : i + 1}
                    </div>
                    <div className="dash-seller-info">
                      <div className="dash-seller-info-top">
                        <span className="dash-seller-name" title={item.name}>{item.name}</span>
                        <span className="dash-seller-rev">{formatPeso(item.revenue)}</span>
                      </div>
                      <div className="dash-seller-info-sub">
                        <span className="dash-seller-qty">{formattedQty} {item.unit || 'units'} sold</span>
                        <span className="dash-seller-pct">{sharePct}% of top volume</span>
                      </div>
                      <div className="dash-seller-bar-track">
                        <div className="dash-seller-bar-fill" style={{ width: `${Math.max(8, sharePct)}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Orders Panel */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <div className="dash-panel-title-wrap">
              <div className="panel-header-icon-box icon-recent">
                <Clock size={16} weight="bold" />
              </div>
              <div>
                <h4 className="dash-panel-title">Recent Transactions</h4>
                <span className="dash-panel-desc">Latest counter & delivery tickets</span>
              </div>
            </div>
            <button
              type="button"
              className="dash-panel-action-btn"
              onClick={onNavigateToOrders}
              title="View full Order History"
            >
              <span>View All</span>
              <ArrowUpRight size={14} weight="bold" />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="dash-panel-empty">
              <Receipt size={36} weight="bold" className="dash-empty-icon" />
              <h5>No transactions in this period</h5>
              <p>Tickets printed and sales checked out will be logged here in chronological order.</p>
              <button
                type="button"
                className="dash-empty-btn"
                onClick={onNavigateToPos}
              >
                <ShoppingCart size={14} weight="bold" />
                <span>Start First Sale</span>
              </button>
            </div>
          ) : (
            <div className="dash-recent-list">
              {recentOrders.map(o => {
                const isDelivery = o.order_type === 'delivery';
                return (
                  <div 
                    key={o.id} 
                    className="dash-recent-row"
                    onClick={onNavigateToOrders}
                    title="Click to view details in Order History"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { 
                      if (e.key === 'Enter' || e.key === ' ') onNavigateToOrders(); 
                    }}
                  >
                    <div className="dash-recent-avatar">
                      {isDelivery ? <Truck size={16} weight="bold" /> : <Receipt size={16} weight="bold" />}
                    </div>
                    <div className="dash-recent-info">
                      <div className="dash-recent-top-line">
                        <span className="dash-recent-name">{o.customer_name || 'Walk-in Customer'}</span>
                        <span className="dash-recent-total">{formatPeso(o.total || 0)}</span>
                      </div>
                      <div className="dash-recent-sub-line">
                        <span className={`dash-recent-type-badge ${isDelivery ? 'badge-delivery' : 'badge-pos'}`}>
                          {isDelivery ? 'Delivery' : 'POS'}
                        </span>
                        <span className="dash-recent-meta">
                          {(o.items || []).length} { (o.items || []).length === 1 ? 'item' : 'items'} · {o.display_date || o.raw_date}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
