import { useRef, useState, useMemo } from "react";
import { toPng } from "html-to-image";
import { actIcon, actColor, fmtDur, fmtPace, fmtDate, calcPace } from "../../utils/formatters.js";

// Google encoded polyline → array of [lat, lng]
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

// Project lat/lng → coordinate string for an SVG path that fits inside w × h
function buildPath(latlngs, w, h, padding = 16) {
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

const FORMATS = {
  story:     { label: "Story",     ratio: "4 / 5"  },
  square:    { label: "Square",    ratio: "1 / 1"  },
  landscape: { label: "Landscape", ratio: "16 / 9" },
};

function lighten(hex, amount = 0.3) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * amount));
  const g = Math.min(255, ((num >>  8) & 0xff) + Math.round(255 * amount));
  const b = Math.min(255, ( num        & 0xff) + Math.round(255 * amount));
  return `rgb(${r}, ${g}, ${b})`;
}

// ── Subcomponents ─────────────────────────────────────────────────────────────
function TypeChip({ activity, accent, accentLight }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: `${accent}22`,
      border: `1px solid ${accent}55`,
      borderRadius: 99, padding: "5px 12px",
      width: "fit-content",
    }}>
      <span style={{ fontSize: 13 }}>{actIcon(activity.type)}</span>
      <span style={{
        fontSize: 10, fontWeight: 800, letterSpacing: 1.4,
        textTransform: "uppercase", color: accentLight,
      }}>{activity.type}</span>
    </div>
  );
}

function DistanceHero({ km, accent, accentLight, sizePx }) {
  return (
    <div>
      <div style={{
        fontFamily: "var(--font-display)",
        fontSize: sizePx, fontWeight: 900, lineHeight: 0.9,
        letterSpacing: "-0.04em",
        background: `linear-gradient(135deg, ${accentLight} 0%, ${accent} 100%)`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}>
        {km.toFixed(km < 10 ? 2 : 1)}
      </div>
      <div style={{
        fontSize: 11, fontWeight: 800, letterSpacing: 2.5,
        textTransform: "uppercase", color: "rgba(255,255,255,0.5)",
        marginTop: 6,
      }}>kilometres</div>
    </div>
  );
}

function StatBlock({ label, value, sub }) {
  return (
    <div>
      <div style={{
        fontSize: 9, fontWeight: 800, letterSpacing: 1.4,
        textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 5,
      }}>{label}</div>
      <div style={{
        fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 900,
        color: "#ffffff", lineHeight: 1, letterSpacing: "-0.01em",
      }}>{value}</div>
      {sub && <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.45)", marginTop: 3, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase" }}>{sub}</div>}
    </div>
  );
}

function StatsGrid({ activity, km, pace, elev, avgHR }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 16,
      paddingTop: 16,
      borderTop: "1px solid rgba(255,255,255,0.1)",
    }}>
      <StatBlock label="Duration" value={fmtDur(activity.moving_time || 0)} />
      {pace
        ? <StatBlock label="Pace" value={fmtPace(pace, activity.type)} sub="per km" />
        : <StatBlock label="Avg Speed" value={`${(km / ((activity.moving_time || 1) / 3600)).toFixed(1)}`} sub="km/h" />}
      {elev != null && elev > 0
        ? <StatBlock label="Elevation" value={`${Math.round(elev)}`} sub="metres" />
        : avgHR
          ? <StatBlock label="Avg HR" value={`${Math.round(avgHR)}`} sub="bpm" />
          : <StatBlock label="Calories" value={activity.calories ? Math.round(activity.calories) : "—"} sub="kcal" />}
    </div>
  );
}

