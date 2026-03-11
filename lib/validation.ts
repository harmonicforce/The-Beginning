/**
 * Zod validation schemas for all AI API response types.
 *
 * Every response from Claude is validated through the appropriate schema
 * before being stored. On validation failure, a user-facing error is surfaced
 * with the option to retry or manually fill in fields.
 */

import { z } from 'zod';
import { Category, Protocol } from '../types/item';

// ─── Identification schemas per category ─────────────────────────────────────

const SlabIdentificationSchema = z.object({
  cardName: z.string().min(1),
  set: z.string().min(1),
  cardNumber: z.string(),
  game: z.string().min(1),
  gradingCompany: z.string().min(1),
  grade: z.string().min(1),
  certNumber: z.string(),
  slabCondition: z.string(),
  cardVariant: z.string().optional().nullable(),
});

const RawIdentificationSchema = z.object({
  cardName: z.string().min(1),
  set: z.string().min(1),
  cardNumber: z.string(),
  game: z.string().min(1),
  rarity: z.string(),
  quantity: z.coerce.number().int().min(1).default(1),
  condition: z.string().min(1),
  gradeCandidate: z.boolean().optional().nullable(),
});

const SealIdentificationSchema = z.object({
  productType: z.string().min(1),
  game: z.string().min(1),
  set: z.string().min(1),
  productName: z.string().min(1),
  language: z.string().default('English'),
  quantity: z.coerce.number().int().min(1).default(1),
  packagingCondition: z.string(),
});

const ShoeIdentificationSchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  colorway: z.string(),
  styleCode: z.string(),
  size: z.string().min(1),
  condition: z.string().min(1),
  boxIncluded: z.boolean(),
  boxCondition: z.string().optional().nullable(),
});

const AprlIdentificationSchema = z.object({
  brand: z.string().min(1),
  itemType: z.string().min(1),
  gender: z.string(),
  size: z.string().min(1),
  color: z.string(),
  material: z.string(),
  condition: z.string().min(1),
});

const ElecIdentificationSchema = z.object({
  brand: z.string().min(1),
  productType: z.string().min(1),
  modelNumber: z.string(),
  modelName: z.string().min(1),
  serialNumber: z.string().optional().nullable(),
  functionalStatus: z.string().min(1),
  physicalCondition: z.string().min(1),
  processor: z.string().optional().nullable(),
  ram: z.string().optional().nullable(),
  storage: z.string().optional().nullable(),
});

const CollIdentificationSchema = z.object({
  brand: z.string().min(1),
  productLine: z.string().min(1),
  characterName: z.string().min(1),
  series: z.string(),
  itemNumber: z.string().optional().nullable(),
  variant: z.string().optional().nullable(),
  retailerExclusive: z.string().optional().nullable(),
  condition: z.string().min(1),
  boxCondition: z.string().optional().nullable(),
});

const IDENTIFICATION_SCHEMAS: Record<Category, z.ZodObject<any>> = {
  SLAB: SlabIdentificationSchema,
  RAW: RawIdentificationSchema,
  SEAL: SealIdentificationSchema,
  SHOE: ShoeIdentificationSchema,
  APRL: AprlIdentificationSchema,
  ELEC: ElecIdentificationSchema,
  COLL: CollIdentificationSchema,
};

// ─── Comp / Research schemas ─────────────────────────────────────────────────

const CompSchema = z.object({
  price: z.coerce.number().min(0),
  source: z.string().min(1),
  date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const ResearchSchema = z.object({
  comp1: CompSchema,
  comp2: CompSchema,
  comp3: CompSchema,
  weightedAvg: z.coerce.number().min(0),
  targetSellPrice: z.coerce.number().min(0),
  minAcceptPrice: z.coerce.number().min(0),
  velocityTier: z.enum(['Fast Flip', 'Standard', 'Long Hold']),
  marketNotes: z.string(),
  popReport: z.string().optional().nullable(),
  gradingROI: z.string().optional().nullable(),
});

// ─── Listing schemas ─────────────────────────────────────────────────────────

const PlatformListingSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  price: z.coerce.number().min(0),
  category: z.string().optional().nullable(),
  shippingNote: z.string().optional().nullable(),
});

const ListingsSchema = z.object({
  ebay: PlatformListingSchema,
  facebook: PlatformListingSchema,
  tcgplayer: PlatformListingSchema.optional().nullable(),
  mercari: PlatformListingSchema,
});

// ─── Quick response schema ───────────────────────────────────────────────────

function buildQuickResponseSchema(category: Category) {
  return z.object({
    identification: IDENTIFICATION_SCHEMAS[category],
    confidence: z.coerce.number().int().min(0).max(100),
    confidenceNotes: z.string().optional().nullable(),
    displayName: z.string().optional().nullable(),
  });
}

// ─── Core response schema ────────────────────────────────────────────────────

function buildCoreResponseSchema(category: Category) {
  return z.object({
    identification: IDENTIFICATION_SCHEMAS[category],
    confidence: z.coerce.number().int().min(0).max(100),
    confidenceNotes: z.string().optional().nullable(),
    displayName: z.string().optional().nullable(),
    research: ResearchSchema,
    listings: ListingsSchema,
  });
}

// ─── Public validation function ──────────────────────────────────────────────

export interface ValidationResult {
  success: boolean;
  data?: Record<string, unknown>;
  errors?: string[];
}

/**
 * Validate an AI analysis response against the appropriate Zod schema.
 * Returns validated data on success, or a list of human-readable error messages on failure.
 */
export function validateAnalysisResponse(
  data: unknown,
  category: Category,
  protocol: Protocol
): ValidationResult {
  const schema = protocol === 'quick'
    ? buildQuickResponseSchema(category)
    : buildCoreResponseSchema(category);

  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data as Record<string, unknown> };
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.join('.');
    return `${path}: ${issue.message}`;
  });

  return { success: false, errors };
}

// Re-export individual schemas for use in other validation contexts
export {
  CompSchema,
  ResearchSchema,
  PlatformListingSchema,
  ListingsSchema,
  IDENTIFICATION_SCHEMAS,
};
