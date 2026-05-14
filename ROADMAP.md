# FitTrack — Roadmap & Future Ideas

## 🟢 Phase 1 — Foundation (Current)
- [x] Strava OAuth 2.0 integration
- [x] Dashboard with weekly summary + distance chart
- [x] Activities list with search, filter, sort
- [x] Individual workout detail with route map, HR, pace charts
- [x] Analytics: monthly trends, type distribution, pace trend, consistency grid
- [x] Workout comparison tool
- [x] Smart insights generation
- [x] Athlete profile with PRs and achievements

---

## 🔵 Phase 2 — Data Depth
- [ ] **Real GPS route maps** using Mapbox GL JS or Leaflet with actual stream data
- [ ] **Live HR zones** — calculate and visualise Z1–Z5 from heart rate streams
- [ ] **Splits + lap data** — display official splits for runs (5K, 10K markers)
- [ ] **Elevation profiles** — interactive altitude chart per workout
- [ ] **Cadence & power data** — for cyclists with power meters
- [ ] **Segment analysis** — highlight Strava segments within a run
- [ ] **Gear tracking** — track shoe/bike mileage, flag when to replace
- [ ] **Multi-sport support** — triathlon bricks, open water swims

---

## 🟡 Phase 3 — Intelligence Layer
- [ ] **AI Fitness Coach** (Claude API) — conversational coach that reads your data and gives personalised advice
- [ ] **VO2 Max estimation** — calculated from pace + HR data using standard formulas
- [ ] **Training load score** — TRIMP or similar weekly training stress metric
- [ ] **Race readiness scoring** — model readiness for a target race distance/date
- [ ] **Fatigue detection** — flag overtraining signals (elevated resting HR trend, pace regression)
- [ ] **Injury risk prediction** — flag sharp weekly mileage spikes (>10% rule violation)
- [ ] **Adaptive training plans** — auto-adjust 8-week plan based on completed workouts
- [ ] **Natural language query** — "Show me my best 5K pace this year"

---

## 🟣 Phase 4 — Social & Goals
- [ ] **Goals system** — set time/distance targets with progress tracking
- [ ] **Milestones** — automatic celebration on PRs, distance achievements
- [ ] **Challenges** — monthly community challenges (e.g. "Run 100 km in January")
- [ ] **Social sharing** — share workout cards as images to Instagram/Twitter
- [ ] **Leaderboards** — compare against friends who also connect Strava
- [ ] **Coaching dashboards** — coach can view athlete's data with their permission

---

## 🔴 Phase 5 — Health Integration
- [ ] **Garmin Connect sync** — import from Garmin as alternative to Strava
- [ ] **Apple Health / Google Fit** — resting HR, sleep, HRV data
- [ ] **Sleep recovery correlation** — overlay sleep quality with training performance
- [ ] **Hydration logging** — manual or wearable-integrated
- [ ] **Nutrition tracking** — calorie balance vs training load
- [ ] **HRV trend analysis** — morning HRV as readiness indicator

---

## ⚙️ Technical Improvements
- [ ] **PostgreSQL + Prisma** — persist synced activities, avoid re-fetching Strava on every page load
- [ ] **Redis caching** — cache Strava API responses (15 min TTL) to avoid rate limits
- [ ] **Background sync job** — nightly cron to pull new activities automatically
- [ ] **Webhook support** — Strava webhooks for real-time activity push
- [ ] **PWA** — offline support, home screen install, push notifications
- [ ] **React Router** — replace custom page state with proper URL routing
- [ ] **React Query** — server state management, caching, background refetch
- [ ] **Unit + integration tests** — Vitest for frontend, Jest + Supertest for backend
- [ ] **Docker Compose** — single command to spin up frontend + backend + DB + Redis
- [ ] **CI/CD pipeline** — GitHub Actions: lint → test → build → deploy
- [ ] **Multi-user support** — proper user accounts, not just session-based single user

---

## 💡 UX Improvements
- [ ] **Dark/Light mode toggle**
- [ ] **Mobile sidebar drawer** with hamburger toggle
- [ ] **Keyboard shortcuts** — press `D` for dashboard, `A` for activities, etc.
- [ ] **Onboarding flow** — guided tour for first-time users
- [ ] **Notification system** — in-app toasts for sync status, new PRs
- [ ] **Date range picker** — filter all views to custom date ranges
- [ ] **Export to CSV/PDF** — download your training data

---

## Priority Recommendation (Next Steps)
1. Add **PostgreSQL + Prisma** so data persists between sessions (biggest UX improvement)
2. Integrate **real Mapbox route maps** using the GPS stream data
3. Build the **AI Fitness Coach** page using the Claude API with your activity data as context
4. Add **React Query** for proper loading states and background sync
5. Implement **Strava webhooks** so new workouts appear without manual refresh
