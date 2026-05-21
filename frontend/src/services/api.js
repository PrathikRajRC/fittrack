import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: true, // send session cookie
});

// Response interceptor — redirect to home on 401 (only for real sessions, not import mode)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isImport = !!localStorage.getItem("runlytics_import_athlete");
      if (!isImport) window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

// ── Athlete ──────────────────────────────────────────────────────────────────
export const athleteApi = {
  getProfile: () => api.get("/athlete"),
  getStats:   () => api.get("/athlete/stats"),
  getGear:    () => api.get("/athlete/gear"),
};

// ── Activities ───────────────────────────────────────────────────────────────
export const activitiesApi = {
  list:       (params)     => api.get("/activities", { params }),
  getById:    (id)         => api.get(`/activities/${id}`),
  getStreams:  (id, keys)  => api.get(`/activities/${id}/streams`, { params: { keys } }),
  getLaps:    (id)         => api.get(`/activities/${id}/laps`),
};

// ── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  summary:  () => api.get("/analytics/summary"),
  trends:   () => api.get("/analytics/trends"),
  insights: () => api.get("/analytics/insights"),
};

// ── AI Coach ─────────────────────────────────────────────────────────────────
export const coachApi = {
  chat: (messages) => api.post("/coach/chat", { messages }),
};

// ── Goals ─────────────────────────────────────────────────────────────────────
export const goalsApi = {
  list:   ()   => api.get("/goals"),
  create: (g)  => api.post("/goals", g),
  delete: (id) => api.delete(`/goals/${id}`),
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  logout:     () => api.post("/auth/logout"),
  deleteData: () => api.delete("/auth/data"),
};

// ── Webhooks ──────────────────────────────────────────────────────────────────
export const webhookApi = {
  getEvents:      ()   => api.get("/webhooks/events"),
  getSubscription: ()  => api.get("/webhooks/subscription"),
  subscribe:      ()   => api.post("/webhooks/subscribe"),
  unsubscribe:    (id) => api.delete(`/webhooks/unsubscribe/${id}`),
};
