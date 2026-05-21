import Footer from "../components/ui/Footer.jsx";

const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="13" width="4.5" height="8" rx="1.2"/>
        <rect x="9.75" y="8" width="4.5" height="13" rx="1.2"/>
        <rect x="16.5" y="3" width="4.5" height="18" rx="1.2"/>
      </svg>
    ),
    title: "Analytics Dashboard",
    desc: "Weekly trends, pace analysis, distance charts, and training consistency — all in one view.",
    color: "#00e5ff",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a7 7 0 0 1 5.27 11.63A3 3 0 0 0 16 16v1H8v-1a3 3 0 0 0-1.27-2.37A7 7 0 0 1 12 2z"/>
        <path d="M9 19h6m-5 2h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      </svg>
    ),
    title: "Performance Intelligence",
    desc: "VO2 Max estimation, training load (TRIMP), injury risk alerts, and HR zone distribution.",
    color: "#f97316",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2 13.5 6.5 18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"/>
        <path d="M19 15l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" opacity="0.65"/>
      </svg>
    ),
    title: "AI Fitness Coach",
    desc: "Ask your personal coach anything. Powered by Claude AI, trained on your actual Strava data.",
    color: "#b87aff",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0"/>
        <path d="M12 8v4l3 3"/>
      </svg>
    ),
    title: "Route Visualization",
    desc: "GPS route maps, elevation profiles, lap splits, and animated route replay for every workout.",
    color: "#4ade80",
  },
];

export default function LandingPage({ onNavigate }) {
  const nav = (page) => (e) => { e.preventDefault(); onNavigate?.(page); };
  const goImport      = () => onNavigate?.("import");
  const goComingSoon  = () => onNavigate?.("comingsoon");

  return (
    <div className="landing-page">
      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <img src="/logo.png" alt="Runlytics" className="landing-nav-logo" />
        <div className="landing-nav-links">
          <a href="/privacy" className="landing-nav-link" onClick={nav("privacy")}>Privacy</a>
          <a href="/terms"   className="landing-nav-link" onClick={nav("terms")}>Terms</a>
          <a href="/contact" className="landing-nav-link" onClick={nav("contact")}>Contact</a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="hero-glow-wrap">
          <img src="/logo-glow.png" alt="" className="hero-glow-img" aria-hidden="true" />
        </div>

        <div className="hero-content fade-up">
          <div className="hero-badge">Strava-Powered Analytics</div>
          <h1 className="hero-title">
            Train Smarter with<br />
            <span className="hero-accent">Runlytics</span>
          </h1>
          <p className="hero-sub">
            Transform your workout data into actionable performance insights. Analytics dashboards,
            AI coaching, route visualization, and training intelligence — all in one place.
          </p>

          {/* Two-option connect cards */}
          <div className="connect-options">
            {/* Option 1: Import (available now) */}
            <button className="connect-option-card primary" onClick={goImport}>
              <div className="connect-option-top">
                <div className="connect-option-icon import-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <span className="connect-available-badge">Available Now</span>
              </div>
              <div className="connect-option-title">Import Strava Export</div>
              <div className="connect-option-desc">
                Download your full Strava archive and import instantly. No OAuth required.
              </div>
              <div className="connect-option-cta">Get started →</div>
            </button>

            {/* Option 2: Connect Strava (coming soon for public) */}
            <button className="connect-option-card" onClick={goComingSoon}>
              <div className="connect-option-top">
                <div className="connect-option-icon strava-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="#fc4c02">
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066z"/>
                    <path d="M11.691 0L8.616 6.021H3.27l8.421 16.629 2.09-4.121-5.353-10.574h3.065L15.387 0z" opacity=".55"/>
                  </svg>
                </div>
                <span className="connect-soon-badge">Coming Soon</span>
              </div>
              <div className="connect-option-title">Connect with Strava</div>
              <div className="connect-option-desc">
                Direct OAuth sync — real-time activity updates. Pending API approval.
              </div>
              <div className="connect-option-cta" style={{ color: "var(--text3)" }}>Learn more →</div>
            </button>
          </div>

          <div className="hero-tags">
            <span className="tag">🔒 Read-only access</span>
            <span className="tag">⚡ No data sold</span>
            <span className="tag">🗑️ Delete anytime</span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="landing-features">
        <div className="landing-section-label">What you get</div>
        <h2 className="landing-section-title">Everything your training data deserves</h2>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon" style={{ color: f.color, background: `${f.color}15` }}>
                {f.icon}
              </div>
              <h3 className="feature-title" style={{ color: f.color }}>{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Strava attribution ── */}
      <section className="landing-strava">
        <div className="strava-badge">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#fc4c02"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066z"/><path d="M11.691 0L8.616 6.021H3.27l8.421 16.629 2.09-4.121-5.353-10.574h3.065L15.387 0z" opacity=".6"/></svg>
          <span>Powered by Strava API</span>
        </div>
        <p className="strava-note">
          Runlytics uses the official Strava API with read-only access. We never post, modify, or delete your Strava activities.
          Your data stays yours.
        </p>
        <button className="btn-primary" onClick={goImport} style={{ marginTop: 24 }}>
          Get Started Free
        </button>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
