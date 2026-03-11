import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface CardProps {
  children: ReactNode;
  title?: string;
  style?: ViewStyle;
  elevated?: boolean;
}

export function Card({ children, title, style, elevated = false }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        elevated && styles.elevated,
        style,
      ]}
    >
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1c1c1c',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 10,
  },
  elevated: {
    backgroundColor: '#1c1c1c',
    borderColor: '#333333',
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    color: '#52525b',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
});
