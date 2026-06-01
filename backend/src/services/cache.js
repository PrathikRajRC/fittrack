// Generic Redis cache wrapper with graceful fallback.
//
// When REDIS_URL is set we connect to ioredis. When it isn't (or the connection
// fails), every cache op becomes a no-op so the app keeps working.

import Redis from "ioredis";

let client = null;
let connected = false;
let givenUp = false;

function init() {
  if (client) return;
  if (!process.env.REDIS_URL || process.env.DISABLE_REDIS === "true") return;

  try {
    client = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      // Give up reconnecting after 3 attempts so a missing Redis doesn't spam logs
      retryStrategy(times) {
        if (times > 3) {
          if (!givenUp) {
            givenUp = true;
            console.warn("[cache] Redis unreachable after 3 attempts — running without cache");
            try { client?.disconnect(); } catch {}
          }
          return null;
        }
        return Math.min(times * 500, 2000);
      },
    });

    client.on("connect", () => { connected = true; givenUp = false; console.log("[cache] Redis connected"); });
    client.on("end",     ()  => { connected = false; });
    // Silence ioredis's per-attempt error events — retryStrategy already logs once on final failure
    client.on("error",   ()  => { connected = false; });

    client.connect().catch(() => { /* handled by retryStrategy */ });
  } catch (e) {
    console.warn("[cache] Redis init failed — running without cache:", e.message);
    client = null;
  }
}

init();

export async function cacheGet(key) {
  if (!client || !connected) return null;
  try {
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function cacheSet(key, value, ttlSeconds = 900) {
  if (!client || !connected) return;
  try {
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch { /* swallow */ }
}

export async function cacheDel(key) {
  if (!client || !connected) return;
  try { await client.del(key); } catch { /* swallow */ }
}

// Convenience wrapper — call fn() only when not cached, write the result.
export async function withCache(key, ttlSeconds, fn) {
  const hit = await cacheGet(key);
  if (hit !== null) return hit;
  const fresh = await fn();
  await cacheSet(key, fresh, ttlSeconds);
  return fresh;
}
