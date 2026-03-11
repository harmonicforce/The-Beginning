import { Category } from './item';

export interface CategoryConfig {
  id: Category;
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  icon: string;
  description: string;
  photoGuidance: string;
  minPhotos: number;
  fields: string[];
}

export const CATEGORY_CONFIG: Record<Category, CategoryConfig> = {
  SLAB: {
    id: 'SLAB',
    label: 'Slab',
    color: '#6366f1',
    bgClass: 'bg-slab',
    textClass: 'text-slab',
    borderClass: 'border-slab',
    icon: '🃏',
    description: 'Graded trading cards (PSA, BGS, CGC, etc.)',
    photoGuidance: 'Capture front of slab — cert number visible',
    minPhotos: 1,
    fields: [
      'cardName',
      'set',
      'cardNumber',
      'game',
      'gradingCompany',
      'grade',
      'certNumber',
      'slabCondition',
      'cardVariant',
    ],
  },
  RAW: {
    id: 'RAW',
    label: 'Raw Card',
    color: '#8b5cf6',
    bgClass: 'bg-raw',
    textClass: 'text-raw',
    borderClass: 'border-raw',
    icon: '🎴',
    description: 'Ungraded trading cards',
    photoGuidance: 'Capture front and back — corners and edges visible',
    minPhotos: 1,
    fields: [
      'cardName',
      'set',
      'cardNumber',
      'game',
      'rarity',
      'quantity',
      'condition',
      'gradeCandidate',
    ],
  },
  SEAL: {
    id: 'SEAL',
    label: 'Sealed',
    color: '#ec4899',
    bgClass: 'bg-seal',
    textClass: 'text-seal',
    borderClass: 'border-seal',
    icon: '📦',
    description: 'Sealed packs, boxes, and sets',
    photoGuidance: 'Capture all sides — lot number and language visible',
    minPhotos: 1,
    fields: [
      'productType',
      'game',
      'set',
      'productName',
      'language',
      'quantity',
      'packagingCondition',
    ],
  },
  SHOE: {
    id: 'SHOE',
    label: 'Sneaker',
    color: '#f97316',
    bgClass: 'bg-shoe',
    textClass: 'text-shoe',
    borderClass: 'border-shoe',
    icon: '👟',
    description: 'Sneakers and athletic footwear',
    photoGuidance: 'Capture lateral side, sole, tongue tag, box label',
    minPhotos: 2,
    fields: [
      'brand',
      'model',
      'colorway',
      'styleCode',
      'size',
      'condition',
      'boxIncluded',
      'boxCondition',
    ],
  },
  APRL: {
    id: 'APRL',
    label: 'Apparel',
    color: '#14b8a6',
    bgClass: 'bg-aprl',
    textClass: 'text-aprl',
    borderClass: 'border-aprl',
    icon: '👕',
    description: 'Clothing, accessories, and wearables',
    photoGuidance: 'Capture front, back, tag/label, and any flaws',
    minPhotos: 1,
    fields: ['brand', 'itemType', 'gender', 'size', 'color', 'material', 'condition'],
  },
  ELEC: {
    id: 'ELEC',
    label: 'Electronics',
    color: '#3b82f6',
    bgClass: 'bg-elec',
    textClass: 'text-elec',
    borderClass: 'border-elec',
    icon: '💻',
    description: 'Electronics and tech devices',
    photoGuidance: 'Capture model sticker, serial number, physical condition',
    minPhotos: 2,
    fields: [
      'brand',
      'productType',
      'modelNumber',
      'modelName',
      'serialNumber',
      'functionalStatus',
      'physicalCondition',
      'processor',
      'ram',
      'storage',
    ],
  },
  COLL: {
    id: 'COLL',
    label: 'Collectible',
    color: '#f59e0b',
    bgClass: 'bg-coll',
    textClass: 'text-coll',
    borderClass: 'border-coll',
    icon: '🏆',
    description: 'Figures, toys, comics, and collectibles',
    photoGuidance: 'Capture figure/item, box front, box back, any damage',
    minPhotos: 1,
    fields: [
      'brand',
      'productLine',
      'characterName',
      'series',
      'itemNumber',
      'variant',
      'retailerExclusive',
      'condition',
      'boxCondition',
    ],
  },
};

export const CATEGORIES: Category[] = ['SLAB', 'RAW', 'SEAL', 'SHOE', 'APRL', 'ELEC', 'COLL'];
