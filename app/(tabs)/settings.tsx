import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../../store/session';
import { useSettingsStore, PlatformFeeConfig } from '../../store/settingsStore';
import { useInventoryStore } from '../../store/inventory';
import { CATEGORIES, CATEGORY_CONFIG } from '../../types/categories';
import { Protocol } from '../../types/item';
import { Card } from '../../components/ui/Card';
import { exportCSV, exportJSON } from '../../lib/export';
import { validateApiKey } from '../../lib/api';

export default function SettingsScreen() {
  const { apiKey, setApiKey, clearApiKey, isPro } = useSessionStore();
  const { defaultProtocols, setDefaultProtocol, platformFees, setPlatformFee } = useSettingsStore();
  const items = useInventoryStore((s) => s.items);

  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (apiKey) setInputKey(apiKey);
  }, [apiKey]);

  const handleSaveKey = async () => {
    const key = inputKey.trim();
    if (!key) {
      Alert.alert('Invalid Key', 'Please enter a valid Anthropic API key.');
      return;
    }
    if (!key.startsWith('sk-ant-')) {
      Alert.alert('Invalid Format', 'Anthropic API keys start with "sk-ant-".');
      return;
    }
    setValidating(true);
    try {
      const error = await validateApiKey(key);
      if (error) {
        Alert.alert('Validation Issue', error);
        return;
      }
    } catch {
      // Network error — save anyway
    } finally {
      setValidating(false);
    }
    await setApiKey(key);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClearKey = () => {
    Alert.alert('Remove API Key', 'Remove your API key? You will need to re-enter it.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await clearApiKey(); setInputKey(''); } },
    ]);
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      `This will delete all ${items.length} items and reset settings. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything', style: 'destructive',
          onPress: async () => {
            const { clearAll } = useInventoryStore.getState();
            if (clearAll) await clearAll();
            Alert.alert('Done', 'All data cleared.');
          },
        },
      ]
    );
  };

  const maskedKey = apiKey ? `${apiKey.slice(0, 12)}${'•'.repeat(20)}${apiKey.slice(-4)}` : '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* API Key */}
      <Card title="ANTHROPIC API KEY">
        <Text style={styles.desc}>
          Your API key is stored securely on-device using encrypted storage. Never transmitted except to Anthropic.
        </Text>
        {apiKey && (
          <View style={styles.keyStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>API key configured</Text>
            <TouchableOpacity onPress={() => setShowKey(!showKey)}>
              <Ionicons name={showKey ? 'eye-off' : 'eye'} size={16} color="#71717a" />
            </TouchableOpacity>
          </View>
        )}
        {apiKey && showKey && (
          <View style={styles.keyPreview}>
            <Text style={styles.keyText} selectable>{maskedKey}</Text>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={inputKey}
            onChangeText={setInputKey}
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
        <View style={styles.btnRow}>
          <TouchableOpacity
            onPress={handleSaveKey}
            style={[styles.primaryBtn, saved && { backgroundColor: '#14532d' }]}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>
              {validating ? 'Validating...' : saved ? '✓ Saved' : apiKey ? 'Update Key' : 'Save Key'}
            </Text>
          </TouchableOpacity>
          {apiKey && (
            <TouchableOpacity onPress={handleClearKey} style={styles.secondaryBtn} activeOpacity={0.8}>
              <Text style={styles.dangerText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => Linking.openURL('https://console.anthropic.com')}
          style={styles.helpLink}
        >
          <Text style={styles.linkText}>Get your API key at console.anthropic.com</Text>
          <Ionicons name="open-outline" size={12} color="#6366f1" />
        </TouchableOpacity>
      </Card>

      {/* Default Protocols */}
      <Card title="DEFAULT PROTOCOLS">
        <Text style={styles.desc}>
          Set the default analysis mode per category. CORE = full pricing + listings. QUICK = identification only.
        </Text>
        {CATEGORIES.map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          const current = defaultProtocols[cat];
          return (
            <View key={cat} style={styles.protocolRow}>
              <View style={styles.protocolLeft}>
                <Text style={{ fontSize: 14 }}>{config.icon}</Text>
                <Text style={[styles.protocolCat, { color: config.color }]}>{cat}</Text>
              </View>
              <View style={styles.protocolToggle}>
                {(['quick', 'core'] as Protocol[]).map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setDefaultProtocol(cat, p)}
                    style={[styles.protocolBtn, current === p && styles.protocolBtnActive]}
                  >
                    <Text style={[styles.protocolBtnText, current === p && { color: '#6366f1' }]}>
                      {p.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </Card>

      {/* Platform Fees */}
      <Card title="PLATFORM FEES (%)">
        <Text style={styles.desc}>
          Adjust platform fee percentages used for profit calculations.
        </Text>
        {(Object.keys(platformFees) as (keyof PlatformFeeConfig)[]).map((platform) => (
          <View key={platform} style={styles.feeRow}>
            <Text style={styles.feePlatform}>{platform.charAt(0).toUpperCase() + platform.slice(1)}</Text>
            <TextInput
              style={styles.feeInput}
              value={String(platformFees[platform])}
              onChangeText={(v) => setPlatformFee(platform, parseFloat(v) || 0)}
              keyboardType="decimal-pad"
            />
            <Text style={styles.feePercent}>%</Text>
          </View>
        ))}
      </Card>

      {/* Data Export */}
      <Card title="DATA EXPORT">
        <View style={styles.exportRow}>
          <TouchableOpacity onPress={() => exportCSV(items)} style={styles.exportBtn}>
            <Ionicons name="document-text-outline" size={18} color="#6366f1" />
            <Text style={styles.exportBtnText}>Export CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => exportJSON(items)} style={styles.exportBtn}>
            <Ionicons name="code-slash-outline" size={18} color="#6366f1" />
            <Text style={styles.exportBtnText}>Export JSON</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.desc}>
          {items.length} item{items.length !== 1 ? 's' : ''} will be included in export.
        </Text>
      </Card>

      {/* Subscription */}
      <Card title="SUBSCRIPTION">
        <View style={styles.planRow}>
          <View>
            <Text style={styles.planName}>{isPro ? 'Pro Plan' : 'Free Plan'}</Text>
            <Text style={styles.planDesc}>
              {isPro ? 'Unlimited items · CORE mode · All categories' : '10 items/month · QUICK-ADD only'}
            </Text>
          </View>
          {!isPro && (
            <TouchableOpacity onPress={() => router.push('/account')} style={styles.upgradeBtn}>
              <Text style={styles.upgradeBtnText}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>

      {/* About */}
      <Card title="ABOUT">
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>App</Text>
          <Text style={styles.infoValue}>The Beginning v1.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>AI Model (CORE)</Text>
          <Text style={styles.infoValue}>Claude Sonnet 4.5</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>AI Model (QUICK)</Text>
          <Text style={styles.infoValue}>Claude Haiku 4.5</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>SDK</Text>
          <Text style={styles.infoValue}>Expo 55</Text>
        </View>
      </Card>

      {/* Danger Zone */}
      <Card title="DANGER ZONE">
        <TouchableOpacity onPress={handleClearAllData} style={styles.dangerBtn}>
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
          <Text style={styles.dangerBtnText}>Clear All Data</Text>
        </TouchableOpacity>
      </Card>

      {/* Privacy */}
      <View style={styles.privacyBox}>
        <Ionicons name="shield-checkmark" size={16} color="#6366f1" />
        <Text style={styles.privacyText}>
          Photos are processed locally and sent only to Anthropic for AI analysis. No data is stored on external servers. Your API key is encrypted on-device.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  desc: { fontSize: 12, color: '#71717a', lineHeight: 18 },
  keyStatus: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  statusText: { fontSize: 13, color: '#22c55e', fontWeight: '600', flex: 1 },
  keyPreview: { backgroundColor: '#141414', borderRadius: 8, padding: 10 },
  keyText: { fontSize: 12, color: '#71717a', fontFamily: 'monospace' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414',
    borderRadius: 12, borderWidth: 1, borderColor: '#2a2a2a', paddingRight: 12,
  },
  input: { flex: 1, padding: 14, fontSize: 14, color: '#f4f4f5', fontFamily: 'monospace' },
  btnRow: { flexDirection: 'row', gap: 10 },
  primaryBtn: {
    flex: 1, backgroundColor: '#6366f1', borderRadius: 12, padding: 14, alignItems: 'center',
  },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  secondaryBtn: {
    backgroundColor: '#27272a', borderRadius: 12, padding: 14, paddingHorizontal: 20, alignItems: 'center',
  },
  dangerText: { fontSize: 14, fontWeight: '600', color: '#ef4444' },
  helpLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkText: { fontSize: 12, color: '#6366f1', textDecorationLine: 'underline' },
  protocolRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6,
  },
  protocolLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  protocolCat: { fontSize: 12, fontWeight: '700' },
  protocolToggle: { flexDirection: 'row', gap: 4 },
  protocolBtn: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8,
    backgroundColor: '#1c1c1c', borderWidth: 1, borderColor: '#2a2a2a',
  },
  protocolBtnActive: { backgroundColor: '#6366f122', borderColor: '#6366f166' },
  protocolBtnText: { fontSize: 11, fontWeight: '700', color: '#71717a' },
  feeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  feePlatform: { fontSize: 13, color: '#f4f4f5', fontWeight: '600', flex: 1 },
  feeInput: {
    width: 60, fontSize: 13, color: '#f4f4f5', fontWeight: '600', textAlign: 'right',
    backgroundColor: '#141414', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  feePercent: { fontSize: 12, color: '#71717a' },
  exportRow: { flexDirection: 'row', gap: 10 },
  exportBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#6366f111', borderRadius: 12, paddingVertical: 14,
    borderWidth: 1, borderColor: '#6366f133',
  },
  exportBtnText: { fontSize: 14, color: '#6366f1', fontWeight: '700' },
  planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planName: { fontSize: 16, fontWeight: '700', color: '#f4f4f5' },
  planDesc: { fontSize: 12, color: '#71717a', marginTop: 2 },
  upgradeBtn: { backgroundColor: '#6366f1', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  upgradeBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  infoLabel: { fontSize: 13, color: '#71717a' },
  infoValue: { fontSize: 13, color: '#a1a1aa', fontWeight: '600' },
  dangerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#7f1d1d22', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#ef444433',
  },
  dangerBtnText: { fontSize: 14, color: '#ef4444', fontWeight: '600' },
  privacyBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#1c1c2c', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#6366f133',
  },
  privacyText: { flex: 1, fontSize: 12, color: '#71717a', lineHeight: 18 },
});
