import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import Footer from "../ui/Footer.jsx";

const ICONS = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="3" width="8" height="8" rx="2"/>
      <rect x="13" y="3" width="8" height="8" rx="2"/>
      <rect x="3" y="13" width="8" height="8" rx="2"/>
      <rect x="13" y="13" width="8" height="8" rx="2"/>
    </svg>
  ),
  activities: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="4"    width="18" height="3"   rx="1.5"/>
      <rect x="3" y="10.5" width="18" height="3"   rx="1.5"/>
      <rect x="3" y="17"   width="12" height="3"   rx="1.5"/>
    </svg>
  ),
  analytics: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <rect x="3"    y="13" width="4.5" height="8" rx="1.2"/>
      <rect x="9.75" y="8"  width="4.5" height="13" rx="1.2"/>
      <rect x="16.5" y="3"  width="4.5" height="18" rx="1.2"/>
    </svg>
  ),
  insights: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a7 7 0 0 1 5.27 11.63A3 3 0 0 0 16 16v1H8v-1a3 3 0 0 0-1.27-2.37A7 7 0 0 1 12 2z"/>
      <path d="M9 19h6m-5 2h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  goals: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>
    </svg>
  ),
  coach: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2 13.5 6.5 18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"/>
      <path d="M19 15l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" opacity="0.65"/>
    </svg>
  ),
  profile: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-3.87 3.58-7 8-7s8 3.13 8 7"/>
    </svg>
  ),
};

const COLLAPSE_ICON = (collapsed) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {collapsed
      ? <path d="M9 18l6-6-6-6"/>
      : <path d="M15 18l-6-6 6-6"/>}
  </svg>
);

const NAV = [
  { id: "dashboard",  label: "Dashboard", hint: "D" },
  { id: "activities", label: "Activities", hint: "A" },
  { id: "analytics",  label: "Analytics",  hint: "N" },
  { id: "insights",   label: "Insights",   hint: "I" },
  { id: "goals",      label: "Goals",      hint: "G" },
  { id: "coach",      label: "AI Coach",   hint: "C" },
  { id: "profile",    label: "Profile",    hint: "P" },
];

export default function Layout({ children, currentPage, onNavigate, appNavigate }) {
  const { athlete, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials  = athlete ? (athlete.firstname?.[0] || "") + (athlete.lastname?.[0] || "") : "?";
  const name      = athlete ? `${athlete.firstname} ${athlete.lastname || ""}`.trim() : "Athlete";
  const avatarUrl = athlete?.profile_medium || athlete?.profile || null;

  const closeMobile = () => setMobileOpen(false);
  const handleNav   = (id) => { onNavigate(id); closeMobile(); };

  return (
    <div className="runlytics-app">
      <div className={`sidebar-overlay ${mobileOpen ? "visible" : ""}`} onClick={closeMobile} />

      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>

        {/* Logo */}
        <div className="sidebar-logo">
          {collapsed
            ? <img src="/logo.png" alt="Runlytics" className="sidebar-logo-icon" />
            : <img src="/logo.png" alt="Runlytics" className="sidebar-logo-full" />}
        </div>

        {!collapsed && <div className="sidebar-divider" />}

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV.map((n) => (
            <div
              key={n.id}
              className={`nav-item ${currentPage === n.id ? "active" : ""}`}
              onClick={() => handleNav(n.id)}
              title={collapsed ? `${n.label}  (${n.hint})` : undefined}
            >
              <span className="nav-icon">{ICONS[n.id]}</span>
              {!collapsed && (
                <>
                  <span className="nav-label">{n.label}</span>
                  <kbd className="nav-kbd">{n.hint}</kbd>
                </>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {/* User card */}
          <div className="sidebar-user" title={collapsed ? name : undefined}>
            {avatarUrl
              ? <img src={avatarUrl} alt={name} className="avatar-photo" />
              : <div className="avatar-ring">{initials}</div>}
            {!collapsed && (
              <div className="avatar-info">
                <div className="avatar-name">{name}</div>
                <div className="avatar-sub">via Strava</div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="sidebar-actions">
            <button className="sidebar-action-btn" onClick={toggleTheme} title={theme === "dark" ? "Light mode" : "Dark mode"}>
              {theme === "dark" ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zm0-16v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
            {!collapsed && (
              <button className="sidebar-action-btn" onClick={logout} title="Disconnect">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9"/>
                </svg>
              </button>
            )}
            <button
              className="sidebar-action-btn collapse-btn"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {COLLAPSE_ICON(collapsed)}
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <button className="hamburger-btn" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
            {mobileOpen ? "✕" : "☰"}
          </button>
          <div className="topbar-title">
            {NAV.find((n) => n.id === currentPage)?.label ?? "Runlytics"}
          </div>
          <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button className="btn-secondary" onClick={logout} style={{ fontSize: 12 }}>
            Disconnect
          </button>
        </header>
        {children}
        <Footer onNavigate={onNavigate} />
      </div>
    </div>
  );
}
