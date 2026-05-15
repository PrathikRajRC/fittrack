import { useState, useEffect } from "react";
import { analyticsApi } from "../services/api.js";

export function useAnalyticsTrends() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.trends()
      .then(({ data: d }) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

export function useAnalyticsSummary() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.summary()
      .then(({ data: d }) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

export function useInsights() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.insights()
      .then(({ data: d }) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
