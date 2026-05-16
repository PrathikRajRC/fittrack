import { useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { actIcon, actClass, fmtDist, fmtDur, fmtPace, fmtDate, calcPace } from "../utils/formatters.js";
import { Card, CardHeader, Tag, Spinner } from "../components/ui/index.jsx";
import RouteMap from "../components/ui/RouteMap.jsx";
import { useActivity, useActivityStreams } from "../hooks/useActivities.js";

const TOOLTIP_STYLE = {
  background: "#141c2e", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, fontSize: 12,
};

// Downsample an array to at most n points for chart performance
function downsample(arr, n = 100) {
  if (!arr || arr.length <= n) return arr || [];
  const step = arr.length / n;
  return Array.from({ length: n }, (_, i) => arr[Math.round(i * step)]);
}

// HR zone thresholds (as % of estimated max HR) and display config
const HR_ZONES = [
  { name: "Z1 Recovery",  max: 0.60, color: "#4ade80" },
  { name: "Z2 Aerobic",   max: 0.70, color: "#86efac" },
  { name: "Z3 Tempo",     max: 0.80, color: "#fbbf24" },
  { name: "Z4 Threshold", max: 0.90, color: "#f97316" },
  { name: "Z5 VO2 Max",   max: 1.00, color: "#ef4444" },
];

function calcHRZones(hrData) {
  if (!hrData?.length) return null;
  // Use peak HR from this session with a 5% buffer as estimated max HR
  const peakHR  = Math.max(...hrData);
  const maxHR   = Math.round(peakHR / 0.95);
  const counts  = new Array(5).fill(0);
  let prev = 0;
  HR_ZONES.forEach(({ max }, zi) => {
    hrData.forEach((hr) => {
      if (hr >= maxHR * prev && hr < maxHR * max) counts[zi]++;
    });
    prev = max;
  });
  const total = hrData.length;
  return HR_ZONES.map((z, i) => ({
    ...z,
    pct:   Math.round((counts[i] / total) * 100),
    count: counts[i],
  }));
}

// Non-GPS activity types that have no route
const NO_MAP_TYPES = new Set(["Workout", "Swim", "WeightTraining", "Yoga", "Crossfit", "Elliptical", "StairStepper"]);

export default function WorkoutDetail({ activity: listActivity, onBack }) {
  const { activity: detail, loading: detailLoading } = useActivity(listActivity?.id);
  const { streams }                                   = useActivityStreams(listActivity?.id);
  const activity = detail || listActivity;
  const pace     = calcPace(activity ?? {});

  // ── Stream data ────────────────────────────────────────────────────────────
  const hrRaw      = streams?.heartrate?.data;
  const altRaw     = streams?.altitude?.data;
  const cadenceRaw = streams?.cadence?.data;
  const wattsRaw   = streams?.watts?.data;
  const timeRaw    = streams?.time?.data;

  // ── Heart rate (real stream preferred, simulated fallback) ─────────────────
  const hrData = useMemo(() => {
    if (hrRaw?.length) {
      const times = downsample(timeRaw || [], 80);
      const hrs   = downsample(hrRaw, 80);
      return hrs.map((hr, i) => ({
        t:  timeRaw ? `${Math.round(times[i] / 60)}m` : `${i}`,
        hr: Math.round(hr),
      }));
    }
    if (!activity?.average_heartrate) return [];
    const pts = 20;
    return Array.from({ length: pts }, (_, i) => {
      const prog  = i / (pts - 1);
      const drift = Math.sin(prog * Math.PI) * 8 - (1 - prog) * 5;
      return {
        t:  `${Math.round(prog * activity.moving_time / 60)}m`,
        hr: Math.round(activity.average_heartrate + drift),
      };
    });
  }, [hrRaw, timeRaw, activity]);

  // ── Elevation profile ─────────────────────────────────────────────────────
  const elevData = useMemo(() => {
    if (!altRaw?.length) return [];
    const alts  = downsample(altRaw, 100);
    const times = downsample(timeRaw || [], 100);
    return alts.map((alt, i) => ({
      t:   timeRaw ? `${Math.round(times[i] / 60)}m` : `${i}`,
      alt: Math.round(alt),
    }));
  }, [altRaw, timeRaw]);

  // ── Pace per km (from splits_metric) ─────────────────────────────────────
  const paceData = useMemo(() => {
    if (!activity?.distance || activity.type === "Workout") return [];
    if (activity.splits_metric?.length) {
      return activity.splits_metric.map((s) => ({
        km:   `${s.split} km`,
        pace: s.moving_time > 0 && s.distance > 0
          ? +(s.moving_time / 60 / (s.distance / 1000)).toFixed(2)
          : pace,
      }));
    }
    return [{ km: "Avg", pace: +pace.toFixed(2) }];
  }, [activity, pace]);

  // ── Cadence chart ──────────────────────────────────────────────────────────
  const cadenceData = useMemo(() => {
    if (!cadenceRaw?.length) return [];
    const cads  = downsample(cadenceRaw, 80);
    const times = downsample(timeRaw || [], 80);
    return cads.map((c, i) => ({
      t:       timeRaw ? `${Math.round(times[i] / 60)}m` : `${i}`,
      cadence: Math.round(c),
    }));
  }, [cadenceRaw, timeRaw]);

  // ── Power chart ────────────────────────────────────────────────────────────
  const powerData = useMemo(() => {
    if (!wattsRaw?.length) return [];
    const watts = downsample(wattsRaw, 80);
    const times = downsample(timeRaw || [], 80);
    return watts.map((w, i) => ({
      t:     timeRaw ? `${Math.round(times[i] / 60)}m` : `${i}`,
      watts: Math.round(w),
    }));
  }, [wattsRaw, timeRaw]);

  // ── HR zones ──────────────────────────────────────────────────────────────
  const hrZones = useMemo(() => calcHRZones(hrRaw), [hrRaw]);

  // ── Splits table ──────────────────────────────────────────────────────────
  const splits = activity?.splits_metric || [];

  // ── Segment efforts ───────────────────────────────────────────────────────
  const segments = activity?.segment_efforts || [];

  if (!listActivity) return <Spinner />;

  return (
    <div className="page-content">
      <div className="back-btn fade-up" onClick={onBack}>← Back to Activities</div>
      {detailLoading && (
        <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 8 }}>
          Loading full activity data…
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="detail-hero fade-up fade-up-1">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div className={`workout-type-badge ${actClass(activity.type)}`} style={{ width: 48, height: 48, borderRadius: 12, fontSize: 22 }}>
            {actIcon(activity.type)}
          </div>
          <Tag>{activity.type}</Tag>
          <Tag>{fmtDate(activity.start_date_local)}</Tag>
          {activity.gear?.name && <Tag>👟 {activity.gear.name}</Tag>}
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
              {activity.total_elevation_gain > 0 ? `${Math.round(activity.total_elevation_gain)}m` : "—"}
            </div>
            <div className="detail-stat-label">Elevation</div>
          </div>
          <div className="detail-stat">
            <div className="detail-stat-val" style={{ color: "var(--orange)" }}>
              {activity.kilojoules > 0 ? Math.round(activity.kilojoules) : "—"}
            </div>
            <div className="detail-stat-label">Calories</div>
          </div>
          {activity.average_cadence > 0 && (
            <div className="detail-stat">
              <div className="detail-stat-val" style={{ color: "var(--purple)" }}>
                {Math.round(activity.average_cadence * (activity.type === "Run" ? 2 : 1))}
              </div>
              <div className="detail-stat-label">{activity.type === "Run" ? "Steps/min" : "RPM"}</div>
            </div>
          )}
          {activity.average_watts > 0 && (
            <div className="detail-stat">
              <div className="detail-stat-val" style={{ color: "#facc15" }}>
                {Math.round(activity.average_watts)}W
              </div>
              <div className="detail-stat-label">Avg Power</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Real GPS Route Map ───────────────────────────────────────────── */}
      {!NO_MAP_TYPES.has(activity.type) && (
        <Card className="fade-up fade-up-2" style={{ marginBottom: 20 }}>
          <CardHeader title="Route Map" right={<Tag>Real GPS</Tag>} />
          <RouteMap activity={activity} />
        </Card>
      )}

      {/* ── Elevation Profile ────────────────────────────────────────────── */}
      {elevData.length > 0 && (
        <Card className="fade-up fade-up-2" style={{ marginBottom: 20 }}>
          <CardHeader
            title="Elevation Profile"
            right={
              <span className="tag">
                +{Math.round(activity.total_elevation_gain || 0)}m gain
              </span>
            }
          />
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={elevData}>
              <defs>
                <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" tick={{ fill: "#4a5a7a", fontSize: 10 }} axisLine={false} tickLine={false} interval={19} />
              <YAxis tick={{ fill: "#4a5a7a", fontSize: 10 }} axisLine={false} tickLine={false} unit="m" />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v}m`, "Altitude"]} />
              <Area type="monotone" dataKey="alt" stroke="#22c55e" strokeWidth={2} fill="url(#elevGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ── HR Chart + Pace Chart ────────────────────────────────────────── */}
      <div className="chart-wrap fade-up fade-up-3">
        {hrData.length > 0 && (
          <Card>
            <CardHeader
              title="Heart Rate"
              right={
                <span className="tag">
                  {activity.average_heartrate} avg bpm
                  {hrRaw?.length ? " · live" : " · est."}
                </span>
              }
            />
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={hrData}>
                <defs>
                  <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ff4d6d" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ff4d6d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" tick={{ fill: "#4a5a7a", fontSize: 10 }} axisLine={false} tickLine={false} interval={9} />
                <YAxis tick={{ fill: "#4a5a7a", fontSize: 10 }} axisLine={false} tickLine={false} domain={["dataMin - 10", "dataMax + 10"]} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v} bpm`, "HR"]} />
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
                <Bar dataKey="pace" fill="var(--accent)" radius={[4, 4, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* ── HR Zones ──────────────────────────────────────────────────────── */}
      {hrZones && (
        <Card className="fade-up fade-up-3" style={{ marginBottom: 20 }}>
          <CardHeader title="Heart Rate Zones" right={<Tag>Z1–Z5</Tag>} />
          {/* Stacked zone bar */}
          <div style={{ display: "flex", height: 24, borderRadius: 8, overflow: "hidden", marginBottom: 16, gap: 2 }}>
            {hrZones.map((z) =>
              z.pct > 0 ? (
                <div
                  key={z.name}
                  style={{ width: `${z.pct}%`, background: z.color, transition: "width 0.4s ease" }}
                  title={`${z.name}: ${z.pct}%`}
                />
              ) : null
            )}
          </div>
          {/* Zone legend */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {hrZones.map((z) => (
              <div key={z.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: z.color, flexShrink: 0 }} />
                <span style={{ color: "var(--text2)" }}>{z.name}</span>
                <span style={{ fontWeight: 700, color: z.color }}>{z.pct}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Cadence & Power charts ────────────────────────────────────────── */}
      {(cadenceData.length > 0 || powerData.length > 0) && (
        <div className="chart-wrap fade-up fade-up-3">
          {cadenceData.length > 0 && (
            <Card>
              <CardHeader
                title="Cadence"
                right={
                  <span className="tag">
                    {activity.average_cadence
                      ? `${Math.round(activity.average_cadence * (activity.type === "Run" ? 2 : 1))} avg`
                      : ""}
                  </span>
                }
              />
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={cadenceData}>
                  <XAxis dataKey="t" tick={{ fill: "#4a5a7a", fontSize: 10 }} axisLine={false} tickLine={false} interval={9} />
                  <YAxis tick={{ fill: "#4a5a7a", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v} rpm`, "Cadence"]} />
                  <Line type="monotone" dataKey="cadence" stroke="#b87aff" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {powerData.length > 0 && (
            <Card>
              <CardHeader
                title="Power"
                right={
                  <span className="tag">
                    {activity.average_watts ? `${Math.round(activity.average_watts)}W avg` : ""}
                  </span>
                }
              />
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={powerData}>
                  <defs>
                    <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#facc15" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" tick={{ fill: "#4a5a7a", fontSize: 10 }} axisLine={false} tickLine={false} interval={9} />
                  <YAxis tick={{ fill: "#4a5a7a", fontSize: 10 }} axisLine={false} tickLine={false} unit="W" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v}W`, "Power"]} />
                  {activity.average_watts > 0 && (
                    <ReferenceLine y={Math.round(activity.average_watts)} stroke="#facc15" strokeDasharray="4 3" strokeOpacity={0.6} />
                  )}
                  <Area type="monotone" dataKey="watts" stroke="#facc15" strokeWidth={2} fill="url(#powerGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}

      {/* ── Splits Table ──────────────────────────────────────────────────── */}
      {splits.length > 1 && (
        <Card className="fade-up fade-up-3" style={{ marginBottom: 20 }}>
          <CardHeader title="Splits" right={<Tag>{splits.length} km</Tag>} />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Km", "Distance", "Time", "Pace", "Elev"].map((h) => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: "right", color: "var(--text3)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {splits.map((s, idx) => {
                  const splitPace = s.moving_time > 0 && s.distance > 0
                    ? s.moving_time / 60 / (s.distance / 1000)
                    : 0;
                  const avgSplitPace = splits.reduce((acc, sp) => {
                    const p = sp.moving_time > 0 && sp.distance > 0 ? sp.moving_time / 60 / (sp.distance / 1000) : 0;
                    return acc + p;
                  }, 0) / splits.length;
                  const isFast = splitPace > 0 && splitPace < avgSplitPace;
                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border)", opacity: 0.9 }}>
                      <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 700, color: "var(--accent)" }}>
                        {s.split}
                      </td>
                      <td style={{ padding: "7px 10px", textAlign: "right", color: "var(--text2)" }}>
                        {(s.distance / 1000).toFixed(2)} km
                      </td>
                      <td style={{ padding: "7px 10px", textAlign: "right", color: "var(--text2)" }}>
                        {fmtDur(s.elapsed_time)}
                      </td>
                      <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 600, color: isFast ? "var(--green)" : "var(--text1)" }}>
                        {splitPace > 0 ? fmtPace(splitPace, "Run") : "—"}
                      </td>
                      <td style={{ padding: "7px 10px", textAlign: "right", color: s.elevation_difference > 0 ? "var(--orange)" : "var(--green)" }}>
                        {s.elevation_difference != null ? `${s.elevation_difference > 0 ? "+" : ""}${Math.round(s.elevation_difference)}m` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Segment Efforts ───────────────────────────────────────────────── */}
      {segments.length > 0 && (
        <Card className="fade-up fade-up-3" style={{ marginBottom: 20 }}>
          <CardHeader title="Segments" right={<Tag>{segments.length} efforts</Tag>} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {segments.slice(0, 8).map((seg, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#0d1320", flexShrink: 0 }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {seg.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                    {seg.distance > 0 ? `${(seg.distance / 1000).toFixed(2)} km` : ""}
                    {seg.average_heartrate ? ` · ${Math.round(seg.average_heartrate)} bpm avg` : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800, color: "var(--accent)" }}>
                    {fmtDur(seg.elapsed_time)}
                  </div>
                  {seg.pr_rank === 1 && (
                    <div style={{ fontSize: 10, color: "#facc15", fontWeight: 700 }}>PR</div>
                  )}
                  {seg.pr_rank === 2 && (
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>2nd</div>
                  )}
                  {seg.pr_rank === 3 && (
                    <div style={{ fontSize: 10, color: "#cd7f32", fontWeight: 700 }}>3rd</div>
                  )}
                </div>
              </div>
            ))}
            {segments.length > 8 && (
              <div style={{ fontSize: 12, color: "var(--text3)", textAlign: "center", paddingTop: 4 }}>
                +{segments.length - 8} more segments
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
