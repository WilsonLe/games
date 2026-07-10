---
description: "Tiny City Delivery gameplay model, map data, route state, and implementation notes."
references: []
---

# Tiny City Delivery

## Gameplay Model

- Players follow English delivery instructions across a small city map.
- Missions combine pickup/dropoff locations, quantities, cargo, and spatial language.
- The player moves along valid roads, picks up cargo, and delivers it to the requested place.
- Wrong roads, wrong pickup/dropoff, or missing required stops count as mistakes.

## Implementation Map

- Location IDs, road edges, delivery items, and mission definitions live near the top of
  `src/App.tsx`.
- `CITY_LOCATIONS` controls map labels, icon kind, and percentage-based coordinates.
- `CITY_ROADS` controls valid movement edges.
- `CITY_MISSIONS` controls phrases, pickup/dropoff, cargo, focus words, and optional required stops.
- `TinyCityDeliveryGame` owns route state, scoring, mistakes, feedback, audio, and reset/pause flow.
- `CityMap` renders roads, route dots, location buttons, spatial badges, and the courier.

## Editing Guidance

- Keep every mission phrase aligned with its `pickup`, `dropoff`, `itemId`, `quantity`,
  `relationLabel`, `focusWords`, and optional `requiredStop`.
- If adding a map location, update `LocationId`, `CITY_LOCATIONS`, `CITY_ROADS`, and any missions
  that should use it.
- Keep route buttons as real buttons so the map remains keyboard and assistive-technology reachable.
- After map layout changes, check desktop and mobile widths because coordinates are percentage-based.
