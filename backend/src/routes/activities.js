import { Router } from "express";
import { getActivities, getActivity, getActivityStreams } from "../services/stravaService.js";

const router = Router();

/**
 * GET /api/activities
 * Query params: page, per_page, type, before (unix ts), after (unix ts)
 */
router.get("/", async (req, res, next) => {
  try {
    const { page = 1, per_page = 30, before, after } = req.query;

    const activities = await getActivities(req.session, {
      page: Number(page),
      per_page: Math.min(Number(per_page), 100), // cap at 100
      before: before ? Number(before) : undefined,
      after: after ? Number(after) : undefined,
    });

    res.json(activities);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/activities/:id
 * Full activity detail including segment efforts, splits, gear.
 */
router.get("/:id", async (req, res, next) => {
  try {
    const activity = await getActivity(req.session, req.params.id);
    res.json(activity);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/activities/:id/streams
 * Time-series data: GPS, heartrate, altitude, speed, cadence, watts.
 * Query param: keys (comma-separated, defaults to latlng,heartrate,altitude,velocity_smooth)
 */
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

export default router;
