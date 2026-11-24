import { InventoryMovementType } from '@/services/inventory'

export const humanize = (v?: string) =>
  (v || '')
    .toLowerCase()
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

export const MOVEMENT_TYPE_META: Record<string, { label: string; direction: 'in' | 'out' | 'set'; badge: string }> = {
  [InventoryMovementType.STOCK_IN]: { label: 'Stock In', direction: 'in', badge: 'bg-green-100 text-green-800' },
  [InventoryMovementType.RETURNED]: { label: 'Returned', direction: 'in', badge: 'bg-green-100 text-green-800' },
  [InventoryMovementType.STOCK_OUT]: { label: 'Stock Out', direction: 'out', badge: 'bg-orange-100 text-orange-800' },
  [InventoryMovementType.SOLD]: { label: 'Sold', direction: 'out', badge: 'bg-orange-100 text-orange-800' },
  [InventoryMovementType.DONATED]: { label: 'Donated', direction: 'out', badge: 'bg-purple-100 text-purple-800' },
  [InventoryMovementType.DAMAGE]: { label: 'Damaged', direction: 'out', badge: 'bg-red-100 text-red-800' },
  [InventoryMovementType.EXPIRED]: { label: 'Expired', direction: 'out', badge: 'bg-red-100 text-red-800' },
  [InventoryMovementType.TRANSFER]: { label: 'Transfer', direction: 'out', badge: 'bg-blue-100 text-blue-800' },
  [InventoryMovementType.ADJUSTMENT]: { label: 'Adjustment', direction: 'set', badge: 'bg-gray-100 text-gray-800' },
}

export const movementLabel = (t: string) => MOVEMENT_TYPE_META[t]?.label || humanize(t)
export const movementBadge = (t: string) => MOVEMENT_TYPE_META[t]?.badge || 'bg-gray-100 text-gray-800'

export const MOVEMENT_STATUS_BADGE: Record<string, string> = {
  approved: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
}

export const personName = (p: any) =>
  p && typeof p === 'object' ? `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email || '—' : '—'

export const money = (amount: number | undefined, currency = 'NGN') => {
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount || 0)
  } catch {
    return `${currency} ${(amount || 0).toLocaleString()}`
  }
}

export const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
