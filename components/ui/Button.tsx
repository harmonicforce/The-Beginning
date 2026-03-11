import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
}

const VARIANT_STYLES: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: '#6366f1', text: '#ffffff' },
  secondary: { bg: '#27272a', text: '#a1a1aa' },
  destructive: { bg: '#7f1d1d', text: '#ef4444', border: '#ef444433' },
  ghost: { bg: 'transparent', text: '#a1a1aa' },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
  size = 'md',
}: ButtonProps) {
  const v = VARIANT_STYLES[variant];
  const paddingV = size === 'sm' ? 10 : size === 'lg' ? 18 : 14;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 16 : 14;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border ?? v.bg,
          borderWidth: v.border ? 1 : 0,
          paddingVertical: paddingV,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, { color: v.text, fontSize }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 20,
    minHeight: 44,
    minWidth: 44,
  },
  label: {
    fontWeight: '700',
  },
});
