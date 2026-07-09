---
description: "Player-facing Table Talk Diner gameplay, controls, serving rules, and outcomes."
references: []
---

# Gameplay Guide

[Docs index](./README.md) | [Repo README](../README.md)

This guide describes current player-facing behavior implemented in `src/App.tsx`.

## Objective

Complete `24` guest orders before reaching `5` misses. A miss happens when the player clicks food no active guest needs, or when a guest leaves before the order is complete.

## Main Screen

| Area | Purpose |
| --- | --- |
| Portal rail | Shows the Table Talk Games brand and the active `Table Talk Diner` game button. |
| Top bar | Shows the game title, start/pause/resume/new-shift button, and reset button. |
| Score strip | Shows score, completed orders, streak, lives, and level. |
| Active Guests | Shows each guest, order phrase, food checklist, patience bar, level, and seconds remaining. |
| Food Belt | Shows clickable food moving across two conveyor lanes. |
| Difficulty Engine | Shows current difficulty values and sprite sheet preview. |
| Feedback bar | Announces neutral, good, or bad status messages. |

## Controls

| Control | Current behavior |
| --- | --- |
| `Start Shift` | Calls `resetGame`, creates two level-1 guests, speaks the first order, and starts play. |
| `Pause` | Sets status to `paused`, records pause start time, and stops play effects. |
| `Resume` | Shifts guest, scheduled-food, belt-food, and spawn timestamps by the paused duration, then resumes play. |
| `New Shift` | Appears after `ended`; starts a fresh shift through `resetGame`. |
| Reset icon | Starts a fresh shift from any status. |
| Guest card click | Selects that guest as the preferred recipient for matching food. |
| Speaker icon on guest card | Selects that guest and replays the order through speech synthesis. |
| Food click | Attempts to serve the food while playing. |

## Initial Shift

`resetGame` creates two guests:

| Guest sequence | Spawn timestamp | Source |
| --- | --- | --- |
| `0` | Current start time | First active guest and selected guest. |
| `1` | Start time plus `900ms` | Second active guest. |

The game resets score, completed orders, streak, misses, belt foods, scheduled foods, guest sequence, food sequence, and feedback.

## Serving Rules

Food matching is resolved in `handleFoodClick`.

| Situation | Outcome |
| --- | --- |
| Game is not `playing` | Feedback says `Start the conveyor first.` Food is not served. |
| Food has a `targetGuestId` and that guest still needs it | The food serves that owning guest. |
| Selected guest needs the food | The food serves the selected guest. |
| Any active guest needs the food | The food serves the first matching active guest. |
| No active guest needs the food | Food is removed, a miss is added, streak resets, and the wrong sound/TTS plays. |

Important: visible decoy foods can still complete an order if a guest needs that food. The `targetGuestId` field controls priority, not a hard allow-list.

## Correct Food

On a correct food click:

1. The belt item is removed.
2. The matching guest receives that `foodId` in `servedFoods`.
3. Score increases using the base, time, level, and streak bonuses.
4. Streak increases.
5. Feedback becomes `good`.
6. Speech synthesis announces the served food or completed order.
7. Web Audio plays `correct` or `complete`.

If the guest order is not complete, the guest card remains and its food chip becomes served.

If the order is complete, the guest is removed, `served` increments, remaining scheduled foods for that guest are removed, and the game may schedule a later replacement guest.

## Incorrect Food And Misses

| Miss source | Current behavior |
| --- | --- |
| Clicking food nobody needs | Removes the food, plays the `wrong` sound, speaks `No one ordered ...`, resets streak, increments misses. |
| Guest expiration | Removes the guest, removes matching scheduled/belt foods, resets streak, increments misses. |

When misses reach `5`, the game status becomes `ended`.

## Guest Patience

Each guest receives:

```text
expiresAt = createdAt + profile.timeToLastDishMs + profile.patienceBufferMs
```

`GuestCard` displays:

| UI | Source |
| --- | --- |
| Patience bar width | Remaining time divided by total guest lifetime. |
| Seconds remaining | `formatTime(guest.expiresAt - now)`. |
| Level label | `guest.level`, captured when the guest was generated. |

## Conveyor Behavior

| Food type | Source | End-of-belt behavior |
| --- | --- | --- |
| Ordered food | `ScheduledFood` created by `makeGuest` | Recycles if its target guest still needs it. |
| Decoy food | `makeDecoyFood` | Disappears after crossing. |

`ConveyorBelt` positions food with:

```text
progress = clamp((now - spawnedAt) / travelMs, 0, 1)
left = 104 - progress * 116
```

This moves food from just beyond the right edge to beyond the left edge.

## Completion Conditions

| Condition | Result banner |
| --- | --- |
| `served >= TARGET_SERVES` | `Shift complete`; text says all target orders were served. |
| `misses >= MAX_MISSES` | `Kitchen closed`; text says too many guests left unhappy. |

After ending, clicking the main button starts a new shift.

## Feedback States

| Kind | CSS class | Examples |
| --- | --- | --- |
| `neutral` | `feedbackBar--neutral` | Ready, paused, resumed, guest phrase. |
| `good` | `feedbackBar--good` | Served a dish, completed an order, shift complete. |
| `bad` | `feedbackBar--bad` | No guest needs a food, audio unavailable, guest left. |

The feedback bar uses `role="status"`.
