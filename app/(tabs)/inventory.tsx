import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInventoryStore } from '../../store/inventory';
import { useUIStore } from '../../store/uiStore';
import { Item, Category, ItemStatus } from '../../types/item';
import { CATEGORY_CONFIG, CATEGORIES } from '../../types/categories';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CategoryBadge } from '../../components/ui/CategoryBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { useDebounce } from '../../hooks/useDebounce';
import { formatCurrency } from '../../lib/format';

type SortKey = 'date' | 'price' | 'status' | 'category';
type SortDir = 'asc' | 'desc';

const STATUS_ORDER: Record<ItemStatus, number> = {
  Intake: 0, 'Photo Queue': 1, Research: 2, Listed: 3, Sold: 4, Shipped: 5,
};

function getItemName(item: Item): string {
  const id = item.identification as Record<string, unknown>;
  return String(
    id.cardName || id.model || id.productName || id.characterName || id.modelName || id.itemType || 'Unknown'
  );
}

function ItemRow({ item, viewMode }: { item: Item; viewMode: 'list' | 'grid' }) {
  const config = CATEGORY_CONFIG[item.category];
  const name = item.displayName ?? getItemName(item);

  if (viewMode === 'grid') {
    return (
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
        style={styles.gridCard}
        activeOpacity={0.7}
      >
        <View style={styles.gridHeader}>
          <CategoryBadge category={item.category} size="sm" />
          <StatusBadge status={item.status} />
        </View>
        <Text style={styles.gridName} numberOfLines={2}>{name}</Text>
        <Text style={styles.gridSku}>{item.sku}</Text>
        <Text style={styles.gridPrice}>
          {formatCurrency(item.research?.targetSellPrice ?? item.purchasePrice)}
        </Text>
      </TouchableOpacity>
    );
  }

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
          <StatusBadge status={item.status} />
        </View>
        <View style={styles.itemMeta}>
          <Text style={styles.skuText}>{item.sku}</Text>
          <View style={styles.metaDot} />
          <CategoryBadge category={item.category} size="sm" />
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Target</Text>
          <Text style={styles.targetPrice}>
            {formatCurrency(item.research?.targetSellPrice ?? 0)}
          </Text>
          <Text style={styles.priceLabel}>Paid</Text>
          <Text style={styles.paidPrice}>{formatCurrency(item.purchasePrice)}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#52525b" />
    </TouchableOpacity>
  );
}

