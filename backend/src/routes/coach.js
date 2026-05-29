import { Router } from "express";
import Groq from "groq-sdk";
import { getActivities } from "../services/stravaService.js";

const router = Router();

function fmtPaceStr(minPerKm) {
  const min = Math.floor(minPerKm);
  const sec = Math.round((minPerKm - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")}/km`;
}

router.post("/chat", async (req, res, next) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ error: "GROQ_API_KEY not configured in backend/.env" });
    }

    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const activities = await getActivities(req.session, { per_page: 30 });

    const runs = activities.filter((a) => a.type === "Run" && a.distance > 0);
    const totalKm = (activities.reduce((s, a) => s + a.distance, 0) / 1000).toFixed(0);

    const avgPace = runs.length
      ? runs.reduce((s, a) => s + a.moving_time / 60 / (a.distance / 1000), 0) / runs.length
      : null;

    const typeCounts = {};
    activities.forEach((a) => { typeCounts[a.type] = (typeCounts[a.type] || 0) + 1; });
    const typeStr = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([t, c]) => `${t}: ${c}`)
      .join(", ");

    const recentLines = activities.slice(0, 12).map((a) => {
      const km  = (a.distance / 1000).toFixed(1);
      const min = Math.round(a.moving_time / 60);
      const paceNote =
        a.type === "Run" && a.distance > 0
          ? ` @ ${fmtPaceStr(a.moving_time / 60 / (a.distance / 1000))}`
          : "";
      return `  • ${a.start_date_local.slice(0, 10)}: ${a.type} — ${km} km in ${min} min${paceNote}`;
    });

    const systemPrompt = `You are an expert personal fitness coach with access to the athlete's real Strava training data. Give thorough, specific, data-driven advice.

## Athlete training data (last 30 activities):
- Total activities: ${activities.length}
- Total distance: **${totalKm} km**
- Activity breakdown: ${typeStr}
${avgPace ? `- Average run pace: **${fmtPaceStr(avgPace)}**` : ""}

## Recent workouts (newest first):
${recentLines.join("\n")}

## Response format rules (strictly follow):
- Use **bold** for every specific number, pace, or distance you mention
- Use markdown headings (##) to break long answers into sections
- Use bullet points for lists of advice or observations
- Use km for distance, min/km for pace
- Be specific — always reference the athlete's actual numbers, not generic advice
- Be encouraging but honest — call out both strengths and areas to improve
- Spot patterns: training gaps, pace drift, overloading, consistency streaks
- Do not add a disclaimer or say "I'm an AI" — just coach`;

    const response = await groq.chat.completions.create({
      model:       "llama-3.3-70b-versatile",
      max_tokens:  1400,
      temperature: 0.7,
      messages:   [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    res.json({ content: response.choices[0].message.content });
  } catch (err) {
    next(err);
  }
});

export default router;
