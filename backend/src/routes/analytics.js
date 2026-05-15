import { Router } from "express";
import { getActivities } from "../services/stravaService.js";
import {
  groupByWeek, groupByMonth, typeDistribution,
  paceTrend, consistencyGrid, generateInsights, lifetimeSummary,
} from "../services/analyticsService.js";

const router = Router();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all activities with session-level caching.
 * All three analytics endpoints share one Strava fetch per TTL window,
 * cutting Strava API calls from up to 15 down to ~5 per 5 minutes.
 */
async function fetchAllActivities(session) {
  const now = Date.now();
  if (session._actCache && now - session._actCache.ts < CACHE_TTL) {
    return session._actCache.data;
  }
  const all = [];
  for (let page = 1; page <= 5; page++) {
    const batch = await getActivities(session, { page, per_page: 100 });
    all.push(...batch);
    if (batch.length < 100) break;
  }
  session._actCache = { data: all, ts: now };
  return all;
}

/** GET /api/analytics/summary — Lifetime aggregated stats */
router.get("/summary", async (req, res, next) => {
  try {
    const activities = await fetchAllActivities(req.session);
    res.json(lifetimeSummary(activities));
  } catch (err) {
    next(err);
  }
});

/** GET /api/analytics/trends — Weekly + monthly trends */
router.get("/trends", async (req, res, next) => {
  try {
    const activities = await fetchAllActivities(req.session);
    res.json({
      weekly: groupByWeek(activities).slice(-12),
      monthly: groupByMonth(activities).slice(-6),
      typeDistribution: typeDistribution(activities),
      paceTrend: paceTrend(activities, "Run"),
      consistency: consistencyGrid(activities, 84),
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/analytics/insights — Smart auto-generated insights */
router.get("/insights", async (req, res, next) => {
  try {
    const activities = await fetchAllActivities(req.session);
    res.json({
      insights: generateInsights(activities),
      summary: lifetimeSummary(activities),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
