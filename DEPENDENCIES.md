# DEPENDENCIES — The Beginning
> Locked version manifest. Per Work Order P5-06.
> **Important:** Spec calls for SDK 55, but SDK 55 is not yet released as of March 2026.
> This manifest targets **Expo SDK 53** (latest stable). Update when SDK 55 ships.
> Run `npx expo-doctor` after any version change.

---

## Core Framework

| Package | Version | Notes |
|---------|---------|-------|
| `expo` | `~53.0.0` | Managed workflow. Update to 55 when released. |
| `react` | `18.3.2` | Required by Expo 53 |
| `react-native` | `0.76.9` | Bundled with Expo 53 |
| `expo-router` | `~4.0.0` | File-based navigation |
| `typescript` | `^5.3.3` | Strict mode enabled |

## Navigation & Gestures

| Package | Version | Notes |
|---------|---------|-------|
| `react-native-screens` | `~4.4.0` | Native screen containers |
| `react-native-safe-area-context` | `4.12.0` | Safe area insets |
| `react-native-gesture-handler` | `~2.20.2` | Swipe gestures |
| `react-native-reanimated` | `~3.16.7` | Animations. **Pin to exact SDK peer version.** |

## State & Validation

| Package | Version | Notes |
|---------|---------|-------|
| `zustand` | `^5.0.3` | Global stores with persist middleware |
| `zod` | `^3.23.8` | AI response validation schemas |
| `@react-native-async-storage/async-storage` | `1.23.1` | Inventory persistence |

## Styling

| Package | Version | Notes |
|---------|---------|-------|
| `nativewind` | `^4.1.23` | Tailwind for React Native |
| `tailwindcss` | `^3.4.17` | Peer dep of NativeWind |

## Expo Modules

| Package | Version | Notes |
|---------|---------|-------|
| `expo-camera` | `~16.0.18` | Camera viewfinder (Phase 3 full impl) |
| `expo-image-picker` | `~16.0.6` | Photo library access |
| `expo-image-manipulator` | `~13.0.7` | **P1-04**: Image compression before API |
| `expo-file-system` | `~18.0.11` | Photo file storage |
| `expo-secure-store` | `~14.0.1` | **P1-03**: API key encryption |
| `expo-haptics` | `~14.0.1` | Haptic feedback on primary actions |
| `expo-splash-screen` | `~0.29.22` | Splash screen |
| `expo-status-bar` | `~2.0.1` | Status bar styling |
| `expo-crypto` | `~14.0.2` | UUID generation |
| `expo-av` | `~15.0.2` | Reserved for future audio features |

## UI & Performance

| Package | Version | Notes |
|---------|---------|-------|
| `@expo/vector-icons` | `^14.0.4` | Ionicons for tab bar |
| `@shopify/flash-list` | `1.7.3` | **P2-02**: High-perf list (replaces FlatList) |
| `react-native-svg` | `15.8.0` | SVG support for charts |
| `victory-native` | `^41.17.4` | Analytics charts (Phase 4) |

## Monetization (Phase 5)

| Package | Version | Notes |
|---------|---------|-------|
| `react-native-purchases` | TBD | RevenueCat SDK. Add in Phase 5. |

---

## Running `expo-doctor`

```bash
npx expo-doctor
```
Expected output: All ✅ after dependency alignment. If you see mismatched peer warnings, run:
```bash
npx expo install --fix
```

## Clean iOS Build

```bash
npx expo prebuild --clean
cd ios && pod install
open ios/TheBeginning.xcworkspace
```
Build in Xcode 15.2+. Target minimum iOS 16.0.
