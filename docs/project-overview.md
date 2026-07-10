---
description: "Current product scope, stack, setup, scripts, and repo map."
references: []
---

# Project Overview

[Docs index](./README.md) | [Repo README](../README.md)

## Current App

Table Talk Games is a client-only React/Vite game portal. The current playable games are
`Table Talk Diner` and `Tiny City Delivery`.

`Table Talk Diner` is a 2D food-serving arcade game for practicing practical English food orders.
Guests sit at tables, ask for meals in English, dishes appear on the kitchen pass, and the player
drags dishes to the matching guest before patience timers expire.

`Tiny City Delivery` is a map-routing simulator. Children follow English delivery instructions using
place names, quantities, and prepositions such as `behind`, `between`, `over`, `next to`, `inside`,
`outside`, and `across`.

## Core Gameplay

| Concept | Current behavior |
| --- | --- |
| Goal | Complete `24` guest orders. |
| Guest orders | Each guest asks for `2` or `3` unique foods at current max level. |
| Guest movement | Guests and the waiter move on a shared tile grid; tapping a guest sends the waiter to that table before the order is revealed. |
| Food service | Ordered dishes and decoy dishes appear as draggable kitchen-pass buttons. |
| Serving | Dropping a dish on a guest table serves it only if that guest has heard the order and still needs that food. |
| Feedback | Diner feedback is maintained in React state for speech/sound flow, but no diner feedback bar is currently rendered. |
| Audio | Orders and serve messages use browser speech synthesis; feedback sounds use Web Audio tones. |

Tiny City Delivery has its own route score, delivery target, mistake limit, map locations, roads,
delivery cargo, and word-clue panel.

## Target User

The UI copy and README identify the game as an English learning arcade experience. The target user is a learner practicing simple food-order listening and recognition through quick arcade-style interaction.

## Tech Stack

| Area | Current choice |
| --- | --- |
| Runtime | Browser-only single page app. |
| Framework | React `18.3.1`. |
| Build tool | Vite 5, declared as `^5.4.11` in `package.json`. |
| Language | TypeScript with strict project settings. |
| Icons | `lucide-react`. |
| Styling | One CSS file, `src/styles.css`, with custom properties, responsive media queries, and CSS animations. |
| Assets | PNG sprites/backgrounds plus one SVG cursor under `src/assets/`. |
| Audio | `window.speechSynthesis` and `AudioContext`/`webkitAudioContext`. |
| State | Local React `useState`, `useRef`, `useMemo`, `useCallback`, and `useEffect`. |

## Local Setup

Use Node compatible with Vite 5. The installed Vite package declares this engine range:

```text
^18.0.0 || >=20.0.0
```

This workspace was inspected with:

| Tool | Version observed |
| --- | --- |
| Node | `v24.15.0` |
| npm | `11.12.1` |
| package lock | lockfile version `3` |

Install dependencies and run the app:

```bash
npm ci
npm run dev
```

Build and preview the production output:

```bash
npm run build
npm run preview
```

## Scripts

| Script | Defined as | Purpose |
| --- | --- | --- |
| `npm run dev` | `vite` | Start a local Vite dev server. |
| `npm run build` | `tsc -b && vite build` | Type-check project references, then build static output into `dist/`. |
| `npm run preview` | `vite preview` | Serve the built static output locally. |

## Repo Map

| Path | Purpose |
| --- | --- |
| `index.html` | HTML shell, metadata, root node, and Vite module entry. |
| `src/main.tsx` | Mounts `<App />` under React `StrictMode` and imports global CSS. |
| `src/App.tsx` | Game data, components, route selection, gameplay state, timers, order/mission generation, scoring, TTS, and sound effects. |
| `src/styles.css` | Full visual system: palette, layout, game scene layers, cards, diner/table UI, city map UI, sprites, animation, responsive rules, cursor. |
| `src/assets/` | Runtime assets for background, player, cursor, sprite sheet, food sprites, and customer sprites. |
| `docs/` | Maintainer documentation. |
| `dist/` | Vite build output, ignored by Git. |
| `node_modules/` | Installed dependencies, ignored by Git. |

## Current Scope

The repo currently supports two client-side games, generated/static visual assets, speech/audio in
browser APIs, and local static builds. It does not include user accounts, saved progress, analytics,
server APIs, automated tests, or deployment configuration.
