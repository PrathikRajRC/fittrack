/**
 * Analytics Service
 * Pure functions that transform raw Strava activity arrays
 * into the structured data shapes the frontend expects.
 */

const MS_DAY = 86400000;

/** Group activities by calendar week (ISO week). */
export function groupByWeek(activities) {
  const weeks = {};
  for (const act of activities) {
    const d = new Date(act.start_date_local);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    if (!weeks[key]) weeks[key] = { week: key, activities: [], totalDistance: 0, totalTime: 0, count: 0 };
    weeks[key].activities.push(act);
    weeks[key].totalDistance += act.distance;
    weeks[key].totalTime += act.moving_time;
    weeks[key].count++;
  }
  return Object.values(weeks).sort((a, b) => a.week.localeCompare(b.week));
}

/** Group activities by calendar month. */
export function groupByMonth(activities) {
  const months = {};
  for (const act of activities) {
    const key = act.start_date_local.slice(0, 7); // "2025-03"
    if (!months[key]) months[key] = { month: key, activities: [], totalDistance: 0, totalTime: 0, count: 0 };
    months[key].activities.push(act);
    months[key].totalDistance += act.distance;
    months[key].totalTime += act.moving_time;
    months[key].count++;
  }
  return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
}

/** Activity type distribution. */
export function typeDistribution(activities) {
  const counts = {};
  for (const act of activities) {
    counts[act.type] = (counts[act.type] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([type, count]) => ({ type, count, pct: Math.round(count / activities.length * 100) }))
    .sort((a, b) => b.count - a.count);
}

/** Compute pace trend for a specific activity type (e.g. Run). */
export function paceTrend(activities, type = "Run") {
  return activities
    .filter(a => a.type === type && a.distance > 0 && a.moving_time > 0)
    .slice(-20)
    .map(a => ({
      date: a.start_date_local.slice(0, 10),
      name: a.name,
      pace: a.moving_time / 60 / (a.distance / 1000), // min/km
      distance: a.distance / 1000,
    }));
}

/** Training consistency: which days of the past N days had at least one activity. */
export function consistencyGrid(activities, days = 84) {
  const set = new Set(activities.map(a => a.start_date_local.slice(0, 10)));
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * MS_DAY);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, active: set.has(key) });
  }
  return result;
}

/** Generate smart text insights from activity data. */
export function generateInsights(activities) {
  if (!activities.length) return [];

  const runs = activities.filter(a => a.type === "Run" && a.distance > 0);
  const avgDist = activities.reduce((s, a) => s + a.distance, 0) / activities.length / 1000;
  const avgPace = runs.length
    ? runs.reduce((s, a) => s + a.moving_time / 60 / (a.distance / 1000), 0) / runs.length
    : null;

  const dayCounts = Array(7).fill(0);
  activities.forEach(a => dayCounts[new Date(a.start_date_local).getDay()]++);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const mostActiveDay = days[dayCounts.indexOf(Math.max(...dayCounts))];

  const typeCounts = {};
  activities.forEach(a => { typeCounts[a.type] = (typeCounts[a.type] || 0) + 1; });
  const favType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  const longestRun = runs.reduce((max, a) => a.distance > max.distance ? a : max, runs[0] || { distance: 0, name: "—" });
  const bestPaceRun = runs.reduce((min, a) => {
    const p = a.moving_time / 60 / (a.distance / 1000);
    return p < (min.pace || 99) ? { ...a, pace: p } : min;
  }, {});

  const recentRuns = runs.slice(0, 5);
  const olderRuns = runs.slice(-5);
  const recentAvgPace = recentRuns.length ? recentRuns.reduce((s, a) => s + a.moving_time / 60 / (a.distance / 1000), 0) / recentRuns.length : null;
  const olderAvgPace = olderRuns.length ? olderRuns.reduce((s, a) => s + a.moving_time / 60 / (a.distance / 1000), 0) / olderRuns.length : null;
  const paceImprovement = recentAvgPace && olderAvgPace ? ((olderAvgPace - recentAvgPace) / olderAvgPace * 100).toFixed(1) : null;

  const insights = [
    { key: "avg_distance", label: "Avg Activity Distance", value: `${avgDist.toFixed(2)} km`, icon: "📏", desc: "Per workout with distance tracked" },
    { key: "most_active_day", label: "Most Active Day", value: mostActiveDay, icon: "📅", desc: "The day you train most consistently" },
    { key: "fav_type", label: "Favourite Activity", value: favType, icon: "🏆", desc: `${typeCounts[favType]} sessions logged` },
    { key: "longest_run", label: "Longest Run", value: `${(longestRun.distance / 1000).toFixed(2)} km`, icon: "📍", desc: longestRun.name },
  ];

  if (avgPace) insights.push({ key: "avg_pace", label: "Avg Run Pace", value: formatPace(avgPace), icon: "⚡", desc: `Over ${runs.length} runs` });
  if (bestPaceRun.pace) insights.push({ key: "best_pace", label: "Best Run Pace", value: formatPace(bestPaceRun.pace), icon: "🚀", desc: bestPaceRun.name });
  if (paceImprovement) insights.push({ key: "pace_improvement", label: "Pace Improvement", value: `${paceImprovement}%`, icon: "📈", desc: "Recent vs. earlier average" });

  return insights;
}

function formatPace(minPerKm) {
  const min = Math.floor(minPerKm);
  const sec = Math.round((minPerKm - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")}/km`;
}

/** Aggregate lifetime totals. */
export function lifetimeSummary(activities) {
  return {
    totalActivities: activities.length,
    totalDistance: activities.reduce((s, a) => s + a.distance, 0) / 1000, // km
    totalMovingTime: activities.reduce((s, a) => s + a.moving_time, 0), // seconds
    totalElevation: activities.reduce((s, a) => s + (a.total_elevation_gain || 0), 0), // meters
    totalCalories: activities.reduce((s, a) => s + (a.kilojoules || 0), 0),
  };
}
