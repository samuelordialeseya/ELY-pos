import React from "react";
import "./LandingPage.css";
import {
  Sparkle,
  Scales,
  Truck,
  Receipt,
  ChartBar,
  ArrowRight,
  GithubLogo,
  CheckCircle,
  Lightning,
  ArrowSquareOut,
  ArrowCounterClockwise,
  Storefront,
  ShieldCheck
} from "@phosphor-icons/react";

const ARCH_SPECS = [
  {
    code: "UI CORE",
    name: "React 19",
    detail: "Modular context state with zero-lag category filtering"
  },
  {
    code: "RUNTIME",
    name: "Vite 7 + PWA",
    detail: "Installable home-screen web app with instant boot"
  },
  {
    code: "SYNC ENGINE",
    name: "Cloud Firestore",
    detail: "Real-time multi-terminal order & catalog synchronization"
  },
  {
    code: "ACCESS",
    name: "Firebase Auth",
    detail: "Multi-tenant store isolation, Google login & guest sandbox"
  },
  {
    code: "RENDERER",
    name: "html2canvas 2×",
    detail: "High-DPI PNG receipt & delivery manifest image export"
  },
  {
    code: "ONBOARDING",
    name: "Driver.js Tours",
    detail: "Interactive step-by-step cashier & owner walkthroughs"
  },
  {
    code: "ERGONOMICS",
    name: "100dvh Light Lock",
    detail: "Glare-resistant sunlit palette tuned for counter tablets"
  },
  {
    code: "PRECISION",
    name: "Centavo Math",
    detail: "Exact decimal weight multipliers without floating-point drift"
  }
];

