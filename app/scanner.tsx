import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInventoryStore } from '../store/inventory';
import { StatusBadge } from '../components/ui/StatusBadge';

interface ScanEntry {
  id: string;
  data: string;
  type: string;
  timestamp: string;
  itemId?: string;
  itemSku?: string;
}

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const items = useInventoryStore((s) => s.items);

  const handleBarCodeScanned = useCallback((result: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);

    const { data, type } = result;

    // Look up in inventory by SKU or barcode data
    const match = items.find(
      (item) => item.sku === data || item.sku.includes(data)
    );

    const entry: ScanEntry = {
      id: `${Date.now()}`,
      data,
      type: String(type),
      timestamp: new Date().toISOString(),
      itemId: match?.id,
      itemSku: match?.sku,
    };

    setScanHistory((prev) => [entry, ...prev].slice(0, 20));

    if (match) {
      Alert.alert(
        'Item Found',
        `${match.displayName ?? match.sku}\nStatus: ${match.status}`,
        [
          { text: 'Scan Again', onPress: () => setScanned(false) },
          {
            text: 'View Item',
            onPress: () => router.push({ pathname: '/item/[id]', params: { id: match.id } }),
          },
        ]
      );
    } else {
      Alert.alert(
        'Not Found',
        `Barcode: ${data}\nNo matching item in inventory.`,
        [
          { text: 'Scan Again', onPress: () => setScanned(false) },
          {
            text: 'Add as New Item',
            onPress: () => router.push('/intake/category'),
          },
        ]
      );
    }
  }, [scanned, items]);

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.infoText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={48} color="#52525b" />
        <Text style={styles.title}>Camera Access Required</Text>
        <Text style={styles.infoText}>Grant camera permission to scan barcodes.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.grantBtn}>
          <Text style={styles.grantBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showHistory) {
    return (
      <View style={styles.container}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Scan History</Text>
          <TouchableOpacity onPress={() => setShowHistory(false)}>
            <Ionicons name="camera" size={24} color="#6366f1" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={scanHistory}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.infoText}>No scans yet</Text>
            </View>
          }
          renderItem={({ item: entry }) => (
            <TouchableOpacity
              style={styles.historyRow}
              onPress={() => {
                if (entry.itemId) {
                  router.push({ pathname: '/item/[id]', params: { id: entry.itemId } });
                }
              }}
              activeOpacity={entry.itemId ? 0.7 : 1}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.historyData} numberOfLines={1}>{entry.data}</Text>
                <Text style={styles.historyMeta}>
                  {entry.type} · {new Date(entry.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              {entry.itemSku ? (
                <Text style={styles.historyMatch}>{entry.itemSku}</Text>
              ) : (
                <Text style={styles.historyNoMatch}>No match</Text>
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: [
            'qr', 'ean13', 'ean8', 'upc_a', 'upc_e',
            'code128', 'code39', 'code93', 'itf14',
            'codabar', 'datamatrix', 'pdf417',
          ],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.scanFrame} />
        <Text style={styles.scanHint}>
          {scanned ? 'Processing...' : 'Point camera at a barcode or QR code'}
        </Text>
      </View>

      {/* Bottom controls */}
      <View style={styles.controls}>
        {scanned && (
          <TouchableOpacity onPress={() => setScanned(false)} style={styles.rescanBtn}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.rescanText}>Scan Again</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => setShowHistory(true)} style={styles.historyBtn}>
          <Ionicons name="time-outline" size={20} color="#6366f1" />
          <Text style={styles.historyBtnText}>History ({scanHistory.length})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  camera: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  title: { fontSize: 18, fontWeight: '700', color: '#f4f4f5' },
  infoText: { fontSize: 14, color: '#71717a', textAlign: 'center', lineHeight: 22 },
  grantBtn: { backgroundColor: '#6366f1', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 },
  grantBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center', gap: 20,
  },
  scanFrame: {
    width: 250, height: 250, borderWidth: 2, borderColor: '#6366f1',
    borderRadius: 20, backgroundColor: 'transparent',
  },
  scanHint: { fontSize: 14, color: '#fff', fontWeight: '600', textAlign: 'center' },
  controls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, paddingBottom: 40, gap: 12,
    backgroundColor: 'rgba(10,10,10,0.85)',
  },
  rescanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#6366f1', borderRadius: 14, padding: 16,
  },
  rescanText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  historyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1c1c1c', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  historyBtnText: { fontSize: 14, color: '#6366f1', fontWeight: '600' },
  historyHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#1c1c1c',
  },
  historyTitle: { fontSize: 18, fontWeight: '700', color: '#f4f4f5' },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderBottomWidth: 1, borderBottomColor: '#1c1c1c',
  },
  historyData: { fontSize: 14, color: '#f4f4f5', fontWeight: '600', fontFamily: 'monospace' },
  historyMeta: { fontSize: 11, color: '#52525b', marginTop: 2 },
  historyMatch: { fontSize: 12, color: '#22c55e', fontWeight: '600' },
  historyNoMatch: { fontSize: 12, color: '#52525b' },
});
