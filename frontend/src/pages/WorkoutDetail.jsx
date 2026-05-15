import { useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { actIcon, actClass, fmtDist, fmtDur, fmtPace, fmtDate, calcPace } from "../utils/formatters.js";
import { Card, CardHeader, Tag, Spinner } from "../components/ui/index.jsx";
import RouteMap from "../components/ui/RouteMap.jsx";
import { useActivity } from "../hooks/useActivities.js";

const TOOLTIP_STYLE = {
  background: "#141c2e", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, fontSize: 12,
};

export default function WorkoutDetail({ activity: listActivity, onBack }) {
  // All hooks must be at the top — no early returns before this block
  const { activity: detail, loading: detailLoading } = useActivity(listActivity?.id);
  const activity = detail || listActivity;
  const pace = calcPace(activity ?? {});

  const hrData = useMemo(() => {
    if (!activity?.average_heartrate) return [];
    const pts = 20;
    return Array.from({ length: pts }, (_, i) => {
      const prog = i / (pts - 1);
      const drift = Math.sin(prog * Math.PI) * 8 - (1 - prog) * 5;
      return {
        t: `${Math.round(prog * activity.moving_time / 60)}m`,
        hr: Math.round(activity.average_heartrate + drift),
      };
    });
  }, [activity]);

  const paceData = useMemo(() => {
    if (!activity?.distance || activity.type === "Workout") return [];
    if (activity.splits_metric?.length) {
      return activity.splits_metric.map((s) => ({
        km: `${s.split} km`,
        pace: s.moving_time > 0 && s.distance > 0
          ? +(s.moving_time / 60 / (s.distance / 1000)).toFixed(2)
          : pace,
      }));
    }
    return [{ km: "Avg", pace: +pace.toFixed(2) }];
  }, [activity, pace]);

  if (!listActivity) return <Spinner />;

  return (
    <div className="page-content">
      <div className="back-btn fade-up" onClick={onBack}>← Back to Activities</div>
      {detailLoading && (
        <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 8 }}>
          Loading full activity data…
        </div>
      )}

      {/* Hero */}
      <div className="detail-hero fade-up fade-up-1">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div className={`workout-type-badge ${actClass(activity.type)}`} style={{ width: 48, height: 48, borderRadius: 12, fontSize: 22 }}>
            {actIcon(activity.type)}
          </div>
          <Tag>{activity.type}</Tag>
          <Tag>{fmtDate(activity.start_date_local)}</Tag>
        </div>

        <div className="detail-title">{activity.name}</div>

        <div className="detail-stats">
          <div className="detail-stat">
            <div className="detail-stat-val" style={{ color: "var(--accent)" }}>
              {fmtDist(activity.distance, activity.type)}
            </div>
            <div className="detail-stat-label">Distance</div>
          </div>
          <div className="detail-stat">
            <div className="detail-stat-val">{fmtDur(activity.moving_time)}</div>
            <div className="detail-stat-label">Duration</div>
          </div>
          <div className="detail-stat">
            <div className="detail-stat-val" style={{ fontSize: 20 }}>
              {fmtPace(pace, activity.type)}
            </div>
            <div className="detail-stat-label">{activity.type === "Ride" ? "Speed" : "Avg Pace"}</div>
          </div>
          <div className="detail-stat">
            <div className="detail-stat-val" style={{ color: "var(--green)" }}>
              {activity.total_elevation_gain > 0 ? `${activity.total_elevation_gain}m` : "—"}
            </div>
            <div className="detail-stat-label">Elevation</div>
          </div>
          <div className="detail-stat">
            <div className="detail-stat-val" style={{ color: "var(--orange)" }}>
              {activity.kilojoules > 0 ? Math.round(activity.kilojoules) : "—"}
            </div>
            <div className="detail-stat-label">Calories</div>
          </div>
        </div>
      </div>

      {/* Route map */}
      {!["Workout", "Swim", "WeightTraining"].includes(activity.type) && (
        <Card className="fade-up fade-up-2" style={{ marginBottom: 20 }}>
          <CardHeader title="Route Map" />
          <RouteMap activity={activity} />
        </Card>
      )}

      {/* Charts */}
      <div className="chart-wrap fade-up fade-up-3">
        {hrData.length > 0 && (
          <Card>
            <CardHeader title="Heart Rate" right={<span className="tag">{activity.average_heartrate} avg bpm</span>} />
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={hrData}>
                <defs>
                  <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ff4d6d" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ff4d6d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" tick={{ fill: "#4a5a7a", fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fill: "#4a5a7a", fontSize: 10 }} axisLine={false} tickLine={false} domain={["dataMin - 10", "dataMax + 10"]} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="hr" stroke="#ff4d6d" strokeWidth={2} fill="url(#hrGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}

        {paceData.length > 0 && (
          <Card>
            <CardHeader title="Pace per km" />
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={paceData}>
                <XAxis dataKey="km" tick={{ fill: "#4a5a7a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4a5a7a", fontSize: 10 }} axisLine={false} tickLine={false} domain={["dataMin - 0.5", "dataMax + 0.5"]} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [fmtPace(v, activity.type), "Pace"]} />
                <Bar dataKey="pace" fill="var(--accent)" radius={[4,4,0,0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    </div>
  );
}