export default function LandingPage({ onOpenAuth, onLaunchDemo }) {
  const handleTriggerDemo = (options = { withTour: false, view: "pos" }) => {
    if (typeof onLaunchDemo === "function") {
      onLaunchDemo(options);
    }
  };

  const handleTriggerAuth = () => {
    if (typeof onOpenAuth === "function") {
      onOpenAuth();
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="lp-root">
      {/* Floating Navigation Bar */}
      <header className="lp-header">
        <div className="lp-header-inner">
          <button
            type="button"
            className="lp-brand"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            title="ELY.pos — Back to top"
          >
            <img
              src="/landing-logo.png"
              alt="ELY.pos produce stand icon"
              className="lp-brand-logo"
            />
            <div className="lp-brand-text">
              <span className="lp-brand-name">ELY.pos</span>
              <span className="lp-brand-version">v2.0</span>
            </div>
          </button>

          <nav className="lp-nav" aria-label="Primary Navigation">
            <button
              type="button"
              className="lp-nav-link"
              onClick={() => scrollToSection("features")}
            >
              Workflow
            </button>
            <button
              type="button"
              className="lp-nav-link"
              onClick={() => scrollToSection("architecture")}
            >
              Architecture
            </button>
            <button
              type="button"
              className="lp-nav-link"
              onClick={() => handleTriggerDemo({ withTour: true, view: "pos" })}
            >
              Guided Tour
            </button>
            <a
              href="https://github.com/samuelordialeseya/ely-pos"
              target="_blank"
              rel="noopener noreferrer"
              className="lp-nav-link lp-nav-ext"
            >
              <GithubLogo size={15} weight="bold" />
              <span>GitHub</span>
            </a>
          </nav>

          <div className="lp-header-actions">
            <button
              type="button"
              className="lp-btn lp-btn-secondary lp-btn-sm"
              onClick={handleTriggerAuth}
            >
              <span>Sign In</span>
            </button>
            <button
              type="button"
              className="lp-btn lp-btn-primary lp-btn-sm"
              onClick={() => handleTriggerDemo({ withTour: false, view: "pos" })}
            >
              <Sparkle size={15} weight="fill" />
              <span>Try it out!</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Simple & Clean Hero Section */}
        <section className="landing-hero">
          <div className="hero-content">
            <h1 className="hero-title">
              The Fast, Touch-First POS for <br className="hero-title-br" />
              <span className="hero-gradient-text">Fresh Produce &amp; Small Retail</span>
            </h1>

            <p className="hero-subtitle">
              Designed for high-speed counter checkouts, fractional weight scale calculations, 
              dual per-kg and per-piece catalog pricing, and 1-click rider delivery dispatching. 
              Zero lag, zero clutter.
            </p>

            <div className="hero-cta-group">
              <button
                type="button"
                className="hero-launch-pill"
                onClick={() => handleTriggerDemo({ withTour: false, view: "pos" })}
                title="Launch demo"
              >
                <div className="hero-pill-badge">
                  <Sparkle size={16} weight="fill" />
                  <span>Launch demo</span>
                </div>
                <span className="hero-pill-arrow-btn" aria-hidden="true">
                  <ArrowRight size={15} weight="bold" />
                </span>
              </button>

              <button
                type="button"
                className="hero-btn-secondary"
                onClick={handleTriggerAuth}
              >
                <Storefront size={17} weight="bold" />
                <span>Register Store / Sign In</span>
              </button>
            </div>

            <div className="hero-perks">
              <div className="hero-perk-item">
                <CheckCircle size={16} weight="fill" className="perk-icon" />
                <span>100% Free Demo Sandbox</span>
              </div>
              <div className="hero-perk-item">
                <CheckCircle size={16} weight="fill" className="perk-icon" />
                <span>Real-time Firebase Cloud Sync</span>
              </div>
              <div className="hero-perk-item">
                <CheckCircle size={16} weight="fill" className="perk-icon" />
                <span>Touch &amp; PWA Ready</span>
              </div>
            </div>
          </div>
        </section>

        {/* Operational Metrics Strip */}
        <section className="lp-metrics-strip" aria-label="Operational Capabilities">
          <div className="lp-metrics-grid">
            <div className="lp-metric-item">
              <span className="lp-metric-value">₱0.01</span>
              <span className="lp-metric-label">
                Exact centavo math across kg, piece, pack &amp; tali units
              </span>
            </div>
            <div className="lp-metric-item">
              <span className="lp-metric-value">&lt; 100ms</span>
              <span className="lp-metric-label">
                Local cart persistence &amp; zero-keyboard touch numpad
              </span>
            </div>
            <div className="lp-metric-item">
              <span className="lp-metric-value">2× PNG</span>
              <span className="lp-metric-label">
                Instant thermal receipt cards for Messenger, Viber &amp; AirDrop
              </span>
            </div>
            <div className="lp-metric-item">
              <span className="lp-metric-value">1-Click</span>
              <span className="lp-metric-label">
                Batch neighborhood delivery manifest &amp; COD summary
              </span>
            </div>
          </div>
        </section>

        {/* Asymmetric 4-Cell Bento Workflow Showcase */}
        <section id="features" className="lp-section">
          <div className="lp-section-intro">
            <span className="lp-eyebrow">Counter-Tested Workflow</span>
            <h2 className="lp-section-heading">
              Built for the pace of a morning market rush.
            </h2>
            <p className="lp-section-desc">
              Standard barcode POS systems stall when a customer asks for 0.65 kg of carrots
              and three bundles of greens. ELY.pos handles every counter scenario natively.
            </p>
          </div>

          <div className="lp-bento-grid">
            {/* Cell 1 (7 Cols): Dual-Unit Scale & Bundle Engine */}
            <article className="lp-bento-card lp-bento-span-7">
              <div className="lp-bento-copy">
                <div className="lp-bento-icon tone-amber">
                  <Scales size={22} weight="bold" />
                </div>
                <h3>Dual-Unit Scale &amp; Bundle Engine</h3>
                <p>
                  Mix fractional scale weights (<code>0.65 kg</code>) and integer counts
                  (<code>3 tali</code>, <code>2 pc</code>) in a single ticket. Dedicated
                  on-screen touch keypads prevent the iOS virtual keyboard from blocking the cart.
                </p>
              </div>

              <div className="lp-preview-box" aria-hidden="true">
                <div className="lp-preview-ticket-row">
                  <div className="lp-preview-item-left">
                    <span className="lp-tag tone-roots">Root Crops</span>
                    <strong>Red Onion (Sibuyas)</strong>
                  </div>
                  <div className="lp-preview-item-right">
                    <span className="lp-mono-pill">0.65 kg × ₱140.00</span>
                    <strong className="lp-mono-price">₱91.00</strong>
                  </div>
                </div>
                <div className="lp-preview-ticket-row">
                  <div className="lp-preview-item-left">
                    <span className="lp-tag tone-veg">Leafy Greens</span>
                    <strong>Kangkong Bundle</strong>
                  </div>
                  <div className="lp-preview-item-right">
                    <span className="lp-mono-pill">3 tali × ₱20.00</span>
                    <strong className="lp-mono-price">₱60.00</strong>
                  </div>
                </div>
                <div className="lp-preview-ticket-row">
                  <div className="lp-preview-item-left">
                    <span className="lp-tag tone-fruits">Fresh Fruits</span>
                    <strong>Davao Pomelo</strong>
                  </div>
                  <div className="lp-preview-item-right">
                    <span className="lp-mono-pill">1.40 kg × ₱165.00</span>
                    <strong className="lp-mono-price">₱231.00</strong>
                  </div>
                </div>
              </div>
            </article>

            {/* Cell 2 (5 Cols): 5-Second Checkout Rollback */}
            <article className="lp-bento-card lp-bento-span-5">
              <div className="lp-bento-copy">
                <div className="lp-bento-icon tone-blue">
                  <ShieldCheck size={22} weight="bold" />
                </div>
                <h3>5-Second Checkout Rollback</h3>
                <p>
                  Accidental tap during a busy queue? Every completed order triggers a
                  non-blocking rollback banner that restores the exact cart and customer state.
                </p>
              </div>

              <div className="lp-preview-undo-wrap" aria-hidden="true">
                <div className="lp-preview-undo-banner">
                  <div className="lp-preview-undo-left">
                    <span className="lp-undo-dot" />
                    <span>
                      Order for <strong>Maria Santos</strong> completed{" "}
                      <em className="lp-undo-amount">₱382.00</em>
                    </span>
                  </div>
                  <span className="lp-preview-undo-btn">
                    <ArrowCounterClockwise size={12} weight="bold" />
                    Undo Checkout
                  </span>
                </div>
                <div className="lp-preview-metrics-mini">
                  <div>
                    <span>Today&apos;s Gross Sales</span>
                    <strong>₱18,450.00</strong>
                  </div>
                  <div>
                    <span>Completed Tickets</span>
                    <strong>47 Orders</strong>
                  </div>
                </div>
              </div>
            </article>

            {/* Cell 3 (5 Cols): Graphic Digital Receipts */}
            <article className="lp-bento-card lp-bento-span-5">
              <div className="lp-bento-copy">
                <div className="lp-bento-icon tone-violet">
                  <Receipt size={22} weight="bold" />
                </div>
                <h3>Graphic Thermal Receipts</h3>
                <p>
                  Render crisp 2× PNG receipt cards directly in the browser. Send itemized proof
                  of purchase to neighborhood buyers over Messenger, Viber, or AirDrop.
                </p>
              </div>

              <div className="lp-preview-receipt" aria-hidden="true">
                <div className="lp-receipt-header">
                  <strong>ELY&apos;S FRESH FRUITS &amp; VEGGIES</strong>
                  <span>Order #1048 · Digital Copy</span>
                </div>
                <div className="lp-receipt-lines">
                  <div>
                    <span>Benguet Broccoli (0.75 kg)</span>
                    <span>₱135.00</span>
                  </div>
                  <div>
                    <span>Seedless Grapes (1.10 kg)</span>
                    <span>₱286.00</span>
                  </div>
                </div>
                <div className="lp-receipt-total">
                  <span>TOTAL PAID</span>
                  <strong>₱421.00</strong>
                </div>
              </div>
            </article>

            {/* Cell 4 (7 Cols): 1-Click Rider Delivery Manifests */}
            <article className="lp-bento-card lp-bento-span-7">
              <div className="lp-bento-copy">
                <div className="lp-bento-icon tone-cyan">
                  <Truck size={22} weight="bold" />
                </div>
                <h3>1-Click Rider Delivery Manifests</h3>
                <p>
                  Stop losing neighborhood delivery addresses on paper scraps. Filter the day&apos;s
                  delivery orders, track dispatch status, and export a formatted rider sheet with
                  exact collections.
                </p>
              </div>

              <div className="lp-preview-manifest" aria-hidden="true">
                <div className="lp-manifest-head">
                  <span>DISPATCH MANIFEST · MORNING BATCH</span>
                  <span className="lp-manifest-sum">Total COD: ₱1,285.00</span>
                </div>
                <div className="lp-manifest-row">
                  <div className="lp-manifest-Main">
                    <strong>#1044 · Elena Reyes</strong>
                    <span>Blk 4 Lot 12, San Isidro Village · 5 items</span>
                  </div>
                  <div className="lp-manifest-meta">
                    <span className="lp-status-badge delivered">Delivered</span>
                    <strong>₱740.00</strong>
                  </div>
                </div>
                <div className="lp-manifest-row">
                  <div className="lp-manifest-Main">
                    <strong>#1047 · Marco Villanueva</strong>
                    <span>Unit 3B Mabini St. (Gate beside bakery) · 3 items</span>
                  </div>
                  <div className="lp-manifest-meta">
                    <span className="lp-status-badge pending">Out for Delivery</span>
                    <strong>₱545.00</strong>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* Architecture & Engineering Section */}
        <section id="architecture" className="lp-section lp-arch-section">
          <div className="lp-arch-layout">
            <div className="lp-arch-intro">
              <h2 className="lp-section-heading">
                Engineered for counter registers and low-glare reliability.
              </h2>
              <p className="lp-section-desc">
                Built on a modular React 19 + Firebase Firestore architecture that keeps the
                active register responsive even on older store tablets.
              </p>

              <div className="lp-arch-links">
                <button
                  type="button"
                  className="lp-btn lp-btn-secondary"
                  onClick={() => handleTriggerDemo({ withTour: false, view: "dashboard" })}
                >
                  <ChartBar size={17} weight="bold" />
                  <span>Preview Live Analytics</span>
                </button>
                <a
                  href="https://github.com/samuelordialeseya/ely-pos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-arch-github-btn"
                >
                  <GithubLogo size={17} weight="bold" />
                  <span>Inspect Source on GitHub</span>
                  <ArrowSquareOut size={14} weight="bold" />
                </a>
              </div>
            </div>

            <div className="lp-arch-grid">
              {ARCH_SPECS.map((spec) => (
                <div key={spec.name} className="lp-spec-card">
                  <span className="lp-spec-code">{spec.code}</span>
                  <strong className="lp-spec-name">{spec.name}</strong>
                  <p className="lp-spec-detail">{spec.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing Terminal Call-to-Action */}
        <section className="lp-cta-section">
          <div className="lp-cta-card">
            <div className="lp-cta-copy">
              <h2>Test the live register right in your browser.</h2>
              <p>
                Explore pre-loaded produce inventory, test fractional scale weights, export a PNG
                receipt, and inspect daily sales analytics in an isolated sandbox.
              </p>
            </div>
            <div className="lp-cta-actions">
              <button
                type="button"
                className="lp-btn lp-btn-primary lp-btn-lg"
                onClick={() => handleTriggerDemo({ withTour: false, view: "pos" })}
              >
                <Lightning size={18} weight="fill" />
                <span>Try it out!</span>
                <ArrowRight size={17} weight="bold" />
              </button>
              <button
                type="button"
                className="lp-btn lp-btn-secondary lp-btn-lg"
                onClick={handleTriggerAuth}
              >
                <span>Sign In</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <img
              src="/landing-logo.png"
              alt="ELY.pos"
              className="lp-footer-logo"
            />
            <div>
              <span className="lp-footer-title">ELY.pos</span>
              <p className="lp-footer-tagline">
                Point of Sale &amp; Catalog Management System · Built for Ely&apos;s Fresh Fruits &amp;
                Veggies (Est. 2021)
              </p>
            </div>
          </div>

          <div className="lp-footer-links">
            <button
              type="button"
              className="lp-footer-link"
              onClick={() => scrollToSection("features")}
            >
              Workflow
            </button>
            <button
              type="button"
              className="lp-footer-link"
              onClick={() => scrollToSection("architecture")}
            >
              Architecture
            </button>
            <button
              type="button"
              className="lp-footer-link"
              onClick={() => handleTriggerDemo({ withTour: true, view: "pos" })}
            >
              Guided Tour
            </button>
            <a
              href="https://github.com/samuelordialeseya/ely-pos"
              target="_blank"
              rel="noopener noreferrer"
              className="lp-footer-link"
            >
              <GithubLogo size={15} weight="bold" />
              <span>GitHub</span>
              <ArrowSquareOut size={12} weight="bold" />
            </a>
            <span className="lp-footer-version">v2.0 Terminal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
