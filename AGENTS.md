---
description: "Project-wide Hunter root for the Table Talk Games React/Vite game portal."
references:
  - "README.md"
  - "docs/README.md"
---

# Table Talk Games Hunter Root

This root is the startup entry point for future Codex sessions in this repo.

## Future Session Protocol

- If the Hunter MCP tools are exposed, start by calling `hunter_graph_get_root` with
  `rootPath` set to the project root.
- Use child `description` fields to choose the smallest relevant docs for the task.
- If Hunter MCP tools are not exposed, say that directly, then read this file and the referenced
  Markdown files manually.
- For non-trivial multi-step work, create or update Hunter process state before editing and keep
  durable todos under `.hunter/`.
- If project instructions change, run Hunter graph validation before finishing.

## Product Context

- The shipped games are Table Talk Diner and Tiny City Delivery.
- Table Talk Diner is a client-only React/Vite food-serving arcade game for practicing practical
  English orders.
- Tiny City Delivery is a map-routing game for English prepositions, place words, and quantities.
- The app is asset-rich: sprites, background art, cursor art, Web Audio feedback, and browser speech
  synthesis are part of the product experience.
- The first screen should stay the usable game experience, not a landing page.

## Verification Rules

- Run `npm run build` for source, dependency, asset import, or package metadata changes.
- Run `git diff --check` before handing work back.
- For layout, animation, or asset changes, inspect the running app at desktop and mobile widths when
  practical.
