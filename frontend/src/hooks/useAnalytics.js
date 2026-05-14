import { useState, useEffect } from "react";
import { analyticsApi } from "../services/api.js";
import { MOCK_ACTIVITIES } from "../utils/mockData.js";
import {
  groupByWeek, groupByMonth, typeDistribution,
  paceTrend, consistencyGrid, generateInsights, lifetimeSummary,
} from "../utils/analytics.js";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

function buildMockTrends() {
  return {
    weekly:           groupByWeek(MOCK_ACTIVITIES).slice(-12),
    monthly:          groupByMonth(MOCK_ACTIVITIES).slice(-6),
    typeDistribution: typeDistribution(MOCK_ACTIVITIES),
    paceTrend:        paceTrend(MOCK_ACTIVITIES, "Run"),
    consistency:      consistencyGrid(MOCK_ACTIVITIES, 84),
  };
}

export function useAnalyticsTrends() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (USE_MOCK) { setData(buildMockTrends()); setLoading(false); return; }
    analyticsApi.trends()
      .then(({ data: d }) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

export function useAnalyticsSummary() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (USE_MOCK) { setData(lifetimeSummary(MOCK_ACTIVITIES)); setLoading(false); return; }
    analyticsApi.summary()
      .then(({ data: d }) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

export function useInsights() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (USE_MOCK) {
      setData({ insights: generateInsights(MOCK_ACTIVITIES), summary: lifetimeSummary(MOCK_ACTIVITIES) });
      setLoading(false);
      return;
    }
    analyticsApi.insights()
      .then(({ data: d }) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
