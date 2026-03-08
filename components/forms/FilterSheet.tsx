import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Category, ItemStatus, Protocol, VelocityTier } from '../../types/item';
import { CATEGORY_CONFIG, CATEGORIES } from '../../types/categories';
import { STATUS_COLORS } from '../ui/StatusBadge';

const STATUS_OPTIONS: ItemStatus[] = ['Intake', 'Photo Queue', 'Research', 'Listed', 'Sold', 'Shipped'];
const PROTOCOL_OPTIONS: Protocol[] = ['quick', 'core'];
const VELOCITY_OPTIONS: VelocityTier[] = ['Fast Flip', 'Standard', 'Long Hold'];

export type SortOption = 'newest' | 'oldest' | 'price_high' | 'price_low' | 'target_high' | 'target_low' | 'status' | 'category';

export interface FilterState {
  categories: Category[];
  statuses: ItemStatus[];
  protocols: Protocol[];
  velocities: VelocityTier[];
  sortBy: SortOption;
}

export const DEFAULT_FILTERS: FilterState = {
  categories: [],
  statuses: [],
  protocols: [],
  velocities: [],
  sortBy: 'newest',
};

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
}

function ChipSelect<T extends string>({
  label,
  options,
  selected,
  onToggle,
  colorFn,
  labelFn,
}: {
  label: string;
  options: T[];
  selected: T[];
  onToggle: (value: T) => void;
  colorFn?: (value: T) => string;
  labelFn?: (value: T) => string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((opt) => {
          const isSelected = selected.includes(opt);
          const color = colorFn?.(opt) ?? '#6366f1';
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => onToggle(opt)}
              style={[
                styles.chip,
                isSelected && { backgroundColor: color + '22', borderColor: color + '66' },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isSelected && { color }]}>
                {labelFn?.(opt) ?? opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_high', label: 'Price: High → Low' },
  { value: 'price_low', label: 'Price: Low → High' },
  { value: 'target_high', label: 'Target: High → Low' },
  { value: 'target_low', label: 'Target: Low → High' },
  { value: 'category', label: 'Category' },
  { value: 'status', label: 'Status' },
];

export function FilterSheet({ visible, onClose, filters, onApply }: FilterSheetProps) {
  const [local, setLocal] = useState<FilterState>(filters);

  const toggle = <T extends string>(arr: T[], value: T): T[] =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const handleReset = () => {
    setLocal(DEFAULT_FILTERS);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Filter & Sort">
      <View style={styles.content}>
        <ChipSelect
          label="Category"
          options={CATEGORIES}
          selected={local.categories}
          onToggle={(c) => setLocal({ ...local, categories: toggle(local.categories, c) })}
          colorFn={(c) => CATEGORY_CONFIG[c].color}
          labelFn={(c) => `${CATEGORY_CONFIG[c].icon} ${c}`}
        />

        <ChipSelect
          label="Status"
          options={STATUS_OPTIONS}
          selected={local.statuses}
          onToggle={(s) => setLocal({ ...local, statuses: toggle(local.statuses, s) })}
          colorFn={(s) => STATUS_COLORS[s]}
        />

        <ChipSelect
          label="Protocol"
          options={PROTOCOL_OPTIONS}
          selected={local.protocols}
          onToggle={(p) => setLocal({ ...local, protocols: toggle(local.protocols, p) })}
          labelFn={(p) => p.toUpperCase()}
        />

        <ChipSelect
          label="Velocity"
          options={VELOCITY_OPTIONS}
          selected={local.velocities}
          onToggle={(v) => setLocal({ ...local, velocities: toggle(local.velocities, v) })}
        />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Sort By</Text>
          <View style={styles.chipRow}>
            {SORT_OPTIONS.map(({ value, label }) => {
              const isSelected = local.sortBy === value;
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => setLocal({ ...local, sortBy: value })}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.actions}>
          <Button label="Reset" variant="secondary" onPress={handleReset} style={{ flex: 1 }} />
          <Button label="Apply" onPress={handleApply} style={{ flex: 2 }} />
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: { gap: 20, paddingBottom: 20 },
  section: { gap: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#52525b', letterSpacing: 1.5 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#1c1c1c',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  chipSelected: {
    backgroundColor: '#6366f122',
    borderColor: '#6366f166',
  },
  chipText: { fontSize: 13, color: '#a1a1aa', fontWeight: '600' },
  chipTextSelected: { color: '#6366f1' },
  actions: { flexDirection: 'row', gap: 12 },
});
