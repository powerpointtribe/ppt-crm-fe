import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Plus, Search, Eye, Edit, Trash2, CheckCircle, XCircle,
  Lock, LayoutGrid, MoreHorizontal, ChevronLeft, ChevronRight, Sparkles, ArrowLeft,
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import { bulkEmailService } from '@/services/bulk-email'
import { EmailTemplate, EmailTemplateCategory, TemplateModule, TemplateQueryParams } from '@/types/bulk-email'
import { showToast } from '@/utils/toast'
import { formatDate } from '@/utils/formatters'

const MODULE_LABELS: Record<string, string> = {
  [TemplateModule.FIRST_TIMERS]: 'First Timers',
  [TemplateModule.MEMBERS]: 'Members',
  [TemplateModule.EVENTS]: 'Events',
  [TemplateModule.FINANCE]: 'Finance',
  [TemplateModule.AUTH]: 'Auth',
  [TemplateModule.GROUPS]: 'Groups',
  [TemplateModule.BULK_EMAIL]: 'Bulk Email',
  uncategorized: 'Uncategorized',
}

const MODULE_COLORS: Record<string, { bg: string; text: string }> = {
  [TemplateModule.FIRST_TIMERS]: { bg: 'bg-amber-50', text: 'text-amber-700' },
  [TemplateModule.MEMBERS]: { bg: 'bg-blue-50', text: 'text-blue-700' },
  [TemplateModule.EVENTS]: { bg: 'bg-purple-50', text: 'text-purple-700' },
  [TemplateModule.FINANCE]: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  [TemplateModule.AUTH]: { bg: 'bg-red-50', text: 'text-red-700' },
  [TemplateModule.GROUPS]: { bg: 'bg-teal-50', text: 'text-teal-700' },
  [TemplateModule.BULK_EMAIL]: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
  uncategorized: { bg: 'bg-gray-50', text: 'text-gray-700' },
}

