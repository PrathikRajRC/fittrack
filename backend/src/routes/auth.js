import { Router } from "express";
import { getAuthUrl, exchangeCode } from "../services/stravaService.js";
import { syncActivities } from "../services/activitySync.js";
import prisma from "../services/db.js";

const router = Router();

router.get("/strava", (req, res) => {
  const state = Math.random().toString(36).slice(2);
  req.session.oauthState = state;
  res.redirect(getAuthUrl(state));
});

router.get("/callback", async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    if (error) return res.redirect(`${process.env.FRONTEND_URL}/?error=access_denied`);
    if (state !== req.session.oauthState) {
      return res.status(403).json({ error: "State mismatch — possible CSRF attempt" });
    }

    const tokenData = await exchangeCode(code);
    const athlete   = tokenData.athlete;

    // ── Persist athlete + tokens to DB ────────────────────────────────────────
    await prisma.athlete.upsert({
      where:  { id: athlete.id },
      update: { data: JSON.stringify(athlete), updatedAt: new Date() },
      create: { id: athlete.id, data: JSON.stringify(athlete) },
    });

    await prisma.athleteToken.upsert({
      where:  { athleteId: athlete.id },
      update: {
        accessToken:  tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt:    tokenData.expires_at,
        updatedAt:    new Date(),
      },
      create: {
        athleteId:    athlete.id,
        accessToken:  tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt:    tokenData.expires_at,
      },
    });

    // ── Session ───────────────────────────────────────────────────────────────
    req.session.tokens = {
      access_token:  tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at:    tokenData.expires_at,
    };
    req.session.athlete = {
      id:         athlete.id,
      firstname:  athlete.firstname,
      lastname:   athlete.lastname,
      profile:    athlete.profile,
      city:       athlete.city,
      country:    athlete.country,
      sex:        athlete.sex,
      created_at: athlete.created_at,
    };

    // ── Background sync (fire-and-forget — don't block the redirect) ──────────
    syncActivities(req.session, athlete.id).catch((err) =>
      console.error("[auth] background sync failed:", err.message)
    );

    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (err) {
    next(err);
  }
});

router.get("/me", (req, res) => {
  if (!req.session?.athlete) return res.json({ authenticated: false });
  res.json({ authenticated: true, athlete: req.session.athlete });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

export default router;
