import { flushSync } from "react-dom";
import "driver.js/dist/driver.css";

/**
 * Guided Spotlight Tour Controller for ELY.pos v2.0
 * Dynamically loads driver.js on demand to keep initial POS bundle fast.
 */

const VIEW_STEPS = {
  pos: [
    {
      element: ".product-grid",
      popover: {
        title: "1. Product Catalog",
        description: "Tap any produce card to open the scale weigh-in or quantity keypad. Items support both per-kg weights and per-piece counts.",
        side: "right",
        align: "start"
      }
    },
    {
      element: ".pos-search-wrapper",
      popover: {
        title: "2. Fast Search & Category Filter",
        description: "Filter by Fruits, Vegetables, or search by name in real time.",
        side: "bottom",
        align: "start"
      }
    },
    {
      element: ".bill-sidebar",
      popover: {
        title: "3. Live Cart & Customer Info",
        description: "Tap any item in the cart to adjust its weight/quantity. Switch between Walk-in and Delivery or type the subdivision phase.",
        side: "left",
        align: "start"
      }
    },
    {
      element: ".btn-checkout",
      popover: {
        title: "4. Complete Transaction",
        description: "Saves the sale atomically, increments customer queue count, and generates an instant shareable digital receipt.",
        side: "top",
        align: "center"
      }
    },
    {
      element: ".nav-links",
      popover: {
        title: "5. Terminal Navigation",
        description: "Switch between Register, Analytics Dashboard, Inventory Catalog, Receipts History, Delivery Sheets, and Settings.",
        side: "right",
        align: "start"
      }
    }
  ],
  dashboard: [
    {
      element: ".nav-links",
      popover: {
        title: "Navigation",
        description: "Switch between Dashboard, POS, Inventory, History, Delivery, and Settings here.",
        side: "right",
        align: "start"
      }
    },
    {
      element: ".dash-range-btns",
      popover: {
        title: "Date Filter",
        description: "Select Today, 7 Days, This Month, or any custom calendar date.",
        side: "bottom",
        align: "start"
      }
    },
    {
      element: ".dash-metric-grid",
      popover: {
        title: "Key Metrics",
        description: "Track your total revenue, delivery vs walk-in counts, average ticket value, and total volume sold.",
        side: "bottom",
        align: "start"
      }
    },
    {
      element: ".dash-panels",
      popover: {
        title: "Deep Insights",
        description: "See your top selling produce ranked by revenue and your latest transactions.",
        side: "top",
        align: "start"
      }
    }
  ],
  inventory: [
    {
      element: ".inv-search-wrapper",
      popover: {
        title: "Search Inventory",
        description: "Quickly find an item to edit its daily market price or delete it.",
        side: "bottom",
        align: "start"
      }
    },
    {
      element: ".inv-form-card",
      popover: {
        title: "Add New Item",
        description: "Register new produce with pricing units (kg, pc, pack, tali) and special handling flags.",
        side: "bottom",
        align: "start"
      }
    },
    {
      element: ".inv-table",
      popover: {
        title: "Product List",
        description: "View, inline-edit, or delete existing products. Updates sync immediately to the POS register.",
        side: "top",
        align: "start"
      }
    }
  ],
  orders: [
    {
      element: ".orders-controls",
      popover: {
        title: "History Filters",
        description: "Search for specific customers or select a date to review past orders.",
        side: "bottom",
        align: "start"
      }
    },
    {
      element: ".history-card",
      popover: {
        title: "Digital Receipts",
        description: "View detailed receipts for each order. Download as an image or delete records if needed.",
        side: "top",
        align: "start"
      }
    }
  ],
  delivery: [
    {
      element: ".delivery-step-select",
      popover: {
        title: "Pending Orders",
        description: "Select the orders you want to include in today's rider delivery manifest.",
        side: "right",
        align: "start"
      }
    },
    {
      element: ".manifest-sheet",
      popover: {
        title: "Rider Manifest",
        description: "Automatically sorted by subdivision Phase with special item handling alerts.",
        side: "left",
        align: "start"
      }
    }
  ],
  settings: [
    {
      element: ".settings-page",
      popover: {
        title: "Store Settings",
        description: "Customize your store name, receipt layout template, and account preferences here.",
        side: "top",
        align: "start"
      }
    }
  ]
};

