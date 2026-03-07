import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Item } from '../types/item';

const KEYS = {
  ITEMS: 'rbo_items',
  SESSION_COUNT: 'rbo_session_count',
  MONTHLY_COUNT: 'rbo_monthly_count',
  MONTHLY_RESET: 'rbo_monthly_reset',
  PREFERENCES: 'rbo_preferences',
  API_KEY: 'rbo_api_key',
  ONBOARDED: 'rbo_onboarded',
} as const;

// ─── API Key (SecureStore) ────────────────────────────────────────────────────

export async function saveApiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.API_KEY, key);
}

export async function getApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.API_KEY);
}

export async function deleteApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.API_KEY);
}

// ─── Items ────────────────────────────────────────────────────────────────────

export async function getAllItems(): Promise<Item[]> {
  const raw = await AsyncStorage.getItem(KEYS.ITEMS);
  if (!raw) return [];
  return JSON.parse(raw) as Item[];
}

export async function getItem(id: string): Promise<Item | null> {
  const items = await getAllItems();
  return items.find((i) => i.id === id) ?? null;
}

export async function saveItem(item: Item): Promise<void> {
  const items = await getAllItems();
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    items[idx] = { ...item, updatedAt: new Date().toISOString() };
  } else {
    items.unshift(item);
  }
  await AsyncStorage.setItem(KEYS.ITEMS, JSON.stringify(items));
}

export async function deleteItem(id: string): Promise<void> {
  const items = await getAllItems();
  await AsyncStorage.setItem(KEYS.ITEMS, JSON.stringify(items.filter((i) => i.id !== id)));
}

// ─── Monthly usage counter ────────────────────────────────────────────────────

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}`;
}

export async function getMonthlyCount(): Promise<number> {
  const resetKey = await AsyncStorage.getItem(KEYS.MONTHLY_RESET);
  const monthKey = currentMonthKey();
  if (resetKey !== monthKey) {
    await AsyncStorage.setItem(KEYS.MONTHLY_COUNT, '0');
    await AsyncStorage.setItem(KEYS.MONTHLY_RESET, monthKey);
    return 0;
  }
  const raw = await AsyncStorage.getItem(KEYS.MONTHLY_COUNT);
  return raw ? parseInt(raw, 10) : 0;
}

export async function incrementMonthlyCount(): Promise<number> {
  const current = await getMonthlyCount();
  const next = current + 1;
  await AsyncStorage.setItem(KEYS.MONTHLY_COUNT, String(next));
  return next;
}

// ─── Session item counter (for SKU index) ────────────────────────────────────

export async function getSessionCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(KEYS.SESSION_COUNT);
  return raw ? parseInt(raw, 10) : 0;
}

export async function incrementSessionCount(): Promise<number> {
  const current = await getSessionCount();
  const next = current + 1;
  await AsyncStorage.setItem(KEYS.SESSION_COUNT, String(next));
  return next;
}

// ─── Preferences ─────────────────────────────────────────────────────────────

export interface Preferences {
  defaultProtocol: 'quick' | 'core';
  theme: 'dark' | 'light';
  isPro: boolean;
}

const DEFAULT_PREFERENCES: Preferences = {
  defaultProtocol: 'core',
  theme: 'dark',
  isPro: false,
};

export async function getPreferences(): Promise<Preferences> {
  const raw = await AsyncStorage.getItem(KEYS.PREFERENCES);
  if (!raw) return DEFAULT_PREFERENCES;
  return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
}

export async function savePreferences(prefs: Partial<Preferences>): Promise<void> {
  const current = await getPreferences();
  await AsyncStorage.setItem(KEYS.PREFERENCES, JSON.stringify({ ...current, ...prefs }));
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export async function isOnboarded(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.ONBOARDED);
  return val === 'true';
}

export async function setOnboarded(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDED, 'true');
}

// ─── Inventory row (paste-ready) ──────────────────────────────────────────────

export function buildInventoryRow(item: Item): string {
  const id = item.identification as Record<string, unknown>;
  const name =
    (id.cardName as string) ||
    (id.productName as string) ||
    (id.model as string) ||
    (id.characterName as string) ||
    (id.itemType as string) ||
    (id.modelName as string) ||
    'Unknown';

  const cols = [
    item.sku,
    item.category,
    name,
    item.purchaseDate,
    item.purchasePrice,
    item.purchaseSource,
    item.storageLocation,
    item.research?.targetSellPrice ?? '',
    item.research?.minAcceptPrice ?? '',
    item.research?.weightedAvg ?? '',
    item.research?.velocityTier ?? '',
    item.status,
    item.confidence,
    item.protocol.toUpperCase(),
  ];

  return cols.join('\t');
}
