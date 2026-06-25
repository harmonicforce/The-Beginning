/**
 * QualityScore.ts — Layer 1A
 * Computes final burger quality from tier, timing, and BotD ceiling.
 * Formula: tier_modifier × timing_execution_score × botd_ceiling_multiplier
 * Yips multiplier (0.65×) applied at output if active.
 */

import { IngredientTier, tierModifier } from '../entities/Ingredient';
import { YIPS } from '../config/tunables';

export function computeQuality(
  tier: IngredientTier,
  timingScore: number,         // 0.0–1.0 from HeatZoneBar
  botdCeiling: number,         // 1.0 (creativity) or 0.75 (safety)
  yipsActive: boolean,
): number {
  let q = tierModifier(tier) * timingScore * botdCeiling;
  if (yipsActive) q *= YIPS.qualityMultiplier;
  return Math.min(1.0, Math.max(0.0, q));
}
