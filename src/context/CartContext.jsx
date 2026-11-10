/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useStore } from "./StoreContext";
import { getLocalDateKey } from "../data/demoSeed";
import { createOrderAtomic, undoOrderAtomic } from "../services/orderService";
import { roundWeight, computeItemSubtotal, computeCartTotal } from "../utils/moneyUtils";

const CartContext = createContext(null);

const CART_STORAGE_KEY = "elypos_active_cart_v2";

const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).substring(2, 15);
};

function loadPersistedCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return { cart: [], customer: "", address: "" };
    const parsed = JSON.parse(raw);
    return {
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
      customer: typeof parsed.customer === "string" ? parsed.customer : "",
      address: typeof parsed.address === "string" ? parsed.address : ""
    };
  } catch {
    return { cart: [], customer: "", address: "" };
  }
}

export function CartProvider({ children, showToast }) {
  const { user, isDemoMode, isOwnerAccount } = useAuth();
  const { customerCount, setCustomerCount, setActiveOrders } = useStore();

  // Initialize from localStorage so accidental iPad reloads never lose an active customer order
  const initialDraft = useRef(loadPersistedCart());
  const [cart, setCart] = useState(initialDraft.current.cart);
  const [customer, setCustomer] = useState(initialDraft.current.customer);
  const [address, setAddress] = useState(initialDraft.current.address);

  // Weigh-in / quantity keypad modal state
  const [weighInProduct, setWeighInProduct] = useState(null);
  const [editingCartId, setEditingCartId] = useState(null);
  const [modalQtyStr, setModalQtyStr] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Post-checkout modals & rollback banner
  const [undoBanner, setUndoBanner] = useState(null);
  const undoTimerRef = useRef(null);
  const [completedReceiptModal, setCompletedReceiptModal] = useState(null);

  // Persist active cart draft to localStorage
  useEffect(() => {
    try {
      if (cart.length === 0 && !customer && !address) {
        localStorage.removeItem(CART_STORAGE_KEY);
      } else {
        localStorage.setItem(
          CART_STORAGE_KEY,
          JSON.stringify({ cart, customer, address })
        );
      }
    } catch {
      // Ignore storage quota errors
    }
  }, [cart, customer, address]);

  // Clean up undo timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  const openWeighInModal = useCallback((product) => {
    setEditingCartId(null);
    setWeighInProduct(product);
    setModalQtyStr("");
  }, []);

  const openEditCartItemModal = useCallback((cartItem) => {
    if (!cartItem) return;
    setEditingCartId(cartItem.cartId);
    setWeighInProduct({
      id: cartItem.productId || cartItem.cartId,
      name: cartItem.name,
      price: cartItem.price,
      unit: cartItem.unit,
      category: "Update Item",
      special_flag: cartItem.special_flag || ""
    });
    setModalQtyStr(String(cartItem.quantity || ""));
  }, []);

  const closeWeighInModal = useCallback(() => {
    setWeighInProduct(null);
    setEditingCartId(null);
  }, []);

  const addToCart = useCallback((product, rawQty) => {
    const roundedQty = roundWeight(rawQty);
    if (!roundedQty || roundedQty <= 0) {
      showToast("Enter weight or quantity");
      return;
    }

    setCart((prev) => {
      // Case 1: Editing an existing cart line item directly
      if (editingCartId) {
        return prev.map((c) =>
          c.cartId === editingCartId
            ? {
                ...c,
                quantity: roundedQty,
                subtotal: computeItemSubtotal(c.price, roundedQty)
              }
            : c
        );
      }

      // Case 2: Product already exists in cart -> merge quantity cleanly
      const existingIndex = prev.findIndex(
        (c) => (product.id && c.productId === product.id) || c.name === product.name
      );

      if (existingIndex !== -1) {
        const existing = prev[existingIndex];
        const mergedQty = roundWeight(existing.quantity + roundedQty);
        const updatedItem = {
          ...existing,
          price: product.price,
          unit: product.unit,
          special_flag: product.special_flag || existing.special_flag || "",
          quantity: mergedQty,
          subtotal: computeItemSubtotal(product.price, mergedQty)
        };
        const next = [...prev];
        next[existingIndex] = updatedItem;
        return next;
      }

      // Case 3: New line item
      const newItem = {
        cartId: generateId(),
        productId: product.id || null,
        name: product.name,
        price: product.price,
        quantity: roundedQty,
        unit: product.unit,
        subtotal: computeItemSubtotal(product.price, roundedQty),
        special_flag: product.special_flag || ""
      };
      return [...prev, newItem];
    });

    showToast(
      editingCartId
        ? `Updated ${product.name} to ${roundedQty} ${product.unit}`
        : `Added ${roundedQty} ${product.unit} ${product.name}`
    );
  }, [editingCartId, showToast]);

  const handleConfirmWeighIn = useCallback(() => {
    if (!weighInProduct) return;
    const parsed = parseFloat(modalQtyStr);
    if (!parsed || parsed <= 0) {
      showToast("Please enter a valid quantity or weight");
      return;
    }
    addToCart(weighInProduct, parsed);
    closeWeighInModal();
  }, [weighInProduct, modalQtyStr, addToCart, closeWeighInModal, showToast]);

  const stepCartItemQty = useCallback((cartId, delta) => {
    setCart((prev) => {
      const target = prev.find((c) => c.cartId === cartId);
      if (!target) return prev;
      const nextQty = roundWeight(target.quantity + delta);
      if (nextQty <= 0) {
        return prev.filter((c) => c.cartId !== cartId);
      }
      return prev.map((c) =>
        c.cartId === cartId
          ? {
              ...c,
              quantity: nextQty,
              subtotal: computeItemSubtotal(c.price, nextQty)
            }
          : c
      );
    });
  }, []);

  const handleRemoveCartItem = useCallback((cartId) => {
    setCart((prev) => {
      const target = prev.find((c) => c.cartId === cartId);
      if (target && showToast) {
        showToast(`Removed ${target.name} from cart`);
      }
      return prev.filter((c) => c.cartId !== cartId);
    });
  }, [showToast]);

  const handleClearCart = useCallback(() => {
    if (cart.length === 0) return;
    setCart([]);
    setCustomer("");
    setAddress("");
    showToast("Cart cleared");
  }, [cart.length, showToast]);

  const dismissUndoBanner = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setUndoBanner(null);
  }, []);

  // --- Atomic Checkout & Rollback ---
  const completeOrder = useCallback(async () => {
    if (isCheckingOut) return;
    if (cart.length === 0) {
      showToast("Cart is empty!");
      return;
    }

    setIsCheckingOut(true);
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    const now = new Date();
    const rawDate = getLocalDateKey(now);
    const trimmedAddress = address.trim() || "Walk-in";
    const isDelivery = Boolean(
      trimmedAddress.toLowerCase() !== "walk-in" &&
      trimmedAddress.toLowerCase() !== "walk in" &&
      trimmedAddress.toLowerCase() !== "in-store"
    );

    const newOrder = {
      customer_name: customer.trim() || `Customer #${customerCount}`,
      address: trimmedAddress,
      status: "Pending",
      items: cart,
      total: computeCartTotal(cart),
      created_at: now.toISOString(),
      raw_date: rawDate,
      display_date: now.toLocaleDateString(),
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      order_type: isDelivery ? "delivery" : "pos"
    };

    const cartSnapshot = [...cart];
    const customerSnapshot = customer;
    const addressSnapshot = address;

    try {
      let createdId = "";
      if (isDemoMode) {
        createdId = `demo-order-${Date.now()}`;
        const demoOrd = { id: createdId, ...newOrder };
        setActiveOrders((prev) => [demoOrd, ...prev]);
        setCustomerCount((prev) => prev + 1);
        setCart([]);
        setCustomer("");
        setAddress("");
        setCompletedReceiptModal(demoOrd);
      } else {
        createdId = await createOrderAtomic(user, isOwnerAccount, newOrder);
        setCart([]);
        setCustomer("");
        setAddress("");
        setCompletedReceiptModal({ id: createdId, ...newOrder });
      }

      setUndoBanner({
        id: createdId,
        customerName: newOrder.customer_name,
        total: newOrder.total,
        raw_date: rawDate,
        items: cartSnapshot,
        customer: customerSnapshot,
        address: addressSnapshot
      });

      // Auto-dismiss Undo Banner after 15 seconds (Fixes Bug 7)
      undoTimerRef.current = setTimeout(() => {
        setUndoBanner(null);
        undoTimerRef.current = null;
      }, 15000);

      showToast("Transaction Saved!");
    } catch (orderError) {
      showToast("Error: " + orderError.message);
    } finally {
      setIsCheckingOut(false);
    }
  }, [
    isCheckingOut,
    cart,
    address,
    customer,
    customerCount,
    isDemoMode,
    user,
    isOwnerAccount,
    setActiveOrders,
    setCustomerCount,
    showToast
  ]);

  const handleUndoOrder = useCallback(async (orderId) => {
    const snapshot = undoBanner;
    dismissUndoBanner();
    setCompletedReceiptModal(null);

    try {
      if (isDemoMode) {
        setActiveOrders((prev) => prev.filter((o) => o.id !== orderId));
        setCustomerCount((prev) => Math.max(1, prev - 1));
      } else {
        await undoOrderAtomic(user, isOwnerAccount, orderId, snapshot);
      }

      if (snapshot && snapshot.items) {
        setCart(snapshot.items);
        setCustomer(snapshot.customer || "");
        setAddress(snapshot.address || "");
      }
      showToast("Order Undone · Cart Restored");
    } catch (err) {
      showToast("Failed to undo order: " + err.message);
    }
  }, [undoBanner, dismissUndoBanner, isDemoMode, user, isOwnerAccount, setActiveOrders, setCustomerCount, showToast]);

  const value = {
    cart,
    customer,
    setCustomer,
    address,
    setAddress,
    weighInProduct,
    editingCartId,
    modalQtyStr,
    setModalQtyStr,
    isCheckingOut,
    undoBanner,
    dismissUndoBanner,
    completedReceiptModal,
    setCompletedReceiptModal,
    openWeighInModal,
    openEditCartItemModal,
    closeWeighInModal,
    handleConfirmWeighIn,
    stepCartItemQty,
    handleRemoveCartItem,
    handleClearCart,
    completeOrder,
    handleUndoOrder
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
