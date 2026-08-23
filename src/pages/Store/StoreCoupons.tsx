import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, X } from 'lucide-react'
import Layout from '@/components/Layout'
import { getCoupons, createCoupon, updateCoupon, deleteCoupon, type Coupon } from '@/services/store'
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
  isActive: boolean
}

const EMPTY_FORM: CouponFormData = {
  code: '', description: '', discountType: 'percentage', discountValue: '',
  maxDiscountAmount: '', minOrderAmount: '', expiresAt: '', usageLimit: '', isActive: true,
}

export default function StoreCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CouponFormData>({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const data = await getCoupons({ limit: 50 })
      setCoupons(data.data)
    } catch {
      showToast.error('Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCoupons() }, [])

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

  const isExpired = (c: Coupon) => c.expiresAt && new Date(c.expiresAt) < new Date()
  const isLimitReached = (c: Coupon) => c.usageLimit && c.usageCount >= c.usageLimit

  return (
    <Layout title="Coupons" subtitle="Manage store discount coupons">
      <div className="flex justify-between items-center mb-6">
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
          <Plus className="w-4 h-4" />
          Create Coupon
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No coupons yet</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {coupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-mono font-semibold text-gray-900">{coupon.code}</span>
                      {coupon.description && <p className="text-xs text-gray-500 mt-0.5">{coupon.description}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {coupon.discountType === 'percentage'
                        ? `${coupon.discountValue}%${coupon.maxDiscountAmount ? ` (max ${formatPrice(coupon.maxDiscountAmount)})` : ''}`
                        : formatPrice(coupon.discountValue)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {coupon.usageCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      {!coupon.isActive ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Inactive</span>
                      ) : isExpired(coupon) ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Expired</span>
                      ) : isLimitReached(coupon) ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Limit Reached</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(coupon)} className="p-1.5 text-gray-400 hover:text-indigo-600"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(coupon._id, coupon.code)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
