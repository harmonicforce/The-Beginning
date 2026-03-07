import React from 'react';
import { View, Text } from 'react-native';

interface ConfidenceBadgeProps {
  confidence: number;
  notes?: string;
  showNotes?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

function getConfidenceColor(confidence: number): {
  bg: string;
  text: string;
  label: string;
} {
  if (confidence >= 85) {
    return { bg: '#14532d', text: '#22c55e', label: 'High' };
  } else if (confidence >= 65) {
    return { bg: '#713f12', text: '#f59e0b', label: 'Medium' };
  } else {
    return { bg: '#7f1d1d', text: '#ef4444', label: 'Low' };
  }
}

export function ConfidenceBadge({
  confidence,
  notes,
  showNotes = false,
  size = 'md',
}: ConfidenceBadgeProps) {
  const { bg, text, label } = getConfidenceColor(confidence);

  const paddingH = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;
  const paddingV = size === 'sm' ? 3 : size === 'lg' ? 8 : 5;
  const fontSize = size === 'sm' ? 11 : size === 'lg' ? 16 : 13;
  const dotSize = size === 'sm' ? 6 : size === 'lg' ? 10 : 8;

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: bg,
          borderRadius: 100,
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
          alignSelf: 'flex-start',
          gap: 6,
        }}
      >
        <View
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: text,
          }}
        />
        <Text style={{ color: text, fontSize, fontWeight: '700' }}>
          {confidence}% {label}
        </Text>
      </View>
      {showNotes && notes && (
        <Text
          style={{
            color: '#a1a1aa',
            fontSize: 12,
            marginTop: 6,
            lineHeight: 18,
          }}
        >
          {notes}
        </Text>
      )}
    </View>
  );
}
