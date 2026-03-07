import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../store/session';

interface OnboardingStep {
  icon: string;
  title: string;
  description: string;
}

const STEPS: OnboardingStep[] = [
  {
    icon: '📸',
    title: 'Photo → AI Analysis',
    description:
      'Photograph any item and our AI instantly identifies it, researches market prices, and writes your listings.',
  },
  {
    icon: '🧠',
    title: 'Powered by Claude AI',
    description:
      'Anthropic\'s Claude Vision model analyzes your photos with deep knowledge of trading cards, sneakers, electronics, and more.',
  },
  {
    icon: '💰',
    title: '3-Comp Pricing Engine',
    description:
      'Every CORE analysis uses a weighted 3-comparable pricing formula: recent eBay sales, conservative floor, and optimistic ceiling.',
  },
  {
    icon: '🚀',
    title: '5–10× Faster Intake',
    description:
      'What used to take 10–20 minutes per item now takes under 60 seconds. Photograph, review, copy, done.',
  },
];

export default function OnboardingScreen() {
  const { setOnboarded, isOnboarded } = useSessionStore();

  useEffect(() => {
    if (isOnboarded) {
      router.replace('/(tabs)');
    }
  }, [isOnboarded]);

  const handleGetStarted = async () => {
    await setOnboarded();
    router.replace('/settings');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Logo */}
      <View style={styles.logoSection}>
        <Text style={styles.logoIcon}>🧠</Text>
        <Text style={styles.logoTitle}>Reseller Brain OS</Text>
        <Text style={styles.logoSub}>Photo Intake Engine</Text>
      </View>

      {/* Steps */}
      <View style={styles.steps}>
        {STEPS.map((step, i) => (
          <View key={i} style={styles.step}>
            <View style={styles.stepIconWrapper}>
              <Text style={styles.stepIcon}>{step.icon}</Text>
            </View>
            <View style={styles.stepText}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.description}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* API key notice */}
      <View style={styles.notice}>
        <Ionicons name="key-outline" size={18} color="#f59e0b" />
        <Text style={styles.noticeText}>
          You'll need an Anthropic API key to use the AI features. Get one free at console.anthropic.com.
        </Text>
      </View>

      {/* CTA */}
      <TouchableOpacity onPress={handleGetStarted} style={styles.ctaBtn} activeOpacity={0.85}>
        <Text style={styles.ctaBtnText}>Get Started →</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Your API key is stored securely on your device. Photos are never stored on external servers.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 24, gap: 28, paddingBottom: 50 },
  logoSection: { alignItems: 'center', gap: 8, paddingTop: 40 },
  logoIcon: { fontSize: 64 },
  logoTitle: { fontSize: 26, fontWeight: '900', color: '#f4f4f5', letterSpacing: -0.5 },
  logoSub: { fontSize: 14, color: '#6366f1', fontWeight: '600', letterSpacing: 1 },
  steps: { gap: 20 },
  step: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  stepIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1c1c1c',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  stepIcon: { fontSize: 24 },
  stepText: { flex: 1, gap: 4 },
  stepTitle: { fontSize: 16, fontWeight: '700', color: '#f4f4f5' },
  stepDesc: { fontSize: 13, color: '#71717a', lineHeight: 20 },
  notice: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: '#713f1222',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f59e0b33',
  },
  noticeText: { flex: 1, fontSize: 13, color: '#d97706', lineHeight: 20 },
  ctaBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  ctaBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  disclaimer: { fontSize: 11, color: '#52525b', textAlign: 'center', lineHeight: 16 },
});
