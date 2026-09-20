/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  auth, 
  googleProvider 
} from "../firebaseClient";

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

  // Track if running in designated Store Admin mode (Dad's store)
  const [isStoreAdmin, setIsStoreAdmin] = useState(() => {
    // If previously saved as store admin or if remembered
    return localStorage.getItem("elypos_store_admin") === "true";
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setIsDemoMode(false);
        localStorage.removeItem("elypos_is_demo");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    setIsDemoMode(false);
    localStorage.removeItem("elypos_is_demo");
    return cred.user;
  };

  const registerWithEmail = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && cred.user) {
      await updateProfile(cred.user, { displayName });
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
    setIsStoreAdmin(false);
    localStorage.setItem("elypos_is_demo", "true");
    localStorage.removeItem("elypos_store_admin");
  };

  const enterStoreAdmin = () => {
    setIsStoreAdmin(true);
    setIsDemoMode(false);
    localStorage.setItem("elypos_store_admin", "true");
    localStorage.removeItem("elypos_is_demo");
  };

  const logoutUser = async () => {
    try {
      if (user) {
        await signOut(auth);
      }
    } finally {
      setUser(null);
      setIsDemoMode(false);
      setIsStoreAdmin(false);
      localStorage.removeItem("elypos_is_demo");
      localStorage.removeItem("elypos_store_admin");
    }
  };

  const value = {
    user,
    loading,
    isDemoMode,
    isStoreAdmin,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    enterDemoMode,
    enterStoreAdmin,
    logoutUser
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
