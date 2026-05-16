# FitTrack — Roadmap & Future Ideas

## 🟢 Phase 1 — Foundation (Complete)
- [x] Strava OAuth 2.0 integration
- [x] Dashboard with weekly summary + distance chart
- [x] Activities list with search, filter, sort
- [x] Individual workout detail with route map, HR, pace charts
- [x] Analytics: monthly trends, type distribution, pace trend, consistency grid
- [x] Workout comparison tool
- [x] Smart insights generation
- [x] Athlete profile with PRs and achievements

---

## 🟢 Phase 2 — Data Depth (Complete)
- [x] **Real GPS route maps** — Leaflet + CartoDB dark tiles, auto-fit bounds, start/end markers
- [x] **Live HR zones** — Z1–Z5 calculated from heartrate stream, stacked zone bar with legend
- [x] **Splits + lap data** — Splits table with per-km pace, elevation delta, fast-split highlight
- [x] **Elevation profiles** — Interactive altitude area chart from altitude stream
- [x] **Cadence & power data** — Live cadence line chart + power area chart with avg reference line
- [x] **Segment analysis** — Segment efforts list with PR/2nd/3rd badges and distance/HR
- [x] **Gear tracking** — Shoe + bike mileage with replace-soon warnings (700 km / 10,000 km thresholds)
- [x] **Multi-sport support** — 30+ activity types with icons, colors, CSS classes, pace/speed logic

---

## 🟢 Phase 3 — Intelligence Layer (In Progress)
- [x] **AI Fitness Coach** (Claude API) — conversational coach that reads your Strava data and gives personalised advice (claude-sonnet-4-6, coach.js backend, CoachPage.jsx chat UI)
- [ ] **VO2 Max estimation** — calculated from pace + HR data using standard formulas
- [ ] **Training load score** — TRIMP or similar weekly training stress metric
- [ ] **Race readiness scoring** — model readiness for a target race distance/date
- [ ] **Fatigue detection** — flag overtraining signals (elevated resting HR trend, pace regression)
- [ ] **Injury risk prediction** — flag sharp weekly mileage spikes (>10% rule violation)
- [ ] **Adaptive training plans** — auto-adjust 8-week plan based on completed workouts
- [ ] **Natural language query** — "Show me my best 5K pace this year"
- [ ] **HR zone personalisation** — let user input their actual max HR or lactate threshold HR
- [ ] **Weekly zone distribution chart** — show time in each HR zone across the week

---

## 🟣 Phase 4 — Social & Goals
- [x] **Goals system** — set time/distance targets with auto-progress from Strava data (localStorage, GoalsPage.jsx)
- [ ] **Milestones** — automatic celebration on PRs, distance achievements
- [ ] **Challenges** — monthly community challenges (e.g. "Run 100 km in January")
- [ ] **Social sharing** — share workout cards as images to Instagram/Twitter
- [ ] **Leaderboards** — compare against friends who also connect Strava
- [ ] **Coaching dashboards** — coach can view athlete's data with their permission
- [ ] **Streak system** — daily/weekly activity streak with longest-streak record

---

## 🔴 Phase 5 — Health Integration
- [ ] **Garmin Connect sync** — import from Garmin as alternative to Strava
- [ ] **Apple Health / Google Fit** — resting HR, sleep, HRV data
- [ ] **Sleep recovery correlation** — overlay sleep quality with training performance
- [ ] **Hydration logging** — manual or wearable-integrated
- [ ] **Nutrition tracking** — calorie balance vs training load
- [ ] **HRV trend analysis** — morning HRV as readiness indicator
- [ ] **Body weight logging** — track weight trends alongside training volume

---

## ⚙️ Technical Improvements
- [ ] **PostgreSQL + Prisma** — persist synced activities, avoid re-fetching Strava on every page load
- [ ] **Redis caching** — cache Strava API responses (15 min TTL) to avoid rate limits
- [ ] **Background sync job** — nightly cron to pull new activities automatically
- [ ] **Webhook support** — Strava webhooks for real-time activity push
- [ ] **PWA** — offline support, home screen install, push notifications
- [ ] **React Query** — server state management, caching, background refetch
- [ ] **Unit + integration tests** — Vitest for frontend, Jest + Supertest for backend
- [ ] **Docker Compose** — single command to spin up frontend + backend + DB + Redis
- [ ] **CI/CD pipeline** — GitHub Actions: lint → test → build → deploy
- [ ] **Multi-user support** — proper user accounts, not just session-based single user
- [ ] **Stream data caching** — cache activity streams to avoid re-fetching on revisit

---

## 💡 UX Improvements
- [x] **Dark/Light mode toggle**
- [x] **Mobile sidebar drawer** with hamburger toggle
- [x] **Keyboard shortcuts** — press `D` for dashboard, `A` for activities, etc.
- [x] **Onboarding flow** — guided tour for first-time users
- [x] **Notification system** — in-app toasts for sync status, new PRs
- [x] **Date range picker** — filter all views to custom date ranges
- [x] **Export to CSV** — download your training data
- [ ] **Activity heatmap calendar** — GitHub-style heatmap on profile showing active days
- [ ] **Export to PDF** — printable training summaries
- [x] **Map style toggle** — switch between dark/light/satellite tile layers
- [ ] **Lap detail modal** — click a lap/split row to see that lap's HR + pace chart
- [ ] **Animated route replay** — animate a dot along the GPS route at workout pace

---

## Priority Recommendation (Next Steps)
1. Add **PostgreSQL + Prisma** so data persists between sessions (biggest UX win)
2. ~~Build the **AI Fitness Coach**~~ ✅ Done — `/coach` route + CoachPage.jsx with Claude Sonnet
3. ~~Add **React Query**~~ ✅ Done — @tanstack/react-query v5; all hooks migrated; 5-min stale time, 30-min cache, window-focus refetch, devtools in dev mode
4. ~~Implement **Strava webhooks**~~ ✅ Done — event validation, delivery handler, subscription management UI in Profile; frontend auto-refetches on new events
5. ~~Add the **Goals system**~~ ✅ Done — localStorage-based goals with live Strava progress
