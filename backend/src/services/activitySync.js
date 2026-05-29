/**
 * Activity sync service.
 *
 * Responsibilities:
 *  - Fetch activities from Strava and upsert into the local SQLite cache
 *  - Serve cached activities to routes (avoiding repeated Strava API calls)
 *
 * Sync strategy:
 *  - First sync: full history (up to 1000 activities, 10 pages × 100)
 *  - Subsequent syncs: incremental — only activities newer than last sync
 *  - TTL: 1 hour. Older data triggers an incremental sync on next request.
 *  - Manual / webhook: call syncOne(session, athleteId, activityId) for a single activity
 */

import prisma from "./db.js";
import { getActivities, getActivity } from "./stravaService.js";

const SYNC_TTL_MS = 60 * 60 * 1000; // 1 hour

// ── Full / incremental sync ───────────────────────────────────────────────────

export async function syncActivities(session, athleteId) {
  const status = await prisma.syncStatus.findUnique({ where: { athleteId } });
  const isFirstSync = !status;
  const stale = status && Date.now() - status.lastSyncAt.getTime() > SYNC_TTL_MS;

  if (!isFirstSync && !stale) return; // Already fresh — nothing to do

  const activities = [];
  const maxPages   = isFirstSync ? 10 : 3;
  const after      = isFirstSync ? undefined : Math.floor(status.lastSyncAt.getTime() / 1000);

  for (let page = 1; page <= maxPages; page++) {
    const batch = await getActivities(session, { page, per_page: 100, after });
    activities.push(...batch);
    if (batch.length < 100) break;
  }

  await upsertMany(athleteId, activities);

  await prisma.syncStatus.upsert({
    where:  { athleteId },
    update: { lastSyncAt: new Date(), totalSynced: { increment: activities.length } },
    create: { athleteId, totalSynced: activities.length },
  });

}

// ── Single-activity upsert (called from webhook handler) ─────────────────────

export async function syncOne(session, athleteId, stravaActivityId) {
  try {
    const activity = await getActivity(session, stravaActivityId);
    await upsertMany(athleteId, [activity]);
  } catch (err) {
    console.error("[sync] syncOne failed:", err.message);
  }
}

// ── Read from cache ───────────────────────────────────────────────────────────

export async function getActivitiesFromDB(athleteId, { page = 1, per_page = 30, before, after } = {}) {
  const rows = await prisma.activity.findMany({
    where: {
      athleteId,
      ...(after  && { startDate: { gte: new Date(after  * 1000) } }),
      ...(before && { startDate: { lte: new Date(before * 1000) } }),
    },
    orderBy: { startDate: "desc" },
    take:    Number(per_page),
    skip:    (Number(page) - 1) * Number(per_page),
  });
  return rows.map((r) => JSON.parse(r.data));
}

export async function hasActivities(athleteId) {
  const count = await prisma.activity.count({ where: { athleteId } });
  return count > 0;
}

export async function getSyncStatus(athleteId) {
  return prisma.syncStatus.findUnique({ where: { athleteId } });
}

// ── Internal helpers ──────────────────────────────────────────────────────────

async function upsertMany(athleteId, activities) {
  for (const act of activities) {
    await prisma.activity.upsert({
      where:  { id: String(act.id) },
      update: { data: JSON.stringify(act), updatedAt: new Date(), type: act.type ?? "Workout" },
      create: {
        id:        String(act.id),
        athleteId,
        startDate: new Date(act.start_date),
        type:      act.type ?? "Workout",
        data:      JSON.stringify(act),
      },
    });
  }
}
