import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, Animated } from 'react-native';
import { router } from 'expo-router';
import { useSessionStore } from '../../store/session';
import { useInventoryStore } from '../../store/inventory';
import { analyzeItemWithRetry, AnalysisProgressStep } from '../../lib/api';
import { generateSKU } from '../../lib/sku';
import { getSessionCount, incrementSessionCount } from '../../lib/storage';
import { Item } from '../../types/item';

const STEP_LABELS: Record<AnalysisProgressStep, string> = {
  uploading: 'Uploading photos...',
  identifying: 'Identifying item...',
  comps: 'Pulling market comps...',
  listings: 'Building listing copy...',
  record: 'Generating inventory record...',
};

const ALL_STEPS_QUICK: AnalysisProgressStep[] = ['uploading', 'identifying', 'record'];
const ALL_STEPS_CORE: AnalysisProgressStep[] = ['uploading', 'identifying', 'comps', 'listings', 'record'];

function StepIndicator({
  step,
  label,
  state,
}: {
  step: number;
  label: string;
  state: 'pending' | 'active' | 'done';
}) {
  const opacity = useRef(new Animated.Value(state === 'pending' ? 0.3 : 1)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: state === 'pending' ? 0.3 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [state]);

  return (
    <Animated.View style={[styles.stepRow, { opacity }]}>
      <View
        style={[
          styles.stepDot,
          state === 'active' && styles.stepDotActive,
          state === 'done' && styles.stepDotDone,
        ]}
      >
        {state === 'done' ? (
          <Text style={styles.stepCheck}>✓</Text>
        ) : (
          <Text style={styles.stepNumber}>{step}</Text>
        )}
      </View>
      <Text style={[styles.stepLabel, state === 'active' && styles.stepLabelActive]}>
        {label}
      </Text>
    </Animated.View>
  );
}

export default function ProcessingScreen() {
  const { intake, apiKey, incrementMonthlyCount } = useSessionStore();
  const { addItem } = useInventoryStore();
  const [currentStep, setCurrentStep] = useState<AnalysisProgressStep>('uploading');
  const [error, setError] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { category, protocol, photoUris } = intake;

  useEffect(() => {
    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    if (!category || !protocol || !apiKey || photoUris.length === 0) {
      router.replace('/intake/category');
      return;
    }
    runAnalysis();
  }, []);

  const runAnalysis = async () => {
    if (!category || !protocol || !apiKey) return;

    try {
      const result = await analyzeItemWithRetry(apiKey, category, protocol, photoUris, {
        onProgress: (step) => setCurrentStep(step),
      });

      // Build item record from AI response
      const idx = await incrementSessionCount();
      const sku = generateSKU(category, idx);

      const item: Item = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        sku,
        category,
        protocol,
        identification: (result.identification ?? {}) as Item['identification'],
        confidence: (result.confidence as number) ?? 50,
        confidenceNotes: result.confidenceNotes as string | undefined,
        photos: photoUris,
        research: protocol === 'core' ? (result.research as Item['research']) : undefined,
        listings: protocol === 'core' ? (result.listings as Item['listings']) : undefined,
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasePrice: 0,
        purchaseSource: '',
        storageLocation: '',
        status: 'Intake',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        listedPlatforms: [],
      };

      await addItem(item);
      await incrementMonthlyCount();

      router.replace({ pathname: '/intake/result/[id]', params: { id: item.id } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      setError(message);
    }
  };

  const steps = protocol === 'core' ? ALL_STEPS_CORE : ALL_STEPS_QUICK;
  const currentStepIndex = steps.indexOf(currentStep);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Analysis Failed</Text>
        <Text style={styles.errorText}>{error}</Text>
        <View style={styles.errorActions}>
          <Text
            style={styles.retryBtn}
            onPress={() => {
              setError(null);
              runAnalysis();
            }}
          >
            Try Again
          </Text>
          <Text style={styles.backBtn} onPress={() => router.back()}>
            Go Back
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Animated brain icon */}
      <Animated.Text style={[styles.brainIcon, { transform: [{ scale: pulseAnim }] }]}>
        🧠
      </Animated.Text>

      <Text style={styles.title}>
        {protocol === 'core' ? 'CORE Analysis' : 'QUICK-ADD'}
      </Text>
      <Text style={styles.subtitle}>
        Analyzing {photoUris.length} photo{photoUris.length !== 1 ? 's' : ''}...
      </Text>

      {/* Steps */}
      <View style={styles.stepsCard}>
        {steps.map((step, i) => (
          <StepIndicator
            key={step}
            step={i + 1}
            label={STEP_LABELS[step]}
            state={i < currentStepIndex ? 'done' : i === currentStepIndex ? 'active' : 'pending'}
          />
        ))}
      </View>

      <Text style={styles.estimateText}>
        Estimated: {protocol === 'quick' ? '8–15 seconds' : '20–40 seconds'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 20,
  },
  brainIcon: {
    fontSize: 72,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f4f4f5',
  },
  subtitle: {
    fontSize: 14,
    color: '#71717a',
  },
  stepsCard: {
    backgroundColor: '#1c1c1c',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    gap: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginTop: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#6366f1',
  },
  stepDotDone: {
    backgroundColor: '#14532d',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71717a',
  },
  stepCheck: {
    fontSize: 12,
    fontWeight: '700',
    color: '#22c55e',
  },
  stepLabel: {
    fontSize: 14,
    color: '#71717a',
    flex: 1,
  },
  stepLabelActive: {
    color: '#f4f4f5',
    fontWeight: '600',
  },
  estimateText: {
    fontSize: 12,
    color: '#52525b',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 14,
  },
  errorIcon: { fontSize: 48 },
  errorTitle: { fontSize: 22, fontWeight: '800', color: '#ef4444' },
  errorText: {
    fontSize: 14,
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorActions: { flexDirection: 'row', gap: 16, marginTop: 8 },
  retryBtn: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6366f1',
    padding: 12,
  },
  backBtn: {
    fontSize: 15,
    color: '#71717a',
    padding: 12,
  },
});
