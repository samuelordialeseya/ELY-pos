import React from "react";
import "./LandingPage.css";
import { 
  ShoppingCart, 
  Sparkles, 
  Scale, 
  Package, 
  Truck, 
  Receipt, 
  BarChart3, 
  ShieldCheck, 
  ArrowRight, 
  Github, 
  CheckCircle2, 
  Zap, 
  Smartphone,
  Layers,
  ExternalLink
} from "lucide-react";

export default function LandingPage({ onOpenAuth, onLaunchDemo }) {
  return (
    <div className="landing-container">
      {/* Navigation Header */}
      <header className="landing-nav">
        <div 
          className="landing-brand" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }} 
          style={{ cursor: 'pointer' }} 
          title="ELY.pos Retail Platform"
        >
          <img src="/ely-logo.png" alt="ELY Logo" className="landing-brand-logo" />
          <div className="landing-brand-info">
            <span className="landing-brand-title">ELY.pos</span>
            <span className="landing-brand-badge">v2.4 Retail</span>
          </div>
        </div>


        <nav className="landing-nav-actions">
          <button className="landing-nav-link" onClick={() => {
            const el = document.getElementById("features");
            el?.scrollIntoView({ behavior: "smooth" });
          }}>
            Features
          </button>
          <button className="landing-nav-link" onClick={() => {
            const el = document.getElementById("architecture");
            el?.scrollIntoView({ behavior: "smooth" });
          }}>
            Tech Stack
          </button>
          <a 
            href="https://github.com/samuelordialeseya/ely-pos" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="landing-nav-github"
            title="GitHub Repository"
          >
            <Github size={18} />
            <span>GitHub</span>
          </a>
          <button className="landing-btn-auth" onClick={onOpenAuth}>
            Sign In
          </button>
          <button className="landing-btn-demo" onClick={onLaunchDemo} title="Try Live Demo">
            <Sparkles size={16} />
            <span>Try Demo</span>
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-pulse"></span>
            <span>Production-Grade POS Platform</span>
          </div>

          <h1 className="hero-title">
            The Fast, Touch-First POS for <br />
            <span className="hero-gradient-text">Fresh Produce & Small Retail</span>
          </h1>

          <p className="hero-subtitle">
            Designed for high-speed counter checkouts, fractional weight scale calculations, 
            dual per-kg and per-piece catalog pricing, and 1-click rider delivery dispatching. 
            Zero lag, zero clutter.
          </p>

          <div className="hero-cta-group">
            <button className="hero-btn-primary" onClick={onLaunchDemo}>
              <Sparkles size={18} />
              <span>Try Live Demo</span>
              <ArrowRight size={18} className="cta-arrow" />
            </button>

            <button className="hero-btn-secondary" onClick={onOpenAuth}>
              <span>Register Store / Sign In</span>
            </button>
          </div>

          <div className="hero-perks">
            <div className="hero-perk-item">
              <CheckCircle2 size={16} className="perk-icon" />
              <span>100% Free Demo Sandbox</span>
            </div>
            <div className="hero-perk-item">
              <CheckCircle2 size={16} className="perk-icon" />
              <span>Real-time Firebase Cloud Sync</span>
            </div>
            <div className="hero-perk-item">
              <CheckCircle2 size={16} className="perk-icon" />
              <span>iPad & PWA Ready</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive Mockup Preview */}
        <div className="hero-preview-wrapper">
          <div className="mockup-card">
            <div className="mockup-header">
              <div className="mockup-dots">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
              <span className="mockup-title">ELY.pos Terminal — Counter 1</span>
              <span className="mockup-live-indicator">LIVE</span>
            </div>

            <div className="mockup-body">
              <div className="mockup-left-col">
                <div className="mockup-quick-stats">
                  <div className="mockup-stat-pill">
                    <span className="stat-pill-label">Daily Gross</span>
                    <span className="stat-pill-val">₱14,850.00</span>
                  </div>
                  <div className="mockup-stat-pill">
                    <span className="stat-pill-label">Orders</span>
                    <span className="stat-pill-val">42 completed</span>
                  </div>
                </div>

                <div className="mockup-product-tiles">
                  <div className="mockup-tile active">
                    <span className="tile-category">Fruits</span>
                    <span className="tile-name">Avocado Davao</span>
                    <span className="tile-price">₱150 / kg</span>
                  </div>
                  <div className="mockup-tile">
                    <span className="tile-category">Fruits</span>
                    <span className="tile-name">Sweet Mango</span>
                    <span className="tile-price">₱160 / kg</span>
                  </div>
                  <div className="mockup-tile">
                    <span className="tile-category">Vegetables</span>
                    <span className="tile-name">Baguio Beans</span>
                    <span className="tile-price">₱180 / kg</span>
                  </div>
                  <div className="mockup-tile">
                    <span className="tile-category">Vegetables</span>
                    <span className="tile-name">Red Onion</span>
                    <span className="tile-price">₱140 / kg</span>
                  </div>
                </div>
              </div>

              <div className="mockup-cart-sidebar">
                <div className="cart-preview-title">Current Order</div>
                <div className="cart-preview-list">
                  <div className="cart-preview-row">
                    <div>
                      <div className="cart-item-name">Avocado Davao</div>
                      <div className="cart-item-sub">1.25 kg × ₱150.00</div>
                    </div>
                    <div className="cart-item-subtotal">₱187.50</div>
                  </div>
                  <div className="cart-preview-row">
                    <div>
                      <div className="cart-item-name">Fuji Apple (Large)</div>
                      <div className="cart-item-sub">3 pcs × ₱35.00</div>
                    </div>
                    <div className="cart-item-subtotal">₱105.00</div>
                  </div>
                </div>
                <div className="cart-preview-total">
                  <span>Total Amount</span>
                  <span className="total-accent">₱292.50</span>
                </div>
                <button className="cart-preview-btn" onClick={onLaunchDemo}>
                  Complete Transaction (Demo)
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real-World Pain Points Solved */}
      <section className="landing-section problems-section">
        <div className="section-header">
          <span className="section-eyebrow">Real-World Engineered</span>
          <h2 className="section-title">Built for the Chaos of a Busy Produce Counter</h2>
          <p className="section-subtitle">
            Generic POS systems fail at produce stalls. They don't handle daily market price fluctuations, 
            fractional scale weights, or chaotic rider delivery sheets. ELY.pos was built from the ground up to fix this.
          </p>
        </div>

        <div className="problems-grid">
          <div className="problem-card">
            <div className="problem-badge problem">The Old Way</div>
            <h3>Rigid Retail Barcode Systems</h3>
            <p>
              Standard retail POS platforms force items into fixed unit barcodes. Cashiers struggle 
              when customers buy fractional scale weights (e.g. 0.65 kg) or mixed bundles (tali).
            </p>
            <div className="solution-divider"></div>
            <div className="problem-badge solution">ELY.pos Solution</div>
            <p className="solution-text">
              <strong>Native Dual-Unit Engine:</strong> Effortlessly sell by kilogram with real-time 
              decimal scaling or by piece and bundle with integer counts, all unified in a single rapid cart.
            </p>
          </div>

          <div className="problem-card">
            <div className="problem-badge problem">The Old Way</div>
            <h3>Mental Math at the Scale</h3>
            <p>
              "Customer wants 0.85 kg of carrots at ₱110/kg." The cashier pauses, grabs a physical calculator, 
              or approximates in their head while a queue of morning customers forms.
            </p>
            <div className="solution-divider"></div>
            <div className="problem-badge solution">ELY.pos Solution</div>
            <p className="solution-text">
              <strong>Instant Fractional Multiplier:</strong> Tap the item, enter the scale reading 
              (e.g., 0.85), and the subtotal calculates immediately to the exact centavo.
            </p>
          </div>

          <div className="problem-card">
            <div className="problem-badge problem">The Old Way</div>
            <h3>Lost Delivery Manifests</h3>
            <p>
              Orders meant for neighborhood delivery get jumbled on scraps of paper. 
              Riders leave without clear delivery addresses, contact numbers, or exact change amounts.
            </p>
            <div className="solution-divider"></div>
            <div className="problem-badge solution">ELY.pos Solution</div>
            <p className="solution-text">
              <strong>1-Click Rider Manifests:</strong> Select the day's delivery orders and generate 
              a neat, formatted dispatch sheet with recipient notes, delivery addresses, and total collections.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="landing-section features-section">
        <div className="section-header">
          <span className="section-eyebrow">Key Capabilities</span>
          <h2 className="section-title">Everything a Fast-Moving Retailer Needs</h2>
          <p className="section-subtitle">
            Engineered for speed, clarity, and reliability on counter iPads and mobile devices.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-box blue">
              <Scale size={24} />
            </div>
            <h3>Dual Weight & Unit Pricing</h3>
            <p>
              Seamlessly support items sold per kilogram, per piece, per pack, or per bundle (tali). 
              Automatic decimal math ensures precision.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box teal">
              <Package size={24} />
            </div>
            <h3>Touch-First Catalog & Inventory</h3>
            <p>
              Quickly add seasonal produce, edit prices on the fly, and categorize items with zero 
              clutter or cumbersome enterprise menus.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box orange">
              <Truck size={24} />
            </div>
            <h3>Delivery Manifest Generator</h3>
            <p>
              Batch select pending orders to create a clean, printer-ready or screenshot-ready manifest 
              for delivery drivers.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box green">
              <Receipt size={24} />
            </div>
            <h3>Graphic Digital Receipts</h3>
            <p>
              Generate high-resolution PNG receipt cards directly in the browser via canvas rendering. 
              Ready to send via Messenger, Viber, or AirDrop.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box purple">
              <BarChart3 size={24} />
            </div>
            <h3>Live Sales & Daily Analytics</h3>
            <p>
              Real-time dashboard metrics track daily gross sales, order volume, average ticket size, 
              and top revenue-driving products.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box red">
              <Zap size={24} />
            </div>
            <h3>Zero-Lag Touch Performance</h3>
            <p>
              Optimized React 19 architecture with snappy category switching, instant search filtering, 
              and offline-tolerant local cart states.
            </p>
          </div>
        </div>
      </section>

      {/* Tech Stack & Open Source Showcase */}
      <section id="architecture" className="landing-section tech-section">
        <div className="section-header">
          <span className="section-eyebrow">Engineering Architecture</span>
          <h2 className="section-title">Modern, Clean Web Architecture</h2>
          <p className="section-subtitle">
            Built with modern web standards for lightning-fast performance and seamless deployment.
          </p>
        </div>

        <div className="tech-pills-container">
          <div className="tech-pill">
            <span className="tech-pill-name">React 19</span>
            <span className="tech-pill-desc">Concurrent UI Core</span>
          </div>
          <div className="tech-pill">
            <span className="tech-pill-name">Vite 7</span>
            <span className="tech-pill-desc">Fast Bundling & HMR</span>
          </div>
          <div className="tech-pill">
            <span className="tech-pill-name">Firebase Firestore</span>
            <span className="tech-pill-desc">Real-time Cloud Database</span>
          </div>
          <div className="tech-pill">
            <span className="tech-pill-name">Firebase Auth</span>
            <span className="tech-pill-desc">Secure Multi-tenant & Google Login</span>
          </div>
          <div className="tech-pill">
            <span className="tech-pill-name">Driver.js</span>
            <span className="tech-pill-desc">Interactive Guided Onboarding</span>
          </div>
          <div className="tech-pill">
            <span className="tech-pill-name">html2canvas</span>
            <span className="tech-pill-desc">Client-side Graphic Receipts</span>
          </div>
          <div className="tech-pill">
            <span className="tech-pill-name">Phosphor Icons</span>
            <span className="tech-pill-desc">Crisp & Modern Iconography</span>
          </div>
          <div className="tech-pill">
            <span className="tech-pill-name">Vite PWA</span>
            <span className="tech-pill-desc">Installable iPad Web App</span>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="landing-cta-banner">
        <div className="cta-banner-content">
          <h2>Experience the POS Terminal Now</h2>
          <p>
            Test the live register, add items to cart, test decimal weights, and inspect daily sales analytics. 
            No credit card or setup required.
          </p>
          <div className="cta-banner-buttons">
            <button className="cta-btn-white" onClick={onLaunchDemo}>
              <Sparkles size={18} />
              <span>Launch Demo Sandbox</span>
            </button>
            <button className="cta-btn-ghost" onClick={onOpenAuth}>
              <span>Sign In / Create Account</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-left">
          <div className="footer-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/ely-logo.png" alt="ELY" style={{ width: 28, height: 28, borderRadius: 7 }} />
            <span>ELY.pos</span>
          </div>
          <p className="footer-tagline">
            Point of Sale & Catalog Management System. Built for Ely's Fresh Fruits & Veggies (Est. 2021).
          </p>
        </div>
        <div className="footer-right">
          <a 
            href="https://github.com/samuelordialeseya/ely-pos" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-github-link"
          >
            <Github size={16} />
            <span>View Source on GitHub</span>
            <ExternalLink size={12} />
          </a>
          <span className="footer-version">v2.4 Production</span>
        </div>
      </footer>
    </div>
  );
}
