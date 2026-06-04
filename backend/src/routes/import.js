import { Router } from "express";
import prisma from "../services/db.js";

const router = Router();

// GET /api/import — return the saved import dataset for this user (or none).
router.get("/", async (req, res, next) => {
  try {
    const row = await prisma.importData.findUnique({ where: { userId: req.userId } });
    if (!row) return res.json({ exists: false });
    res.json({
      exists:     true,
      athlete:    JSON.parse(row.athlete),
      activities: JSON.parse(row.activities),
      count:      row.count,
      updatedAt:  row.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/import/save — persist a parsed Strava export under this account.
router.post("/save", async (req, res, next) => {
  try {
    const { athlete, activities } = req.body;
    if (!athlete || !Array.isArray(activities)) {
      return res.status(400).json({ error: "athlete and activities[] are required" });
    }

    const data = {
      athlete:    JSON.stringify(athlete),
      activities: JSON.stringify(activities),
      count:      activities.length,
    };

    await prisma.importData.upsert({
      where:  { userId: req.userId },
      update: data,
      create: { userId: req.userId, ...data },
    });

    res.json({ success: true, count: activities.length });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/import — clear the saved import dataset.
router.delete("/", async (req, res, next) => {
  try {
    await prisma.importData.deleteMany({ where: { userId: req.userId } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
