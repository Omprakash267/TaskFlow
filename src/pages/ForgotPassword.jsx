import { useState } from "react";
import { Link } from "react-router-dom";
import { resetPassword } from "../services/authService";
import { getAuthErrorMessage, isValidEmail, isValidPassword } from "../utils/helpers";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!isValidPassword(newPassword)) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(trimmedEmail, newPassword);
      setSuccess(true);
    } catch (err) {
      console.error("Password reset error:", err);
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo" style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🔑</div>
          <h1>Reset Password</h1>
          <p>Local device account recovery</p>
        </div>

        <div className="offline-badge" style={{ background: "var(--primary-bg)", padding: "10px 14px", borderRadius: "var(--radius-md)", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
          💡 <strong>Local Storage Mode:</strong> Since this app runs 100% offline on your device, you can verify your registered email and set a new password directly.
        </div>

        {success ? (
          <div className="auth-success" style={{ textAlign: "center" }}>
            <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--success)", marginBottom: "8px" }}>
              ✅ Password Reset Successfully!
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "16px" }}>
              Your password has been updated in local storage. You can now sign in with your new password.
            </p>
            <Link
              to="/login"
              className="btn btn-primary btn-full"
              style={{ display: "inline-flex", textDecoration: "none" }}
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="reset-email">Registered Email</label>
              <input
                id="reset-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reset-new-password">New Password</label>
              <input
                id="reset-new-password"
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error) setError("");
                }}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reset-confirm-password">Confirm New Password</label>
              <input
                id="reset-confirm-password"
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError("");
                }}
                required
                autoComplete="new-password"
              />
            </div>

            {error && <p className="form-error" role="alert">{error}</p>}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <Link to="/login" className="auth-link">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

