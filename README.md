## Weather Dashboard (React + Node + Express + MongoDB)

A full‑stack weather dashboard showing current conditions and 5‑day forecasts for multiple cities. Includes add/remove cities, caching, responsive UI, AQI display, and sunrise/sunset info.

### Tech Stack
- Frontend: React (Vite)
- Backend: Node.js, Express
- Database: MongoDB (optional; app falls back to in‑memory if unavailable)
- APIs: OpenWeatherMap Current/Forecast/Air Pollution

### Features
- Current weather: temperature, description, icon, humidity, wind
- 5‑day forecast
- Add/remove cities with confirmation modal
- Sunrise/Sunset card (local times) 🌅/🌇
- Air Quality Index card (AQI 1–5 with color + label)
- Frontend caching (localStorage, 10‑minute TTL) with "Last updated …"
- Error handling with colored toasts (add: green; remove: red; invalid city: red)
- Responsive layout (desktop/mobile)

---

### Prerequisites
- Node.js 18+
- npm 10+
- OpenWeatherMap API key (free)
- MongoDB Atlas

### Setup
```bash
# From the repo root
cd server && npm i
cd ../client && npm i
```

Create `server/.env`:
```ini
PORT=5000
MONGODB_URI=
# Example Atlas: mongodb+srv://<user>:<pass>@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority
OPENWEATHER_API_KEY=YOUR_OPENWEATHER_API_KEY
```

### Run
```bash
# Backend
cd server
npm run start    # or: npm run dev

# Frontend
cd ../client
npm run dev
```
- Frontend: http://localhost:5173 (proxies /api to backend)
- Backend: http://localhost:5000
- If MongoDB is not running, backend logs a warning and uses in‑memory storage (non‑persistent).

---

### API Documentation (Base: /api)

- GET `/weather/current?city=London`
  - Returns normalized current weather with sunrise/sunset/timezone and AQI if available:
  - `{ city, coord, temperature, description, icon, humidity, windSpeed, dt, sunrise, sunset, timezone, airQuality?: { index, text } }`

- GET `/weather/forecast?city=London`
  - Returns 5‑day forecast (midday snapshots when possible):
  - `{ city, days: [ { date, temperature, description, icon } ] }`

- GET `/cities`
  - `{ cities: string[] }`

- POST `/cities` body: `{ city: string }`
  - Adds city (idempotent on server)
  - Returns `{ cities }`

- DELETE `/cities/:city`
  - Removes city; status 204

Errors: `{ error: string }` with appropriate HTTP status (e.g., 400 invalid input, 404 unknown city from upstream, 5xx server/upstream issues). Backend maps OpenWeather 401/404 to helpful messages.

---

### Frontend Behavior
- Caching: Per‑city object persisted in `localStorage` with a timestamp; reused if <10 minutes old. Stale cache used on network errors when available.
- Last Updated: City cards show “Last updated X minutes ago” based on the cache timestamp.
- Toaster: Top‑right, auto‑dismisses (3s). Variants:
  - Success (green): city added
  - Error (red): city removed; invalid/misspelled city
- Delete Confirmation: Modal asks before removing a city (Yes/Cancel).
- City Name Formatting: Displayed in Title Case (e.g., “new york” → “New York”).

---

### Assumptions
- Single default user; no authentication.
- Metric units (°C).
- Forecast uses midday entries for readability.

### Known Limitations
- In‑memory server fallback is non‑persistent and resets on restart.
- Date/time formatting is basic and uses the browser locale.
- AQI requires successful coords lookup; if the AQI call fails, UI shows “AQI unavailable”.

### Future Improvements
- Per‑user city lists with authentication
- Enhanced forecast (min/max, precipitation)
- Localization and better date/time handling
- PWA/offline mode and background sync
- Docker Compose (Node + MongoDB) for one‑command startup

### AI Tools Used
- Cursor (GPT assistant) for scaffolding, and documentation support.



