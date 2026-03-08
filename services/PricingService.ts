/**
 * Pricing service — fee calculations and profit projections.
 */

import { useSettingsStore } from '../store/settingsStore';

export type PlatformId = 'ebay' | 'facebook' | 'tcgplayer' | 'mercari' | 'stockx' | 'goat';

/** Get fee percentage for a platform from settings store. */
export function getPlatformFee(platformId: string): number {
  const fees = useSettingsStore.getState().platformFees;
  return (fees as Record<string, number>)[platformId] ?? 13;
}

/** Calculate platform fee amount from sale price. */
export function calculateFeeAmount(salePrice: number, platformId: string): number {
  const feePercent = getPlatformFee(platformId);
  return Math.round(salePrice * (feePercent / 100) * 100) / 100;
}

/** Calculate net profit: sale - cost - fees - shipping. */
export function calculateNetProfit(
  salePrice: number,
  purchasePrice: number,
  platformId: string,
  shippingCost: number = 0
): number {
  const fee = calculateFeeAmount(salePrice, platformId);
  return Math.round((salePrice - purchasePrice - fee - shippingCost) * 100) / 100;
}

/** Calculate ROI percentage. */
export function calculateROI(netProfit: number, purchasePrice: number): number {
  if (purchasePrice <= 0) return 0;
  return Math.round((netProfit / purchasePrice) * 1000) / 10;
}

/** Estimate shipping cost by category (rough defaults). */
export function estimateShipping(category: string): number {
  const estimates: Record<string, number> = {
    SLAB: 5.0,
    RAW: 1.5,
    SEAL: 8.0,
    SHOE: 14.0,
    APRL: 7.0,
    ELEC: 12.0,
    COLL: 9.0,
  };
  return estimates[category] ?? 8.0;
}

/** Project net profit for a target sell price. */
export function projectProfit(
  targetPrice: number,
  purchasePrice: number,
  platformId: string,
  category: string
): {
  salePrice: number;
  fee: number;
  shipping: number;
  netProfit: number;
  roi: number;
} {
  const fee = calculateFeeAmount(targetPrice, platformId);
  const shipping = estimateShipping(category);
  const netProfit = Math.round((targetPrice - purchasePrice - fee - shipping) * 100) / 100;
  const roi = calculateROI(netProfit, purchasePrice);
  return { salePrice: targetPrice, fee, shipping, netProfit, roi };
}
