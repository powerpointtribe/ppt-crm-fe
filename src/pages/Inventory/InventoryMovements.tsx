import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Check, X, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import Layout from '@/components/Layout'
import Modal from '@/components/ui/Modal'
import RecordMovementModal from '@/components/inventory/RecordMovementModal'
import {
  inventoryService,
  InventoryMovement,
  InventoryMovementType,
  PaginatedResponse,
} from '@/services/inventory'
import { formatDate } from '@/utils/formatters'
import { showToast } from '@/utils/toast'
import {
  humanize,
  inputCls,
  money,
  movementBadge,
  movementLabel,
  MOVEMENT_STATUS_BADGE,
  personName,
} from '@/components/inventory/inventoryUi'

const LIMIT = 20

export default function InventoryMovements() {
  const [params, setParams] = useSearchParams()
  const itemId = params.get('itemId') || ''
  const movementType = params.get('type') || ''
  const status = params.get('status') || ''
  const startDate = params.get('from') || ''
  const endDate = params.get('to') || ''
  const page = Number(params.get('page')) || 1

  const [data, setData] = useState<PaginatedResponse<InventoryMovement> | null>(null)
  const [loading, setLoading] = useState(true)
  const [itemName, setItemName] = useState('')
  const [showRecord, setShowRecord] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<InventoryMovement | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await inventoryService.getMovements({
        page,
        limit: LIMIT,
        inventoryItemId: itemId || undefined,
        movementType: movementType || undefined,
        status: status || undefined,
        startDate: startDate || undefined,
        // include the whole end day
        endDate: endDate ? `${endDate}T23:59:59.999Z` : undefined,
      })
      setData(res)
    } catch {
      showToast.error('Failed to load movements')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [page, itemId, movementType, status, startDate, endDate])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!itemId) return setItemName('')
    inventoryService
      .getItemById(itemId)
      .then(i => setItemName(i?.name || ''))
      .catch(() => setItemName(''))
  }, [itemId])

  const approve = async (m: InventoryMovement) => {
    try {
      setBusyId(m._id)
      await inventoryService.approveMovement(m._id)
      showToast.success('Movement approved')
      load()
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to approve')
    } finally {
      setBusyId(null)
    }
  }

  const reject = async () => {
    if (!rejecting) return
    if (!rejectReason.trim()) return showToast.error('Enter a reason')
    try {
      setBusyId(rejecting._id)
      await inventoryService.rejectMovement(rejecting._id, rejectReason.trim())
      showToast.success('Movement rejected')
      setRejecting(null)
      setRejectReason('')
      load()
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to reject')
    } finally {
      setBusyId(null)
    }
  }

  const items = data?.items || []
  const pg = data?.pagination
  const hasFilters = !!(itemId || movementType || status || startDate || endDate)

  return (
    <Layout title="Stock Movements" subtitle="Every stock in, stock out and adjustment, with who made it">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end lg:justify-between">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Type</label>
              <select className={inputCls} value={movementType} onChange={e => setFilter('type', e.target.value)}>
                <option value="">All types</option>
                {Object.values(InventoryMovementType).map(t => (
                  <option key={t} value={t}>{movementLabel(t)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select className={inputCls} value={status} onChange={e => setFilter('status', e.target.value)}>
                <option value="">All statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">From</label>
              <input type="date" className={inputCls} value={startDate} onChange={e => setFilter('from', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To</label>
              <input type="date" className={inputCls} value={endDate} onChange={e => setFilter('to', e.target.value)} />
            </div>
          </div>
          <button onClick={() => setShowRecord(true)} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Record Movement
          </button>
        </div>

        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {itemId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                Item: {itemName || '…'}
                <button onClick={() => setFilter('itemId', '')} aria-label="Clear item filter"><X className="w-3.5 h-3.5" /></button>
              </span>
            )}
            <button onClick={() => setParams(new URLSearchParams())} className="text-gray-500 hover:text-gray-800 underline">
              Clear all filters
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-14 text-center">
              <ArrowUpDown className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-700 font-medium">No movements found</p>
              <p className="text-sm text-gray-500 mt-1">
                {hasFilters ? 'Try widening your filters.' : 'Record a stock in or stock out to start the log.'}
              </p>
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium text-right">Qty</th>
                  <th className="px-4 py-3 font-medium text-right">Stock</th>
                  <th className="px-4 py-3 font-medium text-right">Cost</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">By</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(m => {
                  const it = typeof m.inventoryItem === 'object' ? m.inventoryItem : null
                  return (
                    <tr key={m._id} className="hover:bg-gray-50 align-top">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{formatDate(m.movementDate || m.createdAt)}</td>
                      <td className="px-4 py-3">
                        {it ? (
                          <Link to={`/inventory/items/${it._id}`} className="font-medium text-gray-900 hover:text-indigo-600">
                            {it.name}
                          </Link>
                        ) : '—'}
                        {it?.itemCode && <div className="text-xs text-gray-500">{it.itemCode}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${movementBadge(m.movementType)}`}>{movementLabel(m.movementType)}</span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{m.quantity}</td>
                      <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap text-gray-600">{m.previousStock} → {m.newStock}</td>
                      <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">{m.totalCost ? money(m.totalCost) : '—'}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-[16rem]">
                        <div className="truncate" title={m.reason}>{m.reason}</div>
                        {m.referenceNumber && <div className="text-xs text-gray-500">Ref {m.referenceNumber}</div>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{personName(m.performedBy)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${MOVEMENT_STATUS_BADGE[m.status] || 'bg-gray-100 text-gray-800'}`}>{humanize(m.status)}</span>
                      </td>
                      <td className="px-4 py-3">
                        {m.status === 'pending' && (
                          <div className="flex gap-1 justify-end">
                            <button disabled={busyId === m._id} onClick={() => approve(m)} className="p-1.5 rounded hover:bg-green-50 text-green-700 disabled:opacity-50" aria-label="Approve">
                              <Check className="w-4 h-4" />
                            </button>
                            <button disabled={busyId === m._id} onClick={() => setRejecting(m)} className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-50" aria-label="Reject">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {pg && pg.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Page {pg.page} of {pg.totalPages} · {pg.total} movements
            </span>
            <div className="flex gap-2">
              <button disabled={!pg.hasPrev} onClick={() => setFilter('page', String(pg.page - 1))} className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button disabled={!pg.hasNext} onClick={() => setFilter('page', String(pg.page + 1))} className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <RecordMovementModal isOpen={showRecord} onClose={() => setShowRecord(false)} onRecorded={load} />

      <Modal isOpen={!!rejecting} onClose={() => setRejecting(null)} title="Reject movement" size="sm">
        <p className="text-sm text-gray-600 mb-3">
          Rejecting records the decision but does <strong>not</strong> reverse the stock change. Record an adjustment if the count needs correcting.
        </p>
        <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
        <textarea rows={3} className={inputCls} value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={() => setRejecting(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={reject} disabled={!!busyId} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">Reject</button>
        </div>
      </Modal>
    </Layout>
  )
}
