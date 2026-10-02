/**
 * Maps product category and name keywords to visual theme styles,
 * chip classes, and badge colors for POS produce display.
 */
export function getCategoryTheme(category = "", name = "") {
  const cat = (category || "").toLowerCase();
  const n = (name || "").toLowerCase();

  // Roots, Tubers, Alliums, Spices (Garlic, Onion, Potatoes, Carrots, Ginger)
  if (
    cat.includes("root") || cat.includes("tuber") || cat.includes("spice") ||
    n.includes("garlic") || n.includes("bawang") || n.includes("onion") ||
    n.includes("sibuyas") || n.includes("potato") || n.includes("patatas") ||
    n.includes("ginger") || n.includes("luya") || n.includes("carrot")
  ) {
    return {
      chipClass: "cat-chip-roots",
      cardClass: "card-cat-roots",
      dotColor: "#EA580C",
      label: "Roots & Spices"
    };
  }

  // Fresh Fruits
  if (
    cat.includes("fruit") || n.includes("banana") || n.includes("apple") || 
    n.includes("mango") || n.includes("orange") || n.includes("watermelon") || 
    n.includes("papaya") || n.includes("dragonfruit") || n.includes("lemon") || 
    n.includes("calamansi") || n.includes("avocado")
  ) {
    return {
      chipClass: "cat-chip-fruits",
      cardClass: "card-cat-fruits",
      dotColor: "#F59E0B",
      label: "Fruits"
    };
  }

  // Vegetables & Leafy Greens
  if (
    cat.includes("veg") || cat.includes("green") || cat.includes("leaf") || 
    n.includes("ampalaya") || n.includes("beans") || n.includes("kangkong") || 
    n.includes("pechay") || n.includes("broccoli") || n.includes("cabbage") || 
    n.includes("repolyo") || n.includes("talong") || n.includes("kamatis") || 
    n.includes("tomato") || n.includes("sili")
  ) {
    return {
      chipClass: "cat-chip-vegetables",
      cardClass: "card-cat-vegetables",
      dotColor: "#10B981",
      label: "Vegetables"
    };
  }

  return {
    chipClass: "cat-chip-general",
    cardClass: "card-cat-general",
    dotColor: "#00A3E0",
    label: category || "Produce"
  };
}

export function formatPeso(amount) {
  return "₱" + Number(amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
