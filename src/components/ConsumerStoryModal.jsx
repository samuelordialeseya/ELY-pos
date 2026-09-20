import React, { useState } from "react";
import "./ConsumerStoryModal.css";
import { 
  Store, 
  Package, 
  ShoppingCart, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Scale, 
  X, 
  CheckCircle2, 
  BadgePercent,
  Plus
} from "lucide-react";

export default function ConsumerStoryModal({ 
  isOpen, 
  onClose, 
  currentStoreName, 
  onUpdateStoreName, 
  onNavigateView,
  onAddSampleProduct,
  onOpenAuth 
}) {
  const [step, setStep] = useState(1); // 1: Name Store, 2: Teach Inventory, 3: Teach Checkout, 4: Complete
  const [storeInput, setStoreInput] = useState(currentStoreName || "My Produce Market");
  const [storeType, setStoreType] = useState("produce");
  const [sampleAdded, setSampleAdded] = useState(false);

  if (!isOpen) return null;

  const quickStoreNames = [
    { name: "Sunshine Fresh Produce", type: "produce" },
    { name: "Baguio Green Market", type: "produce" },
    { name: "Nanay's Corner Store", type: "grocery" },
    { name: "Davao Fruit & Veggie Hub", type: "produce" }
  ];

  const handleSaveStoreName = (e) => {
    if (e) e.preventDefault();
    const finalName = storeInput.trim() || "My Produce Market";
    onUpdateStoreName(finalName, storeType);
    if (onNavigateView) onNavigateView("inventory");
    setStep(2);
  };

  const handleProceedToCheckout = () => {
    if (onNavigateView) onNavigateView("pos");
    setStep(3);
  };

  const handleFinishStory = () => {
    setStep(4);
  };

  const handleAddSample = () => {
    if (onAddSampleProduct) {
      onAddSampleProduct({
        name: "Cavendish Bananas (Sweet)",
        price: 85,
        unit: "kg",
        category: "Fruits"
      });
      setSampleAdded(true);
    }
  };

  return (
    <div className={`consumer-story-overlay ${step === 2 || step === 3 ? "docked-mode" : ""}`}>
      <div className={`consumer-story-card ${step === 2 || step === 3 ? "docked-card" : ""}`}>
        {/* Step Progress Tracker */}
        <div className="story-progress-bar">
          <div 
            className="story-progress-fill" 
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>

        <div className="story-card-header">
          <div className="story-step-badge">
            <Sparkles size={14} />
            <span>Chapter {step} of 3 • Store Setup Story</span>
          </div>
          <button className="story-close-btn" onClick={onClose} title="Skip Story / Explore Freely">
            <X size={16} />
          </button>
        </div>

        {/* ─── CHAPTER 1: NAME YOUR STORE ────────────────────────────── */}
        {step === 1 && (
          <div className="story-step-content">
            <div className="story-hero-icon bg-blue">
              <Store size={32} />
            </div>
            <h2 className="story-title">What is your store called?</h2>
            <p className="story-desc">
              Let's personalize your iPad POS register. Enter your shop's name to instantly rebrand 
              the register, header greeting, and customer receipts.
            </p>

            <form onSubmit={handleSaveStoreName} className="story-form">
              <div className="story-input-group">
                <label className="story-label">Store / Business Name</label>
                <input 
                  type="text" 
                  className="story-text-input" 
                  value={storeInput}
                  onChange={(e) => setStoreInput(e.target.value)}
                  placeholder="e.g. Golden Harvest Market"
                  autoFocus
                  required
                />
              </div>

              <div className="story-suggestions">
                <span className="suggestions-label">Quick Ideas:</span>
                <div className="suggestions-chips">
                  {quickStoreNames.map((s, idx) => (
                    <button 
                      key={idx} 
                      type="button" 
                      className={`suggestion-chip ${storeInput === s.name ? "active" : ""}`}
                      onClick={() => {
                        setStoreInput(s.name);
                        setStoreType(s.type);
                      }}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="story-type-selector">
                <label className="story-label">Store Category</label>
                <div className="type-buttons-grid">
                  <button 
                    type="button" 
                    className={`type-btn ${storeType === 'produce' ? 'selected' : ''}`}
                    onClick={() => setStoreType('produce')}
                  >
                    <span>🍏 Fruits & Vegetables</span>
                  </button>
                  <button 
                    type="button" 
                    className={`type-btn ${storeType === 'grocery' ? 'selected' : ''}`}
                    onClick={() => setStoreType('grocery')}
                  >
                    <span>🏪 Grocery / Sari-Sari</span>
                  </button>
                  <button 
                    type="button" 
                    className={`type-btn ${storeType === 'meat' ? 'selected' : ''}`}
                    onClick={() => setStoreType('meat')}
                  >
                    <span>🥩 Meat & Wet Market</span>
                  </button>
                </div>
              </div>

              <button type="submit" className="story-cta-btn primary">
                <span>Save Name & Learn Inventory</span>
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        )}

        {/* ─── CHAPTER 2: TEACH INVENTORY & DUAL PRICING ───────────────── */}
        {step === 2 && (
          <div className="story-step-content">
            <div className="story-hero-icon bg-teal">
              <Package size={28} />
            </div>
            <h2 className="story-title">Chapter 2: Master Your Catalog</h2>
            <p className="story-desc">
              Produce counters are unique: some items sell by <strong>scale weight (kg)</strong>, 
              while others sell <strong>per piece (pc)</strong> or in <strong>bundles (tali)</strong>.
            </p>

            <div className="story-feature-box">
              <div className="feature-item">
                <Scale size={20} className="text-teal" />
                <div>
                  <strong>Weight Items (per kg):</strong>
                  <span>e.g., Avocado Davao, Carrots, Onions. Sold with scale readings.</span>
                </div>
              </div>
              <div className="feature-item">
                <BadgePercent size={20} className="text-blue" />
                <div>
                  <strong>Unit Items (per pc / tali):</strong>
                  <span>e.g., Fuji Apple (₱35/pc) or Kang-kong (₱25/bundle). Counted by integer.</span>
                </div>
              </div>
            </div>

            <div className="story-action-callout">
              <div className="callout-info">
                <strong>Try adding a seasonal item:</strong>
                <span>Click below to see how fast items appear in your live inventory.</span>
              </div>
              <button 
                type="button" 
                className={`btn-add-sample ${sampleAdded ? "added" : ""}`}
                onClick={handleAddSample}
                disabled={sampleAdded}
              >
                {sampleAdded ? <Check size={16} /> : <Plus size={16} />}
                <span>{sampleAdded ? "Added Cavendish Bananas!" : "+ Add Cavendish Bananas (₱85/kg)"}</span>
              </button>
            </div>

            <div className="story-button-row">
              <button 
                type="button" 
                className="story-cta-btn secondary"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button 
                type="button" 
                className="story-cta-btn primary"
                onClick={handleProceedToCheckout}
              >
                <span>Next: Learn Checkout</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ─── CHAPTER 3: TEACH CHECKOUT & SCALE MULTIPLIER ────────────── */}
        {step === 3 && (
          <div className="story-step-content">
            <div className="story-hero-icon bg-orange">
              <ShoppingCart size={28} />
            </div>
            <h2 className="story-title">Chapter 3: Touch-Fast Counter Checkout</h2>
            <p className="story-desc">
              Here is how a cashier rings up orders on the iPad counter screen with zero mental math:
            </p>

            <div className="story-steps-list">
              <div className="story-step-item">
                <span className="step-num">1</span>
                <div>
                  <strong>Tap an Item:</strong>
                  <span>Select any fruit or vegetable card on the screen.</span>
                </div>
              </div>

              <div className="story-step-item">
                <span className="step-num">2</span>
                <div>
                  <strong>Enter Scale Reading (kg):</strong>
                  <span>
                    Type the weight from your weighing scale (e.g. <code>1.45</code> kg). 
                    The total calculates immediately to the exact centavo.
                  </span>
                </div>
              </div>

              <div className="story-step-item">
                <span className="step-num">3</span>
                <div>
                  <strong>Complete & Digital Receipt:</strong>
                  <span>
                    Tap <em>Complete Transaction</em> to record the sale and generate a 
                    high-res PNG receipt ready to share or print.
                  </span>
                </div>
              </div>
            </div>

            <div className="story-button-row">
              <button 
                type="button" 
                className="story-cta-btn secondary"
                onClick={() => {
                  if (onNavigateView) onNavigateView("inventory");
                  setStep(2);
                }}
              >
                Back
              </button>
              <button 
                type="button" 
                className="story-cta-btn primary"
                onClick={handleFinishStory}
              >
                <span>Finish Setup & Explore Register</span>
                <CheckCircle2 size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ─── CHAPTER 4: CELEBRATION & READY ─────────────────────────── */}
        {step === 4 && (
          <div className="story-step-content text-center">
            <div className="story-hero-icon bg-green pulse-anim">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="story-title">🎉 {storeInput} is Ready!</h2>
            <p className="story-desc">
              You've mastered your catalog, learned dual pricing, and seen how fractional scale checkouts work.
            </p>

            <div className="completion-summary-card">
              <div className="summary-row">
                <span className="summary-label">Active Store:</span>
                <strong className="summary-value">{storeInput}</strong>
              </div>
              <div className="summary-row">
                <span className="summary-label">Operating Mode:</span>
                <span className="summary-pill">⚡ Personalized Interactive Sandbox</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Data Safety:</span>
                <span className="summary-safe">100% Isolated (0 writes to live store)</span>
              </div>
            </div>

            <div className="completion-cta-group">
              <button 
                type="button" 
                className="story-cta-btn primary" 
                onClick={onClose}
              >
                <span>Start Ringing Up Orders</span>
                <ArrowRight size={18} />
              </button>

              {onOpenAuth && (
                <button 
                  type="button" 
                  className="story-cta-btn ghost"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                >
                  <span>Create Cloud Account to Save Store Online</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
