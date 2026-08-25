import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Upload, X, AlertTriangle, ChevronDown } from 'lucide-react'
import Layout from '@/components/Layout'
import { createProduct, updateProduct, getProductById, deleteProduct, type ProductVariant } from '@/services/store'
import { showToast } from '@/utils/toast'
import { apiService } from '@/services/api'

const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL']

interface SizeRow {
  size: string
  stock: number
  additionalPrice: number
}

interface VariantGroup {
  key: number
  colour: string
  images: string[]
  sizes: SizeRow[]
}

let groupCounter = 0
const nextKey = () => ++groupCounter

const makeGroup = (colour = ''): VariantGroup => ({
  key: nextKey(),
  colour,
  images: [],
  sizes: DEFAULT_SIZES.map(size => ({ size, stock: 0, additionalPrice: 0 })),
})

// Convert flat backend variants → grouped form state
function variantsToGroups(variants: ProductVariant[]): VariantGroup[] {
  if (variants.length === 0) return [makeGroup()]

  // Group by colour, preserving order of first appearance.
  // Same colour text = same group (for data loaded from backend).
  const map = new Map<string, VariantGroup>()
  const order: string[] = []

  for (const v of variants) {
    if (!map.has(v.colour)) {
      const g: VariantGroup = { key: nextKey(), colour: v.colour, images: [], sizes: [] }
      map.set(v.colour, g)
      order.push(v.colour)
    }
    const g = map.get(v.colour)!
    if (g.images.length === 0 && v.images?.length) {
      g.images = [...v.images]
    }
    g.sizes.push({ size: v.size, stock: v.stock, additionalPrice: v.additionalPrice || 0 })
  }

  return order.map(c => map.get(c)!)
}

// Flatten groups back to flat variants for the backend
function groupsToVariants(groups: VariantGroup[]): ProductVariant[] {
  const out: ProductVariant[] = []
  for (const g of groups) {
    for (let i = 0; i < g.sizes.length; i++) {
      const s = g.sizes[i]
      out.push({
        size: s.size,
        colour: g.colour,
        stock: s.stock,
        additionalPrice: s.additionalPrice,
        images: i === 0 ? g.images : [],
      })
    }
  }
  return out
}

