import React, { useState } from "react";
import { 
  MagnifyingGlass, 
  X, 
  Package, 
  Plus, 
  Check, 
  PencilSimple, 
  Trash 
} from "@phosphor-icons/react";

export default function InventoryManagement({
  fruits = [],
  invSearchTerm,
  setInvSearchTerm,
  invSelectedCategory,
  setInvSelectedCategory,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}) {
  // New product form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");
  const [specialFlag, setSpecialFlag] = useState("");

  // Inline editing state
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", price: "", unit: "", category: "", special_flag: "" });

  const categories = ['All', ...new Set(fruits.map(f => f.category).filter(Boolean))];

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price || !unit.trim()) return;

    await onAddProduct({
      name: name.trim(),
      price: parseFloat(price),
      unit: unit.trim(),
      category: category.trim() || "Produce",
      special_flag: specialFlag || null
    });

    setName("");
    setPrice("");
    setUnit("");
    setCategory("");
    setSpecialFlag("");
  };

  const startEdit = (fruit) => {
    setEditingId(fruit.id);
    setEditFormData({
      name: fruit.name || "",
      price: fruit.price || "",
      unit: fruit.unit || "",
      category: fruit.category || "",
      special_flag: fruit.special_flag || ""
    });
  };

  const saveEdit = async (id) => {
    if (!editFormData.name.trim() || !editFormData.price || !editFormData.unit.trim()) return;
    await onUpdateProduct(id, {
      name: editFormData.name.trim(),
      price: parseFloat(editFormData.price),
      unit: editFormData.unit.trim(),
      category: editFormData.category.trim() || "Produce",
      special_flag: editFormData.special_flag || null
    });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const filteredFruits = fruits
    .filter(f => (invSelectedCategory === "All" || f.category === invSelectedCategory))
    .filter(f => f.name.toLowerCase().includes(invSearchTerm.toLowerCase()));

  return (
    <div className="inventory-screen">
      <div className="inv-top-bar">
        <div className="inv-search-wrapper">
          <div className="inv-search-box">
            <MagnifyingGlass size={18} className="inv-search-icon" />
            <input
              type="text"
              className="inv-search-input"
              placeholder="Search inventory by product name..."
              value={invSearchTerm}
              onChange={e => setInvSearchTerm(e.target.value)}
            />
            {invSearchTerm && (
              <button
                type="button"
                className="inv-search-clear"
                onClick={() => setInvSearchTerm('')}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="inv-stats-pill">
            <span><strong>{fruits.length}</strong> items</span>
            <span className="dot-divider">•</span>
            <span><strong>{categories.filter(c => c !== 'All').length}</strong> categories</span>
          </div>
        </div>

        <div className="category-filter-bar">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              className={`cat-filter-btn ${invSelectedCategory === cat ? 'active' : ''}`}
              onClick={() => setInvSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="inv-form-card">
        <div className="inv-form-header">
          <div className="inv-form-header-badge">
            <Package size={20} weight="duotone" />
          </div>
          <div className="inv-form-header-text">
            <div className="inv-form-title-row">
              <h4>Add New Product</h4>
              <span className="inv-form-status-tag">Catalog Entry</span>
            </div>
            <p>Register new produce or goods into your store catalog</p>
          </div>
        </div>
        <form onSubmit={handleFormSubmit} className="inv-add-form">
          <div className="form-grid">
            <div className="form-field-group">
              <label htmlFor="inv-prod-name">
                Product Name <span className="required-star">*</span>
              </label>
              <input
                id="inv-prod-name"
                placeholder="e.g. Avocado Davao, Fuji Apple..."
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-field-group">
              <label htmlFor="inv-prod-price">
                Price (₱) <span className="required-star">*</span>
              </label>
              <div className="input-with-prefix">
                <span className="input-prefix">₱</span>
                <input
                  id="inv-prod-price"
                  placeholder="0.00"
                  type="number"
                  step="any"
                  min="0"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-field-group">
              <div className="field-label-row">
                <label htmlFor="inv-prod-unit">
                  Pricing Unit <span className="required-star">*</span>
                </label>
                <div className="unit-quick-picks">
                  {['kg', 'pc', 'pack', 'tali'].map(u => (
                    <button
                      type="button"
                      key={u}
                      className={`unit-pick-btn ${unit.toLowerCase() === u ? 'selected' : ''}`}
                      onClick={() => setUnit(u)}
                      title={`Set unit to ${u}`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <input
                id="inv-prod-unit"
                placeholder="kg, pc, pack, tali..."
                value={unit}
                onChange={e => setUnit(e.target.value)}
                required
              />
            </div>
            <div className="form-field-group">
              <label htmlFor="inv-prod-category">Category</label>
              <input
                id="inv-prod-category"
                list="category-suggestions"
                placeholder="e.g. Fruits, Veggies"
                value={category}
                onChange={e => setCategory(e.target.value)}
              />
              <datalist id="category-suggestions">
                {categories.filter(c => c !== 'All').map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Footer: Special Handling Flags & Submit Action */}
          <div className="inv-form-footer">
            <div className="inv-flag-section">
              <div className="flag-section-header">
                <span className="flag-section-title">Special Handling Flag</span>
                <span className="flag-optional-badge">Optional · Delivery Manifest</span>
              </div>
              <div className="flag-picker">
                {[
                  { key: "fragile", emoji: "🥚", label: "Fragile", hint: "Delicate produce / eggs" },
                  { key: "cold",    emoji: "🧊", label: "Keep Cold", hint: "Chilled produce / berries" },
                  { key: "bulky",   emoji: "📦", label: "Bulky", hint: "Heavy crates / sacks" },
                  { key: "care",    emoji: "⚠️",  label: "Handle Care", hint: "Top load / do not stack" },
                ].map(fl => {
                  const isSelected = specialFlag === fl.key;
                  return (
                    <button
                      type="button"
                      key={fl.key}
                      className={`flag-pick-btn flag-type-${fl.key} ${isSelected ? "selected" : ""}`}
                      onClick={() => setSpecialFlag(prev => prev === fl.key ? "" : fl.key)}
                      title={fl.hint}
                    >
                      <span className="flag-btn-emoji">{fl.emoji}</span>
                      <span className="flag-btn-label">{fl.label}</span>
                      {isSelected && (
                        <span className="flag-btn-check">
                          <Check size={10} weight="bold" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="inv-form-actions">
              <button 
                type="submit" 
                className="btn-save-inv" 
                style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
              >
                <Plus size={18} weight="bold" style={{ color: '#ffffff' }} />
                <span style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>Add to Inventory</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="inv-table-wrapper">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Unit</th>
              <th style={{ textAlign: 'center' }}>Flag</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {fruits.length === 0 ? (
              <tr>
                <td colSpan="6" className="inv-empty-cell">
                  <div className="inv-empty-state">
                    <Package size={36} className="inv-empty-icon" />
                    <h4>Your catalog is empty</h4>
                    <p>Fill out the form above to add your first product.</p>
                  </div>
                </td>
              </tr>
            ) : filteredFruits.length === 0 ? (
              <tr>
                <td colSpan="6" className="inv-empty-cell">
                  <div className="inv-empty-state">
                    <MagnifyingGlass size={36} className="inv-empty-icon" />
                    <h4>No matching products</h4>
                    <p>No items found matching “{invSearchTerm}” in “{invSelectedCategory}”.</p>
                    <button
                      type="button"
                      className="btn-clear-filters"
                      onClick={() => { setInvSearchTerm(''); setInvSelectedCategory('All'); }}
                    >
                      Clear Search & Filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredFruits.map(f => (
                <tr key={f.id} className={editingId === f.id ? "row-editing" : ""}>
                  {editingId === f.id ? (
                    <>
                      <td>
                        <input
                          className="inv-edit-input"
                          value={editFormData.name}
                          placeholder="Product Name"
                          onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className="inv-edit-input"
                          value={editFormData.category}
                          placeholder="Category"
                          onChange={e => setEditFormData({ ...editFormData, category: e.target.value })}
                        />
                      </td>
                      <td>
                        <div className="input-with-prefix">
                          <span className="input-prefix">₱</span>
                          <input
                            className="inv-edit-input"
                            type="number"
                            step="any"
                            value={editFormData.price}
                            placeholder="Price"
                            onChange={e => setEditFormData({ ...editFormData, price: e.target.value })}
                          />
                        </div>
                      </td>
                      <td>
                        <input
                          className="inv-edit-input"
                          value={editFormData.unit}
                          placeholder="Unit"
                          onChange={e => setEditFormData({ ...editFormData, unit: e.target.value })}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <select
                          className="inv-edit-input"
                          value={editFormData.special_flag || ""}
                          onChange={e => setEditFormData({ ...editFormData, special_flag: e.target.value })}
                        >
                          <option value="">None</option>
                          <option value="fragile">🥚 Fragile</option>
                          <option value="cold">🧊 Cold</option>
                          <option value="bulky">📦 Bulky</option>
                          <option value="care">⚠️ Handle Care</option>
                        </select>
                      </td>
                      <td className="row-actions" style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn-inv-save"
                          onClick={() => saveEdit(f.id)}
                          title="Save Changes"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn-inv-cancel"
                          onClick={cancelEdit}
                          title="Cancel"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td><strong>{f.name}</strong></td>
                      <td><span className="inv-cat-pill">{f.category || "Produce"}</span></td>
                      <td><strong>₱{Number(f.price || 0).toFixed(2)}</strong></td>
                      <td><span className="inv-unit-pill">per {f.unit}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        {f.special_flag ? (
                          <span className={`manifest-flag-badge flag-${f.special_flag}`} title={`Flag: ${f.special_flag}`}>
                            {f.special_flag === "fragile" && "🥚 Fragile"}
                            {f.special_flag === "cold" && "🧊 Cold"}
                            {f.special_flag === "bulky" && "📦 Bulky"}
                            {f.special_flag === "care" && "⚠️ Care"}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-subtle)", fontSize: "11px" }}>—</span>
                        )}
                      </td>
                      <td className="row-actions" style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn-inv-edit"
                          onClick={() => startEdit(f)}
                          title={`Edit ${f.name}`}
                          aria-label={`Edit ${f.name}`}
                        >
                          <PencilSimple size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-inv-delete"
                          onClick={() => onDeleteProduct(f.id)}
                          title={`Delete ${f.name}`}
                          aria-label={`Delete ${f.name}`}
                        >
                          <Trash size={15} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
