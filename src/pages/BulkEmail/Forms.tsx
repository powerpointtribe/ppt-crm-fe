import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileInput, Plus, Search, Eye, Edit, Trash2, CheckCircle, XCircle,
  Lock, ChevronLeft, ChevronRight, Sparkles, ArrowLeft,
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import { bulkEmailService } from '@/services/bulk-email'
import { FormTemplate, FormModule, FormTemplateQueryParams } from '@/types/bulk-email'
import { showToast } from '@/utils/toast'
import { formatDate } from '@/utils/formatters'

const MODULE_LABELS: Record<string, string> = {
  [FormModule.EVENTS]: 'Events',
  [FormModule.FIRST_TIMERS]: 'First Timers',
  [FormModule.MEMBERS]: 'Members',
  [FormModule.GENERAL]: 'General',
}

const MODULE_COLORS: Record<string, { bg: string; text: string }> = {
  [FormModule.EVENTS]: { bg: 'bg-purple-50', text: 'text-purple-700' },
  [FormModule.FIRST_TIMERS]: { bg: 'bg-amber-50', text: 'text-amber-700' },
  [FormModule.MEMBERS]: { bg: 'bg-blue-50', text: 'text-blue-700' },
  [FormModule.GENERAL]: { bg: 'bg-gray-50', text: 'text-gray-700' },
}

export default function Forms() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [forms, setForms] = useState<FormTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedModule, setSelectedModule] = useState(searchParams.get('module') || '')
  const [moduleCounts, setModuleCounts] = useState<{ module: string; count: number }[]>([])
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10))
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; form: FormTemplate | null }>({
    open: false,
    form: null,
  })
  const [deleting, setDeleting] = useState(false)

  const fetchForms = useCallback(async () => {
    try {
      setLoading(true)
      const params: FormTemplateQueryParams = {
        page,
        limit: 20,
        search: searchTerm || undefined,
        module: (selectedModule || undefined) as FormModule | undefined,
      }
      const result = await bulkEmailService.getFormTemplates(params)
      setForms(result.items || [])
      setTotal(result.total || 0)
      setTotalPages(result.totalPages || 1)
    } catch {
      showToast.error('Failed to load forms')
    } finally {
      setLoading(false)
    }
  }, [page, searchTerm, selectedModule])

  const fetchModuleCounts = useCallback(async () => {
    try {
      const counts = await bulkEmailService.getFormModuleCounts()
      setModuleCounts(counts)
    } catch {}
  }, [])

  useEffect(() => {
    fetchForms()
  }, [fetchForms])

  useEffect(() => {
    fetchModuleCounts()
  }, [fetchModuleCounts])

  useEffect(() => {
    const params: any = {}
    if (searchTerm) params.search = searchTerm
    if (selectedModule) params.module = selectedModule
    if (page > 1) params.page = page.toString()
    setSearchParams(params, { replace: true })
  }, [searchTerm, selectedModule, page, setSearchParams])

  const handleSearch = () => {
    setPage(1)
    fetchForms()
  }

  const handleDelete = async () => {
    if (!deleteModal.form) return
    setDeleting(true)
    try {
      await bulkEmailService.deleteFormTemplate(deleteModal.form._id)
      showToast.success('Form deleted')
      setDeleteModal({ open: false, form: null })
      fetchForms()
      fetchModuleCounts()
    } catch {
      showToast.error('Failed to delete form')
    } finally {
      setDeleting(false)
    }
  }

  const totalForms = moduleCounts.reduce((sum, c) => sum + c.count, 0)

  const MODULE_TABS = [
    { key: '', label: 'All', count: totalForms },
    ...Object.values(FormModule).map((m) => ({
      key: m,
      label: MODULE_LABELS[m] || m,
      count: moduleCounts.find((c) => c.module === m)?.count || 0,
    })),
  ]

  return (
    <Layout title="Form Templates">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/bulk-email')}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Form Templates</h1>
              <p className="text-sm text-gray-500">
                Create reusable forms and link them to events, registration, or feedback
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/bulk-email/forms/new')}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Form
          </Button>
        </div>

        {/* Module tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {MODULE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setSelectedModule(tab.key)
                setPage(1)
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedModule === tab.key
                  ? 'bg-[#0D7770] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  selectedModule === tab.key
                    ? 'bg-white/20'
                    : 'bg-gray-200/80'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search forms..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D7770]/20 focus:border-[#0D7770]"
            />
          </div>
          <Button variant="outline" onClick={handleSearch}>
            Search
          </Button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : forms.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <Sparkles className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">No form templates found</p>
            <p className="text-xs text-gray-400 mt-1">
              {searchTerm || selectedModule
                ? 'Try adjusting your search or filters'
                : 'Create your first form template to get started'}
            </p>
            {!searchTerm && !selectedModule && (
              <Button
                className="mt-4"
                size="sm"
                onClick={() => navigate('/bulk-email/forms/new')}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Create Form
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {forms.map((form, i) => {
              const modColor = MODULE_COLORS[form.module] || MODULE_COLORS[FormModule.GENERAL]
              const creator =
                typeof form.createdBy === 'object' && form.createdBy
                  ? `${form.createdBy.firstName} ${form.createdBy.lastName}`
                  : null

              return (
                <motion.div
                  key={form._id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <div className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 rounded-lg flex-shrink-0">
                        <FileInput className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {form.name}
                          </h3>
                          {form.isSystem && (
                            <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                              <Lock className="w-2.5 h-2.5" /> System
                            </span>
                          )}
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${modColor.bg} ${modColor.text}`}
                          >
                            {MODULE_LABELS[form.module] || form.module}
                          </span>
                          {form.isActive ? (
                            <span className="flex items-center gap-0.5 text-[10px] text-emerald-600">
                              <CheckCircle className="w-2.5 h-2.5" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                              <XCircle className="w-2.5 h-2.5" /> Inactive
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                          <span>{form.fields?.length || 0} fields</span>
                          {form.description && (
                            <span className="truncate max-w-[200px]">{form.description}</span>
                          )}
                          {creator && <span>by {creator}</span>}
                          {form.createdAt && <span>{formatDate(form.createdAt)}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => navigate(`/bulk-email/forms/${form._id}`)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => navigate(`/bulk-email/forms/${form._id}/edit`)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {!form.isSystem && (
                          <button
                            onClick={() => setDeleteModal({ open: true, form })}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages} ({total} forms)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        <Modal
          isOpen={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, form: null })}
          title="Delete Form"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete{' '}
              <span className="font-semibold">{deleteModal.form?.name}</span>? This action cannot be
              undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteModal({ open: false, form: null })}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  )
}
