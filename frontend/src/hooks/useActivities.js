import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { activitiesApi, athleteApi } from "../services/api.js";

// ── Query key factories ───────────────────────────────────────────────────────
export const activityKeys = {
  all:     ()         => ["activities"],
  list:    (params)   => ["activities", "list",    params],
  detail:  (id)       => ["activities", "detail",  id],
  streams: (id)       => ["activities", "streams", id],
};

// ── useActivities ─────────────────────────────────────────────────────────────
export function useActivities(params = {}) {
  const queryClient = useQueryClient();

  const { data: activities = [], isPending: loading, isFetching, error, refetch } = useQuery({
    queryKey: activityKeys.list(params),
    queryFn:  () => activitiesApi.list(params).then((r) => r.data),
    staleTime: 5 * 60 * 1000,  // fresh for 5 min
  });

  // Bridge: webhook events (and any other code) can dispatch this DOM event
  // to trigger an invalidation without needing a queryClient reference.
  useEffect(() => {
    const handler = () =>
      queryClient.invalidateQueries({ queryKey: activityKeys.all() });
    window.addEventListener("runlytics:new-activities", handler);
    return () => window.removeEventListener("runlytics:new-activities", handler);
  }, [queryClient]);

  return { activities, loading, isFetching, error, refetch };
}

// ── useActivity ───────────────────────────────────────────────────────────────
export function useActivity(id) {
  const { data: activity = null, isPending: loading, error } = useQuery({
    queryKey: activityKeys.detail(id),
    queryFn:  () => activitiesApi.getById(id).then((r) => r.data),
    enabled:  !!id,
    staleTime: 30 * 60 * 1000, // detail data rarely changes
  });
  return { activity, loading, error };
}

// ── useActivityStreams ────────────────────────────────────────────────────────
export function useActivityStreams(id) {
  const { data: streams = null, isPending: loading } = useQuery({
    queryKey: activityKeys.streams(id),
    queryFn:  () =>
      activitiesApi
        .getStreams(id, "heartrate,altitude,cadence,watts,time,velocity_smooth")
        .then((r) => r.data),
    enabled:   !!id,
    staleTime: 24 * 60 * 60 * 1000, // streams never change — cache for 24 h
    gcTime:    60 * 60 * 1000,
  });
  return { streams, loading };
}

// ── useAthleteGear ────────────────────────────────────────────────────────────
export function useAthleteGear() {
  const { data: gear = null, isPending: loading } = useQuery({
    queryKey: ["athlete-gear"],
    queryFn:  () => athleteApi.getGear().then((r) => r.data),
    staleTime: 30 * 60 * 1000,
  });
  return { gear, loading };
}
