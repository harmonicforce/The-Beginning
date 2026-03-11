import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Category } from '../../types/item';
import { useSessionStore } from '../../store/session';
import { CategoryGrid } from '../../components/CategoryGrid';

export default function CategorySelectScreen() {
  const startIntake = useSessionStore((s) => s.startIntake);
  const { intake } = useSessionStore();

  const handleSelect = (category: Category) => {
    router.push({ pathname: '/intake/protocol', params: { category } });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>What are you listing?</Text>
        <Text style={styles.subtitle}>
          Select the category that best matches your item. This determines the AI analysis fields.
        </Text>
      </View>

      <CategoryGrid onSelect={handleSelect} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Not sure? Pick the closest match — you can edit any field after analysis.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, gap: 24, paddingBottom: 40 },
  header: { gap: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#f4f4f5' },
  subtitle: { fontSize: 14, color: '#71717a', lineHeight: 22 },
  footer: {
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  footerText: { fontSize: 13, color: '#71717a', lineHeight: 20 },
});
