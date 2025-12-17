import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Edit, Trash2, Send, Calendar, Clock, User,
  CheckCircle, AlertCircle, Loader, MessageSquare, Mail
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

export default function MessageDraftDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [draft, setDraft] = useState<MessageDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [sendNowModalOpen, setSendNowModalOpen] = useState(false)
  const [sendLoading, setSendLoading] = useState(false)

  useEffect(() => {
    loadDraft()
  }, [id])

  const loadDraft = async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)
      const data = await messageDraftsService.getMessageDraftById(id)
      setDraft(data)
    } catch (error: any) {
      console.error('Error loading draft:', error)
      setError({
        status: error?.code || error?.response?.status || 500,
        message: 'Failed to load draft',
        details: error?.message || error?.response?.data?.message || 'An unexpected error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return

    try {
      setDeleteLoading(true)
      await messageDraftsService.deleteMessageDraft(id)
      navigate('/first-timers/message-drafts')
    } catch (error: any) {
      console.error('Error deleting draft:', error)
      alert('Failed to delete draft: ' + (error?.message || 'An unexpected error occurred'))
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleSendNow = async () => {
    if (!id) return

    try {
      setSendLoading(true)
      await messageDraftsService.sendMessageNow(id)
      setSendNowModalOpen(false)
      loadDraft() // Reload to show updated status
      alert('Message sent successfully!')
    } catch (error: any) {
      console.error('Error sending draft:', error)
      alert('Failed to send draft: ' + (error?.message || 'An unexpected error occurred'))
    } finally {
      setSendLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      </Layout>
    )
  }

  if (!draft) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Draft not found</p>
          <Button
            onClick={() => navigate('/first-timers/message-drafts')}
            className="mt-4"
          >
            Back to Drafts
          </Button>
        </div>
      </Layout>
    )
  }

  const StatusIcon = statusIcons[draft.status]
  const canEdit = draft.status === 'draft' || draft.status === 'scheduled'
  const canSend = draft.status === 'draft' || draft.status === 'scheduled'
  const canDelete = draft.status === 'draft' || draft.status === 'scheduled'

  return (
    <ErrorBoundary error={error}>
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/first-timers/message-drafts')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{draft.title}</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Message Draft Details
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {canEdit && (
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/first-timers/message-drafts/${id}/edit`)}
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              )}
              {canSend && (
                <Button
                  onClick={() => setSendNowModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Now
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="danger"
                  onClick={() => setDeleteModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-2">Status</p>
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${statusColors[draft.status]}`}>
                  <StatusIcon className="w-4 h-4" />
                  {draft.status.charAt(0).toUpperCase() + draft.status.slice(1)}
                </span>
              </div>
              {draft.sentAt && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Sent At</p>
                  <p className="text-lg font-medium text-gray-900">
                    {formatDate(draft.sentAt)} at {new Date(draft.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Schedule Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Scheduled Date</p>
                  <p className="text-lg font-medium text-gray-900">
                    {formatDate(draft.scheduledDate)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Message will be sent to first timers who visited on this date
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Scheduled Time</p>
                  <p className="text-lg font-medium text-gray-900">
                    {new Date(draft.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Time when the message will be sent
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Message Content */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Message Content</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="whitespace-pre-wrap font-sans text-gray-900">
                {draft.message}
              </pre>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              <p>Variables like <code className="bg-gray-100 px-1 py-0.5 rounded">{'{{firstName}}'}</code> and <code className="bg-gray-100 px-1 py-0.5 rounded">{'{{lastName}}'}</code> will be replaced with actual values</p>
            </div>
          </div>

          {/* Recipient Statistics */}
          {(draft.status === 'sent' || draft.status === 'failed') && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recipient Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Recipients</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {draft.recipientCount || 0}
                    </p>
                  </div>
                </div>

                {draft.successCount !== undefined && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Successfully Sent</p>
                      <p className="text-2xl font-bold text-green-600">
                        {draft.successCount}
                      </p>
                    </div>
                  </div>
                )}

                {draft.failedCount !== undefined && draft.failedCount > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-50 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Failed</p>
                      <p className="text-2xl font-bold text-red-600">
                        {draft.failedCount}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {draft.failureReason && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800">Error Details</p>
                  <p className="text-sm text-red-600 mt-1">{draft.failureReason}</p>
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
            <div className="space-y-3">
              {draft.createdBy && (
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-500">Created by: </span>
                    <span className="text-sm text-gray-900 font-medium">
                      {typeof draft.createdBy === 'object' && draft.createdBy !== null
                        ? `${draft.createdBy.firstName} ${draft.createdBy.lastName}`
                        : 'Unknown'}
                    </span>
                  </div>
                </div>
              )}
              {draft.updatedBy && (
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-500">Last updated by: </span>
                    <span className="text-sm text-gray-900 font-medium">
                      {typeof draft.updatedBy === 'object' && draft.updatedBy !== null
                        ? `${draft.updatedBy.firstName} ${draft.updatedBy.lastName}`
                        : 'Unknown'}
                    </span>
                  </div>
                </div>
              )}
              {draft.createdAt && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-500">Created: </span>
                    <span className="text-sm text-gray-900">
                      {formatDate(draft.createdAt)} at {new Date(draft.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
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
              Are you sure you want to send this message now? It will be sent to all first timers from {formatDate(draft.scheduledDate)}.
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
