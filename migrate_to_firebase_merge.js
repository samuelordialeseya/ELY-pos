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

async function startMigration() {
  const firebaseConfig = getEnvConfig();
  console.log("Using Firebase config project ID:", firebaseConfig.projectId);

  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("YOUR_API_KEY")) {
    console.error("Error: Please replace the placeholder credentials in .env with your actual Firebase project credentials.");
    process.exit(1);
  }

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const backupFile = "supabase_backup_new.json";
  if (!fs.existsSync(backupFile)) {
    console.error(`Error: ${backupFile} does not exist. Please export the new Supabase data to this file first.`);
    process.exit(1);
  }

  console.log(`Reading ${backupFile}...`);
  let backup;
  try {
    backup = JSON.parse(fs.readFileSync(backupFile, "utf-8"));
  } catch (err) {
    console.error(`Error parsing ${backupFile}:`, err.message);
    process.exit(1);
  }

  // Fetch existing IDs from Firebase to avoid overwrites
  async function getExistingIds(collectionName) {
    console.log(`Fetching existing IDs from Firestore collection: ${collectionName}...`);
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const ids = new Set(querySnapshot.docs.map(d => d.id));
      console.log(`Found ${ids.size} existing items in Firestore: ${collectionName}.`);
      return ids;
    } catch (e) {
      console.warn(`Could not fetch existing IDs for ${collectionName} (it might not exist yet):`, e.message);
      return new Set();
    }
  }

  // 1. Migrate Products
  if (backup.products && backup.products.length > 0) {
    const existingIds = await getExistingIds("products");
    let migratedCount = 0;
    let skippedCount = 0;
    for (const prod of backup.products) {
      const { id, ...data } = prod;
      if (existingIds.has(id)) {
        skippedCount++;
        continue;
      }
      await setDoc(doc(db, "products", id), data);
      migratedCount++;
    }
    console.log(`Products: Migrated ${migratedCount}, Skipped ${skippedCount} existing products.`);
  }

  // 2. Migrate Orders
  if (backup.orders && backup.orders.length > 0) {
    const existingIds = await getExistingIds("orders");
    let migratedCount = 0;
    let skippedCount = 0;
    for (const order of backup.orders) {
      const { id, ...data } = order;
      if (existingIds.has(id)) {
        skippedCount++;
        continue;
      }
      await setDoc(doc(db, "orders", id), data);
      migratedCount++;
    }
    console.log(`Orders: Migrated ${migratedCount}, Skipped ${skippedCount} existing orders.`);
  }

  // 3. Migrate Pre-orders
  if (backup.pre_orders && backup.pre_orders.length > 0) {
    const existingIds = await getExistingIds("pre_orders");
    let migratedCount = 0;
    let skippedCount = 0;
    for (const preOrder of backup.pre_orders) {
      const { id, ...data } = preOrder;
      if (existingIds.has(id)) {
        skippedCount++;
        continue;
      }
      await setDoc(doc(db, "pre_orders", id), data);
      migratedCount++;
    }
    console.log(`Pre-orders: Migrated ${migratedCount}, Skipped ${skippedCount} existing pre-orders.`);
  }

  // 4. Merge App Settings (Customer count)
  if (backup.app_settings && backup.app_settings.length > 0) {
    console.log("Merging app settings...");
    const globalSettings = backup.app_settings.find(s => s.id === 'global') || { customer_count: 1 };
    
    let firebaseCustomerCount = 0;
    try {
      const existingSettings = await getDocs(collection(db, "app_settings"));
      const globalDoc = existingSettings.docs.find(d => d.id === 'global');
      if (globalDoc) {
        firebaseCustomerCount = globalDoc.data().customer_count || 0;
      }
    } catch (e) {
      console.warn("Could not fetch app settings:", e.message);
    }
    
    const finalCustomerCount = Math.max(globalSettings.customer_count || 1, firebaseCustomerCount);
    await setDoc(doc(db, "app_settings", "global"), {
      customer_count: finalCustomerCount
    });
    console.log(`App settings merged. Final customer count: ${finalCustomerCount}`);
  }

  console.log("Merge migration completed successfully with zero data loss!");
}

startMigration().catch((err) => {
  console.error("Migration failed:", err);
});
