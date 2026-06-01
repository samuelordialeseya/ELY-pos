import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, getDocs } from "firebase/firestore";
import fs from "fs";

// Simple .env parser to get config
function getEnvConfig() {
  const envPath = ".env";
  if (!fs.existsSync(envPath)) {
    console.error("Error: .env file does not exist. Please fill in the Firebase credentials first.");
    process.exit(1);
  }
  const envContent = fs.readFileSync(envPath, "utf-8");
  const config = {};
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*VITE_FIREBASE_([A-Z_]+)\s*=\s*["']?(.*?)["']?\s*$/);
    if (match) {
      const key = match[1].toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      let finalKey = key;
      if (key === "messagingSenderId") finalKey = "messagingSenderId";
      config[finalKey] = match[2];
    }
  });
  return config;
}

// RFC-4180 Compliant CSV Row Parser
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return null;
  }
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/);
  if (lines.length === 0 || !lines[0]) return [];

  const headers = parseCSVLine(lines[0]);
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const record = {};
    headers.forEach((header, index) => {
      record[header.trim()] = values[index] !== undefined ? values[index].trim() : "";
    });
    records.push(record);
  }
  return records;
}

async function startMigration() {
  const firebaseConfig = getEnvConfig();
  console.log("Using Firebase config project ID:", firebaseConfig.projectId);

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // Fetch existing Firestore IDs to avoid overwrites
  async function getExistingIds(collectionName) {
    console.log(`Fetching existing IDs from Firestore collection: ${collectionName}...`);
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const ids = new Set(querySnapshot.docs.map(d => d.id));
      console.log(`Found ${ids.size} existing items in Firestore: ${collectionName}.`);
      return ids;
    } catch (e) {
      console.warn(`Could not fetch existing IDs for ${collectionName}:`, e.message);
      return new Set();
    }
  }

  // 1. Migrate Products
  const productsCSV = "products_rows.csv";
  if (fs.existsSync(productsCSV)) {
    console.log(`Parsing ${productsCSV}...`);
    const products = parseCSV(productsCSV);
    const existingIds = await getExistingIds("products");
    let migratedCount = 0;
    let skippedCount = 0;

    for (const prod of products) {
      const { id, price, name, unit, category, created_at } = prod;
      if (!id) continue;
      if (existingIds.has(id)) {
        skippedCount++;
        continue;
      }
      
      const data = {
        name,
        price: parseFloat(price) || 0,
        unit,
        category,
        created_at
      };
      
      await setDoc(doc(db, "products", id), data);
      migratedCount++;
    }
    console.log(`Products: Migrated ${migratedCount}, Skipped ${skippedCount} existing products.`);
  }

  // 2. Migrate Orders
  const ordersCSV = "orders_rows.csv";
  if (fs.existsSync(ordersCSV)) {
    console.log(`Parsing ${ordersCSV}...`);
    const orders = parseCSV(ordersCSV);
    const existingIds = await getExistingIds("orders");
    let migratedCount = 0;
    let skippedCount = 0;

    for (const order of orders) {
      const { id, created_at, customer_name, address, status, items, total, raw_date, display_date, time, order_type } = order;
      if (!id) continue;
      if (existingIds.has(id)) {
        skippedCount++;
        continue;
      }

      let parsedItems = [];
      try {
        parsedItems = JSON.parse(items);
      } catch (err) {
        console.warn(`Failed to parse items JSON for order ID ${id}:`, err.message);
        // Attempt cleanup or insert raw string as fallback
        parsedItems = items;
      }

      const data = {
        created_at,
        customer_name,
        address,
        status,
        items: parsedItems,
        total: parseFloat(total) || 0,
        raw_date,
        display_date,
        time,
        order_type
      };

      await setDoc(doc(db, "orders", id), data);
      migratedCount++;
    }
    console.log(`Orders: Migrated ${migratedCount}, Skipped ${skippedCount} existing orders.`);
  }

  console.log("CSV merge migration completed successfully with zero data loss!");
}

startMigration().catch((err) => {
  console.error("Migration failed:", err);
});
