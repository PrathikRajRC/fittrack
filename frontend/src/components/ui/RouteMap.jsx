import { useMemo, useState } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { actColor } from "../../utils/formatters.js";

const TILES = {
  dark: {
    label: "Dark",
    url:   "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attr:  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  light: {
    label: "Light",
    url:   "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attr:  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  satellite: {
    label: "Sat",
    url:   "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attr:  '&copy; <a href="https://www.esri.com/">Esri</a>',
  },
};

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

export default function RouteMap({ activity }) {
  const [tileKey, setTileKey] = useState("dark");

  const latlngs = useMemo(() => {
    const poly = activity.map?.summary_polyline || activity.map?.polyline;
    if (!poly) return [];
    return decodePolyline(poly);
  }, [activity]);

  if (!latlngs.length) {
    return (
      <div
        className="map-placeholder"
        style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 140 }}
      >
        <span style={{ fontSize: 28, opacity: 0.4 }}>🗺️</span>
        <span style={{ fontSize: 12, color: "var(--text3)" }}>No GPS route data for this activity</span>
      </div>
    );
  }

  const lats   = latlngs.map((p) => p[0]);
  const lngs   = latlngs.map((p) => p[1]);
  const bounds = [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ];

  const color = actColor(activity.type);
  const start = latlngs[0];
  const end   = latlngs[latlngs.length - 1];
  const tile  = TILES[tileKey];

  return (
    <div style={{ position: "relative", height: 320, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [24, 24] }}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        scrollWheelZoom={false}
      >
        <TileLayer key={tileKey} url={tile.url} attribution={tile.attr} maxZoom={19} />
        <Polyline positions={latlngs} color={color} weight={3} opacity={0.9} />
        <CircleMarker
          center={start}
          radius={7}
          pathOptions={{ color: "#fff", fillColor: color, fillOpacity: 1, weight: 2 }}
        >
          <Tooltip permanent direction="top" offset={[0, -8]} className="map-label">
            <span style={{ fontSize: 10, fontWeight: 700, color }}>START</span>
          </Tooltip>
        </CircleMarker>
        <CircleMarker
          center={end}
          radius={7}
          pathOptions={{ color: "#fff", fillColor: "#ffffff", fillOpacity: 1, weight: 2 }}
        >
          <Tooltip permanent direction="top" offset={[0, -8]} className="map-label">
            <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>END</span>
          </Tooltip>
        </CircleMarker>
      </MapContainer>

      {/* Tile toggle — sits above the map (z-index 1000 matches Leaflet controls) */}
      <div style={{
        position: "absolute", top: 10, right: 44, zIndex: 1000,
        display: "flex", borderRadius: 6, overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
      }}>
        {Object.entries(TILES).map(([key, t]) => (
          <button
            key={key}
            onClick={() => setTileKey(key)}
            style={{
              padding: "5px 10px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
              borderRight: key !== "satellite" ? "1px solid rgba(255,255,255,0.15)" : "none",
              background: tileKey === key ? "var(--accent)" : "rgba(20,24,36,0.85)",
              color:      tileKey === key ? "#0d1320"       : "rgba(255,255,255,0.75)",
              backdropFilter: "blur(6px)",
              transition: "background 0.15s, color 0.15s",
              letterSpacing: 0.4,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
