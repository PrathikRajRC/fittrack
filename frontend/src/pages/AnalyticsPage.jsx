import { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useAnalyticsTrends } from "../hooks/useAnalytics.js";
import { useActivities } from "../hooks/useActivities.js";
import { Card, CardHeader, Tag, Spinner } from "../components/ui/index.jsx";
import { actColor, fmtPace, fmtDist, fmtDur, calcPace } from "../utils/formatters.js";

const TS = { background: "#141c2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 };

export default function AnalyticsPage() {
  const { data: trends, loading } = useAnalyticsTrends();
  const { activities } = useActivities({ per_page: 100 });
  const [compareA, setCompareA] = useState(0);
  const [compareB, setCompareB] = useState(1);

  if (loading || !trends) return <Spinner />;

  const { weekly, monthly, typeDistribution, paceTrend, consistency } = trends;
  const activeDays = consistency?.filter((d) => d.active).length ?? 0;

  const wA = activities[compareA];
  const wB = activities[compareB];

  return (
    <div className="page-content">
      {/* Monthly distance */}
      <Card className="chart-full fade-up" style={{ marginBottom: 24 }}>
        <CardHeader title="Monthly Distance Progression" right={<Tag>6 Months</Tag>} />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthly}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#00e5ff" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#00e5ff" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="label" tick={{ fill: "#4a5a7a", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#4a5a7a", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TS} formatter={(v) => [`${v} km`, "Distance"]} />
            <Bar dataKey="distance" fill="url(#barGrad)" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="chart-wrap fade-up fade-up-1">
        {/* Activity distribution */}
        <Card>
          <CardHeader title="Activity Distribution" />
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="count">
                  {typeDistribution.map((entry, i) => (
                    <Cell key={i} fill={actColor(entry.type)} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TS} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {typeDistribution.map((t) => (
                <div key={t.type} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: actColor(t.type) }} />
                  <span style={{ fontSize: 12, flex: 1 }}>{t.type}</span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{t.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Pace trend */}
        <Card>
          <CardHeader title="Run Pace Trend" right={<Tag>Last 12 Runs</Tag>} />
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={paceTrend?.slice(-12) ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: "#4a5a7a", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: "#4a5a7a", fontSize: 10 }} axisLine={false} tickLine={false} domain={["dataMin - 0.3", "dataMax + 0.3"]} reversed />
              <Tooltip contentStyle={TS} formatter={(v) => [fmtPace(v, "Run"), "Pace"]} />
              <Line type="monotone" dataKey="pace" stroke="#00ff9d" strokeWidth={2} dot={{ fill: "#00ff9d", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Consistency heatmap */}
      <Card className="fade-up fade-up-2" style={{ marginBottom: 24 }}>
        <CardHeader
          title="Training Consistency — Last 12 Weeks"
          right={<Tag>{activeDays} / 84 days active</Tag>}
        />
        <div className="streak-dots">
          {(consistency ?? []).map((d, i) => (
            <div key={i} className={`streak-dot ${d.active ? "active" : ""}`} title={d.date} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 10 }}>
          <div className="streak-dot" /><span style={{ fontSize: 11, color: "var(--text3)" }}>Rest</span>
          <div className="streak-dot active" style={{ marginLeft: 12 }} /><span style={{ fontSize: 11, color: "var(--text3)" }}>Trained</span>
        </div>
      </Card>

      {/* Workout comparison */}
      <Card className="fade-up fade-up-3">
        <CardHeader title="Workout Comparison" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Workout A", val: compareA, set: setCompareA, color: "var(--accent)" },
            { label: "Workout B", val: compareB, set: setCompareB, color: "var(--purple)" },
          ].map(({ label, val, set, color }) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6 }}>{label}</div>
              <select className="compare-select" value={val} onChange={(e) => set(+e.target.value)}>
                {activities.slice(0, 30).map((a, i) => (
                  <option key={a.id} value={i}>
                    {a.start_date_local.slice(0, 10)} — {a.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {wA && wB && (
          <div>
            {[
              { label: "Distance", av: wA.distance, bv: wB.distance, fa: fmtDist(wA.distance, wA.type), fb: fmtDist(wB.distance, wB.type) },
              { label: "Duration", av: wA.moving_time, bv: wB.moving_time, fa: fmtDur(wA.moving_time), fb: fmtDur(wB.moving_time) },
              { label: "Pace",     av: -calcPace(wA), bv: -calcPace(wB), fa: fmtPace(calcPace(wA), wA.type), fb: fmtPace(calcPace(wB), wB.type) },
            ].map((row) => {
              const total = Math.abs(row.av || 0) + Math.abs(row.bv || 0) || 1;
              const pA    = Math.round(Math.abs(row.av || 0) / total * 100);
              return (
                <div key={row.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 13 }}>
                    <span style={{ color: "var(--accent)", fontWeight: 600 }}>{row.fa}</span>
                    <span style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>{row.label}</span>
                    <span style={{ color: "var(--purple)", fontWeight: 600 }}>{row.fb}</span>
                  </div>
                  <div style={{ display: "flex", gap: 3, height: 8 }}>
                    <div style={{ flex: pA, background: "var(--accent)", borderRadius: "4px 0 0 4px", opacity: 0.8 }} />
                    <div style={{ flex: 100 - pA, background: "var(--purple)", borderRadius: "0 4px 4px 0", opacity: 0.8 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
