import React, { useState } from "react";
import "./OnboardingModal.css";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Layers, 
  Scale, 
  Package, 
  Truck, 
  Compass, 
  CheckCircle2 
} from "lucide-react";

export default function OnboardingModal({ isOpen, onClose, onStartTour }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem("elypos_hide_onboarding", "true");
    }
    onClose();
  };

  const steps = [

    {
      badge: "Welcome",
      title: "Welcome to ELY.pos",
      subtitle: "Fast, touch-first Point of Sale & Inventory for fresh produce and small retail.",
      icon: <Sparkles size={32} className="step-icon text-blue" />,
      content: (
        <div className="onboarding-step-body">
          <p>
            ELY.pos is designed for busy counters where speed matters. The system is split into 5 core modules:
          </p>
          <div className="modules-mini-grid">
            <div className="mini-module-item">
              <strong>📊 Dashboard</strong>
              <span>Live daily gross, transaction volume, and top-selling produce.</span>
            </div>
            <div className="mini-module-item">
              <strong>🛒 POS Register</strong>
              <span>Tap catalog, decimal weight multiplier, and quick checkout.</span>
            </div>
            <div className="mini-module-item">
              <strong>📦 Inventory</strong>
              <span>Product management, categories, and dual per-kg/per-unit pricing.</span>
            </div>
            <div className="mini-module-item">
              <strong>📋 History</strong>
              <span>Digital customer receipts and downloadable transaction logs.</span>
            </div>
            <div className="mini-module-item">
              <strong>🚚 Delivery</strong>
              <span>1-click consolidated rider dispatch sheets with addresses.</span>
            </div>
          </div>
        </div>
      )
    },
    {
      badge: "Inventory & Pricing",
      title: "Setting Up Your Catalog",
      subtitle: "Organize items with flexible per-kg weight and per-unit pricing.",
      icon: <Package size={32} className="step-icon text-teal" />,
      content: (
        <div className="onboarding-step-body">
          <div className="onboarding-tip-card">
            <h4>💡 Dual Pricing for Produce</h4>
            <p>
              Small grocers and produce counters sell items in different ways: by scale weight (<strong>kg</strong>), 
              by count (<strong>pc</strong>), or in bundles (<strong>tali</strong>). ELY.pos lets you set the pricing unit 
              per item so cashiers never have to guess or do mental math.
            </p>
          </div>
          <div className="step-feature-list">
            <div className="feature-bullet">
              <CheckCircle2 size={16} className="bullet-icon" />
              <span>Supports <strong>kg</strong>, <strong>pc</strong>, <strong>pack</strong>, and <strong>tali</strong> (bundles).</span>
            </div>
            <div className="feature-bullet">
              <CheckCircle2 size={16} className="bullet-icon" />
              <span>Quick-edit prices or add new seasonal produce in seconds right from the counter.</span>
            </div>
          </div>
        </div>
      )
    },
    {
      badge: "Checkout",
      title: "Ringing Up Orders & Scales",
      subtitle: "Lightning-fast checkouts with fractional scale weight math.",
      icon: <Scale size={32} className="step-icon text-orange" />,
      content: (
        <div className="onboarding-step-body">
          <p>Produce is sold both by the piece and by decimal scale weights:</p>
          <div className="steps-flow-box">
            <div className="flow-step">
              <span className="flow-num">1</span>
              <span><strong>Search or Tap:</strong> Find any product quickly using category tabs or instant search.</span>
            </div>
            <div className="flow-step">
              <span className="flow-num">2</span>
              <span><strong>Enter Scale Reading:</strong> For items sold per kg, type the scale weight (e.g. <code>1.35</code> kg) and the subtotal updates automatically.</span>
            </div>
            <div className="flow-step">
              <span className="flow-num">3</span>
              <span><strong>Complete Order:</strong> Enter optional customer name or delivery address, then tap <em>Complete Transaction</em>.</span>
            </div>
          </div>
        </div>
      )
    },
    {
      badge: "Receipts & Dispatch",
      title: "Digital Receipts & Delivery",
      subtitle: "Zero paper waste with downloadable graphic receipts and rider manifests.",
      icon: <Truck size={32} className="step-icon text-green" />,
      content: (
        <div className="onboarding-step-body">
          <div className="two-cards-row">
            <div className="sub-card">
              <h4>🧾 Downloadable Receipts</h4>
              <p>In <strong>History</strong>, tap any past order to download a high-res digital PNG receipt ready to send via Viber or Messenger.</p>
            </div>
            <div className="sub-card">
              <h4>🚚 Rider Delivery Sheets</h4>
              <p>In <strong>Delivery</strong>, tick today's pending orders to generate a clean, consolidated manifest for drivers with delivery instructions.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      badge: "Guided Tour",
      title: "Take the Interactive Tour",
      subtitle: "Let us show you around the interface with live highlight tooltips.",
      icon: <Compass size={32} className="step-icon text-purple" />,
      content: (
        <div className="onboarding-step-body tour-cta-body">
          <p>
            Ready to explore? You can launch the interactive step-by-step element tour right now. 
            It will highlight the navigation, search bar, product grid, and checkout cart.
          </p>
          <div className="tour-action-box">
            <button 
              className="btn-launch-tour-cta" 
              onClick={() => {
                handleClose();
                if (onStartTour) onStartTour();
              }}
            >
              <Compass size={18} />
              <span>Start Interactive Tour Now</span>
            </button>
            <span className="tour-hint">You can re-open this guide anytime by clicking the <strong>?</strong> button in the header.</span>
          </div>
        </div>
      )
    }
  ];

  const isLast = currentStep === steps.length - 1;



  return (
    <div className="onboarding-overlay" onClick={handleClose}>
      <div className="onboarding-card" onClick={(e) => e.stopPropagation()}>
        {/* Top bar */}
        <div className="onboarding-header">
          <div className="onboarding-header-left">
            <span className="onboarding-badge">{steps[currentStep].badge}</span>
            <span className="onboarding-progress-text">Step {currentStep + 1} of {steps.length}</span>
          </div>
          <button className="onboarding-close-btn" onClick={handleClose} title="Close Guide">
            <X size={18} />
          </button>
        </div>

        {/* Step Banner */}
        <div className="onboarding-banner">
          <div className="banner-icon-col">
            {steps[currentStep].icon}
          </div>
          <div className="banner-text-col">
            <h3 className="step-title">{steps[currentStep].title}</h3>
            <p className="step-subtitle">{steps[currentStep].subtitle}</p>
          </div>
        </div>

        {/* Step Content */}
        <div className="onboarding-content-area">
          {steps[currentStep].content}
        </div>

        {/* Footer controls */}
        <div className="onboarding-footer">
          <label className="dont-show-label">
            <input 
              type="checkbox" 
              checked={dontShowAgain} 
              onChange={(e) => setDontShowAgain(e.target.checked)} 
            />
            <span>Don't show on startup</span>
          </label>

          <div className="footer-nav-buttons">
            {currentStep > 0 && (
              <button 
                className="btn-onboarding-prev" 
                onClick={() => setCurrentStep(prev => prev - 1)}
              >
                <ChevronLeft size={16} />
                <span>Back</span>
              </button>
            )}

            {!isLast ? (
              <button 
                className="btn-onboarding-next" 
                onClick={() => setCurrentStep(prev => prev + 1)}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button 
                className="btn-onboarding-finish" 
                onClick={handleClose}
              >
                <span>Got it, Let's Sell!</span>
              </button>
            )}
          </div>
        </div>

        {/* Step dots */}
        <div className="onboarding-dots">
          {steps.map((_, i) => (
            <span 
              key={i} 
              className={`dot ${i === currentStep ? "active" : ""}`}
              onClick={() => setCurrentStep(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
