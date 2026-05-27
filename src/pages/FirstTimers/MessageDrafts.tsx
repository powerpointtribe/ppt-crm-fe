import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Calendar, Clock, Send, Eye, Edit, Trash2,
  MessageSquare, CheckCircle, AlertCircle, Loader, Mail,
  ChevronLeft, ChevronRight, MoreHorizontal, Sparkles, Users
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import Modal from '@/components/ui/Modal'
import { MessageDraft, messageDraftsService } from '@/services/message-drafts'
import { formatDate } from '@/utils/formatters'
import { useToast } from '@/hooks/useToast'

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; icon: any; label: string }> = {
  draft: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400', icon: MessageSquare, label: 'Draft' },
  scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', icon: Clock, label: 'Scheduled' },
  sending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', icon: Loader, label: 'Sending' },
  sent: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle, label: 'Sent' },
  failed: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', icon: AlertCircle, label: 'Failed' },
}

const TEMPLATE_NAMES: Record<number, { label: string; color: string }> = {
  1: { label: 'Warm', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  2: { label: 'Professional', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  3: { label: 'Vibrant', color: 'text-purple-700 bg-purple-50 border-purple-200' },
}

export default function MessageDrafts() {
  const navigate = useNavigate()
  const toast = useToast()
  const [drafts, setDrafts] = useState<MessageDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [draftToDelete, setDraftToDelete] = useState<MessageDraft | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [sendNowModalOpen, setSendNowModalOpen] = useState(false)
  const [draftToSend, setDraftToSend] = useState<MessageDraft | null>(null)
  const [sendLoading, setSendLoading] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const loadDrafts = useCallback(async (page: number = currentPage) => {
    try {
      setLoading(true)
      setError(null)
      const params: any = { page, limit: 10 }
      if (statusFilter) params.status = statusFilter
      const response = await messageDraftsService.getMessageDrafts(params)
      setDrafts(response.data || [])
      setPagination({ total: response.total, page: response.page, totalPages: response.totalPages })
      setCurrentPage(page)
    } catch (err: any) {
      setError({ message: 'Failed to load message drafts', details: err?.message })
    } finally {
      setLoading(false)
    }
  }, [currentPage, statusFilter])

  useEffect(() => { setCurrentPage(1); loadDrafts(1) }, [statusFilter])

  const handleDelete = async () => {
    if (!draftToDelete) return
    try {
      setDeleteLoading(true)
      await messageDraftsService.deleteMessageDraft(draftToDelete._id)
      setDeleteModalOpen(false)
      setDraftToDelete(null)
      toast.success('Draft deleted')
      loadDrafts(currentPage)
    } catch (err: any) {
      toast.error('Failed to delete: ' + (err?.message || ''))
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleSendNow = async () => {
    if (!draftToSend) return
    try {
      setSendLoading(true)
      await messageDraftsService.sendMessageNow(draftToSend._id)
      setSendNowModalOpen(false)
      setDraftToSend(null)
      toast.success('Message sent successfully!')
      loadDrafts(currentPage)
    } catch (err: any) {
      toast.error('Failed to send: ' + (err?.message || ''))
    } finally {
      setSendLoading(false)
    }
  }

  const filteredDrafts = drafts.filter(d =>
    !searchTerm || d.title.toLowerCase().includes(searchTerm.toLowerCase()) || d.message?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const counts = {
    total: pagination?.total || drafts.length,
    scheduled: drafts.filter(d => d.status === 'scheduled').length,
    sent: drafts.filter(d => d.status === 'sent').length,
    failed: drafts.filter(d => d.status === 'failed').length,
  }

  return (
    <ErrorBoundary error={error}>
      <Layout title="Message Drafts">
        <div className="space-y-5">

          {/* Header bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Message Drafts</h1>
              <p className="text-sm text-gray-500 mt-0.5">Create and manage welcome emails for first-timers</p>
            </div>
            <Button onClick={() => navigate('/first-timers/message-drafts/new')} className="shrink-0">
              <Plus className="h-4 w-4 mr-1.5" />
              New Draft
            </Button>
          </div>

          {/* Compact stat pills */}
          <div className="flex gap-2 flex-wrap">
            {[
              { label: 'Total', value: counts.total, icon: Mail, color: 'text-gray-700 bg-white border-gray-200' },
              { label: 'Scheduled', value: counts.scheduled, icon: Clock, color: 'text-blue-700 bg-blue-50 border-blue-200' },
              { label: 'Sent', value: counts.sent, icon: CheckCircle, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
              { label: 'Failed', value: counts.failed, icon: AlertCircle, color: 'text-red-700 bg-red-50 border-red-200' },
            ].map(s => (
              <div key={s.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${s.color}`}>
                <s.icon className="w-3.5 h-3.5" />
                {s.label}: {s.value}
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search drafts..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0D7770]/20 focus:border-[#0D7770] outline-none bg-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-[#0D7770]/20 focus:border-[#0D7770] outline-none"
            >
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner /></div>
          ) : filteredDrafts.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">No drafts yet</h3>
              <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
                {searchTerm || statusFilter ? 'Try adjusting your filters' : 'Create your first welcome email draft'}
              </p>
              {!searchTerm && !statusFilter && (
                <Button size="sm" onClick={() => navigate('/first-timers/message-drafts/new')}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Create Draft
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-2">
              {filteredDrafts.map((draft, index) => {
                const status = STATUS_CONFIG[draft.status] || STATUS_CONFIG.draft
                const tpl = TEMPLATE_NAMES[draft.templateId || 0]

                return (
                  <motion.div
                    key={draft._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-4 px-4 py-3">
                      {/* Status dot + icon */}
                      <div className={`w-9 h-9 rounded-lg ${status.bg} flex items-center justify-center shrink-0`}>
                        <status.icon className={`w-4 h-4 ${status.text}`} />
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/first-timers/message-drafts/${draft._id}`)}>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{draft.title}</h3>
                          {tpl && (
                            <span className={`hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border ${tpl.color}`}>
                              {tpl.label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          {draft.subject && (
                            <span className="text-xs text-gray-500 truncate max-w-[200px]">{draft.subject}</span>
                          )}
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="hidden md:flex items-center gap-4 shrink-0">
                        {draft.scheduledDate && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(draft.scheduledDate)}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          {draft.scheduledTime ? new Date(draft.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </div>
                        {(draft.status === 'sent' || draft.status === 'failed') && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Users className="w-3.5 h-3.5" />
                            <span className="text-emerald-600 font-medium">{draft.successCount || 0}</span>
                            {(draft.failedCount || 0) > 0 && (
                              <span className="text-red-500">/ {draft.failedCount} failed</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Status badge */}
                      <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${status.bg} ${status.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                        {status.label}
                      </span>

                      {/* Actions */}
                      <div className="relative shrink-0">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === draft._id ? null : draft._id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        <AnimatePresence>
                          {openMenuId === draft._id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20"
                            >
                              <button
                                onClick={() => { navigate(`/first-timers/message-drafts/${draft._id}`); setOpenMenuId(null) }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </button>
                              {(draft.status === 'draft' || draft.status === 'scheduled') && (
                                <>
                                  <button
                                    onClick={() => { navigate(`/first-timers/message-drafts/${draft._id}/edit`); setOpenMenuId(null) }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <Edit className="w-3.5 h-3.5" /> Edit
                                  </button>
                                  <button
                                    onClick={() => { setDraftToSend(draft); setSendNowModalOpen(true); setOpenMenuId(null) }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50"
                                  >
                                    <Send className="w-3.5 h-3.5" /> Send Now
                                  </button>
                                  <div className="h-px bg-gray-100 my-1"></div>
                                  <button
                                    onClick={() => { setDraftToDelete(draft); setDeleteModalOpen(true); setOpenMenuId(null) }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
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
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-500">
                Page {currentPage} of {pagination.totalPages} &middot; {pagination.total} total
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => loadDrafts(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => loadDrafts(page)}
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
                  onClick={() => loadDrafts(currentPage + 1)}
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
        <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Draft">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Are you sure? This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setDeleteModalOpen(false)} disabled={deleteLoading}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Send Now Modal */}
        <Modal isOpen={sendNowModalOpen} onClose={() => setSendNowModalOpen(false)} title="Send Now">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">This will send the email to all matching recipients immediately.</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setSendNowModalOpen(false)} disabled={sendLoading}>Cancel</Button>
              <Button size="sm" onClick={handleSendNow} disabled={sendLoading}>
                {sendLoading ? 'Sending...' : 'Send Now'}
              </Button>
            </div>
          </div>
        </Modal>
      </Layout>
    </ErrorBoundary>
  )
}
