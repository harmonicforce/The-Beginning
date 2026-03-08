import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../store/session';
import { CATEGORIES, CATEGORY_CONFIG } from '../types/categories';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Step {
  icon: string;
  title: string;
  subtitle: string;
}

const STEPS: Step[] = [
  { icon: '🧠', title: 'Welcome to The Beginning', subtitle: 'Your AI-powered reseller intelligence platform. Photograph items, get instant market analysis, and list across platforms.' },
  { icon: '🔑', title: 'Connect Your AI', subtitle: 'Enter your Anthropic API key to enable AI-powered photo analysis. Get one free at console.anthropic.com.' },
  { icon: '📦', title: 'Your Categories', subtitle: 'The Beginning supports 7 product categories with specialized analysis for each.' },
  { icon: '📸', title: 'How It Works', subtitle: 'Photograph → AI Analysis → Market Comps → Listing Copy. QUICK mode identifies items. CORE mode does full pricing + listings.' },
  { icon: '🚀', title: 'Ready to Go', subtitle: 'You\'re all set! Start by adding your first item with the camera intake flow.' },
];

export default function OnboardingScreen() {
  const { setOnboarded, isOnboarded, setApiKey } = useSessionStore();
  const [step, setStep] = useState(0);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOnboarded) router.replace('/(tabs)');
  }, [isOnboarded]);

  const handleNext = async () => {
    if (step === 1 && apiKeyInput.trim()) {
      const key = apiKeyInput.trim();
      if (!key.startsWith('sk-ant-')) {
        Alert.alert('Invalid Format', 'Anthropic API keys start with "sk-ant-".');
        return;
      }
      await setApiKey(key);
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      await setOnboarded();
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const current = STEPS[step];

  return (
    <View style={styles.container}>
      {/* Progress dots */}
      <View style={styles.progressRow}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
        ))}
      </View>

      {/* Icon */}
      <Text style={styles.icon}>{current.icon}</Text>
      <Text style={styles.title}>{current.title}</Text>
      <Text style={styles.subtitle}>{current.subtitle}</Text>

      {/* Step-specific content */}
      {step === 1 && (
        <View style={styles.apiSection}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              placeholder="sk-ant-api03-..."
              placeholderTextColor="#52525b"
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowKey(!showKey)} style={{ padding: 4 }}>
              <Ionicons name={showKey ? 'eye-off' : 'eye'} size={18} color="#71717a" />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>You can add this later in Settings.</Text>
        </View>
      )}

      {step === 2 && (
        <View style={styles.catGrid}>
          {CATEGORIES.map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            return (
              <View key={cat} style={styles.catItem}>
                <Text style={{ fontSize: 20 }}>{config.icon}</Text>
                <Text style={[styles.catLabel, { color: config.color }]}>{cat}</Text>
                <Text style={styles.catDesc}>{config.label}</Text>
              </View>
            );
          })}
        </View>
      )}

      {step === 3 && (
        <View style={styles.howItWorks}>
          {[
            { num: '1', label: 'Photograph your item (1-8 photos)' },
            { num: '2', label: 'AI identifies and researches market pricing' },
            { num: '3', label: 'Review comps, edit fields, save to inventory' },
            { num: '4', label: 'Copy-paste listings to eBay, Facebook, etc.' },
          ].map(({ num, label }) => (
            <View key={num} style={styles.howRow}>
              <View style={styles.howNum}><Text style={styles.howNumText}>{num}</Text></View>
              <Text style={styles.howLabel}>{label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Bottom buttons */}
      <View style={styles.footer}>
        {step === 1 && !apiKeyInput.trim() && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleNext} style={styles.nextBtn} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>
            {step === STEPS.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0a0a0a',
    alignItems: 'center', justifyContent: 'center',
    padding: 24, gap: 20,
  },
  progressRow: { flexDirection: 'row', gap: 8, position: 'absolute', top: 60 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#27272a' },
  dotActive: { backgroundColor: '#6366f1', width: 24 },
  dotDone: { backgroundColor: '#22c55e' },
  icon: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '900', color: '#f4f4f5', textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#71717a', textAlign: 'center', lineHeight: 24, maxWidth: 320 },
  apiSection: { width: '100%', gap: 10 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1c1c',
    borderRadius: 12, borderWidth: 1, borderColor: '#2a2a2a', paddingRight: 12,
  },
  input: { flex: 1, padding: 14, fontSize: 14, color: '#f4f4f5', fontFamily: 'monospace' },
  hint: { fontSize: 12, color: '#52525b', textAlign: 'center' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, paddingHorizontal: 8 },
  catItem: {
    width: (SCREEN_WIDTH - 80) / 3, alignItems: 'center', gap: 4,
    backgroundColor: '#1c1c1c', borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  catLabel: { fontSize: 11, fontWeight: '800' },
  catDesc: { fontSize: 9, color: '#52525b', textAlign: 'center' },
  howItWorks: { width: '100%', gap: 14 },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  howNum: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#6366f1',
    alignItems: 'center', justifyContent: 'center',
  },
  howNumText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  howLabel: { fontSize: 14, color: '#f4f4f5', flex: 1, lineHeight: 20 },
  footer: { position: 'absolute', bottom: 40, width: '100%', gap: 12, alignItems: 'center' },
  skipBtn: { padding: 10 },
  skipText: { fontSize: 14, color: '#6366f1', fontWeight: '600' },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32,
    width: '100%', justifyContent: 'center',
  },
  nextBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
});
