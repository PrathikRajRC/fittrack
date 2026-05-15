import { useMemo } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useActivities } from "../hooks/useActivities.js";
import { useAnalyticsSummary } from "../hooks/useAnalytics.js";
import { Card, CardHeader, Tag, ProgressBar, Spinner } from "../components/ui/index.jsx";
import { fmtPace, fmtDateShort, calcPace } from "../utils/formatters.js";

export default function ProfilePage() {
  const { athlete }                        = useAuth();
  const { activities, loading: aLoading }  = useActivities({ per_page: 100 });
  const { data: summary, loading: sLoading } = useAnalyticsSummary();

  const runs = useMemo(
    () => activities.filter((a) => a.type === "Run" && a.distance > 0),
    [activities]
  );

  const avgPace = runs.length ? runs.reduce((s, a) => s + calcPace(a), 0) / runs.length : 0;
  const longest = useMemo(
    () => runs.reduce((m, a) => a.distance > m.distance ? a : m, runs[0] || { distance: 0 }),
    [runs]
  );
  const bestPaceRun = useMemo(
    () => runs.reduce((m, a) => calcPace(a) < (m.p || 99) ? { ...a, p: calcPace(a) } : m, {}),
    [runs]
  );

  const typeCounts = useMemo(() => {
    const counts = {};
    activities.forEach((a) => { counts[a.type] = (counts[a.type] || 0) + 1; });
    return counts;
  }, [activities]);
  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  // Consistency score: workouts in last 30 days vs target (13 = ~3/week)
  const last30 = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    return activities.filter((a) => new Date(a.start_date_local).getTime() > cutoff);
  }, [activities]);
  const consistencyScore = Math.min(100, Math.round(last30.length / 13 * 100));

  // Achievements computed entirely from real activity data
  const achievements = useMemo(() => {
    const all    = [...activities].sort((a, b) => new Date(a.start_date_local) - new Date(b.start_date_local));
    const sorted = [...runs].sort((a, b) => new Date(a.start_date_local) - new Date(b.start_date_local));
    const result = [];

    if (all.length >= 1) {
      result.push({ icon:"🏅", title:"First Workout",  desc:all[0].name,                       date:fmtDateShort(all[0].start_date_local) });
    }
    const firstTenK = sorted.find((a) => a.distance >= 10000);
    if (firstTenK) {
      result.push({ icon:"🥇", title:"First 10K",      desc:firstTenK.name,                    date:fmtDateShort(firstTenK.start_date_local) });
    }
    if (all.length >= 50) {
      result.push({ icon:"🚀", title:"50 Activities",   desc:"Half a century of workouts",      date:fmtDateShort(all[49].start_date_local) });
    }
    if (all.length >= 100) {
      result.push({ icon:"💯", title:"100 Activities",  desc:"A century of workouts logged",    date:fmtDateShort(all[99].start_date_local) });
    }
    const totalKm = summary?.totalDistance ?? 0;
    if (totalKm >= 1000) {
      result.push({ icon:"🌍", title:"1000 km Club",    desc:"Total distance exceeded 1000 km" });
    } else if (totalKm >= 500) {
      result.push({ icon:"📍", title:"500 km Club",     desc:"Total distance exceeded 500 km"  });
    }
    const subSix = sorted.find((a) => calcPace(a) <= 6.0);
    if (subSix) {
      result.push({ icon:"⚡", title:"Sub-6 Pacer",    desc:`${fmtPace(calcPace(subSix), "Run")} — ${subSix.name}`, date:fmtDateShort(subSix.start_date_local) });
    }
    const subFive = sorted.find((a) => calcPace(a) <= 5.0);
    if (subFive) {
      result.push({ icon:"🔥", title:"Sub-5 Pacer",    desc:`${fmtPace(calcPace(subFive), "Run")} — ${subFive.name}`, date:fmtDateShort(subFive.start_date_local) });
    }

    return result.slice(0, 5);
  }, [activities, runs, summary]);

  // Member-since year from Strava athlete data
  const memberSince = athlete?.created_at
    ? new Date(athlete.created_at).getFullYear()
    : null;

  const initials  = athlete ? (athlete.firstname?.[0] || "") + (athlete.lastname?.[0] || "") : "?";
  const name      = athlete ? `${athlete.firstname} ${athlete.lastname || ""}`.trim() : "Athlete";
  const avatarUrl = athlete?.profile_medium || athlete?.profile || null;
  const location  = [athlete?.city, athlete?.country].filter(Boolean).join(", ") || null;

  if (aLoading || sLoading) return <Spinner />;

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
          {location && <div className="profile-sub">📍 {location}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <Tag>{topType} · {typeCounts[topType] ?? 0} sessions</Tag>
            {memberSince && <Tag>Member since {memberSince}</Tag>}
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
        {/* Personal Records */}
        <Card>
          <CardHeader title="Personal Records" />
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { label:"Longest Run",  val: longest.distance ? `${(longest.distance/1000).toFixed(2)} km` : "—", sub:longest.name || "—", icon:"📍" },
              { label:"Best Run Pace", val: fmtPace(bestPaceRun.p, "Run"),                                      sub:bestPaceRun.name || "—", icon:"⚡" },
              { label:"Avg Run Pace",  val: fmtPace(avgPace, "Run"),                                            sub:`Over ${runs.length} runs`, icon:"🏃" },
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

        {/* Achievements — computed from real data */}
        <Card>
          <CardHeader title="Achievements" />
          {achievements.length === 0 ? (
            <div style={{ fontSize:13, color:"var(--text3)", padding:"12px 0" }}>
              Keep training — achievements unlock as you hit milestones!
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {achievements.map((ach) => (
                <div key={ach.title} style={{ display:"flex", gap:12, padding:"8px 0", borderBottom:"1px solid var(--border)" }}>
                  <span style={{ fontSize:22 }}>{ach.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{ach.title}</div>
                    <div style={{ fontSize:11, color:"var(--text3)" }}>{ach.desc}</div>
                  </div>
                  {ach.date && <div style={{ fontSize:11, color:"var(--text3)", whiteSpace:"nowrap" }}>{ach.date}</div>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
