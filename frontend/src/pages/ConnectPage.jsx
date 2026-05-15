export default function ConnectPage() {
  const handleStravaConnect = () => {
    window.location.href = "/api/auth/strava";
  };

  return (
    <div className="connect-page">
      <div className="connect-card fade-up">
        <div className="connect-logo">⚡</div>
        <div className="connect-title">FitTrack</div>
        <div className="connect-sub">
          Your personal fitness intelligence platform. Connect your training data
          and unlock deep performance insights.
        </div>

        <button
          className="btn-primary"
          onClick={handleStravaConnect}
          style={{ width: "100%", justifyContent: "center" }}
        >
          🔗 Connect with Strava
        </button>

        <div style={{ marginTop: 24, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <span className="tag">🔒 Secure OAuth</span>
          <span className="tag">📊 Deep Analytics</span>
          <span className="tag">🧠 Smart Insights</span>
        </div>

        <p style={{ marginTop: 20, fontSize: 11, color: "var(--text3)", lineHeight: 1.6 }}>
          FitTrack only requests read-only access to your Strava data.
          We never post on your behalf.
        </p>
      </div>
    </div>
  );
}
