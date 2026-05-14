// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = "", style = {} }) {
  return (
    <div className={`card ${className}`} style={style}>
      {children}
    </div>
  );
}

export function CardHeader({ title, right }) {
  return (
    <div className="card-header">
      <div className="card-title">{title}</div>
      {right}
    </div>
  );
}

// ── Badge / Tag ───────────────────────────────────────────────────────────────
export function Tag({ children }) {
  return <span className="tag">{children}</span>;
}

// ── Buttons ───────────────────────────────────────────────────────────────────
export function PrimaryButton({ children, onClick, style = {} }) {
  return (
    <button className="btn-primary" onClick={onClick} style={style}>
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, style = {} }) {
  return (
    <button className="btn-secondary" onClick={onClick} style={style}>
      {children}
    </button>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ icon, label, value, delta, deltaUp, color = "cyan" }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className={`stat-val ${color}`}>{value}</div>
      {delta && (
        <div className="stat-delta">
          <span className={deltaUp ? "up" : "down"}>{delta}</span>
        </div>
      )}
    </div>
  );
}

// ── Filter Chip ───────────────────────────────────────────────────────────────
export function FilterChip({ label, active, onClick }) {
  return (
    <div className={`filter-chip ${active ? "active" : ""}`} onClick={onClick}>
      {label}
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color = "var(--accent)" }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = "🔍", title, desc }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {desc && <div>{desc}</div>}
    </div>
  );
}

// ── Loading spinner ───────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
      <div className="spinner" />
    </div>
  );
}
