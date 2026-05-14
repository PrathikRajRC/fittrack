import { Router } from "express";
import { getActivities } from "../services/stravaService.js";
import {
  groupByWeek, groupByMonth, typeDistribution,
  paceTrend, consistencyGrid, generateInsights, lifetimeSummary,
} from "../services/analyticsService.js";

const router = Router();

/**
 * Shared helper: fetch all activities (up to 500, paginated).
 * In production, cache this per user with Redis or DB.
 */
async function fetchAllActivities(session) {
  const all = [];
  for (let page = 1; page <= 5; page++) {
    const batch = await getActivities(session, { page, per_page: 100 });
    all.push(...batch);
    if (batch.length < 100) break;
  }
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
