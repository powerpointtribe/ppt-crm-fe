import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { getOrders, updateOrderStatus, getOrderStats, type Order } from '@/services/store'
import { showToast } from '@/utils/toast'
import { ChevronDown, ChevronUp } from 'lucide-react'

const STATUS_OPTIONS = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
}
const PAYMENT_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  successful: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
}

export default function StoreOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [ordersData, statsData] = await Promise.all([
        getOrders({ page, limit: 20, status: statusFilter || undefined }),
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

  useEffect(() => { fetchData() }, [page, statusFilter])

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, { status: newStatus })
      showToast.success('Order status updated')
      fetchData()
    } catch {
      showToast.error('Failed to update order status')
    }
  }

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <Layout title="Store Orders" subtitle="Manage customer orders">
      <h1 className="sr-only">Store Orders</h1>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">Total Paid Orders</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">{formatPrice(stats.totalRevenue)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">Status Breakdown</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {stats.statusBreakdown?.map((s: any) => (
                <span key={s.status} className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-600'}`}>
                  {s.status}: {s.count}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No orders found</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
              >
                <div className="flex items-center gap-3">
                  {expandedOrder === order._id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  <div>
                    <p className="font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2 sm:mt-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_COLORS[order.paymentStatus] || 'bg-gray-100'}`}>
                    Pay: {order.paymentStatus}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
                    {order.status}
                  </span>
                  <span className="font-semibold text-gray-900">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>

              {expandedOrder === order._id && (
                <div className="border-t px-4 py-4 bg-gray-50 space-y-4">
                  {/* Items */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Items</p>
                    <div className="space-y-1">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.productName}
                            {item.size && ` - ${item.size}`}
                            {item.colour && ` / ${item.colour}`}
                            {' x '}{item.quantity}
                          </span>
                          <span className="text-gray-900">{formatPrice(item.totalPrice)}</span>
                        </div>
                      ))}
                      {order.discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount</span>
                          <span>-{formatPrice(order.discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-medium border-t pt-1">
                        <span>Total</span>
                        <span>{formatPrice(order.totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Delivery</p>
                    <div className="text-sm text-gray-600 space-y-0.5">
                      <p>{order.delivery.fullName}</p>
                      <p>{order.delivery.phone}</p>
                      {order.delivery.email && <p>{order.delivery.email}</p>}
                      <p>{order.delivery.address}</p>
                      {order.delivery.city && <p>{order.delivery.city}, {order.delivery.state}</p>}
                      {order.delivery.notes && <p className="italic">Note: {order.delivery.notes}</p>}
                    </div>
                  </div>

                  {/* Update Status */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Update Status:</label>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Previous</button>
          <span className="px-3 py-1 text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Next</button>
        </div>
      )}
    </Layout>
  )
}
