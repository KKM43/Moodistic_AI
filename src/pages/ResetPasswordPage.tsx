import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event, "Session:", session);
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Current session:", session);
      if (session) setReady(true);
    });

    const timeout = setTimeout(() => {
      setExpired(true);
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(password);
    if (error) {
      setError(error.message);
    } else {
      navigate("/journal");
    }
    setLoading(false);
  };

  if (expired && !ready) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="brand-icon">⚠️</span>
            <h1 className="brand-name">Link expired</h1>
            <p className="brand-tagline">
              This reset link has expired or already been used. Please request a
              new one.
            </p>
          </div>
          <button
            className="auth-btn"
            style={{ marginTop: "24px" }}
            onClick={() => navigate("/auth")}
          >
            Request New Link
          </button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="brand-icon">⏳</span>
            <h1 className="brand-name">Verifying link...</h1>
            <p className="brand-tagline">Just a second.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-icon">🔐</span>
          <h1 className="brand-name">New Password</h1>
          <p className="brand-tagline">
            Choose a strong password you'll remember.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleReset}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Same password again"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          {error && <p className="auth-error">⚠ {error}</p>}

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Updating..." : "Set New Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
