import { useMemo } from "react";
import { actColor, rng } from "../../utils/formatters.js";

/**
 * Renders a generative SVG route map for a given activity.
 * In production, replace with Mapbox/Leaflet using real GPS streams.
 */
export default function RouteMap({ activity }) {
  const pts = useMemo(() => {
    const r = rng(activity.id * 31);
    let x = 200, y = 150;
    return Array.from({ length: 60 }, () => {
      x = Math.max(60,  Math.min(540, x + (r() - 0.48) * 40));
      y = Math.max(40,  Math.min(260, y + (r() - 0.52) * 28));
      return [x, y];
    });
  }, [activity.id]);

  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
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

        {/* Grid */}
        {[0,1,2,3,4].map((i) => (
          <line key={`v${i}`} x1={i*150} y1="0" x2={i*150} y2="300" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        ))}
        {[0,1,2,3].map((i) => (
          <line key={`h${i}`} x1="0" y1={i*100} x2="600" y2={i*100} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        ))}

        {/* Route glow + line */}
        <path d={d} fill="none" stroke={color} strokeWidth="8"   strokeOpacity="0.15" strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#routeGlow)" />

        {/* Start marker */}
        <circle cx={start[0]} cy={start[1]} r="7" fill={color} fillOpacity="0.25" />
        <circle cx={start[0]} cy={start[1]} r="4" fill={color} />
        <text x={start[0] + 10} y={start[1] + 4} fill={color} fontSize="10" fontWeight="700">START</text>

        {/* End marker */}
        <circle cx={end[0]} cy={end[1]} r="7" fill="#fff" fillOpacity="0.15" />
        <circle cx={end[0]} cy={end[1]} r="4" fill="#fff" />
        <text x={end[0] + 10} y={end[1] + 4} fill="#fff" fontSize="10" fontWeight="700" opacity="0.6">END</text>

        {/* Watermark */}
        <text x="16" y="288" fill="rgba(255,255,255,0.15)" fontSize="10">
          FitTrack Route · {activity.name}
        </text>
      </svg>
    </div>
  );
}
