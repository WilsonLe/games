---
description: "Documentation index and Hunter graph hub for the Table Talk Games mini-game portal."
references:
  - "docs/start-here.md"
  - "docs/project-overview.md"
  - "docs/architecture.md"
  - "docs/gameplay.md"
  - "docs/assets.md"
  - "docs/audio-ui-styling.md"
  - "docs/maintenance-testing-deployment.md"
  - "docs/hunter/hunter-workflow.md"
  - "docs/hunter/repo-workflow.md"
  - "docs/hunter/table-talk-diner.md"
  - "docs/hunter/tiny-city-delivery.md"
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
| [Maintenance, Testing, and Deployment](./maintenance-testing-deployment.md) | You need change recipes, browser smoke tests, build checks, or static hosting notes. |
| [Hunter Workflow](./hunter/hunter-workflow.md) | You need Hunter skill, process, todo, or validation workflow. |
| [Repo Workflow](./hunter/repo-workflow.md) | You need checkout, command, or change-boundary guidance. |
| [Table Talk Diner Notes](./hunter/table-talk-diner.md) | You are changing diner gameplay. |
| [Tiny City Delivery Notes](./hunter/tiny-city-delivery.md) | You are changing city gameplay. |
| [Assets and Visual QA](./hunter/assets-and-visual-qa.md) | You are changing layouts or art. |

## Source Anchors

| File | Role |
| --- | --- |
| `index.html` | Document metadata, root node, and Vite entry. |
| `src/main.tsx` | React `StrictMode` mount and CSS import. |
| `src/App.tsx` | Portal, History API paths, both games, state, effects, scoring, speech, and tones. |
| `src/styles.css` | Portal, diner, city, assets, animation, and breakpoints. |
| `src/assets/` | Runtime PNG and SVG assets. |
| `package.json` | npm scripts and dependency ranges. |
| `AGENTS.md` | Project-wide coding-session instructions. |

## Coverage

The docs cover:

- the root mini-game portal and both game routes;
- direct-link/static-host fallback requirements;
- both gameplay models and completion conditions;
- React state, effects, timers, generation, scoring, and audio;
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
