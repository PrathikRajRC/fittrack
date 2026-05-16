import { Router } from "express";
import { getActivity, getActivityStreams, getActivityLaps } from "../services/stravaService.js";
import { syncActivities, getActivitiesFromDB, hasActivities, getSyncStatus } from "../services/activitySync.js";
import prisma from "../services/db.js";

const router = Router();

/**
 * GET /api/activities
 * Serves from SQLite cache. Triggers a background sync if data is stale.
 * First-ever request syncs synchronously (one-time cost, shows Spinner on frontend).
 */
router.get("/", async (req, res, next) => {
  try {
    const athleteId = req.session.athlete.id;
    const params    = {
      page:     Number(req.query.page)     || 1,
      per_page: Math.min(Number(req.query.per_page) || 30, 100),
      before:   req.query.before ? Number(req.query.before) : undefined,
      after:    req.query.after  ? Number(req.query.after)  : undefined,
    };

    const cached = await hasActivities(athleteId);

    if (cached) {
      // Data exists — serve immediately, sync in background if stale
      syncActivities(req.session, athleteId).catch((e) =>
        console.error("[activities] background sync error:", e.message)
      );
      const activities = await getActivitiesFromDB(athleteId, params);
      res.set("X-Cache", "hit");
      return res.json(activities);
    }

    // First load — sync synchronously, then serve
    await syncActivities(req.session, athleteId);
    const activities = await getActivitiesFromDB(athleteId, params);
    res.set("X-Cache", "miss");
    res.json(activities);
  } catch (err) {
    next(err);
  }
});

/** GET /api/activities/sync-status — for the frontend to show last-sync time */
router.get("/sync-status", async (req, res, next) => {
  try {
    const status = await getSyncStatus(req.session.athlete.id);
    res.json(status ?? { lastSyncAt: null, totalSynced: 0 });
  } catch (err) {
    next(err);
  }
});

/** POST /api/activities/sync — manual force-sync button */
router.post("/sync", async (req, res, next) => {
  try {
    const athleteId = req.session.athlete.id;
    // Reset lastSyncAt so syncActivities treats it as stale
    await prisma.syncStatus.deleteMany({ where: { athleteId } });
    await syncActivities(req.session, athleteId);
    const status = await getSyncStatus(athleteId);
    res.json(status);
  } catch (err) {
    next(err);
  }
});

/** GET /api/activities/:id — always fetch fresh from Strava (detail data) */
router.get("/:id", async (req, res, next) => {
  try {
    const activity = await getActivity(req.session, req.params.id);
    res.json(activity);
  } catch (err) {
    next(err);
  }
});

/** GET /api/activities/:id/streams */
router.get("/:id/streams", async (req, res, next) => {
  try {
    const keys = req.query.keys
      ? req.query.keys.split(",")
      : ["latlng", "heartrate", "altitude", "velocity_smooth"];
    const streams = await getActivityStreams(req.session, req.params.id, keys);
    res.json(streams);
  } catch (err) {
    next(err);
  }
});

/** GET /api/activities/:id/laps */
router.get("/:id/laps", async (req, res, next) => {
  try {
    const laps = await getActivityLaps(req.session, req.params.id);
    res.json(laps);
  } catch (err) {
    next(err);
  }
});

export default router;
