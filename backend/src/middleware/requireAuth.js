/**
 * Middleware: require a valid authenticated session.
 * Attaches session tokens to req.stravaToken for downstream use.
 */
export function requireAuth(req, res, next) {
  if (!req.session?.athlete) {
    return res.status(401).json({
      error: "Unauthorized",
      // The frontend redirects to the connect page ONLY on this code, so a
      // downstream Strava 401 is never mistaken for an expired app session.
      code: "SESSION_EXPIRED",
      message: "Please connect your Strava account first.",
    });
  }
  req.stravaToken = req.session.tokens;
  req.athlete = req.session.athlete;
  next();
}
