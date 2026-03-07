import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSessionStore, canAddItem, itemsRemaining } from '../../store/session';
import { useInventoryStore } from '../../store/inventory';
import { CATEGORY_CONFIG, CATEGORIES } from '../../types/categories';
import { Category } from '../../types/item';
import { ConfidenceBadge } from '../../components/ConfidenceBadge';

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

export default function HomeScreen() {
  const { monthlyCount, isPro, apiKey } = useSessionStore();
  const items = useInventoryStore((s) => s.items);

  const remaining = itemsRemaining(monthlyCount, isPro);
  const canAdd = canAddItem(monthlyCount, isPro);

  const recentItems = items.slice(0, 5);
  const listedCount = items.filter((i) => i.status === 'Listed').length;
  const soldCount = items.filter((i) => i.status === 'Sold').length;

  const handleQuickStart = (category: Category) => {
    if (!apiKey) {
      Alert.alert(
        'API Key Required',
        'Please add your Anthropic API key in Settings before analyzing items.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Settings', onPress: () => router.push('/settings') },
        ]
      );
      return;
    }
    if (!canAdd) {
      Alert.alert(
        'Free Tier Limit Reached',
        `You've used all 10 free items this month. Upgrade to Pro for unlimited items.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/account') },
        ]
      );
      return;
    }
    router.push({ pathname: '/intake/protocol', params: { category } });
  };

  const handleNewIntake = () => {
    if (!apiKey) {
      Alert.alert(
        'API Key Required',
        'Please add your Anthropic API key in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => router.push('/settings') },
        ]
      );
      return;
    }
    if (!canAdd) {
      Alert.alert(
        'Free Tier Limit Reached',
        `Upgrade to Pro for unlimited items.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/account') },
        ]
      );
      return;
    }
    router.push('/intake/category');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Alert if no API key */}
      {!apiKey && (
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={styles.alertBanner}
          activeOpacity={0.8}
        >
          <Text style={styles.alertIcon}>⚠️</Text>
          <View style={styles.alertText}>
            <Text style={styles.alertTitle}>API Key Required</Text>
            <Text style={styles.alertSub}>Tap to add your Anthropic API key</Text>
          </View>
          <Text style={styles.alertArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatCard
          label={isPro ? 'Items (Pro)' : 'Free Items'}
          value={isPro ? items.length : `${monthlyCount}/10`}
          sub={isPro ? 'Unlimited' : `${remaining} remaining`}
        />
        <StatCard label="Listed" value={listedCount} />
        <StatCard label="Sold" value={soldCount} />
      </View>

      {/* New intake CTA */}
      <TouchableOpacity onPress={handleNewIntake} style={styles.ctaButton} activeOpacity={0.85}>
        <Text style={styles.ctaIcon}>📸</Text>
        <View>
          <Text style={styles.ctaTitle}>New Item Intake</Text>
          <Text style={styles.ctaSub}>Photo → AI Analysis → Listing</Text>
        </View>
      </TouchableOpacity>

      {/* Quick-launch categories */}
      <View>
        <Text style={styles.sectionLabel}>QUICK LAUNCH</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => handleQuickStart(cat)}
                style={[styles.catTile, { borderColor: config.color + '44' }]}
                activeOpacity={0.7}
              >
                <Text style={styles.catIcon}>{config.icon}</Text>
                <Text style={[styles.catLabel, { color: config.color }]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Recent items */}
      {recentItems.length > 0 && (
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>RECENT ITEMS</Text>
            <TouchableOpacity onPress={() => router.push('/inventory')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentItems.map((item) => {
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
                key={item.id}
                onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                style={styles.recentItem}
                activeOpacity={0.7}
              >
                <View style={[styles.catDot, { backgroundColor: config.color }]} />
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName} numberOfLines={1}>{name}</Text>
                  <Text style={styles.recentSku}>{item.sku}</Text>
                </View>
                <ConfidenceBadge confidence={item.confidence} size="sm" />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>No items yet</Text>
          <Text style={styles.emptyText}>
            Tap "New Item Intake" to photograph and analyze your first item.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 16,
    gap: 20,
    paddingBottom: 40,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#713f1244',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f59e0b44',
    gap: 10,
  },
  alertIcon: { fontSize: 18 },
  alertText: { flex: 1, gap: 2 },
  alertTitle: { fontSize: 13, fontWeight: '700', color: '#f59e0b' },
  alertSub: { fontSize: 12, color: '#a1a1aa' },
  alertArrow: { fontSize: 22, color: '#f59e0b' },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1c1c1c',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f4f4f5',
  },
  statLabel: {
    fontSize: 11,
    color: '#71717a',
    fontWeight: '600',
  },
  statSub: {
    fontSize: 10,
    color: '#52525b',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 18,
  },
  ctaIcon: { fontSize: 32 },
  ctaTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  ctaSub: { fontSize: 13, color: '#c7d2fe', marginTop: 2 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#52525b',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  seeAll: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catTile: {
    width: '13%',
    aspectRatio: 1,
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 2,
    flexGrow: 1,
  },
  catIcon: { fontSize: 20 },
  catLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 13, fontWeight: '600', color: '#f4f4f5' },
  recentSku: { fontSize: 11, color: '#52525b', marginTop: 2 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#f4f4f5' },
  emptyText: { fontSize: 14, color: '#71717a', textAlign: 'center', lineHeight: 22 },
});
