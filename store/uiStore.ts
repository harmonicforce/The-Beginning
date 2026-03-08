import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface UIState {
  // Modals
  activeModal: string | null;
  openModal: (id: string) => void;
  closeModal: () => void;

  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
  dismissToast: (id: string) => void;

  // Loading
  loadingStates: Record<string, boolean>;
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;

  // Onboarding
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;

  // View preferences
  inventoryViewMode: 'list' | 'grid';
  setInventoryViewMode: (mode: 'list' | 'grid') => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Modals
  activeModal: null,
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),

  // Toasts
  toasts: [],
  showToast: (message, type = 'info', duration = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const toast: Toast = { id, message, type, duration };
    set((state) => ({ toasts: [...state.toasts, toast] }));
    if (duration > 0) {
      setTimeout(() => get().dismissToast(id), duration);
    }
  },
  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  // Loading
  loadingStates: {},
  setLoading: (key, loading) => {
    set((state) => ({
      loadingStates: { ...state.loadingStates, [key]: loading },
    }));
  },
  isLoading: (key) => get().loadingStates[key] ?? false,

  // Onboarding
  onboardingStep: 0,
  setOnboardingStep: (step) => set({ onboardingStep: step }),

  // View preferences
  inventoryViewMode: 'list',
  setInventoryViewMode: (mode) => set({ inventoryViewMode: mode }),
}));
