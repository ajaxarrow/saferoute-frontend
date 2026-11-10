# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users and jobs

Professional truck drivers (phone, in a cab or at a truck stop: glare, gloves, tired, one-handed) and dispatchers (desktop, comparing routes). The job: before and during a trip, find which route is safest for this load and departure time, when the truck arrives, and where the weather will be rough. US-focused (mph and in/hr thresholds); place search is worldwide.

## What it makes possible

Weather-aware truck routing. For a load weight and departure time it proposes up to three truck routes, forecasts wind, rain and snow at the moment the truck will actually reach each checkpoint, classifies risk with fixed thresholds and load-weight rules (Low, Moderate, High, Severe, No Travel), and recommends the route by: fewest Severe miles, then fewest High miles, then lowest average risk, then shortest time. A 0-48 hour heatmap and a moving-truck forecast show the weather along the selected route.

## Constraints to preserve

- Single left panel (form, then results) with the map filling the rest on desktop; one bottom sheet on mobile.
- Risk language is fixed: five levels, each with colour, label and icon; colour is never the only signal.
- All current features stay: route preview, comparison criteria table, hazard stretches, stops, scoring help, weather card (selected route, truck, icons, progress strip, 0-48 h slider, legend), checkpoints.
- Legibility in daylight and at a glance; 44px+ targets; reduced-motion respected.
- Stack: React, Vite, Tailwind v4, shadcn/Base UI, MapLibre GL, MapTiler basemap. Light and dark themes.

## Brand commitments

Name: SafeRoute. The user rejected: a Google-Maps clone look, a generic dark dashboard, and decoration that costs usability.
