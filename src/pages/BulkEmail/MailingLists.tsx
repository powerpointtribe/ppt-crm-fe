import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Users, Upload, Calendar, Eye, Trash2,
  MoreHorizontal, Sparkles, ChevronLeft, ChevronRight
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/hooks/useToast'
import { bulkEmailService } from '@/services/bulk-email'

const SOURCE_CONFIG: Record<string, { icon: any; bg: string; text: string; label: string }> = {
  csv_import: { icon: Upload, bg: 'bg-blue-50', text: 'text-blue-700', label: 'CSV Import' },
  event: { icon: Calendar, bg: 'bg-purple-50', text: 'text-purple-700', label: 'Event' },
  manual: { icon: Users, bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Manual' },
}

export default function MailingLists() {
  const navigate = useNavigate()
  const toast = useToast()
  const [lists, setLists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [listToDelete, setListToDelete] = useState<any>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const loadLists = useCallback(async (page: number = currentPage) => {
    try {
      setLoading(true)
      const params: any = { page, limit: 10 }
      if (searchTerm) params.search = searchTerm
      const response = await bulkEmailService.getMailingLists(params)
      const items = response?.items || response?.data || response || []
      setLists(Array.isArray(items) ? items : [])
      setPagination({
        total: response?.total || response?.pagination?.total || items.length,
        page: response?.page || response?.pagination?.page || page,
        totalPages: response?.totalPages || response?.pagination?.totalPages || 1,
      })
      setCurrentPage(page)
    } catch (err: any) {
      toast.error('Failed to load mailing lists')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm])

  useEffect(() => {
    setCurrentPage(1)
    loadLists(1)
  }, [searchTerm])

  const handleDelete = async () => {
    if (!listToDelete) return
    try {
      setDeleteLoading(true)
      await bulkEmailService.deleteMailingList(listToDelete._id)
      setDeleteModalOpen(false)
      setListToDelete(null)
      toast.success('Mailing list deleted')
      loadLists(currentPage)
    } catch (err: any) {
      toast.error('Failed to delete: ' + (err?.message || ''))
    } finally {
      setDeleteLoading(false)
    }
  }

  const getSourceConfig = (source: string) => {
    return SOURCE_CONFIG[source] || SOURCE_CONFIG.manual
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Layout title="Mailing Lists">
      <div className="space-y-5">

        {/* Header bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mailing Lists</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your email contact lists for bulk campaigns</p>
          </div>
          <Button onClick={() => navigate('/bulk-email/mailing-lists/new')} className="shrink-0">
            <Plus className="h-4 w-4 mr-1.5" />
            New List
          </Button>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search mailing lists..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0D7770]/20 focus:border-[#0D7770] outline-none bg-white"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : lists.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No mailing lists yet</h3>
            <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
              {searchTerm ? 'Try adjusting your search' : 'Create your first mailing list to start sending bulk emails'}
            </p>
            {!searchTerm && (
              <Button size="sm" onClick={() => navigate('/bulk-email/mailing-lists/new')}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Create List
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-2">
            {lists.map((list, index) => {
              const source = getSourceConfig(list.source || 'manual')
              const SourceIcon = source.icon

              return (
                <motion.div
                  key={list._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center gap-4 px-4 py-3">
                    {/* Source icon */}
                    <div className={`w-9 h-9 rounded-lg ${source.bg} flex items-center justify-center shrink-0`}>
                      <SourceIcon className={`w-4 h-4 ${source.text}`} />
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{list.name}</h3>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">
                          <Users className="w-3 h-3 mr-0.5" />
                          {list.contactCount ?? list.contacts?.length ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {list.description && (
                          <span className="text-xs text-gray-500 truncate max-w-[250px]">{list.description}</span>
                        )}
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="hidden md:flex items-center gap-4 shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${source.bg} ${source.text}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {source.label}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(list.createdAt)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="relative shrink-0">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === list._id ? null : list._id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      <AnimatePresence>
                        {openMenuId === list._id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20"
                          >
                            <button
                              onClick={() => { navigate(`/bulk-email/mailing-lists/${list._id}`); setOpenMenuId(null) }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                            <div className="h-px bg-gray-100 my-1"></div>
                            <button
                              onClick={() => { setListToDelete(list); setDeleteModalOpen(true); setOpenMenuId(null) }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
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
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-500">
              Page {currentPage} of {pagination.totalPages} &middot; {pagination.total} total
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => loadLists(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => loadLists(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium ${
                    page === currentPage
                      ? 'bg-[#0D7770] text-white'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => loadLists(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Close menu on outside click */}
      {openMenuId && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
      )}

      {/* Delete Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Mailing List">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <span className="font-semibold">"{listToDelete?.name}"</span>? This will remove all contacts in this list. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDeleteModalOpen(false)} disabled={deleteLoading}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
