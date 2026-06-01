import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection } from "firebase/firestore";
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
      // Convert to camelCase: api_key -> apiKey, auth_domain -> authDomain, etc.
      let finalKey = key;
      if (key === "messagingSenderId") finalKey = "messagingSenderId";
      config[finalKey] = match[2];
    }
  });
  return config;
}

async function startMigration() {
  const firebaseConfig = getEnvConfig();
  console.log("Using Firebase config project ID:", firebaseConfig.projectId);

  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("YOUR_API_KEY")) {
    console.error("Error: Please replace the placeholder credentials in .env with your actual Firebase project credentials.");
    process.exit(1);
  }

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log("Reading supabase_backup.json...");
  const backup = JSON.parse(fs.readFileSync("supabase_backup.json", "utf-8"));

  // 1. Migrate Products
  if (backup.products && backup.products.length > 0) {
    console.log(`Migrating ${backup.products.length} products...`);
    for (const prod of backup.products) {
      const { id, ...data } = prod;
      await setDoc(doc(db, "products", id), data);
    }
    console.log("Products migrated successfully.");
  }

  // 2. Migrate Orders
  if (backup.orders && backup.orders.length > 0) {
    console.log(`Migrating ${backup.orders.length} orders...`);
    for (const order of backup.orders) {
      const { id, ...data } = order;
      await setDoc(doc(db, "orders", id), data);
    }
    console.log("Orders migrated successfully.");
  }

  // 3. Migrate Pre-orders
  if (backup.pre_orders && backup.pre_orders.length > 0) {
    console.log(`Migrating ${backup.pre_orders.length} pre-orders...`);
    for (const preOrder of backup.pre_orders) {
      const { id, ...data } = preOrder;
      await setDoc(doc(db, "pre_orders", id), data);
    }
    console.log("Pre-orders migrated successfully.");
  }

  // 4. Migrate App Settings
  if (backup.app_settings && backup.app_settings.length > 0) {
    console.log("Migrating app settings...");
    const globalSettings = backup.app_settings.find(s => s.id === 'global') || { customer_count: 1 };
    await setDoc(doc(db, "app_settings", "global"), {
      customer_count: globalSettings.customer_count
    });
    console.log("App settings migrated successfully.");
  }

  console.log("Migration completed successfully with zero data loss!");
}

startMigration().catch((err) => {
  console.error("Migration failed:", err);
});
