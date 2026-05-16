import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../services/api.js";

const STALE = 10 * 60 * 1000; // analytics are fresh for 10 minutes

export function useAnalyticsTrends() {
  const { data, isPending: loading } = useQuery({
    queryKey: ["analytics", "trends"],
    queryFn:  () => analyticsApi.trends().then((r) => r.data),
    staleTime: STALE,
  });
  return { data, loading };
}

export function useAnalyticsSummary() {
  const { data, isPending: loading } = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn:  () => analyticsApi.summary().then((r) => r.data),
    staleTime: STALE,
  });
  return { data, loading };
}

export function useInsights() {
  const { data, isPending: loading } = useQuery({
    queryKey: ["analytics", "insights"],
    queryFn:  () => analyticsApi.insights().then((r) => r.data),
    staleTime: STALE,
  });
  return { data, loading };
}
