import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useInsights, useAnalyticsTrends } from "../hooks/useAnalytics.js";
import { useActivities } from "../hooks/useActivities.js";
import { Card, CardHeader, Spinner } from "../components/ui/index.jsx";
import { fmtPace } from "../utils/formatters.js";
import {
  estimateVO2Max, vo2MaxCategory,
  currentWeekLoad, weeklyTrainingLoads, loadCategory,
  detectInjuryRisk, detectFatigue,
  weeklyZoneDistribution,
} from "../utils/performance.js";

const TS = { background: "#141c2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 };
const ICON_COLORS = ["#00e5ff","#00ff9d","#b87aff","#ff7040","#ffd060","#ff4d6d","#4db8ff","#00e5ff","#00ff9d"];

function MetricCard({ label, value, subValue, color, badge }) {
  return (
    <div style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      flex: 1,
      minWidth: 180,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--text3)" }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 800, color: color || "var(--text1)", lineHeight: 1 }}>{value}</div>
      {badge && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: badge.color, background: `${badge.color}20`, padding: "2px 8px", borderRadius: 99, letterSpacing: 0.5 }}>{badge.label}</span>
          {subValue && <span style={{ fontSize: 11, color: "var(--text3)" }}>{subValue}</span>}
        </div>
      )}
      {!badge && subValue && <div style={{ fontSize: 12, color: "var(--text3)" }}>{subValue}</div>}
    </div>
  );
}

