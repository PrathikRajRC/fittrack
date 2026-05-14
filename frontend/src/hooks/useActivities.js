import { useState, useEffect } from "react";
import { activitiesApi } from "../services/api.js";
import { MOCK_ACTIVITIES } from "../utils/mockData.js";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export function useActivities(params = {}) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => {
    if (USE_MOCK) {
      setActivities(MOCK_ACTIVITIES);
      setLoading(false);
      return;
    }
    setLoading(true);
    activitiesApi.list(params)
      .then(({ data }) => setActivities(data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  return { activities, loading, error };
}

export function useActivity(id) {
  const [activity, setActivity] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!id) return;
    if (USE_MOCK) {
      const found = MOCK_ACTIVITIES.find((a) => a.id === Number(id));
      setActivity(found || null);
      setLoading(false);
      return;
    }
    setLoading(true);
    activitiesApi.getById(id)
      .then(({ data }) => setActivity(data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [id]);

  return { activity, loading, error };
}
