import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

const NAV = [
  { id: "dashboard",  icon: "⊞",  label: "Dashboard",  hint: "D" },
  { id: "activities", icon: "📋", label: "Activities",  hint: "A" },
  { id: "analytics",  icon: "📊", label: "Analytics",   hint: "N" },
  { id: "insights",   icon: "💡", label: "Insights",    hint: "I" },
  { id: "goals",      icon: "🎯", label: "Goals",       hint: "G" },
  { id: "coach",      icon: "🤖", label: "AI Coach",    hint: "C" },
  { id: "profile",    icon: "👤", label: "Profile",     hint: "P" },
];

export default function Layout({ children, currentPage, onNavigate }) {
  const { athlete, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = athlete
    ? (athlete.firstname?.[0] || "") + (athlete.lastname?.[0] || "")
    : "?";

  const name = athlete
    ? `${athlete.firstname} ${athlete.lastname || ""}`.trim()
    : "Athlete";

  const closeMobile = () => setMobileOpen(false);

  const handleNav = (id) => {
    onNavigate(id);
    closeMobile();
  };

  return (
    <div className="fittrack-app">
      {/* Mobile overlay backdrop */}
      <div
        className={`sidebar-overlay ${mobileOpen ? "visible" : ""}`}
        onClick={closeMobile}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">FT</div>
          {!collapsed && <div className="sidebar-logo-text">Fit<span>Track</span></div>}
        </div>

        <nav className="sidebar-nav">
          {NAV.map((n) => (
            <div
              key={n.id}
              className={`nav-item ${currentPage === n.id ? "active" : ""}`}
              onClick={() => handleNav(n.id)}
              title={collapsed ? `${n.label} (${n.hint})` : undefined}
            >
              <span className="nav-icon">{n.icon}</span>
              {!collapsed && (
                <>
                  <span style={{ flex: 1 }}>{n.label}</span>
                  <kbd className="nav-kbd">{n.hint}</kbd>
                </>
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-avatar">
            <div className="avatar-ring">{initials}</div>
            {!collapsed && (
              <div className="avatar-info">
                <div className="avatar-name">{name}</div>
              </div>
            )}
          </div>
          <div className="nav-item" style={{ marginTop: 4 }} onClick={() => setCollapsed(!collapsed)}>
            <span className="nav-icon">{collapsed ? "▶" : "◀"}</span>
            {!collapsed && <span>Collapse</span>}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        <header className="topbar">
          {/* Hamburger — mobile only */}
          <button className="hamburger-btn" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
            {mobileOpen ? "✕" : "☰"}
          </button>

          <div className="topbar-title">
            {NAV.find((n) => n.id === currentPage)?.label ?? "FitTrack"}
          </div>

          {/* Theme toggle */}
          <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          <button className="btn-secondary" onClick={logout} style={{ fontSize: 12 }}>
            Disconnect
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
