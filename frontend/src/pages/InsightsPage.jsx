import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useInsights, useAnalyticsTrends } from "../hooks/useAnalytics.js";
import { Card, CardHeader, Spinner } from "../components/ui/index.jsx";

const TS = { background: "#141c2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 };

const ICON_COLORS = ["#00e5ff","#00ff9d","#b87aff","#ff7040","#ffd060","#ff4d6d","#4db8ff","#00e5ff","#00ff9d"];

const RECOMMENDATIONS = [
  { icon:"💡", title:"Maintain 3 runs/week",   desc:"Your data shows best progress when training three times per week consistently.", color:"var(--accent)" },
  { icon:"📈", title:"Add one tempo run",       desc:"A weekly tempo at 5:30/km will accelerate your sub-70 10K goal.", color:"var(--green)" },
  { icon:"🔄", title:"Long run on weekends",    desc:"Schedule your longest run for Saturday when you have the most time.", color:"var(--purple)" },
  { icon:"😴", title:"Protect recovery days",  desc:"At least one full rest day between hard sessions drives adaptation.", color:"var(--orange)" },
];

export default function InsightsPage() {
  const { data, loading }     = useInsights();
  const { data: trends }      = useAnalyticsTrends();

  if (loading || !data) return <Spinner />;

  const weeklyFreq = (trends?.weekly ?? []).slice(-12).map((w, i) => ({ week: `W${i+1}`, count: w.count }));

  return (
    <div className="page-content">
      {/* Smart insight cards */}
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

      {/* Recommendations */}
      <Card className="fade-up fade-up-2">
        <CardHeader title="🎯 Smart Recommendations" />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {RECOMMENDATIONS.map((rec, i) => (
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
    </div>
  );
}
