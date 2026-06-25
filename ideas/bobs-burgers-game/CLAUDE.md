# CLAUDE.md — Bob's Burgers Game

> This file is read by Claude Code at the start of every session. It is the project constitution. Read it fully before doing anything.

---

## PROJECT IDENTITY

A Bob's Burgers-themed 2D restaurant management game. Side-scrolling, real-time, cross-platform (PC + mobile). Singleplayer core. Infinite progression, no win state.

This is a passion project by Kyle and Jeff. It was specced through a full design interrogation (DGFS-1.0), audited, and resolved before reaching code. **Every mechanic and value has already been decided.** Your job is to execute the spec faithfully, not to redesign it.

---

## THE PRIME DIRECTIVE: EXTRACT, DO NOT INVENT

Every mechanic, value, formula, and system interaction is defined across the spec documents. If you cannot find a specification for something, **stop and flag it** — do not improvise.

- Ambiguity → `[SPEC GAP: description]` and ask before proceeding.
- Technical trade-off with design consequences → `[TRADE-OFF: option A vs option B — consequences are X]` and ask.
- The spec was audited. If you find a *new* gap, it is real. Surface it.

Do not add scope. Do not invent systems. Do not "improve" the design unprompted.

---

## DOCUMENT HIERARCHY (Source of Truth)

When documents conflict, higher wins:

```
ADDENDUM  >  THIS FILE  >  JSON SPEC  >  DESIGN DOC
```

| Document | Role | Location |
|----------|------|----------|
| `DGFS-1.0-Spec-Addendum.md` | **Authoritative.** All final numeric values, mechanic definitions, system specs. | `docs/spec/` |
| `CLAUDE.md` (this file) | Build constraints, conventions, workflow. | repo root |
| `DGFS-1.0-spec.json` | System architecture, compounding mechanisms, design philosophy. | `docs/spec/` |
| `DGFS-1.0-Design-Document.docx` | Human-readable reasoning. Section 13 = coding context. Section 2 = pillars/tone. | `docs/spec/` |
| `DGFS-1.0-Spec-Audit.md` | Reference only — explains *why* the addendum exists. No action needed. | `docs/spec/` |

Also read before building: `docs/PRE-BUILD-DECISIONS.md`, `docs/BUILD-PLAN.md`, `docs/PROJECT-STRUCTURE.md`.

---

## TECH STACK (Locked)

- **Engine:** Phaser 3
- **Language:** TypeScript (strict mode)
- **Build:** Vite
- **Mobile:** Capacitor (PC web build is primary target; mobile export comes later, do not block on it)
- **State:** In-memory only for MVP. Save system is stubbed, not wired (see Save Architecture below).

No other runtime dependencies without flagging first.

---

## HOW TO WORK

### One layer at a time
The build order in `docs/BUILD-PLAN.md` is strict. Each layer must work and feel correct before the next begins. **Do not skip ahead.** Do not start Layer 2 until Layer 1 functions with Bob alone.

### Kyle is learning to code
- Walk through problems step by step. Explain reasoning.
- When debugging, diagnose before changing. Do not silently rewrite files or "take over" — narrate what is wrong and why before fixing.
- Prefer legible code over clever code. This codebase is also a teaching surface.
- Small, reviewable commits per sub-layer.

### Validate against feel, not just function
After each layer, check it against its success criteria and red flags in `BUILD-PLAN.md`. If a red flag appears, **stop and report** — do not stack new layers on a broken foundation.

---

## NON-NEGOTIABLE CONVENTIONS

### 1. Config-driven tunables
Every value the spec marks `[TUNABLE]` lives in `src/config/tunables.ts` as a named constant. **Never hardcode a tunable inline.** The first thing we do after the prototype runs is tune these — they must be changeable in one place. The file is pre-populated with all decided values; read it before writing any system.

### 2. State machines for all character moods
Louise (manageable/scheming), Bob (normal/yips), Teddy (present/absent/backup), and every family member's drift state are state machines with explicit, clean transitions. No ambiguous intermediate states. No boolean soup.

### 3. Telemetry is not optional
Every event and state var listed in the Addendum (§6) and Build Prompt must be logged. Telemetry is how we validate the prototype against success metrics. Build a single `Telemetry` system early (Layer 0 task) and emit from every system. Log to console + an in-memory buffer that can be dumped to JSON.

### 4. Save architecture stubbed, not skipped
MVP needs no persistence. But define the save schema now (what *would* persist: relationship scores, Fischoeder tier, recipe book, Belcher Rating history) so adding it later is not a refactor. A `SaveSchema` type + a no-op `SaveManager` is sufficient.

---

## TONE BAR (Pass/Fail Criterion)

The game must feel like an episode of the show — warm, chaotic, slightly stressful, never mean.

- Bob's love of cooking is always visible.
- The family is always simultaneously an asset and a liability.
- Louise is dangerous and brilliant — her disruptions feel like *her*, not generic RNG.
- Teddy is loyal and a disaster — his failures are endearing.
- Linda is chaotic and loving — even her worst drift comes from a good place.
- Fischoeder is charming and predatory — his arrival feels inevitable, not random.

**If the code works but the characters don't feel right, the prototype has failed.** This is a real gate, not flavor text.

---

## DESIGN PILLARS (The Decision Filter)

Run every micro-decision through these three:

1. **Chaos is the point** — pressure, disruption, imperfection are features, not bugs. Never let the player feel fully in control.
2. **Family first, restaurant second** — systems reflect that relationships matter more than the score.
3. **Every burger tells a story** — the food is never just a number; creativity, risk, and Bob's identity live in every crafting decision.

---

## COMMANDS

```bash
npm install        # install dependencies
npm run dev        # Vite dev server (primary dev loop)
npm run build      # production web build
npm run preview    # preview the production build
npm run typecheck  # tsc --noEmit, run before every commit
```

(Capacitor/mobile commands are added later — out of scope until the web prototype is validated.)

---

## WHAT IS OUT OF SCOPE (Do Not Build)

Adventure Mode / split party · Gene & Tina *gambit* systems (their Layer-2 drift behaviors ARE in scope) · full collectible economy · neighborhood events · Ken · misinformation layer · health inspection · regulars beyond Teddy · meta-progression unlocks · Linda *gambit* system (her Layer-2 drift behaviors ARE in scope) · recipe book persistence.

If a missing feature feels obvious, it is probably cut on purpose. Flag, don't build.

---

*CLAUDE.md — DGFS-1.0 — Kyle + Jeff — February 2026*
