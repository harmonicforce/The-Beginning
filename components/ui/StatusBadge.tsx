import React from 'react';
import { ItemStatus } from '../../types/item';
import { Badge } from './Badge';

const STATUS_COLORS: Record<ItemStatus, string> = {
  Intake: '#71717a',
  'Photo Queue': '#f59e0b',
  Research: '#6366f1',
  Listed: '#22c55e',
  Sold: '#3b82f6',
  Shipped: '#8b5cf6',
};

interface StatusBadgeProps {
  status: ItemStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  return <Badge label={status} color={STATUS_COLORS[status]} size={size} />;
}

export { STATUS_COLORS };
