import { Router } from "express";
import Groq from "groq-sdk";
import prisma from "../services/db.js";

const router = Router();

function fmtPace(minPerKm) {
  const min = Math.floor(minPerKm);
  const sec = Math.round((minPerKm - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")}/km`;
}

router.post("/", async (req, res, next) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ error: "GROQ_API_KEY not configured in backend/.env" });
    }

    const { question } = req.body;
    if (!question?.trim()) {
      return res.status(400).json({ error: "question is required" });
    }

    const athleteId = req.session.athlete.id;

    const rows = await prisma.activity.findMany({
      where:   { athleteId },
      orderBy: { startDate: "desc" },
    });

    const activities = rows.map((r) => JSON.parse(r.data));

    // Compact table: one line per activity — keeps token count low
    const table = activities.map((a) => {
      const km   = (a.distance / 1000).toFixed(2);
      const min  = Math.round(a.moving_time / 60);
      const date = (a.start_date_local ?? a.start_date ?? "").slice(0, 10);
      const pace =
        a.type === "Run" && a.distance > 100
          ? fmtPace(a.moving_time / 60 / (a.distance / 1000))
          : "-";
      return `${date}|${a.type}|${km}km|${min}min|${pace}`;
    }).join("\n");

    const systemPrompt = `You are a precise fitness data analyst with access to this athlete's complete activity log (${activities.length} activities). Answer the question with exact numbers pulled from the data. Be concise — 1-3 sentences. Lead with the direct answer, then add one sentence of context if useful.

Activity log (date|type|distance|duration|pace):
${table}`;

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const response = await groq.chat.completions.create({
      model:      "llama-3.3-70b-versatile",
      max_tokens: 300,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: question },
      ],
    });

    res.json({ answer: response.choices[0].message.content });
  } catch (err) {
    next(err);
  }
});

export default router;
