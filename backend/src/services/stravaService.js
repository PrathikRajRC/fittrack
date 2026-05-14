import axios from "axios";
import { stravaConfig } from "../config/strava.js";

const stravaApi = axios.create({ baseURL: stravaConfig.apiBase });

/**
 * Build the Strava OAuth authorization URL.
 */
export function getAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: stravaConfig.clientId,
    redirect_uri: stravaConfig.redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: stravaConfig.scopes,
    state: state || "",
  });
  return `${stravaConfig.authUrl}?${params}`;
}

/**
 * Exchange an authorization code for access + refresh tokens.
 */
export async function exchangeCode(code) {
  const { data } = await axios.post(stravaConfig.tokenUrl, {
    client_id: stravaConfig.clientId,
    client_secret: stravaConfig.clientSecret,
    code,
    grant_type: "authorization_code",
  });
  return data;
}

/**
 * Refresh an expired access token using the refresh token.
 */
export async function refreshToken(refreshTok) {
  const { data } = await axios.post(stravaConfig.tokenUrl, {
    client_id: stravaConfig.clientId,
    client_secret: stravaConfig.clientSecret,
    refresh_token: refreshTok,
    grant_type: "refresh_token",
  });
  return data;
}

/**
 * Make an authenticated Strava API call.
 * Automatically refreshes the token if expired.
 */
export async function stravaRequest(session, path, params = {}) {
  let { access_token, refresh_token, expires_at } = session.tokens;

  // Refresh if token expired (with 60s buffer)
  if (Date.now() / 1000 > expires_at - 60) {
    const refreshed = await refreshToken(refresh_token);
    session.tokens = {
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: refreshed.expires_at,
    };
    access_token = refreshed.access_token;
  }

  const { data } = await stravaApi.get(path, {
    headers: { Authorization: `Bearer ${access_token}` },
    params,
  });
  return data;
}

/**
 * Fetch authenticated athlete profile.
 */
export async function getAthlete(session) {
  return stravaRequest(session, "/athlete");
}

/**
 * Fetch a paginated list of activities.
 */
export async function getActivities(session, { page = 1, per_page = 30, before, after } = {}) {
  return stravaRequest(session, "/athlete/activities", { page, per_page, before, after });
}

/**
 * Fetch a single activity by ID.
 */
export async function getActivity(session, id) {
  return stravaRequest(session, `/activities/${id}`);
}

/**
 * Fetch activity streams (GPS, HR, watts, cadence, etc.).
 */
export async function getActivityStreams(session, id, keys = ["latlng", "heartrate", "altitude", "velocity_smooth"]) {
  return stravaRequest(session, `/activities/${id}/streams`, {
    keys: keys.join(","),
    key_by_type: true,
  });
}

/**
 * Fetch athlete stats (totals, records).
 */
export async function getAthleteStats(session, athleteId) {
  return stravaRequest(session, `/athletes/${athleteId}/stats`);
}
