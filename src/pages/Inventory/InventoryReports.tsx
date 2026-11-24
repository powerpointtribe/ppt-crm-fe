import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Package, AlertTriangle, Clock, TrendingUp, TrendingDown, Boxes } from 'lucide-react'
import Layout from '@/components/Layout'
import {
  inventoryService,
  InventoryItem,
  InventoryStatistics,
  MovementStatistics,
} from '@/services/inventory'
import { formatDate } from '@/utils/formatters'
import { showToast } from '@/utils/toast'
import { humanize, inputCls, money, movementLabel } from '@/components/inventory/inventoryUi'

const isoDay = (d: Date) => d.toISOString().slice(0, 10)

function Stat({ icon: Icon, label, value, tone = 'text-gray-900' }: { icon: any; label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Icon className="w-4 h-4" /> {label}
      </div>
      <p className={`text-2xl font-semibold mt-1 tabular-nums ${tone}`}>{value}</p>
    </div>
  )
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0
  return (
    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
    </div>
  )
}

const csvCell = (v: unknown) => {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export default function InventoryReports() {
  const [stats, setStats] = useState<InventoryStatistics | null>(null)
  const [categories, setCategories] = useState<Array<{ id: string; name: string; count: number; value: number }>>([])
  const [lowStock, setLowStock] = useState<InventoryItem[]>([])
  const [expiring, setExpiring] = useState<InventoryItem[]>([])
  const [movementStats, setMovementStats] = useState<MovementStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const [from, setFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return isoDay(d)
  })
  const [to, setTo] = useState(() => isoDay(new Date()))
  const [expiringDays, setExpiringDays] = useState(30)

  useEffect(() => {
    Promise.all([
      inventoryService.getStatistics().catch(() => null),
      inventoryService.getCategoryBreakdown().catch(() => []),
      inventoryService.getLowStockItems().catch(() => []),
    ]).then(([s, c, l]) => {
      setStats(s)
      setCategories(c)
      setLowStock(Array.isArray(l) ? l : [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    inventoryService
      .getExpiringItems(expiringDays)
      .then(e => setExpiring(Array.isArray(e) ? e : []))
      .catch(() => setExpiring([]))
  }, [expiringDays])

  const loadMovements = useCallback(() => {
    inventoryService
      .getMovementStatistics({ startDate: from || undefined, endDate: to ? `${to}T23:59:59.999Z` : undefined })
      .then(setMovementStats)
      .catch(() => setMovementStats(null))
  }, [from, to])

  useEffect(() => {
    loadMovements()
  }, [loadMovements])

  // No server-side export endpoint exists, so page through the items API and build a CSV here.
  const exportCsv = async () => {
    try {
      setExporting(true)
      const all: InventoryItem[] = []
      let page = 1
      for (;;) {
        const res = await inventoryService.getItems({ page, limit: 100 })
        all.push(...(res.items || []))
        if (!res.pagination?.hasNext || page >= 50) break
        page++
      }
      const header = ['Item Code', 'Name', 'Category', 'Status', 'Unit', 'Current Stock', 'Reorder Level', 'Unit Cost', 'Currency', 'Stock Value', 'Location', 'Supplier', 'Expiry Date']
      const rows = all.map(i => [
        i.itemCode,
        i.name,
        typeof i.category === 'object' ? i.category?.name : '',
        i.status,
        i.unitOfMeasurement,
        i.currentStock,
        i.reorderLevel ?? '',
        i.unitCost ?? '',
        i.currency || '',
        (i.currentStock || 0) * (i.unitCost || 0),
        i.location || '',
        i.supplier || '',
        i.expiryDate ? i.expiryDate.slice(0, 10) : '',
      ])
      const csv = [header, ...rows].map(r => r.map(csvCell).join(',')).join('\n')
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `inventory-${isoDay(new Date())}.csv`
      a.click()
      URL.revokeObjectURL(url)
      showToast.success(`Exported ${all.length} items`)
    } catch {
      showToast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const maxCatValue = Math.max(0, ...categories.map(c => c.value))
  const maxTypeCount = Math.max(0, ...(movementStats?.movementTypes || []).map(t => t.count))

  return (
    <Layout title="Inventory Reports" subtitle="Stock value, low stock, expiries and movement activity">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-end">
          <button onClick={exportCsv} disabled={exporting} className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            <Download className="w-4 h-4" /> {exporting ? 'Exporting…' : 'Export items (CSV)'}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat icon={Package} label="Total items" value={stats?.totalItems ?? 0} />
              <Stat icon={Boxes} label="Stock value" value={money(stats?.totalValue)} />
              <Stat icon={AlertTriangle} label="Low stock" value={stats?.lowStockItems ?? 0} tone="text-yellow-700" />
              <Stat icon={AlertTriangle} label="Out of stock" value={stats?.outOfStockItems ?? 0} tone="text-red-700" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Value by category */}
              <section className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900 mb-4">Stock value by category</h2>
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-500 py-6 text-center">No items yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {categories.map(c => (
                      <li key={c.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <Link to={`/inventory/items?category=${c.id}`} className="text-gray-800 hover:text-indigo-600">
                            {c.name} <span className="text-gray-400">· {c.count} items</span>
                          </Link>
                          <span className="tabular-nums text-gray-900">{money(c.value)}</span>
                        </div>
                        <Bar value={c.value} max={maxCatValue} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Low stock */}
              <section className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">Low stock</h2>
                  <Link to="/inventory/items?lowStock=true" className="text-sm text-indigo-600 hover:underline">View in list</Link>
                </div>
                {lowStock.length === 0 ? (
                  <p className="text-sm text-gray-500 py-6 text-center">Nothing is at or below its reorder level.</p>
                ) : (
                  <ul className="divide-y divide-gray-100 text-sm max-h-80 overflow-y-auto">
                    {lowStock.map(i => (
                      <li key={i._id} className="flex justify-between py-2 gap-3">
                        <Link to={`/inventory/items/${i._id}`} className="text-gray-800 hover:text-indigo-600 truncate">
                          {i.name} <span className="text-gray-400">{i.itemCode}</span>
                        </Link>
                        <span className={`tabular-nums whitespace-nowrap ${i.currentStock <= 0 ? 'text-red-600' : 'text-yellow-700'}`}>
                          {i.currentStock} / reorder {i.reorderLevel ?? '—'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* Movement activity */}
            <section className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
                <h2 className="font-semibold text-gray-900">Movement activity</h2>
                <div className="flex gap-2 items-end">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">From</label>
                    <input type="date" className={inputCls} value={from} onChange={e => setFrom(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">To</label>
                    <input type="date" className={inputCls} value={to} onChange={e => setTo(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                <Stat icon={TrendingUp} label="Movements" value={movementStats?.summary.totalMovements ?? 0} />
                <Stat icon={TrendingUp} label="Units in" value={movementStats?.summary.totalQuantityIn ?? 0} tone="text-green-700" />
                <Stat icon={TrendingDown} label="Units out" value={movementStats?.summary.totalQuantityOut ?? 0} tone="text-orange-700" />
                <Stat icon={Boxes} label="Value moved" value={money(movementStats?.summary.totalValue)} />
              </div>
              {!movementStats || movementStats.movementTypes.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No movements in this period.</p>
              ) : (
                <ul className="space-y-3">
                  {movementStats.movementTypes.map(t => (
                    <li key={t._id} className="grid grid-cols-[8rem_1fr_auto] items-center gap-3 text-sm">
                      <span className="text-gray-700">{movementLabel(t._id)}</span>
                      <Bar value={t.count} max={maxTypeCount} />
                      <span className="tabular-nums text-gray-600 whitespace-nowrap">
                        {t.count} · {t.totalQuantity} units
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 text-right">
                <Link to={`/inventory/movements?from=${from}&to=${to}`} className="text-sm text-indigo-600 hover:underline">
                  See movements for this period
                </Link>
              </div>
            </section>

            {/* Expiring */}
            <section className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4 gap-3">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" /> Expiring soon
                </h2>
                <select className={`${inputCls} w-auto`} value={expiringDays} onChange={e => setExpiringDays(Number(e.target.value))}>
                  {[7, 30, 60, 90].map(d => (
                    <option key={d} value={d}>Next {d} days</option>
                  ))}
                </select>
              </div>
              {expiring.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No items expire in the next {expiringDays} days.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                        <th className="py-2 pr-3 font-medium">Item</th>
                        <th className="py-2 pr-3 font-medium">Status</th>
                        <th className="py-2 pr-3 font-medium text-right">Stock</th>
                        <th className="py-2 font-medium">Expires</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {expiring.map(i => (
                        <tr key={i._id}>
                          <td className="py-2 pr-3">
                            <Link to={`/inventory/items/${i._id}`} className="text-gray-800 hover:text-indigo-600">{i.name}</Link>
                          </td>
                          <td className="py-2 pr-3 text-gray-600">{humanize(i.status)}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{i.currentStock}</td>
                          <td className="py-2 whitespace-nowrap">{formatDate(i.expiryDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </Layout>
  )
}
