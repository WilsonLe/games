---
description: "Tiny City Delivery map data, route state, gameplay rules, implementation risks, and verification notes."
references: []
---

# Tiny City Delivery

## Gameplay Model

- The game opens ready and starts on explicit input.
- Tickets combine pickup/dropoff, cargo quantity, place names, and spatial language.
- Movement is allowed only over a directly connected road.
- Depot cargo starts in the basket; other cargo is picked up at its configured stop.
- Valid detours are allowed. Non-neighbor moves and missing required stops at delivery are mistakes.
- Ten deliveries win; five mistakes end the route.

## Implementation Map

- Map IDs/data: `LocationId`, `CITY_LOCATIONS`.
- Movement graph: `CITY_ROADS`, `cityNeighbors`.
- Lesson content: `CITY_ITEMS`, `CITY_MISSIONS`.
- Edge highlighting: `getCityRoadKey` and the consecutive `path` pairs in `CityMap`.
- State, pause/reset, movement, scoring, and completion: `TinyCityDeliveryGame`.
- Layout: `.cityGameGrid`, `.cityMap`, location/road/courier styles.

## Risks

- Keep mission text and structured fields synchronized.
- Update ID unions, location rows, roads, and missions together.
- Do not replace consecutive-edge highlighting with a set of visited locations; that marks roads that
  were never traversed.
- Keep map stops as native buttons.
- Do not let diner full-screen `.gameGrid` or overflow rules leak into `.appShell--city`.
- Percentage coordinates and CSS road lengths require desktop/mobile visual checks.

## Verify

Ready/start, depot/non-depot pickup, valid move, invalid road, valid detour, required stop, delivery,
score/streak, pause guidance, repeat audio, reset, five-mistake loss, ten-delivery win, New Route,
portal return, exact road highlights, scrolling, and mobile layout.
