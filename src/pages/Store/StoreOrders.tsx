import { useState, useEffect, useMemo } from 'react'
import Layout from '@/components/Layout'
import { getOrders, updateOrderStatus, getOrderStats, verifyOrderPayment, bulkUpdateOrderStatus, type Order } from '@/services/store'
import { showToast } from '@/utils/toast'
import {
  Package, DollarSign, TrendingUp, ShoppingBag,
  ChevronRight, Search, X, User, Phone, Mail, Download, Upload, CheckSquare,
} from 'lucide-react'

const STATUS_OPTIONS = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'failed']

const STATUS_STYLE: Record<string, { dot: string; bg: string; text: string }> = {
  pending:    { dot: 'bg-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-700' },
  paid:       { dot: 'bg-green-400',   bg: 'bg-green-50',   text: 'text-green-700' },
  processing: { dot: 'bg-blue-400',    bg: 'bg-blue-50',    text: 'text-blue-700' },
  shipped:    { dot: 'bg-violet-400',  bg: 'bg-violet-50',  text: 'text-violet-700' },
  delivered:  { dot: 'bg-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  cancelled:  { dot: 'bg-red-400',     bg: 'bg-red-50',     text: 'text-red-700' },
  refunded:   { dot: 'bg-gray-400',    bg: 'bg-gray-50',    text: 'text-gray-600' },
  failed:     { dot: 'bg-orange-400',  bg: 'bg-orange-50',  text: 'text-orange-700' },
}

const PAYMENT_STYLE: Record<string, { dot: string; text: string }> = {
  pending:    { dot: 'bg-amber-400',  text: 'text-amber-600' },
  successful: { dot: 'bg-green-400',  text: 'text-green-600' },
  failed:     { dot: 'bg-red-400',    text: 'text-red-600' },
  cancelled:  { dot: 'bg-gray-400',   text: 'text-gray-500' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function PaymentDot({ status }: { status: string }) {
  const s = PAYMENT_STYLE[status] || PAYMENT_STYLE.pending
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status === 'successful' ? 'Paid' : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount)

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })

const formatTime = (date: string) =>
  new Date(date).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })

function parseDesignColour(colour: string) {
  const m = colour?.match(/^(.+?)\s*\(([^)]+)\)$/)
  return m ? { design: m[1].trim(), color: m[2].trim() } : { design: colour || '', color: '' }
}

