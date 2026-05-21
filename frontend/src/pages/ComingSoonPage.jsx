import Footer from "../components/ui/Footer.jsx";

export default function ComingSoonPage({ onNavigate }) {
  const goImport = (e) => { e?.preventDefault(); onNavigate?.("import"); };
  const goHome   = (e) => { e?.preventDefault(); onNavigate?.("home"); };
  const nav = (page) => (e) => { e.preventDefault(); onNavigate?.(page); };

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <a href="/" onClick={goHome} style={{ display: "flex", alignItems: "center" }}>
          <img src="/logo.png" alt="Runlytics" className="landing-nav-logo" />
        </a>
        <div className="landing-nav-links">
          <a href="/privacy" className="landing-nav-link" onClick={nav("privacy")}>Privacy</a>
          <a href="/terms"   className="landing-nav-link" onClick={nav("terms")}>Terms</a>
          <a href="/contact" className="landing-nav-link" onClick={nav("contact")}>Contact</a>
        </div>
      </nav>

      <div className="comingsoon-page">
        {/* Glow logo background */}
        <div className="hero-glow-wrap" style={{ opacity: 0.5 }}>
          <img src="/logo-glow.png" alt="" className="hero-glow-img" aria-hidden="true" />
        </div>

        <div className="comingsoon-card fade-up">
          {/* Strava icon */}
          <div className="comingsoon-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="#fc4c02">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066z"/>
              <path d="M11.691 0L8.616 6.021H3.27l8.421 16.629 2.09-4.121-5.353-10.574h3.065L15.387 0z" opacity=".55"/>
            </svg>
          </div>

          <div className="comingsoon-badge">Coming Soon</div>
          <h1 className="comingsoon-title">Strava OAuth</h1>
          <p className="comingsoon-sub">
            Direct Strava connection is pending official API approval from Strava. We've submitted
            our application and are waiting to hear back — this can take a few weeks.
          </p>

          <div className="comingsoon-timeline">
            <div className="timeline-item done">
              <span className="timeline-dot">✓</span>
              <span>Strava API integration built &amp; tested</span>
            </div>
            <div className="timeline-item done">
              <span className="timeline-dot">✓</span>
              <span>API approval application submitted</span>
            </div>
            <div className="timeline-item active">
              <span className="timeline-dot pulse" />
              <span>Awaiting Strava review</span>
            </div>
            <div className="timeline-item">
              <span className="timeline-dot" />
              <span>Live for everyone</span>
            </div>
          </div>

          <div className="comingsoon-divider">
            <span>In the meantime</span>
          </div>

          <div className="comingsoon-alt">
            <div className="comingsoon-alt-icon">📁</div>
            <div className="comingsoon-alt-body">
              <div className="comingsoon-alt-title">Import your Strava data now</div>
              <p className="comingsoon-alt-desc">
                Download your full activity archive from Strava and import it into Runlytics instantly.
                Get all the same analytics, AI coaching, and performance insights — no OAuth needed.
              </p>
              <button className="btn-primary" onClick={goImport}>
                Import Strava Export
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>

          {/* Developer-only login — not visible in normal use */}
          <a
            href={`${import.meta.env.VITE_API_BASE_URL || "/api"}/auth/strava`}
            style={{ fontSize: 10, color: "var(--text3)", opacity: 0.35, marginTop: 8, textDecoration: "none" }}
            title="Developer access"
          >
            · · ·
          </a>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
