---
description: "Public project overview, setup, routes, and documentation map for Table Talk Games."
references: []
---

# Table Talk Games

Table Talk Games is a client-only React/Vite mini-game portal with two playable English-learning
games:

- **Table Talk Diner** — a food-serving arcade game for listening to practical English orders.
- **Tiny City Delivery** — a map-routing game for place words, prepositions, and quantities.

The root URL is the game chooser. Each game has its own client-side path and a control that returns to
the portal. React state, CSS animation, imported image assets, browser speech synthesis, and Web
Audio provide the full experience; there is no backend or persistence layer.

## Quick Start

Use Node compatible with Vite 6. The installed Vite package declares
`^18.0.0 || ^20.0.0 || >=22.0.0`.

```bash
npm ci
npm run dev
npm run build
npm run preview
npm audit
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Run TypeScript project checks, then build static files into `dist/`. |
| `npm run preview` | Serve the built `dist/` output locally. |
| `npm audit` | Check the installed dependency graph for known vulnerabilities. |

There is no automated test script in this repository. Use the documented browser smoke tests after
gameplay or layout changes.

## App Routes

| Path | Screen |
| --- | --- |
| `/` | Two-game mini-game portal. |
| `/games/table-talk-diner` | Table Talk Diner. |
| `/games/tiny-city-delivery` | Tiny City Delivery. |
| Any other path | Portal fallback; the unknown URL is not rewritten. |

Routing uses `window.history.pushState` and `popstate`, not a router dependency. A static deployment
must send direct requests for both `/games/...` paths to `index.html`; otherwise direct-link refreshes
can return a host-level 404 even though in-app navigation works.

## Documentation

Start with [docs/README.md](./docs/README.md). The fastest maintainer orientation is
[docs/start-here.md](./docs/start-here.md).

| Guide | What it covers |
| --- | --- |
| [Project Overview](./docs/project-overview.md) | Product scope, routes, stack, local setup, and repo map. |
| [Game Architecture](./docs/architecture.md) | Portal routing, game state, timers, generation, scoring, and status flow. |
| [Gameplay Guide](./docs/gameplay.md) | Controls, rules, feedback, scoring, and completion for both games. |
| [Assets Guide](./docs/assets.md) | Customer, food, background, player, cursor, and naming conventions. |
| [Audio, UI, and Styling](./docs/audio-ui-styling.md) | TTS, Web Audio tones, scene layers, animations, CSS scope, and responsive layout. |
| [Maintenance, Testing, and Deployment](./docs/maintenance-testing-deployment.md) | Change recipes, smoke tests, build checks, and static-host requirements. |
| [Hunter Workflow](./docs/hunter/hunter-workflow.md) | Future-session skill, process, todo, and validation workflow. |

## Repo Shape

```text
index.html               HTML metadata, root element, and Vite entry
src/main.tsx             React mount and global CSS import
src/App.tsx              Portal, path routing, both game engines, audio, and scoring
src/styles.css           Portal, diner, city, animation, and responsive styles
src/assets/              Background, character, food, and cursor assets
docs/                    Maintainer and Hunter documentation
dist/                    Ignored production build output
```
