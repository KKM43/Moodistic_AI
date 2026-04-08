import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";

export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle, forgotPassword } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await forgotPassword(forgotEmail);
    if (error) {
      setError(error.message);
    } else {
      setForgotSent(true);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);

      if (error) {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        });

        if (!otpError) {
          setError(
            "Looks like you signed up with Google — try using Google login 🙂",
          );
        } else {
          setError("Invalid email or password.");
        }
      }
    } else {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });

      if (!otpError) {
        setError(
          "An account already exists. Try logging in or use Google sign-in.",
        );
        setLoading(false);
        return;
      }

      const { error } = await signUp(email, password);

      if (error) {
        setError(error.message);
      } else {
        setMessage(
          "Account created! Check your email to confirm, then log in.",
        );
      }
    }

    setLoading(false);
  };

  const handleGoogle = async () => {
    setError("");
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {showForgot ? (
          <div className="forgot-wrap">
            {!forgotSent ? (
              <>
                <button
                  className="back-btn"
                  onClick={() => {
                    setShowForgot(false);
                    setError("");
                  }}
                >
                  ← Back to login
                </button>
                <div className="auth-brand">
                  <span className="brand-icon">🔑</span>
                  <h1 className="brand-name">Reset Password</h1>
                  <p className="brand-tagline">
                    Enter your email and we'll send you a reset link.
                  </p>
                </div>
                <form className="auth-form" onSubmit={handleForgot}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      className="form-input"
                      type="email"
                      placeholder="you@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                  {error && <p className="auth-error">⚠ {error}</p>}
                  <button className="auth-btn" type="submit" disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>
                </form>
              </>
            ) : (
              <div className="forgot-sent">
                <span className="forgot-icon">📬</span>
                <h2 className="brand-name">Check your email</h2>
                <p className="brand-tagline">
                  We sent a reset link to <strong>{forgotEmail}</strong>. Click
                  the link in your inbox to set a new password.
                </p>
                <button
                  className="auth-btn"
                  style={{ marginTop: "24px" }}
                  onClick={() => {
                    setShowForgot(false);
                    setForgotSent(false);
                    setForgotEmail("");
                    setError("");
                  }}
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="auth-brand">
              <img
                src="/icons/logo.png"
                alt="MindShift"
                className="brand-logo"
              />
              <h1 className="brand-name">MindShift</h1>
              <p className="brand-tagline">
                Your private space to think, feel, and refocus.
              </p>
            </div>

            <div className="auth-tabs">
              <button
                className={`auth-tab ${isLogin ? "active" : ""}`}
                onClick={() => {
                  setIsLogin(true);
                  setError("");
                  setMessage("");
                }}
              >
                Log In
              </button>
              <button
                className={`auth-tab ${!isLogin ? "active" : ""}`}
                onClick={() => {
                  setIsLogin(false);
                  setError("");
                  setMessage("");
                }}
              >
                Sign Up
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {error && <p className="auth-error">⚠ {error}</p>}
              {message && <p className="auth-success">✓ {message}</p>}

              <button className="auth-btn" type="submit" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : isLogin
                    ? "Log In"
                    : "Create Account"}
              </button>
            </form>

            {isLogin && (
              <button
                className="forgot-link"
                onClick={() => {
                  setShowForgot(true);
                  setError("");
                }}
              >
                Forgot your password?
              </button>
            )}

            <div className="auth-divider">
              <span>or</span>
            </div>

            <button className="google-btn" onClick={handleGoogle}>
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                width={20}
                height={20}
              />
              {isLogin ? "Sign in with Google" : "Sign up with Google"}
            </button>

            <p className="auth-footer">
              Your journal entries are private and encrypted. Only you can read
              them.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
