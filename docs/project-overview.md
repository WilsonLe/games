---
description: "Current portal scope, game summaries, routes, stack, setup, scripts, and repo map."
references: []
---

# Project Overview

[Docs index](./README.md) | [Repo README](../README.md)

## Current App

Table Talk Games is a browser-only React/Vite mini-game portal. The root is the playable game
chooser, with two shipped games:

- **Table Talk Diner** — guests request food in spoken and written English; the player takes orders
  and drags matching dishes from the kitchen pass to each table.
- **Tiny City Delivery** — the player follows delivery tickets across a road map using place names,
  quantities, and spatial language such as `behind`, `between`, `over`, `next to`, `inside`,
  `outside`, and `across`.

This is not a marketing site. The portal cards launch a game immediately, and both games provide a
return-to-portal control.

## Routes

| Path | Behavior |
| --- | --- |
| `/` | Renders `GamePortal`. |
| `/games/table-talk-diner` | Renders `RestaurantGame`. |
| `/games/tiny-city-delivery` | Renders `TinyCityDeliveryGame`. |
| Other paths | Render `GamePortal` while leaving the current address unchanged. |

`App` normalizes trailing slashes, intercepts ordinary primary-button card clicks, writes paths with
`history.pushState`, listens for `popstate`, and updates `document.title`. Modified clicks retain
normal anchor behavior.

## Gameplay At A Glance

| Area | Table Talk Diner | Tiny City Delivery |
| --- | --- | --- |
| Goal | Complete 24 guest orders. | Complete 10 deliveries before 5 mistakes. |
| Primary input | Select a table, then drag or keyboard-serve dishes. | Click adjacent map locations. |
| Language focus | Practical food requests and listening. | Places, quantities, directions, and prepositions. |
| Progress | Score, completed orders, and level 1–6. | Score, deliveries, streak, lives, and level 1–5. |
| Feedback | Visible status toast, speech, and Web Audio tones. | Visible feedback panel, speech, and Web Audio tones. |
| Restart | `New Shift` after the target is reached. | Reset button or `New Route` after win/loss. |

## Target User

The copy and mechanics target English learners, especially children practicing short practical
instructions. The games combine written clues, optional spoken prompts, immediate feedback, and
arcade-style repetition.

## Tech Stack

| Area | Current choice |
| --- | --- |
| Runtime | Client-only single-page app. |
| Framework | React `18.3.1`. |
| Build tool | Vite 6 (`^6.4.3`; the lockfile resolves the patched `6.4.3` release). |
| Language | TypeScript with project references and strict checking. |
| Icons | `lucide-react`. |
| Routing | Small History API implementation inside `App`; no router dependency. |
| Styling | One global `src/styles.css` file with custom properties, responsive rules, and animations. |
| Assets | Imported PNG art plus an SVG cursor under `src/assets/`. |
| Audio | `window.speechSynthesis` and `AudioContext`/`webkitAudioContext`. |
| State | Component-local React hooks; there is no external store or persistence. |

## Local Setup

Vite 6 declares Node `^18.0.0 || ^20.0.0 || >=22.0.0`.

```bash
npm ci
npm run dev
```

Build and preview the static output:

```bash
npm run build
npm run preview
npm audit
```

| Script | Defined as | Purpose |
| --- | --- | --- |
| `npm run dev` | `vite` | Start the development server. |
| `npm run build` | `tsc -b && vite build` | Type-check, then emit `dist/`. |
| `npm run preview` | `vite preview` | Serve the built output locally. |
| `npm audit` | npm built-in | Check installed dependencies against known advisories. |

## Repo Map

| Path | Purpose |
| --- | --- |
| `index.html` | HTML metadata, root node, and Vite module entry. |
| `src/main.tsx` | Mounts `<App />` under `StrictMode` and imports CSS. |
| `src/App.tsx` | Portal, path routing, both game engines, data, state, timing, scoring, speech, and tones. |
| `src/styles.css` | Portal, diner, city, sprites, responsive behavior, and animation. |
| `src/assets/` | Runtime background, character, food, and cursor assets. |
| `docs/` | Maintainer and Hunter documentation. |
| `dist/` | Ignored production build output. |
| `.pi/` | Ignored local Hunter/Pi runtime state when tools create it. |

## Current Boundaries

The repository has no server APIs, accounts, saved progress, multiplayer, analytics, automated test
suite, CI configuration, browser support policy, or deployment-provider configuration.