export default function InventoryScreen() {
  const items = useInventoryStore((s) => s.items);
  const loadItems = useInventoryStore((s) => s.loadItems);
  const { inventoryViewMode, setInventoryViewMode } = useUIStore();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [filterCategory, setFilterCategory] = useState<Category | null>(null);
  const [filterStatus, setFilterStatus] = useState<ItemStatus | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [refreshing, setRefreshing] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const filtered = useMemo(() => {
    let result = [...items];

    if (filterCategory) result = result.filter((i) => i.category === filterCategory);
    if (filterStatus) result = result.filter((i) => i.status === filterStatus);

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((item) => {
        const name = (item.displayName ?? getItemName(item)).toLowerCase();
        return name.includes(q) || item.sku.toLowerCase().includes(q);
      });
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'date':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'price':
          cmp = (a.research?.targetSellPrice ?? a.purchasePrice) - (b.research?.targetSellPrice ?? b.purchasePrice);
          break;
        case 'status':
          cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
          break;
        case 'category':
          cmp = a.category.localeCompare(b.category);
          break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [items, filterCategory, filterStatus, debouncedSearch, sortKey, sortDir]);

  const totalValue = useMemo(
    () => filtered.reduce((sum, i) => sum + (i.research?.targetSellPrice ?? i.purchasePrice), 0),
    [filtered]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  }, [loadItems]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setShowSortMenu(false);
  };

  const hasFilters = !!filterCategory || !!filterStatus || !!search;

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

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.toolLeft}>
          <Text style={styles.resultCount}>
            {filtered.length} item{filtered.length !== 1 ? 's' : ''}
            {filtered.length > 0 && ` · ${formatCurrency(totalValue)}`}
          </Text>
        </View>
        <View style={styles.toolRight}>
          <TouchableOpacity
            onPress={() => setShowSortMenu(!showSortMenu)}
            style={styles.toolBtn}
          >
            <Ionicons name="swap-vertical" size={16} color="#71717a" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setInventoryViewMode(inventoryViewMode === 'list' ? 'grid' : 'list')}
            style={styles.toolBtn}
          >
            <Ionicons name={inventoryViewMode === 'list' ? 'grid' : 'list'} size={16} color="#71717a" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sort menu */}
      {showSortMenu && (
        <View style={styles.sortMenu}>
          {([['date', 'Date'], ['price', 'Price'], ['status', 'Status'], ['category', 'Category']] as [SortKey, string][]).map(
            ([key, label]) => (
              <TouchableOpacity key={key} onPress={() => toggleSort(key)} style={styles.sortItem}>
                <Text style={[styles.sortItemText, sortKey === key && { color: '#6366f1' }]}>
                  {label}
                </Text>
                {sortKey === key && (
                  <Ionicons
                    name={sortDir === 'desc' ? 'arrow-down' : 'arrow-up'}
                    size={14}
                    color="#6366f1"
                  />
                )}
              </TouchableOpacity>
            )
          )}
        </View>
      )}

      {/* Category filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
      >
        <TouchableOpacity
          onPress={() => setFilterCategory(null)}
          style={[styles.filterChip, !filterCategory && styles.filterChipActive]}
        >
          <Text style={[styles.filterChipText, !filterCategory && { color: '#6366f1' }]}>All</Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          const isSelected = filterCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setFilterCategory(isSelected ? null : cat)}
              style={[
                styles.filterChip,
                isSelected && { backgroundColor: config.color + '22', borderColor: config.color + '66' },
              ]}
            >
              <Text style={{ fontSize: 12 }}>{config.icon}</Text>
              <Text style={[styles.filterChipText, isSelected && { color: config.color }]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Clear filters */}
      {hasFilters && (
        <TouchableOpacity
          onPress={() => { setFilterCategory(null); setFilterStatus(null); setSearch(''); }}
          style={styles.clearBtn}
        >
          <Text style={styles.clearBtnText}>Clear filters</Text>
        </TouchableOpacity>
      )}

      {/* List */}
      {filtered.length > 0 ? (
        <FlashList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={inventoryViewMode === 'grid' ? 2 : 1}
          estimatedItemSize={inventoryViewMode === 'grid' ? 160 : 90}
          renderItem={({ item }) => <ItemRow item={item} viewMode={inventoryViewMode} />}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
          }
        />
      ) : (
        <EmptyState
          icon="cube-outline"
          title={items.length === 0 ? 'No items yet' : 'No matches'}
          message={items.length === 0 ? 'Start an intake to add your first item.' : 'Try adjusting your search or filters.'}
          actionLabel={items.length === 0 ? 'Add Item' : undefined}
          onAction={items.length === 0 ? () => router.push('/intake/category') : undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1c1c1c', margin: 12, marginBottom: 0,
    borderRadius: 12, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  searchIcon: { marginRight: 8 },
  search: { flex: 1, padding: 12, fontSize: 14, color: '#f4f4f5' },
  toolbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  toolLeft: { flex: 1 },
  toolRight: { flexDirection: 'row', gap: 8 },
  resultCount: { fontSize: 12, color: '#71717a', fontWeight: '600' },
  toolBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#1c1c1c', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  sortMenu: {
    marginHorizontal: 12, backgroundColor: '#1c1c1c', borderRadius: 12,
    borderWidth: 1, borderColor: '#2a2a2a', padding: 4, marginBottom: 4,
  },
  sortItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  sortItemText: { fontSize: 13, color: '#a1a1aa', fontWeight: '600' },
  filterBar: { paddingHorizontal: 12, gap: 8, paddingBottom: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#1c1c1c', borderRadius: 100,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  filterChipActive: { backgroundColor: '#6366f122', borderColor: '#6366f166' },
  filterChipText: { fontSize: 13, color: '#a1a1aa', fontWeight: '600' },
  clearBtn: { alignSelf: 'flex-end', marginRight: 16, marginBottom: 4 },
  clearBtnText: { fontSize: 12, color: '#6366f1', fontWeight: '600' },
  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1c1c1c', borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  categoryBar: { width: 4, alignSelf: 'stretch' },
  itemContent: { flex: 1, padding: 12, gap: 5 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#f4f4f5', flex: 1 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  skuText: { fontSize: 11, color: '#52525b', fontFamily: 'monospace' },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#3f3f46' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceLabel: { fontSize: 11, color: '#71717a' },
  targetPrice: { fontSize: 13, fontWeight: '700', color: '#22c55e' },
  paidPrice: { fontSize: 13, fontWeight: '600', color: '#a1a1aa' },
  gridCard: {
    flex: 1, margin: 4, backgroundColor: '#1c1c1c', borderRadius: 14,
    padding: 12, borderWidth: 1, borderColor: '#2a2a2a', gap: 6,
  },
  gridHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gridName: { fontSize: 13, fontWeight: '600', color: '#f4f4f5' },
  gridSku: { fontSize: 10, color: '#52525b', fontFamily: 'monospace' },
  gridPrice: { fontSize: 16, fontWeight: '800', color: '#22c55e' },
});