function Brandmark({ accent, accentLight }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 22, height: 22, borderRadius: 6,
        background: `linear-gradient(135deg, ${accentLight}, ${accent})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 900, color: "#0d1320",
      }}>⚡</div>
      <div style={{
        fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 800,
        letterSpacing: 1.5, color: "rgba(255,255,255,0.85)",
      }}>RUNLYTICS</div>
    </div>
  );
}

function RouteTrace({ latlngs, accent, accentLight, viewW, viewH, idSuffix }) {
  const { d, start, end } = useMemo(
    () => buildPath(latlngs, viewW, viewH, 14),
    [latlngs, viewW, viewH]
  );

  if (!d || latlngs.length < 2) {
    return (
      <div style={{
        width: "100%", height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        border: "1px dashed rgba(255,255,255,0.08)",
        borderRadius: 12, color: "rgba(255,255,255,0.3)", fontSize: 11,
        letterSpacing: 1, textTransform: "uppercase", fontWeight: 600,
      }}>No GPS Route</div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <filter id={`glow-${idSuffix}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={`route-grad-${idSuffix}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={accentLight} />
          <stop offset="100%" stopColor={accent} />
        </linearGradient>
      </defs>
      {/* Faint underlay */}
      <path d={d} stroke={`${accent}22`} strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Main glowing route */}
      <path
        d={d}
        stroke={`url(#route-grad-${idSuffix})`}
        strokeWidth="3.5" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
        filter={`url(#glow-${idSuffix})`}
      />
      {start && <circle cx={start[0]} cy={start[1]} r="6" fill="#ffffff" stroke={accent} strokeWidth="2" />}
      {end   && <circle cx={end[0]}   cy={end[1]}   r="6" fill={accent}   stroke="#ffffff" strokeWidth="2" />}
    </svg>
  );
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
  const accent = actColor(activity.type);
  const accentLight = useMemo(() => {
    try { return lighten(accent, 0.45); } catch { return accent; }
  }, [accent]);

  const latlngs = useMemo(() => {
    const poly = activity.map?.summary_polyline || activity.map?.polyline;
    if (!poly) return [];
    try { return decodePolyline(poly); } catch { return []; }
  }, [activity]);

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

  // Per-format presentational config
  const isLandscape = format === "landscape";
  const isSquare    = format === "square";
  const heroSize    = isLandscape ? 96 : isSquare ? 90 : 116;
  const nameSize    = isLandscape ? 17 : 19;
  const cardPadding = isLandscape ? 32 : 28;

  const cardBackground = `
    radial-gradient(ellipse at top left, ${accent}28 0%, transparent 50%),
    radial-gradient(ellipse at bottom right, ${accentLight}18 0%, transparent 55%),
    linear-gradient(135deg, #0a0e18 0%, #14182a 100%)
  `;

  const cardName = activity.name || `${activity.type} Workout`;

  return (
    <div className="onboarding-overlay" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "var(--bg2)", borderRadius: 16, padding: 24,
        maxWidth: 680, width: "calc(100vw - 40px)",
        maxHeight: "calc(100vh - 40px)", overflowY: "auto",
        border: "1px solid var(--border)",
      }}>
        {/* Modal header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800 }}>Share Workout</div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
              {latlngs.length ? "Route trace included" : "No GPS — stats card only"}
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

        {/* Preview wrapper — scales the card down to fit modal */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <div style={{
            width: "100%",
            maxWidth: isLandscape ? 600 : isSquare ? 440 : 400,
            aspectRatio: fmt.ratio,
          }}>
            {/* ═══════════ THE SHAREABLE CARD ═══════════ */}
            <div ref={cardRef} style={{
              width: "100%", height: "100%",
              background: cardBackground,
              borderRadius: 22,
              position: "relative", overflow: "hidden",
              padding: cardPadding,
              display: "flex",
              flexDirection: isLandscape ? "row" : "column",
              gap: isLandscape ? 24 : 0,
              color: "#ffffff",
              boxSizing: "border-box",
              fontFamily: "var(--font-body)",
            }}>
              {/* Dot grid texture */}
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.5,
                backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)",
                backgroundSize: "18px 18px",
              }} />
              {/* Accent corner glow */}
              <div style={{
                position: "absolute", top: -80, right: -80, width: 240, height: 240, borderRadius: "50%",
                background: `radial-gradient(circle, ${accent}33, transparent 70%)`,
                pointerEvents: "none",
              }} />

              {isLandscape ? (
                // ═══════════ LANDSCAPE — two-column split ═══════════
                <>
                  {/* LEFT COLUMN — info + hero + branding */}
                  <div style={{
                    flex: "0 0 44%", display: "flex", flexDirection: "column",
                    justifyContent: "space-between", position: "relative", zIndex: 2,
                    minWidth: 0,
                  }}>
                    <div>
                      <TypeChip activity={activity} accent={accent} accentLight={accentLight} />
                      <div style={{
                        fontFamily: "var(--font-display)", fontSize: nameSize, fontWeight: 800,
                        color: "rgba(255,255,255,0.92)", marginTop: 14, lineHeight: 1.2,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}>{cardName}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: 0.5, marginTop: 6 }}>
                        {fmtDate(activity.start_date_local)}
                      </div>
                    </div>

                    <div style={{ marginTop: 12, marginBottom: 12 }}>
                      <DistanceHero km={km} accent={accent} accentLight={accentLight} sizePx={heroSize} />
                    </div>

                    <Brandmark accent={accent} accentLight={accentLight} />
                  </div>

                  {/* RIGHT COLUMN — route trace + stats */}
                  <div style={{
                    flex: 1, display: "flex", flexDirection: "column",
                    justifyContent: "space-between", position: "relative", zIndex: 2,
                    minWidth: 0,
                  }}>
                    <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <RouteTrace latlngs={latlngs} accent={accent} accentLight={accentLight} viewW={420} viewH={280} idSuffix={`ls-${activity.id}`} />
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <StatsGrid activity={activity} km={km} pace={pace} elev={elev} avgHR={avgHR} />
                    </div>
                  </div>
                </>
              ) : (
                // ═══════════ STORY / SQUARE — vertical stack ═══════════
                <div style={{
                  width: "100%", height: "100%", display: "flex", flexDirection: "column",
                  position: "relative", zIndex: 2, minHeight: 0,
                }}>
                  {/* Top: chip + date */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <TypeChip activity={activity} accent={accent} accentLight={accentLight} />
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: 0.5 }}>
                      {fmtDate(activity.start_date_local)}
                    </div>
                  </div>

                  {/* Name */}
                  <div style={{
                    fontFamily: "var(--font-display)", fontSize: nameSize, fontWeight: 800,
                    color: "rgba(255,255,255,0.92)", marginTop: 14, lineHeight: 1.2,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>{cardName}</div>

                  {/* Hero distance */}
                  <div style={{ marginTop: isSquare ? 14 : 20 }}>
                    <DistanceHero km={km} accent={accent} accentLight={accentLight} sizePx={heroSize} />
                  </div>

                  {/* Route trace — fills remaining space */}
                  <div style={{
                    flex: 1, minHeight: 0, marginTop: 16, marginBottom: 16,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <RouteTrace
                      latlngs={latlngs}
                      accent={accent}
                      accentLight={accentLight}
                      viewW={620}
                      viewH={isSquare ? 200 : 280}
                      idSuffix={`v-${activity.id}`}
                    />
                  </div>

                  {/* Stats */}
                  <StatsGrid activity={activity} km={km} pace={pace} elev={elev} avgHR={avgHR} />

                  {/* Footer */}
                  <div style={{
                    marginTop: 16,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <Brandmark accent={accent} accentLight={accentLight} />
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.32)", letterSpacing: 0.5, fontWeight: 600 }}>
                      runlytics.app
                    </div>
                  </div>
                </div>
              )}
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
