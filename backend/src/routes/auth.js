import { Router } from "express";
import { getAuthUrl, exchangeCode, getAthlete } from "../services/stravaService.js";

const router = Router();

/**
 * GET /api/auth/strava
 * Redirect user to Strava's OAuth consent page.
 */
router.get("/strava", (req, res) => {
  const state = Math.random().toString(36).slice(2); // CSRF token
  req.session.oauthState = state;
  res.redirect(getAuthUrl(state));
});

/**
 * GET /api/auth/callback
 * Strava redirects here with ?code=... after the user grants access.
 */
router.get("/callback", async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/?error=access_denied`);
    }

    // Basic CSRF check
    if (state !== req.session.oauthState) {
      return res.status(403).json({ error: "State mismatch — possible CSRF attempt" });
    }

    const tokenData = await exchangeCode(code);
    const athlete = tokenData.athlete;

    // Store tokens + athlete in session
    req.session.tokens = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: tokenData.expires_at,
    };
    req.session.athlete = {
      id: athlete.id,
      firstname: athlete.firstname,
      lastname: athlete.lastname,
      profile: athlete.profile,
      city: athlete.city,
      country: athlete.country,
      sex: athlete.sex,
      created_at: athlete.created_at,
    };

    // Redirect back to frontend dashboard
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Return current session's athlete (used by frontend on load).
 */
router.get("/me", (req, res) => {
  if (!req.session?.athlete) {
    return res.json({ authenticated: false });
  }
  res.json({ authenticated: true, athlete: req.session.athlete });
});

/**
 * POST /api/auth/logout
 * Destroy session and clear cookie.
 */
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

export default router;
