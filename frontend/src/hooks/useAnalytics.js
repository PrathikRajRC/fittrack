import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  groupByWeek, groupByMonth, paceTrend, typeDistribution,
  consistencyGrid, lifetimeSummary, generateInsights,
} from "../utils/analytics.js";

const STALE = 10 * 60 * 1000;

function getImportActivities() {
  try {
    const raw = localStorage.getItem("runlytics_import_activities");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function useAnalyticsTrends() {
  const { isImportMode } = useAuth();

  const { data, isPending: loading } = useQuery({
    queryKey: ["analytics", "trends"],
    queryFn:  () => analyticsApi.trends().then((r) => r.data),
    staleTime: STALE,
    enabled:  !isImportMode,
  });

  if (isImportMode) {
    const activities = getImportActivities();
    return {
      data: {
        weekly:           groupByWeek(activities),
        monthly:          groupByMonth(activities),
        paceTrend:        paceTrend(activities, "Run"),
        typeDistribution: typeDistribution(activities),
        consistency:      consistencyGrid(activities, 84),
      },
      loading: false,
    };
  }

  return { data, loading };
}

export function useAnalyticsSummary() {
  const { isImportMode } = useAuth();

  const { data, isPending: loading } = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn:  () => analyticsApi.summary().then((r) => r.data),
    staleTime: STALE,
    enabled:  !isImportMode,
  });

  if (isImportMode) {
    const activities = getImportActivities();
    return { data: lifetimeSummary(activities), loading: false };
  }

  return { data, loading };
}

export function useInsights() {
  const { isImportMode } = useAuth();

  const { data, isPending: loading } = useQuery({
    queryKey: ["analytics", "insights"],
    queryFn:  () => analyticsApi.insights().then((r) => r.data),
    staleTime: STALE,
    enabled:  !isImportMode,
  });

  if (isImportMode) {
    const activities = getImportActivities();
    return { data: { insights: generateInsights(activities) }, loading: false };
  }

  return { data, loading };
}
