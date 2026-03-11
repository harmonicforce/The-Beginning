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
import { Item, ItemStatus, StatusChange } from '../../types/item';
import { STATUS_COLORS } from '../../components/ui/StatusBadge';
import { CategoryBadge } from '../../components/ui/CategoryBadge';
import { Card } from '../../components/ui/Card';
import { Sheet } from '../../components/ui/Sheet';
import { ConfidenceBadge } from '../../components/ConfidenceBadge';
import { PricingPanel } from '../../components/PricingPanel';
import { ListingCard } from '../../components/ListingCard';
import { formatCurrency, formatRelativeTime } from '../../lib/format';
import { calculateNetProfit, calculateROI, calculateFeeAmount } from '../../services/PricingService';

const STATUS_PIPELINE: ItemStatus[] = ['Intake', 'Photo Queue', 'Research', 'Listed', 'Sold', 'Shipped'];

function humanizeKey(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
}

function getItemName(item: Item): string {
  const id = item.identification as Record<string, unknown>;
  return String(
    id.cardName || id.model || id.productName || id.characterName || id.modelName || id.itemType || 'Unknown'
  );
}

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getItemById, updateItem, deleteItem } = useInventoryStore();
  const item = getItemById(id);

  const [editing, setEditing] = useState(false);
  const [editedItem, setEditedItem] = useState<Item | null>(item ?? null);
  const [showSaleSheet, setShowSaleSheet] = useState(false);
  const [showShipSheet, setShowShipSheet] = useState(false);
  const [salePrice, setSalePrice] = useState('');
  const [salePlatform, setSalePlatform] = useState('eBay');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState(item?.notes ?? '');

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
  const name = item.displayName ?? getItemName(item);

  const handleSave = async () => {
    if (!editedItem) return;
    const updated = { ...editedItem, notes, updatedAt: new Date().toISOString() };
    await updateItem(updated);
    setEditing(false);
  };

  const handleStatusChange = async (newStatus: ItemStatus) => {
    if (newStatus === 'Sold') {
      setShowSaleSheet(true);
      return;
    }
    if (newStatus === 'Shipped') {
      setShowShipSheet(true);
      return;
    }
    const change: StatusChange = {
      from: item.status,
      to: newStatus,
      timestamp: new Date().toISOString(),
    };
    const updated: Item = {
      ...item,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      statusHistory: [...(item.statusHistory ?? []), change],
    };
    await updateItem(updated);
    setEditedItem(updated);
  };

  const handleMarkSold = async () => {
    const price = parseFloat(salePrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid sale price.');
      return;
    }
    const fee = calculateFeeAmount(price, salePlatform.toLowerCase());
    const net = calculateNetProfit(price, item.purchasePrice, fee);
    const roi = calculateROI(net, item.purchasePrice);
    const change: StatusChange = {
      from: item.status,
      to: 'Sold',
      timestamp: new Date().toISOString(),
    };
    const updated: Item = {
      ...item,
      status: 'Sold',
      salePrice: price,
      salePlatform,
      saleDate: new Date().toISOString().split('T')[0],
      platformFee: fee,
      netProfit: net,
      roi,
      updatedAt: new Date().toISOString(),
      statusHistory: [...(item.statusHistory ?? []), change],
    };
    await updateItem(updated);
    setEditedItem(updated);
    setShowSaleSheet(false);
  };

  const handleMarkShipped = async () => {
    const change: StatusChange = {
      from: item.status,
      to: 'Shipped',
      timestamp: new Date().toISOString(),
    };
    const updated: Item = {
      ...item,
      status: 'Shipped',
      trackingNumber: trackingNumber || undefined,
      updatedAt: new Date().toISOString(),
      statusHistory: [...(item.statusHistory ?? []), change],
    };
    await updateItem(updated);
    setEditedItem(updated);
    setShowShipSheet(false);
  };

  const handleDuplicate = async () => {
    const dup: Item = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      sku: item.sku + '-DUP',
      status: 'Intake',
      salePrice: undefined,
      salePlatform: undefined,
      saleDate: undefined,
      platformFee: undefined,
      netProfit: undefined,
      roi: undefined,
      trackingNumber: undefined,
      statusHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const { addItem } = useInventoryStore.getState();
    await addItem(dup);
    Alert.alert('Duplicated', 'Item duplicated. Find it in your inventory.');
  };

  const handleDelete = () => {
    Alert.alert('Delete Item', `Delete ${item.sku}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { await deleteItem(item.id); router.back(); },
      },
    ]);
  };

  const handleSaveNotes = async () => {
    const updated = { ...item, notes, updatedAt: new Date().toISOString() };
    await updateItem(updated);
  };

  const idFields = Object.entries(item.identification as Record<string, unknown>).filter(
    ([, v]) => v !== null && v !== undefined && v !== ''
  );

  const profitAmount = item.salePrice ? item.salePrice - item.purchasePrice - (item.platformFee ?? 0) : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <CategoryBadge category={item.category} size="md" />
          <View>
            <Text style={styles.headerName} numberOfLines={1}>{name}</Text>
            <Text style={styles.headerSku}>{item.sku}</Text>
          </View>
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
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status Pipeline */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusRow}>
        {STATUS_PIPELINE.map((s, i) => {
          const isCurrent = item.status === s;
          const isPast = STATUS_PIPELINE.indexOf(item.status) > i;
          const color = STATUS_COLORS[s];
          return (
            <TouchableOpacity
              key={s}
              onPress={() => handleStatusChange(s)}
              style={[
                styles.statusChip,
                isCurrent && { backgroundColor: color + '22', borderColor: color + '66' },
                isPast && { backgroundColor: '#14532d22', borderColor: '#14532d66' },
              ]}
            >
              {isPast && <Ionicons name="checkmark" size={12} color="#22c55e" />}
              <Text style={[styles.statusChipText, isCurrent && { color }, isPast && { color: '#22c55e' }]}>{s}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Confidence */}
        <ConfidenceBadge confidence={item.confidence} notes={item.confidenceNotes} showNotes size="lg" />

        {/* Financial Summary */}
        <Card title="FINANCIALS">
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Purchase Price</Text>
            {editing ? (
              <TextInput
                style={styles.finInput}
                value={String(editedItem.purchasePrice)}
                onChangeText={(v) => setEditedItem({ ...editedItem, purchasePrice: parseFloat(v) || 0 })}
                keyboardType="decimal-pad"
              />
            ) : (
              <Text style={styles.finValue}>{formatCurrency(item.purchasePrice)}</Text>
            )}
          </View>
          {item.research && (
            <>
              <View style={styles.divider} />
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>Target Sell Price</Text>
                <Text style={[styles.finValue, { color: '#22c55e' }]}>{formatCurrency(item.research.targetSellPrice)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>Min Accept</Text>
                <Text style={styles.finValue}>{formatCurrency(item.research.minAcceptPrice)}</Text>
              </View>
            </>
          )}
          {item.salePrice !== undefined && (
            <>
              <View style={styles.divider} />
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>Sale Price</Text>
                <Text style={[styles.finValue, { color: '#3b82f6' }]}>{formatCurrency(item.salePrice)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>Platform Fee</Text>
                <Text style={styles.finValue}>-{formatCurrency(item.platformFee ?? 0)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>Net Profit</Text>
                <Text style={[styles.finValue, { color: profitAmount !== null && profitAmount >= 0 ? '#22c55e' : '#ef4444' }]}>
                  {formatCurrency(profitAmount ?? 0)}
                </Text>
              </View>
              {item.roi !== undefined && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.finRow}>
                    <Text style={styles.finLabel}>ROI</Text>
                    <Text style={[styles.finValue, { color: item.roi >= 0 ? '#22c55e' : '#ef4444' }]}>
                      {item.roi.toFixed(1)}%
                    </Text>
                  </View>
                </>
              )}
            </>
          )}
        </Card>

        {/* Purchase Info */}
        <Card title="PURCHASE INFO">
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Source</Text>
            {editing ? (
              <TextInput
                style={styles.finInput}
                value={editedItem.purchaseSource}
                onChangeText={(v) => setEditedItem({ ...editedItem, purchaseSource: v })}
                placeholder="e.g. eBay lot"
                placeholderTextColor="#52525b"
              />
            ) : (
              <Text style={styles.finValue}>{item.purchaseSource || '—'}</Text>
            )}
          </View>
          <View style={styles.divider} />
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Storage</Text>
            {editing ? (
              <TextInput
                style={styles.finInput}
                value={editedItem.storageLocation}
                onChangeText={(v) => setEditedItem({ ...editedItem, storageLocation: v })}
                placeholder="e.g. Bin A3"
                placeholderTextColor="#52525b"
              />
            ) : (
              <Text style={styles.finValue}>{item.storageLocation || '—'}</Text>
            )}
          </View>
          <View style={styles.divider} />
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Purchase Date</Text>
            <Text style={styles.finValue}>{item.purchaseDate}</Text>
          </View>
          {item.salePlatform && (
            <>
              <View style={styles.divider} />
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>Sold On</Text>
                <Text style={styles.finValue}>{item.salePlatform}</Text>
              </View>
            </>
          )}
          {item.trackingNumber && (
            <>
              <View style={styles.divider} />
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>Tracking</Text>
                <Text style={[styles.finValue, { fontFamily: 'monospace' }]}>{item.trackingNumber}</Text>
              </View>
            </>
          )}
        </Card>

        {/* Identification */}
        <Card title="IDENTIFICATION">
          {idFields.map(([key, value], i) => (
            <View key={key}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>{humanizeKey(key)}</Text>
                <Text style={styles.finValue}>{String(value)}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Pricing / Research */}
        {item.research && (
          <Card title="MARKET RESEARCH">
            <PricingPanel research={item.research} />
          </Card>
        )}

        {/* Listings */}
        {item.listings && (
          <Card title="LISTINGS">
            {(['ebay', 'facebook', 'tcgplayer', 'mercari'] as const).map((platform) => {
              const listing = item.listings![platform];
              if (!listing) return null;
              return <ListingCard key={platform} platformId={platform} listing={listing} />;
            })}
          </Card>
        )}

        {/* Notes */}
        <Card title="NOTES">
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            onBlur={handleSaveNotes}
            placeholder="Add notes about this item..."
            placeholderTextColor="#52525b"
            multiline
            textAlignVertical="top"
          />
        </Card>

        {/* Status History */}
        {item.statusHistory && item.statusHistory.length > 0 && (
          <Card title="STATUS HISTORY">
            {item.statusHistory.map((change, i) => (
              <View key={i} style={styles.historyRow}>
                <View style={styles.historyDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyText}>
                    {change.from} → {change.to}
                  </Text>
                  <Text style={styles.historyTime}>{formatRelativeTime(change.timestamp)}</Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {item.status === 'Listed' && (
            <TouchableOpacity onPress={() => setShowSaleSheet(true)} style={styles.soldBtn}>
              <Ionicons name="cash-outline" size={18} color="#fff" />
              <Text style={styles.soldBtnText}>Mark as Sold</Text>
            </TouchableOpacity>
          )}
          {item.status === 'Sold' && (
            <TouchableOpacity onPress={() => setShowShipSheet(true)} style={styles.shipBtn}>
              <Ionicons name="airplane-outline" size={18} color="#fff" />
              <Text style={styles.shipBtnText}>Mark as Shipped</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleDuplicate} style={styles.dupBtn}>
            <Ionicons name="copy-outline" size={16} color="#6366f1" />
            <Text style={styles.dupBtnText}>Duplicate</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={styles.deleteBtnText}>Delete Item</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sale Sheet */}
      <Sheet visible={showSaleSheet} onClose={() => setShowSaleSheet(false)} title="Mark as Sold">
        <View style={styles.sheetContent}>
          <Text style={styles.sheetLabel}>Sale Price</Text>
          <TextInput
            style={styles.sheetInput}
            value={salePrice}
            onChangeText={setSalePrice}
            placeholder="0.00"
            placeholderTextColor="#52525b"
            keyboardType="decimal-pad"
          />
          <Text style={styles.sheetLabel}>Platform</Text>
          <View style={styles.platformChips}>
            {['eBay', 'Facebook', 'TCGPlayer', 'Mercari', 'StockX', 'GOAT', 'Other'].map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setSalePlatform(p)}
                style={[styles.platformChip, salePlatform === p && styles.platformChipActive]}
              >
                <Text style={[styles.platformChipText, salePlatform === p && { color: '#6366f1' }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {salePrice && parseFloat(salePrice) > 0 && (
            <View style={styles.salePreview}>
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>Est. Fee</Text>
                <Text style={styles.finValue}>
                  -{formatCurrency(calculateFeeAmount(parseFloat(salePrice), salePlatform.toLowerCase()))}
                </Text>
              </View>
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>Est. Net Profit</Text>
                <Text style={[styles.finValue, { color: '#22c55e' }]}>
                  {formatCurrency(
                    calculateNetProfit(
                      parseFloat(salePrice),
                      item.purchasePrice,
                      calculateFeeAmount(parseFloat(salePrice), salePlatform.toLowerCase())
                    )
                  )}
                </Text>
              </View>
            </View>
          )}
          <TouchableOpacity onPress={handleMarkSold} style={styles.sheetBtn}>
            <Text style={styles.sheetBtnText}>Confirm Sale</Text>
          </TouchableOpacity>
        </View>
      </Sheet>

      {/* Ship Sheet */}
      <Sheet visible={showShipSheet} onClose={() => setShowShipSheet(false)} title="Mark as Shipped">
        <View style={styles.sheetContent}>
          <Text style={styles.sheetLabel}>Tracking Number (optional)</Text>
          <TextInput
            style={styles.sheetInput}
            value={trackingNumber}
            onChangeText={setTrackingNumber}
            placeholder="e.g. 1Z999AA1012345678"
            placeholderTextColor="#52525b"
            autoCapitalize="characters"
          />
          <TouchableOpacity onPress={handleMarkShipped} style={styles.sheetBtn}>
            <Text style={styles.sheetBtnText}>Confirm Shipped</Text>
          </TouchableOpacity>
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderBottomWidth: 1, borderBottomColor: '#1c1c1c',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerRight: { flexDirection: 'row', gap: 8 },
  headerName: { fontSize: 15, fontWeight: '700', color: '#f4f4f5', maxWidth: 180 },
  headerSku: { fontSize: 11, color: '#52525b', fontFamily: 'monospace' },
  cancelBtn: { backgroundColor: '#27272a', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  cancelBtnText: { fontSize: 13, color: '#a1a1aa', fontWeight: '600' },
  saveBtn: { backgroundColor: '#6366f1', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  saveBtnText: { fontSize: 13, color: '#fff', fontWeight: '700' },
  editBtn: { backgroundColor: '#6366f122', borderRadius: 8, padding: 8 },
  statusRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: '#1c1c1c', borderWidth: 1, borderColor: '#2a2a2a',
  },
  statusChipText: { fontSize: 12, color: '#71717a', fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 50, gap: 14 },
  finRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, minHeight: 28 },
  finLabel: { fontSize: 12, color: '#71717a', flex: 0.4 },
  finValue: { fontSize: 13, color: '#f4f4f5', fontWeight: '600', flex: 0.6, textAlign: 'right' },
  finInput: {
    flex: 0.6, fontSize: 13, color: '#f4f4f5', fontWeight: '600', textAlign: 'right',
    backgroundColor: '#27272a', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
  },
  divider: { height: 1, backgroundColor: '#27272a' },
  notesInput: {
    fontSize: 13, color: '#f4f4f5', minHeight: 60,
    backgroundColor: '#141414', borderRadius: 8, padding: 10,
  },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  historyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#6366f1' },
  historyText: { fontSize: 13, color: '#f4f4f5' },
  historyTime: { fontSize: 10, color: '#52525b' },
  actions: { gap: 10, marginTop: 8 },
  soldBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#22c55e', borderRadius: 14, padding: 16,
  },
  soldBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  shipBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#6366f1', borderRadius: 14, padding: 16,
  },
  shipBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  dupBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#6366f122', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#6366f133',
  },
  dupBtnText: { fontSize: 14, color: '#6366f1', fontWeight: '600' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#7f1d1d22', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#ef444433',
  },
  deleteBtnText: { fontSize: 14, color: '#ef4444', fontWeight: '600' },
  notFound: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 16, color: '#71717a' },
  backLink: { fontSize: 15, color: '#6366f1', fontWeight: '600' },
  sheetContent: { gap: 14 },
  sheetLabel: { fontSize: 12, color: '#71717a', fontWeight: '600' },
  sheetInput: {
    backgroundColor: '#141414', borderRadius: 12, padding: 14,
    fontSize: 16, color: '#f4f4f5', borderWidth: 1, borderColor: '#2a2a2a',
  },
  platformChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  platformChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100,
    backgroundColor: '#1c1c1c', borderWidth: 1, borderColor: '#2a2a2a',
  },
  platformChipActive: { backgroundColor: '#6366f122', borderColor: '#6366f166' },
  platformChipText: { fontSize: 13, color: '#a1a1aa', fontWeight: '600' },
  salePreview: {
    backgroundColor: '#141414', borderRadius: 12, padding: 12, gap: 8,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  sheetBtn: {
    backgroundColor: '#6366f1', borderRadius: 14, padding: 16, alignItems: 'center',
  },
  sheetBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
