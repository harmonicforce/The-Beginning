import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Category } from '../../types/item';
import { CATEGORY_CONFIG } from '../../types/categories';

interface CategoryBadgeProps {
  category: Category;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export function CategoryBadge({ category, showIcon = true, size = 'sm' }: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category];
  const fontSize = size === 'sm' ? 11 : 13;
  const paddingH = size === 'sm' ? 8 : 10;
  const paddingV = size === 'sm' ? 3 : 5;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.color + '22',
          borderColor: config.color + '44',
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
        },
      ]}
    >
      {showIcon && <Text style={{ fontSize: fontSize + 1 }}>{config.icon}</Text>}
      <Text style={[styles.text, { color: config.color, fontSize }]}>{category}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 100,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