export async function runSectionTour({ currentView, targetView, setView, showToast }) {
  const { driver } = await import("driver.js");

  const launchForView = (activeView) => {
    const rawSteps = VIEW_STEPS[activeView] || [];
    const activeSteps = rawSteps.filter((step) => {
      if (typeof step.element === "string") {
        const el = document.querySelector(step.element);
        return el !== null && el.getBoundingClientRect().width > 0;
      }
      return true;
    });

    if (activeSteps.length === 0) {
      if (showToast) showToast("Spotlight tour ready on current screen!");
      return;
    }

    const tourInstance = driver({
      showProgress: true,
      animate: true,
      steps: activeSteps,
      popoverClass: "driverjs-theme"
    });
    tourInstance.drive();
  };

  const destination = targetView || currentView;
  if (destination !== currentView) {
    setView(destination);
    setTimeout(() => launchForView(destination), 250);
  } else {
    launchForView(currentView);
  }
}

export async function runFullSiteTour({ setView }) {
  const { driver } = await import("driver.js");

  setView("dashboard");
  setTimeout(() => {
    const viewSwitches = {
      1: "dashboard",
      3: "pos",
      7: "inventory",
      8: "orders",
      9: "delivery",
      11: "settings"
    };

    const rawSteps = [
      { element: ".sidebar", popover: { title: "1. Navigation", description: "Welcome! These 6 sections are your entire POS terminal.", side: "right", align: "start" } },
      { element: ".dash-metric-grid", popover: { title: "2. Daily Metrics", description: "Your daily revenue, transaction count, and averages live here.", side: "bottom", align: "start" } },
      { element: ".dash-panels", popover: { title: "3. Store Insights", description: "Top-selling products and recent orders at a glance.", side: "top", align: "start" } },
      { element: ".product-grid", popover: { title: "4. Product Catalog", description: "Tap any item to start ringing it up.", side: "right", align: "start" } },
      { element: ".bill-sidebar", popover: { title: "5. Live Cart", description: "Your current order builds here in real time.", side: "left", align: "start" } },
      { element: ".btn-checkout", popover: { title: "6. Checkout", description: "Complete Transaction saves the sale and generates a receipt.", side: "top", align: "center" } },
      { element: ".inv-form-card", popover: { title: "7. Inventory Management", description: "Add and manage your entire product catalog here.", side: "bottom", align: "start" } },
      { element: ".orders-controls", popover: { title: "8. Transaction History", description: "Filter past transactions by date or customer name.", side: "bottom", align: "start" } },
      { element: ".delivery-step-select", popover: { title: "9. Delivery Planning", description: "Select today's delivery orders to build a manifest.", side: "right", align: "start" } },
      { element: ".manifest-sheet", popover: { title: "10. Rider Manifest", description: "Your rider sheet generates automatically — download as image.", side: "left", align: "start" } },
      { element: ".settings-page", popover: { title: "11. Store Settings", description: "Customize your store name, receipt template, and account settings here.", side: "top", align: "start" } }
    ];

    const tour = driver({
      showProgress: true,
      animate: true,
      steps: rawSteps,
      popoverClass: "driverjs-theme",
      onDestroyed: () => {
        setView("dashboard");
      },
      onHighlightStarted: (_el, _step, { state, driver: dInstance }) => {
        if (viewSwitches[state.activeIndex] !== undefined) {
          flushSync(() => {
            setView(viewSwitches[state.activeIndex]);
          });
          if (dInstance && dInstance.refresh) {
            dInstance.refresh();
            setTimeout(() => dInstance.refresh(), 50);
          }
        }
      }
    });

    tour.drive();
  }, 150);
}
