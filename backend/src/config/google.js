export const googleConfig = {
  clientId:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri:  process.env.GOOGLE_REDIRECT_URI || "http://localhost:3001/api/auth/google/callback",
  authUrl:      "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl:     "https://oauth2.googleapis.com/token",
  userInfoUrl:  "https://www.googleapis.com/oauth2/v3/userinfo",
  scopes:       "openid email profile",
};

export function isGoogleConfigured() {
  return !!(googleConfig.clientId && googleConfig.clientSecret);
}
