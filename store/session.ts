import { create } from 'zustand';
import * as Storage from '../lib/storage';
import { Category, Protocol } from '../types/item';

interface IntakeSession {
  category: Category | null;
  protocol: Protocol | null;
  photoUris: string[];
  pendingItemId: string | null;
}

interface SessionState {
  // Usage
  monthlyCount: number;
  isPro: boolean;
  apiKey: string | null;
  isOnboarded: boolean;

  // Active intake session
  intake: IntakeSession;

  // Actions
  loadSession: () => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  clearApiKey: () => Promise<void>;
  setIsPro: (isPro: boolean) => void;
  incrementMonthlyCount: () => Promise<void>;
  setOnboarded: () => Promise<void>;

  // Intake session management
  startIntake: (category: Category, protocol: Protocol) => void;
  setPhotos: (uris: string[]) => void;
  setPendingItemId: (id: string) => void;
  resetIntake: () => void;
}

const EMPTY_INTAKE: IntakeSession = {
  category: null,
  protocol: null,
  photoUris: [],
  pendingItemId: null,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  monthlyCount: 0,
  isPro: false,
  apiKey: null,
  isOnboarded: false,
  intake: { ...EMPTY_INTAKE },

  loadSession: async () => {
    const [apiKey, monthlyCount, onboarded, prefs] = await Promise.all([
      Storage.getApiKey(),
      Storage.getMonthlyCount(),
      Storage.isOnboarded(),
      Storage.getPreferences(),
    ]);
    set({
      apiKey,
      monthlyCount,
      isOnboarded: onboarded,
      isPro: prefs.isPro,
    });
  },

  setApiKey: async (key: string) => {
    await Storage.saveApiKey(key);
    set({ apiKey: key });
  },

  clearApiKey: async () => {
    await Storage.deleteApiKey();
    set({ apiKey: null });
  },

  setIsPro: (isPro: boolean) => {
    Storage.savePreferences({ isPro });
    set({ isPro });
  },

  incrementMonthlyCount: async () => {
    const next = await Storage.incrementMonthlyCount();
    set({ monthlyCount: next });
  },

  setOnboarded: async () => {
    await Storage.setOnboarded();
    set({ isOnboarded: true });
  },

  startIntake: (category: Category, protocol: Protocol) => {
    set({ intake: { ...EMPTY_INTAKE, category, protocol } });
  },

  setPhotos: (uris: string[]) => {
    set((state) => ({ intake: { ...state.intake, photoUris: uris } }));
  },

  setPendingItemId: (id: string) => {
    set((state) => ({ intake: { ...state.intake, pendingItemId: id } }));
  },

  resetIntake: () => {
    set({ intake: { ...EMPTY_INTAKE } });
  },
}));

// Free tier check
export function canAddItem(monthlyCount: number, isPro: boolean): boolean {
  if (isPro) return true;
  return monthlyCount < 10;
}

export function itemsRemaining(monthlyCount: number, isPro: boolean): number {
  if (isPro) return Infinity;
  return Math.max(0, 10 - monthlyCount);
}
