import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category, Protocol } from '../types/item';

const SETTINGS_KEY = 'rbo_settings_v2';

export interface PlatformFeeConfig {
  ebay: number;
  facebook: number;
  tcgplayer: number;
  mercari: number;
  stockx: number;
  goat: number;
}

interface SettingsState {
  // Default protocols per category
  defaultProtocols: Record<Category, Protocol>;
  setDefaultProtocol: (category: Category, protocol: Protocol) => void;

  // Platform fees (editable)
  platformFees: PlatformFeeConfig;
  setPlatformFee: (platform: keyof PlatformFeeConfig, fee: number) => void;

  // Storage location defaults per category
  storageDefaults: Record<Category, string>;
  setStorageDefault: (category: Category, location: string) => void;

  // Persistence
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

const DEFAULT_PROTOCOLS: Record<Category, Protocol> = {
  SLAB: 'core',
  RAW: 'core',
  SEAL: 'core',
  SHOE: 'core',
  APRL: 'quick',
  ELEC: 'core',
  COLL: 'quick',
};

const DEFAULT_FEES: PlatformFeeConfig = {
  ebay: 13.25,
  facebook: 5,
  tcgplayer: 12.5,
  mercari: 10,
  stockx: 10,
  goat: 9.5,
};

const DEFAULT_STORAGE: Record<Category, string> = {
  SLAB: '',
  RAW: '',
  SEAL: '',
  SHOE: '',
  APRL: '',
  ELEC: '',
  COLL: '',
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  defaultProtocols: { ...DEFAULT_PROTOCOLS },
  platformFees: { ...DEFAULT_FEES },
  storageDefaults: { ...DEFAULT_STORAGE },

  setDefaultProtocol: (category, protocol) => {
    set((state) => ({
      defaultProtocols: { ...state.defaultProtocols, [category]: protocol },
    }));
    get().saveSettings();
  },

  setPlatformFee: (platform, fee) => {
    set((state) => ({
      platformFees: { ...state.platformFees, [platform]: fee },
    }));
    get().saveSettings();
  },

  setStorageDefault: (category, location) => {
    set((state) => ({
      storageDefaults: { ...state.storageDefaults, [category]: location },
    }));
    get().saveSettings();
  },

  loadSettings: async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        set({
          defaultProtocols: { ...DEFAULT_PROTOCOLS, ...data.defaultProtocols },
          platformFees: { ...DEFAULT_FEES, ...data.platformFees },
          storageDefaults: { ...DEFAULT_STORAGE, ...data.storageDefaults },
        });
      }
    } catch {
      // Use defaults on error
    }
  },

  saveSettings: async () => {
    const { defaultProtocols, platformFees, storageDefaults } = get();
    await AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ defaultProtocols, platformFees, storageDefaults })
    );
  },
}));
