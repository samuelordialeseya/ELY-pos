import React from "react";
import { Package, MagnifyingGlass, ShoppingCart } from "@phosphor-icons/react";
import { getCategoryTheme } from "../../utils/themeUtils";

export default function ProductCatalog({
  fruits = [],
  cart = [],
  posSelectedCategory = "All",
  posSearchTerm = "",
  onSelectProduct,
  onNavigateToInventory,
  onClearFilters
}) {
  if (fruits.length === 0) {
    return (
      <div className="product-grid">
        <div className="empty-catalog-state">
          <Package size={44} className="empty-catalog-icon" />
          <h3>Your Product Catalog is Empty</h3>
          <p>No products added yet. Visit Inventory to add your first item and start ringing up sales.</p>
          <button 
            type="button" 
            className="btn-empty-add" 
            onClick={onNavigateToInventory}
          >
            Go to Inventory
          </button>
        </div>
      </div>
    );
  }

  const filteredFruits = fruits
    .filter(f => (posSelectedCategory === "All" || f.category === posSelectedCategory))
    .filter(f => f.name.toLowerCase().includes(posSearchTerm.toLowerCase()));

  if (filteredFruits.length === 0) {
    return (
      <div className="product-grid">
        <div className="pos-empty-filter-state">
          <MagnifyingGlass size={38} className="empty-search-icon" />
          <h3>No products found</h3>
          <p>No items match "{posSearchTerm}" in {posSelectedCategory}.</p>
          <button
            type="button"
            className="btn-clear-pos-filters"
            onClick={onClearFilters}
          >
            Clear Search & Filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {filteredFruits.map(f => {
        const catTheme = getCategoryTheme(f.category, f.name);
        const cartQty = cart
          .filter(c => c.name === f.name)
          .reduce((acc, c) => acc + c.quantity, 0);

        return (
          <div
            key={f.id}
            className="food-card"
            onClick={() => onSelectProduct(f)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectProduct(f);
              }
            }}
            aria-label={`${f.name}, ₱${f.price.toFixed(2)} per ${f.unit}. Tap to add.`}
          >
            <div className="card-top-row">
              <span className={`card-cat ${catTheme.chipClass}`}>
                {catTheme.label}
              </span>
              {cartQty > 0 && (
                <span className="card-cart-badge" title={`${cartQty} ${f.unit} in current cart`}>
                  <ShoppingCart size={11} weight="bold" />
                  <span>{cartQty} {f.unit}</span>
                </span>
              )}
            </div>

            <div className="card-body">
              <h4 className="food-name" title={f.name}>{f.name}</h4>
              <p className="food-price">
                <span className="price-amount">₱{f.price.toFixed(2)}</span>
                <span className="price-unit"> / {f.unit}</span>
              </p>
            </div>

            <div className="card-action" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                className="btn-card-add"
                onClick={() => onSelectProduct(f)}
                title={`Add ${f.name} to cart`}
              >
                + Add
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
