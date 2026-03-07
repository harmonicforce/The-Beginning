import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Category, Protocol } from '../../types/item';
import { useSessionStore, canAddItem } from '../../store/session';
import { CATEGORY_CONFIG } from '../../types/categories';

interface ProtocolOptionProps {
  protocol: Protocol;
  title: string;
  time: string;
  description: string;
  features: string[];
  isSelected: boolean;
  isLocked: boolean;
  onSelect: () => void;
}

function ProtocolOption({
  protocol,
  title,
  time,
  description,
  features,
  isSelected,
  isLocked,
  onSelect,
}: ProtocolOptionProps) {
  return (
    <TouchableOpacity
      onPress={isLocked ? undefined : onSelect}
      style={[
        styles.option,
        isSelected && styles.optionSelected,
        isLocked && styles.optionLocked,
      ]}
      activeOpacity={isLocked ? 1 : 0.7}
    >
      <View style={styles.optionHeader}>
        <View style={styles.optionTitleRow}>
          <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
            {title}
          </Text>
          {isLocked && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          )}
        </View>
        <View style={styles.timeChip}>
          <Ionicons name="time-outline" size={12} color="#71717a" />
          <Text style={styles.timeText}>{time}</Text>
        </View>
      </View>

      <Text style={styles.optionDesc}>{description}</Text>

      <View style={styles.featureList}>
        {features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={[styles.featureDot, isSelected && { backgroundColor: '#6366f1' }]} />
            <Text style={[styles.featureText, isLocked && styles.featureTextLocked]}>{f}</Text>
          </View>
        ))}
      </View>

      {isSelected && (
        <View style={styles.selectedIndicator}>
          <Ionicons name="checkmark-circle" size={20} color="#6366f1" />
          <Text style={styles.selectedText}>Selected</Text>
        </View>
      )}

      {isLocked && (
        <View style={styles.lockOverlay}>
          <Ionicons name="lock-closed" size={14} color="#f59e0b" />
          <Text style={styles.lockText}>Upgrade to Pro to unlock CORE mode</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function ProtocolSelectScreen() {
  const { category } = useLocalSearchParams<{ category: Category }>();
  const { isPro, monthlyCount, startIntake } = useSessionStore();
  const [selected, setSelected] = React.useState<Protocol>('core');

  const config = category ? CATEGORY_CONFIG[category] : null;

  const handleContinue = () => {
    if (!category) return;
    startIntake(category, selected);
    router.push('/intake/capture');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Category indicator */}
      {config && (
        <View style={[styles.catBadge, { borderColor: config.color + '44' }]}>
          <Text style={styles.catIcon}>{config.icon}</Text>
          <Text style={[styles.catLabel, { color: config.color }]}>{category}</Text>
          <Text style={styles.catName}>{config.label}</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>Choose Analysis Mode</Text>
        <Text style={styles.subtitle}>
          QUICK-ADD gets you an ID in ~2 min. CORE delivers full pricing and listing copy in ~12 min.
        </Text>
      </View>

      <ProtocolOption
        protocol="quick"
        title="QUICK-ADD"
        time="~2 min"
        description="Fast identification for bulk intake, sourcing events, or on-the-spot decisions."
        features={[
          'Item identification & confidence score',
          'Auto-generated SKU',
          'Paste-ready inventory row',
          'Category-specific fields',
        ]}
        isSelected={selected === 'quick'}
        isLocked={false}
        onSelect={() => setSelected('quick')}
      />

      <ProtocolOption
        protocol="core"
        title="CORE"
        time="~12 min"
        description="Full intake with market research, 3-comp pricing, and platform-optimized listing copy."
        features={[
          'Everything in QUICK-ADD',
          '3-comp weighted avg pricing',
          'Target & minimum accept prices',
          'eBay, Facebook, TCGPlayer, Mercari listings',
          'Market velocity tier',
          'Market notes & insights',
        ]}
        isSelected={selected === 'core'}
        isLocked={!isPro}
        onSelect={() => setSelected('core')}
      />

      <TouchableOpacity
        onPress={handleContinue}
        style={styles.continueBtn}
        activeOpacity={0.85}
      >
        <Text style={styles.continueBtnText}>
          Continue with {selected === 'quick' ? 'QUICK-ADD' : 'CORE'} →
        </Text>
      </TouchableOpacity>

      {!isPro && selected === 'core' && (
        <View style={styles.upgradeBanner}>
          <Text style={styles.upgradeBannerText}>
            🔒 CORE mode requires Pro ($9.99/month). Tap above to select QUICK-ADD, or upgrade.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1c1c1c',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  catIcon: { fontSize: 18 },
  catLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  catName: { fontSize: 13, color: '#71717a' },
  header: { gap: 6 },
  title: { fontSize: 22, fontWeight: '800', color: '#f4f4f5' },
  subtitle: { fontSize: 14, color: '#71717a', lineHeight: 22 },
  option: {
    backgroundColor: '#1c1c1c',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 12,
  },
  optionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#6366f111',
  },
  optionLocked: {
    opacity: 0.6,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f4f4f5',
    letterSpacing: 0.5,
  },
  optionTitleSelected: { color: '#a5b4fc' },
  proBadge: {
    backgroundColor: '#f59e0b22',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#f59e0b44',
  },
  proBadgeText: { fontSize: 10, fontWeight: '800', color: '#f59e0b', letterSpacing: 1 },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#27272a',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeText: { fontSize: 12, color: '#71717a' },
  optionDesc: { fontSize: 13, color: '#a1a1aa', lineHeight: 20 },
  featureList: { gap: 6 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#52525b',
  },
  featureText: { fontSize: 13, color: '#a1a1aa' },
  featureTextLocked: { color: '#52525b' },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedText: { fontSize: 13, color: '#6366f1', fontWeight: '600' },
  lockOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#713f1222',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f59e0b22',
  },
  lockText: { fontSize: 12, color: '#f59e0b', flex: 1 },
  continueBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 4,
  },
  continueBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  upgradeBanner: {
    backgroundColor: '#713f1222',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f59e0b33',
  },
  upgradeBannerText: { fontSize: 13, color: '#f59e0b', lineHeight: 20 },
});
