/**
 * Ingredient.ts — Layer 1A
 * Ingredient tier enum and inventory tracking.
 */

import { INGREDIENT_TIERS } from '../config/tunables';

export enum IngredientTier {
  COMMON = 'COMMON',
  RARE = 'RARE',
  LEGENDARY = 'LEGENDARY',
}

export function tierModifier(tier: IngredientTier): number {
  return INGREDIENT_TIERS[tier].baseQualityModifier;
}

export function tierCost(tier: IngredientTier): number {
  return INGREDIENT_TIERS[tier].cost;
}

export interface IngredientInventory {
  COMMON: number;
  RARE: number;
  LEGENDARY: number;
}

export function startingInventory(): IngredientInventory {
  return {
    COMMON: INGREDIENT_TIERS.COMMON.startingStock as number,
    RARE: INGREDIENT_TIERS.RARE.startingStock as number,
    LEGENDARY: INGREDIENT_TIERS.LEGENDARY.startingStock as number,
  };
}

export function consume(inv: IngredientInventory, tier: IngredientTier): boolean {
  if (tier === IngredientTier.COMMON) return true; // unlimited
  if (inv[tier] <= 0) return false;
  inv[tier]--;
  return true;
}

export function hasStock(inv: IngredientInventory, tier: IngredientTier): boolean {
  if (tier === IngredientTier.COMMON) return true;
  return inv[tier] > 0;
}
