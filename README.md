# ⚡ FitTrack

**Personal Fitness Analytics Platform** — Connect your Strava account and unlock deep performance intelligence.

---

## Project Structure

```
fittrack/
├── frontend/               # React + Vite SPA
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ui/         # Primitives: Card, Badge, Button, etc.
│   │   │   ├── charts/     # Chart wrappers: DistanceChart, PaceChart, etc.
│   │   │   └── layout/     # Sidebar, Topbar, Layout shell
│   │   ├── pages/          # Route-level page components
│   │   ├── hooks/          # Custom React hooks (useWorkouts, useAthlete, etc.)
│   │   ├── services/       # API client (axios) — talks to backend
│   │   ├── context/        # AuthContext, ThemeContext
│   │   ├── utils/          # formatters, calculations, constants
│   │   └── styles/         # Global CSS, design tokens
│   ├── index.html
│   └── vite.config.js
│
├── backend/                # Node.js + Express REST API
│   ├── src/
│   │   ├── routes/         # Express route definitions
│   │   ├── controllers/    # Route handler logic
│   │   ├── services/       # Business logic (Strava API, analytics)
│   │   ├── models/         # Data models / DB schemas
│   │   ├── middleware/      # Auth, error handling, rate limiting
│   │   └── config/         # Environment config, DB connection
│   ├── .env.example
│   └── package.json
│
├── package.json            # Root workspace config
└── README.md
```

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up backend environment
```bash
cp backend/.env.example backend/.env
# Fill in your Strava API credentials
```

### 3. Run both servers in parallel
```bash
npm run dev
```

- Frontend → http://localhost:5173
- Backend API → http://localhost:3001

---

## Strava OAuth Setup

1. Go to [strava.com/settings/api](https://www.strava.com/settings/api)
2. Create an application
3. Set **Authorization Callback Domain** to `localhost`
4. Copy your **Client ID** and **Client Secret** into `backend/.env`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Recharts, React Router v6 |
| Backend | Node.js, Express 5, Axios |
| Auth | Strava OAuth 2.0 (PKCE flow) |
| Database | PostgreSQL + Prisma ORM *(optional — defaults to in-memory)* |
| Styling | Custom CSS with design tokens (no framework) |
| Charts | Recharts |
| Maps | SVG route rendering (Mapbox-ready) |

---

## Environment Variables

### Backend (`backend/.env`)
```
PORT=3001
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REDIRECT_URI=http://localhost:3001/api/auth/callback
SESSION_SECRET=your_random_session_secret
DATABASE_URL=postgresql://user:password@localhost:5432/fittrack
NODE_ENV=development
```

### Frontend (`frontend/.env.local`)
```
VITE_API_BASE_URL=http://localhost:3001/api
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/auth/strava` | Redirect to Strava OAuth |
| GET | `/api/auth/callback` | OAuth callback, exchange code for token |
| GET | `/api/auth/logout` | Clear session |
| GET | `/api/athlete` | Get authenticated athlete profile |
| GET | `/api/activities` | List activities (paginated, filterable) |
| GET | `/api/activities/:id` | Single activity detail |
| GET | `/api/activities/:id/streams` | GPS + HR + power streams |
| GET | `/api/analytics/summary` | Aggregated training stats |
| GET | `/api/analytics/trends` | Weekly/monthly trends |
| GET | `/api/analytics/insights` | Generated smart insights |

---

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for planned features and future ideas.