function AlertBanner({ level, children }) {
  const isHigh  = level === "high";
  const bg      = isHigh ? "rgba(239,68,68,0.10)"  : "rgba(249,115,22,0.10)";
  const border  = isHigh ? "rgba(239,68,68,0.35)"  : "rgba(249,115,22,0.35)";
  const color   = isHigh ? "#ef4444" : "#f97316";
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{isHigh ? "🚨" : "⚠️"}</span>
      <div style={{ fontSize: 13, color, lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

export default function InsightsPage() {
  const { data, loading }  = useInsights();
  const { data: trends }   = useAnalyticsTrends();
  const { activities }     = useActivities();

  const maxHR = parseInt(localStorage.getItem("runlytics_maxHR") || "190", 10);

  const vo2max      = useMemo(() => estimateVO2Max(activities), [activities]);
  const vo2cat      = useMemo(() => vo2MaxCategory(vo2max), [vo2max]);
  const weekLoad    = useMemo(() => currentWeekLoad(activities, maxHR), [activities, maxHR]);
  const loadCat     = useMemo(() => loadCategory(weekLoad), [weekLoad]);
  const loadHistory = useMemo(() => weeklyTrainingLoads(activities, maxHR, 8), [activities, maxHR]);
  const injuryRisk  = useMemo(() => detectInjuryRisk(activities), [activities]);
  const fatigue     = useMemo(() => detectFatigue(activities), [activities]);
  const zoneDist    = useMemo(() => weeklyZoneDistribution(activities, maxHR), [activities, maxHR]);
  const hasZoneData = zoneDist.some((z) => z.minutes > 0);
  const totalZoneMins = zoneDist.reduce((s, z) => s + z.minutes, 0);

  const recommendations = useMemo(() => {
    if (!trends) return [];
    const recs = [];
    const recent8 = (trends.weekly ?? []).slice(-8);
    const avgPerWeek = recent8.length ? recent8.reduce((s, w) => s + w.count, 0) / recent8.length : 0;

    if (avgPerWeek < 2) {
      recs.push({ icon: "💡", title: "Build workout frequency", desc: `You're averaging ${avgPerWeek.toFixed(1)} workouts/week over the last 8 weeks. Gradually adding one more session can boost fitness significantly.`, color: "var(--accent)" });
    } else if (avgPerWeek < 4) {
      recs.push({ icon: "📈", title: "Good consistency", desc: `Averaging ${avgPerWeek.toFixed(1)} workouts/week. Consider adding a tempo or interval session to push your pace further.`, color: "var(--green)" });
    } else {
      recs.push({ icon: "🏆", title: "High training frequency", desc: `${avgPerWeek.toFixed(1)} workouts/week — great commitment. Ensure you have at least one full rest day between hard efforts.`, color: "var(--purple)" });
    }

    const paceTrend = trends.paceTrend ?? [];
    if (paceTrend.length >= 4) {
      const recentPace = paceTrend.slice(-2).reduce((s, p) => s + p.pace, 0) / 2;
      const olderPace  = paceTrend.slice(0, 2).reduce((s, p) => s + p.pace, 0) / 2;
      if (recentPace < olderPace - 0.1) {
        recs.push({ icon: "🚀", title: "Pace is improving", desc: `Recent runs average ${fmtPace(recentPace, "Run")}, faster than your earlier ${fmtPace(olderPace, "Run")}. Keep it up!`, color: "var(--green)" });
      } else if (recentPace > olderPace + 0.1) {
        recs.push({ icon: "😴", title: "Recovery may help", desc: `Your pace has slowed from ${fmtPace(olderPace, "Run")} to ${fmtPace(recentPace, "Run")}. Consider an easier recovery week.`, color: "var(--orange)" });
      } else {
        recs.push({ icon: "📊", title: "Pace is steady", desc: `Your pace has been consistent at around ${fmtPace(recentPace, "Run")}. To break through, try adding one speed session per week.`, color: "var(--accent)" });
      }
    }

    const typeDist = trends.typeDistribution ?? [];
    if (typeDist.length === 1) {
      recs.push({ icon: "🔄", title: "Mix up your training", desc: `You only log ${typeDist[0].type}s. Adding cross-training like cycling or swimming can improve recovery and reduce injury risk.`, color: "var(--purple)" });
    }

    const maxWeekCount = Math.max(...recent8.map((w) => w.count), 0);
    if (maxWeekCount >= 6) {
      recs.push({ icon: "🛌", title: "Protect recovery days", desc: "You had weeks with 6+ sessions. At least one rest day per week is essential for muscle adaptation and injury prevention.", color: "var(--orange)" });
    }

    return recs;
  }, [trends]);

  const weeklyFreq = (trends?.weekly ?? []).slice(-12).map((w, i) => ({ week: `W${i + 1}`, count: w.count }));

  if (loading || !data) return <Spinner />;

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text1)", margin: 0 }}>Performance Intelligence</h1>
        <p style={{ fontSize: 13, color: "var(--text3)", margin: "4px 0 0" }}>Derived from your Strava training data</p>
      </div>

      {/* Alert banners */}
      {injuryRisk && (
        <AlertBanner level={injuryRisk.level}>
          <strong>Injury Risk {injuryRisk.level === "high" ? "(High)" : "(Moderate)"}:</strong> Weekly mileage jumped {injuryRisk.pct}% — from {injuryRisk.lastWeek} km to {injuryRisk.thisWeek} km. The 10% rule suggests keeping increases under 10% to avoid overuse injuries.
        </AlertBanner>
      )}
      {fatigue && (
        <AlertBanner level={fatigue.level}>
          <strong>Fatigue Signal {fatigue.level === "high" ? "(High)" : "(Moderate)"}:</strong> Your pace has slowed {fatigue.pct}% compared to recent weeks. Consider an easier recovery week before your next hard effort.
        </AlertBanner>
      )}

      {/* Key metrics */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }} className="fade-up">
        <MetricCard
          label="VO2 Max"
          value={vo2max ? vo2max.toFixed(1) : "—"}
          subValue={vo2max ? "ml/kg/min · Daniels' VDOT" : "Need runs ≥ 2 km to calculate"}
          color={vo2cat?.color}
          badge={vo2cat}
        />
        <MetricCard
          label="Weekly Training Load"
          value={weekLoad}
          subValue="TRIMP score this week"
          color={loadCat.color}
          badge={loadCat}
        />
        <MetricCard
          label="Training Status"
          value={injuryRisk || fatigue ? "Flagged" : "All Clear"}
          subValue={injuryRisk || fatigue ? "See alerts above" : "No overtraining signals"}
          color={injuryRisk || fatigue ? "#f97316" : "#00ff9d"}
        />
      </div>

      {/* 8-week Training Load bar chart */}
      <Card className="fade-up fade-up-1" style={{ marginBottom: 24 }}>
        <CardHeader title="8-Week Training Load (TRIMP)" />
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={loadHistory}>
            <XAxis dataKey="week" tick={{ fill: "#4a5a7a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#4a5a7a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TS} formatter={(v) => [v, "Load"]} />
            <Bar dataKey="load" radius={[4, 4, 0, 0]}>
              {loadHistory.map((entry, i) => (
                <Cell key={i} fill={loadCategory(entry.load).color} opacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Weekly HR Zone Distribution */}
      {hasZoneData && (
        <Card className="fade-up fade-up-1" style={{ marginBottom: 24 }}>
          <CardHeader title="This Week — HR Zone Distribution" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "4px 0" }}>
            {zoneDist.map((z) => {
              const pct = totalZoneMins > 0 ? (z.minutes / totalZoneMins) * 100 : 0;
              return (
                <div key={z.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 90, fontSize: 11, fontWeight: 700, color: z.color, flexShrink: 0 }}>{z.name}</div>
                  <div style={{ flex: 1, height: 10, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: z.color, borderRadius: 99, transition: "width 0.6s ease" }} />
                  </div>
                  <div style={{ width: 56, fontSize: 11, color: "var(--text3)", textAlign: "right", flexShrink: 0 }}>
                    {z.minutes > 0 ? `${z.minutes} min` : "—"}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 12, lineHeight: 1.5 }}>
            Approximated from per-activity average HR. Set your max HR in Profile for better accuracy.
          </div>
        </Card>
      )}

      {/* Smart insight cards */}
      <div className="insight-grid fade-up fade-up-2">
        {(data.insights ?? []).map((ins, i) => (
          <div key={ins.key} className="insight-card">
            <div className="insight-icon" style={{ background: `${ICON_COLORS[i % ICON_COLORS.length]}18`, color: ICON_COLORS[i % ICON_COLORS.length] }}>
              {ins.icon}
            </div>
            <div>
              <div className="insight-title" style={{ color: ICON_COLORS[i % ICON_COLORS.length] }}>{ins.value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--text3)", marginBottom: 2 }}>{ins.label}</div>
              <div className="insight-desc">{ins.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly frequency chart */}
      <Card className="fade-up fade-up-3" style={{ marginBottom: 24 }}>
        <CardHeader title="Weekly Workout Frequency — 12 Weeks" />
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weeklyFreq}>
            <XAxis dataKey="week" tick={{ fill: "#4a5a7a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#4a5a7a", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={TS} />
            <Bar dataKey="count" fill="#b87aff" radius={[4, 4, 0, 0]} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Smart recommendations */}
      {recommendations.length > 0 && (
        <Card className="fade-up fade-up-3">
          <CardHeader title="🎯 Smart Recommendations" />
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {recommendations.map((rec, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: i < recommendations.length - 1 ? "1px solid var(--border)" : "none" }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{rec.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: rec.color, marginBottom: 2 }}>{rec.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5 }}>{rec.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
