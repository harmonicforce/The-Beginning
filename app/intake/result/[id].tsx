import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInventoryStore } from '../../../store/inventory';
import { CATEGORY_CONFIG } from '../../../types/categories';
import { ConfidenceBadge } from '../../../components/ConfidenceBadge';
import { PricingPanel } from '../../../components/PricingPanel';
import { ListingCard } from '../../../components/ListingCard';
import { InventoryRow } from '../../../components/InventoryRow';

type Tab = 'id' | 'pricing' | 'listings' | 'export';

function IdentificationView({ item }: { item: ReturnType<typeof useInventoryStore.getState>['items'][0] }) {
  const id = item.identification as Record<string, unknown>;
  const config = CATEGORY_CONFIG[item.category];

  const fields = Object.entries(id).filter(([, v]) => v !== null && v !== undefined && v !== '');

  return (
    <View style={styles.tabContent}>
      <View style={styles.idHeader}>
        <ConfidenceBadge
          confidence={item.confidence}
          notes={item.confidenceNotes}
          showNotes
          size="lg"
        />
      </View>

      <View style={styles.fieldCard}>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>SKU</Text>
          <Text style={[styles.fieldValue, styles.skuValue]}>{item.sku}</Text>
        </View>
        <View style={styles.fieldDivider} />
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Category</Text>
          <Text style={[styles.fieldValue, { color: config.color }]}>
            {config.icon} {item.category}
          </Text>
        </View>
        <View style={styles.fieldDivider} />
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Protocol</Text>
          <Text style={styles.fieldValue}>{item.protocol.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.fieldCard}>
        {fields.map(([key, value], i) => (
          <View key={key}>
            {i > 0 && <View style={styles.fieldDivider} />}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{humanizeKey(key)}</Text>
              <Text style={styles.fieldValue} numberOfLines={2}>
                {String(value)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useInventoryStore((s) => s.getItemById(id));
  const [activeTab, setActiveTab] = useState<Tab>('id');

  if (!item) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Item not found</Text>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={styles.homeLink}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const config = CATEGORY_CONFIG[item.category];

  const tabs: { id: Tab; label: string; locked?: boolean }[] = [
    { id: 'id', label: 'ID' },
    { id: 'pricing', label: 'Pricing', locked: item.protocol === 'quick' },
    { id: 'listings', label: 'Listings', locked: item.protocol === 'quick' },
    { id: 'export', label: 'Export' },
  ];

  return (
    <View style={styles.container}>
      {/* Header summary */}
      <View style={[styles.resultHeader, { borderBottomColor: config.color + '44' }]}>
        <View style={styles.resultHeaderLeft}>
          <Text style={styles.resultCategory}>{config.icon} {item.category}</Text>
          <ConfidenceBadge confidence={item.confidence} size="sm" />
        </View>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
          style={styles.editBtn}
        >
          <Ionicons name="create-outline" size={18} color="#6366f1" />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => !tab.locked && setActiveTab(tab.id)}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            activeOpacity={tab.locked ? 0.4 : 0.7}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive, tab.locked && styles.tabTextLocked]}>
              {tab.label}
              {tab.locked && ' 🔒'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'id' && <IdentificationView item={item} />}

        {activeTab === 'pricing' && item.research && (
          <View style={styles.tabContent}>
            <PricingPanel research={item.research} />
          </View>
        )}

        {activeTab === 'listings' && item.listings && (
          <View style={styles.tabContent}>
            {(['ebay', 'facebook', 'tcgplayer', 'mercari'] as const).map((platform) => {
              const listing = item.listings![platform];
              if (!listing) return null;
              return (
                <ListingCard key={platform} platformId={platform} listing={listing} />
              );
            })}
          </View>
        )}

        {activeTab === 'export' && (
          <View style={styles.tabContent}>
            <InventoryRow item={item} />

            <TouchableOpacity
              onPress={() => router.replace('/')}
              style={styles.doneBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.doneBtnText}>✓ Done — New Intake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
              style={styles.viewDetailBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.viewDetailBtnText}>View Full Record</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  resultHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultCategory: { fontSize: 15, fontWeight: '700', color: '#f4f4f5' },
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1c',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 13,
    color: '#52525b',
    fontWeight: '600',
  },
  tabTextActive: { color: '#6366f1' },
  tabTextLocked: { color: '#3f3f46' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 50 },
  tabContent: { gap: 16 },
  idHeader: { gap: 8 },
  fieldCard: {
    backgroundColor: '#1c1c1c',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 10,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#71717a',
    flex: 0.4,
    lineHeight: 20,
  },
  fieldValue: {
    fontSize: 13,
    color: '#f4f4f5',
    fontWeight: '600',
    flex: 0.6,
    textAlign: 'right',
    lineHeight: 20,
  },
  skuValue: {
    fontFamily: 'monospace',
    color: '#a5b4fc',
  },
  fieldDivider: {
    height: 1,
    backgroundColor: '#27272a',
  },
  doneBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  doneBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  viewDetailBtn: {
    backgroundColor: '#1c1c1c',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  viewDetailBtnText: { fontSize: 14, fontWeight: '600', color: '#a1a1aa' },
  notFound: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  notFoundText: { fontSize: 16, color: '#71717a' },
  homeLink: { fontSize: 15, color: '#6366f1', fontWeight: '600' },
});
