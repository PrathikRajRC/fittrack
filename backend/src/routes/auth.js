import { Router } from "express";
import { getAuthUrl, exchangeCode } from "../services/stravaService.js";
import { getGoogleAuthUrl, exchangeGoogleCode, getGoogleProfile } from "../services/googleService.js";
import { isGoogleConfigured } from "../config/google.js";
import { syncActivities } from "../services/activitySync.js";
import {
  isValidEmail, passwordProblem, hashPassword, verifyPassword,
  normalizeEmail, publicUser,
} from "../services/authService.js";
import prisma from "../services/db.js";

const router = Router();

// ── Public: which auth providers are available ────────────────────────────────
router.get("/config", (req, res) => {
  res.json({ googleEnabled: isGoogleConfigured() });
});

// ── Google OAuth: begin ───────────────────────────────────────────────────────
router.get("/google", (req, res) => {
  if (!isGoogleConfigured()) {
    return res.redirect(`${process.env.FRONTEND_URL}/?error=google_not_configured`);
  }
  const state = Math.random().toString(36).slice(2);
  req.session.googleState = state;
  res.redirect(getGoogleAuthUrl(state));
});

// ── Google OAuth: callback — find-or-create the account ───────────────────────
router.get("/google/callback", async (req, res, next) => {
  try {
    const { code, state, error } = req.query;
    if (error) return res.redirect(`${process.env.FRONTEND_URL}/?error=google_denied`);
    if (!code || state !== req.session.googleState) {
      return res.redirect(`${process.env.FRONTEND_URL}/?error=google_state`);
    }

    const tokens  = await exchangeGoogleCode(code);
    const profile = await getGoogleProfile(tokens.access_token);
    const email   = normalizeEmail(profile.email || "");
    const googleId = profile.sub;
    if (!email || !googleId) {
      return res.redirect(`${process.env.FRONTEND_URL}/?error=google_profile`);
    }

    // 1) Existing Google account → sign in.
    let user = await prisma.user.findUnique({ where: { googleId } });

    // 2) Existing email account (password) → link Google to it.
    if (!user) {
      const byEmail = await prisma.user.findUnique({ where: { email } });
      if (byEmail) {
        user = await prisma.user.update({
          where: { id: byEmail.id },
          data: {
            googleId,
            name:   byEmail.name   ?? profile.name ?? null,
            avatar: byEmail.avatar ?? profile.picture ?? null,
          },
        });
      }
    }

    // 3) Brand-new account (no password).
    if (!user) {
      user = await prisma.user.create({
        data: { email, googleId, name: profile.name ?? null, avatar: profile.picture ?? null },
      });
    }

    req.session.userId = user.id;

    // Rehydrate a linked Strava athlete into the session, if any.
    const athlete = await prisma.athlete.findUnique({
      where: { userId: user.id }, include: { token: true },
    });
    if (athlete) {
      const data = JSON.parse(athlete.data);
      req.session.athlete = {
        id: athlete.id, firstname: data.firstname, lastname: data.lastname,
        profile: data.profile, city: data.city, country: data.country,
        sex: data.sex, created_at: data.created_at,
      };
      if (athlete.token) {
        req.session.tokens = {
          access_token:  athlete.token.accessToken,
          refresh_token: athlete.token.refreshToken,
          expires_at:    athlete.token.expiresAt,
        };
      }
    }

    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (err) {
    next(err);
  }
});

// ── Account: register ─────────────────────────────────────────────────────────
router.post("/register", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email || "");
    const { password, name } = req.body;

    if (!isValidEmail(email)) return res.status(400).json({ error: "Please enter a valid email address." });
    const pwProblem = passwordProblem(password);
    if (pwProblem) return res.status(400).json({ error: pwProblem });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "An account with this email already exists." });

    const user = await prisma.user.create({
      data: { email, passwordHash: await hashPassword(password), name: name?.trim() || null },
    });

    req.session.userId = user.id;
    res.json({ user: publicUser(user), stravaLinked: false });
  } catch (err) {
    next(err);
  }
});

