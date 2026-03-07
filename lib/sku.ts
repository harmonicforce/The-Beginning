import { Category } from '../types/item';

export function generateSKU(category: Category, index: number): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rowNum = String(index).padStart(3, '0');
  return `${category}-${yy}${mm}${dd}-${rowNum}`;
}

export function parseSKU(sku: string): { category: Category; date: string; index: number } | null {
  const match = sku.match(/^([A-Z]+)-(\d{6})-(\d{3})$/);
  if (!match) return null;
  return {
    category: match[1] as Category,
    date: match[2],
    index: parseInt(match[3], 10),
  };
}
