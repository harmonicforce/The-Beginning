import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../../store/session';
import { useInventoryStore } from '../../store/inventory';
import { useAnalyticsStore } from '../../store/analyticsStore';
import { CATEGORY_CONFIG, CATEGORIES } from '../../types/categories';
import { Category, ItemStatus } from '../../types/item';
import { formatCurrency, formatRelativeTime } from '../../lib/format';
import { hapticLight } from '../../lib/haptics';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CategoryBadge } from '../../components/ui/CategoryBadge';
import { Card } from '../../components/ui/Card';

const STATUS_PIPELINE: ItemStatus[] = ['Intake', 'Photo Queue', 'Research', 'Listed', 'Sold', 'Shipped'];

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { apiKey } = useSessionStore();
  const items = useInventoryStore((s) => s.items);
  const { recompute, itemsAddedToday, itemsListedToday, itemsSoldToday, revenueToday, statusCounts, categoryCounts } = useAnalyticsStore();

  useEffect(() => { recompute(); }, [items.length]);

  const totalValue = useMemo(() => {
    return items.reduce((sum, i) => sum + (i.research?.targetSellPrice ?? i.purchasePrice), 0);
  }, [items]);

  const topListed = useMemo(() => {
    return items
      .filter((i) => i.status === 'Listed')
      .sort((a, b) => (b.research?.targetSellPrice ?? 0) - (a.research?.targetSellPrice ?? 0))
      .slice(0, 5);
  }, [items]);

  const recentActivity = useMemo(() => {
    return [...items]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10);
  }, [items]);

  const handleNewIntake = () => {
    hapticLight();
    if (!apiKey) {
      Alert.alert('API Key Required', 'Add your Anthropic API key in Settings.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Settings', onPress: () => router.push('/settings') },
      ]);
      return;
    }
    router.push('/intake/category');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* API Key Alert */}
      {!apiKey && (
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.alertBanner} activeOpacity={0.8}>
          <Text style={{ fontSize: 18 }}>⚠️</Text>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.alertTitle}>API Key Required</Text>
            <Text style={styles.alertSub}>Tap to add your Anthropic API key</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#f59e0b" />
        </TouchableOpacity>
      )}

      {/* Today at a Glance */}
      <Card title="TODAY AT A GLANCE">
        <View style={styles.todayRow}>
          <StatCard label="Added" value={itemsAddedToday} />
          <StatCard label="Listed" value={itemsListedToday} />
          <StatCard label="Sold" value={itemsSoldToday} color="#22c55e" />
          <StatCard label="Revenue" value={formatCurrency(revenueToday)} color="#22c55e" />
        </View>
      </Card>

      {/* Pipeline Summary */}
      <Card title="PIPELINE">
        <View style={styles.pipelineRow}>
          {STATUS_PIPELINE.map((status, i) => {
            const count = statusCounts[status] ?? 0;
            return (
              <View key={status} style={styles.pipelineItem}>
                <Text style={styles.pipelineCount}>{count}</Text>
                <Text style={styles.pipelineLabel} numberOfLines={1}>{status}</Text>
                {i < STATUS_PIPELINE.length - 1 && (
                  <Ionicons name="chevron-forward" size={12} color="#3f3f46" style={styles.pipelineArrow} />
                )}
              </View>
            );
          })}
        </View>
      </Card>

      {/* Quick Action Bar */}
      <View style={styles.quickActions}>
        <TouchableOpacity onPress={handleNewIntake} style={styles.quickBtn} activeOpacity={0.8}>
          <Ionicons name="add-circle" size={24} color="#6366f1" />
          <Text style={styles.quickLabel}>Add Item</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/scanner')} style={styles.quickBtn} activeOpacity={0.8}>
          <Ionicons name="scan" size={24} color="#6366f1" />
          <Text style={styles.quickLabel}>Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/inventory')} style={styles.quickBtn} activeOpacity={0.8}>
          <Ionicons name="pricetag" size={24} color="#22c55e" />
          <Text style={styles.quickLabel}>Listed</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/analytics')} style={styles.quickBtn} activeOpacity={0.8}>
          <Ionicons name="bar-chart" size={24} color="#f59e0b" />
          <Text style={styles.quickLabel}>Analytics</Text>
        </TouchableOpacity>
      </View>

      {/* Category Breakdown */}
      <Card title="INVENTORY BY CATEGORY">
        <View style={styles.catBreakdown}>
          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat] ?? 0;
            const config = CATEGORY_CONFIG[cat];
            return (
              <View key={cat} style={styles.catRow}>
                <Text style={{ fontSize: 14 }}>{config.icon}</Text>
                <Text style={[styles.catName, { color: config.color }]}>{cat}</Text>
                <View style={styles.catBar}>
                  <View
                    style={[
                      styles.catBarFill,
                      {
                        backgroundColor: config.color,
                        width: items.length > 0 ? `${(count / items.length) * 100}%` : '0%',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.catCount}>{count}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      {/* Top Active Listings */}
      {topListed.length > 0 && (
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>TOP LISTED ITEMS</Text>
            <TouchableOpacity onPress={() => router.push('/inventory')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={topListed}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}
            renderItem={({ item }) => {
              const name = item.displayName ?? getItemName(item);
              return (
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                  style={styles.listedCard}
                  activeOpacity={0.7}
                >
                  <CategoryBadge category={item.category} size="sm" />
                  <Text style={styles.listedName} numberOfLines={2}>{name}</Text>
                  <Text style={styles.listedSku}>{item.sku}</Text>
                  <Text style={styles.listedPrice}>
                    {formatCurrency(item.research?.targetSellPrice ?? 0)}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card title="RECENT ACTIVITY">
          {recentActivity.map((item) => {
            const name = item.displayName ?? getItemName(item);
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                style={styles.activityRow}
                activeOpacity={0.7}
              >
                <View style={[styles.activityDot, { backgroundColor: CATEGORY_CONFIG[item.category].color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityName} numberOfLines={1}>{name}</Text>
                  <Text style={styles.activityMeta}>{item.sku}</Text>
                </View>
                <StatusBadge status={item.status} />
                <Text style={styles.activityTime}>{formatRelativeTime(item.updatedAt)}</Text>
              </TouchableOpacity>
            );
          })}
        </Card>
      )}

      {/* Inventory Value */}
      {items.length > 0 && (
        <Card>
          <View style={styles.valueRow}>
            <Text style={styles.valueLabel}>Total Inventory Value</Text>
            <Text style={styles.valueAmount}>{formatCurrency(totalValue)}</Text>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.valueLabel}>Total Items</Text>
            <Text style={styles.valueCount}>{items.length}</Text>
          </View>
        </Card>
      )}

      {/* Empty State */}
      {items.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48 }}>📦</Text>
          <Text style={styles.emptyTitle}>No items yet</Text>
          <Text style={styles.emptyText}>
            Tap "Add Item" to photograph and analyze your first item with AI.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function getItemName(item: { identification: unknown }): string {
  const id = item.identification as Record<string, unknown>;
  return String(
    id.cardName || id.model || id.productName || id.characterName || id.modelName || id.itemType || 'Unknown'
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#713f1244', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#f59e0b44',
  },
  alertTitle: { fontSize: 13, fontWeight: '700', color: '#f59e0b' },
  alertSub: { fontSize: 12, color: '#a1a1aa' },
  todayRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#f4f4f5' },
  statLabel: { fontSize: 10, color: '#71717a', fontWeight: '600' },
  pipelineRow: { flexDirection: 'row', alignItems: 'center' },
  pipelineItem: { flex: 1, alignItems: 'center', position: 'relative' },
  pipelineCount: { fontSize: 18, fontWeight: '800', color: '#f4f4f5' },
  pipelineLabel: { fontSize: 8, color: '#52525b', fontWeight: '600', letterSpacing: 0.3, marginTop: 2 },
  pipelineArrow: { position: 'absolute', right: -6, top: 4 },
  quickActions: { flexDirection: 'row', gap: 10 },
  quickBtn: {
    flex: 1, alignItems: 'center', gap: 6,
    backgroundColor: '#1c1c1c', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  quickLabel: { fontSize: 11, color: '#a1a1aa', fontWeight: '600' },
  catBreakdown: { gap: 8 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catName: { fontSize: 11, fontWeight: '700', width: 36 },
  catBar: { flex: 1, height: 6, backgroundColor: '#27272a', borderRadius: 3, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 3 },
  catCount: { fontSize: 12, color: '#71717a', fontWeight: '600', width: 28, textAlign: 'right' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#52525b', letterSpacing: 1.5 },
  seeAll: { fontSize: 13, color: '#6366f1', fontWeight: '600' },
  listedCard: {
    width: 150, backgroundColor: '#1c1c1c', borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: '#2a2a2a', gap: 6,
  },
  listedName: { fontSize: 13, fontWeight: '600', color: '#f4f4f5' },
  listedSku: { fontSize: 10, color: '#52525b', fontFamily: 'monospace' },
  listedPrice: { fontSize: 16, fontWeight: '800', color: '#22c55e' },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  activityDot: { width: 6, height: 6, borderRadius: 3 },
  activityName: { fontSize: 13, fontWeight: '600', color: '#f4f4f5' },
  activityMeta: { fontSize: 10, color: '#52525b', marginTop: 1 },
  activityTime: { fontSize: 10, color: '#52525b' },
  valueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  valueLabel: { fontSize: 13, color: '#71717a' },
  valueAmount: { fontSize: 18, fontWeight: '800', color: '#22c55e' },
  valueCount: { fontSize: 18, fontWeight: '800', color: '#f4f4f5' },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#f4f4f5' },
  emptyText: { fontSize: 14, color: '#71717a', textAlign: 'center', lineHeight: 22 },
});
