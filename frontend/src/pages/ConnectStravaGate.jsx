import { useAuth } from "../context/AuthContext.jsx";

export default function ConnectStravaGate({ error, onNavigate }) {
  const { user, logout } = useAuth();

  const handleStravaConnect = () => {
    const base = import.meta.env.VITE_API_BASE_URL || "/api";
    window.location.href = `${base}/auth/strava`;
  };

  return (
    <div className="connect-page">
      <div className="connect-card fade-up" style={{ maxWidth: 520 }}>
        <img src="/logo.png" alt="Runlytics" className="connect-logo-img" />

        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
          Welcome{user?.name ? `, ${user.name}` : ""} 👋
        </div>
        <div className="connect-sub">
          Choose how to bring in your training data.
        </div>

        {error && (
          <div style={{
            fontSize: 12, color: "#ef4444", background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8,
            padding: "8px 12px", marginBottom: 16,
          }}>
            {error === "strava_already_linked"
              ? "That Strava account is already linked to another Runlytics account."
              : "Couldn't connect Strava. Please try again."}
          </div>
        )}

        {/* Two data-source options */}
        <div className="datasource-options">
          {/* Connect Strava (OAuth) */}
          <button className="datasource-card primary" onClick={handleStravaConnect}>
            <div className="datasource-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#fc4c02">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066z"/>
                <path d="M11.691 0L8.616 6.021H3.27l8.421 16.629 2.09-4.121-5.353-10.574h3.065L15.387 0z" opacity=".55"/>
              </svg>
            </div>
            <div className="datasource-title">Connect with Strava</div>
            <div className="datasource-desc">
              Live OAuth sync with real-time updates whenever you finish a workout.
            </div>
            <div className="datasource-cta">Recommended →</div>
          </button>

          {/* Import export */}
          <button className="datasource-card" onClick={() => onNavigate?.("import")}>
            <div className="datasource-icon import">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div className="datasource-title">Import Strava Export</div>
            <div className="datasource-desc">
              Upload your Strava archive ZIP. Processed in your browser — no OAuth needed.
            </div>
            <div className="datasource-cta">Upload file →</div>
          </button>
        </div>

        <p style={{ marginTop: 18, fontSize: 11, color: "var(--text3)", lineHeight: 1.6 }}>
          Read-only access only. We never post on your behalf.
        </p>

        <button
          onClick={logout}
          style={{
            marginTop: 14, background: "none", border: "none",
            color: "var(--text3)", cursor: "pointer", fontSize: 12, fontWeight: 600,
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
