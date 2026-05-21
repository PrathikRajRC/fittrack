import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { activitiesApi, athleteApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

// ── Query key factories ───────────────────────────────────────────────────────
export const activityKeys = {
  all:     ()         => ["activities"],
  list:    (params)   => ["activities", "list",    params],
  detail:  (id)       => ["activities", "detail",  id],
  streams: (id)       => ["activities", "streams", id],
};

function getImportActivities() {
  try {
    const raw = localStorage.getItem("runlytics_import_activities");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ── useActivities ─────────────────────────────────────────────────────────────
export function useActivities(params = {}) {
  const { isImportMode } = useAuth();
  const queryClient = useQueryClient();

  const { data: apiActivities = [], isPending: loading, isFetching, error, refetch } = useQuery({
    queryKey: activityKeys.list(params),
    queryFn:  () => activitiesApi.list(params).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    enabled:  !isImportMode,
  });

  const importActivities = useMemo(() => {
    if (!isImportMode) return [];
    return getImportActivities();
  }, [isImportMode]);

  useEffect(() => {
    if (isImportMode) return;
    const handler = () =>
      queryClient.invalidateQueries({ queryKey: activityKeys.all() });
    window.addEventListener("runlytics:new-activities", handler);
    return () => window.removeEventListener("runlytics:new-activities", handler);
  }, [queryClient, isImportMode]);

  if (isImportMode) {
    return { activities: importActivities, loading: false, isFetching: false, error: null, refetch: () => {} };
  }

  return { activities: apiActivities, loading, isFetching, error, refetch };
}

// ── useActivity ───────────────────────────────────────────────────────────────
export function useActivity(id) {
  const { isImportMode } = useAuth();

  const importActivity = useMemo(() => {
    if (!isImportMode || !id) return null;
    const all = getImportActivities();
    return all.find((a) => String(a.id) === String(id)) ?? null;
  }, [isImportMode, id]);

  const { data: activity = null, isPending: loading, error } = useQuery({
    queryKey: activityKeys.detail(id),
    queryFn:  () => activitiesApi.getById(id).then((r) => r.data),
    enabled:  !!id && !isImportMode,
    staleTime: 30 * 60 * 1000,
  });

  if (isImportMode) return { activity: importActivity, loading: false, error: null };
  return { activity, loading, error };
}

// ── useActivityStreams ────────────────────────────────────────────────────────
export function useActivityStreams(id) {
  const { isImportMode } = useAuth();

  const { data: streams = null, isPending: loading } = useQuery({
    queryKey: activityKeys.streams(id),
    queryFn:  () =>
      activitiesApi
        .getStreams(id, "heartrate,altitude,cadence,watts,time,velocity_smooth")
        .then((r) => r.data),
    enabled:   !!id && !isImportMode,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime:    60 * 60 * 1000,
  });

  if (isImportMode) return { streams: null, loading: false };
  return { streams, loading };
}

// ── useAthleteGear ────────────────────────────────────────────────────────────
export function useAthleteGear() {
  const { isImportMode } = useAuth();

  const { data: gear = null, isPending: loading } = useQuery({
    queryKey: ["athlete-gear"],
    queryFn:  () => athleteApi.getGear().then((r) => r.data),
    staleTime: 30 * 60 * 1000,
    enabled:   !isImportMode,
  });

  if (isImportMode) return { gear: null, loading: false };
  return { gear, loading };
}
