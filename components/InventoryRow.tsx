import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Item } from '../types/item';
import { buildInventoryRow } from '../lib/storage';
import { CATEGORY_CONFIG } from '../types/categories';

interface InventoryRowProps {
  item: Item;
}

export function InventoryRow({ item }: InventoryRowProps) {
  const [copied, setCopied] = useState(false);
  const config = CATEGORY_CONFIG[item.category];
  const rowText = buildInventoryRow(item);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(rowText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const id = item.identification as Record<string, unknown>;
  const displayName =
    (id.cardName as string) ||
    (id.productName as string) ||
    (id.model as string) ||
    (id.characterName as string) ||
    (id.modelName as string) ||
    'Unknown Item';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inventory Row</Text>
      <Text style={styles.subtitle}>Paste-ready tab-delimited row for your master sheet</Text>

      {/* Preview */}
      <View style={styles.preview}>
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>SKU</Text>
          <Text style={styles.previewValue}>{item.sku}</Text>
        </View>
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Category</Text>
          <Text style={[styles.previewValue, { color: config.color }]}>{item.category}</Text>
        </View>
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Item</Text>
          <Text style={styles.previewValue} numberOfLines={1}>{displayName}</Text>
        </View>
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Purchase $</Text>
          <Text style={styles.previewValue}>${item.purchasePrice}</Text>
        </View>
        {item.research && (
          <>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Target</Text>
              <Text style={[styles.previewValue, { color: '#22c55e' }]}>
                ${item.research.targetSellPrice}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Min</Text>
              <Text style={[styles.previewValue, { color: '#f59e0b' }]}>
                ${item.research.minAcceptPrice}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Velocity</Text>
              <Text style={styles.previewValue}>{item.research.velocityTier}</Text>
            </View>
          </>
        )}
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Confidence</Text>
          <Text style={styles.previewValue}>{item.confidence}%</Text>
        </View>
      </View>

      {/* Raw row preview */}
      <View style={styles.rawContainer}>
        <Text style={styles.rawLabel}>TAB-DELIMITED ROW</Text>
        <Text style={styles.rawText} numberOfLines={2}>
          {rowText}
        </Text>
      </View>

      <TouchableOpacity onPress={handleCopy} style={styles.copyBtn} activeOpacity={0.8}>
        <Text style={styles.copyText}>
          {copied ? '✓ Copied to Clipboard' : '📋  Copy Row to Clipboard'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1c1c1c',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  subtitle: {
    fontSize: 12,
    color: '#71717a',
    marginTop: -8,
  },
  preview: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 12,
    color: '#71717a',
    width: 80,
  },
  previewValue: {
    fontSize: 13,
    color: '#f4f4f5',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  rawContainer: {
    gap: 6,
  },
  rawLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#52525b',
    letterSpacing: 1.5,
  },
  rawText: {
    fontSize: 11,
    color: '#52525b',
    fontFamily: 'monospace',
    backgroundColor: '#141414',
    padding: 10,
    borderRadius: 8,
  },
  copyBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  copyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
