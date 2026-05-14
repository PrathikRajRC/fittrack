// Mirror of backend/src/services/analyticsService.js
// Used by hooks when running in mock/demo mode.

const MS_DAY = 86400000;

export function groupByWeek(activities) {
  const weeks = {};
  for (const act of activities) {
    const d = new Date(act.start_date_local);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    if (!weeks[key]) weeks[key] = { week: key, distance: 0, totalTime: 0, count: 0 };
    weeks[key].distance  += act.distance / 1000;
    weeks[key].totalTime += act.moving_time / 3600;
    weeks[key].count++;
  }
  return Object.values(weeks)
    .sort((a, b) => a.week.localeCompare(b.week))
    .map((w) => ({ ...w, distance: +w.distance.toFixed(1), totalTime: +w.totalTime.toFixed(1) }));
}

export function groupByMonth(activities) {
  const months = {};
  for (const act of activities) {
    const key = act.start_date_local.slice(0, 7);
    const label = new Date(act.start_date_local).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    if (!months[key]) months[key] = { month: key, label, distance: 0, count: 0 };
    months[key].distance += act.distance / 1000;
    months[key].count++;
  }
  return Object.values(months)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((m) => ({ ...m, distance: +m.distance.toFixed(1) }));
}

export function typeDistribution(activities) {
  const counts = {};
  for (const act of activities) counts[act.type] = (counts[act.type] || 0) + 1;
  return Object.entries(counts)
    .map(([type, count]) => ({ type, count, pct: Math.round(count / activities.length * 100) }))
    .sort((a, b) => b.count - a.count);
}

export function paceTrend(activities, type = "Run") {
  return activities
    .filter((a) => a.type === type && a.distance > 0 && a.moving_time > 0)
    .slice(0, 20)
    .reverse()
    .map((a) => ({
      date: a.start_date_local.slice(0, 10),
      name: a.name,
      pace: +(a.moving_time / 60 / (a.distance / 1000)).toFixed(2),
      distance: +(a.distance / 1000).toFixed(2),
    }));
}

export function consistencyGrid(activities, days = 84) {
  const set = new Set(activities.map((a) => a.start_date_local.slice(0, 10)));
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * MS_DAY);
    const key = d.toISOString().slice(0, 10);
    return { date: key, active: set.has(key) };
  });
}

export function lifetimeSummary(activities) {
  return {
    totalActivities: activities.length,
    totalDistance:   +(activities.reduce((s, a) => s + a.distance, 0) / 1000).toFixed(1),
    totalMovingTime:  activities.reduce((s, a) => s + a.moving_time, 0),
    totalElevation:   activities.reduce((s, a) => s + (a.total_elevation_gain || 0), 0),
    totalCalories:    activities.reduce((s, a) => s + (a.kilojoules || 0), 0),
  };
}

export function generateInsights(activities) {
  if (!activities.length) return [];
  const runs = activities.filter((a) => a.type === "Run" && a.distance > 0);
  const avgDist = activities.filter((a) => a.distance > 0).reduce((s, a) => s + a.distance, 0)
    / activities.filter((a) => a.distance > 0).length / 1000;

  const avgPaceVal = runs.length
    ? runs.reduce((s, a) => s + a.moving_time / 60 / (a.distance / 1000), 0) / runs.length
    : null;

  const dayCounts = Array(7).fill(0);
  activities.forEach((a) => dayCounts[new Date(a.start_date_local).getDay()]++);
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const mostActiveDay = days[dayCounts.indexOf(Math.max(...dayCounts))];

  const typeCounts = {};
  activities.forEach((a) => { typeCounts[a.type] = (typeCounts[a.type] || 0) + 1; });
  const favType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const longestRun = runs.reduce((m, a) => a.distance > m.distance ? a : m, runs[0] || { distance: 0 });

  const fmt = (v) => { const m = Math.floor(v); const s = Math.round((v - m) * 60); return `${m}:${s.toString().padStart(2,"0")}/km`; };

  return [
    { key: "avg_distance",   label: "Avg Activity Distance", value: `${avgDist.toFixed(2)} km`, icon: "📏", desc: "Per workout with GPS" },
    { key: "most_active_day",label: "Most Active Day",        value: mostActiveDay,               icon: "📅", desc: "Day you train most" },
    { key: "fav_type",       label: "Favourite Activity",     value: favType,                     icon: "🏆", desc: `${typeCounts[favType]} sessions` },
    { key: "longest_run",    label: "Longest Run",            value: `${(longestRun.distance/1000).toFixed(2)} km`, icon: "📍", desc: longestRun.name || "—" },
    ...(avgPaceVal ? [{ key: "avg_pace", label: "Avg Run Pace", value: fmt(avgPaceVal), icon: "⚡", desc: `Over ${runs.length} runs` }] : []),
  ];
}
