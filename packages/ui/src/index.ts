// @ordriva/ui - Design Tokens, Helpers and Shared Component Utilities

export const COLOR_TOKENS = {
  primaryNavy: '#172554',
  primaryTeal: '#0F766E',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  pageSurface: '#F8FAFC',
  cardSurface: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
} as const;

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatTime(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function getStatusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'available':
    case 'succeeded':
    case 'ready':
    case 'completed':
    case 'active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'occupied':
    case 'preparing':
    case 'processing':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'reserved':
    case 'billed':
    case 'draft':
    case 'placed':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'failed':
    case 'cancelled':
    case 'waste':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