interface FormData {
  name: string
  slug: string
  description: string
  price: string
  currency: string
  images: string[]
  isActive: boolean
  isFeatured: boolean
  tags: string
}

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState<FormData>({
    name: '',
    slug: '',
    description: '',
    price: '',
    currency: 'NGN',
    images: [],
    isActive: true,
    isFeatured: false,
    tags: '',
  })
  const [groups, setGroups] = useState<VariantGroup[]>([makeGroup()])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [dangerLoading, setDangerLoading] = useState(false)
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null)

  const toggleCollapse = (key: number) => {
    setExpandedGroup(prev => prev === key ? null : key)
  }

  useEffect(() => {
    if (isEdit) loadProduct()
  }, [id])

  const loadProduct = async () => {
    try {
      setLoading(true)
      const product = await getProductById(id!)
      setForm({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        price: String(product.price),
        currency: product.currency || 'NGN',
        images: product.images || [],
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        tags: product.tags?.join(', ') || '',
      })
      setGroups(variantsToGroups(product.variants))
    } catch {
      showToast.error('Failed to load product')
      navigate('/store/products')
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const handleNameChange = (name: string) => {
    setForm(prev => ({
      ...prev,
      name,
      slug: isEdit ? prev.slug : generateSlug(name),
    }))
  }

  // ─── Product-level images ─────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      setUploading(true)
      const res = await apiService.post<any>('/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const url = res.data?.url || res.url
      if (url) {
        setForm(prev => ({ ...prev, images: [...prev.images, url] }))
        showToast.success('Image uploaded')
      }
    } catch {
      showToast.error('Image upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeImage = (index: number) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  // ─── Variant group helpers ────────────────────────────────────
  const updateGroup = (key: number, patch: Partial<VariantGroup>) => {
    setGroups(prev => prev.map(g => g.key === key ? { ...g, ...patch } : g))
  }

  const updateSizeRow = (groupKey: number, sizeIdx: number, patch: Partial<SizeRow>) => {
    setGroups(prev => prev.map(g => {
      if (g.key !== groupKey) return g
      const sizes = [...g.sizes]
      sizes[sizeIdx] = { ...sizes[sizeIdx], ...patch }
      return { ...g, sizes }
    }))
  }

  const addGroup = () => setGroups(prev => [...prev, makeGroup()])

  const removeGroup = (key: number) => {
    if (groups.length <= 1) return
    setGroups(prev => prev.filter(g => g.key !== key))
  }

  const addSizeToGroup = (key: number) => {
    setGroups(prev => prev.map(g => {
      if (g.key !== key) return g
      return { ...g, sizes: [...g.sizes, { size: '', stock: 0, additionalPrice: 0 }] }
    }))
  }

  const removeSizeFromGroup = (groupKey: number, sizeIdx: number) => {
    setGroups(prev => prev.map(g => {
      if (g.key !== groupKey) return g
      if (g.sizes.length <= 1) return g
      return { ...g, sizes: g.sizes.filter((_, i) => i !== sizeIdx) }
    }))
  }

  // ─── Group image upload ───────────────────────────────────────
  const [uploadingGroupKey, setUploadingGroupKey] = useState<number | null>(null)

  const handleGroupImageUpload = async (groupKey: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      setUploadingGroupKey(groupKey)
      const res = await apiService.post<any>('/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const url = res.data?.url || res.url
      if (url) {
        setGroups(prev => prev.map(g =>
          g.key === groupKey ? { ...g, images: [...g.images, url] } : g
        ))
        showToast.success('Image uploaded')
      }
    } catch {
      showToast.error('Image upload failed')
    } finally {
      setUploadingGroupKey(null)
      e.target.value = ''
    }
  }

  const removeGroupImage = (groupKey: number, imgIdx: number) => {
    setGroups(prev => prev.map(g => {
      if (g.key !== groupKey) return g
      return { ...g, images: g.images.filter((_, i) => i !== imgIdx) }
    }))
  }

  // ─── Submit ───────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim()) { showToast.error('Product name is required'); return }
    if (!form.price || Number(form.price) <= 0) { showToast.error('Valid price is required'); return }

    // Validate groups
    for (const g of groups) {
      if (!g.colour.trim()) { showToast.error('All variants need a colour / label'); return }
      const validSizes = g.sizes.filter(s => s.size.trim())
      if (validSizes.length === 0) { showToast.error(`"${g.colour}" needs at least one size`); return }
    }

    const variants = groupsToVariants(groups).filter(v => v.size.trim())

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || undefined,
      price: Number(form.price),
      currency: form.currency,
      images: form.images,
      variants: variants.map(v => ({
        size: v.size.trim(),
        colour: v.colour.trim(),
        stock: Number(v.stock) || 0,
        additionalPrice: Number(v.additionalPrice) || 0,
        images: v.images || [],
      })),
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }

    try {
      setLoading(true)
      if (isEdit) {
        await updateProduct(id!, payload as any)
        showToast.success('Product updated')
      } else {
        await createProduct(payload as any)
        showToast.success('Product created')
      }
      navigate('/store/products')
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async () => {
    try {
      setDangerLoading(true)
      await updateProduct(id!, { isActive: !form.isActive } as any)
      setForm(prev => ({ ...prev, isActive: !prev.isActive }))
      showToast.success(form.isActive ? 'Product deactivated' : 'Product activated')
      setConfirmDeactivate(false)
    } catch {
      showToast.error('Failed to update product status')
    } finally {
      setDangerLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDangerLoading(true)
      await deleteProduct(id!)
      showToast.success('Product deleted')
      navigate('/store/products')
    } catch {
      showToast.error('Failed to delete product')
    } finally {
      setDangerLoading(false)
    }
  }

  if (loading && isEdit) {
    return (
      <Layout title="Loading Product...">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={isEdit ? 'Edit Product' : 'New Product'} subtitle="Manage product details and variants">
      <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/store/products')}
        className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </button>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g. 7th Anniversary T-Shirt"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-1">/store/</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="7th-anniversary"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Describe this product..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (NGN) *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="5000"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="anniversary, merch"
              />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => setForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Featured</span>
              </label>
            </div>
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Product Images</h2>

          <div className="flex flex-wrap gap-3">
            {form.images.map((url, i) => (
              <div key={i} className="relative group">
                <img src={url} alt="" className="w-24 h-24 rounded-lg object-cover border" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <label className={`w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 transition ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-400 mt-1">{uploading ? 'Uploading...' : 'Upload'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {/* Variants */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Variants</h2>
              <p className="text-sm text-gray-500">Each variant gets all sizes by default. Remove sizes you don't need.</p>
            </div>
            <button
              type="button"
              onClick={addGroup}
              className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Variant
            </button>
          </div>

          <div className="space-y-6">
            {groups.map((group, groupIdx) => (
              <div key={group.key} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Variant header */}
                <div className="bg-gray-50 px-4 py-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleCollapse(group.key)}
                    className="p-0.5 text-gray-400 hover:text-gray-600 transition"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedGroup !== group.key ? '-rotate-90' : ''}`} />
                  </button>
                  <span className="text-xs font-bold text-gray-400 uppercase">Variant {groupIdx + 1}</span>
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    {expandedGroup !== group.key ? (
                      <span className="text-sm text-gray-700 truncate">{group.colour || 'Untitled'}</span>
                    ) : (
                      <input
                        type="text"
                        value={group.colour}
                        onChange={(e) => updateGroup(group.key, { colour: e.target.value })}
                        className="w-full max-w-sm px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g. White, Black - Front Print, Navy Blue..."
                      />
                    )}
                    {expandedGroup !== group.key && (
                      <span className="text-xs text-gray-400 flex-shrink-0">{group.sizes.length} sizes · {group.images.length} images</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeGroup(group.key)}
                    disabled={groups.length <= 1}
                    className="p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-30"
                    title="Remove this variant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Variant body — collapsible */}
                {expandedGroup === group.key && <>
                {/* Variant images */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <label className="block text-xs font-medium text-gray-500 mb-2">Images</label>
                  <div className="flex flex-wrap gap-2">
                    {group.images.map((url, imgIdx) => (
                      <div key={imgIdx} className="relative group/img">
                        <img src={url} alt="" className="w-16 h-16 rounded-md object-cover border" />
                        <button
                          type="button"
                          onClick={() => removeGroupImage(group.key, imgIdx)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <label className={`w-16 h-16 rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 transition text-xs ${uploadingGroupKey === group.key ? 'opacity-50 pointer-events-none' : ''}`}>
                      <Upload className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-400 mt-0.5">{uploadingGroupKey === group.key ? '...' : 'Add'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleGroupImageUpload(group.key, e)}
                        className="hidden"
                        disabled={uploadingGroupKey === group.key}
                      />
                    </label>
                  </div>
                </div>

                {/* Size rows */}
                <div className="divide-y divide-gray-100">
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                    <div className="col-span-4">Size</div>
                    <div className="col-span-3">Stock</div>
                    <div className="col-span-3">Extra Price</div>
                    <div className="col-span-2"></div>
                  </div>
                  {group.sizes.map((s, sIdx) => (
                    <div key={sIdx} className="grid grid-cols-12 gap-2 px-4 py-2 items-center">
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={s.size}
                          onChange={(e) => updateSizeRow(group.key, sIdx, { size: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Size"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={s.stock}
                          onChange={(e) => updateSizeRow(group.key, sIdx, { stock: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          min="0"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={s.additionalPrice}
                          onChange={(e) => updateSizeRow(group.key, sIdx, { additionalPrice: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          min="0"
                        />
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeSizeFromGroup(group.key, sIdx)}
                          disabled={group.sizes.length <= 1}
                          className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30"
                          title="Remove size"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add size */}
                <div className="px-4 py-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => addSizeToGroup(group.key)}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add size
                  </button>
                </div>
                </>}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/store/products')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
        </div>

        {/* Danger Zone — edit mode only */}
        {isEdit && (
          <div className="border border-red-200 rounded-xl overflow-hidden">
            <div className="bg-red-50 px-6 py-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h2 className="text-sm font-semibold text-red-700">Danger Zone</h2>
            </div>
            <div className="bg-white p-6 space-y-4">
              {/* Deactivate / Activate */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{form.isActive ? 'Deactivate' : 'Activate'} this product</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {form.isActive
                      ? 'This product will no longer be visible on the public store.'
                      : 'This product will become visible on the public store again.'}
                  </p>
                </div>
                {!confirmDeactivate ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDeactivate(true)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${
                      form.isActive
                        ? 'border-red-300 text-red-700 hover:bg-red-50'
                        : 'border-green-300 text-green-700 hover:bg-green-50'
                    }`}
                  >
                    {form.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDeactivate(false)}
                      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleActive}
                      disabled={dangerLoading}
                      className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 ${
                        form.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {dangerLoading ? 'Processing...' : `Yes, ${form.isActive ? 'deactivate' : 'activate'} it`}
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-red-100" />

              {/* Delete */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">Delete this product</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Permanently remove this product and all its variants. This cannot be undone.
                  </p>
                </div>
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition"
                  >
                    Delete
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={dangerLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
                    >
                      {dangerLoading ? 'Deleting...' : 'Yes, delete permanently'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </form>
      </div>
    </Layout>
  )
}
