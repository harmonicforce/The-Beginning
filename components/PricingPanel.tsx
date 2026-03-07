import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Research } from '../types/item';
import { formatCurrency } from '../lib/pricing';

interface PricingPanelProps {
  research: Research;
}

function CompRow({
  label,
  weight,
  comp,
}: {
  label: string;
  weight: string;
  comp: Research['comp1'];
}) {
  return (
    <View style={styles.compRow}>
      <View style={styles.compLeft}>
        <Text style={styles.compLabel}>{label}</Text>
        <Text style={styles.compWeight}>{weight} weight</Text>
        <Text style={styles.compSource}>{comp.source}</Text>
        {comp.notes && <Text style={styles.compNotes}>{comp.notes}</Text>}
      </View>
      <Text style={styles.compPrice}>{formatCurrency(comp.price)}</Text>
    </View>
  );
}

function velocityColor(tier: Research['velocityTier']): string {
  if (tier === 'Fast Flip') return '#22c55e';
  if (tier === 'Standard') return '#f59e0b';
  return '#ef4444';
}

export function PricingPanel({ research }: PricingPanelProps) {
  return (
    <View style={styles.container}>
      {/* Comps */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3-COMP ANALYSIS</Text>
        <CompRow label="Comp 1" weight="50%" comp={research.comp1} />
        <View style={styles.divider} />
        <CompRow label="Comp 2" weight="25%" comp={research.comp2} />
        <View style={styles.divider} />
        <CompRow label="Comp 3" weight="25%" comp={research.comp3} />
      </View>

      {/* Weighted average */}
      <View style={styles.avgSection}>
        <View style={styles.avgRow}>
          <Text style={styles.avgLabel}>Weighted Average</Text>
          <Text style={styles.avgValue}>{formatCurrency(research.weightedAvg)}</Text>
        </View>
        <View style={[styles.avgRow, styles.targetRow]}>
          <View>
            <Text style={styles.targetLabel}>Target Sell</Text>
            <Text style={styles.targetSub}>Avg × 1.07</Text>
          </View>
          <Text style={styles.targetPrice}>{formatCurrency(research.targetSellPrice)}</Text>
        </View>
        <View style={styles.avgRow}>
          <View>
            <Text style={styles.minLabel}>Min Accept</Text>
            <Text style={styles.targetSub}>Avg × 0.87</Text>
          </View>
          <Text style={styles.minPrice}>{formatCurrency(research.minAcceptPrice)}</Text>
        </View>
      </View>

      {/* Velocity */}
      <View style={styles.velocityRow}>
        <Text style={styles.velocityLabel}>Market Velocity</Text>
        <View
          style={[
            styles.velocityBadge,
            { backgroundColor: velocityColor(research.velocityTier) + '22' },
          ]}
        >
          <Text style={[styles.velocityText, { color: velocityColor(research.velocityTier) }]}>
            {research.velocityTier}
          </Text>
        </View>
      </View>

      {/* Market notes */}
      {research.marketNotes && (
        <View style={styles.notesBox}>
          <Text style={styles.notesLabel}>Market Notes</Text>
          <Text style={styles.notesText}>{research.marketNotes}</Text>
        </View>
      )}

      {research.popReport && (
        <View style={styles.notesBox}>
          <Text style={styles.notesLabel}>Pop Report</Text>
          <Text style={styles.notesText}>{research.popReport}</Text>
        </View>
      )}

      {research.gradingROI && (
        <View style={styles.notesBox}>
          <Text style={styles.notesLabel}>Grading ROI</Text>
          <Text style={styles.notesText}>{research.gradingROI}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  section: {
    backgroundColor: '#1c1c1c',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71717a',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  compRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  compLeft: {
    flex: 1,
    gap: 2,
  },
  compLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  compWeight: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '600',
  },
  compSource: {
    fontSize: 11,
    color: '#71717a',
  },
  compNotes: {
    fontSize: 11,
    color: '#52525b',
    fontStyle: 'italic',
  },
  compPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f4f4f5',
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2a2a',
  },
  avgSection: {
    backgroundColor: '#1c1c1c',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  avgRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avgLabel: {
    fontSize: 14,
    color: '#a1a1aa',
  },
  avgValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  targetRow: {
    backgroundColor: '#6366f122',
    marginHorizontal: -4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  targetLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  targetSub: {
    fontSize: 11,
    color: '#6366f1',
  },
  targetPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#22c55e',
  },
  minLabel: {
    fontSize: 13,
    color: '#a1a1aa',
  },
  minPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f59e0b',
  },
  velocityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  velocityLabel: {
    fontSize: 13,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  velocityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
  },
  velocityText: {
    fontSize: 13,
    fontWeight: '700',
  },
  notesBox: {
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 6,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71717a',
    letterSpacing: 1,
  },
  notesText: {
    fontSize: 13,
    color: '#a1a1aa',
    lineHeight: 20,
  },
});
