// Resolve the current user's activities, regardless of data source.
//
//  - Strava-linked account  → synced Postgres cache (Activity table)
//  - Import-backed account   → the saved ImportData blob
//
// This lets analytics/coach/query work the same whether the user connected
// Strava via OAuth or uploaded a Strava export.

import prisma from "./db.js";
import { syncActivities } from "./activitySync.js";

export async function resolveUserActivities(req, { limit } = {}) {
  // Strava-linked athlete → refresh cache, then read from DB.
  if (req.session?.athlete?.id) {
    const athleteId = req.session.athlete.id;
    try {
      await syncActivities(req.session, athleteId);
    } catch (e) {
      console.warn("[activities] sync warning:", e.message);
    }
    const rows = await prisma.activity.findMany({
      where:   { athleteId },
      orderBy: { startDate: "desc" },
      ...(limit ? { take: limit } : {}),
    });
    return rows.map((r) => JSON.parse(r.data));
  }

  // Import-backed account → stored blob (already newest-first).
  if (req.userId) {
    const imp = await prisma.importData.findUnique({ where: { userId: req.userId } });
    if (imp) {
      const acts = JSON.parse(imp.activities);
      return limit ? acts.slice(0, limit) : acts;
    }
  }

  return [];
}
