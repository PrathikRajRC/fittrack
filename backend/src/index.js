import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import session from "express-session";
import { rateLimit } from "express-rate-limit";

import authRoutes from "./routes/auth.js";
import athleteRoutes from "./routes/athlete.js";
import activitiesRoutes from "./routes/activities.js";
import analyticsRoutes from "./routes/analytics.js";
import coachRoutes    from "./routes/coach.js";
import goalsRoutes    from "./routes/goals.js";
import webhookRoutes  from "./routes/webhooks.js";

import { errorHandler } from "./middleware/errorHandler.js";
import { requireAuth } from "./middleware/requireAuth.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Trust Render/Netlify reverse proxy so req.secure works for secure cookies
app.set("trust proxy", 1);

// ── Security & logging ──────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));

// ── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Session ─────────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
}));

// ── Rate limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), version: "1.0.0" });
});

// ── Routes ───────────────────────────────────────────────────────────────────
// Webhooks must be mounted BEFORE requireAuth — Strava's servers hit the
// public GET/POST /api/webhooks/strava endpoints with no session cookie.
// The protected routes inside webhooks.js apply requireAuth individually.
app.use("/api/webhooks", webhookRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/athlete", requireAuth, athleteRoutes);
app.use("/api/activities", requireAuth, activitiesRoutes);
app.use("/api/analytics", requireAuth, analyticsRoutes);
app.use("/api/coach",    requireAuth, coachRoutes);
app.use("/api/goals",    requireAuth, goalsRoutes);

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n⚡ FitTrack API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