export default function Templates() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedModule, setSelectedModule] = useState(searchParams.get('module') || '')
  const [moduleCounts, setModuleCounts] = useState<{ module: string; count: number }[]>([])
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    bulkEmailService.getModuleCounts().then(setModuleCounts).catch(() => {})
  }, [])

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const params: TemplateQueryParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        category: selectedCategory as EmailTemplateCategory || undefined,
        module: selectedModule as TemplateModule || undefined,
      }

      const response = await bulkEmailService.getTemplates(params)
      setTemplates(response.items)
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
      }))
    } catch (error: any) {
      console.error('Error fetching templates:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, searchTerm, selectedCategory, selectedModule])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setPagination((prev) => ({ ...prev, page: 1 }))
      setSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedModule && { module: selectedModule }),
      })
    }
  }

  const handleModuleFilter = (mod: string) => {
    const next = mod === selectedModule ? '' : mod
    setSelectedModule(next)
    setPagination((prev) => ({ ...prev, page: 1 }))
    setSearchParams({
      ...(searchTerm && { search: searchTerm }),
      ...(selectedCategory && { category: selectedCategory }),
      ...(next && { module: next }),
    })
  }

  const handleDelete = async () => {
    if (!deleteModal) return
    try {
      setDeleteLoading(true)
      await bulkEmailService.deleteTemplate(deleteModal.id)
      showToast('success', 'Template deleted successfully')
      setDeleteModal(null)
      fetchTemplates()
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete template')
    } finally {
      setDeleteLoading(false)
    }
  }

  const totalTemplates = moduleCounts.reduce((sum, m) => sum + m.count, 0)

  return (
    <Layout title="Email Templates">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/bulk-email')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Messaging
          </button>
          <Button onClick={() => navigate('/bulk-email/templates/new')} className="shrink-0">
            <Plus className="h-4 w-4 mr-1.5" /> New Template
          </Button>
        </div>

        {/* Module Tabs */}
        {moduleCounts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleModuleFilter('')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !selectedModule
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <LayoutGrid className="h-3 w-3 inline mr-1" />
              All ({totalTemplates})
            </button>
            {moduleCounts.map(({ module: mod, count }) => {
              const colors = MODULE_COLORS[mod] || MODULE_COLORS.uncategorized
              return (
                <button
                  key={mod}
                  onClick={() => handleModuleFilter(mod)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedModule === mod
                      ? 'bg-gray-900 text-white'
                      : `${colors.bg} ${colors.text} hover:opacity-80`
                  }`}
                >
                  {MODULE_LABELS[mod] || mod} ({count})
                </button>
              )
            })}
          </div>
        )}

        {/* Search + Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0D7770]/20 focus:border-[#0D7770] outline-none bg-white"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-[#0D7770]/20 focus:border-[#0D7770] outline-none"
          >
            <option value="">All Categories</option>
            {Object.values(EmailTemplateCategory).map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0) + cat.slice(1).toLowerCase().replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Templates List */}
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : error ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-sm text-red-600 mb-3">{error.message}</p>
            <Button size="sm" variant="secondary" onClick={fetchTemplates}>Retry</Button>
          </motion.div>
        ) : templates.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No templates found</h3>
            <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
              {searchTerm || selectedCategory || selectedModule ? 'Try adjusting your filters' : 'Create your first email template'}
            </p>
            {!searchTerm && !selectedCategory && !selectedModule && (
              <Button size="sm" onClick={() => navigate('/bulk-email/templates/new')}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Create Template
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-2">
            {templates.map((template, index) => {
              const modColors = MODULE_COLORS[template.module || ''] || MODULE_COLORS.uncategorized
              return (
                <motion.div
                  key={template._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-4 px-4 py-3">
                    {/* Module icon */}
                    <div className={`w-9 h-9 rounded-lg ${modColors.bg} flex items-center justify-center shrink-0`}>
                      <FileText className={`w-4 h-4 ${modColors.text}`} />
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/bulk-email/templates/${template._id}`)}>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{template.name}</h3>
                        {template.isSystem && <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" title="System template" />}
                        {template.isActive ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate max-w-[400px]">{template.subject}</p>
                    </div>

                    {/* Meta */}
                    <div className="hidden md:flex items-center gap-3 shrink-0">
                      {template.module && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${modColors.bg} ${modColors.text}`}>
                          {MODULE_LABELS[template.module] || template.module}
                        </span>
                      )}
                      {template.slug && (
                        <span className="text-[11px] text-gray-400 font-mono max-w-[140px] truncate">{template.slug}</span>
                      )}
                      <span className="text-xs text-gray-400">{formatDate(template.createdAt)}</span>
                    </div>

                    {/* Actions */}
                    <div className="relative shrink-0">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === template._id ? null : template._id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      <AnimatePresence>
                        {openMenuId === template._id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20"
                          >
                            <button onClick={() => { navigate(`/bulk-email/templates/${template._id}`); setOpenMenuId(null) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                            <button onClick={() => { navigate(`/bulk-email/templates/${template._id}/edit`); setOpenMenuId(null) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <Edit className="w-3.5 h-3.5" /> Edit
                            </button>
                            {!template.isSystem && (
                              <>
                                <div className="h-px bg-gray-100 my-1"></div>
                                <button onClick={() => { setDeleteModal({ id: template._id, name: template.name }); setOpenMenuId(null) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-500">Page {pagination.page} of {pagination.totalPages} &middot; {pagination.total} total</p>
            <div className="flex gap-1">
              <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPagination(prev => ({ ...prev, page: p }))} className={`w-8 h-8 rounded-lg text-xs font-medium ${p === pagination.page ? 'bg-[#0D7770] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page === pagination.totalPages} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {openMenuId && <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />}

      {/* Delete Modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Template">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <span className="font-semibold">"{deleteModal?.name}"</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDeleteModal(null)} disabled={deleteLoading}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
