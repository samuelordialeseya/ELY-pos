import { doc } from "firebase/firestore";
import { db } from "../firebaseClient";

/**
 * Resolves Firestore collection paths and document references.
 * Automatically handles root legacy collections for the store owner
 * and scoped subcollections (/users/{uid}/...) for multi-tenant accounts.
 */
export function getStorePaths(user, isOwnerAccount) {
  const isOwner = Boolean(isOwnerAccount);
  const uid = user?.uid;

  const productsPath = isOwner ? "products" : `users/${uid}/products`;
  const ordersPath = isOwner ? "orders" : `users/${uid}/orders`;
  const statsPath = isOwner ? "daily_stats" : `users/${uid}/daily_stats`;

  const settingsDocRef = isOwner
    ? doc(db, "app_settings", "global")
    : doc(db, "users", uid, "app_settings", "global");

  return {
    isOwner,
    productsPath,
    ordersPath,
    statsPath,
    settingsDocRef
  };
}
