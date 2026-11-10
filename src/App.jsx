import "./App.css";
import React, { useState, useEffect, Suspense, lazy, useCallback } from "react";
import { setDoc } from "firebase/firestore";
import { ArrowCounterClockwise, X, CheckCircle } from "@phosphor-icons/react";

import { useAuth } from "./context/AuthContext";
import { StoreProvider, useStore } from "./context/StoreContext";
import { CartProvider, useCart } from "./context/CartContext";
import { useToast } from "./hooks/useToast";
import { auth } from "./firebaseClient";
import { getStorePaths } from "./services/dbPaths";
import { captureElementToPng } from "./utils/exportImage";
import { runSectionTour, runFullSiteTour } from "./services/tourService";

// Core POS Register Shell (Eagerly loaded for instant counter responsiveness)
import PosSidebar from "./components/navigation/PosSidebar";
import PosHeader from "./components/navigation/PosHeader";
import ProductCatalog from "./components/pos/ProductCatalog";
import CartSidebar from "./components/pos/CartSidebar";
import WeightKeypadModal from "./components/pos/WeightKeypadModal";
import InstantReceiptModal from "./components/modals/InstantReceiptModal";

// Lazy-loaded Secondary Views (Code-split to reduce initial bundle size)
const LandingPage = lazy(() => import("./components/LandingPage"));
const AuthPage = lazy(() => import("./components/AuthPage"));
const SetupWizard = lazy(() => import("./components/SetupWizard"));
const SettingsPage = lazy(() => import("./components/SettingsPage"));
const AnalyticsDashboard = lazy(() => import("./components/dashboard/AnalyticsDashboard"));
const InventoryManagement = lazy(() => import("./components/inventory/InventoryManagement"));
const OrderHistoryView = lazy(() => import("./components/history/OrderHistoryView"));
const DeliveryManifestView = lazy(() => import("./components/manifest/DeliveryManifestView"));

function ViewFallback() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, minHeight: "240px", color: "var(--text-subtle, #64748b)", fontSize: "14px" }}>
      Loading view…
    </div>
  );
}

