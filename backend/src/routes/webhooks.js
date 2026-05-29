/**
 * Strava Webhook Routes
 *
 * PUBLIC  GET  /api/webhooks/strava         — hub.challenge validation
 * PUBLIC  POST /api/webhooks/strava         — receive activity events from Strava
 *
 * AUTH    GET  /api/webhooks/events         — frontend polls for pending events
 * AUTH    GET  /api/webhooks/subscription   — query Strava for current subscription
 * AUTH    POST /api/webhooks/subscribe      — create a new Strava subscription
 * AUTH    DELETE /api/webhooks/unsubscribe/:id — delete subscription
 *
 * NOTE: The GET and POST /strava routes are intentionally public — Strava's
 * servers call them directly and cannot send session cookies.
 */

import { Router } from "express";
import axios from "axios";
import { requireAuth } from "../middleware/requireAuth.js";
import { stravaConfig } from "../config/strava.js";
import { pushEvent, popEvents } from "../services/webhookStore.js";

const router  = Router();
const STRAVA_SUBS_URL = "https://www.strava.com/api/v3/push_subscriptions";

// ── Public: Strava validation handshake ──────────────────────────────────────
router.get("/strava", (req, res) => {
  const {
    "hub.mode":         mode,
    "hub.verify_token": verifyToken,
    "hub.challenge":    challenge,
  } = req.query;

  const expected = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;
  if (!expected) {
    console.warn("[webhook] STRAVA_WEBHOOK_VERIFY_TOKEN is not set in .env");
    return res.status(500).json({ error: "Verify token not configured" });
  }

  if (mode === "subscribe" && verifyToken === expected) {
    return res.json({ "hub.challenge": challenge });
  }

  console.warn("[webhook] Validation rejected — verify_token mismatch");
  res.status(403).json({ error: "Invalid verify_token" });
});

// ── Public: Strava event delivery ─────────────────────────────────────────────
router.post("/strava", (req, res) => {
  // Strava requires a 200 response within 2 seconds — ack first, process after
  res.status(200).send("EVENT_RECEIVED");

  const event = req.body;

  if (
    event.object_type === "activity" &&
    ["create", "update", "delete"].includes(event.aspect_type) &&
    event.owner_id
  ) {
    pushEvent(event.owner_id, {
      type:       event.aspect_type,
      activityId: event.object_id,
      athleteId:  event.owner_id,
    });
  }
});

// ── Auth: Frontend polling endpoint ──────────────────────────────────────────
router.get("/events", requireAuth, (req, res) => {
  const athleteId = req.session.athlete?.id;
  const events    = popEvents(athleteId);
  res.json({ events, athleteId });
});

// ── Auth: View current subscription ──────────────────────────────────────────
router.get("/subscription", requireAuth, async (req, res, next) => {
  try {
    const { data } = await axios.get(STRAVA_SUBS_URL, {
      params: {
        client_id:     stravaConfig.clientId,
        client_secret: stravaConfig.clientSecret,
      },
    });
    res.json({ subscriptions: data });
  } catch (err) {
    next(err);
  }
});

// ── Auth: Create subscription ─────────────────────────────────────────────────
router.post("/subscribe", requireAuth, async (req, res, next) => {
  try {
    const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;
    if (!verifyToken) {
      return res.status(400).json({
        error: "STRAVA_WEBHOOK_VERIFY_TOKEN is not set in backend/.env",
      });
    }

    const callbackUrl =
      process.env.STRAVA_WEBHOOK_CALLBACK_URL ||
      `${req.protocol}://${req.get("host")}/api/webhooks/strava`;

    if (callbackUrl.includes("localhost")) {
      return res.status(400).json({
        error:
          "Strava requires a public HTTPS URL. Set STRAVA_WEBHOOK_CALLBACK_URL to your ngrok/tunnel URL in backend/.env.",
      });
    }

    const { data } = await axios.post(STRAVA_SUBS_URL, {
      client_id:     stravaConfig.clientId,
      client_secret: stravaConfig.clientSecret,
      callback_url:  callbackUrl,
      verify_token:  verifyToken,
    });

    res.json({ subscription: data });
  } catch (err) {
    if (err.response?.status === 422) {
      return res.status(422).json({
        error:   "Subscription already exists. Unsubscribe first, then re-subscribe.",
        details: err.response.data,
      });
    }
    next(err);
  }
});

// ── Auth: Delete subscription ─────────────────────────────────────────────────
router.delete("/unsubscribe/:id", requireAuth, async (req, res, next) => {
  try {
    await axios.delete(`${STRAVA_SUBS_URL}/${req.params.id}`, {
      params: {
        client_id:     stravaConfig.clientId,
        client_secret: stravaConfig.clientSecret,
      },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
