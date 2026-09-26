/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  auth, 
  db,
  googleProvider,
  OWNER_EMAIL
} from "../firebaseClient";
import { doc, setDoc } from "firebase/firestore";
import { DEFAULT_RECEIPT_CONFIG } from "../data/receiptConfig";

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Track if current session is Guest Demo mode
  const [isDemoMode, setIsDemoMode] = useState(() => {
    return localStorage.getItem("elypos_is_demo") === "true";
  });

  // Derived: is the currently signed-in user Dad's store owner?
  // Hard-coded to samuelordialesyt@gmail.com — always connects to root Firestore collections.
  const isOwnerAccount = !!(user && user.email === OWNER_EMAIL);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Real user signed in — clear any lingering demo flag
        setIsDemoMode(false);
        localStorage.removeItem("elypos_is_demo");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email, password, rememberMe = false) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    setIsDemoMode(false);
    localStorage.removeItem("elypos_is_demo");
    // Persist remembered email for quick access on the store iPad
    if (rememberMe) {
      localStorage.setItem("elypos_remembered_email", email);
    } else {
      localStorage.removeItem("elypos_remembered_email");
    }
    return cred.user;
  };

  const registerWithEmail = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const storeNameToUse = displayName?.trim() || "My Store";
    if (cred.user) {
      if (displayName) {
        await updateProfile(cred.user, { displayName: storeNameToUse });
      }
      localStorage.setItem("elypos_store_name", storeNameToUse);
      localStorage.removeItem("elypos_setup_done");
      localStorage.removeItem(`elypos_setup_done_${cred.user.uid}`);
      try {
        await setDoc(doc(db, "users", cred.user.uid, "app_settings", "global"), {
          store_name: storeNameToUse,
          customer_count: 1,
          setup_done: false,
          receipt_config: DEFAULT_RECEIPT_CONFIG,
          created_at: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error("Error setting initial store settings:", err);
      }
    }
    setIsDemoMode(false);
    localStorage.removeItem("elypos_is_demo");
    return cred.user;
  };

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    setIsDemoMode(false);
    localStorage.removeItem("elypos_is_demo");
    return result.user;
  };

  const enterDemoMode = () => {
    setIsDemoMode(true);
    localStorage.setItem("elypos_is_demo", "true");
  };

  const logoutUser = async () => {
    try {
      if (user) {
        await signOut(auth);
      }
    } finally {
      setUser(null);
      setIsDemoMode(false);
      localStorage.removeItem("elypos_is_demo");
      // Note: We intentionally keep elypos_remembered_email across logouts
      //       so the email is still pre-filled on the sign-in form next time.
    }
  };

  const value = {
    user,
    loading,
    isDemoMode,
    isOwnerAccount,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    enterDemoMode,
    logoutUser,
    // Convenience: pre-filled email for the auth form
    rememberedEmail: localStorage.getItem("elypos_remembered_email") || ""
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
