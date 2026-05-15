import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useInsights, useAnalyticsTrends } from "../hooks/useAnalytics.js";
import { Card, CardHeader, Spinner } from "../components/ui/index.jsx";
import { fmtPace } from "../utils/formatters.js";

const TS = { background: "#141c2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 };
const ICON_COLORS = ["#00e5ff","#00ff9d","#b87aff","#ff7040","#ffd060","#ff4d6d","#4db8ff","#00e5ff","#00ff9d"];

export default function InsightsPage() {
  const { data, loading }  = useInsights();
  const { data: trends }   = useAnalyticsTrends();

  // Data-driven recommendations from real activity patterns
  const recommendations = useMemo(() => {
    if (!trends) return [];
    const recs = [];

    const recent8 = (trends.weekly ?? []).slice(-8);
    const avgPerWeek = recent8.length
      ? recent8.reduce((s, w) => s + w.count, 0) / recent8.length
      : 0;

    if (avgPerWeek < 2) {
      recs.push({ icon:"💡", title:"Build workout frequency", desc:`You're averaging ${avgPerWeek.toFixed(1)} workouts/week over the last 8 weeks. Gradually adding one more session can boost fitness significantly.`, color:"var(--accent)" });
    } else if (avgPerWeek < 4) {
      recs.push({ icon:"📈", title:"Good consistency", desc:`Averaging ${avgPerWeek.toFixed(1)} workouts/week. Consider adding a tempo or interval session to push your pace further.`, color:"var(--green)" });
    } else {
      recs.push({ icon:"🏆", title:"High training frequency", desc:`${avgPerWeek.toFixed(1)} workouts/week — great commitment. Ensure you have at least one full rest day between hard efforts.`, color:"var(--purple)" });
    }

    // Pace trend recommendation
    const paceTrend = trends.paceTrend ?? [];
    if (paceTrend.length >= 4) {
      const recentPace = paceTrend.slice(-2).reduce((s, p) => s + p.pace, 0) / 2;
      const olderPace  = paceTrend.slice(0, 2).reduce((s, p)  => s + p.pace, 0) / 2;
      if (recentPace < olderPace - 0.1) {
        recs.push({ icon:"🚀", title:"Pace is improving", desc:`Recent runs average ${fmtPace(recentPace, "Run")}, faster than your earlier ${fmtPace(olderPace, "Run")}. Keep it up!`, color:"var(--green)" });
      } else if (recentPace > olderPace + 0.1) {
        recs.push({ icon:"😴", title:"Recovery may help", desc:`Your pace has slowed from ${fmtPace(olderPace, "Run")} to ${fmtPace(recentPace, "Run")}. Consider an easier recovery week.`, color:"var(--orange)" });
      } else {
        recs.push({ icon:"📊", title:"Pace is steady", desc:`Your pace has been consistent at around ${fmtPace(recentPace, "Run")}. To break through, try adding one speed session per week.`, color:"var(--accent)" });
      }
    }

    // Activity variety
    const typeDist = trends.typeDistribution ?? [];
    if (typeDist.length === 1) {
      recs.push({ icon:"🔄", title:"Mix up your training", desc:`You only log ${typeDist[0].type}s. Adding cross-training like cycling or swimming can improve recovery and reduce injury risk.`, color:"var(--purple)" });
    }

    // Rest day check
    const maxWeekCount = Math.max(...recent8.map((w) => w.count), 0);
    if (maxWeekCount >= 6) {
      recs.push({ icon:"🛌", title:"Protect recovery days", desc:"You had weeks with 6+ sessions. At least one rest day per week is essential for muscle adaptation and injury prevention.", color:"var(--orange)" });
    }

    return recs;
  }, [trends]);

  const weeklyFreq = (trends?.weekly ?? []).slice(-12).map((w, i) => ({ week: `W${i+1}`, count: w.count }));

  if (loading || !data) return <Spinner />;

  return (
    <div className="page-content">
      {/* Smart insight cards from real data */}
      <div className="insight-grid fade-up">
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
      <Card className="fade-up fade-up-1" style={{ marginBottom: 24 }}>
        <CardHeader title="Weekly Workout Frequency — 12 Weeks" />
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weeklyFreq}>
            <XAxis dataKey="week" tick={{ fill: "#4a5a7a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#4a5a7a", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={TS} />
            <Bar dataKey="count" fill="#b87aff" radius={[4,4,0,0]} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Recommendations generated from real activity patterns */}
      {recommendations.length > 0 && (
        <Card className="fade-up fade-up-2">
          <CardHeader title="🎯 Smart Recommendations" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recommendations.map((rec, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 20 }}>{rec.icon}</span>
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
