---
description: "Hunter workflow for future Codex sessions, process state, todos, validation, and fallback behavior."
references: []
---

# Hunter Workflow

## Startup

- Treat `AGENTS.md` as the project root for instruction loading.
- When Hunter MCP tools are available, call `hunter_graph_get_root` with the active project root.
- Use node descriptions to load only the docs needed for the task.
- If Hunter MCP tools are unavailable, say that the Hunter skill loaded but Hunter MCP tools are not
  exposed in the thread, then read `AGENTS.md` and referenced files directly.

## Process State

- For non-trivial multi-step work, create or update a Hunter process record before editing.
- Keep process records under `.hunter/processes/`.
- Mark steps `in_progress`, `done`, `blocked`, or `stale` as the work changes.
- If a step changes in a way that affects dependent work, mark dependent steps stale and re-check
  them before presenting completion.

## Durable Todos

- Use Hunter todos for concrete work items that should survive across turns.
- Keep todos under `.hunter/todos/`.
- Link todos to the process when a task has a clear process step.
- Clear or mark todos done only after the corresponding evidence has been checked.

## Documentation Changes

- Give every Hunter graph node YAML frontmatter with `description` and `references`.
- Keep references direct and root-relative.
- Run `hunter_graph_validate` after changing Markdown graph files.
- A clean graph has no broken references, invalid Markdown, or orphan Markdown files.

## Delegation

- Delegation means preparing a focused prompt, not running an external runtime.
- Store delegation prompts under `.hunter/delegations/` when needed.
- Include goal, context, constraints, validation expectations, and output contract.

## Publishing

- Keep PRs scoped to the files that belong to the task.
- Use explicit staging or connector writes; do not silently include unrelated local changes.
- Prefer draft PRs unless the user asks for ready-for-review.
