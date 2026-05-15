import { useAuth } from "../context/AuthContext.jsx";
import { useActivities } from "../hooks/useActivities.js";
import { useAnalyticsSummary } from "../hooks/useAnalytics.js";
import { Card, CardHeader, Tag, ProgressBar, Spinner } from "../components/ui/index.jsx";
import { fmtPace, fmtDur, calcPace } from "../utils/formatters.js";

const ACHIEVEMENTS = [
  { icon:"🥇", title:"First 10K",    desc:"Completed first 10 km run",         date:"Mar 2024" },
  { icon:"🔥", title:"30-Day Streak",desc:"Trained for 30 consecutive days",    date:"Jan 2025" },
  { icon:"⚡", title:"Sub-6 Pacer",  desc:"Ran at under 6:00/km pace",          date:"Nov 2024" },
  { icon:"🚀", title:"100 Activities",desc:"Logged 100 total workouts",          date:"Feb 2025" },
  { icon:"📍", title:"500 km Club",  desc:"Total distance exceeded 500 km",     date:"Apr 2025" },
];

const PLAN_PHASES = ["Base","Base","Build","Build","Peak","Peak","Taper","Race"];

export default function ProfilePage() {
  const { athlete }               = useAuth();
  const { activities, loading: aLoading } = useActivities({ per_page: 100 });
  const { data: summary, loading: sLoading } = useAnalyticsSummary();

  if (aLoading || sLoading) return <Spinner />;

  const runs     = activities.filter((a) => a.type === "Run" && a.distance > 0);
  const avgPace  = runs.length ? runs.reduce((s, a) => s + calcPace(a), 0) / runs.length : 0;
  const longest  = runs.reduce((m, a) => a.distance > m.distance ? a : m, runs[0] || { distance: 0 });
  const bestRun  = runs.reduce((m, a) => calcPace(a) < (m.p || 99) ? { ...a, p: calcPace(a) } : m, {});
  const typeCounts = {};
  activities.forEach((a) => { typeCounts[a.type] = (typeCounts[a.type] || 0) + 1; });
  const topType  = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Run";

  // Consistency score: workouts in last 30 days vs target (13 = ~3/week)
  const last30   = activities.filter((a) => {
    const d = new Date(a.start_date_local);
    return Date.now() - d.getTime() < 30 * 86400000;
  });
  const consistencyScore = Math.min(100, Math.round(last30.length / 13 * 100));

  const initials  = athlete ? (athlete.firstname?.[0] || "") + (athlete.lastname?.[0] || "") : "PR";
  const name      = athlete ? `${athlete.firstname} ${athlete.lastname || ""}`.trim() : "Athlete";
  const avatarUrl = athlete?.profile || null;
  const location = [athlete?.city, athlete?.country].filter(Boolean).join(", ") || "Bengaluru, India";

  return (
    <div className="page-content">
      {/* Hero */}
      <div className="profile-hero fade-up">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
          />
        ) : (
          <div className="profile-avatar">{initials}</div>
        )}
        <div>
          <div className="profile-name">{name}</div>
          <div className="profile-sub">📍 {location}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <Tag>🎯 Sub-70 min 10K</Tag>
            <Tag>🔥 Active Runner</Tag>
          </div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 900, color: "var(--accent)" }}>
            {consistencyScore}
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>
            Consistency Score
          </div>
          <ProgressBar value={consistencyScore} max={100} />
        </div>
      </div>

      {/* Lifetime stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }} className="fade-up fade-up-1">
        {[
          { label:"Total Activities", val: summary?.totalActivities ?? activities.length, icon:"🏅", color:"var(--accent)" },
          { label:"Total Distance",   val: `${(summary?.totalDistance ?? 0).toFixed(0)} km`, icon:"📍", color:"var(--green)" },
          { label:"Training Hours",   val: `${Math.round((summary?.totalMovingTime ?? 0) / 3600)}h`, icon:"⏱️", color:"var(--orange)" },
          { label:"Favourite Type",   val: topType, icon:"🏆", color:"var(--purple)" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 11, color:"var(--text3)", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>{s.label}</div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:22, fontWeight:800, color:s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }} className="fade-up fade-up-2">
        {/* PRs */}
        <Card>
          <CardHeader title="Personal Records" />
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { label:"Longest Run", val: longest.distance ? `${(longest.distance/1000).toFixed(2)} km` : "—", sub:longest.name || "—", icon:"📍" },
              { label:"Best Run Pace",    val:fmtPace(bestRun.p, "Run"),                  sub:bestRun.name || "—",   icon:"⚡" },
              { label:"Avg Run Pace",     val:fmtPace(avgPace, "Run"),                    sub:`Over ${runs.length} runs`, icon:"🏃" },
            ].map((pr) => (
              <div key={pr.label} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom:"1px solid var(--border)" }}>
                <span style={{ fontSize:18 }}>{pr.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:"var(--text3)", textTransform:"uppercase", letterSpacing:0.5 }}>{pr.label}</div>
                  <div style={{ fontSize:12, color:"var(--text2)", marginTop:1 }}>{pr.sub}</div>
                </div>
                <div style={{ fontFamily:"var(--font-display)", fontSize:18, fontWeight:800, color:"var(--accent)" }}>{pr.val}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader title="Recent Achievements" />
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {ACHIEVEMENTS.map((ach) => (
              <div key={ach.title} style={{ display:"flex", gap:12, padding:"8px 0", borderBottom:"1px solid var(--border)" }}>
                <span style={{ fontSize:22 }}>{ach.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{ach.title}</div>
                  <div style={{ fontSize:11, color:"var(--text3)" }}>{ach.desc}</div>
                </div>
                <div style={{ fontSize:11, color:"var(--text3)" }}>{ach.date}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 8-Week plan */}
      <Card className="fade-up fade-up-3">
        <CardHeader title="8-Week 10K Plan Progress" right={<Tag>Week 3 of 8</Tag>} />
        <div style={{ display:"flex", gap:8 }}>
          {PLAN_PHASES.map((phase, i) => (
            <div key={i} style={{ flex:1, textAlign:"center" }}>
              <div style={{
                height:40, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:10, fontWeight:700, letterSpacing:0.5,
                background: i < 3 ? "var(--accent)" : i === 3 ? "rgba(0,229,255,0.2)" : "var(--surface2)",
                color:      i < 3 ? "var(--bg)" : i === 3 ? "var(--accent)" : "var(--text3)",
                border:     i === 2 ? "2px solid var(--accent)" : "none",
              }}>W{i+1}</div>
              <div style={{ fontSize:9, color:"var(--text3)", marginTop:4 }}>{phase}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:8, marginTop:8, fontSize:11 }}>
          <div style={{ width:12, height:12, background:"var(--accent)", borderRadius:2 }} />
          <span style={{ color:"var(--text3)" }}>Completed</span>
          <div style={{ width:12, height:12, background:"rgba(0,229,255,0.2)", borderRadius:2, marginLeft:8, border:"1px solid var(--accent)" }} />
          <span style={{ color:"var(--text3)" }}>Current</span>
        </div>
      </Card>
    </div>
  );
}
