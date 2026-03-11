# Reseller Brain OS — Photo Intake Engine

**v1.0 MVP** · React Native + Expo · Claude AI (Sonnet 4)

Photo → AI Analysis → Inventory Record + Listings in under 60 seconds.

## Quick Start

```bash
npm install
npx expo start
```

## Setup

1. Get an Anthropic API key at [console.anthropic.com](https://console.anthropic.com)
2. Open the app → Settings → enter your API key
3. Tap **New Item Intake** → select category → take photos → analyze

## Architecture

- **Framework**: React Native + Expo SDK 52
- **Navigation**: Expo Router (file-based)
- **State**: Zustand stores (`store/inventory.ts`, `store/session.ts`)
- **AI**: Anthropic Claude Sonnet 4 via `@anthropic-ai/sdk`
- **Storage**: AsyncStorage (items) + SecureStore (API key)
- **Styling**: NativeWind (Tailwind CSS for React Native)

## Project Structure

```
app/
  (tabs)/         # Home, Inventory, Settings tabs
  intake/         # Category → Protocol → Capture → Processing → Result
  item/[id].tsx   # Item detail & edit
  account.tsx     # Subscription management
components/       # Shared UI components
lib/              # API, prompts, storage, SKU, pricing utilities
store/            # Zustand state stores
types/            # TypeScript types (Item, Category, etc.)
constants/        # Category config, platform fee schedule
```

## Categories

| Code | Name | Icon |
|------|------|------|
| SLAB | Graded Cards | 🃏 |
| RAW | Raw Cards | 🎴 |
| SEAL | Sealed Product | 📦 |
| SHOE | Sneakers | 👟 |
| APRL | Apparel | 👕 |
| ELEC | Electronics | 💻 |
| COLL | Collectibles | 🏆 |

## Pricing Formula (CORE mode)

```
Weighted Avg = (Comp1 × 0.50) + (Comp2 × 0.25) + (Comp3 × 0.25)
Target Price  = Weighted Avg × 1.07
Min Accept    = Weighted Avg × 0.87
```

## Platform Fees

| Platform | Fee |
|----------|-----|
| eBay | 13% |
| Mercari | 13% |
| TCGPlayer | 12.5% |
| Facebook MP | 5% |
| StockX | 10% |
| GOAT | 9.5% |