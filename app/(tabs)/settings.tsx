import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../../store/session';

export default function SettingsScreen() {
  const { apiKey, setApiKey, clearApiKey, isPro } = useSessionStore();
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (apiKey) {
      setInputKey(apiKey);
    }
  }, [apiKey]);

  const handleSaveKey = async () => {
    const key = inputKey.trim();
    if (!key) {
      Alert.alert('Invalid Key', 'Please enter a valid Anthropic API key.');
      return;
    }
    if (!key.startsWith('sk-ant-')) {
      Alert.alert(
        'Invalid Format',
        'Anthropic API keys start with "sk-ant-". Please check your key.'
      );
      return;
    }
    await setApiKey(key);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClearKey = () => {
    Alert.alert(
      'Remove API Key',
      'Are you sure you want to remove your API key? You will need to re-enter it to analyze items.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await clearApiKey();
            setInputKey('');
          },
        },
      ]
    );
  };

  const maskedKey = apiKey
    ? `${apiKey.slice(0, 12)}${'•'.repeat(20)}${apiKey.slice(-4)}`
    : '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* API Key Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ANTHROPIC API KEY</Text>
        <Text style={styles.sectionDesc}>
          Your API key is stored securely on your device using encrypted storage. It is never
          transmitted to any server other than Anthropic.
        </Text>

        {apiKey && (
          <View style={styles.keyStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>API key configured</Text>
            <TouchableOpacity onPress={() => setShowKey(!showKey)}>
              <Ionicons
                name={showKey ? 'eye-off' : 'eye'}
                size={16}
                color="#71717a"
              />
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
          <TouchableOpacity
            onPress={() => setShowKey(!showKey)}
            style={styles.eyeBtn}
          >
            <Ionicons
              name={showKey ? 'eye-off' : 'eye'}
              size={18}
              color="#71717a"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity
            onPress={handleSaveKey}
            style={[styles.saveBtn, saved && styles.savedBtn]}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>
              {saved ? '✓ Saved' : apiKey ? 'Update Key' : 'Save Key'}
            </Text>
          </TouchableOpacity>

          {apiKey && (
            <TouchableOpacity onPress={handleClearKey} style={styles.clearBtn} activeOpacity={0.8}>
              <Text style={styles.clearBtnText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => {}}
          style={styles.helpLink}
        >
          <Text style={styles.helpText}>
            Get your API key at console.anthropic.com
          </Text>
          <Ionicons name="open-outline" size={12} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Subscription */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SUBSCRIPTION</Text>
        <View style={styles.planRow}>
          <View>
            <Text style={styles.planName}>{isPro ? 'Pro Plan' : 'Free Plan'}</Text>
            <Text style={styles.planDesc}>
              {isPro ? 'Unlimited items · CORE mode · All categories' : '10 items/month · QUICK-ADD only'}
            </Text>
          </View>
          {!isPro && (
            <TouchableOpacity
              onPress={() => router.push('/account')}
              style={styles.upgradeBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.upgradeBtnText}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* App info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ABOUT</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>App Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>AI Model</Text>
          <Text style={styles.infoValue}>Claude Sonnet 4</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Build</Text>
          <Text style={styles.infoValue}>MVP Phase</Text>
        </View>
      </View>

      {/* Privacy note */}
      <View style={styles.privacyBox}>
        <Ionicons name="shield-checkmark" size={16} color="#6366f1" />
        <Text style={styles.privacyText}>
          Photos are processed locally and sent only to Anthropic for AI analysis. No data is
          stored on external servers. Your API key is encrypted on-device.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, gap: 20, paddingBottom: 40 },
  section: {
    backgroundColor: '#1c1c1c',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#52525b',
    letterSpacing: 1.5,
  },
  sectionDesc: {
    fontSize: 12,
    color: '#71717a',
    lineHeight: 18,
  },
  keyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  statusText: {
    fontSize: 13,
    color: '#22c55e',
    fontWeight: '600',
    flex: 1,
  },
  keyPreview: {
    backgroundColor: '#141414',
    borderRadius: 8,
    padding: 10,
  },
  keyText: {
    fontSize: 12,
    color: '#71717a',
    fontFamily: 'monospace',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    paddingRight: 12,
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 14,
    color: '#f4f4f5',
    fontFamily: 'monospace',
  },
  eyeBtn: {
    padding: 4,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  savedBtn: {
    backgroundColor: '#14532d',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  clearBtn: {
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  helpText: {
    fontSize: 12,
    color: '#6366f1',
    textDecorationLine: 'underline',
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  planDesc: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  upgradeBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  upgradeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#71717a',
  },
  infoValue: {
    fontSize: 13,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#1c1c2c',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#6366f133',
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: '#71717a',
    lineHeight: 18,
  },
});
