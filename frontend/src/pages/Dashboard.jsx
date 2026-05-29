import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useActivities } from "../hooks/useActivities.js";
import { useAnalyticsSummary } from "../hooks/useAnalytics.js";
import { useAuth } from "../context/AuthContext.jsx";
import { StatCard, Card, CardHeader, Tag, FilterChip, ProgressBar, Spinner, EmptyState } from "../components/ui/index.jsx";
import WorkoutCard from "../components/ui/WorkoutCard.jsx";
import StreakCard from "../components/ui/StreakCard.jsx";
import { fmtDur, fmtPace, calcPace } from "../utils/formatters.js";
import { groupByWeek } from "../utils/analytics.js";

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const TOOLTIP_STYLE = {
  background: "#141c2e", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, fontSize: 12,
};

const TYPE_ICONS = { Run: "🏃", Ride: "🚴", Walk: "🚶", Hike: "⛰️", Swim: "🏊", Workout: "💪" };

export default function Dashboard({ onWorkoutClick }) {
  const { athlete } = useAuth();
  const { activities, loading: aLoading } = useActivities({ per_page: 100 });
  const { data: summary, loading: sLoading } = useAnalyticsSummary();
  const [typeFilter, setTypeFilter] = useState("All");

  // Average pace across all runs
  const runs = activities.filter((a) => a.type === "Run");
  const avgPace = runs.length
    ? runs.reduce((s, a) => s + calcPace(a), 0) / runs.length
    : 0;

  // Pace trend delta: compare 3 most-recent runs to 3 earlier ones
  const paceDelta = useMemo(() => {
    const sorted = [...runs].sort((a, b) => new Date(b.start_date_local) - new Date(a.start_date_local));
    if (sorted.length < 6) return null;
    const recentAvg = sorted.slice(0, 3).reduce((s, a) => s + calcPace(a), 0) / 3;
    const olderAvg  = sorted.slice(3, 6).reduce((s, a)  => s + calcPace(a), 0) / 3;
    return olderAvg - recentAvg; // positive = recent is faster = improving
  }, [runs]);

  const paceDeltaText = paceDelta === null  ? `${runs.length} run${runs.length !== 1 ? "s" : ""}`
    : paceDelta > 0.05  ? "↑ improving"
    : paceDelta < -0.05 ? "↓ slower"
    : "→ steady";
  const paceDeltaUp = paceDelta !== null && paceDelta > 0.05;

  // Filtered subset for charts — respects typeFilter
  const chartActivities = useMemo(
    () => typeFilter === "All" ? activities : activities.filter((a) => a.type === typeFilter),
    [activities, typeFilter]
  );

  const runWeekly = useMemo(
    () => groupByWeek(chartActivities).slice(-8),
    [chartActivities]
  );

  // Day-of-week bars for current week — follows typeFilter
  const dayBars = useMemo(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const acts = chartActivities.filter(
        (a) => a.start_date_local.slice(0, 10) === dateStr
      );
      return { label, dist: acts.reduce((s, a) => s + a.distance / 1000, 0) };
    });
  }, [chartActivities]);

  // Dynamic weekly target: 10% above 4-week rolling average (rounded to nearest km, min 5)
  const weeklyGoal = useMemo(() => {
    const allWeeks = groupByWeek(activities).slice(-4);
    if (!allWeeks.length) return 20;
    const avg = allWeeks.reduce((s, w) => s + w.distance, 0) / allWeeks.length;
    return Math.max(5, Math.round(avg * 1.1));
  }, [activities]);

  // Types present in the activity list (for filter chips)
  const presentTypes = useMemo(
    () => ["All", ...([...new Set(activities.map((a) => a.type))].sort())],
    [activities]
  );

  // Recent activities filtered by selected type
  const recentFiltered = useMemo(() => {
    const src = typeFilter === "All"
      ? activities
      : activities.filter((a) => a.type === typeFilter);
    return src.slice(0, 6);
  }, [activities, typeFilter]);

  const maxDayDist = Math.max(...dayBars.map((d) => d.dist), 1);
  const weekTotal  = dayBars.reduce((s, d) => s + d.dist, 0);
  const firstName  = athlete?.firstname || "Athlete";

  if (aLoading || sLoading) return <Spinner />;

  if (!aLoading && activities.length === 0) {
    const base = import.meta.env.VITE_API_BASE_URL || "/api";
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 72, marginBottom: 24, opacity: 0.8 }}>🏃</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
          No activities yet
        </div>
        <div style={{ fontSize: 15, color: "var(--text2)", maxWidth: 420, lineHeight: 1.7, marginBottom: 32 }}>
          Your Strava activities will appear here automatically. Make sure you have activities
          logged on Strava, then refresh — or complete a workout and it will sync via webhook.
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Refresh Dashboard
          </button>
          <a href={`${base}/auth/strava`} className="btn-secondary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 99 }}>
            Reconnect Strava
          </a>
        </div>
        <div style={{ marginTop: 40, fontSize: 12, color: "var(--text3)" }}>
          Tip: Strava activities may take a few minutes to sync after your workout.
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Welcome */}
      <div className="fade-up" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 4 }}>{timeGreeting()},</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800 }}>
          {firstName} 👋
        </div>
      </div>

      {/* Streak card */}
      <div className="fade-up fade-up-1" style={{ marginBottom: 24 }}>
        <StreakCard activities={activities} />
      </div>

      {/* Stat cards */}
      <div className="stat-grid fade-up fade-up-1">
        <StatCard icon="🏅" label="Total Activities" value={summary?.totalActivities ?? activities.length} color="cyan" delta="+this month" deltaUp />
        <StatCard icon="📍" label="Total Distance"   value={`${((summary?.totalDistance ?? 0)).toFixed(0)} km`} color="green" delta="km covered" />
        <StatCard icon="⏱️" label="Training Hours"  value={`${Math.round((summary?.totalMovingTime ?? 0) / 3600)}h`} color="orange" delta="total time" />
        <StatCard icon="⚡" label="Avg Run Pace"     value={fmtPace(avgPace, "Run")} color="purple" delta={paceDeltaText} deltaUp={paceDeltaUp} />
      </div>

      {/* Charts row */}
      <div className="chart-wrap fade-up fade-up-2">
        {/* Weekly distance trend — updates with typeFilter */}
        <Card>
          <CardHeader
            title={typeFilter === "All" ? "Total Distance" : `${TYPE_ICONS[typeFilter] ?? ""} ${typeFilter} Distance`}
            right={<Tag>Last 8 Weeks</Tag>}
          />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={runWeekly}>
              <defs>
                <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00e5ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="week" tick={{ fill: "#4a5a7a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#4a5a7a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v} km`, typeFilter === "All" ? "Distance" : `${typeFilter} Distance`]} />
              <Area type="monotone" dataKey="distance" stroke="#00e5ff" strokeWidth={2} fill="url(#distGrad)" dot={{ fill: "#00e5ff", r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* This week — follows typeFilter */}
        <Card>
          <CardHeader title="This Week" right={<Tag>{new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</Tag>} />
          <div className="weekly-bar-wrap">
            {dayBars.map((d, i) => (
              <div
                key={i}
                className={`weekly-bar ${d.dist > 0 ? "active-day" : ""}`}
                style={{ height: `${Math.max(4, (d.dist / maxDayDist) * 56)}px` }}
                title={`${d.label}: ${d.dist.toFixed(1)} km`}
              />
            ))}
          </div>
          <div className="weekly-day-label">
            {dayBars.map((d, i) => <span key={i}>{d.label}</span>)}
          </div>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "var(--text3)" }}>
                Weekly target: {weeklyGoal} km
              </span>
              <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>
                {weekTotal.toFixed(1)} km
              </span>
            </div>
            <ProgressBar value={weekTotal} max={weeklyGoal} />
          </div>
        </Card>
      </div>

      {/* Recent activities with type filter */}
      <Card className="fade-up fade-up-3">
        <CardHeader title="Recent Activities" right={<Tag>Last 6</Tag>} />

        {/* Type filter chips */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {presentTypes.map((t) => (
            <FilterChip
              key={t}
              label={t === "All" ? "All" : `${TYPE_ICONS[t] ?? ""} ${t}`}
              active={typeFilter === t}
              onClick={() => setTypeFilter(t)}
            />
          ))}
        </div>

        {recentFiltered.length === 0 ? (
          <EmptyState icon={TYPE_ICONS[typeFilter] ?? "🏋️"} title={`No ${typeFilter} activities`} desc="Try a different filter" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentFiltered.map((a) => (
              <WorkoutCard key={a.id} activity={a} onClick={onWorkoutClick} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
