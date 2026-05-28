import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Plus, Search, Eye, Edit, Trash2, Clock, Users, Play, XCircle,
  MoreHorizontal, CheckCircle, AlertCircle, Loader, Mail, ChevronLeft, ChevronRight, Sparkles, ArrowLeft
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import { bulkEmailService } from '@/services/bulk-email'
import { EmailCampaign, CampaignStatus } from '@/types/bulk-email'
import { showToast } from '@/utils/toast'
import { formatDate } from '@/utils/formatters'

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; icon: any; label: string }> = {
  draft: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400', icon: Edit, label: 'Draft' },
  scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', icon: Clock, label: 'Scheduled' },
  sending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', icon: Loader, label: 'Sending' },
  sent: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle, label: 'Sent' },
  failed: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', icon: AlertCircle, label: 'Failed' },
  cancelled: { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400', icon: XCircle, label: 'Cancelled' },
}

export default function Campaigns() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<{ type: string; campaign: EmailCampaign } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadCampaigns = useCallback(async (page = currentPage) => {
    try {
      setLoading(true)
      const params: any = { page, limit: 15, sortBy: 'createdAt', sortOrder: 'desc' }
      if (statusFilter) params.status = statusFilter
      if (searchTerm) params.search = searchTerm
      const res = await bulkEmailService.getCampaigns(params)
      setCampaigns(res.items || [])
      setTotalPages(res.pagination?.totalPages || 1)
      setCurrentPage(page)
    } catch (err) {
      showToast('error', 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }, [currentPage, statusFilter, searchTerm])

  useEffect(() => { setCurrentPage(1); loadCampaigns(1) }, [statusFilter])

  const handleAction = async () => {
    if (!confirmModal) return
    try {
      setActionLoading(true)
      const { type, campaign } = confirmModal
      if (type === 'send') await bulkEmailService.sendCampaign(campaign._id)
      else if (type === 'cancel') await bulkEmailService.cancelCampaign(campaign._id)
      else if (type === 'delete') await bulkEmailService.deleteCampaign(campaign._id)
      showToast('success', `Campaign ${type === 'delete' ? 'deleted' : type === 'send' ? 'sent' : 'cancelled'}`)
      setConfirmModal(null)
      loadCampaigns(currentPage)
    } catch (err: any) {
      showToast('error', err?.message || `Failed to ${confirmModal.type} campaign`)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <Layout title="Email Campaigns" subtitle="Create and manage email campaigns" actions={
      <Button onClick={() => navigate('/bulk-email/campaigns/new')} className="shrink-0">
        <Plus className="h-4 w-4 mr-1.5" /> New Campaign
      </Button>
    }>
      <div className="space-y-5">
        <button onClick={() => navigate('/bulk-email')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors -mt-1">
          <ArrowLeft className="w-4 h-4" />
          Back to Messaging
        </button>

        {/* Search + Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && loadCampaigns(1)}
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
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : campaigns.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No campaigns yet</h3>
            <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
              {searchTerm || statusFilter ? 'Try adjusting your filters' : 'Create your first email campaign'}
            </p>
            {!searchTerm && !statusFilter && (
              <Button size="sm" onClick={() => navigate('/bulk-email/campaigns/new')}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Create Campaign
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-2">
            {campaigns.map((campaign, index) => {
              const status = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft
              const stats = campaign.stats || { totalRecipients: 0, sent: 0, delivered: 0, failed: 0 }
              const deliveryRate = stats.sent > 0 ? Math.round((stats.delivered / stats.sent) * 100) : 0

              return (
                <motion.div
                  key={campaign._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-4 px-4 py-3">
                    {/* Status icon */}
                    <div className={`w-9 h-9 rounded-lg ${status.bg} flex items-center justify-center shrink-0`}>
                      <status.icon className={`w-4 h-4 ${status.text}`} />
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/bulk-email/campaigns/${campaign._id}`)}>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{campaign.name}</h3>
                      </div>
                      <p className="text-xs text-gray-500 truncate max-w-[300px]">{campaign.subject}</p>
                    </div>

                    {/* Meta */}
                    <div className="hidden md:flex items-center gap-4 shrink-0">
                      {campaign.status === 'sent' && (
                        <>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Users className="w-3.5 h-3.5" />
                            {stats.totalRecipients}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${deliveryRate}%` }} />
                            </div>
                            <span className="text-emerald-600 font-medium">{deliveryRate}%</span>
                          </div>
                        </>
                      )}
                      {campaign.scheduledAt && campaign.status === 'scheduled' && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-600">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(campaign.scheduledAt)}
                        </div>
                      )}
                      {campaign.sentAt && campaign.status === 'sent' && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {formatDate(campaign.sentAt)}
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
                        onClick={() => setOpenMenuId(openMenuId === campaign._id ? null : campaign._id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      <AnimatePresence>
                        {openMenuId === campaign._id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20"
                          >
                            <button onClick={() => { navigate(`/bulk-email/campaigns/${campaign._id}`); setOpenMenuId(null) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                            {campaign.status === 'draft' && (
                              <>
                                <button onClick={() => { navigate(`/bulk-email/campaigns/${campaign._id}/edit`); setOpenMenuId(null) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                  <Edit className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button onClick={() => { setConfirmModal({ type: 'send', campaign }); setOpenMenuId(null) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50">
                                  <Send className="w-3.5 h-3.5" /> Send Now
                                </button>
                              </>
                            )}
                            {campaign.status === 'scheduled' && (
                              <button onClick={() => { setConfirmModal({ type: 'cancel', campaign }); setOpenMenuId(null) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-amber-700 hover:bg-amber-50">
                                <XCircle className="w-3.5 h-3.5" /> Cancel
                              </button>
                            )}
                            {(campaign.status === 'draft' || campaign.status === 'cancelled') && (
                              <>
                                <div className="h-px bg-gray-100 my-1"></div>
                                <button onClick={() => { setConfirmModal({ type: 'delete', campaign }); setOpenMenuId(null) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-500">Page {currentPage} of {totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => loadCampaigns(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => loadCampaigns(p)} className={`w-8 h-8 rounded-lg text-xs font-medium ${p === currentPage ? 'bg-[#0D7770] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => loadCampaigns(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {openMenuId && <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />}

      {/* Confirm Modal */}
      <Modal isOpen={!!confirmModal} onClose={() => setConfirmModal(null)} title={confirmModal ? `${confirmModal.type.charAt(0).toUpperCase() + confirmModal.type.slice(1)} Campaign` : ''}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {confirmModal?.type === 'send' && 'This will send the email to all matching recipients immediately.'}
            {confirmModal?.type === 'cancel' && 'This will cancel the scheduled campaign.'}
            {confirmModal?.type === 'delete' && 'This cannot be undone.'}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setConfirmModal(null)} disabled={actionLoading}>Cancel</Button>
            <Button variant={confirmModal?.type === 'delete' ? 'danger' : 'primary'} size="sm" onClick={handleAction} disabled={actionLoading}>
              {actionLoading ? 'Processing...' : confirmModal?.type === 'send' ? 'Send Now' : confirmModal?.type === 'cancel' ? 'Cancel Campaign' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
