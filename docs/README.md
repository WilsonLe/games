# Documentation Index

[Repo README](../README.md)

This docs set is for future maintainers and future Codex sessions. It describes only the game/app behavior present in the current code and assets.

## Read Order

| Start here | Use this when |
| --- | --- |
| [Start Here](./start-here.md) | You need the fastest orientation before changing anything. |
| [Project Overview](./project-overview.md) | You need the product, tech stack, local setup, and repo map. |
| [Game Architecture](./architecture.md) | You need to understand React state, timers, order generation, scoring, levels, and game status flow. |
| [Gameplay Guide](./gameplay.md) | You need to verify or adjust player-facing behavior. |
| [Assets Guide](./assets.md) | You need to add or replace sprites, background art, the chef, or cursor. |
| [Audio, UI, and Styling](./audio-ui-styling.md) | You need TTS, sound, scene layering, animation, responsive layout, or CSS guidance. |
| [Maintenance, Testing, and Deployment](./maintenance-testing-deployment.md) | You need recipes, smoke tests, build checks, GitHub notes, or deployment expectations. |

## Source Anchors

| File | Role |
| --- | --- |
| `src/App.tsx` | All game data, components, state, order generation, timers, scoring, audio helpers, and render tree. |
| `src/styles.css` | Global CSS variables, game scene layers, component styling, food/customer art containers, animations, and responsive rules. |
| `src/main.tsx` | React entry point, `StrictMode`, app mount, and CSS import. |
| `src/assets/` | Runtime image and cursor assets. |
| `package.json` | npm scripts and dependency versions. |

## Documentation Checklist

| Area | Status |
| --- | --- |
| Project overview and current game scope | Documented in [Project Overview](./project-overview.md). |
| Local setup, scripts, and Node/npm assumptions | Documented in [Project Overview](./project-overview.md) and [README](../README.md). |
| React component/state architecture | Documented in [Game Architecture](./architecture.md). |
| Main data structures and inventories | Documented in [Game Architecture](./architecture.md) and [Assets Guide](./assets.md). |
| Timers, status flow, order generation, levels, scoring, lives, streaks | Documented in [Game Architecture](./architecture.md). |
| Gameplay controls and serve outcomes | Documented in [Gameplay Guide](./gameplay.md). |
| Customer, food, background, player, cursor assets | Documented in [Assets Guide](./assets.md). |
| Speech synthesis and sound effects | Documented in [Audio, UI, and Styling](./audio-ui-styling.md). |
| 2D scene layers, animations, responsive layout, custom cursor | Documented in [Audio, UI, and Styling](./audio-ui-styling.md). |
| Styling organization and visual rules to preserve | Documented in [Audio, UI, and Styling](./audio-ui-styling.md). |
| Maintenance recipes | Documented in [Maintenance, Testing, and Deployment](./maintenance-testing-deployment.md). |
| Manual testing and build verification | Documented in [Maintenance, Testing, and Deployment](./maintenance-testing-deployment.md). |
| Deployment and GitHub notes | Documented in [Maintenance, Testing, and Deployment](./maintenance-testing-deployment.md). |
| Future-session orientation | Documented in [Start Here](./start-here.md). |

## Known Documentation Gaps

| Gap | Why it remains |
| --- | --- |
| No automated test reference | The repo does not contain test tooling or test files. |
| No CI workflow reference | The repo does not contain GitHub Actions or other CI config. |
| No deployment provider specifics | The repo has a Vite static build but no provider config. |
| No generated-art prompts or source process | The repo stores final image files, but no generation prompt metadata or script. |
| No browser support matrix | The code uses browser APIs directly, but no project browser policy is present. |
