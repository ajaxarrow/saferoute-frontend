# Loom walkthrough script (~7 minutes)

1. **The problem and a demo trip (1:00).** Los Angeles → Denver, 42,000 lb, leaving in the morning. Show the result:
   recommended route, why, and the other two routes.
2. **Why the input is built this way (1:00).** Autocomplete with recent places and "use my location"; Now / In 1 hour /
   Pick time; load-weight chips and the line that explains which wind rules apply at that weight; why check
   spacing is a plain 10 / 25 / 50 choice. Mention big touch targets and the phone layout.
3. **Reading the results (1:30).** Route cards: time, miles, arrival in the destination's time zone, risk bar. Select a
   route: the line on the map is coloured by risk; click a checkpoint for ETA and the weather that was forecast *for
   that time*. Show the checkpoint list and "Moderate+" filter.
4. **Map and heatmap (1:00).** Scrub the 0–48 h slider, press play, hide/show. Explain it ships once and scrubbing
   only changes a paint expression.
5. **The logic and its tests (1:30).** Open `risk.py` (threshold tables, load rules), `scoring.py` (miles per level, ranking
   key with buckets), and the boundary tests. Explain the long-trip alternative-route workaround in `detours.py`.
6. **Architecture and extensibility (0:45).** Domain / providers / services / api layers; swap a provider or add a risk
   factor in one place.
7. **Limits and next steps (0:30).** US only, sustained wind, free-tier quotas; next: best-departure-window search,
   gusts and visibility, live traffic.
