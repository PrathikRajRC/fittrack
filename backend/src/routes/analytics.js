import { Router } from "express";
import { syncActivities, getActivitiesFromDB, hasActivities } from "../services/activitySync.js";
import {
  groupByWeek, groupByMonth, typeDistribution,
  paceTrend, consistencyGrid, generateInsights, lifetimeSummary,
} from "../services/analyticsService.js";

const router = Router();

/**
 * Load up to 500 activities from the local DB cache.
 * Triggers a background incremental sync if the cache is stale.
 * Falls back to an empty array (never throws) so analytics degrade gracefully.
 */
async function fetchAllActivities(session) {
  const athleteId = session.athlete.id;

  if (await hasActivities(athleteId)) {
    // Serve from DB instantly; sync stale data in background
    syncActivities(session, athleteId).catch((e) =>
      console.error("[analytics] background sync:", e.message)
    );
    return getActivitiesFromDB(athleteId, { per_page: 500 });
  }

  // First load: sync synchronously
  await syncActivities(session, athleteId);
  return getActivitiesFromDB(athleteId, { per_page: 500 });
}

router.get("/summary", async (req, res, next) => {
  try {
    const activities = await fetchAllActivities(req.session);
    res.json(lifetimeSummary(activities));
  } catch (err) {
    next(err);
  }
});

router.get("/trends", async (req, res, next) => {
  try {
    const activities = await fetchAllActivities(req.session);
    res.json({
      weekly: groupByWeek(activities).slice(-12).map((w) => ({
        label:    new Date(w.week).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        distance: parseFloat((w.totalDistance / 1000).toFixed(1)),
        count:    w.count,
      })),
      monthly: groupByMonth(activities).slice(-6).map((m) => ({
        label:    new Date(m.month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        distance: parseFloat((m.totalDistance / 1000).toFixed(1)),
        count:    m.count,
      })),
      typeDistribution: typeDistribution(activities),
      paceTrend:        paceTrend(activities, "Run"),
      consistency:      consistencyGrid(activities, 84),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/insights", async (req, res, next) => {
  try {
    const activities = await fetchAllActivities(req.session);
    res.json({ insights: generateInsights(activities), summary: lifetimeSummary(activities) });
  } catch (err) {
    next(err);
  }
});

export default router;
