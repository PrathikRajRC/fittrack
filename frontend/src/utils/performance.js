// ── Daniels' VDOT / VO2 Max estimation ───────────────────────────────────────
// Ref: Jack Daniels' Running Formula (velocity in m/min, duration in minutes)
function vo2AtVelocity(vMpm) {
  return -4.60 + 0.182258 * vMpm + 0.000104 * vMpm * vMpm;
}
function pctVO2MaxAtDuration(dMin) {
  return (
    0.8 +
    0.1894393 * Math.exp(-0.012778  * dMin) +
    0.2989558 * Math.exp(-0.1932605 * dMin)
  );
}

export function estimateVO2Max(activities) {
  const runs = activities.filter(
    (a) =>
      ["Run", "TrailRun", "VirtualRun"].includes(a.type) &&
      a.distance >= 2000 &&
      a.moving_time >= 600
  );
  if (!runs.length) return null;

  let best = 0;
  for (const run of runs) {
    const vMpm   = (run.distance / run.moving_time) * 60;
    const dMin   = run.moving_time / 60;
    const vo2    = vo2AtVelocity(vMpm);
    const pct    = pctVO2MaxAtDuration(dMin);
    const vo2max = vo2 / pct;
    if (vo2max > best) best = vo2max;
  }
  return best > 0 ? Math.round(best * 10) / 10 : null;
}

export function vo2MaxCategory(v) {
  if (!v) return null;
  if (v >= 60) return { label: "Elite",        color: "#00ff9d" };
  if (v >= 52) return { label: "Excellent",     color: "#4ade80" };
  if (v >= 45) return { label: "Above Average", color: "#86efac" };
  if (v >= 38) return { label: "Average",       color: "#fbbf24" };
  if (v >= 30) return { label: "Below Average", color: "#f97316" };
  return              { label: "Poor",           color: "#ef4444" };
}

// ── Week boundary helpers ─────────────────────────────────────────────────────
function weekBounds(weeksAgo = 0) {
  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() - weeksAgo * 7);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function activitiesInWeek(activities, weeksAgo) {
  const { start, end } = weekBounds(weeksAgo);
  return activities.filter((a) => {
    const d = new Date(a.start_date_local);
    return d >= start && d <= end;
  });
}

function weekKm(activities, weeksAgo = 0) {
  return activitiesInWeek(activities, weeksAgo).reduce(
    (s, a) => s + a.distance / 1000,
    0
  );
}

// ── Training Load (simplified TRIMP) ─────────────────────────────────────────
function activityLoad(act, maxHR) {
  const dMin   = act.moving_time / 60;
  const hrFrac = act.average_heartrate ? act.average_heartrate / maxHR : 0.65;
  return Math.round(dMin * hrFrac * hrFrac * 100);
}

export function weeklyTrainingLoads(activities, maxHR = 190, weeks = 8) {
  return Array.from({ length: weeks }, (_, i) => {
    const weeksAgo = weeks - 1 - i;
    const { start } = weekBounds(weeksAgo);
    const label = start.toLocaleDateString("default", { month: "short", day: "numeric" });
    const load  = activitiesInWeek(activities, weeksAgo).reduce(
      (s, a) => s + activityLoad(a, maxHR),
      0
    );
    return { week: label, load };
  });
}

export function currentWeekLoad(activities, maxHR = 190) {
  return activitiesInWeek(activities, 0).reduce(
    (s, a) => s + activityLoad(a, maxHR),
    0
  );
}

export function loadCategory(load) {
  if (load > 400) return { label: "Very High", color: "#ef4444" };
  if (load > 250) return { label: "High",      color: "#f97316" };
  if (load > 120) return { label: "Moderate",  color: "#fbbf24" };
  if (load > 0)   return { label: "Low",       color: "var(--accent)" };
  return               { label: "Rest Week",   color: "var(--text3)" };
}

// ── Injury Risk Detection (10% rule) ─────────────────────────────────────────
export function detectInjuryRisk(activities) {
  const thisWeek = weekKm(activities, 0);
  const lastWeek = weekKm(activities, 1);
  if (lastWeek < 5) return null;

  const increase = (thisWeek - lastWeek) / lastWeek;
  if (increase > 0.30) return { level: "high",   pct: Math.round(increase * 100), thisWeek: +thisWeek.toFixed(1), lastWeek: +lastWeek.toFixed(1) };
  if (increase > 0.10) return { level: "medium", pct: Math.round(increase * 100), thisWeek: +thisWeek.toFixed(1), lastWeek: +lastWeek.toFixed(1) };
  return null;
}

