import React, { useState } from "react";
import "./AuthPage.css";
import { useAuth } from "../context/AuthContext";
import { 
  Lock, 
  Mail, 
  User, 
  Sparkles, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2,
  Eye,
  EyeOff
} from "lucide-react";

export default function AuthPage({ onBackToLanding, onSuccessLogin }) {
  const { 
    loginWithEmail, 
    registerWithEmail, 
    loginWithGoogle, 
    enterDemoMode,
    rememberedEmail
  } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState(rememberedEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!rememberedEmail);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    if (isSignUp) {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const storeNameClean = displayName?.trim() || "My Store";
        localStorage.setItem("elypos_store_name", storeNameClean);
        await registerWithEmail(email, password, storeNameClean);
        setSuccessMsg("Account created successfully!");
      } else {
        await loginWithEmail(email, password, rememberMe);
      }
      if (onSuccessLogin) onSuccessLogin();
    } catch (err) {
      console.error("Auth error:", err);
      let message = "Authentication failed. Please try again.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        message = "Invalid email or password.";
      } else if (err.code === "auth/email-already-in-use") {
        message = "This email is already registered. Try signing in.";
      } else if (err.code === "auth/weak-password") {
        message = "Password is too weak. Must be at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (err.code === "auth/too-many-requests") {
        message = "Too many failed attempts. Please wait a moment and try again.";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      if (onSuccessLogin) onSuccessLogin();
    } catch (err) {
      console.error("Google sign-in error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Google sign-in was cancelled or failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = () => {
    enterDemoMode();
    if (onSuccessLogin) onSuccessLogin();
  };

  const handleToggleSignUp = (signUpMode) => {
    setIsSignUp(signUpMode);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setDisplayName("");
    setError("");
    setSuccessMsg("");
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        {/* Back link */}
        <button className="auth-back-btn" onClick={onBackToLanding}>
          <ArrowLeft size={16} />
          <span>Back to Landing</span>
        </button>

        {/* Brand Header */}
        <div className="auth-header">
          <img src="/ely-logo.png" alt="ELY" className="auth-logo-img" />
          <h2 className="auth-title">
            {isSignUp ? "Create Your Account" : "Welcome to ELY.pos"}
          </h2>
          <p className="auth-subtitle">
            {isSignUp 
              ? "Set up your small-retail produce POS and inventory" 
              : "Sign in to manage sales, catalog, and deliveries"}
          </p>
        </div>

        {/* Guest Demo Banner - GitHub Friendly */}
        <div className="auth-demo-banner">
          <div className="demo-banner-text">
            <strong>Testing from GitHub?</strong>
            <span>Explore the POS in an isolated sandbox with zero signup.</span>
          </div>
          <button className="auth-btn-quick-demo" onClick={handleDemoAccess} type="button">
            <Sparkles size={15} />
            <span>Launch Demo</span>
          </button>
        </div>

        {/* Tab Selector */}
        <div className="auth-tabs">
          <button 
            type="button"
            className={`auth-tab ${!isSignUp ? "active" : ""}`} 
            onClick={() => handleToggleSignUp(false)}
          >
            Sign In
          </button>
          <button 
            type="button"
            className={`auth-tab ${isSignUp ? "active" : ""}`} 
            onClick={() => handleToggleSignUp(true)}
          >
            Create Account
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="auth-alert error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="auth-alert success">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleEmailAuth} className="auth-form">
          {isSignUp && (
            <div className="auth-field">
              <label className="auth-label">Store / Cashier Name</label>
              <div className="auth-input-wrapper">
                <User size={18} className="input-icon" />
                <input 
                  type="text" 
                  className="auth-input" 
                  placeholder="e.g. Ely's Fresh Fruits" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label">Email Address</label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="input-icon" />
              <input 
                type="email" 
                className="auth-input" 
                placeholder="youremail@example.com" 
                required
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="input-icon" />
              <input 
                type={showPassword ? "text" : "password"} 
                className="auth-input" 
                placeholder="••••••••" 
                required
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button" 
                className="btn-toggle-eye" 
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div className="auth-field">
              <label className="auth-label">Confirm Password</label>
              <div className="auth-input-wrapper">
                <Lock size={18} className="input-icon" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="auth-input" 
                  placeholder="••••••••" 
                  required
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Remember Me — only on Sign In */}
          {!isSignUp && (
            <div className="auth-remember-row">
              <label className="auth-remember-label">
                <input
                  type="checkbox"
                  className="auth-remember-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me on this device</span>
              </label>
            </div>
          )}

          <button 
            type="submit" 
            className="auth-submit-btn auth-btn-primary" 
            disabled={loading}
          >
            {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        {/* Social Auth */}
        <div className="auth-social-group">
          <button 
            type="button" 
            className="auth-btn-google" 
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>

        {/* Switch Mode Footer */}
        <div className="auth-switch-mode">
          {isSignUp ? (
            <span>
              Already have an account?{" "}
              <button 
                type="button" 
                className="auth-switch-btn" 
                onClick={() => handleToggleSignUp(false)}
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account yet?{" "}
              <button 
                type="button" 
                className="auth-switch-btn" 
                onClick={() => handleToggleSignUp(true)}
              >
                Create Account
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
