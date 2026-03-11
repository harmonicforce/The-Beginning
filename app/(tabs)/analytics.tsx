import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useInventoryStore } from '../../store/inventory';
import { useAnalyticsStore, TimeRange } from '../../store/analyticsStore';
import { CATEGORY_CONFIG } from '../../types/categories';
import { Card } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/format';
import { exportCSV, exportJSON } from '../../lib/export';

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: 'week', label: '7D' },
  { key: '30days', label: '30D' },
  { key: '90days', label: '90D' },
  { key: 'all', label: 'All' },
];

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

export default function AnalyticsScreen() {
  const items = useInventoryStore((s) => s.items);
  const {
    timeRange, setTimeRange, recompute,
    totalRevenue, totalCost, grossProfit, netProfit, overallROI,
    itemsAddedToday, itemsListedToday, itemsSoldToday, revenueToday,
    categoryStats, velocityDistribution, platformDistribution,
    topByProfit, topByROI,
  } = useAnalyticsStore();

  useEffect(() => { recompute(); }, [items.length, timeRange]);

  const activePlatforms = useMemo(
    () => Object.entries(platformDistribution).sort(([, a], [, b]) => b - a),
    [platformDistribution]
  );

  const handleExportCSV = () => exportCSV(items);
  const handleExportJSON = () => exportJSON(items);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Time Range Selector */}
      <View style={styles.rangeRow}>
        {TIME_RANGES.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setTimeRange(key)}
            style={[styles.rangeChip, timeRange === key && styles.rangeChipActive]}
          >
            <Text style={[styles.rangeText, timeRange === key && styles.rangeTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Today Summary */}
      <Card title="TODAY">
        <View style={styles.todayGrid}>
          <View style={styles.todayStat}>
            <Text style={styles.todayValue}>{itemsAddedToday}</Text>
            <Text style={styles.todayLabel}>Added</Text>
          </View>
          <View style={styles.todayStat}>
            <Text style={styles.todayValue}>{itemsListedToday}</Text>
            <Text style={styles.todayLabel}>Listed</Text>
          </View>
          <View style={styles.todayStat}>
            <Text style={[styles.todayValue, { color: '#22c55e' }]}>{itemsSoldToday}</Text>
            <Text style={styles.todayLabel}>Sold</Text>
          </View>
          <View style={styles.todayStat}>
            <Text style={[styles.todayValue, { color: '#22c55e' }]}>{formatCurrency(revenueToday)}</Text>
            <Text style={styles.todayLabel}>Revenue</Text>
          </View>
        </View>
      </Card>

      {/* Revenue Summary */}
      <Card title="REVENUE SUMMARY">
        <StatRow label="Total Revenue" value={formatCurrency(totalRevenue)} color="#22c55e" />
        <View style={styles.divider} />
        <StatRow label="Total Cost" value={formatCurrency(totalCost)} />
        <View style={styles.divider} />
        <StatRow label="Gross Profit" value={formatCurrency(grossProfit)} color={grossProfit >= 0 ? '#22c55e' : '#ef4444'} />
        <View style={styles.divider} />
        <StatRow label="Net Profit" value={formatCurrency(netProfit)} color={netProfit >= 0 ? '#22c55e' : '#ef4444'} />
        <View style={styles.divider} />
        <StatRow label="Overall ROI" value={`${overallROI.toFixed(1)}%`} color={overallROI >= 0 ? '#22c55e' : '#ef4444'} />
      </Card>

      {/* Category Performance */}
      <Card title="CATEGORY PERFORMANCE">
        {categoryStats.filter((c) => c.itemCount > 0).map((cat) => {
          const config = CATEGORY_CONFIG[cat.category];
          return (
            <View key={cat.category} style={styles.catStatRow}>
              <View style={styles.catStatLeft}>
                <Text style={{ fontSize: 14 }}>{config.icon}</Text>
                <Text style={[styles.catStatName, { color: config.color }]}>{cat.category}</Text>
              </View>
              <View style={styles.catStatRight}>
                <Text style={styles.catStatDetail}>{cat.itemCount} items</Text>
                <Text style={styles.catStatDetail}>{cat.soldCount} sold</Text>
                <Text style={[styles.catStatDetail, { color: '#22c55e' }]}>
                  {formatCurrency(cat.revenue)}
                </Text>
                <Text style={styles.catStatDetail}>{cat.avgProfitMargin}%</Text>
              </View>
            </View>
          );
        })}
        {categoryStats.every((c) => c.itemCount === 0) && (
          <Text style={styles.emptyText}>No items yet</Text>
        )}
      </Card>

      {/* Velocity Distribution */}
      <Card title="VELOCITY DISTRIBUTION">
        {Object.entries(velocityDistribution).map(([tier, count]) => (
          <View key={tier} style={styles.velocityRow}>
            <Text style={styles.velocityLabel}>{tier}</Text>
            <View style={styles.velocityBar}>
              <View
                style={[
                  styles.velocityBarFill,
                  {
                    width: items.length > 0 ? `${(count / Math.max(items.length, 1)) * 100}%` : '0%',
                    backgroundColor: tier === 'Fast Flip' ? '#22c55e' : tier === 'Standard' ? '#6366f1' : '#f59e0b',
                  },
                ]}
              />
            </View>
            <Text style={styles.velocityCount}>{count}</Text>
          </View>
        ))}
      </Card>

      {/* Platform Distribution */}
      {activePlatforms.length > 0 && (
        <Card title="SALES BY PLATFORM">
          {activePlatforms.map(([platform, count]) => (
            <View key={platform} style={styles.platformRow}>
              <Text style={styles.platformName}>{platform}</Text>
              <Text style={styles.platformCount}>{count} sale{count !== 1 ? 's' : ''}</Text>
            </View>
          ))}
        </Card>
      )}

      {/* Top Performers */}
      {topByProfit.length > 0 && (
        <Card title="TOP BY PROFIT">
          {topByProfit.map(({ item, metric }, i) => (
            <View key={item.id} style={styles.topRow}>
              <Text style={styles.topRank}>#{i + 1}</Text>
              <Text style={styles.topName} numberOfLines={1}>{item.displayName ?? item.sku}</Text>
              <Text style={[styles.topMetric, { color: '#22c55e' }]}>{formatCurrency(metric)}</Text>
            </View>
          ))}
        </Card>
      )}

      {topByROI.length > 0 && (
        <Card title="TOP BY ROI">
          {topByROI.map(({ item, metric }, i) => (
            <View key={item.id} style={styles.topRow}>
              <Text style={styles.topRank}>#{i + 1}</Text>
              <Text style={styles.topName} numberOfLines={1}>{item.displayName ?? item.sku}</Text>
              <Text style={[styles.topMetric, { color: '#6366f1' }]}>{metric.toFixed(0)}%</Text>
            </View>
          ))}
        </Card>
      )}

      {/* Export */}
      <Card title="EXPORT DATA">
        <View style={styles.exportRow}>
          <TouchableOpacity onPress={handleExportCSV} style={styles.exportBtn}>
            <Ionicons name="document-text-outline" size={18} color="#6366f1" />
            <Text style={styles.exportBtnText}>Export CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExportJSON} style={styles.exportBtn}>
            <Ionicons name="code-slash-outline" size={18} color="#6366f1" />
            <Text style={styles.exportBtnText}>Export JSON</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  rangeRow: { flexDirection: 'row', gap: 8 },
  rangeChip: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    backgroundColor: '#1c1c1c', borderRadius: 10,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  rangeChipActive: { backgroundColor: '#6366f122', borderColor: '#6366f166' },
  rangeText: { fontSize: 13, color: '#71717a', fontWeight: '700' },
  rangeTextActive: { color: '#6366f1' },
  todayGrid: { flexDirection: 'row', gap: 8 },
  todayStat: { flex: 1, alignItems: 'center', gap: 2 },
  todayValue: { fontSize: 20, fontWeight: '800', color: '#f4f4f5' },
  todayLabel: { fontSize: 10, color: '#71717a', fontWeight: '600' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  statLabel: { fontSize: 13, color: '#71717a' },
  statValue: { fontSize: 15, fontWeight: '700', color: '#f4f4f5' },
  divider: { height: 1, backgroundColor: '#27272a', marginVertical: 4 },
  catStatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  catStatLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catStatName: { fontSize: 12, fontWeight: '700' },
  catStatRight: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  catStatDetail: { fontSize: 11, color: '#a1a1aa', fontWeight: '600', minWidth: 50, textAlign: 'right' },
  emptyText: { fontSize: 13, color: '#52525b', textAlign: 'center', paddingVertical: 12 },
  velocityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  velocityLabel: { fontSize: 11, fontWeight: '700', color: '#a1a1aa', width: 80 },
  velocityBar: { flex: 1, height: 6, backgroundColor: '#27272a', borderRadius: 3, overflow: 'hidden' },
  velocityBarFill: { height: '100%', borderRadius: 3 },
  velocityCount: { fontSize: 12, color: '#71717a', fontWeight: '600', width: 28, textAlign: 'right' },
  platformRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  platformName: { fontSize: 13, color: '#f4f4f5', fontWeight: '600' },
  platformCount: { fontSize: 13, color: '#71717a' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  topRank: { fontSize: 12, color: '#52525b', fontWeight: '700', width: 24 },
  topName: { flex: 1, fontSize: 13, color: '#f4f4f5', fontWeight: '600' },
  topMetric: { fontSize: 14, fontWeight: '700' },
  exportRow: { flexDirection: 'row', gap: 10 },
  exportBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#6366f111', borderRadius: 12, paddingVertical: 14,
    borderWidth: 1, borderColor: '#6366f133',
  },
  exportBtnText: { fontSize: 14, color: '#6366f1', fontWeight: '700' },
});
