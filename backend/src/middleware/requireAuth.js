/**
 * Middleware: require a logged-in app account (session.userId).
 *
 * Source of truth for "logged in" is the user account. If that user has a
 * linked Strava athlete, we lazily rehydrate req.session.athlete + tokens from
 * the DB so the existing Strava routes (which read req.session.athlete) keep
 * working unchanged.
 */
import prisma from "../services/db.js";

export async function requireAuth(req, res, next) {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({
        error: "Unauthorized",
        code: "SESSION_EXPIRED",
        message: "Please sign in to continue.",
      });
    }

    req.userId = req.session.userId;

    // Rehydrate the linked Strava athlete into the session if we don't have it
    // yet (e.g. linked in another tab, or session restored without athlete).
    if (!req.session.athlete) {
      const athlete = await prisma.athlete.findUnique({
        where:   { userId: req.session.userId },
        include: { token: true },
      });
      if (athlete) {
        const data = JSON.parse(athlete.data);
        req.session.athlete = {
          id:         athlete.id,
          firstname:  data.firstname,
          lastname:   data.lastname,
          profile:    data.profile,
          city:       data.city,
          country:    data.country,
          sex:        data.sex,
          created_at: data.created_at,
        };
        if (athlete.token) {
          req.session.tokens = {
            access_token:  athlete.token.accessToken,
            refresh_token: athlete.token.refreshToken,
            expires_at:    athlete.token.expiresAt,
          };
        }
      }
    }

    if (req.session.athlete) req.athlete = req.session.athlete;
    next();
  } catch (err) {
    next(err);
  }
}
