# CHANGELOG — The Beginning
> All changes tracked by Computer (AI engineering partner) and the development team.

---

## [Unreleased — v1.0.0] — March 2026

### Added by Computer (Initial Scaffold — 2026-03-13)

#### Repository Structure
- Initialized full Expo Router project structure matching `photo_intake_engine_spec.docx §6.2`
- Created all required directories: `app/`, `components/`, `lib/`, `store/`, `types/`, `config/`
- Added `hooks/`, `services/` directories (stub scaffolds per Work Order P1-07)
- Added `lib/validation/` for Zod schemas per Work Order P1-06
- Added `lib/stubs.ts` for dev/demo mode without API key

#### Types (types/)
- `types/item.ts` — Complete item schema TypeScript types matching Spec §4 exactly
- `types/categories.ts` — Category config + photo slot data from `reseller_v4_final.jsx`

#### Config (config/)
- `config/platforms.ts` — Platform fee schedule from Spec §5.4
- `config/app.ts` — App-wide constants (limits, keys, schema version)

#### AI Layer (lib/)
- `lib/models.ts` — **FIX P1-02**: Replaces invalid `claude-sonnet-4-0` with `claude-sonnet-4-5-20251101` (primary) and `claude-haiku-3-5-20241022` (fallback). Model names are constants — never hard-coded elsewhere.
- `lib/api.ts` — **FIX P1-03**: Removed `dangerouslyAllowBrowser`. API key read at call-time from `expo-secure-store`. Includes `saveApiKey` (validates before saving), `revokeApiKey`, `validateApiKey`, `analyzeItem` with single-retry logic.
- `lib/prompts.ts` — System prompt matching Work Order §7 requirements: 3-comp formula, platform fee schedule, all 7 category schemas, confidence scoring rubric, listing optimization. Dynamic user prompt builder per category + protocol.
- `lib/compression.ts` — **FIX P1-04**: `expo-image-manipulator` integration. 1920px max (SLAB: 2048px), 85% JPEG quality.
- `lib/sku.ts` — SKU generation `[CATEGORY]-[YYMMDD]-[INDEX]`
- `lib/pricing.ts` — 3-comp weighted average formula, target/min price, net profit, ROI helpers
- `lib/storage.ts` — **FIX P1-09** (partial): AsyncStorage for inventory (too large for SecureStore), SecureStore for API key + behavioral flags. Decision documented in file header.
- `lib/validation/schemas.ts` — **FIX P1-06**: Zod schemas for all types. `validateAIResponse()` called before any AI response is stored.

#### State (store/)
- `store/inventory.ts` — Zustand inventory store with persist middleware (AsyncStorage)
- `store/session.ts` — Session/usage store with freemium gating, monthly reset logic
- `store/ui.ts` — **P1-08**: uiStore for toasts, global loading, modal tracking
- `store/intake.ts` — Ephemeral intake session state (not persisted)

#### Screens (app/)
- `app/_layout.tsx` — Root layout, dark theme, Expo Router stack
- `app/(tabs)/_layout.tsx` — Tab navigator: Home / Inventory / Analytics / Settings
- `app/(tabs)/index.tsx` — S-02: Home dashboard (vertical slice)
- `app/(tabs)/inventory.tsx` — S-11: Inventory list with category filter + search
- `app/(tabs)/analytics.tsx` — Analytics tab placeholder (P4-01 Phase 4)
- `app/(tabs)/settings.tsx` — S-13: API key management + app info
- `app/onboarding.tsx` — S-01: Multi-step onboarding (Steps 1, 2, 5 — full 5-step in P4-08)
- `app/intake/category.tsx` — S-03: Category select grid
- `app/intake/protocol.tsx` — S-04: QUICK-ADD vs CORE selection
- `app/intake/capture.tsx` — S-05: Photo capture with camera + gallery
- `app/intake/processing.tsx` — S-06: **FIX P3-04**: Real step labels from `AnalysisProgressStep`. Stub mode when no API key.
- `app/intake/result/[id].tsx` — S-07–10: Result tabs (ID / Pricing / Listings / Export)
- `app/item/[id].tsx` — S-12: Item detail view with status management

#### Config Files
- `package.json` — Dependencies aligned to Expo SDK 53 (latest stable)
- `app.json` — Expo config with iOS permissions, scheme, dark UI style
- `tsconfig.json` — Strict TypeScript with path alias `@/*`
- `tailwind.config.js` — NativeWind config with full design token colors
- `metro.config.js` — NativeWind v4 Metro wrapper
- `global.css` — Tailwind entry point
- `babel.config.js` — Expo preset + NativeWind + Reanimated plugin
- `.gitignore` — Standard Expo gitignore

#### Documentation
- `CHANGELOG.md` — This file
- `DEPENDENCIES.md` — Locked version manifest
- `README.md` — Setup and run instructions

---

### TODOs / Open Decisions

| # | Decision | Status | Location |
|---|----------|--------|----------|
| 1 | Fallback model — using Haiku 3.5. Confirm with client. | **OPEN** | `lib/models.ts` |
| 2 | Storage: SecureStore has 2KB limit; inventory uses AsyncStorage. | **DOCUMENTED** | `lib/storage.ts` |
| 3 | Spec lists SDK 55 but SDK 55 is not yet released; using SDK 53. | **DOCUMENTED** | `DEPENDENCIES.md` |
| 4 | Analytics screen full build is Phase 4 P4-01 | **DEFERRED** | `app/(tabs)/analytics.tsx` |
| 5 | Onboarding Steps 3 & 4 (category prefs + tutorial) deferred to P4-08 | **DEFERRED** | `app/onboarding.tsx` |
| 6 | Error boundaries (P1-05) — scaffolded TODO; component in `components/ErrorBoundary.tsx` | **TODO** | P1-05 |
| 7 | RevenueCat / Pro subscription — `isPro` flag in sessionStore is a stub; wire in Phase 5 | **TODO** | `store/session.ts` |