function PosTerminalShell({ toast, showToast }) {
  const { user, isDemoMode, isOwnerAccount, loading: authLoading, enterDemoMode, logoutUser } = useAuth();

  const {
    fruits,
    activeOrders,
    historyOrders,
    storeName,
    setStoreName,
    receiptConfig,
    showSetupWizard,
    setShowSetupWizard,
    filterDate,
    setFilterDate,
    dashboardRange,
    setDashboardRange,
    dashboardCustomDate,
    setDashboardCustomDate,
    dashAggregates,
    handleAddProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleDeleteOrder,
    handleToggleDeliveryStatus,
    updateStoreName,
    updateReceiptConfig,
    resetStoreStateOnLogout
  } = useStore();

  const {
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
  } = useCart();

  // Top-level screen routing: 'landing' | 'auth' | 'app'
  const [screen, setScreen] = useState(() => {
    const hasAuth = Boolean(auth.currentUser || localStorage.getItem("elypos_is_demo") === "true");
    if (window.location.hash === "#app") return hasAuth ? "app" : "landing";
    if (window.location.hash === "#auth" || window.location.hash === "#login") return hasAuth ? "app" : "auth";
    return "landing";
  });

  // Active terminal view: 'dashboard' | 'pos' | 'inventory' | 'orders' | 'delivery' | 'settings'
  const [view, setView] = useState("dashboard");

  // POS Register local search/category filter
  const [posSearchTerm, setPosSearchTerm] = useState("");
  const [posSelectedCategory, setPosSelectedCategory] = useState("All");

  const handleNavigateToInventory = useCallback(() => {
    setView("inventory");
  }, []);

  const handleClearPosFilters = useCallback(() => {
    setPosSearchTerm("");
    setPosSelectedCategory("All");
  }, []);

  // Keep screen state synchronized with window hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const isAuthenticated = Boolean(user || auth.currentUser || isDemoMode);
      if (hash === "#app") {
        if (isAuthenticated) setScreen("app");
        else {
          window.location.hash = "#auth";
          setScreen("auth");
        }
      } else if (hash === "#auth" || hash === "#login") {
        if (isAuthenticated) {
          window.location.hash = "#app";
          setScreen("app");
        } else {
          setScreen("auth");
        }
      } else if (hash === "#landing" || hash === "") {
        setScreen("landing");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [user, isDemoMode]);

  // Derive active screen without cascading setState inside useEffect
  const isAuthenticated = Boolean(user || auth.currentUser || isDemoMode);
  const activeScreen = (() => {
    if (!authLoading && screen === "app" && !isAuthenticated) return "landing";
    if (!authLoading && isAuthenticated && (screen === "auth" || (screen === "landing" && window.location.hash !== "#landing"))) {
      return "app";
    }
    return screen;
  })();

  // Synchronize browser hash with derived screen
  useEffect(() => {
    if (authLoading) return;
    if (activeScreen === "landing" && window.location.hash === "#app") {
      window.location.hash = "#landing";
    } else if (activeScreen === "app" && window.location.hash !== "#app") {
      window.location.hash = "#app";
    }
  }, [authLoading, activeScreen]);

  // Tour handlers
  const handleStartTour = useCallback((targetView = null) => {
    runSectionTour({
      currentView: view,
      targetView,
      setView,
      showToast
    });
  }, [view, showToast]);

  const handleStartFullTour = useCallback(() => {
    runFullSiteTour({ setView });
  }, []);

  // Sign out / exit demo handler
  const handleSignOut = useCallback(async () => {
    await logoutUser();
    resetStoreStateOnLogout();
    setView("dashboard");
    setScreen("landing");
    window.location.hash = "#landing";
  }, [logoutUser, resetStoreStateOnLogout]);

  // Image Exports (Delivery Manifest)
  const captureManifest = useCallback(async () => {
    await captureElementToPng(
      "manifest-area-capture",
      `Delivery_List_${filterDate}.png`,
      {
        onSuccess: (msg) => showToast(msg || "Manifest Saved"),
        onError: (err) => showToast("Save failed: " + err)
      }
    );
  }, [filterDate, showToast]);

  if (authLoading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "var(--bg, #0f172a)", flexDirection: "column", gap: "16px"
      }}>
        <div style={{
          width: 48, height: 48, border: "4px solid rgba(255,255,255,0.1)",
          borderTop: "4px solid #6366f1", borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }} />
        <p style={{ color: "rgba(255,255,255,0.5)", fontFamily: "inherit", fontSize: "14px", margin: 0 }}>
          Loading ELY.pos…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (activeScreen === "landing") {
    return (
      <Suspense fallback={<ViewFallback />}>
        <LandingPage
          onOpenAuth={() => {
            if (user || auth.currentUser || isDemoMode) {
              setScreen("app");
              window.location.hash = "#app";
            } else {
              setScreen("auth");
              window.location.hash = "#auth";
            }
          }}
          onLaunchDemo={(options = {}) => { const withTour = typeof options === "boolean" ? options : Boolean(options?.withTour); const initialView = typeof options === "object" && options?.view ? options.view : "pos"; enterDemoMode(); setView(initialView);
            setScreen("app");
            window.location.hash = "#app";
            if (withTour) setTimeout(() => handleStartFullTour(), 350);
          }}
        />
      </Suspense>
    );
  }

  if (activeScreen === "auth") {
    return (
      <Suspense fallback={<ViewFallback />}>
        <AuthPage
          onSuccessLogin={() => {
            setScreen("app");
            window.location.hash = "#app";
          }}
          onBackToLanding={() => {
            setScreen("landing");
            window.location.hash = "#landing";
          }}
        />
      </Suspense>
    );
  }

  return (
    <div className={`pos-layout${view !== "pos" ? " no-cart" : ""}`}>
      <PosSidebar
        storeName={storeName}
        view={view}
        setView={setView}
        onStartTour={handleStartTour}
      />

      <main className="main-viewport">
        <PosHeader
          view={view}
          storeName={storeName}
          isDemoMode={isDemoMode}
          onExitDemo={handleSignOut}
          onStartTour={handleStartTour}
          fruits={fruits}
          posSearchTerm={posSearchTerm}
          setPosSearchTerm={setPosSearchTerm}
          posSelectedCategory={posSelectedCategory}
          setPosSelectedCategory={setPosSelectedCategory}
        />

        {view === "pos" && (
          <ProductCatalog
            fruits={fruits}
            cart={cart}
            posSelectedCategory={posSelectedCategory}
            posSearchTerm={posSearchTerm}
            onSelectProduct={openWeighInModal}
            onNavigateToInventory={handleNavigateToInventory}
            onClearFilters={handleClearPosFilters}
          />
        )}

        <Suspense fallback={<ViewFallback />}>
          {view === "dashboard" && (
            <AnalyticsDashboard
              dashboardRange={dashboardRange}
              setDashboardRange={setDashboardRange}
              dashboardCustomDate={dashboardCustomDate}
              setDashboardCustomDate={(val) => {
                setDashboardCustomDate(val);
                setFilterDate(val);
              }}
              aggregates={dashAggregates}
              onNavigateToPos={() => setView("pos")}
              onNavigateToOrders={() => setView("orders")}
            />
          )}

          {view === "inventory" && (
            <InventoryManagement
              fruits={fruits}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {view === "orders" && (
            <OrderHistoryView
              orders={historyOrders}
              allOrders={activeOrders}
              filterDate={filterDate}
              setFilterDate={setFilterDate}
              onSelectOrder={setCompletedReceiptModal}
              onDeleteOrder={handleDeleteOrder}
              showToast={showToast}
            />
          )}

          {view === "delivery" && (
            <DeliveryManifestView
              orders={historyOrders}
              filterDate={filterDate}
              setFilterDate={setFilterDate}
              storeName={storeName}
              onToggleStatus={handleToggleDeliveryStatus}
              onCaptureManifest={captureManifest}
            />
          )}

          {view === "settings" && (
            <SettingsPage
              storeName={storeName}
              onUpdateStoreName={updateStoreName}
              receiptConfig={receiptConfig}
              onUpdateReceiptConfig={updateReceiptConfig}
              isDemoMode={isDemoMode}
              user={user}
              onRerunWizard={() => setShowSetupWizard(true)}
              onStartFullTour={handleStartFullTour}
              onReload={() => {
                if (window.confirm("Reload the POS? Active cart items are saved and will be restored.")) {
                  window.location.reload();
                }
              }}
              onSignOut={handleSignOut}
            />
          )}
        </Suspense>
      </main>

      {/* POS Cart Sidebar */}
      {view === "pos" && (
        <CartSidebar
          cart={cart}
          customer={customer}
          setCustomer={setCustomer}
          address={address}
          setAddress={setAddress}
          receiptConfig={receiptConfig}
          onEditItem={openEditCartItemModal}
          onStepItemQty={stepCartItemQty}
          onRemoveItem={handleRemoveCartItem}
          onClearCart={handleClearCart}
          onCheckout={completeOrder}
          isCheckingOut={isCheckingOut}
        />
      )}

      {/* Scale Weigh-In / Quantity Keypad Modal */}
      {weighInProduct && (
        <WeightKeypadModal
          product={weighInProduct}
          qtyStr={modalQtyStr}
          setQtyStr={setModalQtyStr}
          isEditingCartItem={Boolean(editingCartId)}
          onClose={closeWeighInModal}
          onConfirm={handleConfirmWeighIn}
        />
      )}

      {/* Rollback Undo Banner */}
      {undoBanner && (
        <div className="checkout-undo-banner" role="status" aria-live="polite">
          <div className="undo-banner-left">
            <span className="undo-pulse-dot" aria-hidden="true" />
            <span className="undo-banner-text">
              Order for <strong>{undoBanner.customerName}</strong> completed{" "}
              <span className="undo-banner-price">₱{undoBanner.total?.toFixed(2)}</span>
            </span>
          </div>
          <div className="undo-banner-actions">
            <button
              type="button"
              className="btn-undo-checkout"
              onClick={() => handleUndoOrder(undoBanner.id)}
              style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
            >
              <ArrowCounterClockwise size={13} weight="bold" style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}>Undo Checkout</span>
            </button>
            <button
              type="button"
              className="btn-undo-dismiss"
              onClick={dismissUndoBanner}
              aria-label="Dismiss undo notification"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* Completed Sale Receipt Modal */}
      {completedReceiptModal && (
        <InstantReceiptModal
          order={completedReceiptModal}
          onClose={() => setCompletedReceiptModal(null)}
          storeName={storeName}
          receiptConfig={receiptConfig}
          canUndo={Boolean(undoBanner && undoBanner.id === completedReceiptModal.id)}
          onUndo={handleUndoOrder}
          showToast={showToast}
        />
      )}

      {/* First-Time Setup Wizard */}
      {showSetupWizard && (
        <Suspense fallback={null}>
          <SetupWizard
            user={user}
            isDemoMode={isDemoMode}
            currentStoreName={storeName}
            onComplete={async (newStoreName, storeType) => {
              setStoreName(newStoreName);
              localStorage.setItem("elypos_store_name", newStoreName);
              localStorage.setItem("elypos_store_type", storeType);
              localStorage.setItem("elypos_setup_done", "true");
              if (user?.uid) {
                localStorage.setItem(`elypos_setup_done_${user.uid}`, "true");
              }
              if (!isDemoMode && user) {
                const { settingsDocRef } = getStorePaths(user, isOwnerAccount);
                setDoc(
                  settingsDocRef,
                  {
                    store_name: newStoreName,
                    store_type: storeType,
                    setup_done: true
                  },
                  { merge: true }
                ).catch(console.error);
              }
              setShowSetupWizard(false);
              setTimeout(() => { handleStartFullTour(); }, 300);
            }}
            onSkip={() => {
              localStorage.setItem("elypos_setup_done", "true");
              if (user?.uid) {
                localStorage.setItem(`elypos_setup_done_${user.uid}`, "true");
              }
              if (!isDemoMode && user) {
                const { settingsDocRef } = getStorePaths(user, isOwnerAccount);
                setDoc(settingsDocRef, { setup_done: true }, { merge: true }).catch(console.error);
              }
              setShowSetupWizard(false);
            }}
          />
        </Suspense>
      )}

      {/* Global Toast */}
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <div className="toast-icon-wrap" aria-hidden="true">
            <CheckCircle size={15} weight="fill" className="toast-icon" />
          </div>
          <span className="toast-text">{toast}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const { toast, showToast } = useToast();

  return (
    <StoreProvider showToast={showToast}>
      <CartProvider showToast={showToast}>
        <PosTerminalShell toast={toast} showToast={showToast} />
      </CartProvider>
    </StoreProvider>
  );
}
