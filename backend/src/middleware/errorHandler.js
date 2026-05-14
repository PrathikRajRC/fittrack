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

  // Strava API errors pass through their own shape
  if (err.response?.data) {
    return res.status(err.response.status || 502).json({
      error: "Strava API Error",
      detail: err.response.data,
    });
  }

  res.status(status).json({ error: message });
}
