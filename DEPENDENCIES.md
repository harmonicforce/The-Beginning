# The Beginning — Dependencies

## Core Framework
| Package | Version | Purpose |
|---|---|---|
| expo | ~55.0.0 | Managed workflow framework |
| react | 19.0.0 | UI library |
| react-native | 0.79.2 | Mobile runtime |
| expo-router | ~5.1.0 | File-based routing |
| typescript | ~5.8.3 | Type system |

## UI & Styling
| Package | Version | Purpose |
|---|---|---|
| nativewind | ^4.1.23 | Tailwind CSS for React Native |
| tailwindcss | 3.4.17 | CSS utility framework |
| @expo/vector-icons | included | Ionicons and other icon sets |
| react-native-svg | 15.11.2 | SVG rendering for charts |

## State Management
| Package | Version | Purpose |
|---|---|---|
| zustand | ^5.0.3 | Lightweight state management |

## Data & Storage
| Package | Version | Purpose |
|---|---|---|
| @react-native-async-storage/async-storage | 2.1.2 | Persistent local storage |
| expo-secure-store | ~14.2.3 | Encrypted storage for API keys |

## AI & API
| Package | Version | Purpose |
|---|---|---|
| @anthropic-ai/sdk | ^0.39.0 | Anthropic Claude API client |
| zod | ^3.24.4 | Runtime validation of AI responses |

## Camera & Media
| Package | Version | Purpose |
|---|---|---|
| expo-camera | ~16.1.6 | Camera + barcode scanning (CameraView API) |
| expo-image-picker | ~16.1.4 | Photo library access |
| expo-image-manipulator | ~13.1.4 | Image compression before API calls |
| expo-image | ~2.3.0 | High-performance image component |
| expo-file-system | ~18.1.8 | File system access for images |

## Performance
| Package | Version | Purpose |
|---|---|---|
| @shopify/flash-list | ^1.7.5 | High-performance list for 1000+ items |

## UX & Feedback
| Package | Version | Purpose |
|---|---|---|
| expo-haptics | ~14.1.4 | Haptic feedback on actions |
| expo-linking | ~7.1.5 | Deep linking |
| expo-sharing | ~13.1.4 | Share sheet for CSV/JSON export |
| expo-status-bar | ~2.2.3 | Status bar configuration |

## Navigation
| Package | Version | Purpose |
|---|---|---|
| react-native-screens | ~4.10.0 | Native screen containers |
| react-native-safe-area-context | 5.4.0 | Safe area insets |
| react-native-gesture-handler | ~2.24.0 | Gesture handling for sheets/swipes |

## Development
| Package | Version | Purpose |
|---|---|---|
| @babel/core | ^7.25.2 | Babel transpiler |
| metro-config | included | Metro bundler config |
| babel-plugin-module-resolver | for path aliases |

## Architecture Notes

### Why not Expo Go?
SDK 55 with prebuild + Xcode development builds. This enables native modules (expo-camera, expo-haptics) and better performance.

### Why Zustand over Redux?
Minimal boilerplate, TypeScript-first, tiny bundle size (~1KB). Perfect for a focused app with 5 stores.

### Why FlashList over FlatList?
FlashList uses recycling (like UITableView) for 5-10x better performance on lists with 1000+ items.

### Why expo-camera instead of expo-barcode-scanner?
expo-barcode-scanner is deprecated in SDK 55. expo-camera's CameraView API includes built-in barcode scanning.

### Why Zod for validation?
AI responses are unpredictable. Zod validates the JSON structure at runtime before storing, preventing crashes from malformed data.

### Image Compression Pipeline
Photos are compressed to max 1920px (2048px for SLAB) at 85% JPEG quality before sending to Claude API. This reduces API costs and upload time without sacrificing identification accuracy.

### Security Model
- API key stored in expo-secure-store (encrypted on-device)
- `dangerouslyAllowBrowser` is NOT used — React Native is not a browser
- No data transmitted to any server except Anthropic's API
- Photos processed locally, sent only as base64 to Claude
