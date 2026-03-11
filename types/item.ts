export type Category = 'SLAB' | 'RAW' | 'SEAL' | 'SHOE' | 'APRL' | 'ELEC' | 'COLL';

export type Protocol = 'quick' | 'core';

export type ItemStatus =
  | 'Intake'
  | 'Photo Queue'
  | 'Research'
  | 'Listed'
  | 'Sold'
  | 'Shipped';

export type VelocityTier = 'Fast Flip' | 'Standard' | 'Long Hold';

// ─── Category-specific identification fields ───────────────────────────────

export interface SlabIdentification {
  cardName: string;
  set: string;
  cardNumber: string;
  game: string;
  gradingCompany: string;
  grade: string;
  certNumber: string;
  slabCondition: string;
  cardVariant?: string;
}

export interface RawIdentification {
  cardName: string;
  set: string;
  cardNumber: string;
  game: string;
  rarity: string;
  quantity: number;
  condition: string;
  gradeCandidate?: boolean;
}

export interface SealIdentification {
  productType: string;
  game: string;
  set: string;
  productName: string;
  language: string;
  quantity: number;
  packagingCondition: string;
}

export interface ShoeIdentification {
  brand: string;
  model: string;
  colorway: string;
  styleCode: string;
  size: string;
  condition: string;
  boxIncluded: boolean;
  boxCondition?: string;
}

export interface AprlIdentification {
  brand: string;
  itemType: string;
  gender: string;
  size: string;
  color: string;
  material: string;
  condition: string;
}

export interface ElecIdentification {
  brand: string;
  productType: string;
  modelNumber: string;
  modelName: string;
  serialNumber?: string;
  functionalStatus: string;
  physicalCondition: string;
  processor?: string;
  ram?: string;
  storage?: string;
}

export interface CollIdentification {
  brand: string;
  productLine: string;
  characterName: string;
  series: string;
  itemNumber?: string;
  variant?: string;
  retailerExclusive?: string;
  condition: string;
  boxCondition?: string;
}

export type Identification =
  | SlabIdentification
  | RawIdentification
  | SealIdentification
  | ShoeIdentification
  | AprlIdentification
  | ElecIdentification
  | CollIdentification;

// ─── Comp / Research ────────────────────────────────────────────────────────

export interface Comp {
  price: number;
  source: string;
  date?: string;
  notes?: string;
}

export interface Research {
  comp1: Comp;
  comp2: Comp;
  comp3: Comp;
  weightedAvg: number;
  targetSellPrice: number;
  minAcceptPrice: number;
  velocityTier: VelocityTier;
  marketNotes: string;
  popReport?: string;
  gradingROI?: string;
}

// ─── Listings ───────────────────────────────────────────────────────────────

export interface PlatformListing {
  title: string;
  description: string;
  price: number;
  category?: string;
  shippingNote?: string;
}

export interface Listings {
  ebay: PlatformListing;
  facebook: PlatformListing;
  tcgplayer?: PlatformListing;
  mercari: PlatformListing;
}

// ─── Status History ──────────────────────────────────────────────────────────

export interface StatusChange {
  from: ItemStatus;
  to: ItemStatus;
  timestamp: string;
  note?: string;
}

// ─── Full Item Record ────────────────────────────────────────────────────────

export interface Item {
  id: string;
  sku: string;
  category: Category;
  protocol: Protocol;
  identification: Identification;
  confidence: number;
  confidenceNotes?: string;
  displayName?: string;
  photos: string[];
  research?: Research;
  listings?: Listings;
  purchaseDate: string;
  purchasePrice: number;
  purchaseSource: string;
  storageLocation: string;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
  listedPlatforms: string[];
  // Sale tracking
  salePrice?: number;
  salePlatform?: string;
  buyerUsername?: string;
  saleDate?: string;
  platformFee?: number;
  shippingCost?: number;
  trackingNumber?: string;
  netProfit?: number;
  roi?: number;
  // Notes and history
  notes?: string;
  statusHistory?: StatusChange[];
  // Schema version for future migration
  schemaVersion?: number;
}

// ─── Partial for creation ────────────────────────────────────────────────────

export type NewItem = Omit<Item, 'id' | 'sku' | 'createdAt' | 'updatedAt'>;
