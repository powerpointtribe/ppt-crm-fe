import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus, Search, Calendar, Clock, Send, Eye, Edit, Trash2,
  MessageSquare, CheckCircle, AlertCircle, Loader, Mail
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import Modal from '@/components/ui/Modal'
import { MessageDraft, messageDraftsService } from '@/services/message-drafts'
import { formatDate } from '@/utils/formatters'

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  sending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
}

const statusIcons = {
  draft: MessageSquare,
  scheduled: Clock,
  sending: Loader,
  sent: CheckCircle,
  failed: AlertCircle,
}

export default function MessageDrafts() {
  const navigate = useNavigate()
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

  const loadDrafts = useCallback(async (page: number = currentPage) => {
    try {
      setLoading(true)
      setError(null)
      const params: any = {
        page,
        limit: 10,
      }
      if (statusFilter) {
        params.status = statusFilter
      }
      const response = await messageDraftsService.getMessageDrafts(params)
      setDrafts(response.data || [])
      setPagination({
        total: response.total,
        page: response.page,
        totalPages: response.totalPages,
      })
      setCurrentPage(page)
    } catch (error: any) {
      console.error('Error loading message drafts:', error)
      setError({
        status: error?.code || error?.response?.status || 500,
        message: 'Failed to load message drafts',
        details: error?.message || error?.response?.data?.message || 'An unexpected error occurred'
      })
    } finally {
      setLoading(false)
    }
  }, [currentPage, statusFilter])

  useEffect(() => {
    setCurrentPage(1)
    loadDrafts(1)
  }, [statusFilter])

  const handleDelete = async () => {
    if (!draftToDelete) return

    try {
      setDeleteLoading(true)
      await messageDraftsService.deleteMessageDraft(draftToDelete._id)
      setDeleteModalOpen(false)
      setDraftToDelete(null)
      loadDrafts(currentPage)
    } catch (error: any) {
      console.error('Error deleting draft:', error)
      alert('Failed to delete draft: ' + (error?.message || 'An unexpected error occurred'))
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
      loadDrafts(currentPage)
      alert('Message sent successfully!')
    } catch (error: any) {
      console.error('Error sending draft:', error)
      alert('Failed to send draft: ' + (error?.message || 'An unexpected error occurred'))
    } finally {
      setSendLoading(false)
    }
  }

  const confirmDelete = (draft: MessageDraft) => {
    setDraftToDelete(draft)
    setDeleteModalOpen(true)
  }

  const confirmSendNow = (draft: MessageDraft) => {
    setDraftToSend(draft)
    setSendNowModalOpen(true)
  }

  const filteredDrafts = drafts.filter(draft => {
    if (searchTerm) {
      return draft.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             draft.message.toLowerCase().includes(searchTerm.toLowerCase())
    }
    return true
  })

  return (
    <ErrorBoundary error={error}>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Message Drafts</h1>
              <p className="mt-1 text-sm text-gray-500">
                Create and schedule messages for first timers
              </p>
            </div>
            <Button
              onClick={() => navigate('/first-timers/message-drafts/new')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Draft
            </Button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search drafts by title or message..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="sending">Sending</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Drafts List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredDrafts.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No message drafts found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first message draft'}
              </p>
              {!searchTerm && !statusFilter && (
                <Button
                  onClick={() => navigate('/first-timers/message-drafts/new')}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Create Draft
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheduled Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipients
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDrafts.map((draft) => {
                    const StatusIcon = statusIcons[draft.status]

                    return (
                      <motion.tr
                        key={draft._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{draft.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formatDate(draft.scheduledDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {new Date(draft.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[draft.status]}`}>
                            <StatusIcon className="w-3 h-3" />
                            {draft.status.charAt(0).toUpperCase() + draft.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {draft.status === 'sent' || draft.status === 'failed' ? (
                            <div className="space-y-1">
                              <div>{draft.recipientCount || 0} total</div>
                              {draft.successCount !== undefined && (
                                <div className="text-green-600">{draft.successCount} sent</div>
                              )}
                              {draft.failedCount !== undefined && draft.failedCount > 0 && (
                                <div className="text-red-600">{draft.failedCount} failed</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/first-timers/message-drafts/${draft._id}`)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {(draft.status === 'draft' || draft.status === 'scheduled') && (
                              <>
                                <button
                                  onClick={() => navigate(`/first-timers/message-drafts/${draft._id}/edit`)}
                                  className="text-gray-600 hover:text-gray-900"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => confirmSendNow(draft)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Send Now"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => confirmDelete(draft)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-lg shadow">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => loadDrafts(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => loadDrafts(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{pagination.totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => loadDrafts(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => loadDrafts(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => loadDrafts(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Delete Message Draft"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete this message draft? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Send Now Confirmation Modal */}
        <Modal
          isOpen={sendNowModalOpen}
          onClose={() => setSendNowModalOpen(false)}
          title="Send Message Now"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to send this message now? It will be sent to all first timers from the scheduled date.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setSendNowModalOpen(false)}
                disabled={sendLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendNow}
                disabled={sendLoading}
              >
                {sendLoading ? 'Sending...' : 'Send Now'}
              </Button>
            </div>
          </div>
        </Modal>
      </Layout>
    </ErrorBoundary>
  )
}
