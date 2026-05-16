/**
 * In-memory webhook event queue.
 * Strava → POST /api/webhooks/strava → pushEvent(athleteId, event)
 * Frontend polls GET /api/webhooks/events → popEvents(athleteId)
 *
 * Events are lost on server restart, which is acceptable for this dev setup.
 * Migrate to a DB queue (e.g. Prisma + Postgres) for production.
 */

const store = new Map(); // athleteId (number) → Event[]

export function pushEvent(athleteId, event) {
  const id  = Number(athleteId);
  const buf = store.get(id) ?? [];
  buf.push({ ...event, receivedAt: Date.now() });
  // Cap at 20 events per athlete to avoid unbounded memory growth
  store.set(id, buf.slice(-20));
}

/** Consume and return all pending events for this athlete (clears them). */
export function popEvents(athleteId) {
  const id     = Number(athleteId);
  const events = store.get(id) ?? [];
  store.delete(id);
  return events;
}

/** Non-destructive peek (used for debugging). */
export function peekEvents(athleteId) {
  return store.get(Number(athleteId)) ?? [];
}

/** Total queued events across all athletes. */
export function totalQueued() {
  let n = 0;
  store.forEach((v) => { n += v.length; });
  return n;
}
