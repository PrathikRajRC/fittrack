import { Router } from "express";
import { getAthlete, getAthleteStats, getAthleteGear } from "../services/stravaService.js";
import { withCache } from "../services/cache.js";

const router = Router();

/** GET /api/athlete — Full athlete profile (cached 15 min) */
router.get("/", async (req, res, next) => {
  try {
    const id = req.session.athlete?.id;
    const athlete = await withCache(`athlete:${id}`, 900, () => getAthlete(req.session));
    res.json(athlete);
  } catch (err) {
    next(err);
  }
});

/** GET /api/athlete/stats — Lifetime totals (cached 15 min) */
router.get("/stats", async (req, res, next) => {
  try {
    const id = req.athlete.id;
    const stats = await withCache(`athlete:${id}:stats`, 900, () => getAthleteStats(req.session, id));
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

/** GET /api/athlete/gear — Bikes and shoes (cached 1 hour — gear rarely changes) */
router.get("/gear", async (req, res, next) => {
  try {
    const id = req.session.athlete?.id;
    const gear = await withCache(`athlete:${id}:gear`, 3600, () => getAthleteGear(req.session));
    res.json(gear);
  } catch (err) {
    next(err);
  }
});

export default router;
