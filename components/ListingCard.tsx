import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { PlatformListing } from '../types/item';
import { PLATFORM_MAP } from '../constants/platforms';
import { formatCurrency } from '../lib/pricing';

interface ListingCardProps {
  platformId: string;
  listing: PlatformListing;
}

export function ListingCard({ platformId, listing }: ListingCardProps) {
  const [copied, setCopied] = useState<'title' | 'desc' | 'all' | null>(null);
  const platform = PLATFORM_MAP[platformId];

  const copyText = async (text: string, field: 'title' | 'desc' | 'all') => {
    await Clipboard.setStringAsync(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const fullListing = `${listing.title}\n\n${listing.description}\n\nPrice: ${formatCurrency(listing.price)}${listing.shippingNote ? `\n${listing.shippingNote}` : ''}`;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.platformDot, { backgroundColor: platform?.color ?? '#6366f1' }]} />
        <Text style={styles.platformName}>{platform?.name ?? platformId}</Text>
        <Text style={styles.feeText}>{platform?.feePercent}% fee</Text>
      </View>

      {/* Price */}
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Suggested Price</Text>
        <Text style={styles.price}>{formatCurrency(listing.price)}</Text>
      </View>

      {/* Title */}
      <View style={styles.fieldBlock}>
        <View style={styles.fieldHeader}>
          <Text style={styles.fieldLabel}>TITLE</Text>
          <TouchableOpacity
            onPress={() => copyText(listing.title, 'title')}
            style={styles.copyBtn}
          >
            <Text style={styles.copyText}>{copied === 'title' ? '✓ Copied' : 'Copy'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.fieldValue}>{listing.title}</Text>
        <Text style={styles.charCount}>{listing.title.length} chars</Text>
      </View>

      {/* Description */}
      <View style={styles.fieldBlock}>
        <View style={styles.fieldHeader}>
          <Text style={styles.fieldLabel}>DESCRIPTION</Text>
          <TouchableOpacity
            onPress={() => copyText(listing.description, 'desc')}
            style={styles.copyBtn}
          >
            <Text style={styles.copyText}>{copied === 'desc' ? '✓ Copied' : 'Copy'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.fieldValue} numberOfLines={6}>
          {listing.description}
        </Text>
      </View>

      {listing.shippingNote && (
        <View style={styles.shippingRow}>
          <Text style={styles.shippingIcon}>📦</Text>
          <Text style={styles.shippingText}>{listing.shippingNote}</Text>
        </View>
      )}

      {/* Copy all */}
      <TouchableOpacity
        onPress={() => copyText(fullListing, 'all')}
        style={styles.copyAllBtn}
        activeOpacity={0.8}
      >
        <Text style={styles.copyAllText}>
          {copied === 'all' ? '✓ Copied Full Listing' : 'Copy Full Listing'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1c1c1c',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  platformDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  platformName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f4f4f5',
    flex: 1,
  },
  feeText: {
    fontSize: 12,
    color: '#71717a',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#141414',
    padding: 12,
    borderRadius: 10,
  },
  priceLabel: {
    fontSize: 12,
    color: '#71717a',
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: '#22c55e',
  },
  fieldBlock: {
    gap: 6,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#52525b',
    letterSpacing: 1.5,
  },
  copyBtn: {
    backgroundColor: '#27272a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  copyText: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '600',
  },
  fieldValue: {
    fontSize: 13,
    color: '#d4d4d8',
    lineHeight: 20,
  },
  charCount: {
    fontSize: 10,
    color: '#52525b',
  },
  shippingRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: '#141414',
    padding: 10,
    borderRadius: 8,
  },
  shippingIcon: {
    fontSize: 14,
  },
  shippingText: {
    fontSize: 12,
    color: '#a1a1aa',
    flex: 1,
  },
  copyAllBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  copyAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
