# Build Plan

The strict build order. Each layer is a work unit with a definition of done and the red flags that halt the build. **Do not start a layer until the previous one passes its checklist.** Full numeric specs live in the Addendum; this plan sequences the work and defines "done."

Legend: ☐ task · ✅ done-when · 🚩 red flag (stop and report)

---

## Layer 0 — Infrastructure (build before any gameplay)

☐ `Telemetry.ts`: `emit(event, payload)` + `snapshotState(vars)` + in-memory ring buffer + debug-key JSON dump.
☐ `SaveSchema.ts` + no-op `SaveManager.ts` (schema only: relationship scores, Fischoeder tier, recipe book, rating history).
☐ Confirm `tunables.ts` imports cleanly; no value is hardcoded anywhere else.

✅ **Done when:** dev server runs, a test `emit` appears in console, and the buffer dumps to JSON on the debug key.

---

## Layer 1A — Kitchen: Burger Crafting (THE HEARTBEAT)

Build this first and **make it feel good before adding anything else.** Everything is pressure layered on top of this.

☐ `HeatZoneBar`: rising bar, release to score; green/yellow/red bands per `HEAT_ZONE`.
☐ `Ingredient` tier enum + `QualityScore`: `tier × timing × botd_ceiling` (BotD ceiling = 1.0 until Layer 3).
☐ `SideTimer`: parallel pass/fail timers — fries (8s), drink (5s), beer (6s), salad (12s). Fail = restart cost.
☐ `Order` + `Menu`: 1 main + 0–2 sides. Standard burgers = common ingredients only.
☐ `KitchenScene`: assemble an order end-to-end, produce a final quality score, log `burger_crafted` + `order_completed`.

✅ **Done when:** a full order can be crafted with split attention between the bar and side timers, and the quality score responds correctly to timing + tier.
🚩 Crafting feels trivial or arbitrary → core loop not landing; fix before proceeding.

---

## Layer 1B — Dining Floor: Seating & Service

☐ `SeatingManager`: 4 booths (parties 2–4) + 10 stools (individuals); `SEATING` bus times.
☐ `Customer` entity + state machine (`queued→seated→ordered→served→leaving→dirty→bused`).
☐ Wait service: deliver completed orders to seated customers; `seatPatienceSec = 20`, walkout if exceeded.
☐ Lost customer: forfeit order revenue + `MORALE.lostCustomerHit` (morale system stub until Layer 4 — log the intent now).

✅ **Done when:** customers seat, order, get served or walk out, and revenue accrues per completed order.
🚩 Tables never fill → arrival/seating tuning off (revisit in 1D).

---

## Layer 1C — Busing

☐ `BusingManager`: seats go `dirty` on customer exit; dirty seats block new seating; booth 4s / stool 2s.

✅ **Done when:** uncleared seats visibly create throughput pressure.

---

## Layer 1D — Customer Rush Wave

☐ `RushWave`: 6-min clock; arrival ramps from every 8–12s to every 5–8s; door queue with 15s patience.

✅ **Done when:** a full 6-minute wave runs end-to-end with Bob alone, producing a coherent revenue total and telemetry dump.
🚩 Session consistently under 3 min, or loop not engaging solo → stop; the foundation must hold before family is added.

---

## Layer 2 — Family Service System

**Do not start until Layer 1 runs well with Bob alone.**

☐ `FamilyMember` service-state machine (`unassigned→correct→wrong→drifting`) per `character_service_state` schema.
☐ Assignment to orders/busing; partially-visible tells; `correctCompetence = 1.0`; drift after 30–60s on wrong assignment.
☐ Drift behaviors: Gene (perform/slowdown), Tina (freeze/stall), Linda (random from 4-pool), Louise (→ 2C).
☐ `LouiseDisruption` (2C): per-task chance 10% manageable / 30% scheming; effects pool; cascading flag.
☐ Teddy backup (2D): `backupCompetence = 0.4`, jalapeño-blind failure, relationship boost, buff inactive while working.

✅ **Done when:** assignment creates real decisions, wrong assignment produces character-true problems, and Louise is a live baseline risk.
🚩 All members always same role → no decisions · never reassign mid-rush → tells/drift too weak · Louise never disrupts → broken.

---

## Layer 3 — Burger of the Day

☐ `BurgerOfTheDay`: session-start creativity/safety; ceilings 1.0 / 0.75; creativity adds ±0.15 jitter, safety none.
☐ Flat $5.95 pricing; tiered ingredient cost; order-rate base 15% → 40% via quality + service modifiers.

✅ **Done when:** the creativity/safety choice is felt by end of rush and neither strictly dominates.
🚩 Always safety (or always creativity) → variance/ceiling balance off.

---

## Layer 4 — Family Morale  +  Layer 4.5 — Family Meeting

☐ `Morale`: float from 0.75, decay 0.002/s; <0.5 → 0.9× craft speed; <0.35 → yips bonus; −0.05 per walkout.
☐ Family meeting: pause 8s, +0.25 base restoration, ×0.6 diminishing per use; log `family_meeting_called`.

✅ **Done when:** morale is a managed resource and the meeting is a real cost/benefit choice.
🚩 Player never calls a meeting → morale not landing.

---

## Layer 5 — Bob's Yips

☐ `Yips`: 10s checks; base 5% + situational bonuses; while active 0.65× quality, faster bar, smaller green zone.
☐ Apply the **floors** from PRE-BUILD-DECISIONS (`greenZoneFloorMultiplier 0.5`, `barSpeedCapMultiplier 1.5`).
☐ Recovery via float accumulator to 1.0 using `ENCOURAGEMENT_WEIGHTS`; **not** a discrete counter.

✅ **Done when:** yips feel threatening but recoverable, and recovery can come from non-crafting sources.
🚩 Yips feel impossible (raise floor) or trivial (lower it).

---

## Layer 6 — Teddy (Regular)

☐ `Teddy`: relationship meter; +10% revenue when seated (prefers stools); one quest (+0.10/−0.05).

✅ **Done when:** Teddy's presence is a measurable mechanical difference (validate via telemetry).

---

## Layer 7 — Louise Gambit

☐ `LouiseGambit`: manageable→scheming once per rush (2–6 min); 10s decision window; default = no intervention.
☐ Intervene (defuse, small morale gain) vs Deploy (two outcome branches: good reward / bad disruption+morale hit).

✅ **Done when:** the gambit reads as an opportunity with teeth, layered on her baseline disruption — not random noise.
🚩 Gambit always ignored → not compelling.

---

## Layer 8 — Fischoeder

☐ `Fischoeder`: pure 10-min timer; interrupts active rush (customers/timers continue); accept/resist; log `rush_active`.

✅ **Done when:** his arrival feels earned and forces genuine split attention.
🚩 Interruption causes no stress (stakes too low) · always accepted (resist not viable).

---

## Layer 9 — Belcher Rating

☐ `BelcherRating`: normalize all four inputs to 0–1, then weight (0.35/0.25/0.20/0.20); revenue = actual/target capped at 1.0.

✅ **Done when:** the Rating moves coherently with session performance and no single input dominates.
🚩 Revenue swamps or vanishes → normalization wrong.

---

## After All Layers

Run several full sessions. Dump telemetry. Evaluate against the five success metrics (metric #1 is an observation band, not a gate — see PRE-BUILD-DECISIONS). Tune `tunables.ts`. Report which red flags, if any, fired.

---

*Build Plan · DGFS-1.0 · Kyle + Jeff · February 2026*
