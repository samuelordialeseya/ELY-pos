import React, { useState, useEffect, useRef } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import "./SetupWizard.css";

const STORE_TYPES = [
  {
    id: "produce",
    title: "Fresh Produce",
    icon: "🥬",
    desc: "Fruits, vegetables, and farm goods"
  },
  {
    id: "grocery",
    title: "General Grocery",
    icon: "🛒",
    desc: "Mixed goods, pantry items, snacks"
  },
  {
    id: "meat",
    title: "Meat & Seafood",
    icon: "🥩",
    desc: "Proteins, fresh cuts, and seafood"
  }
];

const SUGGESTIONS = ["Ely's Store", "Fresh Picks", "My Store"];

export default function SetupWizard({ isOpen, onComplete, onSkip }) {
  const [step, setStep] = useState(1);
  const [typedName, setTypedName] = useState(() => localStorage.getItem("elypos_store_name") || "");
  const [selectedType, setSelectedType] = useState(() => localStorage.getItem("elypos_store_type") || "");
  const [slideKey, setSlideKey] = useState(1);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSlideKey(1);
      const existingName = localStorage.getItem("elypos_store_name") || "";
      if (existingName && existingName !== "Fresh Express Demo") {
        setTypedName(existingName);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && step === 1 && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, step]);

  if (!isOpen) return null;

  const goToStep = (nextStep) => {
    setSlideKey(nextStep);
    setStep(nextStep);
  };

  const handleFinish = () => {
    const finalName = typedName.trim() || "My Store";
    const finalType = selectedType || "Fresh Produce";
    if (onComplete) {
      onComplete(finalName, finalType);
    }
  };

  return (
    <div className="wizard-overlay">
      <div className="wizard-card">
        <div key={slideKey} className="wizard-slide-container slide-in-right">
          {/* ─── STEP 1: STORE NAME ─── */}
          {step === 1 && (
            <div className="wizard-step-content">
              <span className="wizard-badge">Step 1 of 3</span>
              <h2 className="wizard-heading">Name Your Store</h2>
              <p className="wizard-subtext">
                What should customers and receipts call your business?
              </p>

              <div className="wizard-input-container">
                <input
                  ref={inputRef}
                  type="text"
                  className="wizard-name-input"
                  placeholder="e.g. Ely's Fresh Fruits"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  autoFocus
                />
                <div className="wizard-input-underline">
                  <div
                    className="wizard-underline-fill"
                    style={{
                      width: typedName.trim().length > 0
                        ? `${Math.min(100, Math.max(20, typedName.trim().length * 6))}%`
                        : "0%"
                    }}
                  />
                </div>
              </div>

              <div className="wizard-live-preview">
                Your store will appear as{" "}
                <strong className="preview-store-highlight">
                  {typedName.trim() || "Your Store Name"}
                </strong>{" "}
                across receipts and dashboard.
              </div>

              <div className="wizard-suggestions-box">
                <span className="wizard-suggestions-label">Quick suggestions:</span>
                <div className="wizard-chips-list">
                  {SUGGESTIONS.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      className={`wizard-chip ${typedName === sug ? "active" : ""}`}
                      onClick={() => setTypedName(sug)}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div className="wizard-cta-row">
                <button
                  type="button"
                  className="wizard-btn-primary"
                  disabled={!typedName.trim()}
                  onClick={() => goToStep(2)}
                >
                  <span>Continue</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 2: STORE TYPE ─── */}
          {step === 2 && (
            <div className="wizard-step-content">
              <span className="wizard-badge">Step 2 of 3</span>
              <h2 className="wizard-heading">What do you sell?</h2>
              <p className="wizard-subtext">
                Choose the best match to optimize units, weights, and categories.
              </p>

              <div className="wizard-types-grid">
                {STORE_TYPES.map((st) => {
                  const isSelected = selectedType === st.title;
                  return (
                    <div
                      key={st.id}
                      className={`wizard-type-card ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedType(st.title)}
                    >
                      {isSelected && (
                        <div className="type-card-badge">
                          <CheckCircle2 size={18} />
                        </div>
                      )}
                      <span className="type-card-icon">{st.icon}</span>
                      <h4 className="type-card-title">{st.title}</h4>
                      <p className="type-card-desc">{st.desc}</p>
                    </div>
                  );
                })}
              </div>

              {selectedType && (
                <div className="wizard-cta-row appear-anim">
                  <button
                    type="button"
                    className="wizard-btn-primary"
                    onClick={() => goToStep(3)}
                  >
                    <span>Continue</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 3: CELEBRATION ─── */}
          {step === 3 && (
            <div className="wizard-step-content celebration-content">
              <div className="celebration-icon-wrapper">
                <svg className="celebration-checkmark" viewBox="0 0 52 52">
                  <circle className="checkmark-circle" cx="26" cy="26" r="24" fill="none" />
                  <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                </svg>
              </div>

              <h2 className="wizard-heading celebration-heading">
                You're all set, {typedName.trim() || "Partner"}! 🎉
              </h2>
              <p className="wizard-subtext">
                Let us show you around your new POS terminal.
              </p>

              <div className="celebration-actions">
                <button
                  type="button"
                  className="wizard-btn-primary pulse-glow-btn"
                  onClick={handleFinish}
                >
                  <span>Show Me Around</span>
                  <ArrowRight size={18} />
                </button>

                <button
                  type="button"
                  className="wizard-skip-link"
                  onClick={onSkip}
                >
                  Skip tour, go to app
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Progress dots at bottom */}
        <div className="wizard-dots">
          {[1, 2, 3].map((dotIndex) => (
            <span
              key={dotIndex}
              className={`wizard-dot ${step === dotIndex ? "active" : ""}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
