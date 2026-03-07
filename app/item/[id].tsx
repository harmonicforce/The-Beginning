import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInventoryStore } from '../../store/inventory';
import { CATEGORY_CONFIG } from '../../types/categories';
import { Item, ItemStatus } from '../../types/item';
import { ConfidenceBadge } from '../../components/ConfidenceBadge';
import { PricingPanel } from '../../components/PricingPanel';
import { ListingCard } from '../../components/ListingCard';
import { InventoryRow } from '../../components/InventoryRow';
import { formatCurrency } from '../../lib/pricing';

const STATUS_OPTIONS: ItemStatus[] = ['Intake', 'Photo Queue', 'Research', 'Listed', 'Sold', 'Shipped'];

function statusColor(status: ItemStatus): string {
  const colors: Record<ItemStatus, string> = {
    Intake: '#71717a',
    'Photo Queue': '#f59e0b',
    Research: '#6366f1',
    Listed: '#22c55e',
    Sold: '#3b82f6',
    Shipped: '#8b5cf6',
  };
  return colors[status];
}

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getItemById, updateItem, deleteItem } = useInventoryStore();
  const item = getItemById(id);

  const [editing, setEditing] = useState(false);
  const [editedItem, setEditedItem] = useState<Item | null>(item ?? null);
  const [activeSection, setActiveSection] = useState<'details' | 'pricing' | 'listings' | 'export'>('details');

  if (!item || !editedItem) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Item not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const config = CATEGORY_CONFIG[item.category];

  const handleSave = async () => {
    if (!editedItem) return;
    await updateItem(editedItem);
    setEditing(false);
    Alert.alert('Saved', 'Item updated successfully.');
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete ${item.sku}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteItem(item.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleStatusChange = (status: ItemStatus) => {
    const updated = { ...editedItem, status };
    setEditedItem(updated);
    updateItem(updated);
  };

  const idFields = Object.entries(item.identification as Record<string, unknown>).filter(
    ([, v]) => v !== null && v !== undefined && v !== ''
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.catLabel, { color: config.color }]}>
            {config.icon} {item.category}
          </Text>
          <Text style={styles.skuLabel}>{item.sku}</Text>
        </View>
        <View style={styles.headerRight}>
          {editing ? (
            <>
              <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
              <Ionicons name="create-outline" size={16} color="#6366f1" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statusRow}
      >
        {STATUS_OPTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => handleStatusChange(s)}
            style={[
              styles.statusChip,
              item.status === s && {
                backgroundColor: statusColor(s) + '22',
                borderColor: statusColor(s) + '66',
              },
            ]}
          >
            <Text style={[styles.statusChipText, item.status === s && { color: statusColor(s) }]}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Section tabs */}
      <View style={styles.sectionTabs}>
        {(['details', 'pricing', 'listings', 'export'] as const).map((s) => {
          const locked = (s === 'pricing' || s === 'listings') && item.protocol === 'quick';
          return (
            <TouchableOpacity
              key={s}
              onPress={() => !locked && setActiveSection(s)}
              style={[styles.sectionTab, activeSection === s && styles.sectionTabActive]}
            >
              <Text style={[styles.sectionTabText, activeSection === s && styles.sectionTabTextActive, locked && { color: '#3f3f46' }]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}{locked ? ' 🔒' : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {activeSection === 'details' && (
          <View style={styles.section}>
            {/* Confidence */}
            <ConfidenceBadge
              confidence={item.confidence}
              notes={item.confidenceNotes}
              showNotes
              size="lg"
            />

            {/* Purchase info */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>PURCHASE INFO</Text>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Purchase Price</Text>
                {editing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={String(editedItem.purchasePrice)}
                    onChangeText={(v) =>
                      setEditedItem({ ...editedItem, purchasePrice: parseFloat(v) || 0 })
                    }
                    keyboardType="decimal-pad"
                    placeholderTextColor="#52525b"
                  />
                ) : (
                  <Text style={styles.fieldValue}>${item.purchasePrice}</Text>
                )}
              </View>

              <View style={styles.fieldDivider} />

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Purchase Source</Text>
                {editing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={editedItem.purchaseSource}
                    onChangeText={(v) => setEditedItem({ ...editedItem, purchaseSource: v })}
                    placeholder="e.g. eBay lot, Goodwill"
                    placeholderTextColor="#52525b"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{item.purchaseSource || '—'}</Text>
                )}
              </View>

              <View style={styles.fieldDivider} />

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Storage Location</Text>
                {editing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={editedItem.storageLocation}
                    onChangeText={(v) => setEditedItem({ ...editedItem, storageLocation: v })}
                    placeholder="e.g. Bin A3, Shelf 2"
                    placeholderTextColor="#52525b"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{item.storageLocation || '—'}</Text>
                )}
              </View>

              <View style={styles.fieldDivider} />

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Purchase Date</Text>
                <Text style={styles.fieldValue}>{item.purchaseDate}</Text>
              </View>
            </View>

            {/* Identification fields */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>IDENTIFICATION</Text>
              {idFields.map(([key, value], i) => (
                <View key={key}>
                  {i > 0 && <View style={styles.fieldDivider} />}
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>{humanizeKey(key)}</Text>
                    <Text style={styles.fieldValue}>{String(value)}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* If sold */}
            {item.status === 'Sold' && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>SALE INFO</Text>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Sale Price</Text>
                  {editing ? (
                    <TextInput
                      style={styles.fieldInput}
                      value={String(editedItem.salePrice ?? '')}
                      onChangeText={(v) =>
                        setEditedItem({ ...editedItem, salePrice: parseFloat(v) || 0 })
                      }
                      keyboardType="decimal-pad"
                      placeholderTextColor="#52525b"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>
                      {item.salePrice ? formatCurrency(item.salePrice) : '—'}
                    </Text>
                  )}
                </View>
                {item.netProfit !== undefined && item.netProfit !== null && (
                  <>
                    <View style={styles.fieldDivider} />
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Net Profit</Text>
                      <Text style={[styles.fieldValue, { color: item.netProfit >= 0 ? '#22c55e' : '#ef4444' }]}>
                        {formatCurrency(item.netProfit)}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Danger zone */}
            <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
              <Text style={styles.deleteBtnText}>Delete Item</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeSection === 'pricing' && item.research && (
          <View style={styles.section}>
            <PricingPanel research={item.research} />
          </View>
        )}

        {activeSection === 'listings' && item.listings && (
          <View style={styles.section}>
            {(['ebay', 'facebook', 'tcgplayer', 'mercari'] as const).map((platform) => {
              const listing = item.listings![platform];
              if (!listing) return null;
              return <ListingCard key={platform} platformId={platform} listing={listing} />;
            })}
          </View>
        )}

        {activeSection === 'export' && (
          <View style={styles.section}>
            <InventoryRow item={item} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1c',
  },
  headerLeft: { gap: 2 },
  headerRight: { flexDirection: 'row', gap: 8 },
  catLabel: { fontSize: 15, fontWeight: '700' },
  skuLabel: { fontSize: 11, color: '#52525b', fontFamily: 'monospace' },
  cancelBtn: {
    backgroundColor: '#27272a',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  cancelBtnText: { fontSize: 13, color: '#a1a1aa', fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  saveBtnText: { fontSize: 13, color: '#fff', fontWeight: '700' },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6366f122',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editBtnText: { fontSize: 13, color: '#6366f1', fontWeight: '600' },
  statusRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  statusChip: {
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statusChipText: { fontSize: 12, color: '#71717a', fontWeight: '600' },
  sectionTabs: {
    flexDirection: 'row',
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1c',
  },
  sectionTab: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
  },
  sectionTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
  },
  sectionTabText: {
    fontSize: 12,
    color: '#52525b',
    fontWeight: '600',
  },
  sectionTabTextActive: { color: '#6366f1' },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 50 },
  section: { gap: 14 },
  card: {
    backgroundColor: '#1c1c1c',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 10,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#52525b',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    minHeight: 32,
  },
  fieldLabel: { fontSize: 12, color: '#71717a', flex: 0.4 },
  fieldValue: {
    fontSize: 13,
    color: '#f4f4f5',
    fontWeight: '600',
    flex: 0.6,
    textAlign: 'right',
  },
  fieldInput: {
    flex: 0.6,
    fontSize: 13,
    color: '#f4f4f5',
    fontWeight: '600',
    textAlign: 'right',
    backgroundColor: '#27272a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  fieldDivider: { height: 1, backgroundColor: '#27272a' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7f1d1d22',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ef444433',
    marginTop: 8,
  },
  deleteBtnText: { fontSize: 14, color: '#ef4444', fontWeight: '600' },
  notFound: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  notFoundText: { fontSize: 16, color: '#71717a' },
  backLink: { fontSize: 15, color: '#6366f1', fontWeight: '600' },
});
