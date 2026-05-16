const NO_DIST_TYPES = new Set(["Workout", "WeightTraining", "Yoga", "Crossfit"]);
const SPEED_TYPES   = new Set(["Ride", "VirtualRide", "EBikeRide", "GravelRide", "MountainBikeRide", "EMountainBikeRide", "Handcycle"]);

// ── Distance ─────────────────────────────────────────────────────────────────
export function fmtDist(meters, type) {
  if (!meters || NO_DIST_TYPES.has(type)) return "—";
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
  if (!minPerKm || NO_DIST_TYPES.has(type)) return "—";
  if (SPEED_TYPES.has(type)) return (60 / minPerKm).toFixed(1) + " km/h";
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
  VirtualRide: "🚴", VirtualRun: "🏃", TrailRun: "🏃",
  // Multi-sport
  Triathlon: "🏊", OpenWaterSwim: "🏊", BackcountrySki: "⛷️",
  NordicSki: "⛷️", AlpineSki: "⛷️", Snowboard: "🏂",
  Kayaking: "🚣", Rowing: "🚣", Canoeing: "🚣",
  Yoga: "🧘", Crossfit: "💪", Elliptical: "🏃",
  StairStepper: "🏃", RockClimbing: "🧗", Surfing: "🏄",
  Tennis: "🎾", Soccer: "⚽", Basketball: "🏀",
  Golf: "⛳", Skateboard: "🛹", Wheelchair: "♿",
  EBikeRide: "🚴", EMountainBikeRide: "🚴",
  GravelRide: "🚴", MountainBikeRide: "🚴",
  Handcycle: "🚴", InlineSkate: "⛸️", IceSkate: "⛸️",
};

export const ACT_COLORS = {
  Run: "#00e5ff", Ride: "#ff7040", Walk: "#00ff9d",
  Hike: "#b87aff", Swim: "#4db8ff", Workout: "#ffd060",
  WeightTraining: "#ffd060", VirtualRide: "#ff7040", VirtualRun: "#00e5ff",
  TrailRun: "#00e5ff", Triathlon: "#ff4d6d", OpenWaterSwim: "#4db8ff",
  NordicSki: "#60a5fa", AlpineSki: "#60a5fa", BackcountrySki: "#60a5fa",
  Snowboard: "#60a5fa", Kayaking: "#4db8ff", Rowing: "#4db8ff",
  Canoeing: "#4db8ff", Yoga: "#f9a8d4", Crossfit: "#ffd060",
  Elliptical: "#a3e635", StairStepper: "#a3e635",
  EBikeRide: "#ff7040", GravelRide: "#ff7040", MountainBikeRide: "#ff7040",
  EMountainBikeRide: "#ff7040", RockClimbing: "#b87aff",
};

export const ACT_CSS_CLASS = {
  Run: "type-run", Ride: "type-ride", Walk: "type-walk",
  Hike: "type-hike", Swim: "type-swim", Workout: "type-workout",
  WeightTraining: "type-workout", VirtualRide: "type-ride", VirtualRun: "type-run",
  TrailRun: "type-run", Triathlon: "type-swim", OpenWaterSwim: "type-swim",
  NordicSki: "type-hike", AlpineSki: "type-hike", BackcountrySki: "type-hike",
  Snowboard: "type-hike", Kayaking: "type-swim", Rowing: "type-swim",
  Canoeing: "type-swim", Yoga: "type-workout", Crossfit: "type-workout",
  Elliptical: "type-walk", StairStepper: "type-walk",
  EBikeRide: "type-ride", GravelRide: "type-ride", MountainBikeRide: "type-ride",
  EMountainBikeRide: "type-ride", RockClimbing: "type-hike",
};

export function actIcon(type)  { return ACT_ICONS[type]     || "🏋️"; }
export function actColor(type) { return ACT_COLORS[type]    || "#888"; }
export function actClass(type) { return ACT_CSS_CLASS[type] || "type-workout"; }

