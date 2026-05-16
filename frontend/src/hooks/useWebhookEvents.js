import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { webhookApi } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { activityKeys } from "./useActivities.js";

const POLL_MS = 30_000;

/**
 * Polls the backend for webhook events delivered by Strava.
 * When new events arrive it:
 *   1. Shows a toast notification
 *   2. Invalidates the activities query so every useActivities consumer refetches
 *
 * Mount inside an auth-gated component only (the /events endpoint is protected).
 */
export function useWebhookEvents() {
  const toast       = useToast();
  const queryClient = useQueryClient();
  const timerRef    = useRef(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const { data } = await webhookApi.getEvents();
        const events = data.events ?? [];
        if (events.length === 0) return;

        const creates = events.filter((e) => e.type === "create");
        const updates = events.filter((e) => e.type === "update");
        const deletes = events.filter((e) => e.type === "delete");

        if (creates.length > 0)
          toast(`🏃 ${creates.length} new activit${creates.length > 1 ? "ies" : "y"} synced from Strava!`, "success", 5000);
        if (updates.length > 0)
          toast(`✏️ ${updates.length} activit${updates.length > 1 ? "ies" : "y"} updated on Strava`, "info", 3000);
        if (deletes.length > 0)
          toast(`🗑️ ${deletes.length} activit${deletes.length > 1 ? "ies" : "y"} deleted on Strava`, "info", 3000);

        // Invalidate every activities list — React Query will refetch in the background
        queryClient.invalidateQueries({ queryKey: activityKeys.all() });
        // Also refresh analytics since activity data changed
        queryClient.invalidateQueries({ queryKey: ["analytics"] });
      } catch {
        // Silently ignore polling errors (network blip, 401, etc.)
      }
    };

    timerRef.current = setInterval(poll, POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [toast, queryClient]);
}
