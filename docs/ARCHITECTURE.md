# Architecture

SafeRoute is two independent services.

| Repo | Role |
|---|---|
| `saferoute-backend` | Django API: truck routing (OpenRouteService), weather (Open-Meteo), risk scoring, route ranking, heatmap grid |
| `saferoute-frontend` | This app: forms, map, results; calls the API over HTTP |

## Request flow

```mermaid
sequenceDiagram
  participant UI as saferoute-frontend
  participant API as saferoute-backend /api/plan/
  UI->>API: POST /api/routes/ (both places chosen: preview routes only)
  API-->>UI: candidate routes
  UI->>API: POST /api/plan/ (origin, destination, departure, load, interval)
  API-->>UI: routes, checkpoints, recommendation, 49-hour heatmap grid
  UI->>UI: draw routes + checkpoints; the slider scrubs the heatmap locally
```

## Frontend structure (`src/`)

| Path | Responsibility |
|---|---|
| `api/` | Typed client, geocoding, plan and route-preview calls |
| `features/planner/` | `usePlanner` (all state), `PlannerPanel`, `PlannerMap` |
| `features/shell/layouts/` | Desktop, Tablet and Mobile compositions, fed by the same state |
| `features/map/` | MapLibre view, layers, heatmap, markers, forecast bar |
| `features/results/` | Recommendation, route rows, comparison panel, details |
| `features/trip-form/` | Place inputs, departure, load, advanced settings |
| `lib/` | Risk styles, formatting, geometry, hazards, journey |

The forecast hour lives in `MapPane`, so scrubbing re-renders only the map pane, never the form or the results.
