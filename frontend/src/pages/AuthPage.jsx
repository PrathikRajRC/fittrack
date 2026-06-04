import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { authApi } from "../services/api.js";

export default function AuthPage({ onNavigate, initialError, initialMode = "login" }) {
  const { login, register } = useAuth();
  const [mode,    setMode]    = useState(initialMode); // "login" | "register"
  const [email,   setEmail]   = useState("");
  const [password, setPassword] = useState("");
  const [name,    setName]    = useState("");
  const [error,   setError]   = useState(initialError || "");
  const [busy,    setBusy]    = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    authApi.config().then(({ data }) => setGoogleEnabled(!!data.googleEnabled)).catch(() => {});
  }, []);

  const goGoogle = () => {
    const base = import.meta.env.VITE_API_BASE_URL || "/api";
    window.location.href = `${base}/auth/google`;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      if (mode === "register") {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      // Auth state updates flow through AuthContext; App re-renders to the next gate.
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (m) => { setMode(m); setError(""); };

  return (
    <div className="connect-page">
      <div className="connect-card fade-up" style={{ maxWidth: 400 }}>
        <img src="/logo.png" alt="Runlytics" className="connect-logo-img" />

        {/* Tabs */}
        <div style={{
          display: "flex", background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 10, padding: 3, marginBottom: 22, gap: 2,
        }}>
          {[["login", "Sign in"], ["register", "Create account"]].map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              style={{
                flex: 1,
                background: mode === m ? "var(--accent)" : "none",
                color: mode === m ? "#0d1320" : "var(--text3)",
                border: "none", borderRadius: 7, padding: "8px 10px",
                fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
              }}
            >{label}</button>
          ))}
        </div>

        {/* Google sign-in */}
        {googleEnabled && (
          <>
            <button type="button" onClick={goGoogle} className="google-btn">
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>

            <div className="auth-divider"><span>or</span></div>
          </>
        )}

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
          {mode === "register" && (
            <Field label="Name (optional)">
              <input
                className="auth-input" type="text" value={name} autoComplete="name"
                onChange={(e) => setName(e.target.value)} placeholder="Your name"
              />
            </Field>
          )}

          <Field label="Email">
            <input
              className="auth-input" type="email" value={email} required autoComplete="email"
              onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
            />
          </Field>

          <Field label="Password">
            <input
              className="auth-input" type="password" value={password} required
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
            />
          </Field>

          {error && (
            <div style={{
              fontSize: 12, color: "#ef4444", background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px",
            }}>{error}</div>
          )}

          <button
            type="submit" className="btn-primary" disabled={busy}
            style={{ width: "100%", justifyContent: "center", marginTop: 4, opacity: busy ? 0.6 : 1 }}
          >
            {busy ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"}
          </button>
        </form>

        <p style={{ marginTop: 18, fontSize: 12, color: "var(--text3)" }}>
          {mode === "login" ? (
            <>New to Runlytics?{" "}
              <button onClick={() => switchMode("register")} style={linkBtn}>Create an account</button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button onClick={() => switchMode("login")} style={linkBtn}>Sign in</button>
            </>
          )}
        </p>

        <p style={{ marginTop: 14, fontSize: 11, color: "var(--text3)", lineHeight: 1.6 }}>
          You'll connect your Strava account after signing in to unlock analytics.
        </p>

        {onNavigate && (
          <button onClick={() => onNavigate("home")} style={{ ...linkBtn, marginTop: 14, fontSize: 11 }}>
            ← Back to home
          </button>
        )}
      </div>

      <style>{`
        .auth-input {
          width: 100%; box-sizing: border-box;
          background: var(--surface); border: 1px solid var(--border2);
          border-radius: 10px; padding: 11px 14px;
          font-size: 14px; color: var(--text);
          outline: none; font-family: var(--font-body);
          transition: border-color 0.15s;
        }
        .auth-input:focus { border-color: var(--accent); }

        .google-btn {
          width: 100%; box-sizing: border-box;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          background: #fff; color: #1f1f1f;
          border: 1px solid var(--border2); border-radius: 10px;
          padding: 11px 14px; font-size: 14px; font-weight: 600;
          cursor: pointer; font-family: var(--font-body);
          transition: filter 0.15s, box-shadow 0.15s;
          touch-action: manipulation; -webkit-tap-highlight-color: transparent;
        }
        .google-btn:hover { filter: brightness(0.97); box-shadow: 0 2px 10px rgba(0,0,0,0.25); }

        .auth-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 16px 0; color: var(--text3); font-size: 12px;
        }
        .auth-divider::before, .auth-divider::after {
          content: ""; flex: 1; height: 1px; background: var(--border);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.6 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const linkBtn = {
  background: "none", border: "none", color: "var(--accent)",
  cursor: "pointer", fontWeight: 600, padding: 0, fontSize: "inherit",
};
