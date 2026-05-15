import { useMemo } from "react";
import { actColor } from "../../utils/formatters.js";

// Decode a Google-encoded polyline string into [[lat, lng], ...] pairs
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

// Scale lat/lng points to fit an SVG viewport, preserving aspect ratio
function toSVGPoints(latlngs, W = 600, H = 300, pad = 36) {
  if (!latlngs.length) return [];
  const lats = latlngs.map((p) => p[0]);
  const lngs = latlngs.map((p) => p[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat || 0.001;
  const spanLng = maxLng - minLng || 0.001;
  const scale = Math.min((W - pad * 2) / spanLng, (H - pad * 2) / spanLat);
  const offX = (W - spanLng * scale) / 2;
  const offY = (H - spanLat * scale) / 2;
  return latlngs.map(([lat, lng]) => [
    Math.round(offX + (lng - minLng) * scale),
    Math.round(offY + (maxLat - lat) * scale),
  ]);
}

// Build a smooth bezier SVG path string through an array of [x,y] points
function smoothPath(pts) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q ${pts[i][0]} ${pts[i][1]} ${mx} ${my}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last[0]} ${last[1]}`;
  return d;
}

export default function RouteMap({ activity }) {
  const pts = useMemo(() => {
    const polyline = activity.map?.summary_polyline || activity.map?.polyline;
    if (!polyline) return [];
    return toSVGPoints(decodePolyline(polyline));
  }, [activity]);

  const d = useMemo(() => smoothPath(pts), [pts]);

  // No real GPS data available — show an informative empty state
  if (!pts.length) {
    return (
      <div
        className="map-placeholder"
        style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 120 }}
      >
        <span style={{ fontSize: 28, opacity: 0.4 }}>🗺️</span>
        <span style={{ fontSize: 12, color: "var(--text3)" }}>No GPS route data for this activity</span>
      </div>
    );
  }

  const color = actColor(activity.type);
  const start = pts[0];
  const end   = pts[pts.length - 1];

  return (
    <div className="map-placeholder">
      <svg viewBox="0 0 600 300" style={{ width: "100%", height: "100%" }}>
        <defs>
          <linearGradient id="mapBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#0d1320" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
          <filter id="routeGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect width="600" height="300" fill="url(#mapBg)" />

        {[0,1,2,3,4].map((i) => (
          <line key={`v${i}`} x1={i*150} y1="0" x2={i*150} y2="300" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        ))}
        {[0,1,2,3].map((i) => (
          <line key={`h${i}`} x1="0" y1={i*100} x2="600" y2={i*100} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        ))}

        <path d={d} fill="none" stroke={color} strokeWidth="8"   strokeOpacity="0.15" strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#routeGlow)" />

        <circle cx={start[0]} cy={start[1]} r="7" fill={color} fillOpacity="0.25" />
        <circle cx={start[0]} cy={start[1]} r="4" fill={color} />
        <text x={start[0] + 10} y={start[1] + 4} fill={color} fontSize="10" fontWeight="700">START</text>

        <circle cx={end[0]} cy={end[1]} r="7" fill="#fff" fillOpacity="0.15" />
        <circle cx={end[0]} cy={end[1]} r="4" fill="#fff" />
        <text x={end[0] + 10} y={end[1] + 4} fill="#fff" fontSize="10" fontWeight="700" opacity="0.6">END</text>

        <text x="16" y="288" fill="rgba(255,255,255,0.15)" fontSize="10">
          FitTrack Route · {activity.name}
        </text>
      </svg>
    </div>
  );
}
