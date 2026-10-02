import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore";
import { db } from "../firebaseClient";
import { getStorePaths } from "./dbPaths";

export function listenToProducts(user, isOwnerAccount, onData, onError) {
  if (!user) return () => {};
  const { productsPath } = getStorePaths(user, isOwnerAccount);

  const qProducts = query(collection(db, productsPath), orderBy("name"));
  return onSnapshot(qProducts, (snapshot) => {
    const list = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    onData(list);
  }, (err) => {
    console.error("Products listener error:", err);
    if (onError) onError(err);
  });
}

export async function addProductRecord(user, isOwnerAccount, productData) {
  const { productsPath } = getStorePaths(user, isOwnerAccount);
  const docRef = await addDoc(collection(db, productsPath), productData);
  return docRef.id;
}

export async function updateProductRecord(user, isOwnerAccount, productId, updates) {
  const { productsPath } = getStorePaths(user, isOwnerAccount);
  await updateDoc(doc(db, productsPath, productId), updates);
}

export async function deleteProductRecord(user, isOwnerAccount, productId) {
  const { productsPath } = getStorePaths(user, isOwnerAccount);
  await deleteDoc(doc(db, productsPath, productId));
}
