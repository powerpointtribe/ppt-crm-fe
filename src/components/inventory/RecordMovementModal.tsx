import { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/ui/Modal'
import { inventoryService, InventoryItem, InventoryMovementType } from '@/services/inventory'
import { showToast } from '@/utils/toast'
import { inputCls, MOVEMENT_TYPE_META, humanize } from './inventoryUi'

// TRANSFER needs from/to unit or district pickers; not offered here yet.
const TYPES = [
  InventoryMovementType.STOCK_IN,
  InventoryMovementType.STOCK_OUT,
  InventoryMovementType.RETURNED,
  InventoryMovementType.ADJUSTMENT,
  InventoryMovementType.DAMAGE,
  InventoryMovementType.EXPIRED,
  InventoryMovementType.DONATED,
  InventoryMovementType.SOLD,
]

interface Props {
  isOpen: boolean
  onClose: () => void
  onRecorded: () => void
  /** Lock the modal to one item (used from the item detail page). */
  item?: InventoryItem | null
}

export default function RecordMovementModal({ isOpen, onClose, onRecorded, item }: Props) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [itemId, setItemId] = useState('')
  const [movementType, setMovementType] = useState<string>(InventoryMovementType.STOCK_IN)
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [supplier, setSupplier] = useState('')
  const [movementDate, setMovementDate] = useState('')
  const [notes, setNotes] = useState('')
  const [requireApproval, setRequireApproval] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setItemId(item?._id || '')
    setMovementType(InventoryMovementType.STOCK_IN)
    setQuantity('')
    setReason('')
    setUnitCost('')
    setReferenceNumber('')
    setSupplier('')
    setMovementDate('')
    setNotes('')
    setRequireApproval(false)
    if (!item) {
      inventoryService
        .getItems({ limit: 200, sortBy: 'name', sortOrder: 'asc' })
        .then(res => setItems(res.items || []))
        .catch(() => setItems([]))
    }
  }, [isOpen, item?._id])

  const selected = item || items.find(i => i._id === itemId)
  const direction = MOVEMENT_TYPE_META[movementType]?.direction

  const preview = useMemo(() => {
    if (!selected || quantity === '') return null
    const q = Number(quantity)
    const cur = selected.currentStock ?? 0
    if (direction === 'in') return cur + q
    if (direction === 'out') return cur - q
    return q
  }, [selected, quantity, direction])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetId = item?._id || itemId
    if (!targetId) return showToast.error('Select an item')
    if (quantity === '' || Number(quantity) < 0) return showToast.error('Enter a valid quantity')
    if (!reason.trim()) return showToast.error('Reason is required')
    if (preview !== null && preview < 0) return showToast.error('Not enough stock for this movement')

    try {
      setSaving(true)
      await inventoryService.createMovement({
        inventoryItem: targetId,
        movementType,
        quantity: Number(quantity),
        reason: reason.trim(),
        unitCost: unitCost === '' ? undefined : Number(unitCost),
        referenceNumber: referenceNumber.trim() || undefined,
        supplier: supplier.trim() || undefined,
        movementDate: movementDate || undefined,
        notes: notes.trim() || undefined,
        status: requireApproval ? 'pending' : undefined,
      })
      showToast.success(requireApproval ? 'Movement submitted for approval' : 'Movement recorded')
      onRecorded()
      onClose()
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to record movement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Stock Movement" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!item && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item *</label>
            <select className={inputCls} value={itemId} onChange={e => setItemId(e.target.value)}>
              <option value="">Select an item</option>
              {items.map(i => (
                <option key={i._id} value={i._id}>
                  {i.name} ({i.itemCode}) — {i.currentStock} in stock
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Movement Type *</label>
            <select className={inputCls} value={movementType} onChange={e => setMovementType(e.target.value)}>
              {TYPES.map(t => (
                <option key={t} value={t}>{MOVEMENT_TYPE_META[t]?.label || humanize(t)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {direction === 'set' ? 'New stock count *' : 'Quantity *'}
            </label>
            <input type="number" min={0} className={inputCls} value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>
        </div>

        {selected && (
          <div className="text-sm rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-gray-700">
            Current stock: <strong>{selected.currentStock}</strong>
            {preview !== null && (
              <>
                {' '}→ after this movement:{' '}
                <strong className={preview < 0 ? 'text-red-600' : 'text-gray-900'}>{preview}</strong>
              </>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
          <input className={inputCls} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Purchased for youth conference" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost</label>
            <input type="number" min={0} step="0.01" className={inputCls} value={unitCost} onChange={e => setUnitCost(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference #</label>
            <input className={inputCls} value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" className={inputCls} value={movementDate} onChange={e => setMovementDate(e.target.value)} />
          </div>
        </div>

        {direction === 'in' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <input className={inputCls} value={supplier} onChange={e => setSupplier(e.target.value)} />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea rows={2} className={inputCls} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" className="rounded border-gray-300" checked={requireApproval} onChange={e => setRequireApproval(e.target.checked)} />
          Flag for approval
          <span className="text-gray-500">(stock is still updated immediately)</span>
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Record Movement'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
