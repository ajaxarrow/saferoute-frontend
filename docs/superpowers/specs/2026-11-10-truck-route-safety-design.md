# Truck Route Safety Planner — Design

## Intent
A truck driver (or dispatcher) enters origin, destination, departure time and load weight. The app proposes 3 truck-legal routes, forecasts weather at the time the truck will actually reach each point along each route, classifies risk using fixed thresholds and load rules, and recommends the safest route that does not waste time. Everything is shown on a map with a 0–48 h weather heatmap. This is a coding-challenge deliverable (graded: 40% routing/weather/risk/recommendation logic, 40% UI/map/heatmap smoothness, 15% code quality, 5% docs + Loom). Deliverables: GitHub repo, hosted app, 5–10 min Loom.

## Goals
- Correct, well-tested risk and recommendation logic (pure Python, framework-free).
- Input that a driver can complete in under 20 seconds on a phone.
- Smooth map: slider scrubbing must not re-fetch or re-create layers.
- Clean seams: swapping a routing/weather provider (geocoding and basemap are frontend-only, MapTiler), or adding a new risk factor, touches one module.

## Non-goals
- Own routing engine, user accounts, database, saved trips, turn-by-turn navigation.
- Gusts, visibility, ice/temperature risk (documented as extension points).
- "Best departure window" suggestions (extension point).

## Anti-goals
- Colour as the only risk signal (every level also has a label and icon).
- Silent fallbacks: if fewer than 3 distinct routes exist, or the forecast is truncated, say so in the UI.

## Fixed rules (from the brief)
Wind mph: <25 Low, 25–34 Moderate, 35–44 High, 45–54 Severe, ≥55 No Travel.
Rain in/hr: <0.10 Low, 0.10–0.25 Moderate, 0.25–0.50 High, 0.50–1.00 Severe, >1.00 No Travel.
Snow in/hr: <0.5 Low, 0.5–1.0 Moderate, 1.0–2.0 High, 2.0–3.0 Severe, >3.0 No Travel.
Load rules: wind ≥55 → No Travel (any load); wind 45–54 and load >30,000 lb → No Travel; wind 35–44 and load >40,000 lb → Severe.
Recommendation preference order: fewest Severe miles → fewest High miles → lowest average risk → shortest time.
Checkpoint sampling interval: user chooses 10 / 25 / 50 miles. ETA at each checkpoint drives which forecast hour is used.

## Decisions (my calls, not user-stated)
- **Boundaries:** lower bound inclusive for every band (25 mph is Moderate). Rain/snow top band is upper-inclusive (1.00 in/hr is Severe, 1.01 is No Travel) so it matches the brief's ">1.00".
- **No Travel** is ranked above Severe: a route with No Travel miles loses to any route without them. If every route has No Travel miles, the banner says so and still shows the least-bad one.
- **Tie tolerance:** Severe/High/No-Travel miles are compared in 5-mile buckets (`RECOMMEND_BUCKET_MILES`), so a 2-mile difference does not override a 40-minute time saving. This is how "balancing risk and time" is made concrete.
- **Mile attribution:** each checkpoint owns the stretch halfway to its neighbours.
- **Average risk:** mile-weighted mean of level values (Low=0 … No Travel=4).
- **Routing:** OpenRouteService `driving-hgv`. Public API caps alternative routes at 100 km, so: native alternatives for trips under ~100 km straight-line, otherwise generate detours through perpendicular via-points and drop near-duplicates. Provider sits behind a `RoutingProvider` protocol (HERE is the likely swap).
- **Weather:** Open-Meteo hourly (wind_speed_10m mph, rain+showers in/hr, snowfall in/hr), cached per 0.01° grid cell for 30 min. Sustained wind, not gusts.
- **Time zones:** departure is entered as origin-local time; each checkpoint also carries its own IANA zone for display.
- **Heatmap:** weather-only risk (with load rules applied) at points spaced along all routes, for hours 0–48 after departure; sent once, scrubbed client-side.
- **No database.** Recent places live in browser localStorage.
- **Limits:** load 0–80,000 lb; departure from now−1h to now+7 days; max 300 checkpoints per route (interval auto-widens and the response reports `effective_interval_miles`).
- **Stack:** Django + DRF (`backend/`), React + Vite + TypeScript + Tailwind + shadcn/ui + TanStack Query + MapLibre GL (`frontend/`). Hosting: Render (API), Netlify (web).

## Left to the builder
Exact visual styling within the token system, copy wording, component internals, test fixtures.
