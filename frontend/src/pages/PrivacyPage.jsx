import Footer from "../components/ui/Footer.jsx";

function LegalShell({ title, children, onNavigate }) {
  const goHome = (e) => { e?.preventDefault(); onNavigate?.("home"); };

  return (
    <div className="legal-page">
      <nav className="landing-nav">
        <a href="/" onClick={goHome} style={{ display: "flex", alignItems: "center" }}>
          <img src="/logo.png" alt="Runlytics" className="landing-nav-logo" />
        </a>
        <div className="landing-nav-links">
          <a href="/privacy" className="landing-nav-link" onClick={(e) => { e.preventDefault(); onNavigate?.("privacy"); }}>Privacy</a>
          <a href="/terms"   className="landing-nav-link" onClick={(e) => { e.preventDefault(); onNavigate?.("terms"); }}>Terms</a>
          <a href="/contact" className="landing-nav-link" onClick={(e) => { e.preventDefault(); onNavigate?.("contact"); }}>Contact</a>
        </div>
      </nav>

      <div className="legal-content">
        {/* Back button */}
        <button className="legal-back-btn" onClick={goHome}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5m7-7-7 7 7 7"/>
          </svg>
          Back to Runlytics
        </button>

        <h1 className="legal-title">{title}</h1>
        <p className="legal-updated">Last updated: May 2026</p>
        {children}
      </div>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}

export { LegalShell };

export default function PrivacyPage({ onNavigate }) {
  return (
    <LegalShell title="Privacy Policy" onNavigate={onNavigate}>

      <section className="legal-section">
        <h2>1. Overview</h2>
        <p>
          Runlytics ("we", "us", "our") is a personal fitness analytics platform that connects to Strava
          to provide athletes with performance insights and training intelligence. This Privacy Policy
          explains what data we collect, how we use it, and your rights regarding your personal information.
        </p>
        <p>
          By using Runlytics, you agree to the data practices described in this policy. If you do not
          agree, please do not use the service.
        </p>
      </section>

      <section className="legal-section">
        <h2>2. Data We Collect</h2>
        <p>We collect the following data when you connect your Strava account:</p>

        <h3>Strava Athlete Profile</h3>
        <ul>
          <li>First name and last name</li>
          <li>Profile photo (URL from Strava)</li>
          <li>City, country, and gender (if provided to Strava)</li>
          <li>Strava athlete ID</li>
          <li>Account creation date on Strava</li>
        </ul>

        <h3>Workout / Activity Data</h3>
        <ul>
          <li>Activity names, types, and timestamps</li>
          <li>Distance, duration, and elevation data</li>
          <li>Average and max heart rate</li>
          <li>Average pace, speed, and cadence</li>
          <li>Lap and split data</li>
          <li>Gear/equipment associated with activities</li>
        </ul>

        <h3>Route and GPS Data</h3>
        <ul>
          <li>Encoded polyline map routes for route visualization</li>
          <li>GPS stream data for elevation profiles and interactive maps</li>
        </ul>

        <h3>OAuth Tokens</h3>
        <ul>
          <li>Strava OAuth access token and refresh token (stored encrypted, used only to fetch your data)</li>
        </ul>

        <h3>What We Do NOT Collect</h3>
        <ul>
          <li>We do not collect passwords</li>
          <li>We do not collect payment information</li>
          <li>We do not use advertising tracking or analytics SDKs</li>
          <li>We do not access private Strava activities or activities you have set to "Followers only"</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>3. How We Use Your Data</h2>
        <p>Your data is used exclusively to provide the Runlytics service to you:</p>
        <ul>
          <li><strong>Analytics dashboards</strong> — weekly/monthly training trends, pace charts, distance summaries</li>
          <li><strong>Performance intelligence</strong> — VO2 Max estimation, training load scoring, injury risk detection, HR zone analysis</li>
          <li><strong>AI Fitness Coach</strong> — your activity data is sent to the Claude AI API (Anthropic) to generate personalised coaching responses. See Section 6 for details.</li>
          <li><strong>Route visualization</strong> — GPS data is used to render interactive maps in your browser</li>
          <li><strong>Goals tracking</strong> — comparing your target goals against real Strava progress</li>
        </ul>
        <p>
          We do not use your data for advertising, profiling, or any purpose beyond providing the service directly to you.
        </p>
      </section>

      <section className="legal-section">
        <h2>4. Data Storage and Security</h2>
        <p>
          Your Strava athlete profile, activity data, and OAuth tokens are stored in a secure PostgreSQL
          database hosted on Render (render.com). Data is stored to avoid re-fetching from Strava on
          every page load and to enable performance analytics.
        </p>
        <ul>
          <li>OAuth tokens are stored server-side and never exposed to the browser</li>
          <li>All data transmission occurs over HTTPS (TLS)</li>
          <li>Session cookies are marked <code>HttpOnly</code>, <code>Secure</code>, and <code>SameSite=None</code></li>
          <li>We apply industry-standard security headers (Helmet.js) and rate limiting</li>
        </ul>
        <p>
          While we take reasonable measures to protect your data, no internet transmission or storage
          system is 100% secure. Use of this service is at your own risk.
        </p>
      </section>

      <section className="legal-section">
        <h2>5. Data Sharing</h2>
        <p>
          We do <strong>not</strong> sell, rent, or share your personal data with third parties for
          commercial purposes. Data may be shared with the following service providers only as
          necessary to operate Runlytics:
        </p>
        <ul>
          <li><strong>Strava</strong> — the source of your activity data via their official API</li>
          <li><strong>Anthropic (Claude AI)</strong> — your anonymised activity summary is sent to generate AI coaching responses. Anthropic's data handling is governed by their <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</li>
          <li><strong>Render</strong> — hosting provider for backend server and database</li>
          <li><strong>Netlify</strong> — hosting provider for frontend application</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>6. Third-Party API — Strava</h2>
        <p>
          Runlytics is built on the <a href="https://developers.strava.com" target="_blank" rel="noopener noreferrer">Strava API</a>.
          By connecting your Strava account, you also agree to <a href="https://www.strava.com/legal/privacy" target="_blank" rel="noopener noreferrer">Strava's Privacy Policy</a> and
          <a href="https://www.strava.com/legal/terms" target="_blank" rel="noopener noreferrer"> Terms of Service</a>.
        </p>
        <p>
          Runlytics requests <strong>read-only</strong> access to your Strava data. We never post
          activities, kudos, or comments on your behalf.
        </p>
      </section>

      <section className="legal-section">
        <h2>7. Cookies</h2>
        <p>Runlytics uses a single session cookie (<code>connect.sid</code>) to maintain your login state. This cookie:</p>
        <ul>
          <li>Is set only after you authenticate with Strava</li>
          <li>Expires after 7 days of inactivity</li>
          <li>Is not used for advertising or tracking</li>
          <li>Is not shared with third parties</li>
        </ul>
        <p>
          We also use <code>localStorage</code> to store your UI preferences (colour theme, max heart rate setting, and onboarding state). This data never leaves your browser.
        </p>
      </section>

      <section className="legal-section">
        <h2>8. Your Rights</h2>
        <p>You have the following rights regarding your data:</p>
        <ul>
          <li><strong>Access</strong> — your data is visible to you directly within the Runlytics dashboard</li>
          <li><strong>Deletion</strong> — you can delete all your data at any time from the Profile page using the "Delete My Data" button. This permanently removes your athlete profile, activity cache, OAuth tokens, and goals from our database.</li>
          <li><strong>Disconnection</strong> — you can disconnect your Strava account at any time. You can also revoke Runlytics' access directly from your <a href="https://www.strava.com/settings/apps" target="_blank" rel="noopener noreferrer">Strava settings page</a>.</li>
          <li><strong>Portability</strong> — you can export your activity data as CSV from the Activities page</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2>9. Data Retention</h2>
        <p>
          Your data is retained as long as your account is active. If you delete your data via the
          Profile page, all records are permanently removed within 24 hours. If your Strava OAuth
          token is revoked or expires and cannot be refreshed, your session will be cleared but your
          cached data may persist until you explicitly delete it or contact us.
        </p>
      </section>

      <section className="legal-section">
        <h2>10. Children's Privacy</h2>
        <p>
          Runlytics is not intended for use by individuals under the age of 13. We do not knowingly
          collect data from children. If you believe a child has provided us with personal data,
          please contact us at <a href="mailto:support@runlytics.app">support@runlytics.app</a>.
        </p>
      </section>

      <section className="legal-section">
        <h2>11. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. When we do, we will update the "Last
          updated" date at the top of this page. Continued use of Runlytics after changes constitutes
          acceptance of the updated policy.
        </p>
      </section>

      <section className="legal-section">
        <h2>12. Contact</h2>
        <p>
          For privacy questions, data deletion requests, or concerns, contact us at:<br />
          <a href="mailto:support@runlytics.app">support@runlytics.app</a>
        </p>
      </section>

    </LegalShell>
  );
}
