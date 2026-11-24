import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, X } from 'lucide-react'
import Layout from '@/components/Layout'
import {
  inventoryService,
  InventoryCategory,
  InventoryStatus,
  CreateInventoryItemData,
  UnitOfMeasurement,
} from '@/services/inventory'
import { showToast } from '@/utils/toast'

// Mirrors UnitOfMeasurement in crm-be/src/common/enums/inventory.enum.ts
const UNIT_OPTIONS: { value: string; label: string }[] = [
  { value: 'PIECES', label: 'Pieces' },
  { value: 'EACH', label: 'Each' },
  { value: 'SETS', label: 'Sets' },
  { value: 'BOXES', label: 'Boxes' },
  { value: 'PACKAGES', label: 'Packages' },
  { value: 'BOTTLES', label: 'Bottles' },
  { value: 'CANS', label: 'Cans' },
  { value: 'BAGS', label: 'Bags' },
  { value: 'GRAMS', label: 'Grams' },
  { value: 'KILOGRAMS', label: 'Kilograms' },
  { value: 'POUNDS', label: 'Pounds' },
  { value: 'MILLILITERS', label: 'Milliliters' },
  { value: 'LITERS', label: 'Liters' },
  { value: 'GALLONS', label: 'Gallons' },
  { value: 'CENTIMETERS', label: 'Centimeters' },
  { value: 'METERS', label: 'Meters' },
  { value: 'INCHES', label: 'Inches' },
  { value: 'FEET', label: 'Feet' },
  { value: 'SQUARE_METERS', label: 'Square meters' },
  { value: 'SQUARE_FEET', label: 'Square feet' },
  { value: 'HOURS', label: 'Hours' },
  { value: 'DAYS', label: 'Days' },
]

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'DISCONTINUED']

interface FormState {
  name: string
  itemCode: string
  barcode: string
  description: string
  category: string
  brand: string
  model: string
  serialNumber: string
  unitOfMeasurement: string
  currentStock: string
  minimumStock: string
  maximumStock: string
  reorderLevel: string
  unitCost: string
  currency: string
  status: string
  location: string
  supplier: string
  supplierContact: string
  purchaseDate: string
  expiryDate: string
  warrantyExpiry: string
  tags: string
  notes: string
  isDepreciable: boolean
  depreciationRate: string
}

const EMPTY: FormState = {
  name: '',
  itemCode: '',
  barcode: '',
  description: '',
  category: '',
  brand: '',
  model: '',
  serialNumber: '',
  unitOfMeasurement: 'PIECES',
  currentStock: '0',
  minimumStock: '0',
  maximumStock: '',
  reorderLevel: '',
  unitCost: '',
  currency: 'NGN',
  status: 'ACTIVE',
  location: '',
  supplier: '',
  supplierContact: '',
  purchaseDate: '',
  expiryDate: '',
  warrantyExpiry: '',
  tags: '',
  notes: '',
  isDepreciable: false,
  depreciationRate: '',
}

const toDateInput = (d?: string) => (d ? d.slice(0, 10) : '')
const numOrUndefined = (v: string) => (v.trim() === '' ? undefined : Number(v))
const strOrUndefined = (v: string) => (v.trim() === '' ? undefined : v.trim())

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

