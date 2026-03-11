import { create } from 'zustand';
import { Item, Category, ItemStatus, VelocityTier } from '../types/item';
import { useInventoryStore } from './inventory';

export type TimeRange = 'week' | 'month' | '30days' | '90days' | 'all';

export interface CategoryStats {
  category: Category;
  itemCount: number;
  soldCount: number;
  revenue: number;
  totalCost: number;
  avgSellPrice: number;
  avgProfitMargin: number;
  avgDaysToSell: number;
}

export interface TopItem {
  item: Item;
  metric: number; // profit, ROI, or days-to-sell
}

interface AnalyticsState {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;

  // Computed — call recompute() after inventory changes
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  netProfit: number;
  overallROI: number;
  itemsAddedToday: number;
  itemsListedToday: number;
  itemsSoldToday: number;
  revenueToday: number;

  statusCounts: Record<ItemStatus, number>;
  categoryCounts: Record<Category, number>;
  categoryStats: CategoryStats[];
  velocityDistribution: Record<VelocityTier, number>;
  platformDistribution: Record<string, number>;
  topByProfit: TopItem[];
  topByROI: TopItem[];

  recompute: () => void;
}

function isWithinRange(dateStr: string, range: TimeRange): boolean {
  if (range === 'all') return true;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  switch (range) {
    case 'week': return diffDays <= 7;
    case 'month': return diffDays <= 30;
    case '30days': return diffDays <= 30;
    case '90days': return diffDays <= 90;
    default: return true;
  }
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function daysBetween(a: string, b: string): number {
  return Math.abs(new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24);
}

const ALL_STATUSES: ItemStatus[] = ['Intake', 'Photo Queue', 'Research', 'Listed', 'Sold', 'Shipped'];
const ALL_CATEGORIES: Category[] = ['SLAB', 'RAW', 'SEAL', 'SHOE', 'APRL', 'ELEC', 'COLL'];
const ALL_VELOCITIES: VelocityTier[] = ['Fast Flip', 'Standard', 'Long Hold'];

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  timeRange: '30days',
  setTimeRange: (range) => {
    set({ timeRange: range });
    get().recompute();
  },

  totalRevenue: 0,
  totalCost: 0,
  grossProfit: 0,
  netProfit: 0,
  overallROI: 0,
  itemsAddedToday: 0,
  itemsListedToday: 0,
  itemsSoldToday: 0,
  revenueToday: 0,
  statusCounts: Object.fromEntries(ALL_STATUSES.map((s) => [s, 0])) as Record<ItemStatus, number>,
  categoryCounts: Object.fromEntries(ALL_CATEGORIES.map((c) => [c, 0])) as Record<Category, number>,
  categoryStats: [],
  velocityDistribution: Object.fromEntries(ALL_VELOCITIES.map((v) => [v, 0])) as Record<VelocityTier, number>,
  platformDistribution: {},
  topByProfit: [],
  topByROI: [],

  recompute: () => {
    const items = useInventoryStore.getState().items;
    const range = get().timeRange;
    const filtered = items.filter((i) => isWithinRange(i.createdAt, range));

    // Status and category counts (over all items, not range-filtered)
    const statusCounts = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0])) as Record<ItemStatus, number>;
    const categoryCounts = Object.fromEntries(ALL_CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
    for (const item of items) {
      statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    }

    // Today stats
    let itemsAddedToday = 0;
    let itemsListedToday = 0;
    let itemsSoldToday = 0;
    let revenueToday = 0;
    for (const item of items) {
      if (isToday(item.createdAt)) itemsAddedToday++;
      if (item.status === 'Listed' && isToday(item.updatedAt)) itemsListedToday++;
      if ((item.status === 'Sold' || item.status === 'Shipped') && item.saleDate && isToday(item.saleDate)) {
        itemsSoldToday++;
        revenueToday += item.salePrice ?? 0;
      }
    }

    // Revenue / profit over range
    const soldItems = filtered.filter((i) => i.status === 'Sold' || i.status === 'Shipped');
    let totalRevenue = 0;
    let totalCost = 0;
    let totalFees = 0;
    for (const item of soldItems) {
      totalRevenue += item.salePrice ?? 0;
      totalCost += item.purchasePrice;
      totalFees += item.platformFee ?? 0;
    }
    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalFees;
    const overallROI = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

    // Category stats
    const categoryStats: CategoryStats[] = ALL_CATEGORIES.map((cat) => {
      const catItems = filtered.filter((i) => i.category === cat);
      const catSold = catItems.filter((i) => i.status === 'Sold' || i.status === 'Shipped');
      const revenue = catSold.reduce((sum, i) => sum + (i.salePrice ?? 0), 0);
      const cost = catSold.reduce((sum, i) => sum + i.purchasePrice, 0);
      const avgSell = catSold.length > 0 ? revenue / catSold.length : 0;
      const avgMargin = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;
      const avgDays = catSold.length > 0
        ? catSold.reduce((sum, i) => sum + daysBetween(i.createdAt, i.saleDate ?? i.updatedAt), 0) / catSold.length
        : 0;

      return {
        category: cat,
        itemCount: catItems.length,
        soldCount: catSold.length,
        revenue: Math.round(revenue * 100) / 100,
        totalCost: Math.round(cost * 100) / 100,
        avgSellPrice: Math.round(avgSell * 100) / 100,
        avgProfitMargin: Math.round(avgMargin * 10) / 10,
        avgDaysToSell: Math.round(avgDays * 10) / 10,
      };
    });

    // Velocity distribution
    const velocityDistribution = Object.fromEntries(ALL_VELOCITIES.map((v) => [v, 0])) as Record<VelocityTier, number>;
    for (const item of filtered) {
      if (item.research?.velocityTier) {
        velocityDistribution[item.research.velocityTier] =
          (velocityDistribution[item.research.velocityTier] || 0) + 1;
      }
    }

    // Platform distribution
    const platformDistribution: Record<string, number> = {};
    for (const item of soldItems) {
      const plat = item.salePlatform ?? 'Unknown';
      platformDistribution[plat] = (platformDistribution[plat] || 0) + 1;
    }

    // Top by profit
    const topByProfit: TopItem[] = soldItems
      .filter((i) => i.netProfit !== undefined)
      .sort((a, b) => (b.netProfit ?? 0) - (a.netProfit ?? 0))
      .slice(0, 5)
      .map((item) => ({ item, metric: item.netProfit ?? 0 }));

    // Top by ROI
    const topByROI: TopItem[] = soldItems
      .filter((i) => i.roi !== undefined && i.purchasePrice > 0)
      .sort((a, b) => (b.roi ?? 0) - (a.roi ?? 0))
      .slice(0, 5)
      .map((item) => ({ item, metric: item.roi ?? 0 }));

    set({
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      overallROI: Math.round(overallROI * 10) / 10,
      itemsAddedToday,
      itemsListedToday,
      itemsSoldToday,
      revenueToday: Math.round(revenueToday * 100) / 100,
      statusCounts,
      categoryCounts,
      categoryStats,
      velocityDistribution,
      platformDistribution,
      topByProfit,
      topByROI,
    });
  },
}));
