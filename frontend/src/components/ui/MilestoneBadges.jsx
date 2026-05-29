import { useState, useMemo } from "react";
import { Card, CardHeader, Tag } from "./index.jsx";

const CATEGORY_LABELS = {
  all:      "All",
  distance: "Distance",
  count:    "Activities",
  run:      "Running",
  ride:     "Cycling",
  pr:       "PRs",
};

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("default", { day: "numeric", month: "short", year: "numeric" });
}

function Badge({ m }) {
  const earned = !!m.achievedAt;
  return (
    <div
      title={earned ? `Achieved ${formatDate(m.achievedAt)}` : `Progress: ${Math.round((m.progress ?? 0) * 100)}%`}
      style={{
        position: "relative",
        background: earned
          ? "linear-gradient(135deg, rgba(0,229,255,0.10), rgba(184,122,255,0.06))"
          : "var(--surface)",
        border: earned ? "1px solid rgba(0,229,255,0.3)" : "1px solid var(--border)",
        borderRadius: 14,
        padding: "16px 12px 14px",
        textAlign: "center",
        opacity: earned ? 1 : 0.45,
        transition: "transform 0.15s, box-shadow 0.15s",
        cursor: "default",
      }}
      onMouseOver={(e) => { if (earned) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,229,255,0.12)"; } }}
      onMouseOut={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{
        fontSize: 32, marginBottom: 8,
        filter: earned ? "none" : "grayscale(1)",
      }}>{m.icon}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 4, lineHeight: 1.3 }}>
        {m.label}
      </div>
      <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: earned ? 6 : 8 }}>
        {m.threshold}
      </div>
      {earned ? (
        <div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 600 }}>
          {formatDate(m.achievedAt)}
        </div>
      ) : (
        <div style={{
          height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden",
          marginTop: 4,
        }}>
          <div style={{
            width: `${Math.min(100, (m.progress ?? 0) * 100)}%`,
            height: "100%", background: "var(--text3)",
          }} />
        </div>
      )}
    </div>
  );
}

export default function MilestoneBadges({ milestones }) {
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    if (filter === "all") return milestones;
    return milestones.filter((m) => m.category === filter);
  }, [milestones, filter]);

  const earnedCount = milestones.filter((m) => m.achievedAt).length;
  const totalCount  = milestones.length;

  return (
    <Card style={{ marginBottom: 24 }} className="fade-up fade-up-2">
      <CardHeader
        title="🏅 Milestones"
        right={<Tag>{earnedCount}/{totalCount} unlocked</Tag>}
      />

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              background: filter === key ? "var(--accent)" : "var(--surface)",
              color:      filter === key ? "#0d1320"     : "var(--text2)",
              border: "1px solid " + (filter === key ? "var(--accent)" : "var(--border)"),
              borderRadius: 99, padding: "5px 12px",
              fontSize: 11, fontWeight: 600, cursor: "pointer",
              transition: "all 0.15s",
            }}
          >{label}</button>
        ))}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
        gap: 12,
      }}>
        {filtered.map((m) => <Badge key={m.id} m={m} />)}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 20, color: "var(--text3)", fontSize: 13 }}>
          No milestones in this category yet.
        </div>
      )}
    </Card>
  );
}
