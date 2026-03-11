/**
 * Formatting utilities for dates, currency, and numbers.
 * All monetary values formatted as USD with 2 decimal places.
 * Display dates as "Month DD, YYYY". Storage dates as ISO 8601.
 */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Format as "$1,234.56" */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/** Format ISO date as "March 08, 2026" */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`;
}

/** Format ISO date as "Mar 8" (short form for lists) */
export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

/** Format as relative time: "2h ago", "3d ago", "just now" */
export function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return formatDateShort(iso);
}

/** Format percentage with 1 decimal */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** Format ROI: "+125.3%" or "-12.5%" */
export function formatROI(roi: number): string {
  const sign = roi >= 0 ? '+' : '';
  return `${sign}${roi.toFixed(1)}%`;
}

/** Get today's date as ISO string (date only) */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
