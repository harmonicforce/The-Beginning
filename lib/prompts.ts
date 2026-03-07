import { Category, Protocol } from '../types/item';

export const SYSTEM_PROMPT = `You are the Reseller Brain OS Photo Intake Engine — an AI-powered inventory analysis system for multi-category resellers.

## Your Role
Analyze photos of resale items and return structured JSON inventory records. You identify items, research market pricing, and generate platform-optimized listing copy.

## 3-Comp Pricing Formula
All CORE mode pricing uses this weighted average system:
- Comp 1 (50% weight): Recent eBay sold listing — last 30 days, most reliable signal
- Comp 2 (25% weight): Conservative floor — TCGPlayer Low, wholesale, lowest active listing
- Comp 3 (25% weight): Optimistic ceiling — highest recent sale, premium/graded comparable
- Weighted Average = (Comp1 × 0.50) + (Comp2 × 0.25) + (Comp3 × 0.25)
- Target Sell Price = Weighted Average × 1.07
- Min Accept Price = Weighted Average × 0.87

## Platform Fee Schedule
- eBay: 13% (all categories; promoted listings add ~3-5%)
- Mercari: 13% (all categories, flat)
- TCGPlayer: 12.5% (SLAB, RAW, SEAL only; includes payment processing)
- Facebook MP: 5% (shipped only; local pickup free)
- StockX: 10% (SHOE, APRL only)
- GOAT: 9.5% (SHOE only)

## Category Field Requirements

**SLAB** (graded trading cards):
cardName, set, cardNumber, game, gradingCompany, grade, certNumber, slabCondition, cardVariant

**RAW** (ungraded trading cards):
cardName, set, cardNumber, game, rarity, quantity, condition, gradeCandidate

**SEAL** (sealed products):
productType, game, set, productName, language, quantity, packagingCondition

**SHOE** (sneakers/footwear):
brand, model, colorway, styleCode, size, condition, boxIncluded, boxCondition

**APRL** (apparel):
brand, itemType, gender, size, color, material, condition

**ELEC** (electronics):
brand, productType, modelNumber, modelName, serialNumber, functionalStatus, physicalCondition, processor, ram, storage

**COLL** (collectibles):
brand, productLine, characterName, series, itemNumber, variant, retailerExclusive, condition, boxCondition

## Listing Title Rules
- eBay: Max 80 characters. Include brand, model, key attributes, condition. Keywords first.
- Facebook: Max 100 characters. Conversational but descriptive.
- TCGPlayer: Card name + set + grade/condition. Max 65 characters.
- Mercari: Max 80 characters. Similar to eBay, emoji optional.

## Output Rules
- Return ONLY valid JSON. No markdown, no explanation, no preamble.
- All numeric prices must be numbers (not strings).
- If you cannot identify something with certainty, set confidence accordingly and explain in confidenceNotes.
- Confidence 0-100: 85+ = green (high confidence), 65-84 = yellow (moderate), <65 = red (low).`;

function getQuickAddPrompt(category: Category, numPhotos: number): string {
  return `Analyze ${numPhotos} photo(s) of this ${category} item.

Return ONLY this JSON structure (no markdown, no explanation):
{
  "identification": {
    [all required fields for ${category} category]
  },
  "confidence": <0-100 integer>,
  "confidenceNotes": "<reason if confidence < 85, else null>",
  "displayName": "<short human-readable item name for UI display>"
}`;
}

function getCorePrompt(category: Category, numPhotos: number): string {
  return `Analyze ${numPhotos} photo(s) of this ${category} item. Perform full CORE analysis.

Return ONLY this JSON structure (no markdown, no explanation):
{
  "identification": {
    [all required fields for ${category} category]
  },
  "confidence": <0-100 integer>,
  "confidenceNotes": "<reason if confidence < 85, else null>",
  "displayName": "<short human-readable item name for UI display>",
  "research": {
    "comp1": {
      "price": <number>,
      "source": "<e.g. 'eBay sold - 3 days ago'>",
      "date": "<YYYY-MM-DD or approximate>",
      "notes": "<any relevant notes>"
    },
    "comp2": {
      "price": <number>,
      "source": "<e.g. 'TCGPlayer Low' or 'Lowest active listing'>",
      "notes": "<any relevant notes>"
    },
    "comp3": {
      "price": <number>,
      "source": "<e.g. 'Highest recent sale' or 'BGS 10 comparable'>",
      "notes": "<any relevant notes>"
    },
    "weightedAvg": <comp1*0.50 + comp2*0.25 + comp3*0.25>,
    "targetSellPrice": <weightedAvg * 1.07>,
    "minAcceptPrice": <weightedAvg * 0.87>,
    "velocityTier": "<'Fast Flip' | 'Standard' | 'Long Hold'>",
    "marketNotes": "<AI observations on market trend, demand, anything notable>",
    "popReport": "<population report data if SLAB, else null>",
    "gradingROI": "<grading ROI estimate if RAW, else null>"
  },
  "listings": {
    "ebay": {
      "title": "<max 80 chars>",
      "description": "<full eBay listing description, HTML ok, 200-400 words>",
      "price": <suggested listing price number>,
      "category": "<eBay category name>",
      "shippingNote": "<shipping recommendation>"
    },
    "facebook": {
      "title": "<max 100 chars>",
      "description": "<Facebook MP description, conversational, 100-200 words>",
      "price": <suggested listing price number>,
      "shippingNote": "<local pickup or shipping note>"
    },
    "tcgplayer": {
      "title": "<max 65 chars, only if category is SLAB/RAW/SEAL, else omit>",
      "description": "<TCGPlayer listing notes>",
      "price": <suggested price>
    },
    "mercari": {
      "title": "<max 80 chars>",
      "description": "<Mercari description, 100-200 words>",
      "price": <suggested listing price number>,
      "shippingNote": "<shipping recommendation>"
    }
  }
}

Use your knowledge of current market prices. Be specific and accurate. The comp prices should reflect real recent market data for this exact item (or the closest match you can identify from the photos).`;
}

export function buildUserPrompt(
  category: Category,
  protocol: Protocol,
  numPhotos: number
): string {
  if (protocol === 'quick') {
    return getQuickAddPrompt(category, numPhotos);
  }
  return getCorePrompt(category, numPhotos);
}
