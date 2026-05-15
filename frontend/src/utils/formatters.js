// ── Distance ─────────────────────────────────────────────────────────────────
export function fmtDist(meters, type) {
  if (!meters || type === "Workout") return "—";
  const km = meters / 1000;
  return km.toFixed(2) + " km";
}

// ── Duration ─────────────────────────────────────────────────────────────────
export function fmtDur(seconds) {
  const h   = Math.floor(seconds / 3600);
  const min = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
}

// ── Pace (min/km) ─────────────────────────────────────────────────────────────
export function fmtPace(minPerKm, type) {
  if (!minPerKm || type === "Workout") return "—";
  if (type === "Ride") return (60 / minPerKm).toFixed(1) + " km/h";
  const min = Math.floor(minPerKm);
  const sec = Math.round((minPerKm - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")}/km`;
}

// Compute pace from Strava activity (moving_time in sec, distance in m)
export function calcPace(activity) {
  if (!activity.distance || !activity.moving_time) return 0;
  return activity.moving_time / 60 / (activity.distance / 1000);
}

// ── Date ─────────────────────────────────────────────────────────────────────
export function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function fmtDateShort(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short",
  });
}

// ── Activity helpers ──────────────────────────────────────────────────────────
export const ACT_ICONS = {
  Run: "🏃", Ride: "🚴", Walk: "🚶", Hike: "⛰️",
  Swim: "🏊", Workout: "💪", WeightTraining: "💪",
  VirtualRide: "🚴", TrailRun: "🏃",
};

export const ACT_COLORS = {
  Run: "#00e5ff", Ride: "#ff7040", Walk: "#00ff9d",
  Hike: "#b87aff", Swim: "#4db8ff", Workout: "#ffd060",
  WeightTraining: "#ffd060", VirtualRide: "#ff7040", TrailRun: "#00e5ff",
};

export const ACT_CSS_CLASS = {
  Run: "type-run", Ride: "type-ride", Walk: "type-walk",
  Hike: "type-hike", Swim: "type-swim", Workout: "type-workout",
  WeightTraining: "type-workout", VirtualRide: "type-ride", TrailRun: "type-run",
};

export function actIcon(type)  { return ACT_ICONS[type]     || "🏋️"; }
export function actColor(type) { return ACT_COLORS[type]    || "#888"; }
export function actClass(type) { return ACT_CSS_CLASS[type] || "type-workout"; }

