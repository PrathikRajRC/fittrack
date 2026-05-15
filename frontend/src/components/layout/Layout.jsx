import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";

const NAV = [
  { id: "dashboard",  icon: "⊞",  label: "Dashboard",  path: "/dashboard" },
  { id: "activities", icon: "📋", label: "Activities",  path: "/activities" },
  { id: "analytics",  icon: "📊", label: "Analytics",   path: "/analytics" },
  { id: "insights",   icon: "💡", label: "Insights",    path: "/insights" },
  { id: "profile",    icon: "👤", label: "Profile",     path: "/profile" },
];

export default function Layout({ children, currentPage, onNavigate }) {
  const { athlete, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const initials = athlete
    ? (athlete.firstname?.[0] || "") + (athlete.lastname?.[0] || "")
    : "PR";

  const name = athlete
    ? `${athlete.firstname} ${athlete.lastname || ""}`.trim()
    : "Athlete";

  return (
    <div className="fittrack-app">
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">FT</div>
          {!collapsed && <div className="sidebar-logo-text">Fit<span>Track</span></div>}
        </div>

        <nav className="sidebar-nav">
          {NAV.map((n) => (
            <div
              key={n.id}
              className={`nav-item ${currentPage === n.id ? "active" : ""}`}
              onClick={() => onNavigate(n.id)}
            >
              <span className="nav-icon">{n.icon}</span>
              {!collapsed && <span>{n.label}</span>}
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
          <div className="topbar-title">
            {NAV.find((n) => n.id === currentPage)?.label || "FitTrack"}
          </div>
          <button className="btn-secondary" onClick={logout} style={{ fontSize: 12 }}>
            Disconnect
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
