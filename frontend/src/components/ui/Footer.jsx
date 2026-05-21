export default function Footer({ onNavigate }) {
  const nav = (page) => (e) => {
    e.preventDefault();
    if (onNavigate) onNavigate(page);
  };

  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/logo.png" alt="Runlytics" className="footer-logo" />
          <span className="footer-copy">© {new Date().getFullYear()} Runlytics. All rights reserved.</span>
        </div>

        <div className="footer-links">
          <a href="/privacy" className="footer-link" onClick={nav("privacy")}>Privacy Policy</a>
          <span className="footer-sep">·</span>
          <a href="/terms"   className="footer-link" onClick={nav("terms")}>Terms of Service</a>
          <span className="footer-sep">·</span>
          <a href="/contact" className="footer-link" onClick={nav("contact")}>Contact</a>
        </div>

        <div className="footer-right">
          <span className="footer-strava">Powered by Strava API</span>
          <a href="mailto:support@runlytics.app" className="footer-link">support@runlytics.app</a>
        </div>
      </div>
    </footer>
  );
}
