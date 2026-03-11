import { create } from 'zustand';
import { Item, Category, ItemStatus } from '../types/item';
import * as Storage from '../lib/storage';

interface InventoryState {
  items: Item[];
  isLoading: boolean;
  // Actions
  loadItems: () => Promise<void>;
  addItem: (item: Item) => Promise<void>;
  updateItem: (item: Item) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getItemById: (id: string) => Item | undefined;
  // Filters
  getItemsByCategory: (category: Category) => Item[];
  getItemsByStatus: (status: ItemStatus) => Item[];
  clearAll: () => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  isLoading: false,

  loadItems: async () => {
    set({ isLoading: true });
    const items = await Storage.getAllItems();
    set({ items, isLoading: false });
  },

  addItem: async (item: Item) => {
    await Storage.saveItem(item);
    set((state) => ({ items: [item, ...state.items] }));
  },

  updateItem: async (item: Item) => {
    const updated = { ...item, updatedAt: new Date().toISOString() };
    await Storage.saveItem(updated);
    set((state) => ({
      items: state.items.map((i) => (i.id === item.id ? updated : i)),
    }));
  },

  deleteItem: async (id: string) => {
    await Storage.deleteItem(id);
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
  },

  getItemById: (id: string) => get().items.find((i) => i.id === id),

  getItemsByCategory: (category: Category) =>
    get().items.filter((i) => i.category === category),

  getItemsByStatus: (status: ItemStatus) =>
    get().items.filter((i) => i.status === status),

  clearAll: async () => {
    const items = get().items;
    for (const item of items) {
      await Storage.deleteItem(item.id);
    }
    set({ items: [] });
  },
}));
