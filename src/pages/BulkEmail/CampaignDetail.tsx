import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Edit, Trash2, Send, Clock, Users, Eye, Play, XCircle,
  CheckCircle, AlertTriangle, Mail, Calendar, TrendingUp, ChevronLeft, ChevronRight,
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { bulkEmailService } from '@/services/bulk-email'
import {
  EmailCampaign, CampaignStatus, EmailSendLog, SendLogStatus, RecipientPreview,
} from '@/types/bulk-email'
import { showToast } from '@/utils/toast'
import { formatDate } from '@/utils/formatters'

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  draft: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Draft' },
  scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Scheduled' },
  sending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Sending' },
  sent: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Sent' },
  failed: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Failed' },
  cancelled: { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400', label: 'Cancelled' },
}

const LOG_STATUS: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-gray-50', text: 'text-gray-600' },
  sent: { bg: 'bg-blue-50', text: 'text-blue-700' },
  delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  failed: { bg: 'bg-red-50', text: 'text-red-700' },
  bounced: { bg: 'bg-amber-50', text: 'text-amber-700' },
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
    page: 1, limit: 10, total: 0, totalPages: 0,
  })

  useEffect(() => { if (id) fetchCampaignDetails() }, [id])

  useEffect(() => {
    if (id && campaign && (campaign.status === CampaignStatus.SENT || campaign.status === CampaignStatus.SENDING)) {
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
        } catch {}
      }
    } catch (error: any) {
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSendLogs = async () => {
    try {
      const response = await bulkEmailService.getCampaignLogs(id!, {
        page: logsPagination.page, limit: logsPagination.limit,
      })
      setSendLogs(response.items)
      setLogsPagination((prev) => ({
        ...prev, total: response.pagination.total, totalPages: response.pagination.totalPages,
      }))
    } catch {}
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
    if (!scheduleDate) { showToast('error', 'Please select a date and time'); return }
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
    return <Layout title="Campaign Details"><div className="flex justify-center py-16"><LoadingSpinner /></div></Layout>
  }

  if (error || !campaign) {
    return (
      <Layout title="Campaign Details">
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-sm text-red-600 mb-3">{error?.message || 'Campaign not found'}</p>
          <Button size="sm" variant="secondary" onClick={() => navigate('/bulk-email/campaigns')}>Back to Campaigns</Button>
        </div>
      </Layout>
    )
  }

  const status = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft
  const stats = campaign.stats || { totalRecipients: 0, sent: 0, delivered: 0, failed: 0 }
  const deliveryRate = stats.sent > 0 ? ((stats.delivered / stats.sent) * 100).toFixed(1) : '0'

  return (
    <Layout title={campaign.name}>
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/bulk-email/campaigns')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900">{campaign.name}</h1>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${status.bg} ${status.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                  {status.label}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{campaign.subject}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {campaign.status === CampaignStatus.DRAFT && (
              <>
                <Button variant="secondary" size="sm" onClick={() => setShowScheduleModal(true)}>
                  <Clock className="w-3.5 h-3.5 mr-1" /> Schedule
                </Button>
                <Button variant="secondary" size="sm" onClick={() => navigate(`/bulk-email/campaigns/${campaign._id}/edit`)}>
                  <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
                <Button size="sm" onClick={handleSend}>
                  <Play className="w-3.5 h-3.5 mr-1" /> Send Now
                </Button>
              </>
            )}
            {campaign.status === CampaignStatus.SCHEDULED && (
              <Button variant="secondary" size="sm" onClick={handleCancel} className="text-amber-600 hover:bg-amber-50">
                <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel
              </Button>
            )}
            {(campaign.status === CampaignStatus.DRAFT || campaign.status === CampaignStatus.CANCELLED) && (
              <Button variant="secondary" size="sm" onClick={handleDelete} className="text-red-600 hover:bg-red-50">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
              </Button>
            )}
          </div>
        </div>

        {/* Info chips */}
        <div className="flex gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 border border-gray-200 text-gray-600">
            <Users className="w-3 h-3" /> {stats.totalRecipients} recipients
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-gray-500 bg-gray-50 border border-gray-200">
            <Mail className="w-3 h-3" /> {campaign.recipientFilter.filterType.toLowerCase().replace(/_/g, ' ')}
          </span>
          {campaign.scheduledAt && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 border border-blue-200 text-blue-700">
              <Clock className="w-3 h-3" /> Scheduled: {formatDate(campaign.scheduledAt)}
            </span>
          )}
          {campaign.sentAt && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-700">
              <Send className="w-3 h-3" /> Sent: {formatDate(campaign.sentAt)}
            </span>
          )}
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs text-gray-500 bg-gray-50 border border-gray-200">
            Created {formatDate(campaign.createdAt)}
          </span>
        </div>

        {/* Delivery Stats */}
        {(campaign.status === CampaignStatus.SENT || campaign.status === CampaignStatus.SENDING) && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Recipients', value: stats.totalRecipients, icon: Users, color: 'text-blue-600 bg-blue-50' },
                { label: 'Sent', value: stats.sent, icon: Send, color: 'text-purple-600 bg-purple-50' },
                { label: 'Delivered', value: stats.delivered, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Delivery Rate', value: `${deliveryRate}%`, icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
              ].map((stat, i) => (
                <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {stats.sent > 0 && (
              <div className="mt-3 bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>Delivery Progress</span>
                  <span className="font-medium">{stats.delivered} / {stats.sent}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${deliveryRate}%` }} />
                </div>
                {stats.failed > 0 && (
                  <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {stats.failed} failed deliveries
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Recipient Preview (drafts) */}
        {campaign.status === CampaignStatus.DRAFT && recipientPreview && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-[#0D7770]" />
              <p className="text-sm font-medium text-gray-900">Recipient Preview</p>
              <span className="text-xs text-gray-500">({recipientPreview.totalCount} members)</span>
            </div>
            {recipientPreview.sampleRecipients.length > 0 && (
              <div className="space-y-1.5">
                {recipientPreview.sampleRecipients.slice(0, 5).map((r) => (
                  <div key={r._id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
                    <div className="w-7 h-7 bg-[#0D7770]/10 rounded-full flex items-center justify-center text-xs font-semibold text-[#0D7770]">
                      {r.firstName[0]}{r.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.firstName} {r.lastName}</p>
                      <p className="text-xs text-gray-500 truncate">{r.email}</p>
                    </div>
                  </div>
                ))}
                {recipientPreview.totalCount > 5 && (
                  <p className="text-xs text-gray-400 px-3">and {recipientPreview.totalCount - 5} more...</p>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Email Content */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">Email Content</p>
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#0D7770] hover:bg-[#0D7770]/5 rounded-lg font-medium transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
          </div>
          <div className="p-4">
            <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-xs font-mono max-h-64 text-gray-700 leading-relaxed">
              {campaign.htmlContent}
            </pre>
          </div>
        </motion.div>

        {/* Delivery Log */}
        {(campaign.status === CampaignStatus.SENT || campaign.status === CampaignStatus.SENDING) && sendLogs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Delivery Log</h2>
              <span className="text-xs text-gray-500">{logsPagination.total} entries</span>
            </div>
            <div className="space-y-1.5">
              {sendLogs.map((log) => {
                const member = typeof log.member === 'object' ? log.member : null
                const logStatus = LOG_STATUS[log.status] || LOG_STATUS.pending
                return (
                  <div key={log._id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
                    <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs font-semibold text-gray-500 shrink-0">
                      {(member ? member.firstName[0] : log.email[0])?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {member ? `${member.firstName} ${member.lastName}` : log.email}
                      </p>
                      {member && <p className="text-xs text-gray-500 truncate">{log.email}</p>}
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${logStatus.bg} ${logStatus.text}`}>
                      {log.status}
                    </span>
                    {log.errorMessage && (
                      <span className="text-xs text-red-500 max-w-[180px] truncate">{log.errorMessage}</span>
                    )}
                  </div>
                )
              })}
            </div>

            {logsPagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-3">
                <p className="text-xs text-gray-500">Page {logsPagination.page} of {logsPagination.totalPages}</p>
                <div className="flex gap-1">
                  <button onClick={() => setLogsPagination(p => ({ ...p, page: p.page - 1 }))} disabled={logsPagination.page === 1} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setLogsPagination(p => ({ ...p, page: p.page + 1 }))} disabled={logsPagination.page === logsPagination.totalPages} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Preview Modal */}
      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="Email Preview" size="lg">
        <div className="border border-gray-100 rounded-lg overflow-hidden">
          <iframe srcDoc={campaign.htmlContent} className="w-full h-[500px] border-0" title="Email Preview" />
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="secondary" size="sm" onClick={() => setShowPreview(false)}>Close</Button>
        </div>
      </Modal>

      {/* Schedule Modal */}
      <Modal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} title="Schedule Campaign">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Choose when you want this campaign to be sent.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Send Date & Time</label>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D7770] focus:border-transparent outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSchedule}>
              <Clock className="w-3.5 h-3.5 mr-1" /> Schedule
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
