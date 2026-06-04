// Google OAuth 2.0 — authorization-code flow (mirrors the Strava flow).

import axios from "axios";
import { googleConfig } from "../config/google.js";

export function getGoogleAuthUrl(state) {
  const params = new URLSearchParams({
    client_id:     googleConfig.clientId,
    redirect_uri:  googleConfig.redirectUri,
    response_type: "code",
    scope:         googleConfig.scopes,
    state:         state || "",
    access_type:   "online",
    prompt:        "select_account",
  });
  return `${googleConfig.authUrl}?${params}`;
}

export async function exchangeGoogleCode(code) {
  const { data } = await axios.post(googleConfig.tokenUrl, {
    client_id:     googleConfig.clientId,
    client_secret: googleConfig.clientSecret,
    code,
    grant_type:    "authorization_code",
    redirect_uri:  googleConfig.redirectUri,
  });
  return data; // { access_token, id_token, expires_in, ... }
}

// Fetch the verified profile for the access token.
export async function getGoogleProfile(accessToken) {
  const { data } = await axios.get(googleConfig.userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  // { sub, email, email_verified, name, picture, given_name, ... }
  return data;
}
