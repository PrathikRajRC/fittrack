/**
 * Middleware: require a linked Strava account.
 *
 * Runs AFTER requireAuth. The user is logged in, but Strava-dependent routes
 * (activities, analytics, coach, …) also need a connected Strava athlete.
 * Returns a distinct 409 + code so the frontend can show a "Connect Strava"
 * prompt instead of bouncing to the sign-in page.
 */
export function requireStrava(req, res, next) {
  if (!req.session?.athlete?.id) {
    return res.status(409).json({
      error: "Strava not linked",
      code: "STRAVA_NOT_LINKED",
      message: "Connect your Strava account to use this feature.",
    });
  }
  next();
}
