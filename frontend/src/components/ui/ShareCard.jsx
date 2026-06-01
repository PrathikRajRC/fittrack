import { useRef, useState, useMemo } from "react";
import { toPng } from "html-to-image";
import { actIcon, actColor, fmtDur, fmtPace, fmtDate, calcPace } from "../../utils/formatters.js";

// ── Polyline decoding ─────────────────────────────────────────────────────────
function decodePolyline(str) {
  const pts = [];
  let i = 0, lat = 0, lng = 0;
  while (i < str.length) {
    let b, shift = 0, result = 0;
    do { b = str.charCodeAt(i++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = str.charCodeAt(i++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    pts.push([lat / 1e5, lng / 1e5]);
  }
  return pts;
}

function buildPath(latlngs, w, h, padding = 18) {
  if (!latlngs?.length) return { d: "", start: null, end: null };
  const lats = latlngs.map((p) => p[0]);
  const lngs = latlngs.map((p) => p[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const dLat = Math.max(0.00001, maxLat - minLat);
  const dLng = Math.max(0.00001, maxLng - minLng);
  const scale = Math.min((w - padding * 2) / dLng, (h - padding * 2) / dLat);
  const offsetX = (w - dLng * scale) / 2;
  const offsetY = (h - dLat * scale) / 2;
  const points = latlngs.map(([la, ln]) => [
    offsetX + (ln - minLng) * scale,
    offsetY + (maxLat - la) * scale,
  ]);
  const d = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return { d, start: points[0], end: points[points.length - 1] };
}

// Generate stylized topographic contour lines as SVG paths
function topoLines(w, h, seed = 1) {
  // Deterministic pseudo-random from seed
  let s = seed;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const lines = [];
  const cx = w * (0.35 + rand() * 0.3);
  const cy = h * (0.45 + rand() * 0.2);
  for (let i = 0; i < 14; i++) {
    const r = 30 + i * 26;
    const wobble = 0.18 + rand() * 0.1;
    const pts = [];
    const segs = 36;
    for (let k = 0; k <= segs; k++) {
      const a = (k / segs) * Math.PI * 2;
      const rr = r * (1 + Math.sin(a * 2.2 + i) * wobble + Math.cos(a * 1.7 + i * 0.7) * (wobble * 0.6));
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    lines.push(pts.map((p, k) => `${k === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + " Z");
  }
  return lines;
}

const FORMATS = {
  story:     { label: "Story",     ratio: "4 / 5"  },
  square:    { label: "Square",    ratio: "1 / 1"  },
  landscape: { label: "Landscape", ratio: "16 / 9" },
};

const CARBON_FIBER = `
  repeating-linear-gradient(45deg,  rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 4px),
  repeating-linear-gradient(-45deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 4px),
  radial-gradient(ellipse at top, #1a1f2a 0%, #0a0d14 100%)
`;

// ── Reusable bits ─────────────────────────────────────────────────────────────
function MetallicChip({ activity }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: "linear-gradient(180deg, #e8eaed 0%, #b4b8be 35%, #888c92 65%, #c4c6ca 100%)",
      border: "1px solid rgba(0,0,0,0.3)",
      borderRadius: 99, padding: "6px 14px 6px 8px",
      boxShadow: "inset 0 1px 1px rgba(255,255,255,0.7), inset 0 -1px 1px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.5)",
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        background: "radial-gradient(circle at 30% 30%, #2a2e36, #0a0c10)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "inset 0 0 4px rgba(0,0,0,0.6)",
      }}>
        <span style={{ fontSize: 13, filter: "drop-shadow(0 0 2px rgba(255,255,255,0.3))" }}>
          {actIcon(activity.type)}
        </span>
      </div>
      <span style={{
        fontSize: 12, fontWeight: 900, letterSpacing: 1.8,
        textTransform: "uppercase",
        color: "#1a1d23",
        textShadow: "0 1px 0 rgba(255,255,255,0.4)",
      }}>{activity.type}</span>
    </div>
  );
}

function NeonNumber({ value, sublabel, accent, accentLight, sizePx }) {
  return (
    <div>
      <div style={{
        fontFamily: "var(--font-display)",
        fontSize: sizePx, fontWeight: 900, lineHeight: 0.9,
        letterSpacing: "-0.04em",
        color: accentLight,
        textShadow: `
          0 0 6px ${accent}cc,
          0 0 14px ${accent}aa,
          0 0 28px ${accent}88,
          0 0 50px ${accent}55
        `,
      }}>{value}</div>
      <div style={{
        fontSize: 12, fontWeight: 800, letterSpacing: 3,
        textTransform: "uppercase", color: "rgba(255,255,255,0.55)",
        marginTop: 8,
        textShadow: "0 0 4px rgba(0,0,0,0.6)",
      }}>{sublabel}</div>
    </div>
  );
}

function MiniBars({ values, accent, accentLight, height = 26, gap = 2 }) {
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap, height }}>
      {values.map((v, i) => {
        const h = Math.max(3, (v / max) * height);
        return (
          <div key={i} style={{
            flex: 1, height: h,
            background: `linear-gradient(180deg, ${accentLight}, ${accent})`,
            borderRadius: 2,
            boxShadow: `0 0 6px ${accent}66`,
          }} />
        );
      })}
    </div>
  );
}

function StatCard({ icon, iconAccent, secondaryIcon, label, value, sub, accent, accentLight, viz, postViz }) {
  return (
    <div style={{
      position: "relative",
      background: "linear-gradient(180deg, #1a1e28 0%, #0a0d14 100%)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 14,
      padding: "12px 14px 14px",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 3px 8px rgba(0,0,0,0.4)",
      display: "flex", flexDirection: "column",
      minWidth: 0,
      minHeight: 0,
    }}>
      {/* Label row with icon (+ optional secondary icon on the right) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 14, filter: `drop-shadow(0 0 4px ${iconAccent || accent}aa)` }}>{icon}</span>
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: 1.4,
            textTransform: "uppercase", color: "rgba(255,255,255,0.55)",
          }}>{label}</span>
        </div>
        {secondaryIcon && (
          <span style={{ fontSize: 13, filter: "drop-shadow(0 0 4px rgba(255,77,109,0.7))" }}>{secondaryIcon}</span>
        )}
      </div>

      {/* Optional viz above value (mini equalizer) */}
      {viz && <div style={{ marginBottom: 6 }}>{viz}</div>}

      {/* Big value */}
      <div style={{
        fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 900,
        color: "#ffffff", lineHeight: 1, letterSpacing: "-0.01em",
      }}>{value}</div>

      {/* Optional viz below value (split bars) */}
      {postViz && <div style={{ marginTop: 8 }}>{postViz}</div>}

      {/* Sub info — sits at the bottom; auto-grow above pushes it down */}
      {sub && (
        <div style={{
          fontSize: 9.5, color: "rgba(255,255,255,0.5)",
          marginTop: 8, fontWeight: 700, letterSpacing: 0.8, lineHeight: 1.5,
        }}>{sub}</div>
      )}
    </div>
  );
}

// Topographic background — standalone layer covering the entire hero region
function TopoBackground({ accent, seed, viewW = 600, viewH = 360 }) {
  const lines = useMemo(() => topoLines(viewW, viewH, seed), [viewW, viewH, seed]);
  return (
    <svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <g opacity="0.4">
        {lines.map((d, i) => (
          <path
            key={i} d={d}
            fill="none"
            stroke={accent}
            strokeWidth={0.8}
            opacity={0.16 + (i % 3) * 0.07}
          />
        ))}
      </g>
    </svg>
  );
}

// Route trace — only the route path, no topo background
function RouteTrace({ latlngs, accent, accentLight, viewW, viewH, idSuffix }) {
  const { d, start, end } = useMemo(
    () => buildPath(latlngs, viewW, viewH, 14),
    [latlngs, viewW, viewH]
  );

  return (
    <svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <filter id={`neon-${idSuffix}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="b1" />
          <feGaussianBlur stdDeviation="6"   result="b2" />
          <feGaussianBlur stdDeviation="12"  result="b3" />
          <feMerge>
            <feMergeNode in="b3" />
            <feMergeNode in="b2" />
            <feMergeNode in="b1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {d ? (
        <>
          <path d={d} stroke={accent} strokeOpacity="0.4" strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round" filter={`url(#neon-${idSuffix})`} />
          <path d={d} stroke="#ffffff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d={d} stroke={accentLight} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
          {start && <circle cx={start[0]} cy={start[1]} r="5" fill="#ffffff" />}
          {end && (
            <>
              <circle cx={end[0]} cy={end[1]} r="7" fill={accent} opacity="0.4" />
              <circle cx={end[0]} cy={end[1]} r="4" fill="#ffffff" />
            </>
          )}
        </>
      ) : (
        <text x={viewW / 2} y={viewH / 2} textAnchor="middle" fill="rgba(255,255,255,0.3)"
          style={{ fontSize: 12, fontFamily: "var(--font-body)", letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}
        >NO GPS ROUTE</text>
      )}
    </svg>
  );
}

// Hero region — distance left, route right, no background panel
function Hero({ km, accent, accentLight, sizePx, latlngs, idSuffix }) {
  return (
    <div style={{
      flex: 1,
      minHeight: 0,
      marginTop: 14, marginBottom: 14,
      display: "flex", alignItems: "center",
      gap: 12, minWidth: 0,
    }}>
      <div style={{ flex: "0 0 40%", minWidth: 0 }}>
        <NeonNumber
          value={km.toFixed(km < 10 ? 2 : 1)}
          sublabel="KILOMETRES"
          accent={accent} accentLight={accentLight} sizePx={sizePx}
        />
      </div>
      <div style={{ flex: 1, height: "100%", minWidth: 0 }}>
        <RouteTrace
          latlngs={latlngs}
          accent={accent} accentLight={accentLight}
          viewW={360} viewH={260}
          idSuffix={idSuffix}
        />
      </div>
    </div>
  );
}

function Brandmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 26, height: 26, borderRadius: 7,
        background: "linear-gradient(180deg, #1f2330, #0a0d14)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.5)",
      }}>
        <span style={{ fontSize: 13, color: "#ffffff", filter: "drop-shadow(0 0 4px rgba(255,255,255,0.5))" }}>⚡</span>
      </div>
      <div style={{
        fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 900,
        letterSpacing: 2, color: "#ffffff",
      }}>RUNLYTICS</div>
    </div>
  );
}

// Performance insight text derived from the single activity
function deriveInsight(activity, km, pace) {
  if (pace && pace > 0) {
    if (pace < 4.5)  return { label: "Speed Work",   value: "Elite tempo 🚀", color: "#ffd060" };
    if (pace < 5.5)  return { label: "Tempo Effort", value: "Strong session 🔥", color: "#ff9040" };
    if (pace < 6.5)  return { label: "Solid Pace",   value: "Well executed ✓",  color: "#00e5ff" };
    return                  { label: "Easy Run",    value: "Recovery effort 🌿", color: "#4ade80" };
  }
  const elev = activity.total_elevation_gain;
  if (elev > 100) return { label: "Hill Session", value: `+${Math.round(elev)} m climbed 🏔️`, color: "#ff9040" };
  if (km > 20)    return { label: "Long Effort",  value: `${km.toFixed(1)} km logged`, color: "#00e5ff" };
  return { label: "Session", value: "Logged & tracked ✓", color: "#00e5ff" };
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ShareCard({ activity, onClose }) {
  const cardRef = useRef(null);
  const [format,    setFormat]    = useState("story");
  const [exporting, setExporting] = useState(false);
  const [copied,    setCopied]    = useState(false);

  if (!activity) return null;

  const fmt    = FORMATS[format];
  const km     = (activity.distance ?? 0) / 1000;
  const pace   = activity.type === "Run" && activity.distance > 0 ? calcPace(activity) : null;
  const elev   = activity.total_elevation_gain;
  const avgHR  = activity.average_heartrate;
  const maxHR  = activity.max_heartrate;
  const accent = actColor(activity.type);
  const accentLight = useMemo(() => {
    // Lighten the accent for the inner / lit part of the neon glow
    const h = accent.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const num = parseInt(full, 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + 90);
    const g = Math.min(255, ((num >>  8) & 0xff) + 90);
    const b = Math.min(255, ( num        & 0xff) + 90);
    return `rgb(${r}, ${g}, ${b})`;
  }, [accent]);

  const latlngs = useMemo(() => {
    const poly = activity.map?.summary_polyline || activity.map?.polyline;
    if (!poly) return [];
    try { return decodePolyline(poly); } catch { return []; }
  }, [activity]);

  // Derived viz data — equalizer above pace + split consistency bars below
  const { eqBars, splitBars, splitConsistencyPct } = useMemo(() => {
    const splits = activity.splits_metric || [];
    let bars = [];
    let pct = null;
    if (splits.length >= 3) {
      const paces = splits.map((s) => (s.moving_time / 60) / (s.distance / 1000)).filter((p) => isFinite(p) && p > 0);
      if (paces.length) {
        const min = Math.min(...paces), max = Math.max(...paces);
        const range = Math.max(0.5, max - min);
        bars = paces.map((p) => 1 - (p - min) / range / 1.4 + 0.3); // faster = taller
        const mean = paces.reduce((s, p) => s + p, 0) / paces.length;
        const variance = paces.reduce((s, p) => s + (p - mean) ** 2, 0) / paces.length;
        const cv = Math.sqrt(variance) / mean;
        pct = Math.max(60, Math.min(99, Math.round(100 - cv * 280)));
      }
    }
    // Decorative equalizer — deterministic from activity id
    let s = (activity.id ? String(activity.id).split("").reduce((a, c) => a + c.charCodeAt(0), 0) : 7) || 7;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const eq = Array.from({ length: 16 }, (_, i) => 0.35 + Math.abs(Math.sin(i * 0.7) * 0.55) + rnd() * 0.2);
    // Split bars: real data if available, else 5 stylized bars
    const fiveSplit = bars.length ? bars : Array.from({ length: 5 }, () => 0.6 + rnd() * 0.35);
    return { eqBars: eq, splitBars: fiveSplit.slice(0, 5), splitConsistencyPct: pct };
  }, [activity]);

  const insight = useMemo(() => deriveInsight(activity, km, pace), [activity, km, pace]);

  const download = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true, pixelRatio: 2, backgroundColor: "#08080c",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `runlytics-${(activity.name || "workout").replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${format}.png`;
      a.click();
    } catch (e) {
      console.error("Share card export failed", e);
    } finally {
      setExporting(false);
    }
  };

  const copyToClipboard = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: "#08080c" });
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Clipboard copy failed", e);
    } finally {
      setExporting(false);
    }
  };

  const isLandscape = format === "landscape";
  const isSquare    = format === "square";
  const heroSize    = isLandscape ? 76 : isSquare ? 82 : 96;
  const nameSize    = isLandscape ? 18 : 20;
  const cardPadding = isLandscape ? 28 : 24;
  const idSuffix    = `${activity.id}-${format}`;
  const seed        = (String(activity.id || "1")).split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  // ── Render ────────────────────────────────────────────────────────────────
  const StatsRow = () => (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gridAutoRows: "1fr",       // equal-height tracks so all cards align
      alignItems: "stretch",
      gap: 10,
    }}>
      <StatCard
        icon="⏱" iconAccent={accent}
        label="Duration"
        value={fmtDur(activity.moving_time || 0)}
        sub="TOTAL ELAPSED TIME"
        accent={accent} accentLight={accentLight}
      />

      <StatCard
        icon="📈" iconAccent={accent}
        label="Pace"
        value={pace ? fmtPace(pace, activity.type) : `${(km / ((activity.moving_time || 1) / 3600)).toFixed(1)} km/h`}
        sub={splitConsistencyPct ? `SPLIT CONSISTENCY: ${splitConsistencyPct}%` : "AVERAGE TEMPO"}
        accent={accent} accentLight={accentLight}
        viz={<MiniBars values={eqBars} accent={accent} accentLight={accentLight} height={20} />}
        postViz={<MiniBars values={splitBars} accent={accent} accentLight={accentLight} height={14} gap={4} />}
      />

      <StatCard
        icon="🔥" iconAccent="#ff9040"
        secondaryIcon={avgHR ? "❤️" : null}
        label="Calories"
        value={activity.calories ? `${Math.round(activity.calories)}` : (avgHR ? `${Math.round(avgHR)}` : "—")}
        sub={
          avgHR ? (
            <>
              AVG HEART RATE: <span style={{ color: "#fff", fontWeight: 800 }}>{Math.round(avgHR)} bpm</span>
              {maxHR ? <><br />MAX HEART RATE: <span style={{ color: "#fff", fontWeight: 800 }}>{Math.round(maxHR)} bpm</span></> : null}
            </>
          ) : "CALORIES BURNED"
        }
        accent={accent} accentLight={accentLight}
      />
    </div>
  );

  const InsightRow = () => (
    <div style={{
      marginTop: 14, padding: "12px 16px",
      background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
      borderTop:    "1px solid rgba(255,255,255,0.08)",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 10,
    }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.85)", letterSpacing: 0.4 }}>
        Performance Insights
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.4, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
          {insight.label}:
        </span>
        <span style={{ fontSize: 12, fontWeight: 800, color: insight.color }}>{insight.value}</span>
      </div>
    </div>
  );

  return (
    <div className="onboarding-overlay" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "var(--bg2)", borderRadius: 16, padding: 24,
        maxWidth: 720, width: "calc(100vw - 40px)",
        maxHeight: "calc(100vh - 40px)", overflowY: "auto",
        border: "1px solid var(--border)",
      }}>
        {/* Modal header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800 }}>Share Workout</div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
              Neon performance card · {latlngs.length ? "GPS route" : "no GPS"}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "var(--text3)",
            cursor: "pointer", fontSize: 22, lineHeight: 1, padding: 4,
          }}>×</button>
        </div>

        {/* Format selector */}
        <div style={{
          display: "flex", background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 10, padding: 3, marginBottom: 16, gap: 2,
        }}>
          {Object.entries(FORMATS).map(([key, f]) => (
            <button
              key={key}
              onClick={() => setFormat(key)}
              style={{
                flex: 1,
                background: format === key ? "var(--accent)" : "none",
                color: format === key ? "#0d1320" : "var(--text3)",
                border: "none", borderRadius: 7, padding: "6px 8px",
                fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
              }}
            >{f.label}</button>
          ))}
        </div>

        {/* Preview */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <div style={{
            width: "100%",
            maxWidth: isLandscape ? 620 : isSquare ? 460 : 420,
            aspectRatio: fmt.ratio,
          }}>
            {/* ═══════════ THE CARD ═══════════ */}
            <div ref={cardRef} style={{
              width: "100%", height: "100%",
              background: CARBON_FIBER,
              borderRadius: 22,
              position: "relative", overflow: "hidden",
              padding: cardPadding,
              display: "flex", flexDirection: "column",
              color: "#ffffff",
              boxSizing: "border-box",
              fontFamily: "var(--font-body)",
              border: `1px solid ${accent}33`,
              boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.03), 0 0 40px ${accent}22`,
            }}>
              {/* Outer accent border glow ring */}
              <div style={{
                position: "absolute", inset: 6, borderRadius: 18,
                border: `1px solid ${accent}44`,
                pointerEvents: "none",
                boxShadow: `inset 0 0 24px ${accent}22`,
              }} />

              {/* TOP — chip + date */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 2 }}>
                <MetallicChip activity={activity} />
                <div style={{
                  fontSize: 11, fontWeight: 800, letterSpacing: 1.8,
                  textTransform: "uppercase", color: "rgba(255,255,255,0.7)",
                }}>
                  {fmtDate(activity.start_date_local).toUpperCase()}
                </div>
              </div>

              {/* Workout name */}
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: nameSize, fontWeight: 800,
                color: "rgba(255,255,255,0.95)",
                marginTop: 14, lineHeight: 1.2,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                overflow: "hidden",
                position: "relative", zIndex: 2,
              }}>{activity.name || `${activity.type} Workout`}</div>

              {/* HERO — same component for all formats: side-by-side, topo behind both */}
              <Hero
                km={km}
                accent={accent}
                accentLight={accentLight}
                sizePx={heroSize}
                latlngs={latlngs}
                idSuffix={idSuffix}
                seed={seed}
              />

              {/* Stat cards */}
              <div style={{ position: "relative", zIndex: 2 }}>
                <StatsRow />
              </div>

              {/* Performance insights bar */}
              <div style={{ position: "relative", zIndex: 2 }}>
                <InsightRow />
              </div>

              {/* Footer */}
              <div style={{
                marginTop: 12,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                position: "relative", zIndex: 2,
              }}>
                <Brandmark />
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: 1, fontWeight: 700 }}>
                    runlytics.app
                  </div>
                  <span style={{ fontSize: 14, color: accentLight, filter: `drop-shadow(0 0 4px ${accent})` }}>✦</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={download} disabled={exporting} style={{
            flex: 1, background: "var(--accent)", color: "#0d1320", border: "none",
            borderRadius: 10, padding: "11px 16px", fontSize: 13, fontWeight: 700,
            cursor: exporting ? "wait" : "pointer", opacity: exporting ? 0.6 : 1,
          }}>
            {exporting ? "Exporting…" : "⬇ Download PNG"}
          </button>
          <button onClick={copyToClipboard} disabled={exporting} style={{
            flex: 1, background: "var(--surface)", color: "var(--text)",
            border: "1px solid var(--border2)",
            borderRadius: 10, padding: "11px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            {copied ? "✓ Copied!" : "📋 Copy Image"}
          </button>
        </div>
      </div>
    </div>
  );
}
