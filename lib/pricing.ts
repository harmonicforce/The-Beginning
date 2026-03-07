import { Comp, Research, VelocityTier } from '../types/item';

export function calculateWeightedAvg(comp1: number, comp2: number, comp3: number): number {
  return comp1 * 0.5 + comp2 * 0.25 + comp3 * 0.25;
}

export function calculateTargetSellPrice(weightedAvg: number): number {
  return Math.round(weightedAvg * 1.07 * 100) / 100;
}

export function calculateMinAcceptPrice(weightedAvg: number): number {
  return Math.round(weightedAvg * 0.87 * 100) / 100;
}

export function buildResearch(
  comp1: Comp,
  comp2: Comp,
  comp3: Comp,
  velocityTier: VelocityTier,
  marketNotes: string,
  popReport?: string,
  gradingROI?: string
): Research {
  const weightedAvg = calculateWeightedAvg(comp1.price, comp2.price, comp3.price);
  return {
    comp1,
    comp2,
    comp3,
    weightedAvg: Math.round(weightedAvg * 100) / 100,
    targetSellPrice: calculateTargetSellPrice(weightedAvg),
    minAcceptPrice: calculateMinAcceptPrice(weightedAvg),
    velocityTier,
    marketNotes,
    popReport,
    gradingROI,
  };
}

export function calculateNetProfit(
  salePrice: number,
  purchasePrice: number,
  platformFeePercent: number
): number {
  const platformFee = salePrice * (platformFeePercent / 100);
  return Math.round((salePrice - purchasePrice - platformFee) * 100) / 100;
}

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
