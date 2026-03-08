import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
  size?: 'sm' | 'md';
}

export function Badge({ label, color = '#a1a1aa', bgColor, size = 'sm' }: BadgeProps) {
  const bg = bgColor ?? color + '22';
  const paddingH = size === 'sm' ? 8 : 10;
  const paddingV = size === 'sm' ? 3 : 5;
  const fontSize = size === 'sm' ? 11 : 13;

  return (
    <View style={[styles.badge, { backgroundColor: bg, paddingHorizontal: paddingH, paddingVertical: paddingV }]}>
      <Text style={[styles.text, { color, fontSize }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
