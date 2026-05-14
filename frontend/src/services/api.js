import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: true, // send session cookie
});

// Response interceptor — redirect to home on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

// ── Athlete ──────────────────────────────────────────────────────────────────
export const athleteApi = {
  getProfile: () => api.get("/athlete"),
  getStats:   () => api.get("/athlete/stats"),
};

// ── Activities ───────────────────────────────────────────────────────────────
export const activitiesApi = {
  list:       (params) => api.get("/activities", { params }),
  getById:    (id)     => api.get(`/activities/${id}`),
  getStreams:  (id, keys) => api.get(`/activities/${id}/streams`, { params: { keys } }),
};

// ── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  summary:  () => api.get("/analytics/summary"),
  trends:   () => api.get("/analytics/trends"),
  insights: () => api.get("/analytics/insights"),
};
