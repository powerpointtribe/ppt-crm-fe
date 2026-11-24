import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Search, Tags } from 'lucide-react'
import Layout from '@/components/Layout'
import Modal from '@/components/ui/Modal'
import {
  inventoryService,
  InventoryCategory,
  INVENTORY_CATEGORY_TYPES,
  CreateInventoryCategoryData,
} from '@/services/inventory'
import { showToast } from '@/utils/toast'
import { humanize, inputCls, money } from '@/components/inventory/inventoryUi'

interface FormState {
  name: string
  code: string
  type: string
  color: string
  description: string
  parentCategory: string
}

const EMPTY: FormState = { name: '', code: '', type: 'GENERAL', color: '#6366f1', description: '', parentCategory: '' }

const parentId = (c: InventoryCategory) =>
  typeof c.parentCategory === 'object' ? c.parentCategory?._id : c.parentCategory

export default function InventoryCategories() {
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [usage, setUsage] = useState<Record<string, { count: number; value: number }>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [editing, setEditing] = useState<InventoryCategory | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  const [toDelete, setToDelete] = useState<InventoryCategory | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    try {
      const [cats, stats] = await Promise.all([
        inventoryService.getCategories(),
        // Item count / value per category; optional.
        inventoryService.getCategoryBreakdown().catch(() => null),
      ])
      setCategories(Array.isArray(cats) ? cats : [])
      if (stats) {
        const byId: Record<string, { count: number; value: number }> = {}
        stats.forEach(c => (byId[c.id] = { count: c.count, value: c.value }))
        setUsage(byId)
      }
    } catch {
      showToast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return categories
    return categories.filter(c =>
      [c.name, c.code, c.description, c.type].some(v => v?.toLowerCase().includes(q)),
    )
  }, [categories, search])

  const nameById = useMemo(() => Object.fromEntries(categories.map(c => [c._id, c.name])), [categories])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setShowForm(true)
  }

  const openEdit = (c: InventoryCategory) => {
    setEditing(c)
    setForm({
      name: c.name,
      code: c.code || '',
      type: c.type || 'GENERAL',
      color: c.color || '#6366f1',
      description: c.description || '',
      parentCategory: parentId(c) || '',
    })
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return showToast.error('Name is required')
    if (!form.code.trim()) return showToast.error('Code is required')

    const payload: CreateInventoryCategoryData = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      type: form.type,
      color: form.color,
      description: form.description.trim() || undefined,
      parentCategory: form.parentCategory || undefined,
    }

    try {
      setSaving(true)
      if (editing) {
        await inventoryService.updateCategory(editing._id, payload)
        showToast.success('Category updated')
      } else {
        await inventoryService.createCategory(payload)
        showToast.success('Category created')
      }
      setShowForm(false)
      load()
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      setDeleting(true)
      await inventoryService.deleteCategory(toDelete._id)
      showToast.success('Category removed')
      setToDelete(null)
      load()
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to remove category')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Layout title="Inventory Categories" subtitle="Group items so stock and value can be reported by category">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input className={`${inputCls} pl-9`} placeholder="Search categories" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={openCreate} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> New Category
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-14 text-center">
            <Tags className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-700 font-medium">{categories.length ? 'No categories match your search' : 'No categories yet'}</p>
            {!categories.length && (
              <p className="text-sm text-gray-500 mt-1">Create one before adding inventory items.</p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Parent</th>
                  <th className="px-4 py-3 font-medium text-right">Items</th>
                  <th className="px-4 py-3 font-medium text-right">Value</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(c => {
                  const u = usage[c._id]
                  const pid = parentId(c)
                  return (
                    <tr key={c._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color || '#9ca3af' }} />
                          <Link to={`/inventory/items?category=${c._id}`} className="font-medium text-gray-900 hover:text-indigo-600">
                            {c.name}
                          </Link>
                        </div>
                        {c.description && <p className="text-xs text-gray-500 mt-0.5 ml-[18px] truncate max-w-xs">{c.description}</p>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{c.code || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{humanize(c.type) || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{(pid && nameById[pid]) || '—'}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{u?.count ?? 0}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{money(u?.value)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-gray-100 text-gray-600" aria-label={`Edit ${c.name}`}>
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => setToDelete(c)} className="p-1.5 rounded hover:bg-red-50 text-red-600" aria-label={`Remove ${c.name}`}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Category' : 'New Category'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_9rem] gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input className={inputCls} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Sound Equipment" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
              <input className={inputCls} value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. SOUND" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_6rem] gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select className={inputCls} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {INVENTORY_CATEGORY_TYPES.map(t => (
                  <option key={t} value={t}>{humanize(t)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Colour</label>
              <input type="color" className="w-full h-10 border border-gray-300 rounded-lg p-1" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
            <select className={inputCls} value={form.parentCategory} onChange={e => setForm(p => ({ ...p, parentCategory: e.target.value }))}>
              <option value="">None (top level)</option>
              {categories
                .filter(c => c._id !== editing?._id)
                .map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={2} className={inputCls} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!toDelete} onClose={() => setToDelete(null)} title="Remove category?" size="sm">
        <p className="text-sm text-gray-600 mb-6">
          <strong>{toDelete?.name}</strong> will be hidden from category lists. Items already in it keep their category.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setToDelete(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
            {deleting ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </Modal>
    </Layout>
  )
}
