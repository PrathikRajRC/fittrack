import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useActivities } from "../hooks/useActivities.js";
import { useAnalyticsTrends, useAnalyticsSummary } from "../hooks/useAnalytics.js";
import { useAuth } from "../context/AuthContext.jsx";
import { StatCard, Card, CardHeader, Tag, ProgressBar, Spinner } from "../components/ui/index.jsx";
import WorkoutCard from "../components/ui/WorkoutCard.jsx";
import { fmtDur, fmtPace, calcPace } from "../utils/formatters.js";

const TOOLTIP_STYLE = {
  background: "#141c2e", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, fontSize: 12,
};

export default function Dashboard({ onWorkoutClick }) {
  const { athlete } = useAuth();
  const { activities, loading: aLoading } = useActivities({ per_page: 30 });
  const { data: summary, loading: sLoading } = useAnalyticsSummary();
  const { data: trends, loading: tLoading } = useAnalyticsTrends();

  const runs = activities.filter((a) => a.type === "Run");
  const avgPace = runs.length
    ? runs.reduce((s, a) => s + calcPace(a), 0) / runs.length
    : 0;

  // Day-of-week bars for current week
  const dayBars = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const acts = activities.filter((a) => a.start_date_local.slice(0, 10) === dateStr);
      return { label, dist: acts.reduce((s, a) => s + a.distance / 1000, 0) };
    });
  }, [activities]);

  const maxDayDist = Math.max(...dayBars.map((d) => d.dist), 1);
  const weekTotal  = dayBars.reduce((s, d) => s + d.dist, 0);
  const firstName  = athlete?.firstname || "Athlete";

  if (aLoading || sLoading) return <Spinner />;

  return (
    <div className="page-content">
      {/* Welcome */}
      <div className="fade-up" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 4 }}>Good morning,</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800 }}>
          {firstName} 👋
        </div>
        <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 4 }}>
          Goal: <span style={{ color: "var(--accent)" }}>Sub-70 min 10K</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-grid fade-up fade-up-1">
        <StatCard icon="🏅" label="Total Activities" value={summary?.totalActivities ?? activities.length} color="cyan" delta="+this month" deltaUp />
        <StatCard icon="📍" label="Total Distance"   value={`${((summary?.totalDistance ?? 0)).toFixed(0)} km`} color="green" delta="km covered" />
        <StatCard icon="⏱️" label="Training Hours"  value={`${Math.round((summary?.totalMovingTime ?? 0) / 3600)}h`} color="orange" delta="total time" />
        <StatCard icon="⚡" label="Avg Run Pace"     value={fmtPace(avgPace, "Run")} color="purple" delta="improving" deltaUp />
      </div>

      {/* Charts row */}
      <div className="chart-wrap fade-up fade-up-2">
        {/* Weekly distance trend */}
        <Card>
          <CardHeader title="Distance per Week" right={<Tag>Last 8 Weeks</Tag>} />
          {tLoading ? <Spinner /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trends?.weekly?.slice(-8) ?? []}>
                <defs>
                  <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00e5ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" tick={{ fill: "#4a5a7a", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4a5a7a", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="distance" stroke="#00e5ff" strokeWidth={2} fill="url(#distGrad)" dot={{ fill: "#00e5ff", r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* This week */}
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
              <span style={{ fontSize: 12, color: "var(--text3)" }}>Weekly goal: 21 km</span>
              <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>
                {weekTotal.toFixed(1)} km
              </span>
            </div>
            <ProgressBar value={weekTotal} max={21} />
          </div>
        </Card>
      </div>

      {/* Recent activities */}
      <Card className="fade-up fade-up-3">
        <CardHeader title="Recent Activities" right={<Tag>Last 6</Tag>} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {activities.slice(0, 6).map((a) => (
            <WorkoutCard key={a.id} activity={a} onClick={onWorkoutClick} />
          ))}
        </div>
      </Card>
    </div>
  );
}
