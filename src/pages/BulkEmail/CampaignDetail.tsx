import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Send,
  Clock,
  Users,
  Eye,
  Play,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Mail
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Pagination from '@/components/ui/Pagination'
import { bulkEmailService } from '@/services/bulk-email'
import {
  EmailCampaign,
  CampaignStatus,
  EmailSendLog,
  SendLogStatus,
  RecipientPreview
} from '@/types/bulk-email'
import { showToast } from '@/utils/toast'
import { formatDate } from '@/utils/formatters'

function getStatusBadge(status: CampaignStatus) {
  switch (status) {
    case CampaignStatus.DRAFT:
      return <Badge variant="secondary">Draft</Badge>
    case CampaignStatus.SCHEDULED:
      return <Badge variant="info">Scheduled</Badge>
    case CampaignStatus.SENDING:
      return <Badge variant="warning">Sending</Badge>
    case CampaignStatus.SENT:
      return <Badge variant="success">Sent</Badge>
    case CampaignStatus.FAILED:
      return <Badge variant="error">Failed</Badge>
    case CampaignStatus.CANCELLED:
      return <Badge variant="secondary">Cancelled</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

function getSendLogStatusBadge(status: SendLogStatus) {
  switch (status) {
    case SendLogStatus.PENDING:
      return <Badge variant="secondary">Pending</Badge>
    case SendLogStatus.SENT:
      return <Badge variant="info">Sent</Badge>
    case SendLogStatus.DELIVERED:
      return <Badge variant="success">Delivered</Badge>
    case SendLogStatus.FAILED:
      return <Badge variant="error">Failed</Badge>
    case SendLogStatus.BOUNCED:
      return <Badge variant="warning">Bounced</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [campaign, setCampaign] = useState<EmailCampaign | null>(null)
  const [sendLogs, setSendLogs] = useState<EmailSendLog[]>([])
  const [recipientPreview, setRecipientPreview] = useState<RecipientPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [logsPagination, setLogsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    if (id) {
      fetchCampaignDetails()
    }
  }, [id])

  useEffect(() => {
    if (id && campaign &&
      (campaign.status === CampaignStatus.SENT || campaign.status === CampaignStatus.SENDING)) {
      fetchSendLogs()
    }
  }, [id, campaign?.status, logsPagination.page])

  const fetchCampaignDetails = async () => {
    try {
      setLoading(true)
      const data = await bulkEmailService.getCampaignById(id!)
      setCampaign(data)

      if (data.status === CampaignStatus.DRAFT) {
        try {
          const preview = await bulkEmailService.previewRecipients(id!)
          setRecipientPreview(preview)
        } catch (e) {
          // Ignore preview errors
        }
      }
    } catch (error: any) {
      console.error('Error fetching campaign:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSendLogs = async () => {
    try {
      const response = await bulkEmailService.getCampaignLogs(id!, {
        page: logsPagination.page,
        limit: logsPagination.limit,
      })
      setSendLogs(response.items)
      setLogsPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
      }))
    } catch (error) {
      console.error('Error fetching send logs:', error)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return

    try {
      await bulkEmailService.deleteCampaign(id!)
      showToast('success', 'Campaign deleted successfully')
      navigate('/bulk-email/campaigns')
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete campaign')
    }
  }

  const handleSend = async () => {
    if (!window.confirm('Send this campaign now?')) return

    try {
      await bulkEmailService.sendCampaign(id!)
      showToast('success', 'Campaign is being sent')
      fetchCampaignDetails()
    } catch (error: any) {
      showToast('error', error.message || 'Failed to send campaign')
    }
  }

  const handleSchedule = async () => {
    if (!scheduleDate) {
      showToast('error', 'Please select a date and time')
      return
    }

    try {
      await bulkEmailService.scheduleCampaign(id!, { scheduledAt: scheduleDate })
      showToast('success', 'Campaign scheduled successfully')
      setShowScheduleModal(false)
      fetchCampaignDetails()
    } catch (error: any) {
      showToast('error', error.message || 'Failed to schedule campaign')
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Cancel this scheduled campaign?')) return

    try {
      await bulkEmailService.cancelCampaign(id!)
      showToast('success', 'Campaign cancelled')
      fetchCampaignDetails()
    } catch (error: any) {
      showToast('error', error.message || 'Failed to cancel campaign')
    }
  }

  if (loading) {
    return (
      <Layout title="Campaign Details">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error || !campaign) {
    return (
      <Layout title="Campaign Details">
        <Card className="p-8 text-center">
          <p className="text-red-600">{error?.message || 'Campaign not found'}</p>
          <Button variant="outline" onClick={() => navigate('/bulk-email/campaigns')} className="mt-4">
            Back to Campaigns
          </Button>
        </Card>
      </Layout>
    )
  }

  const deliveryRate = campaign.stats.sent > 0
    ? ((campaign.stats.delivered / campaign.stats.sent) * 100).toFixed(1)
    : 0

  return (
    <Layout title={campaign.name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/bulk-email/campaigns')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {campaign.status === CampaignStatus.DRAFT && (
              <>
                <Button variant="outline" onClick={() => setShowScheduleModal(true)}>
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
                <Link to={`/bulk-email/campaigns/${campaign._id}/edit`}>
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                <Button onClick={handleSend}>
                  <Play className="h-4 w-4 mr-2" />
                  Send Now
                </Button>
              </>
            )}
            {campaign.status === CampaignStatus.SCHEDULED && (
              <Button variant="outline" onClick={handleCancel} className="text-orange-600">
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            {(campaign.status === CampaignStatus.DRAFT || campaign.status === CampaignStatus.CANCELLED) && (
              <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Campaign Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
                  <p className="text-gray-600 mt-1">{campaign.subject}</p>
                </div>
                {getStatusBadge(campaign.status)}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Email Content</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowPreview(true)}>
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                </div>
                <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-sm font-mono max-h-64">
                  {campaign.htmlContent}
                </pre>
              </div>
            </Card>

            {/* Delivery Stats (for sent campaigns) */}
            {(campaign.status === CampaignStatus.SENT || campaign.status === CampaignStatus.SENDING) && (
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Delivery Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-700">{campaign.stats.totalRecipients}</p>
                    <p className="text-sm text-blue-600">Total Recipients</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-700">{campaign.stats.sent}</p>
                    <p className="text-sm text-purple-600">Sent</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">{campaign.stats.delivered}</p>
                    <p className="text-sm text-green-600">Delivered</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-700">{campaign.stats.failed}</p>
                    <p className="text-sm text-red-600">Failed</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Delivery Rate</span>
                    <span className="text-lg font-semibold text-gray-900">{deliveryRate}%</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${deliveryRate}%` }}
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Send Logs */}
            {(campaign.status === CampaignStatus.SENT || campaign.status === CampaignStatus.SENDING) && sendLogs.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Delivery Log</h3>
                <div className="space-y-2">
                  {sendLogs.map((log) => {
                    const member = typeof log.member === 'object' ? log.member : null
                    return (
                      <div
                        key={log._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {member ? `${member.firstName} ${member.lastName}` : log.email}
                            </p>
                            <p className="text-sm text-gray-500">{log.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getSendLogStatusBadge(log.status)}
                          {log.errorMessage && (
                            <span className="text-xs text-red-500">{log.errorMessage}</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {logsPagination.totalPages > 1 && (
                  <div className="mt-4">
                    <Pagination
                      currentPage={logsPagination.page}
                      totalPages={logsPagination.totalPages}
                      onPageChange={(page) => setLogsPagination((prev) => ({ ...prev, page }))}
                    />
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Campaign Info</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">{getStatusBadge(campaign.status)}</div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Recipients</p>
                  <p className="text-gray-900 mt-1 flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {campaign.stats.totalRecipients} members
                  </p>
                </div>

                {campaign.scheduledAt && (
                  <div>
                    <p className="text-sm text-gray-500">Scheduled For</p>
                    <p className="text-gray-900 mt-1 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDate(campaign.scheduledAt)}
                    </p>
                  </div>
                )}

                {campaign.sentAt && (
                  <div>
                    <p className="text-sm text-gray-500">Sent At</p>
                    <p className="text-gray-900 mt-1 flex items-center">
                      <Send className="h-4 w-4 mr-1" />
                      {formatDate(campaign.sentAt)}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="text-gray-900 mt-1">{formatDate(campaign.createdAt)}</p>
                </div>
              </div>
            </Card>

            {/* Recipient Preview (for drafts) */}
            {campaign.status === CampaignStatus.DRAFT && recipientPreview && (
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Recipient Preview</h3>
                <p className="text-sm text-gray-600 mb-3">
                  {recipientPreview.totalCount} members will receive this email
                </p>
                {recipientPreview.sampleRecipients.length > 0 && (
                  <div className="space-y-2">
                    {recipientPreview.sampleRecipients.slice(0, 5).map((recipient) => (
                      <div key={recipient._id} className="text-sm">
                        <p className="font-medium text-gray-900">
                          {recipient.firstName} {recipient.lastName}
                        </p>
                        <p className="text-gray-500">{recipient.email}</p>
                      </div>
                    ))}
                    {recipientPreview.totalCount > 5 && (
                      <p className="text-sm text-gray-500">
                        and {recipientPreview.totalCount - 5} more...
                      </p>
                    )}
                  </div>
                )}
              </Card>
            )}

            {/* Recipient Filter Info */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Recipient Filter</h3>
              <p className="text-sm text-gray-600 capitalize">
                {campaign.recipientFilter.filterType.toLowerCase().replace(/_/g, ' ')}
              </p>
            </Card>
          </div>
        </div>

        {/* Preview Modal */}
        <Modal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          title="Email Preview"
          size="lg"
        >
          <div className="border rounded-lg overflow-hidden">
            <iframe
              srcDoc={campaign.htmlContent}
              className="w-full h-96 border-0"
              title="Email Preview"
            />
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </div>
        </Modal>

        {/* Schedule Modal */}
        <Modal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          title="Schedule Campaign"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Choose when you want this campaign to be sent.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Send Date & Time
              </label>
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSchedule}>
                <Clock className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  )
}
