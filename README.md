# Amsoft Games

Amsoft Games is a React/Vite game portal. The current shipped game is **Conveyor Kitchen**, a 2D food-serving arcade game for practicing practical English food orders.

The app is client-only: React state, CSS animation, image assets, browser speech synthesis, and browser Web Audio sound effects. There is no backend, router, save system, or automated test suite in this repo today.

## Quick Start

Use Node compatible with Vite 5. The installed Vite package declares `^18.0.0 || >=20.0.0`; this workspace was inspected with Node `v24.15.0` and npm `11.12.1`.

```bash
npm ci
npm run dev
npm run build
npm run preview
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Run TypeScript project checks, then build static files into `dist/`. |
| `npm run preview` | Serve the built `dist/` output locally. |

## Documentation

Start with [docs/README.md](./docs/README.md). The fastest maintainer orientation is [docs/start-here.md](./docs/start-here.md).

Key guides:

| Guide | What it covers |
| --- | --- |
| [Project Overview](./docs/project-overview.md) | Game summary, target user, tech stack, local setup, repo map. |
| [Game Architecture](./docs/architecture.md) | React state, timers, order generation, status flow, difficulty, scoring. |
| [Gameplay Guide](./docs/gameplay.md) | Controls, serving rules, feedback states, completion conditions. |
| [Assets Guide](./docs/assets.md) | Customer, food, background, player, cursor, and naming conventions. |
| [Audio, UI, and Styling](./docs/audio-ui-styling.md) | TTS, Web Audio tones, scene layers, animations, CSS organization. |
| [Maintenance, Testing, and Deployment](./docs/maintenance-testing-deployment.md) | Common change recipes, manual smoke tests, GitHub and build notes. |

## Repo Shape

```text
src/App.tsx              Game data, components, state, timers, audio, and scoring
src/styles.css           Full app styling, scene layers, animation, and breakpoints
src/assets/              Background, player, cursor, sprite sheet, and sprite folders
docs/                    Maintainer documentation
dist/                    Build output, ignored by Git
```
