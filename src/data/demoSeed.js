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

export function getDemoOrders() {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const todayDisplay = now.toLocaleDateString();

  const yesterday = new Date(Date.now() - 86400000);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const yesterdayDisplay = yesterday.toLocaleDateString();

  const twoDaysAgo = new Date(Date.now() - 172800000);
  const twoDaysAgoStr = twoDaysAgo.toISOString().split("T")[0];
  const twoDaysAgoDisplay = twoDaysAgo.toLocaleDateString();

  const fourDaysAgo = new Date(Date.now() - 345600000);
  const fourDaysAgoStr = fourDaysAgo.toISOString().split("T")[0];
  const fourDaysAgoDisplay = fourDaysAgo.toLocaleDateString();

  return [
    {
      id: "demo-ord-1",
      customer_name: "Walk-in Customer",
      address: "Walk-in",
      total: 525.00,
      created_at: new Date(Date.now() - 10800000).toISOString(),
      raw_date: todayStr,
      display_date: todayDisplay,
      time: "10:15 AM",
      status: "Completed",
      order_type: "pos",
      items: [
        { cartId: "d-it-1", name: "Avocado Davao", price: 150, unit: "kg", quantity: 1.5, subtotal: 225.00 },
        { cartId: "d-it-2", name: "Sweet Mango (Cebu)", price: 160, unit: "kg", quantity: 1.0, subtotal: 160.00 },
        { cartId: "d-it-3", name: "Fuji Apple (Large)", price: 35, unit: "pc", quantity: 4, subtotal: 140.00 }
      ]
    },
    {
      id: "demo-ord-2",
      customer_name: "Maria Clara",
      address: "4 Greenhills Ave, San Juan",
      total: 649.00,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      raw_date: todayStr,
      display_date: todayDisplay,
      time: "11:30 AM",
      status: "Pending",
      order_type: "delivery",
      items: [
        { cartId: "d-it-4", name: "Broccoli", price: 220, unit: "kg", quantity: 1.2, subtotal: 264.00 },
        { cartId: "d-it-5", name: "Carrots (Baguio)", price: 110, unit: "kg", quantity: 1.5, subtotal: 165.00 },
        { cartId: "d-it-6", name: "Patatas (Potatoes)", price: 120, unit: "kg", quantity: 1.0, subtotal: 120.00 },
        { cartId: "d-it-7", name: "Lemon (Imported)", price: 25, unit: "pc", quantity: 4, subtotal: 100.00 }
      ]
    },
    {
      id: "demo-ord-3",
      customer_name: "Walk-in Customer",
      address: "Walk-in",
      total: 388.00,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      raw_date: todayStr,
      display_date: todayDisplay,
      time: "01:45 PM",
      status: "Completed",
      order_type: "pos",
      items: [
        { cartId: "d-it-8", name: "Banana Lakatan", price: 90, unit: "kg", quantity: 2.0, subtotal: 180.00 },
        { cartId: "d-it-9", name: "Seedless Watermelon", price: 65, unit: "kg", quantity: 3.2, subtotal: 208.00 }
      ]
    },
    {
      id: "demo-ord-4",
      customer_name: "Juan Dela Cruz",
      address: "2 Acacia St, Valle Verde",
      total: 333.00,
      created_at: new Date(Date.now() - 1800000).toISOString(),
      raw_date: todayStr,
      display_date: todayDisplay,
      time: "03:10 PM",
      status: "Delivered",
      order_type: "delivery",
      items: [
        { cartId: "d-it-10", name: "Sibuyas Pula (Red Onion)", price: 140, unit: "kg", quantity: 1.0, subtotal: 140.00 },
        { cartId: "d-it-11", name: "Bawang (Garlic)", price: 170, unit: "kg", quantity: 0.5, subtotal: 85.00 },
        { cartId: "d-it-12", name: "Kamatis (Tomatoes)", price: 90, unit: "kg", quantity: 1.2, subtotal: 108.00 }
      ]
    },
    {
      id: "demo-ord-5",
      customer_name: "Teresa Garcia",
      address: "Walk-in",
      total: 750.00,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      raw_date: yesterdayStr,
      display_date: yesterdayDisplay,
      time: "02:00 PM",
      status: "Completed",
      order_type: "pos",
      items: [
        { cartId: "d-it-13", name: "Avocado Davao", price: 150, unit: "kg", quantity: 2.0, subtotal: 300.00 },
        { cartId: "d-it-14", name: "Navel Orange", price: 30, unit: "pc", quantity: 6, subtotal: 180.00 },
        { cartId: "d-it-15", name: "Red Dragonfruit", price: 180, unit: "kg", quantity: 1.5, subtotal: 270.00 }
      ]
    },
    {
      id: "demo-ord-6",
      customer_name: "Antonio Luna",
      address: "1 Mahogany Lane, Bel-Air",
      total: 730.00,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      raw_date: twoDaysAgoStr,
      display_date: twoDaysAgoDisplay,
      time: "11:00 AM",
      status: "Delivered",
      order_type: "delivery",
      items: [
        { cartId: "d-it-16", name: "Banana Lakatan", price: 90, unit: "kg", quantity: 3.0, subtotal: 270.00 },
        { cartId: "d-it-17", name: "Sweet Mango (Cebu)", price: 160, unit: "kg", quantity: 2.0, subtotal: 320.00 },
        { cartId: "d-it-18", name: "Papaya Solo", price: 70, unit: "kg", quantity: 2.0, subtotal: 140.00 }
      ]
    },
    {
      id: "demo-ord-7",
      customer_name: "Walk-in Customer",
      address: "Walk-in",
      total: 430.00,
      created_at: new Date(Date.now() - 345600000).toISOString(),
      raw_date: fourDaysAgoStr,
      display_date: fourDaysAgoDisplay,
      time: "04:30 PM",
      status: "Completed",
      order_type: "pos",
      items: [
        { cartId: "d-it-19", name: "Cabbage (Repolyo)", price: 80, unit: "kg", quantity: 1.5, subtotal: 120.00 },
        { cartId: "d-it-20", name: "Baguio Beans", price: 180, unit: "kg", quantity: 1.0, subtotal: 180.00 },
        { cartId: "d-it-21", name: "Ampalaya (Bitter Gourd)", price: 130, unit: "kg", quantity: 1.0, subtotal: 130.00 }
      ]
    }
  ];
}

export const DEMO_ORDERS = getDemoOrders();
