import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, ArrowUpDown, AlertTriangle, Package } from 'lucide-react'
import Layout from '@/components/Layout'
import Modal from '@/components/ui/Modal'
import RecordMovementModal from '@/components/inventory/RecordMovementModal'
import { inventoryService, InventoryItem, InventoryMovement } from '@/services/inventory'
import { formatDate } from '@/utils/formatters'
import { showToast } from '@/utils/toast'
import {
  humanize,
  money,
  movementBadge,
  movementLabel,
  MOVEMENT_STATUS_BADGE,
  personName,
} from '@/components/inventory/inventoryUi'

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-gray-100 last:border-0 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 text-right break-words">{value || '—'}</span>
    </div>
  )
}

function stockState(item: InventoryItem) {
  if (item.currentStock <= 0) return { label: 'Out of stock', cls: 'bg-red-100 text-red-800' }
  if (item.reorderLevel != null && item.currentStock <= item.reorderLevel)
    return { label: 'Low stock', cls: 'bg-yellow-100 text-yellow-800' }
  return { label: 'In stock', cls: 'bg-green-100 text-green-800' }
}

export default function InventoryItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [showMovement, setShowMovement] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    try {
      const [it, mv] = await Promise.all([
        inventoryService.getItemById(id!),
        inventoryService.getMovements({ inventoryItemId: id, limit: 10 }).catch(() => ({ items: [] as InventoryMovement[] })),
      ])
      setItem(it)
      setMovements(mv.items)
    } catch {
      showToast.error('Failed to load item')
      navigate('/inventory/items')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await inventoryService.deleteItem(id!)
      showToast.success('Item discontinued')
      navigate('/inventory/items')
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to discontinue item')
    } finally {
      setDeleting(false)
    }
  }

  if (loading || !item) {
    return (
      <Layout title="Inventory Item">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </Layout>
    )
  }

  const category = typeof item.category === 'object' ? item.category?.name : undefined
  const state = stockState(item)
  const value = (item.currentStock || 0) * (item.unitCost || 0)

  return (
    <Layout title={item.name} subtitle={item.itemCode}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => navigate('/inventory/items')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> Back to Items
          </button>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowMovement(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
              <ArrowUpDown className="w-4 h-4" /> Record Movement
            </button>
            <Link to={`/inventory/items/${item._id}/edit`} className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              <Edit className="w-4 h-4" /> Edit
            </Link>
            <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50">
              <Trash2 className="w-4 h-4" /> Discontinue
            </button>
          </div>
        </div>

        {/* Stock summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Current stock</p>
            <p className="text-2xl font-semibold text-gray-900">
              {item.currentStock} <span className="text-sm font-normal text-gray-500">{humanize(item.unitOfMeasurement)}</span>
            </p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${state.cls}`}>{state.label}</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Reorder level</p>
            <p className="text-2xl font-semibold text-gray-900">{item.reorderLevel ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-1">Min {item.minimumStock ?? 0} · Max {item.maximumStock ?? '—'}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Unit cost</p>
            <p className="text-2xl font-semibold text-gray-900">{money(item.unitCost, item.currency)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Stock value</p>
            <p className="text-2xl font-semibold text-gray-900">{money(value, item.currency)}</p>
          </div>
        </div>

        {item.currentStock <= (item.reorderLevel ?? -1) && (
          <div className="flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Stock is at or below the reorder level. Consider restocking.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-1">
            <h2 className="font-semibold text-gray-900 mb-2">Details</h2>
            <Row label="Category" value={category} />
            <Row label="Status" value={humanize(item.status)} />
            <Row label="Brand" value={item.brand} />
            <Row label="Model" value={item.model} />
            <Row label="Serial #" value={item.serialNumber} />
            <Row label="Barcode" value={item.barcode} />
            <Row label="Location" value={item.location} />
            <Row label="Supplier" value={item.supplier} />
            <Row label="Supplier contact" value={item.supplierContact} />
            <Row label="Purchased" value={item.purchaseDate && formatDate(item.purchaseDate)} />
            <Row label="Expires" value={item.expiryDate && formatDate(item.expiryDate)} />
            <Row label="Warranty until" value={item.warrantyExpiry && formatDate(item.warrantyExpiry)} />
            <Row label="Depreciable" value={item.isDepreciable ? `Yes${item.depreciationRate != null ? ` (${item.depreciationRate}%/yr)` : ''}` : 'No'} />
            <Row label="Last stock check" value={item.lastStockCheck && formatDate(item.lastStockCheck)} />
            {item.tags && item.tags.length > 0 && (
              <div className="pt-3 flex flex-wrap gap-1.5">
                {item.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-700">{t}</span>
                ))}
              </div>
            )}
            {(item.description || item.notes) && (
              <div className="pt-4 space-y-2 text-sm text-gray-700">
                {item.description && <p>{item.description}</p>}
                {item.notes && <p className="text-gray-500 whitespace-pre-line">{item.notes}</p>}
              </div>
            )}
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Recent Movements</h2>
              <Link to={`/inventory/movements?itemId=${item._id}`} className="text-sm text-indigo-600 hover:underline">
                View all
              </Link>
            </div>
            {movements.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">
                <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                No movements recorded for this item yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                      <th className="py-2 pr-3 font-medium">Date</th>
                      <th className="py-2 pr-3 font-medium">Type</th>
                      <th className="py-2 pr-3 font-medium text-right">Qty</th>
                      <th className="py-2 pr-3 font-medium text-right">Stock</th>
                      <th className="py-2 pr-3 font-medium">Reason</th>
                      <th className="py-2 pr-3 font-medium">By</th>
                      <th className="py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map(m => (
                      <tr key={m._id} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 pr-3 whitespace-nowrap text-gray-600">{formatDate(m.movementDate || m.createdAt)}</td>
                        <td className="py-2 pr-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${movementBadge(m.movementType)}`}>{movementLabel(m.movementType)}</span>
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">{m.quantity}</td>
                        <td className="py-2 pr-3 text-right tabular-nums whitespace-nowrap text-gray-600">
                          {m.previousStock} → {m.newStock}
                        </td>
                        <td className="py-2 pr-3 text-gray-700 max-w-[14rem] truncate" title={m.reason}>{m.reason}</td>
                        <td className="py-2 pr-3 text-gray-600 whitespace-nowrap">{personName(m.performedBy)}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${MOVEMENT_STATUS_BADGE[m.status] || 'bg-gray-100 text-gray-800'}`}>
                            {humanize(m.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      <RecordMovementModal isOpen={showMovement} onClose={() => setShowMovement(false)} onRecorded={load} item={item} />

      <Modal isOpen={confirmDelete} onClose={() => setConfirmDelete(false)} title="Discontinue item?" size="sm">
        <p className="text-sm text-gray-600 mb-6">
          This marks <strong>{item.name}</strong> as discontinued. The record and its movement history are kept, and you can reactivate it from Edit.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setConfirmDelete(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
            {deleting ? 'Saving…' : 'Discontinue'}
          </button>
        </div>
      </Modal>
    </Layout>
  )
}
