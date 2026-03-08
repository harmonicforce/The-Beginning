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
- eBay: 13.25% (all categories; promoted listings add ~3-5%)
- Mercari: 10% (all categories)
- TCGPlayer: 12.5% (SLAB, RAW, SEAL only; includes payment processing)
- Facebook MP: 5% (shipped only; local pickup free)
- StockX: 10% (SHOE, APRL only)
- GOAT: 9.5% (SHOE only)

## Confidence Scoring Rubric
- 90-100: All key identifiers visible and readable; exact match found in market data
- 80-89: Most identifiers visible; high-confidence match with minor uncertainty
- 70-79: Some identifiers obscured or partially visible; good match but some assumptions
- 60-69: Limited visibility; relying on partial matches or educated guesses
- Below 60: Insufficient data for reliable identification; flag for manual review

## Category Domain Knowledge

### SLAB (Graded Trading Cards)
- Grading companies: PSA, BGS/Beckett, CGC, SGC
- PSA scale: 1-10 (Authentic, 1-1.5 Poor, 2 Good, 3 VG, 4 VG-EX, 5 EX, 6 EX-MT, 7 NM, 8 NM-MT, 9 MINT, 10 GEM MINT)
- BGS scale: 1-10 with sub-grades (Centering, Corners, Edges, Surface). BGS 9.5 = "Gem Mint", BGS 10 = "Pristine" (very rare)
- CGC scale: 1-10, similar to PSA but newer for trading cards
- PSA pop reports affect value significantly — low population = premium
- Key factors: card name, set, card number, grade, population, variant (1st Edition, holo, etc.)
- Cert number verification is critical for authenticity
- Recent eBay solds are the gold standard for SLAB pricing

### RAW (Ungraded Trading Cards)
- Games: Pokemon, Magic: The Gathering, Yu-Gi-Oh!, Sports (Baseball, Basketball, Football, Hockey), One Piece, Dragon Ball, Flesh and Blood, Lorcana
- Condition grading (rough): NM (Near Mint), LP (Lightly Played), MP (Moderately Played), HP (Heavily Played), DMG (Damaged)
- Grading candidates: NM or better cards worth $50+ raw should be flagged for grading ROI analysis
- Key factors: card name, set, rarity, condition, centering, edition (1st edition, unlimited, etc.)
- TCGPlayer market price is the standard for raw singles pricing

### SEAL (Sealed Products)
- Types: Booster boxes, ETBs (Elite Trainer Boxes), blister packs, collection boxes, starter decks, bundles
- Factory seal integrity matters enormously — resealed products are common fraud
- Look for: original shrink wrap, Wizards/TPC logos on seal, case fresh condition
- Language matters: English vs Japanese (JP products often command premium)
- Key factors: product type, game, set, language, packaging condition

### SHOE (Sneakers/Footwear)
- Major brands: Nike, Jordan, Adidas (Yeezy), New Balance, Asics, Puma
- Authentication: StockX, GOAT, CheckCheck
- Style code (found on size tag inside shoe) is the unique identifier
- Condition scale: DS (Deadstock/New), VNDS (Very Near Deadstock), Used (with wear description)
- Box condition matters: OG All (original box with all accessories), Replacement Box, No Box
- Size dramatically affects value — most valuable sizes are typically 8-12 US Men's
- StockX and GOAT are the primary price references for sneakers

### APRL (Apparel)
- Categories: Streetwear, vintage, designer, athletic
- Key brands: Supreme, BAPE, Stussy, Vintage Nike/Adidas, Off-White, Fear of God
- Condition: New With Tags (NWT), New Without Tags (NWOT), Pre-owned (rate 1-10)
- Size, color, material, and season/collection matter for pricing
- Tags and labels help verify authenticity
- eBay and Grailed are primary marketplaces

### ELEC (Electronics)
- Functionality is the #1 value driver — fully functional vs for parts
- Key data: brand, model number, serial number, specs (CPU, RAM, storage)
- Cosmetic condition: screen condition, chassis damage, missing parts
- Include accessories: charger, box, manuals, cables
- Test thoroughly: boot, charge, screen, speakers, ports, battery health
- Apple products retain value best; check iCloud lock status

