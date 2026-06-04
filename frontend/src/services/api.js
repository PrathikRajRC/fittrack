import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: true, // send session cookie
});

// Response interceptor — redirect to landing ONLY when the app session itself
// expired (backend sends code: "SESSION_EXPIRED"). A downstream Strava 401/403
// is surfaced as 502 by the backend and must NOT bounce the user to connect.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const sessionExpired =
      err.response?.status === 401 && err.response?.data?.code === "SESSION_EXPIRED";
    if (sessionExpired) {
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
  forceSync:  ()           => api.post("/activities/sync"),
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

// ── Natural Language Query ────────────────────────────────────────────────────
export const queryApi = {
  ask: (question) => api.post("/query", { question }),
};

// ── Import persistence (saved Strava export, per account) ─────────────────────
export const importApi = {
  get:    ()                     => api.get("/import"),
  save:   (athlete, activities)  => api.post("/import/save", { athlete, activities }),
  remove: ()                     => api.delete("/import"),
};

// ── Goals ─────────────────────────────────────────────────────────────────────
export const goalsApi = {
  list:   ()   => api.get("/goals"),
  create: (g)  => api.post("/goals", g),
  delete: (id) => api.delete(`/goals/${id}`),
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  config:      ()                       => api.get("/auth/config"),
  register:    (email, password, name) => api.post("/auth/register", { email, password, name }),
  login:       (email, password)       => api.post("/auth/login", { email, password }),
  me:          ()                       => api.get("/auth/me"),
  logout:      ()                       => api.post("/auth/logout"),
  unlinkStrava:()                       => api.post("/auth/strava/unlink"),
  deleteData:  ()                       => api.delete("/auth/data"),
};

// ── Webhooks ──────────────────────────────────────────────────────────────────
export const webhookApi = {
  getEvents:      ()   => api.get("/webhooks/events"),
  getSubscription: ()  => api.get("/webhooks/subscription"),
  subscribe:      ()   => api.post("/webhooks/subscribe"),
  unsubscribe:    (id) => api.delete(`/webhooks/unsubscribe/${id}`),
};
