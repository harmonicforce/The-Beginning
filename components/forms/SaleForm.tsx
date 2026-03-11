import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Item } from '../../types/item';
import { PLATFORMS } from '../../constants/platforms';
import { useSettingsStore } from '../../store/settingsStore';
import { formatCurrency } from '../../lib/format';

interface SaleFormProps {
  visible: boolean;
  onClose: () => void;
  item: Item;
  onSave: (data: {
    salePrice: number;
    salePlatform: string;
    buyerUsername: string;
    saleDate: string;
    platformFee: number;
    netProfit: number;
    roi: number;
  }) => void;
}

export function SaleForm({ visible, onClose, item, onSave }: SaleFormProps) {
  const { platformFees } = useSettingsStore();
  const [salePrice, setSalePrice] = useState('');
  const [platform, setPlatform] = useState('ebay');
  const [buyer, setBuyer] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);

  const price = parseFloat(salePrice) || 0;
  const feeKey = platform as keyof typeof platformFees;
  const feePercent = platformFees[feeKey] ?? 13;
  const fee = Math.round(price * (feePercent / 100) * 100) / 100;
  const netProfit = Math.round((price - item.purchasePrice - fee) * 100) / 100;
  const roi = item.purchasePrice > 0 ? Math.round((netProfit / item.purchasePrice) * 1000) / 10 : 0;

  const handleSave = () => {
    if (price <= 0) return;
    onSave({
      salePrice: price,
      salePlatform: platform,
      buyerUsername: buyer,
      saleDate,
      platformFee: fee,
      netProfit,
      roi,
    });
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Mark as Sold">
      <View style={styles.content}>
        <View style={styles.field}>
          <Text style={styles.label}>Sale Price</Text>
          <TextInput
            style={styles.input}
            value={salePrice}
            onChangeText={setSalePrice}
            placeholder="0.00"
            placeholderTextColor="#52525b"
            keyboardType="decimal-pad"
            autoFocus
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Platform</Text>
          <View style={styles.platformRow}>
            {PLATFORMS.filter((p) => p.categories.includes(item.category)).map((p) => (
              <Button
                key={p.id}
                label={p.name}
                variant={platform === p.id ? 'primary' : 'secondary'}
                size="sm"
                onPress={() => setPlatform(p.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Buyer Username (optional)</Text>
          <TextInput
            style={styles.input}
            value={buyer}
            onChangeText={setBuyer}
            placeholder="e.g. buyer_123"
            placeholderTextColor="#52525b"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Sale Date</Text>
          <TextInput
            style={styles.input}
            value={saleDate}
            onChangeText={setSaleDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#52525b"
          />
        </View>

        {price > 0 && (
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sale Price</Text>
              <Text style={styles.summaryValue}>{formatCurrency(price)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Purchase Price</Text>
              <Text style={styles.summaryValue}>{formatCurrency(item.purchasePrice)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Platform Fee ({feePercent}%)</Text>
              <Text style={[styles.summaryValue, { color: '#ef4444' }]}>-{formatCurrency(fee)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { fontWeight: '700' }]}>Net Profit</Text>
              <Text
                style={[
                  styles.summaryValue,
                  { fontWeight: '800', color: netProfit >= 0 ? '#22c55e' : '#ef4444' },
                ]}
              >
                {formatCurrency(netProfit)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>ROI</Text>
              <Text
                style={[styles.summaryValue, { color: roi >= 0 ? '#22c55e' : '#ef4444' }]}
              >
                {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
              </Text>
            </View>
          </View>
        )}

        <Button
          label="Confirm Sale"
          onPress={handleSave}
          disabled={price <= 0}
          size="lg"
          style={{ marginTop: 8 }}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: '#a1a1aa' },
  input: {
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 14,
    fontSize: 16,
    color: '#f4f4f5',
  },
  platformRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summary: {
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: { fontSize: 13, color: '#71717a' },
  summaryValue: { fontSize: 13, color: '#f4f4f5', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#2a2a2a', marginVertical: 2 },
});
