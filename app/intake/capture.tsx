import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSessionStore } from '../../store/session';
import { CATEGORY_CONFIG } from '../../types/categories';
import { PhotoDropzone } from '../../components/PhotoDropzone';

export default function CaptureScreen() {
  const { intake, setPhotos } = useSessionStore();
  const { category, protocol, photoUris } = intake;

  if (!category || !protocol) {
    router.replace('/intake/category');
    return null;
  }

  const config = CATEGORY_CONFIG[category];
  const canAnalyze = photoUris.length >= config.minPhotos;

  const handleAnalyze = () => {
    if (!canAnalyze) {
      Alert.alert(
        'More Photos Needed',
        `Please add at least ${config.minPhotos} photo${config.minPhotos > 1 ? 's' : ''} to continue.`
      );
      return;
    }
    router.push('/intake/processing');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Category + protocol info */}
      <View style={styles.infoRow}>
        <View style={[styles.catChip, { borderColor: config.color + '55' }]}>
          <Text>{config.icon}</Text>
          <Text style={[styles.catText, { color: config.color }]}>{category}</Text>
        </View>
        <View style={styles.protocolChip}>
          <Text style={styles.protocolText}>{protocol.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Add Photos</Text>
        <Text style={styles.subtitle}>
          {protocol === 'core'
            ? 'Multiple angles improve accuracy. Take 3-5 photos for best results.'
            : 'Add at least 1 clear photo for quick identification.'}
        </Text>
      </View>

      <PhotoDropzone
        photos={photoUris}
        onPhotosChange={setPhotos}
        maxPhotos={8}
        guidance={config.photoGuidance}
      />

      {/* Tips */}
      <View style={styles.tipsBox}>
        <Text style={styles.tipsTitle}>📸 Photo Tips</Text>
        <Text style={styles.tipText}>• Good lighting, no glare or shadows</Text>
        <Text style={styles.tipText}>• Keep item in focus — hold steady</Text>
        <Text style={styles.tipText}>• Show any visible damage, wear, or defects</Text>
        {category === 'SLAB' && (
          <Text style={styles.tipText}>• Cert number must be readable in at least one photo</Text>
        )}
        {category === 'ELEC' && (
          <Text style={styles.tipText}>• Include model sticker and serial number</Text>
        )}
      </View>

      {/* Analyze button */}
      <TouchableOpacity
        onPress={handleAnalyze}
        style={[styles.analyzeBtn, !canAnalyze && styles.analyzeBtnDisabled]}
        activeOpacity={canAnalyze ? 0.85 : 1}
      >
        <Text style={styles.analyzeBtnText}>
          {canAnalyze
            ? `Analyze ${photoUris.length} Photo${photoUris.length !== 1 ? 's' : ''} →`
            : `Need ${config.minPhotos - photoUris.length} More Photo${config.minPhotos - photoUris.length > 1 ? 's' : ''}`}
        </Text>
      </TouchableOpacity>

      {canAnalyze && (
        <Text style={styles.estimateText}>
          Estimated time: {protocol === 'quick' ? '8–15 seconds' : '20–40 seconds'}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, gap: 20, paddingBottom: 40 },
  infoRow: { flexDirection: 'row', gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1c1c1c',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  catText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  protocolChip: {
    backgroundColor: '#6366f122',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#6366f144',
  },
  protocolText: { fontSize: 12, fontWeight: '800', color: '#a5b4fc', letterSpacing: 0.5 },
  header: { gap: 6 },
  title: { fontSize: 22, fontWeight: '800', color: '#f4f4f5' },
  subtitle: { fontSize: 14, color: '#71717a', lineHeight: 22 },
  tipsBox: {
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 6,
  },
  tipsTitle: { fontSize: 13, fontWeight: '700', color: '#a1a1aa', marginBottom: 2 },
  tipText: { fontSize: 12, color: '#71717a', lineHeight: 18 },
  analyzeBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  analyzeBtnDisabled: {
    backgroundColor: '#27272a',
  },
  analyzeBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  estimateText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#52525b',
    marginTop: -10,
  },
});
