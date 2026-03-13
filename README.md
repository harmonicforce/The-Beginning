# The Beginning — Reseller Intelligence Platform
**Russell Vault LLC** · iOS (primary) · React Native + Expo

Photo → AI analysis → inventory record + platform-ready listings in under 60 seconds.

---

## Quick Start

### Prerequisites
- Node.js 20+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Yarn or npm
- Xcode 15.2+ (for iOS build)
- An [Anthropic API key](https://console.anthropic.com)

### Install & Run

```bash
# Clone the repo
git clone https://github.com/harmonicforce/The-Beginning.git
cd The-Beginning

# Install dependencies
yarn install
# or: npm install

# Start Expo dev server
yarn start

# Run on iOS simulator
yarn ios

# Run on Android
yarn android
```

### First Launch
On first launch the onboarding flow will appear. Enter your Anthropic API key when prompted — it's stored securely in device keychain via `expo-secure-store`. You can also skip and add it later under **Settings → API Key**.

Without an API key, the app runs in **stub mode** — all intake flows work with mock AI responses so you can explore the UI.

### Environment Variables
No `.env` file is needed. The API key is entered in-app and stored in SecureStore. Never commit your API key anywhere.

---

## Project Structure

```
the-beginning/
├── app/                    # Expo Router screens
│   ├── (tabs)/             # Tab navigator (Home, Inventory, Analytics, Settings)
│   ├── intake/             # Intake flow (category → protocol → capture → processing → result)
│   └── item/[id].tsx       # Item detail
├── components/             # Shared UI components (TODO: Phase 2)
├── config/                 # App constants, platform fees
├── hooks/                  # Custom React hooks (TODO: Phase 2)
├── lib/                    # Core logic
│   ├── api.ts              # Anthropic API wrapper (secure, no dangerouslyAllowBrowser)
│   ├── models.ts           # Model name constants
│   ├── prompts.ts          # System + user prompt builders
│   ├── compression.ts      # Image resize before API submission
│   ├── pricing.ts          # 3-comp weighted average calculations
│   ├── storage.ts          # AsyncStorage + SecureStore helpers
│   ├── sku.ts              # SKU generation
│   ├── stubs.ts            # Mock AI responses for dev mode
│   └── validation/         # Zod schemas for all AI response types
├── services/               # Business logic services (TODO: Phase 2)
├── store/                  # Zustand stores
│   ├── inventory.ts        # All item records
│   ├── session.ts          # Usage tracking + freemium gating
│   ├── ui.ts               # Toasts, modals, loading states
│   └── intake.ts           # Ephemeral intake session state
├── types/                  # TypeScript types
│   ├── item.ts             # Full item schema + all sub-types
│   └── categories.ts       # Category config + photo slot data
├── CHANGELOG.md            # All changes and decisions
└── DEPENDENCIES.md         # Locked version manifest
```

---

## 7 Categories

| Code | Name | Examples |
|------|------|---------|
| `SLAB` | Graded Cards | PSA/BGS/CGC graded Pokémon, sports cards |
| `RAW` | Raw Singles | Ungraded trading cards |
| `SEAL` | Sealed Product | Booster boxes, ETBs, blister packs |
| `SHOE` | Sneakers | Nike, Jordan, Yeezy, New Balance |
| `APRL` | Apparel | Supreme, Nike, Off-White, vintage |
| `ELEC` | Electronics | MacBooks, iPhones, consoles, cameras |
| `COLL` | Collectibles | Funko Pop, LEGO, Hot Wheels, figures |

---

## Development Phases

| Phase | Weeks | Status | Key Work |
|-------|-------|--------|---------|
| 1 | 1–2 | 🟡 In Progress | Critical fixes, architecture, AI layer |
| 2 | 3–5 | ⬜ Pending | Home dashboard, inventory screen rebuild, item detail |
| 3 | 6–7 | ⬜ Pending | Camera enhancements, result screen polish |
| 4 | 8–10 | ⬜ Pending | Analytics, barcode scanner, sales flow, settings |
| 5 | 11–12 | ⬜ Pending | RevenueCat, App Store prep |
| 6 | 14–16 | ⬜ Pending | Polish + TestFlight + submission |

---

## Security Notes
- API key is **never** bundled into the app binary
- API key is stored in `expo-secure-store` (device keychain / Android Keystore)
- Photos stored locally only — not uploaded to any cloud service
- No analytics or tracking without explicit opt-in

---

*Russell Vault LLC · Confidential*
