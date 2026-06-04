// Persistent session store backed by Postgres (Neon).
//
// Without this, express-session uses in-memory storage — which is wiped on every
// server restart/redeploy (and Render's free tier spins down when idle). That
// would log every user out constantly. A Postgres-backed store keeps sessions
// durable across restarts. Falls back to the default MemoryStore if it can't
// initialize, so a misconfiguration never takes auth down entirely.

import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";

export function buildSessionStore() {
  if (!process.env.DATABASE_URL) {
    return null; // dev without a DB → MemoryStore
  }

  try {
    const PgStore = connectPgSimple(session);
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      // Neon requires SSL; the URL already carries sslmode=require.
      ssl: process.env.DATABASE_URL.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : undefined,
    });

    // Don't let a transient pool error crash the process.
    pool.on("error", (err) => console.warn("[session] pg pool error:", err.message));

    const store = new PgStore({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
      pruneSessionInterval: 60 * 60, // prune expired rows hourly
    });

    console.log("[session] using Postgres-backed session store");
    return store;
  } catch (err) {
    console.warn("[session] failed to init Postgres store — falling back to memory:", err.message);
    return null;
  }
}
