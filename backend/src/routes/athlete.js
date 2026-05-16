import { Router } from "express";
import { getAthlete, getAthleteStats, getAthleteGear } from "../services/stravaService.js";

const router = Router();

/** GET /api/athlete — Full athlete profile */
router.get("/", async (req, res, next) => {
  try {
    const athlete = await getAthlete(req.session);
    res.json(athlete);
  } catch (err) {
    next(err);
  }
});

/** GET /api/athlete/stats — Lifetime totals from Strava */
router.get("/stats", async (req, res, next) => {
  try {
    const stats = await getAthleteStats(req.session, req.athlete.id);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

/** GET /api/athlete/gear — Bikes and shoes with total distances */
router.get("/gear", async (req, res, next) => {
  try {
    const gear = await getAthleteGear(req.session);
    res.json(gear);
  } catch (err) {
    next(err);
  }
});

export default router;
