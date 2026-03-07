import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInventoryStore } from '../../store/inventory';
import { Item, Category, ItemStatus } from '../../types/item';
import { CATEGORY_CONFIG, CATEGORIES } from '../../types/categories';
import { ConfidenceBadge } from '../../components/ConfidenceBadge';
import { formatCurrency } from '../../lib/pricing';

const STATUS_OPTIONS: ItemStatus[] = ['Intake', 'Photo Queue', 'Research', 'Listed', 'Sold', 'Shipped'];

function ItemRow({ item }: { item: Item }) {
  const config = CATEGORY_CONFIG[item.category];
  const id = item.identification as Record<string, unknown>;
  const name =
    (id.cardName as string) ||
    (id.model as string) ||
    (id.productName as string) ||
    (id.characterName as string) ||
    (id.modelName as string) ||
    'Unknown Item';

  return (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
      style={styles.itemRow}
      activeOpacity={0.7}
    >
      <View style={[styles.categoryBar, { backgroundColor: config.color }]} />
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName} numberOfLines={1}>{name}</Text>
          <ConfidenceBadge confidence={item.confidence} size="sm" />
        </View>
        <View style={styles.itemMeta}>
          <Text style={styles.skuText}>{item.sku}</Text>
          <View style={styles.metaSeparator} />
          <Text style={[styles.statusText, statusColor(item.status)]}>{item.status}</Text>
        </View>
        {item.research && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Target</Text>
            <Text style={styles.targetPrice}>
              {formatCurrency(item.research.targetSellPrice)}
            </Text>
            <Text style={styles.priceLabel}>Paid</Text>
            <Text style={styles.paidPrice}>${item.purchasePrice}</Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color="#52525b" />
    </TouchableOpacity>
  );
}

function statusColor(status: ItemStatus) {
  const colors: Record<ItemStatus, string> = {
    Intake: '#71717a',
    'Photo Queue': '#f59e0b',
    Research: '#6366f1',
    Listed: '#22c55e',
    Sold: '#3b82f6',
    Shipped: '#8b5cf6',
  };
  return { color: colors[status] };
}

export default function InventoryScreen() {
  const items = useInventoryStore((s) => s.items);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<Category | null>(null);
  const [filterStatus, setFilterStatus] = useState<ItemStatus | null>(null);

  const filtered = items.filter((item) => {
    if (filterCategory && item.category !== filterCategory) return false;
    if (filterStatus && item.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      const id = item.identification as Record<string, unknown>;
      const name = String(
        id.cardName || id.model || id.productName || id.characterName || id.modelName || ''
      ).toLowerCase();
      if (!name.includes(q) && !item.sku.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color="#71717a" style={styles.searchIcon} />
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search items or SKU..."
          placeholderTextColor="#52525b"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color="#71717a" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category filter */}
      <FlatList
        horizontal
        data={[null, ...CATEGORIES] as (Category | null)[]}
        keyExtractor={(item) => item ?? 'all'}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
        renderItem={({ item: cat }) => {
          const isSelected = filterCategory === cat;
          const config = cat ? CATEGORY_CONFIG[cat] : null;
          return (
            <TouchableOpacity
              onPress={() => setFilterCategory(cat)}
              style={[
                styles.filterChip,
                isSelected && { backgroundColor: (config?.color ?? '#6366f1') + '33', borderColor: config?.color ?? '#6366f1' },
              ]}
              activeOpacity={0.7}
            >
              {config && <Text style={{ fontSize: 12 }}>{config.icon}</Text>}
              <Text style={[styles.filterChipText, isSelected && { color: config?.color ?? '#6366f1' }]}>
                {cat ?? 'All'}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Results count */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
        </Text>
        {(filterCategory || filterStatus || search) && (
          <TouchableOpacity
            onPress={() => {
              setFilterCategory(null);
              setFilterStatus(null);
              setSearch('');
            }}
          >
            <Text style={styles.clearFilters}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ItemRow item={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>
              {items.length === 0 ? 'No items yet. Start an intake to add items.' : 'No items match your filters.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1c',
    margin: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  searchIcon: { marginRight: 8 },
  search: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: '#f4f4f5',
  },
  filterBar: {
    paddingHorizontal: 12,
    gap: 8,
    paddingBottom: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1c1c1c',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  filterChipText: {
    fontSize: 13,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsText: { fontSize: 12, color: '#52525b' },
  clearFilters: { fontSize: 12, color: '#6366f1', fontWeight: '600' },
  listContent: { paddingHorizontal: 12, paddingBottom: 40, gap: 8 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1c',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  categoryBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  itemContent: {
    flex: 1,
    padding: 12,
    gap: 5,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f4f4f5',
    flex: 1,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  skuText: { fontSize: 11, color: '#52525b', fontFamily: 'monospace' },
  metaSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#3f3f46',
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceLabel: { fontSize: 11, color: '#71717a' },
  targetPrice: { fontSize: 13, fontWeight: '700', color: '#22c55e' },
  paidPrice: { fontSize: 13, fontWeight: '600', color: '#a1a1aa' },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 14, color: '#71717a', textAlign: 'center', lineHeight: 22, paddingHorizontal: 30 },
});
