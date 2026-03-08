/**
 * CSV and JSON export utilities for inventory data.
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Item } from '../types/item';

function getItemName(item: Item): string {
  return item.displayName ?? getNameFromIdentification(item);
}

function getNameFromIdentification(item: Item): string {
  const id = item.identification as Record<string, unknown>;
  return String(
    id.cardName || id.model || id.productName || id.characterName || id.modelName || id.itemType || 'Unknown'
  );
}

/** Build CSV string from items. */
export function itemsToCSV(items: Item[]): string {
  const headers = [
    'SKU', 'Category', 'Name', 'Status', 'Protocol', 'Confidence',
    'Purchase Date', 'Purchase Price', 'Purchase Source', 'Storage Location',
    'Target Sell Price', 'Min Accept Price', 'Velocity',
    'Sale Price', 'Sale Platform', 'Net Profit', 'ROI',
    'Created At',
  ];

  const rows = items.map((item) => {
    const name = getItemName(item);
    return [
      item.sku,
      item.category,
      `"${name.replace(/"/g, '""')}"`,
      item.status,
      item.protocol.toUpperCase(),
      item.confidence,
      item.purchaseDate,
      item.purchasePrice,
      `"${item.purchaseSource.replace(/"/g, '""')}"`,
      `"${item.storageLocation.replace(/"/g, '""')}"`,
      item.research?.targetSellPrice ?? '',
      item.research?.minAcceptPrice ?? '',
      item.research?.velocityTier ?? '',
      item.salePrice ?? '',
      item.salePlatform ?? '',
      item.netProfit ?? '',
      item.roi ? `${item.roi}%` : '',
      item.createdAt,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/** Build JSON string from items. */
export function itemsToJSON(items: Item[]): string {
  return JSON.stringify(items, null, 2);
}

/** Export items as CSV file and open share sheet. */
export async function exportCSV(items: Item[], filename?: string): Promise<void> {
  const csv = itemsToCSV(items);
  const name = filename ?? `the-beginning-export-${new Date().toISOString().split('T')[0]}.csv`;
  const uri = FileSystem.documentDirectory + name;
  await FileSystem.writeAsStringAsync(uri, csv);
  await Sharing.shareAsync(uri, { mimeType: 'text/csv' });
}

/** Export items as JSON file and open share sheet. */
export async function exportJSON(items: Item[], filename?: string): Promise<void> {
  const json = itemsToJSON(items);
  const name = filename ?? `the-beginning-export-${new Date().toISOString().split('T')[0]}.json`;
  const uri = FileSystem.documentDirectory + name;
  await FileSystem.writeAsStringAsync(uri, json);
  await Sharing.shareAsync(uri, { mimeType: 'application/json' });
}
