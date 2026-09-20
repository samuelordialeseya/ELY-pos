export const DEMO_PRODUCTS = [
  { id: "demo-1", name: "Avocado Davao", price: 150, unit: "kg", category: "Fruits" },
  { id: "demo-2", name: "Banana Lakatan", price: 90, unit: "kg", category: "Fruits" },
  { id: "demo-3", name: "Banana Saba", price: 50, unit: "kg", category: "Fruits" },
  { id: "demo-4", name: "Fuji Apple (Large)", price: 35, unit: "pc", category: "Fruits" },
  { id: "demo-5", name: "Navel Orange", price: 30, unit: "pc", category: "Fruits" },
  { id: "demo-6", name: "Sweet Mango (Cebu)", price: 160, unit: "kg", category: "Fruits" },
  { id: "demo-7", name: "Seedless Watermelon", price: 65, unit: "kg", category: "Fruits" },
  { id: "demo-8", name: "Papaya Solo", price: 70, unit: "kg", category: "Fruits" },
  { id: "demo-9", name: "Red Dragonfruit", price: 180, unit: "kg", category: "Fruits" },
  { id: "demo-10", name: "Ampalaya (Bitter Gourd)", price: 130, unit: "kg", category: "Vegetables" },
  { id: "demo-11", name: "Baguio Beans", price: 180, unit: "kg", category: "Vegetables" },
  { id: "demo-12", name: "Bawang (Garlic)", price: 170, unit: "kg", category: "Vegetables" },
  { id: "demo-13", name: "Sibuyas Pula (Red Onion)", price: 140, unit: "kg", category: "Vegetables" },
  { id: "demo-14", name: "Kamatis (Tomatoes)", price: 90, unit: "kg", category: "Vegetables" },
  { id: "demo-15", name: "Carrots (Baguio)", price: 110, unit: "kg", category: "Vegetables" },
  { id: "demo-16", name: "Patatas (Potatoes)", price: 120, unit: "kg", category: "Vegetables" },
  { id: "demo-17", name: "Broccoli", price: 220, unit: "kg", category: "Vegetables" },
  { id: "demo-18", name: "Cabbage (Repolyo)", price: 80, unit: "kg", category: "Vegetables" },
  { id: "demo-19", name: "Kangkong (Water Spinach)", price: 25, unit: "tali", category: "Vegetables" },
  { id: "demo-20", name: "Pechay Baguio", price: 75, unit: "kg", category: "Vegetables" },
  { id: "demo-21", name: "Sili Labuyo", price: 350, unit: "kg", category: "Vegetables" },
  { id: "demo-22", name: "Lemon (Imported)", price: 25, unit: "pc", category: "Fruits" },
  { id: "demo-23", name: "Calamansi", price: 80, unit: "kg", category: "Fruits" },
  { id: "demo-24", name: "Talong (Eggplant)", price: 90, unit: "kg", category: "Vegetables" }
];

export const DEMO_ORDERS = [
  {
    id: "demo-ord-1",
    customer: "Walk-in Customer",
    total: 345.50,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    items: [
      { name: "Avocado Davao", price: 150, unit: "kg", quantity: 1.2, subtotal: 180.00 },
      { name: "Banana Lakatan", price: 90, unit: "kg", quantity: 1.1, subtotal: 99.00 },
      { name: "Fuji Apple (Large)", price: 35, unit: "pc", quantity: 2, subtotal: 70.00 }
    ]
  },
  {
    id: "demo-ord-2",
    customer: "Mrs. Santos",
    address: "Block 4 Lot 12, San Lorenzo Subd.",
    total: 510.00,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    items: [
      { name: "Broccoli", price: 220, unit: "kg", quantity: 1.0, subtotal: 220.00 },
      { name: "Carrots (Baguio)", price: 110, unit: "kg", quantity: 1.5, subtotal: 165.00 },
      { name: "Patatas (Potatoes)", price: 120, unit: "kg", quantity: 1.0, subtotal: 120.00 }
    ]
  }
];
