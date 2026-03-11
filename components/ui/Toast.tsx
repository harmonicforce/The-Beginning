import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useUIStore, Toast as ToastType } from '../../store/uiStore';

const TYPE_COLORS: Record<ToastType['type'], { bg: string; text: string; border: string }> = {
  success: { bg: '#14532d22', text: '#22c55e', border: '#22c55e33' },
  error: { bg: '#7f1d1d22', text: '#ef4444', border: '#ef444433' },
  warning: { bg: '#713f1222', text: '#f59e0b', border: '#f59e0b33' },
  info: { bg: '#1e1b4b22', text: '#6366f1', border: '#6366f133' },
};

function ToastItem({ toast }: { toast: ToastType }) {
  const dismissToast = useUIStore((s) => s.dismissToast);
  const colors = TYPE_COLORS[toast.type];

  return (
    <TouchableOpacity
      onPress={() => dismissToast(toast.id)}
      style={[styles.toast, { backgroundColor: colors.bg, borderColor: colors.border }]}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, { color: colors.text }]}>{toast.message}</Text>
    </TouchableOpacity>
  );
}

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
