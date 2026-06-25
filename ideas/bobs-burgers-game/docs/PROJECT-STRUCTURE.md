# Project Structure

How the DGFS-1.0 systems map onto the codebase. Build modules in the order given in `BUILD-PLAN.md`; this document is the architectural map, not the build sequence.

---

## Directory Roles

| Path | Contains |
|------|----------|
| `src/main.ts` | Phaser bootstrap only. Stays thin. |
| `src/config/tunables.ts` | Every `[TUNABLE]` value. Single source of truth. Read before writing any system. |
| `src/scenes/` | Phaser scenes — the visual/interaction layer. |
| `src/systems/` | Pure game logic, framework-light where possible. Testable in isolation. |
| `src/entities/` | Data + behavior for in-world objects (customers, family, ingredients, orders). |

**Principle:** keep *logic* in `systems/` and *presentation* in `scenes/`. A system should be reasonable to reason about without Phaser. Scenes call into systems and render their state. This keeps the code legible and the logic testable.

---

## Spec System → Module Map

| DGFS Layer | Module(s) | Notes |
|-----------|-----------|-------|
| Layer 0 — Telemetry (infra) | `systems/Telemetry.ts` | Build first. Every system emits through it. |
| Layer 0 — Save stub (infra) | `systems/SaveManager.ts`, `systems/SaveSchema.ts` | No-op manager + schema type. Not wired to disk. |
| Layer 1A — Heat Zone Bar | `systems/HeatZoneBar.ts`, `scenes/KitchenScene.ts` | The heartbeat. Build and feel-test before anything else. |
| Layer 1A — Sides/drinks timers | `systems/SideTimer.ts` | Pass/fail parallel timers (fries, drinks, salad, beer). |
| Layer 1A — Ingredients/quality | `entities/Ingredient.ts`, `systems/QualityScore.ts` | Tier enum + quality formula. |
| Layer 1A — Menu/orders | `entities/Order.ts`, `systems/Menu.ts` | Order composition: 1 main + 0–2 sides. |
| Layer 1B — Seating & service | `systems/SeatingManager.ts`, `entities/Customer.ts`, `scenes/DiningScene.ts` | Booths + stools, patience timers, walkouts. |
| Layer 1C — Busing | `systems/BusingManager.ts` | Uncleared seats block new customers. |
| Layer 1D — Rush wave | `systems/RushWave.ts` | Arrival ramp, door queue, wave clock. |
| Layer 2 — Family service | `systems/FamilyService.ts`, `entities/FamilyMember.ts` | Assignment, tells, drift state machines. |
| Layer 2C — Louise baseline | `systems/LouiseDisruption.ts` | Per-task disruption chance (separate from gambit). |
| Layer 2D — Teddy backup | folded into `FamilyService.ts` + `entities/Teddy.ts` | Mutually exclusive with Teddy-as-regular. |
| Layer 3 — Burger of the Day | `systems/BurgerOfTheDay.ts` | Creativity/safety, jitter, order-rate scaling. |
| Layer 4 — Morale | `systems/Morale.ts` | Single float, decay, threshold effects. |
| Layer 4.5 — Family meeting | folded into `Morale.ts` | Pause + restoration + diminishing returns. |
| Layer 5 — Bob's yips | `systems/Yips.ts` | Probability checks, difficulty mods, float-accumulator recovery. |
| Layer 6 — Teddy (regular) | `entities/Teddy.ts` | Relationship meter, passive buff, one quest. |
| Layer 7 — Louise gambit | `systems/LouiseGambit.ts` | Scheming transition, 10s window, intervene/deploy. |
| Layer 8 — Fischoeder | `systems/Fischoeder.ts` | 10-min timer, interrupts rush, accept/resist. |
| Layer 9 — Belcher Rating | `systems/BelcherRating.ts` | Normalized weighted composite. |

---

## State Machine Inventory (Convention #2)

Every entry below is an explicit state machine with clean transitions — no boolean soup:

- **Bob:** `normal → yips → normal` (recovery via encouragement accumulator)
- **Louise mood:** `manageable → scheming` (once per rush; drives both baseline disruption rate and gambit availability)
- **Teddy:** `absent → seated(regular) → absent` and separately `absent → backup(service) → absent` (the two are mutually exclusive)
- **Each family member (Linda/Tina/Gene/Louise) service state:** `unassigned → assigned(correct) → assigned(wrong) → drifting` (drift behavior selected on entry to `drifting`)
- **Customer:** `queued → seated → ordered → served → leaving → (seat) dirty → bused`

---

## Telemetry Wiring

`Telemetry.ts` exposes `emit(eventName, payload)` and `snapshotState(vars)`. Every system imports it and emits the events listed in the Addendum §6 / Build Prompt. A debug key dumps the in-memory buffer to JSON for playtest review. Build this in Layer 0 so no later system ships un-instrumented.

---

*Project Structure · DGFS-1.0 · Kyle + Jeff · February 2026*