// ── Account: login ────────────────────────────────────────────────────────────
router.post("/login", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email || "");
    const { password } = req.body;

    const user = await prisma.user.findUnique({
      where:   { email },
      include: { athlete: { include: { token: true } } },
    });
    // Same message for unknown email vs wrong password — don't leak which.
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    req.session.userId = user.id;

    // Rehydrate the linked Strava athlete into the session, if any
    if (user.athlete) {
      const data = JSON.parse(user.athlete.data);
      req.session.athlete = {
        id:         user.athlete.id,
        firstname:  data.firstname,
        lastname:   data.lastname,
        profile:    data.profile,
        city:       data.city,
        country:    data.country,
        sex:        data.sex,
        created_at: data.created_at,
      };
      if (user.athlete.token) {
        req.session.tokens = {
          access_token:  user.athlete.token.accessToken,
          refresh_token: user.athlete.token.refreshToken,
          expires_at:    user.athlete.token.expiresAt,
        };
      }
    }

    res.json({ user: publicUser(user), stravaLinked: !!user.athlete });
  } catch (err) {
    next(err);
  }
});

// ── Account: current session ──────────────────────────────────────────────────
router.get("/me", async (req, res, next) => {
  try {
    if (!req.session?.userId) return res.json({ authenticated: false });

    const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
    if (!user) {
      // Stale session pointing at a deleted user
      return req.session.destroy(() => res.json({ authenticated: false }));
    }

    // Does this account have a saved local-import dataset?
    const importRow = await prisma.importData.findUnique({
      where:  { userId: user.id },
      select: { count: true },
    });

    res.json({
      authenticated: true,
      user:          publicUser(user),
      stravaLinked:  !!req.session.athlete,
      athlete:       req.session.athlete ?? null,
      hasImport:     !!importRow,
      importCount:   importRow?.count ?? 0,
    });
  } catch (err) {
    next(err);
  }
});

// ── Account: logout ───────────────────────────────────────────────────────────
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

// ── Strava: begin OAuth (requires being logged in) ────────────────────────────
router.get("/strava", (req, res) => {
  if (!req.session?.userId) {
    return res.redirect(`${process.env.FRONTEND_URL}/?signin=1`);
  }
  const state = Math.random().toString(36).slice(2);
  req.session.oauthState = state;
  res.redirect(getAuthUrl(state));
});

// ── Strava: OAuth callback — links the athlete to the logged-in user ──────────
router.get("/callback", async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    if (!req.session?.userId) return res.redirect(`${process.env.FRONTEND_URL}/?signin=1`);
    if (error) return res.redirect(`${process.env.FRONTEND_URL}/?error=access_denied`);
    if (state !== req.session.oauthState) {
      return res.status(403).json({ error: "State mismatch — possible CSRF attempt" });
    }

    let tokenData;
    try {
      tokenData = await exchangeCode(code);
    } catch (stravaErr) {
      if (stravaErr.response?.status === 403) {
        return res.redirect(`${process.env.FRONTEND_URL}/?comingsoon=1`);
      }
      throw stravaErr;
    }
    const athlete = tokenData.athlete;

    // Guard: this Strava account may already be linked to a different user.
    const existingLink = await prisma.athlete.findUnique({ where: { id: athlete.id } });
    if (existingLink?.userId && existingLink.userId !== req.session.userId) {
      return res.redirect(`${process.env.FRONTEND_URL}/?error=strava_already_linked`);
    }

    // ── Persist athlete (linked to this user) + tokens ────────────────────────
    await prisma.athlete.upsert({
      where:  { id: athlete.id },
      update: { data: JSON.stringify(athlete), userId: req.session.userId, updatedAt: new Date() },
      create: { id: athlete.id, userId: req.session.userId, data: JSON.stringify(athlete) },
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

    syncActivities(req.session, athlete.id).catch((err) =>
      console.error("[auth] background sync failed:", err.message)
    );

    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (err) {
    next(err);
  }
});

// ── Unlink Strava (keep the account) ──────────────────────────────────────────
router.post("/strava/unlink", async (req, res, next) => {
  try {
    if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized", code: "SESSION_EXPIRED" });
    const athleteId = req.session.athlete?.id;
    if (athleteId) {
      // Deleting the athlete cascades tokens/activities/goals/etc.
      await prisma.athlete.delete({ where: { id: athleteId } }).catch(() => {});
    }
    delete req.session.athlete;
    delete req.session.tokens;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── Delete the whole account (GDPR erasure) — cascades athlete + all data ──────
router.delete("/data", async (req, res, next) => {
  try {
    const userId = req.session?.userId;
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ success: true, message: "Account and all data deleted." });
    });
  } catch (err) {
    next(err);
  }
});

export default router;
