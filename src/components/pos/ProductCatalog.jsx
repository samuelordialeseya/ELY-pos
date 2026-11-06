import React, { useMemo, memo } from "react";
import { Package, MagnifyingGlass, ShoppingCart } from "@phosphor-icons/react";
import { getCategoryTheme } from "../../utils/themeUtils";
import { roundWeight } from "../../utils/moneyUtils";

/**
 * Memoized single product card.
 * Prevents iPad Air 2 from re-rendering all 100+ cards when only 1 item's cart quantity changes
 * or when the cashier types customer details in the CartSidebar.
 */
const ProductCard = memo(function ProductCard({
  fruit,
  cartQty,
  onSelectProduct
}) {
  const catTheme = useMemo(
    () => getCategoryTheme(fruit.category, fruit.name),
    [fruit.category, fruit.name]
  );

  const formattedPrice = Number(fruit.price || 0).toFixed(2);

  return (
    <div
      className="food-card"
      onClick={() => onSelectProduct(fruit)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectProduct(fruit);
        }
      }}
      aria-label={`${fruit.name}, ₱${formattedPrice} per ${fruit.unit}. Tap to add.`}
    >
      <div className="card-top-row">
        <span className={`card-cat ${catTheme.chipClass}`}>
          {catTheme.label}
        </span>
        {cartQty > 0 && (
          <span
            className="card-cart-badge"
            title={`${cartQty} ${fruit.unit} in current cart`}
          >
            <ShoppingCart size={11} weight="bold" />
            <span>
              {cartQty} {fruit.unit}
            </span>
          </span>
        )}
      </div>

      <div className="card-body">
        <h4 className="food-name" title={fruit.name}>
          {fruit.name}
        </h4>
        <p className="food-price">
          <span className="price-amount">₱{formattedPrice}</span>
          <span className="price-unit"> / {fruit.unit}</span>
        </p>
      </div>

      <div className="card-action" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="btn-card-add"
          onClick={() => onSelectProduct(fruit)}
          title={`Add ${fruit.name} to cart`}
        >
          {cartQty > 0 ? "+ Add More" : "+ Add"}
        </button>
      </div>
    </div>
  );
});

function ProductCatalog({
  fruits = [],
  cart = [],
  posSelectedCategory = "All",
  posSearchTerm = "",
  onSelectProduct,
  onNavigateToInventory,
  onClearFilters
}) {
  // Precompute O(1) lookup map for in-cart quantities instead of O(Products * Cart) per render
  const cartQtyMap = useMemo(() => {
    const byId = new Map();
    const byName = new Map();
    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];
      const qty = Number(item.quantity) || 0;
      if (item.productId) {
        byId.set(item.productId, roundWeight((byId.get(item.productId) || 0) + qty));
      }
      if (item.name) {
        byName.set(item.name, roundWeight((byName.get(item.name) || 0) + qty));
      }
    }
    return { byId, byName };
  }, [cart]);

  const normalizedSearch = posSearchTerm.trim().toLowerCase();

  const filteredFruits = useMemo(() => {
    return fruits.filter((f) => {
      const matchCategory =
        posSelectedCategory === "All" || f.category === posSelectedCategory;
      const matchSearch =
        !normalizedSearch ||
        (f.name || "").toLowerCase().includes(normalizedSearch);
      return matchCategory && matchSearch;
    });
  }, [fruits, posSelectedCategory, normalizedSearch]);

  if (fruits.length === 0) {
    return (
      <div className="product-grid">
        <div className="empty-catalog-state">
          <Package size={44} className="empty-catalog-icon" />
          <h3>Your Product Catalog is Empty</h3>
          <p>
            No products added yet. Visit Inventory to add your first item and
            start ringing up sales.
          </p>
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

  if (filteredFruits.length === 0) {
    return (
      <div className="product-grid">
        <div className="pos-empty-filter-state">
          <MagnifyingGlass size={38} className="empty-search-icon" />
          <h3>No products found</h3>
          <p>
            No items match "{posSearchTerm}" in {posSelectedCategory}.
          </p>
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
      {filteredFruits.map((f) => {
        const cartQty =
          (f.id && cartQtyMap.byId.get(f.id)) ||
          cartQtyMap.byName.get(f.name) ||
          0;

        return (
          <ProductCard
            key={f.id}
            fruit={f}
            cartQty={cartQty}
            onSelectProduct={onSelectProduct}
          />
        );
      })}
    </div>
  );
}

export default memo(ProductCatalog);
