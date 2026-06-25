/**
 * SaveSchema.ts — Layer 0
 * Type definitions for what WOULD persist across sessions.
 * MVP does not write to disk — this is a structural stub.
 */

export interface RecipeEntry {
  id: string;
  name: string;
  ingredientTier: 'COMMON' | 'RARE' | 'LEGENDARY';
  discovered: boolean;
  sold: boolean;
}

export interface RegularRelationship {
  characterId: string;
  score: number; // 0.0 – 1.0
  burned: boolean;
}

export interface SaveSchema {
  schemaVersion: '1.0';
  recipeBook: RecipeEntry[];
  regularRelationships: RegularRelationship[];
  fischeoderEscalationTier: number;
  belcherRatingHistory: number[];
  neighborhoodState: Record<string, unknown>; // future
}

export const EMPTY_SAVE: SaveSchema = {
  schemaVersion: '1.0',
  recipeBook: [],
  regularRelationships: [
    { characterId: 'teddy', score: 0.5, burned: false },
  ],
  fischeoderEscalationTier: 0,
  belcherRatingHistory: [],
  neighborhoodState: {},
};
