// Activity stream cache.
//
// Strava streams (heartrate, altitude, latlng, etc.) are large and immutable
// once a workout is complete. We cache them in Postgres keyed by activity ID.

import prisma from "./db.js";
import { getActivityStreams } from "./stravaService.js";

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function getStreamsCached(session, activityId, keys) {
  const keysCsv = [...keys].sort().join(",");
  const cached = await prisma.activityStream.findUnique({
    where: { activityId: String(activityId) },
  });

  // Hit: same key set, fresh
  if (cached && cached.keys === keysCsv && Date.now() - cached.updatedAt.getTime() < TTL_MS) {
    try { return JSON.parse(cached.data); } catch {}
  }

  const streams = await getActivityStreams(session, activityId, keys);

  await prisma.activityStream.upsert({
    where:  { activityId: String(activityId) },
    update: { keys: keysCsv, data: JSON.stringify(streams), updatedAt: new Date() },
    create: { activityId: String(activityId), keys: keysCsv, data: JSON.stringify(streams) },
  });

  return streams;
}
