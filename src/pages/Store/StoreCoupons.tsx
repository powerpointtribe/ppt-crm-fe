import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Edit, Trash2, X, Ticket, TrendingUp, CheckCircle2, Search, Eye } from 'lucide-react'
import Layout from '@/components/Layout'
import { getCoupons, createCoupon, updateCoupon, deleteCoupon, getCouponUsage, type Coupon, type CouponUsageEntry } from '@/services/store'
import { showToast } from '@/utils/toast'

interface CouponFormData {
  code: string
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: string
  maxDiscountAmount: string
  minOrderAmount: string
  expiresAt: string
  usageLimit: string
  maxApplicableItems: string
  isActive: boolean
}

const EMPTY_FORM: CouponFormData = {
  code: '', description: '', discountType: 'percentage', discountValue: '',
  maxDiscountAmount: '', minOrderAmount: '', expiresAt: '', usageLimit: '',
  maxApplicableItems: '', isActive: true,
}

export default function StoreCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CouponFormData>({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'used' | 'expired' | 'inactive'>('all')
  const [usageCode, setUsageCode] = useState<string | null>(null)
  const [usageData, setUsageData] = useState<CouponUsageEntry[]>([])
  const [loadingUsage, setLoadingUsage] = useState(false)

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const data = await getCoupons({ limit: 200 })
      setCoupons(data.data)
    } catch {
      showToast.error('Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCoupons() }, [])

  const viewUsage = async (code: string) => {
    if (usageCode === code) { setUsageCode(null); return }
    try {
      setLoadingUsage(true)
      setUsageCode(code)
      const entries = await getCouponUsage(code)
      setUsageData(entries)
    } catch {
      showToast.error('Failed to load usage data')
      setUsageCode(null)
    } finally {
      setLoadingUsage(false)
    }
  }

  const isExpired = (c: Coupon) => !!(c.expiresAt && new Date(c.expiresAt) < new Date())
  const isLimitReached = (c: Coupon) => !!(c.usageLimit && c.usageCount >= c.usageLimit)

  const getCouponStatus = (c: Coupon): 'active' | 'used' | 'expired' | 'inactive' => {
    if (!c.isActive) return 'inactive'
    if (isExpired(c)) return 'expired'
    if (isLimitReached(c)) return 'used'
    return 'active'
  }

  const stats = useMemo(() => {
    const total = coupons.length
    const active = coupons.filter(c => getCouponStatus(c) === 'active').length
    const used = coupons.filter(c => getCouponStatus(c) === 'used').length
    const expired = coupons.filter(c => getCouponStatus(c) === 'expired').length
    const inactive = coupons.filter(c => getCouponStatus(c) === 'inactive').length
    const totalRedemptions = coupons.reduce((sum, c) => sum + c.usageCount, 0)
    return { total, active, used, expired, inactive, totalRedemptions }
  }, [coupons])

  const filteredCoupons = useMemo(() => {
    let list = coupons
    if (filterStatus !== 'all') {
      list = list.filter(c => getCouponStatus(c) === filterStatus)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(c =>
        c.code.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      )
    }
    return list
  }, [coupons, filterStatus, search])

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    setShowModal(true)
  }

  const openEdit = (coupon: Coupon) => {
    setEditingId(coupon._id)
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      maxDiscountAmount: coupon.maxDiscountAmount ? String(coupon.maxDiscountAmount) : '',
      minOrderAmount: coupon.minOrderAmount ? String(coupon.minOrderAmount) : '',
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : '',
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
      maxApplicableItems: coupon.maxApplicableItems ? String(coupon.maxApplicableItems) : '',
      isActive: coupon.isActive,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code.trim()) { showToast.error('Coupon code is required'); return }
    if (!form.discountValue || Number(form.discountValue) <= 0) { showToast.error('Discount value is required'); return }

    const payload: any = {
      code: form.code.trim(),
      description: form.description.trim() || undefined,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
      expiresAt: form.expiresAt || undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      maxApplicableItems: form.maxApplicableItems ? Number(form.maxApplicableItems) : undefined,
      isActive: form.isActive,
    }

    try {
      setSaving(true)
      if (editingId) {
        await updateCoupon(editingId, payload)
        showToast.success('Coupon updated')
      } else {
        await createCoupon(payload)
        showToast.success('Coupon created')
      }
      setShowModal(false)
      fetchCoupons()
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to save coupon')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"?`)) return
    try {
      await deleteCoupon(id)
      showToast.success('Coupon deleted')
      fetchCoupons()
    } catch {
      showToast.error('Failed to delete coupon')
    }
  }

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount)

  const statCards = [
    { label: 'Total Coupons', value: stats.total, icon: Ticket, color: 'bg-indigo-50 text-indigo-600', filter: 'all' as const },
    { label: 'Available', value: stats.active, icon: CheckCircle2, color: 'bg-green-50 text-green-600', filter: 'active' as const },
    { label: 'Used', value: stats.used, icon: TrendingUp, color: 'bg-amber-50 text-amber-600', filter: 'used' as const },
    { label: 'Expired / Inactive', value: stats.expired + stats.inactive, icon: Ticket, color: 'bg-gray-50 text-gray-500', filter: 'expired' as const },
  ]

  return (
    <Layout title="Coupons" subtitle="Manage store discount coupons">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <button
            key={card.label}
            onClick={() => setFilterStatus(card.filter)}
            className={`bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md transition ${filterStatus === card.filter && card.filter !== 'all' ? 'ring-2 ring-indigo-400' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{card.label}</span>
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </button>
        ))}
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'active', 'used', 'expired', 'inactive'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
                filterStatus === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <span className="ml-1 opacity-75">
                  ({status === 'active' ? stats.active : status === 'used' ? stats.used : status === 'expired' ? stats.expired : stats.inactive})
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Search codes..."
            />
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition whitespace-nowrap">
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {search || filterStatus !== 'all' ? 'No coupons match your filters' : 'No coupons yet'}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applies To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCoupons.map((coupon) => {
                  const status = getCouponStatus(coupon)
                  return (
                    <React.Fragment key={coupon._id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-mono font-semibold text-gray-900">{coupon.code}</span>
                        {coupon.description && <p className="text-xs text-gray-500 mt-0.5">{coupon.description}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}%${coupon.maxDiscountAmount ? ` (max ${formatPrice(coupon.maxDiscountAmount)})` : ''}`
                          : formatPrice(coupon.discountValue)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{coupon.usageCount}</span>
                        <span className="text-sm text-gray-400"> / {coupon.usageLimit ?? '∞'}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {coupon.maxApplicableItems
                          ? `${coupon.maxApplicableItems} item${coupon.maxApplicableItems > 1 ? 's' : ''}`
                          : 'Whole order'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {status === 'inactive' ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Inactive</span>
                        ) : status === 'expired' ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Expired</span>
                        ) : status === 'used' ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Used</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {coupon.usageCount > 0 && (
                            <button
                              onClick={() => viewUsage(coupon.code)}
                              className={`p-1.5 transition ${usageCode === coupon.code ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600'}`}
                              title="View who used this code"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => openEdit(coupon)} className="p-1.5 text-gray-400 hover:text-indigo-600"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(coupon._id, coupon.code)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                    {usageCode === coupon.code && (
                      <tr>
                        <td colSpan={7} className="px-6 py-0">
                          <div className="bg-gray-50 rounded-lg border border-gray-200 my-2 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200">
                              <span className="text-xs font-semibold text-gray-600 uppercase">Usage Details — {coupon.code}</span>
                              <button onClick={() => setUsageCode(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {loadingUsage ? (
                              <div className="flex justify-center py-6">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
                              </div>
                            ) : usageData.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-4">No paid orders found for this code</p>
                            ) : (
                              <div className="divide-y divide-gray-200">
                                {usageData.map((entry, i) => (
                                  <div key={i} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900 truncate">{entry.delivery?.fullName || 'N/A'}</p>
                                      <p className="text-xs text-gray-500">{entry.customerEmail || entry.delivery?.phone || '—'}</p>
                                    </div>
                                    <div className="text-gray-600 font-mono text-xs">{entry.orderNumber}</div>
                                    <div className="text-green-600 font-medium whitespace-nowrap">-{formatPrice(entry.discountAmount)}</div>
                                    <div className="text-gray-500 text-xs whitespace-nowrap">{new Date(entry.createdAt).toLocaleDateString()}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-gray-50 border-t text-sm text-gray-500">
            Showing {filteredCoupons.length} of {coupons.length} coupons
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{editingId ? 'Edit Coupon' : 'Create Coupon'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg uppercase font-mono"
                  placeholder="WELCOME10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="10% off for first-time buyers"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type *</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm(prev => ({ ...prev, discountType: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (NGN)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value * {form.discountType === 'percentage' ? '(%)' : '(NGN)'}
                  </label>
                  <input
                    type="number"
                    value={form.discountValue}
                    onChange={(e) => setForm(prev => ({ ...prev, discountValue: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                    max={form.discountType === 'percentage' ? '100' : undefined}
                  />
                </div>
              </div>

              {form.discountType === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (NGN)</label>
                  <input
                    type="number"
                    value={form.maxDiscountAmount}
                    onChange={(e) => setForm(prev => ({ ...prev, maxDiscountAmount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Leave empty for no cap"
                    min="0"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Order (NGN)</label>
                  <input
                    type="number"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm(prev => ({ ...prev, minOrderAmount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="No minimum"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                  <input
                    type="number"
                    value={form.usageLimit}
                    onChange={(e) => setForm(prev => ({ ...prev, usageLimit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Unlimited"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Items Discount Applies To</label>
                <input
                  type="number"
                  value={form.maxApplicableItems}
                  onChange={(e) => setForm(prev => ({ ...prev, maxApplicableItems: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="All items (leave empty)"
                  min="1"
                />
                <p className="text-xs text-gray-400 mt-1">Limits discount to this many items instead of the whole order</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-indigo-600"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
