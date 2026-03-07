export interface PlatformConfig {
  id: string;
  name: string;
  feePercent: number;
  feeNote: string;
  categories: string[];
  color: string;
}

export const PLATFORMS: PlatformConfig[] = [
  {
    id: 'ebay',
    name: 'eBay',
    feePercent: 13,
    feeNote: 'Standard final value fee; promoted listings add ~3-5% more',
    categories: ['SLAB', 'RAW', 'SEAL', 'SHOE', 'APRL', 'ELEC', 'COLL'],
    color: '#e53238',
  },
  {
    id: 'facebook',
    name: 'Facebook MP',
    feePercent: 5,
    feeNote: 'Applies to shipped sales only; local pickup is free',
    categories: ['SLAB', 'RAW', 'SEAL', 'SHOE', 'APRL', 'ELEC', 'COLL'],
    color: '#1877f2',
  },
  {
    id: 'tcgplayer',
    name: 'TCGPlayer',
    feePercent: 12.5,
    feeNote: 'Includes payment processing',
    categories: ['SLAB', 'RAW', 'SEAL'],
    color: '#1f8dd6',
  },
  {
    id: 'mercari',
    name: 'Mercari',
    feePercent: 13,
    feeNote: 'Flat seller fee',
    categories: ['SLAB', 'RAW', 'SEAL', 'SHOE', 'APRL', 'ELEC', 'COLL'],
    color: '#ff0211',
  },
  {
    id: 'stockx',
    name: 'StockX',
    feePercent: 10,
    feeNote: "Seller fee; buyer premium separate",
    categories: ['SHOE', 'APRL'],
    color: '#00ca05',
  },
  {
    id: 'goat',
    name: 'GOAT',
    feePercent: 9.5,
    feeNote: 'Standard commission; varies with seller level',
    categories: ['SHOE'],
    color: '#000000',
  },
];

export const PLATFORM_MAP = PLATFORMS.reduce(
  (acc, p) => ({ ...acc, [p.id]: p }),
  {} as Record<string, PlatformConfig>
);

export const FREE_TIER_LIMIT = 10;
