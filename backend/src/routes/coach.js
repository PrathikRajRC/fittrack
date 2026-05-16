import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { getActivities } from "../services/stravaService.js";

const router = Router();

function fmtPaceStr(minPerKm) {
  const min = Math.floor(minPerKm);
  const sec = Math.round((minPerKm - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")}/km`;
}

router.post("/chat", async (req, res, next) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ error: "ANTHROPIC_API_KEY not configured in backend/.env" });
    }

    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
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

    const systemPrompt = `You are an expert personal fitness coach. The athlete has connected their Strava account and you have access to their real training data. Analyse it carefully and give specific, data-driven advice.

## Athlete training data (last 30 activities):
- Total activities analysed: ${activities.length}
- Total distance: ${totalKm} km
- Activity breakdown: ${typeStr}
${avgPace ? `- Average run pace: ${fmtPaceStr(avgPace)}` : ""}

## Recent workouts (newest first):
${recentLines.join("\n")}

## Your coaching style:
- Reference their specific numbers when giving advice
- Be concise and actionable (keep responses under 250 words)
- Use km for distance, min/km for pace
- Be encouraging but honest — point out both strengths and areas to improve
- If you spot patterns (training gaps, pace changes, overloading), mention them explicitly`;

    const response = await anthropic.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 900,
      system:     systemPrompt,
      messages:   messages.map((m) => ({ role: m.role, content: m.content })),
    });

    res.json({ content: response.content[0].text });
  } catch (err) {
    next(err);
  }
});

export default router;