export default function StoreOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setSelectedIds(new Set()) }, [page, statusFilter, debouncedSearch])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [ordersData, statsData] = await Promise.all([
        getOrders({ page, limit: 20, status: statusFilter || undefined, search: debouncedSearch || undefined }),
        getOrderStats(),
      ])
      setOrders(ordersData.data)
      setTotalPages(ordersData.totalPages)
      setStats(statsData)
    } catch {
      showToast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [page, statusFilter, debouncedSearch])

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, { status: newStatus })
      showToast.success('Status updated')
      fetchData()
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null)
      }
    } catch {
      showToast.error('Failed to update status')
    }
  }

  const [verifying, setVerifying] = useState(false)
  const handleVerifyPayment = async (orderId: string) => {
    try {
      setVerifying(true)
      const result = await verifyOrderPayment(orderId)
      if (result.verified) {
        showToast.success('Payment verified successfully')
        fetchData()
        setSelectedOrder(prev => prev ? { ...prev, paymentStatus: 'successful', status: 'paid' } : null)
      } else {
        showToast.error(result.message || 'Payment not found or not successful')
      }
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to verify payment')
    } finally {
      setVerifying(false)
    }
  }

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {}
    stats?.statusBreakdown?.forEach((s: any) => { map[s.status] = s.count })
    return map
  }, [stats])

  const avgOrderValue = stats && stats.totalOrders > 0
    ? stats.totalRevenue / stats.totalOrders : 0

  const totalItemsSold = stats?.totalItemsSold ?? 0

  const [exporting, setExporting] = useState(false)
  const handleExportCSV = async () => {
    try {
      setExporting(true)
      const all = await getOrders({ page: 1, limit: 10000, status: statusFilter || undefined, search: debouncedSearch || undefined })
      const rows = all.data.flatMap((o: Order) =>
        o.items.map(item => {
          const cm = item.colour?.match(/^(.+?)\s*\(([^)]+)\)$/)
          const design = cm ? cm[1].trim() : item.colour || ''
          const color = cm ? cm[2].trim() : ''
          return [
            o.orderNumber,
            formatDate(o.createdAt),
            o.delivery.fullName,
            o.delivery.email || o.customerEmail || '',
            o.delivery.phone,
            o.delivery.address + (o.delivery.city ? ', ' + o.delivery.city : '') + (o.delivery.state ? ', ' + o.delivery.state : ''),
            item.productName,
            design,
            color,
            item.size || '',
            item.quantity,
            item.unitPrice,
            item.totalPrice,
            o.status,
            o.paymentStatus,
            o.totalAmount,
          ]
        })
      )
      const header = ['Order #', 'Date', 'Customer', 'Email', 'Phone', 'Address', 'Product', 'Design', 'Colour', 'Size', 'Qty', 'Unit Price', 'Item Total', 'Status', 'Payment', 'Order Total']
      const csv = [header, ...rows].map(r => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      showToast.success(`Exported ${all.data.length} orders`)
    } catch {
      showToast.error('Failed to export orders')
    } finally {
      setExporting(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(orders.map(o => o._id)))
    }
  }

  const handleBulkStatus = async (newStatus: string) => {
    const selected = orders.filter(o => selectedIds.has(o._id))
    if (!selected.length) return

    try {
      setBulkUpdating(true)
      const payload = selected.map(o => ({ orderNumber: o.orderNumber, status: newStatus }))
      const result = await bulkUpdateOrderStatus(payload)
      showToast.success(`${result.updated} order(s) marked as ${newStatus}`)
      setSelectedIds(new Set())
      fetchData()
    } catch {
      showToast.error('Failed to update orders')
    } finally {
      setBulkUpdating(false)
    }
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    try {
      setImporting(true)
      const text = await file.text()
      const lines = text.split('\n').map(line => {
        const result: string[] = []
        let current = ''
        let inQuotes = false
        for (const char of line) {
          if (char === '"') { inQuotes = !inQuotes; continue }
          if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue }
          current += char
        }
        result.push(current.trim())
        return result
      })

      if (lines.length < 2) { showToast.error('CSV file is empty'); return }

      const header = lines[0].map(h => h.toLowerCase().replace(/[^a-z#]/g, ''))
      const orderCol = header.findIndex(h => h === 'order#' || h === 'ordernumber' || h === 'order')
      const statusCol = header.findIndex(h => h === 'status')

      if (orderCol === -1 || statusCol === -1) {
        showToast.error('CSV must have "Order #" and "Status" columns')
        return
      }

      const validStatuses = new Set(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
      const orderMap = new Map<string, string>()

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i]
        if (!row[orderCol]) continue
        const orderNum = row[orderCol]
        const status = row[statusCol]?.toLowerCase()
        if (status && validStatuses.has(status) && !orderMap.has(orderNum)) {
          orderMap.set(orderNum, status)
        }
      }

      if (orderMap.size === 0) {
        showToast.error('No valid status updates found in the CSV')
        return
      }

      const payload = Array.from(orderMap.entries()).map(([orderNumber, status]) => ({ orderNumber, status }))
      const result = await bulkUpdateOrderStatus(payload)
      showToast.success(`${result.updated} order(s) updated, ${result.skipped} skipped`)
      if (result.errors.length > 0) {
        showToast.error(`Issues: ${result.errors.slice(0, 3).join('; ')}`)
      }
      fetchData()
    } catch {
      showToast.error('Failed to import CSV')
    } finally {
      setImporting(false)
    }
  }

  const selectedCount = selectedIds.size

  return (
    <Layout title="Orders" subtitle="Manage store orders">

      {/* Analytics overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders ?? '—'}</p>
              <p className="text-xs text-gray-500">Paid Orders</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats ? formatPrice(stats.totalRevenue) : '—'}</p>
              <p className="text-xs text-gray-500">Total Revenue</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{avgOrderValue ? formatPrice(avgOrderValue) : '—'}</p>
              <p className="text-xs text-gray-500">Avg Order Value</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalItemsSold || '—'}</p>
              <p className="text-xs text-gray-500">Items Sold</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status pills */}
      {stats?.statusBreakdown?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => { setStatusFilter(''); setPage(1) }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              !statusFilter ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {STATUS_OPTIONS.filter(s => statusCounts[s]).map(s => {
            const style = STATUS_STYLE[s] || STATUS_STYLE.pending
            const active = statusFilter === s
            return (
              <button
                key={s}
                onClick={() => { setStatusFilter(active ? '' : s); setPage(1) }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  active ? `${style.bg} ${style.text} ring-1 ring-current` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)} ({statusCounts[s]})
              </button>
            )
          })}
        </div>
      )}

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 mb-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
          <CheckSquare className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span className="text-sm font-medium text-indigo-700">{selectedCount} selected</span>
          <div className="flex-1" />
          <div className="flex flex-wrap gap-1.5">
            {['processing', 'shipped', 'delivered', 'cancelled'].map(s => {
              const style = STATUS_STYLE[s] || STATUS_STYLE.pending
              return (
                <button
                  key={s}
                  onClick={() => handleBulkStatus(s)}
                  disabled={bulkUpdating}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${style.bg} ${style.text} hover:ring-1 hover:ring-current disabled:opacity-50`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-1 p-1 rounded hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search + Export + Import */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by order #, name, email..."
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exporting || orders.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export'}</span>
        </button>
        <label className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer ${importing ? 'opacity-40 pointer-events-none' : ''}`}>
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">{importing ? 'Importing...' : 'Import'}</span>
          <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" disabled={importing} />
        </label>
      </div>

      {/* Orders table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No orders found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-3 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={orders.length > 0 && selectedIds.size === orders.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Items</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(order => (
                  <tr
                    key={order._id}
                    onClick={() => setSelectedOrder(order)}
                    className={`hover:bg-gray-50/50 cursor-pointer transition-colors ${selectedIds.has(order._id) ? 'bg-indigo-50/50' : ''}`}
                  >
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(order._id)}
                        onChange={() => toggleSelect(order._id)}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono font-semibold text-gray-900 text-xs">{order.orderNumber}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{order.delivery.fullName}</p>
                      <p className="text-xs text-gray-400">{order.delivery.email || order.delivery.phone}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-600">{order.items.reduce((s, i) => s + i.quantity, 0)} item{order.items.length !== 1 ? 's' : ''}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={order.status} />
                        {order.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-orange-600 bg-orange-50 rounded px-1.5 py-0.5 font-medium">
                            Can still verify
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-semibold text-gray-900">{formatPrice(order.totalAmount)}</p>
                      {order.discountAmount > 0 && (
                        <p className="text-xs text-green-600">-{formatPrice(order.discountAmount)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      <ChevronRight className="w-4 h-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <p className="text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Order detail slide-over */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b z-10 px-5 py-4 flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-gray-900">{selectedOrder.orderNumber}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(selectedOrder.createdAt)} at {formatTime(selectedOrder.createdAt)}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Status + Payment row */}
              <div className="flex items-center gap-3">
                <StatusBadge status={selectedOrder.status} />
                <PaymentDot status={selectedOrder.paymentStatus} />
              </div>

              {/* Customer card */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Customer</p>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{selectedOrder.delivery.fullName}</span>
                </div>
                {selectedOrder.delivery.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{selectedOrder.delivery.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{selectedOrder.delivery.phone}</span>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Items</p>
                <div className="space-y-2.5">
                  {selectedOrder.items.map((item, i) => {
                    const { design, color } = parseDesignColour(item.colour || '')
                    const imgSrc = item.images?.[0]
                    return (
                      <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                        {imgSrc && (
                          <img src={imgSrc} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-sm">{item.productName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {design && <span>{design}</span>}
                            {color && <span> · {color}</span>}
                            {item.size && <span> · {item.size}</span>}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-gray-900">{formatPrice(item.totalPrice)}</p>
                          <p className="text-xs text-gray-400">x{item.quantity} @ {formatPrice(item.unitPrice)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-3 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-gray-900 pt-1 border-t">
                  <span>Total</span>
                  <span>{formatPrice(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Verify payment */}
              {selectedOrder.paymentStatus !== 'successful' && selectedOrder.flutterwaveRef && (
                <div className="border-t pt-4">
                  {selectedOrder.status === 'failed' && (
                    <div className="mb-3 flex items-center gap-2 p-2.5 bg-orange-50 border border-orange-200 rounded-lg">
                      <span className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0" />
                      <p className="text-xs text-orange-700">Payment expired — you can still verify if the customer paid</p>
                    </div>
                  )}
                  <button
                    onClick={() => handleVerifyPayment(selectedOrder._id)}
                    disabled={verifying}
                    className="w-full py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium hover:bg-amber-100 transition disabled:opacity-50"
                  >
                    {verifying ? 'Verifying...' : 'Verify Payment'}
                  </button>
                </div>
              )}

              {/* Update status */}
              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Update Status</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {STATUS_OPTIONS.filter(s => s !== 'paid' && s !== 'failed').map(s => {
                    const style = STATUS_STYLE[s] || STATUS_STYLE.pending
                    const active = selectedOrder.status === s
                    return (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(selectedOrder._id, s)}
                        className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                          active
                            ? `${style.bg} ${style.text} ring-1 ring-current`
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