### COLL (Collectibles)
- Categories: Funko Pop, action figures, statues, vinyl toys, board games, memorabilia
- In-box vs Out-of-box significantly affects value
- Box condition for Funko: Mint, Near Mint, damaged (specify where)
- Chase variants, exclusives (Hot Topic, Target, SDCC), and vaulted items command premium
- Limited editions: look for numbered items (#/1000, etc.)
- PPG (Pop Price Guide) is the standard for Funko pricing

## Comp Sourcing Hierarchy
1. eBay Sold/Completed (last 30 days) — highest priority, most liquid market
2. StockX/GOAT (SHOE only) — verified authentic, real-time market data
3. TCGPlayer (SLAB/RAW/SEAL) — market price, low/mid/high
4. Mercari Sold — secondary reference
5. Amazon/Retail — for sealed products, establishes ceiling

## Listing Optimization
- eBay: Keywords in title are critical for search. Front-load with brand/model. Include condition, key specs.
- Facebook: More conversational tone. Local buyers want deals. Mention "smoke-free home" if applicable.
- TCGPlayer: Precise card name + set + condition. TCGPlayer has its own formatting conventions.
- Mercari: Similar to eBay but slightly more casual. Good photos sell here.

## Output Rules
- Return ONLY valid JSON. No markdown, no explanation, no preamble.
- All numeric prices must be numbers (not strings).
- If you cannot identify something with certainty, set confidence accordingly and explain in confidenceNotes.
- Confidence 0-100: 85+ = green (high confidence), 65-84 = yellow (moderate), <65 = red (low).
- Always include a displayName field with a short, human-readable item name for UI display.`;

const CATEGORY_FIELDS: Record<Category, string> = {
  SLAB: '"cardName", "set", "cardNumber", "game", "gradingCompany", "grade", "certNumber", "slabCondition", "cardVariant"',
  RAW: '"cardName", "set", "cardNumber", "game", "rarity", "quantity", "condition", "gradeCandidate"',
  SEAL: '"productType", "game", "set", "productName", "language", "quantity", "packagingCondition"',
  SHOE: '"brand", "model", "colorway", "styleCode", "size", "condition", "boxIncluded", "boxCondition"',
  APRL: '"brand", "itemType", "gender", "size", "color", "material", "condition"',
  ELEC: '"brand", "productType", "modelNumber", "modelName", "serialNumber", "functionalStatus", "physicalCondition", "processor", "ram", "storage"',
  COLL: '"brand", "productLine", "characterName", "series", "itemNumber", "variant", "retailerExclusive", "condition", "boxCondition"',
};

function getQuickAddPrompt(category: Category, numPhotos: number): string {
  return `Analyze ${numPhotos} photo(s) of this ${category} item.

Return ONLY this JSON structure (no markdown, no explanation):
{
  "identification": {
    ${CATEGORY_FIELDS[category]}
  },
  "confidence": <0-100 integer>,
  "confidenceNotes": "<reason if confidence < 85, else null>",
  "displayName": "<short human-readable item name for UI display>"
}

Use the confidence scoring rubric from your instructions. Be specific about what you can and cannot see in the photos. Fill in null for any field you cannot determine from the photos.`;
}

function getCorePrompt(category: Category, numPhotos: number): string {
  return `Analyze ${numPhotos} photo(s) of this ${category} item. Perform full CORE analysis with market research and listing generation.

Return ONLY this JSON structure (no markdown, no explanation):
{
  "identification": {
    ${CATEGORY_FIELDS[category]}
  },
  "confidence": <0-100 integer>,
  "confidenceNotes": "<reason if confidence < 85, else null>",
  "displayName": "<short human-readable item name for UI display>",
  "research": {
    "comp1": {
      "price": <number>,
      "source": "<e.g. 'eBay sold - 3 days ago'>",
      "date": "<YYYY-MM-DD or approximate>",
      "notes": "<condition, listing details>"
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
    "marketNotes": "<AI observations on market trend, demand, seasonality, anything notable>",
    "popReport": "<population report data if SLAB — e.g. 'PSA 10 pop: 1,234', else null>",
    "gradingROI": "<grading ROI estimate if RAW — e.g. 'PSA 10 value: $500 vs raw $80, grading cost ~$30', else null>"
  },
  "listings": {
    "ebay": {
      "title": "<max 80 chars, keywords first, include brand/model/key attributes/condition>",
      "description": "<full eBay listing description, HTML ok, 200-400 words, include item specifics, condition notes, shipping info>",
      "price": <suggested listing price number>,
      "category": "<eBay category name>",
      "shippingNote": "<shipping recommendation with estimated cost>"
    },
    "facebook": {
      "title": "<max 100 chars, conversational but descriptive>",
      "description": "<Facebook MP description, conversational tone, 100-200 words, mention local pickup option>",
      "price": <suggested listing price — typically 5-10% lower than eBay>,
      "shippingNote": "<local pickup or shipping note>"
    },
    "tcgplayer": ${category === 'SLAB' || category === 'RAW' || category === 'SEAL' ? `{
      "title": "<max 65 chars, card name + set + condition/grade>",
      "description": "<TCGPlayer listing notes, brief and factual>",
      "price": <suggested price, aligned with TCGPlayer market>
    }` : 'null'},
    "mercari": {
      "title": "<max 80 chars, similar to eBay>",
      "description": "<Mercari description, 100-200 words, friendly tone>",
      "price": <suggested listing price number>,
      "shippingNote": "<shipping recommendation>"
    }
  }
}

IMPORTANT:
- Use the 3-Comp Pricing Formula exactly as specified in your instructions.
- Comp prices should reflect real recent market data for this exact item (or closest match).
- Follow the comp sourcing hierarchy: eBay Sold first, then category-specific sources.
- Listing titles must follow the platform-specific max character limits.
- Velocity tier: "Fast Flip" = sells within 7 days at market price, "Standard" = 7-30 days, "Long Hold" = 30+ days.
- Price listings competitively per platform (Facebook ~5-10% below eBay, TCGPlayer aligned to market).`;
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
