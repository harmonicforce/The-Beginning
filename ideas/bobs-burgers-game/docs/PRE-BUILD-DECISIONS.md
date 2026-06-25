# Pre-Build Decisions

> Four open items remained after the audit + addendum. They are resolved here so the package is fully closed before code. These decisions supersede ambiguity in the other documents.

---

## DECISION 1 — Engine: Phaser 3 + TypeScript + Vite (LOCKED)

**Decision:** Build in Phaser 3, TypeScript (strict), bundled with Vite. Mobile export via Capacitor, deferred until the web prototype is validated.

**Rationale:** Lowest activation energy for Kyle's existing skill set (React/Vite/TS). The spec is heavy on state machines and config objects, both idiomatic in TS. Web-first keeps the dev loop fast and the code legible — which matters because this codebase doubles as a learning surface. Godot 4 was the runner-up (stronger native 2D engine) but introduces a new environment and language; the friction cost outweighs the ceiling benefit for an MVP that never approaches Phaser's limits.

**Trade-off accepted:** Phaser gives less for free than Godot. Scene management, character state machines, and config architecture are hand-built. This is acceptable — the resulting code is legible TS in a familiar toolchain.

---

## DECISION 2 — Scope Expansion: ACCEPTED

**Decision:** The MVP is the **expanded** scope from Addendum §9 — full restaurant operations loop (kitchen + service + busing + seating + family assignment), not the original burger-crafting-only MVP.

**Rationale:** A burger-crafting toy with no restaurant around it is too hollow to evaluate fairly — you cannot feel whether the loop is fun without the demand side (customers, tables, pressure). The expanded scope is larger but materially more testable, and decision density is high enough that the success metrics become meaningful rather than trivially met.

**Risk acknowledged:** Build time for Layer 1 roughly doubles versus the original spec. Mitigated by strict sub-layering (1A→1B→1C→1D) so complexity is staged, and by the rule that each sub-layer must function before the next.

**Consequence:** If the prototype underperforms, the larger surface area makes it harder to isolate *which* system failed. Counter-measure: telemetry-first (Layer 0) so every system is observable from its first commit.

---

## DECISION 3 — Yips Difficulty Floor (NEW SAFEGUARD)

**Problem identified:** The addendum makes yips compound the Heat Zone Bar on two axes (faster bar + smaller green zone) *and* apply a 0.65× quality multiplier. Lower timing scores reduce two encouragement sources (customer compliments, successful-burger-streak), which can extend the yips, which further degrades timing — a potential recovery-suppression loop, worst under low morale + Fischoeder present.

**Decision:** Add two floors, implemented as tunables (already in `tunables.ts`):
- `greenZoneFloorMultiplier: 0.5` — the green zone never shrinks below 50% of its base width, regardless of stacked yips effects.
- `barSpeedCapMultiplier: 1.5` — bar speed-up is hard-capped at 1.5× base.

**Rationale:** Yips must feel punishing, not impossible. Because encouragement can still arrive from non-crafting sources (Linda direct, Teddy pep talk, family accidental), preserving a craftable floor keeps burger-streak recovery viable as a backup path rather than a closed door. Watch in playtest: if players still spiral, raise the floor; if yips feel trivial, lower it.

---

## DECISION 4 — "Meaningful Decision" Definition + Metric Status

**Problem identified:** Success metric #1 ("3 meaningful decisions per minute") was a pass/fail gate using an undefined term. Telemetry can count *events* but not *meaningfulness*.

**Decision:**
- **Operational definition:** a *meaningful decision* is any logged player choice where (a) at least two available options differed in expected value by a non-trivial margin, **or** (b) it was a time-pressured choice with a real failure branch.
- **Qualifying events for MVP:** Burger of the Day choice, Louise gambit intervene/deploy, family meeting call, family assignment/reassignment under active drift risk, ingredient-tier choice on a BotD order, Fischoeder accept/resist.
- **Status change:** metric #1 is downgraded from a **gate** to a **tracked observation band** (target ≥3/min). The prototype does not fail solely on this number; it is a signal, read alongside the red flags. (`DECISION_METRIC.treatAsGate = false` in `tunables.ts`.)

**Rationale:** A gate built on an uncountable term produces false pass/fail signals. As an observation band it still surfaces a too-passive loop without falsely failing an otherwise-good prototype.

---

## Items Explicitly Left Open (Not Blocking)

- **IP / legal:** This prototype uses licensed Bob's Burgers characters. Fine as a **private, non-distributable** passion build. It cannot be shipped, sold, or publicly released without rights. Treat as a known boundary, not a task.
- **Audio assets:** Several feel-tests (yips encouragement via Linda singing; Gene's musicality) lean on audio the show is known for. MVP can stand up silently, but flag during playtest that some mechanics will under-read without placeholder audio.

---

*Pre-Build Decisions · DGFS-1.0 · Kyle + Jeff · February 2026*