export default function InventoryItemForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState<FormState>(EMPTY)
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '', code: '' })
  const [creatingCategory, setCreatingCategory] = useState(false)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (isEdit) loadItem()
  }, [id])

  const loadCategories = async () => {
    try {
      const data = await inventoryService.getCategories()
      setCategories(Array.isArray(data) ? data : [])
    } catch {
      setCategories([])
      showToast.error('Failed to load categories')
    }
  }

  const loadItem = async () => {
    try {
      setLoading(true)
      const item = await inventoryService.getItemById(id!)
      setForm({
        name: item.name || '',
        itemCode: item.itemCode || '',
        barcode: item.barcode || '',
        description: item.description || '',
        category: typeof item.category === 'string' ? item.category : item.category?._id || '',
        brand: item.brand || '',
        model: item.model || '',
        serialNumber: item.serialNumber || '',
        unitOfMeasurement: item.unitOfMeasurement || 'PIECES',
        currentStock: String(item.currentStock ?? 0),
        minimumStock: String(item.minimumStock ?? 0),
        maximumStock: item.maximumStock != null ? String(item.maximumStock) : '',
        reorderLevel: item.reorderLevel != null ? String(item.reorderLevel) : '',
        unitCost: item.unitCost != null ? String(item.unitCost) : '',
        currency: item.currency || 'NGN',
        status: item.status || 'ACTIVE',
        location: item.location || '',
        supplier: item.supplier || '',
        supplierContact: item.supplierContact || '',
        purchaseDate: toDateInput(item.purchaseDate),
        expiryDate: toDateInput(item.expiryDate),
        warrantyExpiry: toDateInput(item.warrantyExpiry),
        tags: item.tags?.join(', ') || '',
        notes: item.notes || '',
        isDepreciable: !!item.isDepreciable,
        depreciationRate: item.depreciationRate != null ? String(item.depreciationRate) : '',
      })
    } catch {
      showToast.error('Failed to load inventory item')
      navigate('/inventory/items')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim() || !newCategory.code.trim()) {
      showToast.error('Category name and code are required')
      return
    }
    try {
      setCreatingCategory(true)
      const created = await inventoryService.createCategory({
        name: newCategory.name.trim(),
        code: newCategory.code.trim().toUpperCase(),
      })
      await loadCategories()
      if (created?._id) set('category', created._id)
      setNewCategory({ name: '', code: '' })
      setShowNewCategory(false)
      showToast.success('Category created')
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to create category')
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim()) return showToast.error('Item name is required')
    if (!form.itemCode.trim()) return showToast.error('Item code is required')
    if (!form.category) return showToast.error('Category is required')
    if (form.currentStock.trim() === '' || Number(form.currentStock) < 0) {
      return showToast.error('Current stock must be 0 or more')
    }

    const payload: CreateInventoryItemData & { status?: InventoryStatus } = {
      name: form.name.trim(),
      itemCode: form.itemCode.trim(),
      barcode: strOrUndefined(form.barcode),
      description: strOrUndefined(form.description),
      category: form.category,
      brand: strOrUndefined(form.brand),
      model: strOrUndefined(form.model),
      serialNumber: strOrUndefined(form.serialNumber),
      unitOfMeasurement: form.unitOfMeasurement as UnitOfMeasurement,
      currentStock: Number(form.currentStock),
      minimumStock: numOrUndefined(form.minimumStock),
      maximumStock: numOrUndefined(form.maximumStock),
      reorderLevel: numOrUndefined(form.reorderLevel),
      unitCost: numOrUndefined(form.unitCost),
      currency: strOrUndefined(form.currency),
      status: form.status as InventoryStatus,
      location: strOrUndefined(form.location),
      supplier: strOrUndefined(form.supplier),
      supplierContact: strOrUndefined(form.supplierContact),
      purchaseDate: strOrUndefined(form.purchaseDate),
      expiryDate: strOrUndefined(form.expiryDate),
      warrantyExpiry: strOrUndefined(form.warrantyExpiry),
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      notes: strOrUndefined(form.notes),
      isDepreciable: form.isDepreciable,
      depreciationRate: form.isDepreciable ? numOrUndefined(form.depreciationRate) : undefined,
    }

    try {
      setSaving(true)
      if (isEdit) {
        await inventoryService.updateItem(id!, payload)
        showToast.success('Item updated')
      } else {
        await inventoryService.createItem(payload)
        showToast.success('Item created')
      }
      navigate('/inventory/items')
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout title="Loading Item...">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      title={isEdit ? 'Edit Inventory Item' : 'New Inventory Item'}
      subtitle="Track stock levels, cost, and supplier details"
    >
      <div className="max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => navigate('/inventory/items')}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Items
        </button>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic info */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Item Name *">
                <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Wireless Microphone" />
              </Field>
              <Field label="Item Code *">
                <input className={inputCls} value={form.itemCode} onChange={e => set('itemCode', e.target.value)} placeholder="e.g. AV-MIC-001" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Category *">
                  <div className="flex gap-2">
                    <select className={inputCls} value={form.category} onChange={e => set('category', e.target.value)}>
                      <option value="">Select a category</option>
                      {categories.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewCategory(v => !v)}
                      className="shrink-0 inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {showNewCategory ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {showNewCategory ? 'Cancel' : 'New'}
                    </button>
                  </div>
                  {categories.length === 0 && !showNewCategory && (
                    <p className="mt-1 text-xs text-amber-600">No categories yet — click “New” to create one.</p>
                  )}
                </Field>
                {showNewCategory && (
                  <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200 grid grid-cols-1 sm:grid-cols-[1fr_10rem_auto] gap-2 items-end">
                    <Field label="Category name">
                      <input className={inputCls} value={newCategory.name} onChange={e => setNewCategory(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Audio Equipment" />
                    </Field>
                    <Field label="Code">
                      <input className={inputCls} value={newCategory.code} onChange={e => setNewCategory(p => ({ ...p, code: e.target.value }))} placeholder="e.g. AUDIO" />
                    </Field>
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={creatingCategory}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {creatingCategory ? 'Adding…' : 'Add'}
                    </button>
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <Field label="Description">
                  <textarea className={inputCls} rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
                </Field>
              </div>
              <Field label="Brand">
                <input className={inputCls} value={form.brand} onChange={e => set('brand', e.target.value)} />
              </Field>
              <Field label="Model">
                <input className={inputCls} value={form.model} onChange={e => set('model', e.target.value)} />
              </Field>
              <Field label="Serial Number">
                <input className={inputCls} value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)} />
              </Field>
              <Field label="Barcode">
                <input className={inputCls} value={form.barcode} onChange={e => set('barcode', e.target.value)} />
              </Field>
              <Field label="Status">
                <select className={inputCls} value={form.status} onChange={e => set('status', e.target.value)}>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          {/* Stock */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Stock &amp; Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Unit of Measurement *">
                <select className={inputCls} value={form.unitOfMeasurement} onChange={e => set('unitOfMeasurement', e.target.value)}>
                  {UNIT_OPTIONS.map(u => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Current Stock *">
                <input type="number" min={0} className={inputCls} value={form.currentStock} onChange={e => set('currentStock', e.target.value)} />
              </Field>
              <Field label="Minimum Stock">
                <input type="number" min={0} className={inputCls} value={form.minimumStock} onChange={e => set('minimumStock', e.target.value)} />
              </Field>
              <Field label="Maximum Stock">
                <input type="number" min={0} className={inputCls} value={form.maximumStock} onChange={e => set('maximumStock', e.target.value)} />
              </Field>
              <Field label="Reorder Level">
                <input type="number" min={0} className={inputCls} value={form.reorderLevel} onChange={e => set('reorderLevel', e.target.value)} />
              </Field>
              <Field label="Location">
                <input className={inputCls} value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Store room A" />
              </Field>
              <Field label="Unit Cost">
                <input type="number" min={0} step="0.01" className={inputCls} value={form.unitCost} onChange={e => set('unitCost', e.target.value)} />
              </Field>
              <Field label="Currency">
                <select className={inputCls} value={form.currency} onChange={e => set('currency', e.target.value)}>
                  {['NGN', 'USD', 'GBP', 'EUR'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.isDepreciable} onChange={e => set('isDepreciable', e.target.checked)} className="rounded border-gray-300" />
                Depreciable asset
              </label>
              {form.isDepreciable && (
                <div className="w-48">
                  <Field label="Depreciation rate (%/yr)">
                    <input type="number" min={0} max={100} className={inputCls} value={form.depreciationRate} onChange={e => set('depreciationRate', e.target.value)} />
                  </Field>
                </div>
              )}
            </div>
          </section>

          {/* Supplier & dates */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Supplier &amp; Dates</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Supplier">
                <input className={inputCls} value={form.supplier} onChange={e => set('supplier', e.target.value)} />
              </Field>
              <Field label="Supplier Contact">
                <input className={inputCls} value={form.supplierContact} onChange={e => set('supplierContact', e.target.value)} />
              </Field>
              <div className="hidden md:block" />
              <Field label="Purchase Date">
                <input type="date" className={inputCls} value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} />
              </Field>
              <Field label="Expiry Date">
                <input type="date" className={inputCls} value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
              </Field>
              <Field label="Warranty Expiry">
                <input type="date" className={inputCls} value={form.warrantyExpiry} onChange={e => set('warrantyExpiry', e.target.value)} />
              </Field>
            </div>
          </section>

          {/* Extra */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Additional</h2>
            <Field label="Tags (comma separated)">
              <input className={inputCls} value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="e.g. audio, sunday-service" />
            </Field>
            <Field label="Notes">
              <textarea className={inputCls} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
            </Field>
          </section>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/inventory/items')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
