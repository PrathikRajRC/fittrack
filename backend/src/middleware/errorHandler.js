/**
 * Centralised Express error handler.
 * All errors thrown with next(err) land here.
 */
export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  if (process.env.NODE_ENV !== "production") {
    console.error(`[ERROR] ${req.method} ${req.path} →`, err);
  }

  // Strava API errors pass through their own shape. Never surface them as 401 —
  // that's reserved for app-session expiry (which redirects to the connect page).
  if (err.response?.data) {
    const upstream = err.response.status || 502;
    const safeStatus = upstream === 401 || upstream === 403 ? 502 : upstream;
    return res.status(safeStatus).json({
      error: "Strava API Error",
      stravaReauthRequired: upstream === 401 || upstream === 403,
      detail: err.response.data,
    });
  }

  res.status(status).json({ error: message });
}
