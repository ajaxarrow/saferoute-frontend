# Truck Route Safety Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A React + Django app that proposes 3 truck routes, scores weather risk at ETA-timed checkpoints, recommends the safest, and shows routes + a 0–48 h weather heatmap on a MapLibre map.

**Architecture:** Django exposes `POST /api/plan/` and `GET /api/geocode/`. All business logic lives in a framework-free `planner/domain/` package (risk rules, geometry/ETA, scoring/ranking) behind provider protocols (`RoutingProvider`, `WeatherProvider`, `GeocodingProvider`) so API vendors are swappable. The React app is feature-foldered; one risk-style module drives every colour/label/icon; the map owns imperative MapLibre objects and the slider mutates a paint property only.

**Tech Stack:** Python 3.12, Django 5, DRF, httpx, timezonefinder, pytest(-django), respx · React 18, Vite, TypeScript, Tailwind, shadcn/ui, TanStack Query, maplibre-gl, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-10-truck-route-safety-design.md`

## Global Constraints

- Layout: `/home/ajaxarrow/spotter-assessment/{backend,frontend,docs}`; one git repo at the root.
- Risk bands (lower bound inclusive; rain/snow top band upper-inclusive): wind <25/<35/<45/<55/≥55 mph; rain <0.10/<0.25/<0.50/≤1.00/>1.00 in/hr; snow <0.5/<1.0/<2.0/≤3.0/>3.0 in/hr.
- Load rules: wind ≥55 → NO_TRAVEL any load; wind 45–54 and load >30,000 lb → NO_TRAVEL; wind 35–44 and load >40,000 lb → SEVERE (strictly greater-than).
- `RiskLevel` is an `IntEnum`: LOW=0, MODERATE=1, HIGH=2, SEVERE=3, NO_TRAVEL=4.
- Ranking key (ascending): `(no_travel_miles // B, severe_miles // B, high_miles // B, round(avg_risk, 1), duration_s)` with `B = RECOMMEND_BUCKET_MILES = 5`.
- Checkpoint intervals allowed: 10, 25, 50 miles (default 25). Max 300 checkpoints per route. Load 0–80,000 lb. Departure window: now−1h … now+7d.
- Domain package imports no Django and does no I/O. Distances in domain are miles, durations seconds, temperatures n/a.
- Secrets only via env: `ORS_API_KEY`, `DJANGO_SECRET_KEY`, `ALLOWED_ORIGINS`, `VITE_API_BASE_URL`. No keys in git.
- Every risk level shows label + icon + colour (never colour alone). Min touch target 44px. Works at 360px width.
- Each backend task: tests first, `pytest` green before commit.

## Review Focus

1. Fewer than 3 distinct routes (short trip, or detours rejected as duplicates) → API returns what it has, UI shows 1–2 cards with a note; no crash. (Task 6, Task 12)
2. Origin == destination, or no truck route (ocean, non-US, Hawaii) → 422 with a readable message shown inline in the form. (Task 6, Task 8, Task 10)
3. Exact threshold values (25, 35, 45, 55 mph; 0.25 in/hr; 1.00 vs 1.01 in/hr; load exactly 30,000 and 40,000) classify per the brief. (Task 2)
4. ETA past the forecast horizon or departure outside window → 400 for window; clamp + `forecast_truncated: true` flag + UI notice for horizon. (Task 5, Task 8, Task 12)
5. Route shorter than the interval (5 mi, interval 50) and very long route at interval 10 (>300 checkpoints) → origin+destination always present; interval auto-widened and reported. (Task 3, Task 12)

---

## Backend

### Task 1: Repo + Django scaffold

**Files:**
- Create: `.gitignore`, `README.md` (stub), `backend/requirements.txt`, `backend/manage.py`, `backend/config/{__init__,settings,urls,wsgi}.py`, `backend/planner/{__init__,apps}.py`, `backend/planner/api/{__init__,urls,views}.py`, `backend/pytest.ini`, `backend/.env.example`
- Test: `backend/planner/tests/test_health.py`

**Interfaces:**
- Produces: `GET /api/health/ → {"status":"ok"}`; settings constants read from env with defaults: `ORS_API_KEY`, `ALLOWED_ORIGINS` (comma list), `RECOMMEND_BUCKET_MILES=5`, `MAX_CHECKPOINTS=300`, `WEATHER_CACHE_SECONDS=1800`; no `DATABASES` (use dummy backend); DRF with JSON renderer only and `AnonRateThrottle` at `30/min` on plan endpoint.

- [ ] **Step 1:** `git init` at repo root; `.gitignore` covers `.env`, `.venv`, `node_modules`, `dist`, `__pycache__`.
- [ ] **Step 2:** Create venv in `backend/.venv`; requirements: django, djangorestframework, django-cors-headers, httpx, timezonefinder, gunicorn, whitenoise, python-dotenv, pytest, pytest-django, respx. Pin versions after install (`pip freeze` subset).
- [ ] **Step 3: Write failing test** `test_health_returns_ok` using DRF `APIClient`: `GET /api/health/` → 200 and `{"status": "ok"}`.
- [ ] **Step 4:** Run `cd backend && pytest -q` → FAIL (404).
- [ ] **Step 5:** Implement scaffold + `health` view. `.env.example` lists every env var from Global Constraints.
- [ ] **Step 6:** `pytest -q` → PASS. Commit `chore: scaffold django backend`.

### Task 2: Risk rules (domain)

**Files:**
- Create: `backend/planner/domain/{__init__,types,risk}.py`
- Test: `backend/planner/tests/domain/test_risk.py`

**Interfaces:**
- Produces in `types.py`: `LatLon(lat: float, lon: float)` frozen dataclass; `RiskLevel(IntEnum)`; `WeatherSample(wind_mph: float, rain_in_hr: float, snow_in_hr: float)`; `RiskAssessment(level, wind, rain, snow: RiskLevel, drivers: tuple[str, ...])`.
- Produces in `risk.py`: `classify_wind(mph: float) -> RiskLevel`, `classify_rain(in_hr: float) -> RiskLevel`, `classify_snow(in_hr: float) -> RiskLevel`, `assess(sample: WeatherSample, load_lb: int) -> RiskAssessment`. `assess.level` = max of the three after the load rules adjust the wind level. `drivers` holds human strings such as `"Wind 47 mph with 35,000 lb load"` for every factor at MODERATE or above, plus the load rule that fired.

- [ ] **Step 1: Write failing tests** (parametrised): `test_wind_boundaries` — 24.9→LOW, 25→MODERATE, 34.9→MODERATE, 35→HIGH, 44.9→HIGH, 45→SEVERE, 54.9→SEVERE, 55→NO_TRAVEL. `test_rain_boundaries` — 0.09→LOW, 0.10→MODERATE, 0.25→HIGH, 0.50→SEVERE, 1.00→SEVERE, 1.01→NO_TRAVEL. `test_snow_boundaries` — 0.4→LOW, 0.5→MODERATE, 1.0→HIGH, 2.0→SEVERE, 3.0→SEVERE, 3.1→NO_TRAVEL. `test_load_rules` — (wind 56, load 0)→NO_TRAVEL; (50, 30_000)→SEVERE; (50, 30_001)→NO_TRAVEL; (40, 40_000)→HIGH; (40, 40_001)→SEVERE; (30, 80_000)→MODERATE (rule does not apply). `test_overall_is_worst_factor` — wind LOW + snow HIGH → HIGH. `test_drivers_mention_load_rule`.
- [ ] **Step 2:** Run `pytest planner/tests/domain/test_risk.py -q` → FAIL (import error).
- [ ] **Step 3:** Implement with a single ordered threshold table per condition (`bisect` over a tuple) so adding a factor is one table entry.
- [ ] **Step 4:** Tests PASS. Commit `feat(domain): weather risk rules with load adjustments`.

### Task 3: Geometry, profile, checkpoint distances

**Files:**
- Create: `backend/planner/domain/geometry.py`
- Test: `backend/planner/tests/domain/test_geometry.py`

**Interfaces:**
- Consumes: `LatLon`.
- Produces: `MILES_PER_METER`; `haversine_miles(a: LatLon, b: LatLon) -> float`; `RouteProfile(coords: Sequence[LatLon], cum_time_s: Sequence[float])` with properties `total_miles`, `total_seconds` and method `at(mile: float) -> ProfilePoint` where `ProfilePoint(mile, location: LatLon, elapsed_s: float)` is linearly interpolated between vertices and clamps to [0, total]; `checkpoint_miles(total_miles: float, interval: int, max_count: int) -> tuple[list[float], int]` returning mile marks (always includes 0 and `total_miles`, strictly increasing, no duplicate when total is an exact multiple) and the effective interval (interval is multiplied by 2 repeatedly until count ≤ max_count).

- [ ] **Step 1: Write failing tests:** `test_haversine_known_pair` (LA→Las Vegas ≈ 228 mi ±3); `test_profile_interpolates_location_and_time` on a 3-vertex line with cum_time [0,600,1800]; `test_profile_clamps_out_of_range`; `test_checkpoint_miles_25` (total 60 → [0,25,50,60]); `test_checkpoint_miles_exact_multiple` (50 @25 → [0,25,50]); `test_checkpoint_miles_short_route` (5 @50 → [0,5]); `test_checkpoint_miles_widens_interval` (3000 @10, max 300 → effective 20 ... asserts `len ≤ 300` and effective is `10 * 2**k`).
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement; `RouteProfile` precomputes cumulative miles once and uses `bisect` in `at`.
- [ ] **Step 4:** PASS. Commit `feat(domain): route profile and checkpoint spacing`.

### Task 4: Checkpoints, route summary, ranking

**Files:**
- Create: `backend/planner/domain/scoring.py`
- Test: `backend/planner/tests/domain/test_scoring.py`

**Interfaces:**
- Consumes: `RiskLevel`, `RiskAssessment`, `WeatherSample`, `LatLon`.
- Produces: `Checkpoint(index: int, mile: float, location: LatLon, eta: datetime, weather: WeatherSample, risk: RiskAssessment, segment_miles: float)` frozen; `segment_miles(marks: Sequence[float]) -> list[float]` (each mark owns halfway to neighbours; first starts at 0, last ends at the final mark; sum equals last mark); `RouteSummary(total_miles, duration_s, miles_by_level: dict[RiskLevel, float], avg_risk: float, worst: RiskLevel)`; `summarize(checkpoints: Sequence[Checkpoint], duration_s: float) -> RouteSummary`; `ranking_key(s: RouteSummary, bucket_miles: float) -> tuple`; `rank(summaries: Mapping[str, RouteSummary], bucket_miles: float) -> list[str]` (ids best-first); `explain(best_id, summaries) -> str` — one sentence such as `"Avoids 42 mi of Severe weather; 25 min longer than the fastest route."`, and `"All routes cross No Travel conditions — consider delaying departure."` when the best still has NO_TRAVEL miles.

- [ ] **Step 1: Write failing tests:** `test_segment_miles_sum_and_halfway` ([0,25,50,60] → [12.5,25,17.5,5]); `test_summarize_mile_weighted_average` (two checkpoints LOW/SEVERE with equal segments → avg 1.5); `test_rank_prefers_fewer_severe_over_time`; `test_rank_high_miles_tiebreak_when_severe_equal`; `test_rank_bucket_makes_small_risk_difference_yield_to_time` (severe 12 vs 14 mi, same bucket → faster wins); `test_rank_no_travel_loses_to_severe`; `test_explain_no_travel_all_routes`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement per Global Constraints ranking key.
- [ ] **Step 4:** PASS. Commit `feat(domain): scoring and route ranking`.

### Task 5: Open-Meteo weather provider

**Files:**
- Create: `backend/planner/providers/{__init__,base,open_meteo}.py`, `backend/planner/domain/errors.py`
- Test: `backend/planner/tests/providers/test_open_meteo.py`

**Interfaces:**
- Produces in `errors.py`: `PlannerError(Exception)` with `code: str`, `message: str`, `status: int`; subclasses `InvalidTrip(400)`, `NoRouteFound(422)`, `UpstreamError(502)`.
- Produces in `base.py`: `HourlyForecast(start_utc: datetime, wind_mph: tuple[float, ...], rain_in_hr: tuple[float, ...], snow_in_hr: tuple[float, ...])` with `sample_at(when: datetime) -> WeatherSample` (nearest hour, clamped), `covers(when: datetime) -> bool`, `hours: int`; `grid_key(p: LatLon) -> LatLon` (round to 2 decimals); Protocols `WeatherProvider.hourly(points: Sequence[LatLon]) -> dict[LatLon, HourlyForecast]` (keys are `grid_key`s), `RoutingProvider`, `GeocodingProvider` signatures as in Task 6/7.
- Produces in `open_meteo.py`: `OpenMeteoProvider(client: httpx.Client | None = None, cache=django cache)`.

- [ ] **Step 1: Write failing tests (respx-mocked):** `test_batches_points_in_chunks_of_100` (250 points → 3 requests); `test_deduplicates_by_grid_key` (two points 0.001° apart → one coordinate requested); `test_maps_units` (request has `wind_speed_unit=mph&precipitation_unit=inch&timezone=UTC&forecast_days=8`, rain = `rain + showers`); `test_uses_cache_on_second_call` (second call makes zero HTTP requests); `test_upstream_failure_raises_upstream_error`; `test_sample_at_clamps_and_covers` (when beyond last hour → last sample, `covers` False).
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement. Hourly vars: `wind_speed_10m, rain, showers, snowfall`. Chunks fetched concurrently with a `ThreadPoolExecutor(max_workers=4)`. Cache key `wx:{lat}:{lon}` per grid cell, value is the serialised `HourlyForecast`, TTL `WEATHER_CACHE_SECONDS`. Timeout 10 s, one retry on 5xx/429.
- [ ] **Step 4:** PASS. Commit `feat(providers): open-meteo hourly weather with caching`.

### Task 6: OpenRouteService routing provider (+ detour alternatives)

**Files:**
- Create: `backend/planner/providers/ors_routing.py`, `backend/planner/domain/detours.py`
- Test: `backend/planner/tests/providers/test_ors_routing.py`, `backend/planner/tests/domain/test_detours.py`, `backend/planner/tests/fixtures/ors_directions.json` (small real-shaped GeoJSON response)

**Interfaces:**
- Consumes: `LatLon`, `haversine_miles`, `NoRouteFound`, `UpstreamError`.
- Produces: `RawRoute(coords: tuple[LatLon, ...], cum_time_s: tuple[float, ...], summary: str)` in `types.py`; `RoutingProvider.routes(origin: LatLon, destination: LatLon, want: int = 3) -> list[RawRoute]` (fastest first, may return fewer than `want`).
- `detours.py`: `via_candidates(base: Sequence[LatLon]) -> list[LatLon]` — for fractions (0.5, 0.35, 0.65) × sides (+1, −1) along the base route, offset perpendicular by `clamp(0.15 × total_miles, 15, 60)` miles; `overlap_ratio(a: Sequence[LatLon], b: Sequence[LatLon], tolerance_miles: float = 0.6) -> float` (share of `a`'s vertices, sampled every ~1 mi, within tolerance of `b`).
- `OrsRoutingProvider(api_key, client)`: POST `/v2/directions/driving-hgv/geojson`. Native path (`alternative_routes: {target_count: 3, share_factor: 0.6, weight_factor: 1.6}`) only when straight-line < 60 mi; otherwise base route + detours via `coordinates=[origin, via, dest]`, `radiuses=[-1,-1,-1]`, at most 4 detour calls, stop when `want` routes accepted; reject a detour if `overlap_ratio > 0.85` against any accepted route or duration > 1.8× fastest. `cum_time_s` is built by spreading each step's duration over its `way_points` range proportional to segment length. Same origin/destination (< 0.5 mi apart) raises `InvalidTrip`; ORS "route not found" (error codes 2009/2010) raises `NoRouteFound("No truck route found between these places. Check both are in the US.")`.

- [ ] **Step 1: Write failing tests:** detours — `test_via_candidates_are_perpendicular_and_offset` (straight east-west base → candidates north/south of the line at ≥15 mi); `test_overlap_ratio_identical_is_one`, `test_overlap_ratio_disjoint_is_zero`. Provider — `test_native_alternatives_used_for_short_trip` (one HTTP call, payload has `alternative_routes`); `test_long_trip_uses_detours_and_drops_duplicates` (respx returns base then a near-duplicate then a distinct route → 2 routes returned); `test_stops_after_four_detour_calls`; `test_cum_time_monotonic_and_matches_total_duration` (fixture); `test_same_origin_destination_raises_invalid_trip`; `test_ors_2010_maps_to_no_route_found`; `test_429_maps_to_upstream_error`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement. Parse GeoJSON `features[].geometry.coordinates` (lon,lat) and `properties.segments[].steps[]`.
- [ ] **Step 4:** PASS. Commit `feat(providers): ORS truck routing with long-haul detour alternatives`.

### Task 7: Geocoding endpoint

**Files:**
- Create: `backend/planner/providers/ors_geocoding.py`, `backend/planner/api/geocode.py` (view), modify `backend/planner/api/urls.py`
- Test: `backend/planner/tests/providers/test_ors_geocoding.py`, `backend/planner/tests/api/test_geocode_view.py`

**Interfaces:**
- Produces: `Place(label: str, name: str, region: str, location: LatLon)` in `types.py`; `GeocodingProvider.autocomplete(text: str, focus: LatLon | None = None) -> list[Place]`; `GET /api/geocode/?q=<text>[&lat=&lon=]` → `{"results":[{"label","name","region","lat","lon"}]}`. Queries under 3 characters return `{"results": []}` without calling upstream. Calls ORS `/geocode/autocomplete` with `boundary.country=US`, `size=6`, `focus.point.*` when given; results cached 24 h per normalised query.

- [ ] **Step 1: Write failing tests:** provider maps Pelias features to `Place`; short query makes no request; view returns the shape above; second identical query hits cache (one upstream call).
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** PASS. Commit `feat: US place autocomplete endpoint`.

### Task 8: Trip planner service, heatmap, `/api/plan/`

**Files:**
- Create: `backend/planner/services/{__init__,trip_planner,heatmap}.py`, `backend/planner/api/{serializers,plan}.py`, `backend/planner/providers/__init__.py` (factory `build_providers()`), modify `backend/planner/api/urls.py`
- Test: `backend/planner/tests/services/test_trip_planner.py`, `backend/planner/tests/services/test_heatmap.py`, `backend/planner/tests/api/test_plan_view.py`

**Interfaces:**
- Consumes: everything from Tasks 2–7.
- Produces: `TripRequest(origin: PlaceRef, destination: PlaceRef, departure_utc: datetime, load_lb: int, interval_miles: int)`, `PlaceRef(label: str, location: LatLon)`; `TripPlanner(routing: RoutingProvider, weather: WeatherProvider).plan(req) -> TripPlan` where `TripPlan(routes: list[PlannedRoute], recommended_id: str, effective_interval_miles: int, heatmap: Heatmap, notes: list[str])`; `PlannedRoute(id, tags: list[str] ("fastest"|"safest"|"recommended"), summary: RouteSummary, geometry: list[LatLon], checkpoints: list[Checkpoint], forecast_truncated: bool, label: str)` (per-checkpoint IANA `tz` is added by the API serializer, not stored in the domain); `build_heatmap(routes_geometry: Sequence[RouteProfile], weather: WeatherProvider, departure_utc, load_lb, spacing_miles: float = 15, hours: int = 49) -> Heatmap(points: list[LatLon], risk: list[list[int]])` where `risk[h][i]` is the weather-only `RiskLevel` int at point `i` in hour `h` after departure (points deduped by `grid_key`).
- API `POST /api/plan/` body: `{origin:{label,lat,lon}, destination:{label,lat,lon}, departure_local:"YYYY-MM-DDTHH:MM", load_lb:int, interval_miles:10|25|50}`. `departure_local` is interpreted in the origin's IANA zone (timezonefinder). Response: `{recommended_route_id, effective_interval_miles, notes[], routes:[{id,label,tags[],forecast_truncated,summary:{total_miles,duration_s,avg_risk,worst,miles_by_level:{LOW..NO_TRAVEL},reason},geometry:[[lon,lat]...],checkpoints:[{index,mile,lat,lon,eta_utc,tz,wind_mph,rain_in_hr,snow_in_hr,risk,drivers[]}]}], heatmap:{points:[[lon,lat]...],hours:49,risk:[[int...]...]}}`. `risk` fields are the level name strings (`"SEVERE"`), heatmap uses ints. Errors: `{error:{code,message}}` with `PlannerError.status`. Throttled 30/min.
- Notes list gets: interval-widened message, fewer-than-3-routes message, forecast-truncated message.

- [ ] **Step 1: Write failing tests (fake providers, no HTTP):** service — `test_eta_drives_forecast_hour` (weather bad only at hour 5; a checkpoint reached at hour 5 is rated, one at hour 1 is not); `test_recommends_route_with_fewest_severe_miles`; `test_tags_fastest_and_safest`; `test_short_route_has_origin_and_destination_checkpoints`; `test_interval_widened_note`; `test_forecast_truncated_flag_when_eta_beyond_data`; `test_fewer_than_three_routes_adds_note`. Heatmap — `test_shape_hours_by_points`; `test_points_deduped_across_routes`; `test_load_rules_applied` (wind 50 → heavier load gives higher level). API — `test_valid_request_returns_documented_shape`; `test_departure_local_uses_origin_timezone` (Los Angeles 05:00 → `eta_utc` of checkpoint 0 is 13:00Z in winter); `test_rejects_departure_in_past_beyond_one_hour` (400, code `invalid_departure`); `test_rejects_load_over_80000`; `test_rejects_interval_not_in_10_25_50`; `test_planner_error_maps_to_status_and_message` (NoRouteFound → 422).
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement. Order inside `plan`: routes → profiles → checkpoint miles (per route, shared interval = max effective) → one batched `weather.hourly` call over all checkpoint + heatmap points → build checkpoints with `ETA = departure + profile.at(mile).elapsed_s` → assess → summarize → rank → tag. Lookups of timezone via `timezonefinder` live in `api/plan.py` helpers, not the domain.
- [ ] **Step 4:** PASS. Run the full backend suite `pytest -q`. Commit `feat: trip planning endpoint with ranking and heatmap data`.
- [ ] **Step 5 (manual smoke, needs `ORS_API_KEY`):** start `python manage.py runserver`, `curl -X POST localhost:8000/api/plan/` for Los Angeles → Denver with load 42,000; expect ≥2 routes, `recommended_route_id` set, response under ~15 s cold. Record observed route count in the task notes; if only 1 route, tune detour offset constants in `detours.py` before moving on.

---

## Frontend

### Task 9: Vite + shadcn scaffold, tokens, API client, risk style module

**Files:**
- Create: `frontend/` via Vite React-TS template; `frontend/src/lib/risk.ts`, `frontend/src/lib/format.ts`, `frontend/src/api/{client,types,planTrip,geocode}.ts`, `frontend/src/index.css` (design tokens), `frontend/.env.example`
- Test: `frontend/src/lib/risk.test.ts`, `frontend/src/lib/format.test.ts`, `frontend/src/api/planTrip.test.ts`

**Interfaces:**
- Produces: `type RiskLevel = "LOW"|"MODERATE"|"HIGH"|"SEVERE"|"NO_TRAVEL"`; `RISK: Record<RiskLevel,{label:string; color:string; icon:LucideIcon; rank:number}>` (the single source for colours; colour-blind-safe ramp green→amber→orange→red→near-black/purple, plus icon + label); `riskFromInt(n:number): RiskLevel`; `formatMiles(n)`, `formatDuration(seconds)` (`"6h 20m"`), `formatEta(isoUtc, tz)` (`"Tue 5:40 PM MST"`); types mirroring the API response from Task 8 (`PlanResponse`, `PlannedRoute`, `Checkpoint`, `Heatmap`, `ApiError`); `planTrip(req): Promise<PlanResponse>` and `searchPlaces(q, signal): Promise<Place[]>` using `VITE_API_BASE_URL`, throwing `ApiError{code,message}` from `{error}` bodies.

- [ ] **Step 1:** `npm create vite@latest frontend -- --template react-ts`; install tailwind, `shadcn init`, add components: button, input, command, popover, toggle-group, slider, card, badge, tabs, drawer, skeleton, sonner, tooltip, label, alert; install `@tanstack/react-query maplibre-gl lucide-react`, dev: `vitest @testing-library/react @testing-library/user-event jsdom msw`.
- [ ] **Step 2: Write failing tests:** `riskFromInt(4)==="NO_TRAVEL"`; `RISK` ranks strictly increase and every level has distinct colour and icon; `formatDuration(22800)==="6h 20m"`; `formatEta` renders in the given IANA zone; `planTrip` throws `ApiError` with server code/message on 422 (msw).
- [ ] **Step 3:** Run `npx vitest run` → FAIL. **Step 4:** Implement. `index.css` defines CSS variables for light + dark (dark default when `prefers-color-scheme: dark`), risk colours as variables consumed by `RISK`.
- [ ] **Step 5:** PASS. Commit `feat(web): scaffold, tokens, api client, risk style module`.

### Task 10: Trip form (the intuitive input)

**Files:**
- Create: `frontend/src/features/trip-form/{TripForm,PlaceInput,DepartureField,LoadField,IntervalField,useRecentPlaces,useGeolocate}.tsx|ts`, `frontend/src/hooks/useDebouncedValue.ts`
- Test: `frontend/src/features/trip-form/TripForm.test.tsx`

**Interfaces:**
- Consumes: `searchPlaces`, `Place`.
- Produces: `TripForm({ onSubmit(req: PlanRequest), isLoading, error?: ApiError })`; `PlanRequest = {origin: Place, destination: Place, departure_local: string, load_lb: number, interval_miles: 10|25|50}`.
- Behaviour (UX contract): 
  - `PlaceInput`: combobox (shadcn Command in Popover), 300 ms debounce, ≥3 chars, shows "Recent" places when empty, origin has a "Use my location" row (reverse-labelled as "Current location"), keyboard + touch friendly, a swap-origin/destination button between the two fields; selection required (typed-but-unselected text shows "Pick a place from the list").
  - `DepartureField`: ToggleGroup presets **Now · In 1 hour · Tomorrow 5 AM · Pick time**; "Pick time" reveals a native `datetime-local` (min = now). Always echoes the chosen time in words ("Tue, Nov 10 · 5:00 AM at origin").
  - `LoadField`: number input in lb with chips **Empty 0 · 20,000 · 40,000 · 80,000**, and helper text showing the active wind-rule thresholds for the entered weight ("Over 30,000 lb: 45+ mph is No Travel").
  - `IntervalField`: segmented 10 / 25 / 50 mi labelled "Weather check every", default 25, helper "Smaller = more detail, slower".
  - Submit button full-width, 48px, disabled with reason text until origin + destination are chosen; shows spinner label "Checking routes & weather…"; API error shown as inline Alert above the button.
  - Recent places (max 5) persist to localStorage inside try/catch.

- [ ] **Step 1: Write failing tests:** debounced search calls API once for fast typing "denv"; selecting a result fills the field; submit disabled until both places chosen; "Tomorrow 5 AM" produces tomorrow's date at 05:00 in `departure_local`; load chip sets 40,000 and helper text mentions the 40,000 lb rule; swap button swaps places; 422 error message renders; submit calls `onSubmit` with the documented `PlanRequest`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** PASS. Commit `feat(web): trip form with autocomplete, presets, load helper`.

### Task 11: Map foundation + route layers

**Files:**
- Create: `frontend/src/features/map/{MapView,useMapInstance,routeLayers,checkpointLayer,mapStyle}.ts(x)`
- Test: `frontend/src/features/map/routeLayers.test.ts` (pure builders only)

**Interfaces:**
- Consumes: `PlanResponse`, `RISK`.
- Produces: `MapView({ plan?: PlanResponse, selectedRouteId?: string, onSelectRoute(id), onSelectCheckpoint(routeId, index), hourOffset: number })`; pure builders `routesToGeoJSON(plan): FeatureCollection` (one LineString per route with `id`, `isRecommended`, `isSelected`), `checkpointsToGeoJSON(route): FeatureCollection` (Point with `risk`, `index`, `eta`), `boundsOf(plan): [[w,s],[e,n]]`; `mapStyle(theme): string` (OpenFreeMap Positron for light, Carto Dark Matter for dark, both overridable by `VITE_MAP_STYLE_LIGHT/DARK`).
- Rules: Map created once; sources/layers added in `addAllLayers(map)` invoked on every `style.load` so theme switching survives. Selected route: thick line with white casing; others thin, dimmed. Recommended route has a star marker at the midpoint. Selected route's checkpoints are circles coloured by `RISK[...].color` with a ring for NO_TRAVEL/SEVERE; click shows a MapLibre popup (mile, ETA local, wind/rain/snow, risk label + drivers). Route lines are clickable to select. `fitBounds` with padding that accounts for the side panel on desktop / bottom sheet on mobile. Data updates use `source.setData`, never remove/re-add layers.

- [ ] **Step 1: Write failing tests:** `routesToGeoJSON` marks exactly one recommended and one selected; `checkpointsToGeoJSON` carries risk + index; `boundsOf` contains all route coordinates.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement builders and the component. **Step 4:** PASS.
- [ ] **Step 5 (manual):** `npm run dev`, load a mocked plan fixture (`src/api/fixtures/plan.sample.json`, create from a real Task 8 smoke response), confirm lines, markers, popup, theme switch keeps layers. Commit `feat(web): map with route and checkpoint layers`.

### Task 12: Results panel

**Files:**
- Create: `frontend/src/features/results/{ResultsPanel,RecommendationBanner,RouteCard,CheckpointTimeline,RiskBadge,RiskBar}.tsx`
- Test: `frontend/src/features/results/ResultsPanel.test.tsx`

**Interfaces:**
- Consumes: `PlanResponse`, `RISK`, formatters.
- Produces: `ResultsPanel({ plan, selectedRouteId, onSelectRoute, onSelectCheckpoint })`; `RiskBadge({level, size?})` (icon + label); `RiskBar({milesByLevel})` — a stacked horizontal bar of miles per level with accessible text alternative.
- Behaviour: `RecommendationBanner` leads with a plain-language verdict ("Take Route 2 — avoids 42 mi of Severe weather, 25 min longer") using `summary.reason`; if the best route still has NO_TRAVEL miles shows a destructive alert "Do not depart as planned". Each `RouteCard` shows tags (Recommended/Fastest/Safest), duration, miles, worst level badge, RiskBar, Severe/High miles line, arrival time at destination in destination zone; whole card is the selection target (radio semantics). Selected route reveals `CheckpointTimeline` (vertical list: mile, local ETA, risk badge, wind/rain/snow values, driver reasons for MODERATE+; click focuses the map checkpoint). `plan.notes` render as an info Alert (interval widened, fewer than 3 routes, forecast truncated). 1–3 routes all render without layout gaps.

- [ ] **Step 1: Write failing tests:** renders N cards for N=1,2,3; recommended card carries the "Recommended" badge and is initially selected; clicking another card calls `onSelectRoute`; notes alert appears when `notes.length>0`; all-NO_TRAVEL plan shows the "Do not depart" alert; RiskBar has an accessible label listing miles per level.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** PASS. Commit `feat(web): results panel with recommendation and checkpoint timeline`.

### Task 13: Weather heatmap + 0–48 h slider

**Files:**
- Create: `frontend/src/features/map/{heatmapLayer,HeatmapControl}.ts(x)`, `frontend/src/features/map/heatmapGeoJson.ts`
- Test: `frontend/src/features/map/heatmapGeoJson.test.ts`

**Interfaces:**
- Consumes: `Heatmap`, `RISK`.
- Produces: `heatmapToGeoJSON(h: Heatmap): FeatureCollection` — one Point per grid cell with properties `r0…r48` (ints 0–4); `setHeatmapHour(map, hour: number)` which only calls `map.setPaintProperty` on `heat-layer` (`heatmap-weight` = `["/", ["get", "r"+hour], 4]`) and on `heat-points` circle colour; `HeatmapControl({ hour, onHourChange, departure })` — shadcn Slider 0–48 with play/pause (1 h per 400 ms), label "+6 h · Tue 11:00 PM" (departure + hour, origin zone), legend using `RISK` colours, toggle to hide the heatmap.
- Rules: GeoJSON loaded once per plan; slider updates throttled with `requestAnimationFrame`; heatmap radius interpolates with zoom so corridor looks continuous at zoom 4–9; low-zoom heat layer fades into discrete risk circles at zoom ≥ 9; heat layer sits below route lines.

- [ ] **Step 1: Write failing tests:** `heatmapToGeoJSON` yields `points.length` features each with exactly 49 `r*` properties matching `risk[h][i]`; coordinates are `[lon,lat]`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** PASS.
- [ ] **Step 5 (manual perf check):** with a 3,000-point synthetic heatmap scrub the slider continuously in the browser; Performance panel must show no source re-creation and no long tasks (>50 ms) during scrubbing. Commit `feat(web): weather heatmap with forecast slider`.

### Task 14: App shell, states, responsive, polish

**Files:**
- Create/modify: `frontend/src/{App,main}.tsx`, `frontend/src/features/shell/{AppLayout,ThemeToggle,EmptyState,LoadingState}.tsx`, `frontend/src/hooks/useTripPlan.ts`
- Test: `frontend/src/App.test.tsx`

**Interfaces:**
- Consumes: Tasks 9–13.
- Produces: `useTripPlan()` — TanStack `useMutation` around `planTrip`, no retries on 4xx.
- Layout: desktop = 420 px left panel (form → collapses to a summary chip row "Reno → Denver · 42,000 lb · Edit" after a result, then results) + full-height map with heatmap control floating bottom-centre. Mobile (<768 px) = full-screen map + draggable bottom Drawer containing form/results; form opens first. `LoadingState` shows staged text ("Finding truck routes… → Forecasting weather along each route… → Scoring risk") and skeleton cards. `EmptyState` before first search shows the map of the US with a short hint. Theme toggle persists (try/catch localStorage). Keyboard: Enter submits; focus returns to results heading after load; `aria-live` announces the recommendation.
- Selected route state, `hourOffset` state live in `App`; changing the form does not clear the previous result until a new one arrives.

- [ ] **Step 1: Write failing test:** with msw returning the sample plan, filling the form and submitting shows the recommendation banner and 3 route cards; a 422 response shows the message in the form and no results.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** `npx vitest run` PASS, `npm run build` and `npx tsc --noEmit` clean.
- [ ] **Step 5 (manual, real backend + key):** run both servers; test at 360 px, 768 px, 1440 px, light and dark; run LA→Denver, Seattle→Minneapolis (winter), and a 20-mile local trip; fix visible issues. Commit `feat(web): app shell, loading/empty/error states, responsive layout`.

---

## Delivery

### Task 15: Docs, deployment, walkthrough

**Files:**
- Create/modify: `README.md`, `backend/render.yaml` (or `Procfile` + `runtime.txt`), `frontend/vercel.json`, `docs/ARCHITECTURE.md`, `docs/WALKTHROUGH.md`

**Interfaces:** none produced; consumes all.

- [ ] **Step 1:** `README.md`: what it does, screenshot placeholders, 2-command local run per folder, env table, how risk rules and ranking work (link to `domain/risk.py`, `domain/scoring.py`), how to swap a provider (implement the protocol in `providers/base.py`, register in `build_providers`), how to add a risk factor (add a threshold table entry + a field on `WeatherSample` + a provider field), known limits (ORS 100 km alternative cap and the detour approach, sustained wind only, US only, free-tier quotas).
- [ ] **Step 2:** `docs/ARCHITECTURE.md`: one diagram of request flow (form → /api/plan → routing → weather batch → score → response → map) and the module map.
- [ ] **Step 3:** Deploy backend to Render (`gunicorn config.wsgi`, env vars set, `ALLOWED_ORIGINS` = the Vercel URL); deploy frontend to Vercel with `VITE_API_BASE_URL`. Verify `GET /api/health/` and one full plan from the hosted site.
- [ ] **Step 4:** `docs/WALKTHROUGH.md`: 7-minute Loom script — (1) problem + demo trip (60 s), (2) input UX choices (60 s), (3) results/recommendation and why (90 s), (4) map + heatmap scrub (60 s), (5) risk + ranking code and tests (90 s), (6) architecture and extensibility (60 s), (7) limits and next steps (30 s).
- [ ] **Step 5:** Final checks: `cd backend && pytest -q`; `cd frontend && npx vitest run && npm run build`; push to GitHub (user supplies the remote); confirm the hosted app works on a phone-width browser. Commit `docs: readme, architecture, deploy config, walkthrough script`.
