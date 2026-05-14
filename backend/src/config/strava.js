export const stravaConfig = {
  clientId: process.env.STRAVA_CLIENT_ID,
  clientSecret: process.env.STRAVA_CLIENT_SECRET,
  redirectUri: process.env.STRAVA_REDIRECT_URI || "http://localhost:3001/api/auth/callback",
  authUrl: "https://www.strava.com/oauth/authorize",
  tokenUrl: "https://www.strava.com/oauth/token",
  apiBase: "https://www.strava.com/api/v3",
  scopes: "read,activity:read_all,profile:read_all",
};
