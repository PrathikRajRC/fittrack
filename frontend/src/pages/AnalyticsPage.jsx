import { useState, useMemo } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useAnalyticsTrends } from "../hooks/useAnalytics.js";
import { useActivities } from "../hooks/useActivities.js";
import { Card, CardHeader, Tag, Spinner } from "../components/ui/index.jsx";
import { actColor, fmtPace, fmtDist, fmtDur, calcPace } from "../utils/formatters.js";

const TS = {
  background: "#141c2e",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  fontSize: 12,
  padding: "8px 12px",
};

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

  const bestMonth = monthly?.length
    ? monthly.reduce((m, d) => d.distance > m.distance ? d : m, monthly[0])
    : null;
  const avgWeeklyKm = weekly?.length
    ? (weekly.reduce((s, w) => s + w.distance, 0) / weekly.length).toFixed(1)
    : "0";
  const totalInView = monthly?.reduce((s, m) => s + m.count, 0) ?? 0;

  return (
    <div className="page-content">

      {/* ── Summary KPIs ─────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }} className="fade-up">
        {[
          {
            label: "Best Month",
            val:   bestMonth ? `${bestMonth.distance} km` : "—",
            sub:   bestMonth?.label ?? "—",
            icon:  "🏆",
            color: "var(--accent)",
          },
          {
            label: "Avg / Week",
            val:   `${avgWeeklyKm} km`,
            sub:   "12-week rolling average",
            icon:  "📈",
            color: "var(--green)",
          },
          {
            label: "Active Days",
            val:   String(activeDays),
            sub:   "Last 84 days",
            icon:  "🔥",
            color: "var(--orange)",
          },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ fontSize: 28 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Monthly Distance ─────────────────────────────────────────────── */}
      <Card className="chart-full fade-up fade-up-1" style={{ marginBottom: 24 }}>
        <CardHeader
          title="Monthly Distance"
          right={
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Tag>{totalInView} activities</Tag>
              <Tag>6 months</Tag>
            </div>
          }
        />
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthly} barCategoryGap="32%">
            <defs>
              <linearGradient id="monthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#00e5ff" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#00e5ff" stopOpacity={0.25} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#4a5a7a", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#4a5a7a", fontSize: 12 }} axisLine={false} tickLine={false} unit=" km" />
            <Tooltip contentStyle={TS} formatter={(v) => [`${v} km`, "Distance"]} />
            <Bar dataKey="distance" fill="url(#monthGrad)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ── Weekly Volume + Activity Mix ─────────────────────────────────── */}
      <div className="chart-wrap fade-up fade-up-1">
        <Card>
          <CardHeader title="Weekly Volume" right={<Tag>12 weeks</Tag>} />
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={weekly} barCategoryGap="25%">
              <defs>
                <linearGradient id="wkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#b87aff" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#b87aff" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#4a5a7a", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#4a5a7a", fontSize: 10 }} axisLine={false} tickLine={false} unit=" km" />
              <Tooltip contentStyle={TS} formatter={(v) => [`${v} km`, "Distance"]} />
              <Bar dataKey="distance" fill="url(#wkGrad)" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader title="Activity Mix" />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ResponsiveContainer width="50%" height={190}>
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%" cy="50%"
                  innerRadius={48} outerRadius={78}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {typeDistribution.map((entry, i) => (
                    <Cell key={i} fill={actColor(entry.type)} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TS} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, maxHeight: 190, overflowY: "auto" }}>
              {typeDistribution.slice(0, 8).map((t) => (
                <div key={t.type} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: actColor(t.type), flexShrink: 0 }} />
                  <span style={{ fontSize: 12, flex: 1 }}>{t.type}</span>
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>{t.pct}%</span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{t.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Pace Trend ───────────────────────────────────────────────────── */}
      <Card className="chart-full fade-up fade-up-2" style={{ marginBottom: 24 }}>
        <CardHeader title="Run Pace Trend" right={<Tag>Last 12 runs</Tag>} />
        {(paceTrend?.length ?? 0) === 0 ? (
          <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 13 }}>
            No run data — go for a run to see your pace trend!
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={paceTrend.slice(-12)}>
              <defs>
                <linearGradient id="paceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#00ff9d" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#00ff9d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#4a5a7a", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis
                tick={{ fill: "#4a5a7a", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={["dataMin - 0.3", "dataMax + 0.3"]}
                reversed
                tickFormatter={(v) => fmtPace(v, "Run")}
                width={58}
              />
              <Tooltip contentStyle={TS} formatter={(v) => [fmtPace(v, "Run"), "Pace"]} />
              <Area
                type="monotone"
                dataKey="pace"
                stroke="#00ff9d"
                strokeWidth={2.5}
                fill="url(#paceGrad)"
                dot={{ fill: "#00ff9d", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#00ff9d" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* ── Training Consistency ─────────────────────────────────────────── */}
      <Card className="fade-up fade-up-2" style={{ marginBottom: 24 }}>
        <CardHeader
          title="Training Consistency"
          right={
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Tag style={{ color: "var(--green)" }}>{activeDays} trained</Tag>
              <Tag>{84 - activeDays} rest</Tag>
            </div>
          }
        />
        <div className="streak-dots">
          {(consistency ?? []).map((d, i) => (
            <div
              key={i}
              className={`streak-dot ${d.active ? "active" : ""}`}
              title={d.date}
              style={d.active ? { boxShadow: "0 0 4px rgba(0,229,255,0.4)" } : {}}
            />
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 14 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div className="streak-dot" />
            <span style={{ fontSize: 11, color: "var(--text3)" }}>Rest day</span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div className="streak-dot active" style={{ boxShadow: "0 0 4px rgba(0,229,255,0.4)" }} />
            <span style={{ fontSize: 11, color: "var(--text3)" }}>Trained</span>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--text3)" }}>Last 12 weeks</div>
        </div>
      </Card>

      {/* ── Workout Comparison ───────────────────────────────────────────── */}
      <Card className="fade-up fade-up-3">
        <CardHeader title="Workout Comparison" right={<Tag>side by side</Tag>} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Workout A", val: compareA, set: setCompareA, color: "var(--accent)" },
            { label: "Workout B", val: compareB, set: setCompareB, color: "var(--purple)" },
          ].map(({ label, val, set, color }) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                {label}
              </div>
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
              { label: "Distance", av: wA.distance,     bv: wB.distance,     fa: fmtDist(wA.distance, wA.type),   fb: fmtDist(wB.distance, wB.type) },
              { label: "Duration", av: wA.moving_time,  bv: wB.moving_time,  fa: fmtDur(wA.moving_time),          fb: fmtDur(wB.moving_time) },
              { label: "Pace",     av: -calcPace(wA),   bv: -calcPace(wB),   fa: fmtPace(calcPace(wA), wA.type),  fb: fmtPace(calcPace(wB), wB.type) },
            ].map((row) => {
              const total = Math.abs(row.av || 0) + Math.abs(row.bv || 0) || 1;
              const pA    = Math.round(Math.abs(row.av || 0) / total * 100);
              return (
                <div key={row.label} style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                    <span style={{ color: "var(--accent)", fontWeight: 700 }}>{row.fa}</span>
                    <span style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1.5 }}>{row.label}</span>
                    <span style={{ color: "var(--purple)", fontWeight: 700 }}>{row.fb}</span>
                  </div>
                  <div style={{ display: "flex", gap: 3, height: 8, borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ flex: pA, background: "var(--accent)", opacity: 0.85 }} />
                    <div style={{ flex: 100 - pA, background: "var(--purple)", opacity: 0.85 }} />
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
