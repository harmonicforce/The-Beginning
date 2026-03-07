import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore, itemsRemaining } from '../store/session';
import { useInventoryStore } from '../store/inventory';
import { FREE_TIER_LIMIT } from '../constants/platforms';

interface PlanCardProps {
  name: string;
  price: string;
  features: string[];
  isCurrentPlan: boolean;
  isBestValue?: boolean;
  onSelect: () => void;
}

function PlanCard({ name, price, features, isCurrentPlan, isBestValue, onSelect }: PlanCardProps) {
  return (
    <TouchableOpacity
      onPress={onSelect}
      disabled={isCurrentPlan}
      style={[
        styles.planCard,
        isCurrentPlan && styles.currentPlan,
        isBestValue && styles.bestValueCard,
      ]}
      activeOpacity={0.8}
    >
      {isBestValue && (
        <View style={styles.bestValueBadge}>
          <Text style={styles.bestValueText}>BEST VALUE</Text>
        </View>
      )}
      <View style={styles.planHeader}>
        <Text style={styles.planName}>{name}</Text>
        <Text style={styles.planPrice}>{price}</Text>
      </View>
      {features.map((f, i) => (
        <View key={i} style={styles.featureRow}>
          <Ionicons name="checkmark-circle" size={16} color={isBestValue ? '#6366f1' : '#22c55e'} />
          <Text style={styles.featureText}>{f}</Text>
        </View>
      ))}
      <View style={[styles.planBtn, isCurrentPlan && styles.currentPlanBtn]}>
        <Text style={[styles.planBtnText, isCurrentPlan && styles.currentPlanBtnText]}>
          {isCurrentPlan ? 'Current Plan' : `Upgrade to ${name}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AccountScreen() {
  const { isPro, monthlyCount, setIsPro } = useSessionStore();
  const items = useInventoryStore((s) => s.items);
  const remaining = itemsRemaining(monthlyCount, isPro);

  const handleUpgrade = (plan: 'pro' | 'team') => {
    Alert.alert(
      'Coming Soon',
      'In-app purchases will be enabled in the next update. Stay tuned!',
      [{ text: 'OK' }]
    );
  };

  // DEV: toggle Pro for testing
  const handleDevTogglePro = () => {
    Alert.alert(
      'Dev Mode',
      `Toggle Pro status to ${!isPro ? 'ON' : 'OFF'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Toggle', onPress: () => setIsPro(!isPro) },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Current status */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View>
            <Text style={styles.currentPlanLabel}>Current Plan</Text>
            <Text style={styles.planLabel}>{isPro ? '⭐ Pro' : 'Free'}</Text>
          </View>
          <TouchableOpacity onPress={handleDevTogglePro} style={styles.devBtn}>
            <Text style={styles.devBtnText}>DEV</Text>
          </TouchableOpacity>
        </View>

        {!isPro && (
          <View style={styles.usageBar}>
            <View style={styles.usageHeader}>
              <Text style={styles.usageLabel}>Monthly Usage</Text>
              <Text style={styles.usageCount}>{monthlyCount}/{FREE_TIER_LIMIT}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min((monthlyCount / FREE_TIER_LIMIT) * 100, 100)}%`,
                    backgroundColor: monthlyCount >= FREE_TIER_LIMIT ? '#ef4444' : '#6366f1',
                  },
                ]}
              />
            </View>
            <Text style={styles.usageRemaining}>
              {remaining > 0 ? `${remaining} items remaining this month` : 'Limit reached — upgrade to continue'}
            </Text>
          </View>
        )}

        {isPro && (
          <View style={styles.proStats}>
            <View style={styles.proStat}>
              <Text style={styles.proStatValue}>{items.length}</Text>
              <Text style={styles.proStatLabel}>Total Items</Text>
            </View>
            <View style={styles.proStat}>
              <Text style={styles.proStatValue}>{monthlyCount}</Text>
              <Text style={styles.proStatLabel}>This Month</Text>
            </View>
          </View>
        )}
      </View>

      {/* Plans */}
      <Text style={styles.sectionTitle}>UPGRADE PLAN</Text>

      <PlanCard
        name="Free"
        price="$0/month"
        features={[
          '10 items/month',
          'QUICK-ADD mode only',
          'All 7 categories',
          'Local inventory storage',
        ]}
        isCurrentPlan={!isPro}
        onSelect={() => {}}
      />

      <PlanCard
        name="Pro"
        price="$9.99/month"
        features={[
          'Unlimited items',
          'Full CORE mode analysis',
          '3-comp pricing engine',
          '4-platform listing copy',
          'All 7 categories',
          'Export to clipboard',
        ]}
        isCurrentPlan={isPro}
        isBestValue
        onSelect={() => handleUpgrade('pro')}
      />

      <PlanCard
        name="Team"
        price="$24.99/month"
        features={[
          'Everything in Pro',
          '3 user seats',
          'Shared inventory',
          'Export reports',
          'Priority support',
        ]}
        isCurrentPlan={false}
        onSelect={() => handleUpgrade('team')}
      />

      <Text style={styles.disclaimer}>
        Subscriptions are billed monthly. Cancel anytime. Pricing is in USD.
        In-app purchases processed by Apple App Store or Google Play.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, gap: 14, paddingBottom: 50 },
  statusCard: {
    backgroundColor: '#1c1c1c',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 14,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  currentPlanLabel: { fontSize: 11, color: '#71717a', fontWeight: '600', letterSpacing: 1 },
  planLabel: { fontSize: 22, fontWeight: '800', color: '#f4f4f5', marginTop: 2 },
  devBtn: {
    backgroundColor: '#27272a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  devBtnText: { fontSize: 10, color: '#71717a', fontWeight: '700' },
  usageBar: { gap: 8 },
  usageHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  usageLabel: { fontSize: 13, color: '#a1a1aa' },
  usageCount: { fontSize: 13, fontWeight: '700', color: '#f4f4f5' },
  progressTrack: {
    height: 6,
    backgroundColor: '#27272a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  usageRemaining: { fontSize: 12, color: '#71717a' },
  proStats: { flexDirection: 'row', gap: 16 },
  proStat: { alignItems: 'center' },
  proStatValue: { fontSize: 24, fontWeight: '800', color: '#6366f1' },
  proStatLabel: { fontSize: 11, color: '#71717a' },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#52525b',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  planCard: {
    backgroundColor: '#1c1c1c',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 10,
  },
  currentPlan: {
    borderColor: '#22c55e44',
    backgroundColor: '#14532d11',
  },
  bestValueCard: {
    borderColor: '#6366f166',
    backgroundColor: '#6366f111',
  },
  bestValueBadge: {
    backgroundColor: '#6366f1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  bestValueText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  planName: { fontSize: 18, fontWeight: '800', color: '#f4f4f5' },
  planPrice: { fontSize: 16, fontWeight: '700', color: '#a1a1aa' },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: { fontSize: 13, color: '#d4d4d8', flex: 1 },
  planBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  currentPlanBtn: {
    backgroundColor: '#27272a',
  },
  planBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  currentPlanBtnText: { color: '#52525b' },
  disclaimer: {
    fontSize: 11,
    color: '#52525b',
    textAlign: 'center',
    lineHeight: 16,
  },
});