// ── Fatigue Detection (pace regression) ──────────────────────────────────────
export function detectFatigue(activities) {
  const runs = activities.filter(
    (a) => ["Run", "TrailRun"].includes(a.type) && a.distance > 2000 && a.moving_time > 0
  );
  if (runs.length < 5) return null;

  const sorted = [...runs].sort(
    (a, b) => new Date(b.start_date_local) - new Date(a.start_date_local)
  );
  const pace = (a) => (a.moving_time / 60) / (a.distance / 1000);

  const recentAvg = sorted.slice(0, 3).reduce((s, a) => s + pace(a), 0) / 3;
  const olderCount = Math.min(5, sorted.length - 3);
  if (olderCount < 2) return null;
  const olderAvg = sorted.slice(3, 3 + olderCount).reduce((s, a) => s + pace(a), 0) / olderCount;

  const changePct = (recentAvg - olderAvg) / olderAvg;
  if (changePct > 0.07) return { level: "high",   pct: Math.round(changePct * 100) };
  if (changePct > 0.03) return { level: "medium", pct: Math.round(changePct * 100) };
  return null;
}

// ── Weekly HR Zone Distribution ───────────────────────────────────────────────
export const HR_ZONE_DEFS = [
  { name: "Z1 Recovery",  label: "Z1", min: 0.00, max: 0.60, color: "#4ade80" },
  { name: "Z2 Aerobic",   label: "Z2", min: 0.60, max: 0.70, color: "#86efac" },
  { name: "Z3 Tempo",     label: "Z3", min: 0.70, max: 0.80, color: "#fbbf24" },
  { name: "Z4 Threshold", label: "Z4", min: 0.80, max: 0.90, color: "#f97316" },
  { name: "Z5 VO2 Max",   label: "Z5", min: 0.90, max: 1.10, color: "#ef4444" },
];

export function weeklyZoneDistribution(activities, maxHR = 190) {
  const thisWeek = activitiesInWeek(activities, 0).filter(
    (a) => a.average_heartrate > 0 && a.moving_time > 0
  );

  const zoneMins = new Array(5).fill(0);
  for (const act of thisWeek) {
    const hrFrac = Math.min(1.09, act.average_heartrate / maxHR);
    const dMin   = act.moving_time / 60;
    const zi     = HR_ZONE_DEFS.findIndex((z) => hrFrac < z.max);
    if (zi >= 0) zoneMins[zi] += dMin;
  }

  return HR_ZONE_DEFS.map((z, i) => ({ ...z, minutes: Math.round(zoneMins[i]) }));
}

// ── Activity streak helpers ──────────────────────────────────────────────────
function toLocalDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function activeDateSet(activities) {
  return new Set(activities.map((a) => a.start_date_local?.slice(0, 10)).filter(Boolean));
}

export function currentStreak(activities) {
  const activeDates = activeDateSet(activities);
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  // Allow today to be missed — count from yesterday so the streak doesn't break before end-of-day
  const d = new Date(today);
  if (!activeDates.has(toLocalDate(d))) d.setDate(d.getDate() - 1);

  let streak = 0;
  while (activeDates.has(toLocalDate(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function longestStreak(activities) {
  const activeDates = activeDateSet(activities);
  if (activeDates.size === 0) return 0;

  const sorted = [...activeDates].sort();
  let best = 1, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T12:00:00");
    const now  = new Date(sorted[i]     + "T12:00:00");
    const diff = (now - prev) / (1000 * 60 * 60 * 24);
    if (diff === 1) cur++;
    else { if (cur > best) best = cur; cur = 1; }
  }
  return Math.max(best, cur);
}

// Consecutive weeks (most recent backwards) that contain at least one activity
export function weeklyStreak(activities) {
  const weeksWithActivity = new Set();
  for (const a of activities) {
    const d = new Date(a.start_date_local);
    if (isNaN(d)) continue;
    // Use ISO week year+week key
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    weeksWithActivity.add(toLocalDate(monday));
  }

  const today = new Date();
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  thisMonday.setHours(12, 0, 0, 0);

  let streak = 0;
  const cursor = new Date(thisMonday);
  if (!weeksWithActivity.has(toLocalDate(cursor))) cursor.setDate(cursor.getDate() - 7);
  while (weeksWithActivity.has(toLocalDate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

// Last N days with activity flags, oldest first
export function recentDays(activities, n = 30) {
  const activeDates = activeDateSet(activities);
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = toLocalDate(d);
    days.push({ date: key, active: activeDates.has(key), dow: d.getDay() });
  }
  return days;
}

export function streakStats(activities) {
  return {
    current: currentStreak(activities),
    longest: longestStreak(activities),
    weeks:   weeklyStreak(activities),
    last30:  recentDays(activities, 30),
  };
}
