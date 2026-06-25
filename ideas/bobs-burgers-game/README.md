# Bob's Burgers Game

A 2D restaurant management game set in the Bob's Burgers universe. Built from the **DGFS-1.0** spec. Passion project by Kyle and Jeff.

**Stack:** Phaser 3 · TypeScript (strict) · Vite · Capacitor (mobile, later).

---

## Quick Start

```bash
# 1. Install Node 18+ (LTS). Check: node -v
# 2. Install dependencies
npm install

# 3. Run the dev server (opens http://localhost:5173)
npm run dev
```

If the dev server shows "Bob's Burgers Game — bootstrap OK", the toolchain works. Begin the build at `docs/BUILD-PLAN.md`, Layer 0.

```bash
npm run dev        # dev server with hot reload
npm run typecheck  # tsc --noEmit — run before every commit
npm run build      # production web build → dist/
npm run preview    # serve the production build locally
```

---

## How This Repo Is Meant To Be Used

This repo is built **with Claude Code**, one layer at a time, following a fully-resolved spec.

1. Open the repo in Claude Code. It reads `CLAUDE.md` automatically — that file is the project constitution.
2. The five spec documents live in `docs/spec/`. The **Addendum is authoritative**; the hierarchy is `Addendum > CLAUDE.md > JSON > Design Doc`.
3. Work proceeds in the strict order defined in `docs/BUILD-PLAN.md`. Each layer must work and feel right before the next begins.
4. All tunable values live in `src/config/tunables.ts`. Never hardcode them inline.

The guiding rule for the whole build: **extract, do not invent.** If a spec is missing, flag it — don't improvise.

---

## Repo Layout

```
bobs-burgers-game/
├── CLAUDE.md                  # project constitution — read first
├── README.md                  # this file
├── index.html                 # Vite entry
├── package.json
├── tsconfig.json
├── vite.config.ts
├── docs/
│   ├── PRE-BUILD-DECISIONS.md # the 4 final closures before build
│   ├── BUILD-PLAN.md          # strict layer-by-layer task breakdown
│   ├── PROJECT-STRUCTURE.md   # file/folder architecture + spec→module map
│   └── spec/                  # the 5 DGFS-1.0 documents (see spec/README.md)
└── src/
    ├── main.ts                # Phaser bootstrap (thin — do not grow)
    ├── config/
    │   └── tunables.ts        # ALL [TUNABLE] values, single source of truth
    ├── scenes/                # Phaser scenes (built per layer)
    ├── systems/               # game systems: telemetry, rush, morale, yips...
    └── entities/              # customers, family members, ingredients...
```

---

## Status

Bootstrap + scaffold complete. Game systems not yet built. Start at `docs/BUILD-PLAN.md`.

---

*DGFS-1.0 · Kyle + Jeff · February 2026*
