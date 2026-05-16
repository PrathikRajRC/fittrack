import { Router } from "express";
import prisma from "../services/db.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const athleteId = req.session.athlete.id;
    const goals = await prisma.goal.findMany({
      where:   { athleteId },
      orderBy: { createdAt: "asc" },
    });
    res.json(goals);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const athleteId = req.session.athlete.id;
    const { type, label, target, unit } = req.body;

    if (!type || !label || target == null || !unit) {
      return res.status(400).json({ error: "type, label, target, and unit are required" });
    }

    const goal = await prisma.goal.create({
      data: { athleteId, type, label, target: Number(target), unit },
    });
    res.status(201).json(goal);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const athleteId = req.session.athlete.id;
    const id = Number(req.params.id);

    const goal = await prisma.goal.findUnique({ where: { id } });
    if (!goal || goal.athleteId !== athleteId) {
      return res.status(404).json({ error: "Goal not found" });
    }

    await prisma.goal.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
