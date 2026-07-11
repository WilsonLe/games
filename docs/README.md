---
description: "Documentation index and Hunter graph hub for the Lingo Game mini-game portal."
references:
  - "docs/start-here.md"
  - "docs/project-overview.md"
  - "docs/architecture.md"
  - "docs/gameplay.md"
  - "docs/assets.md"
  - "docs/audio-ui-styling.md"
  - "docs/rendering-engine.md"
  - "docs/maintenance-testing-deployment.md"
  - "docs/hunter/hunter-workflow.md"
  - "docs/hunter/repo-workflow.md"
  - "docs/hunter/dish-wish.md"
  - "docs/hunter/drop-hop.md"
  - "docs/hunter/assets-and-visual-qa.md"
---

# Documentation Index

[Repo README](../README.md)

This documentation describes the current two-game portal, both game implementations, runtime assets,
and repository workflow.

## Read Order

| Guide | Use it when |
| --- | --- |
| [Start Here](./start-here.md) | You need the fastest source and risk orientation. |
| [Project Overview](./project-overview.md) | You need scope, routes, stack, setup, or the repo map. |
| [Game Architecture](./architecture.md) | You need routing, React state, effects, timing, generation, scoring, or status flows. |
| [Gameplay Guide](./gameplay.md) | You need player-facing controls and rules for the portal or either game. |
| [Assets Guide](./assets.md) | You need to add, replace, or inspect art. |
| [Audio, UI, and Styling](./audio-ui-styling.md) | You need speech, tones, layout, selector scope, animation, or responsive guidance. |
| [Phaser Rendering Engine](./rendering-engine.md) | You need the React/Phaser boundary, scene lifecycle, canvas input, or renderer performance guidance. |
| [Maintenance, Testing, and Deployment](./maintenance-testing-deployment.md) | You need change recipes, browser smoke tests, build checks, or static hosting notes. |
| [Hunter Workflow](./hunter/hunter-workflow.md) | You need Hunter skill, process, todo, or validation workflow. |
| [Repo Workflow](./hunter/repo-workflow.md) | You need checkout, command, or change-boundary guidance. |
| [Dish Wish Notes](./hunter/dish-wish.md) | You are changing diner gameplay. |
| [Drop Hop Notes](./hunter/drop-hop.md) | You are changing city gameplay. |
| [Assets and Visual QA](./hunter/assets-and-visual-qa.md) | You are changing layouts or art. |

## Source Anchors

| File | Role |
| --- | --- |
| `index.html` | Document metadata, root node, and Vite entry. |
| `src/main.tsx` | React `StrictMode` mount and CSS import. |
| `src/App.tsx` | Portal, History API paths, gameplay state, effects, scoring, speech, tones, and renderer snapshots. |
| `src/game-runtime/PhaserGameHost.tsx` | Shared Phaser creation/destruction and responsive canvas host. |
| `src/games/` | Dish Wish and Drop Hop React adapters plus Phaser scenes. |
| `src/styles.css` | Portal/HUD/page layout, canvas hosts, focus controls, and breakpoints. |
| `src/assets/` | Runtime PNG and SVG assets. |
| `package.json` | npm scripts and dependency ranges. |
| `AGENTS.md` | Project-wide coding-session instructions. |

## Coverage

The docs cover:

- the root mini-game portal and both game routes;
- direct-link/static-host fallback requirements;
- both gameplay models and completion conditions;
- React state, effects, timers, generation, scoring, and audio;
- Phaser 2D scenes, snapshot/event bridges, lifecycle, and accessible fallback controls;
- asset inventories and replacement recipes;
- shared CSS risks and diner-only selector scoping;
- desktop/mobile smoke tests and command verification;
- Hunter startup, durable process/todo use, worktree discipline, and validation fallback.

## Known Repository Gaps

| Gap | Current status |
| --- | --- |
| Automated tests | No runner, test script, or test files. |
| CI | No GitHub Actions or other CI configuration. |
| Deployment provider | No provider-specific configuration; static-host SPA fallback must be configured externally. |
| Browser support policy | Browser-native audio APIs are used without a formal support matrix. |
| Generated-art provenance | Final image files are present, but prompt/source metadata is not. |
