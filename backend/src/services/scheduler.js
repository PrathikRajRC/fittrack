// Background job scheduler.
//
// Runs a nightly incremental sync for every connected athlete so newly logged
// Strava activities show up without waiting for a webhook or manual page load.

import cron from "node-cron";
import prisma from "./db.js";
import { syncActivities } from "./activitySync.js";

// Build a session-like object the existing services expect, backed by the DB.
async function buildSessionFor(athlete, token) {
  const session = {
    athlete: { id: athlete.id },
    tokens: {
      access_token:  token.accessToken,
      refresh_token: token.refreshToken,
      expires_at:    token.expiresAt,
    },
  };
  return session;
}

// If stravaRequest refreshed the token mid-sync, persist the new values.
async function persistTokensIfChanged(athleteId, before, after) {
  if (before.access_token === after.access_token) return;
  await prisma.athleteToken.update({
    where: { athleteId },
    data: {
      accessToken:  after.access_token,
      refreshToken: after.refresh_token,
      expiresAt:    after.expires_at,
    },
  });
}

export async function runNightlySync() {
  const athletes = await prisma.athlete.findMany({ include: { token: true } });
  let ok = 0, failed = 0;

  for (const athlete of athletes) {
    if (!athlete.token) continue;
    try {
      const session = await buildSessionFor(athlete, athlete.token);
      const tokensBefore = { ...session.tokens };
      await syncActivities(session, athlete.id);
      await persistTokensIfChanged(athlete.id, tokensBefore, session.tokens);
      ok++;
    } catch (err) {
      failed++;
      console.error(`[scheduler] sync failed for athlete=${athlete.id}:`, err.message);
    }
  }

  console.log(`[scheduler] nightly sync complete — ok=${ok} failed=${failed}`);
}

let started = false;

export function startScheduler() {
  if (started) return;
  started = true;

  // 03:00 local time every day
  cron.schedule("0 3 * * *", () => {
    runNightlySync().catch((e) => console.error("[scheduler] uncaught:", e));
  });

  console.log("[scheduler] nightly sync scheduled for 03:00");
}
