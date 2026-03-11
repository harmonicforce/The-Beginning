import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Category } from '../types/item';
import { CATEGORY_CONFIG, CATEGORIES } from '../types/categories';

interface CategoryGridProps {
  onSelect: (category: Category) => void;
  selectedCategory?: Category | null;
}

export function CategoryGrid({ onSelect, selectedCategory }: CategoryGridProps) {
  return (
    <View style={styles.grid}>
      {CATEGORIES.map((cat) => {
        const config = CATEGORY_CONFIG[cat];
        const isSelected = selectedCategory === cat;
        return (
          <TouchableOpacity
            key={cat}
            onPress={() => onSelect(cat)}
            activeOpacity={0.7}
            style={[
              styles.tile,
              {
                backgroundColor: isSelected ? config.color + '33' : '#1c1c1c',
                borderColor: isSelected ? config.color : '#2a2a2a',
                borderWidth: isSelected ? 2 : 1,
              },
            ]}
          >
            <Text style={styles.icon}>{config.icon}</Text>
            <Text style={[styles.label, { color: isSelected ? config.color : '#f4f4f5' }]}>
              {cat}
            </Text>
            <Text style={styles.description}>{config.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 4,
  },
  icon: {
    fontSize: 28,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  description: {
    fontSize: 10,
    color: '#71717a',
    textAlign: 'center',
  },
});
