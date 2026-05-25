import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Send, Search, Eye, Users, CheckCircle, XCircle, Clock, TrendingUp,
  Mail, ChevronLeft, ChevronRight, Sparkles, Plus, BarChart3,
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { bulkEmailService } from '@/services/bulk-email'
import { EmailCampaign, CampaignStatus, CampaignQueryParams } from '@/types/bulk-email'
import { formatDate } from '@/utils/formatters'

export default function SendHistory() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '')
  const [pagination, setPagination] = useState({
    page: 1, limit: 20, total: 0, totalPages: 0,
  })
  const [stats, setStats] = useState({
    totalSent: 0, totalDelivered: 0, totalFailed: 0, avgDeliveryRate: 0,
  })

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true)
      const params: CampaignQueryParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: CampaignStatus.SENT,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }
      const response = await bulkEmailService.getCampaigns(params)
      setCampaigns(response.items)
      setPagination((prev) => ({
        ...prev, total: response.pagination.total, totalPages: response.pagination.totalPages,
      }))
      const totalSent = response.items.reduce((sum, c) => sum + c.stats.sent, 0)
      const totalDelivered = response.items.reduce((sum, c) => sum + c.stats.delivered, 0)
      const totalFailed = response.items.reduce((sum, c) => sum + c.stats.failed, 0)
      setStats({
        totalSent, totalDelivered, totalFailed,
        avgDeliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
      })
    } catch (error: any) {
      setError(error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, searchTerm, startDate, endDate])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setPagination((prev) => ({ ...prev, page: 1 }))
      setSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      })
    }
  }

  return (
    <Layout title="Send History">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Send History</h1>
            <p className="text-sm text-gray-500 mt-0.5">View past email campaigns and their performance</p>
          </div>
          <Button onClick={() => navigate('/bulk-email/campaigns/new')} className="shrink-0">
            <Plus className="h-4 w-4 mr-1.5" /> New Campaign
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Campaigns', value: pagination.total, icon: BarChart3, color: 'text-blue-600 bg-blue-50' },
            { label: 'Emails Sent', value: stats.totalSent.toLocaleString(), icon: Send, color: 'text-purple-600 bg-purple-50' },
            { label: 'Delivered', value: stats.totalDelivered.toLocaleString(), icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Avg Delivery Rate', value: `${stats.avgDeliveryRate.toFixed(1)}%`, icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl border border-gray-100 p-4"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0D7770]/20 focus:border-[#0D7770] outline-none bg-white"
            />
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-[#0D7770]/20 focus:border-[#0D7770] outline-none"
            placeholder="Start"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-[#0D7770]/20 focus:border-[#0D7770] outline-none"
            placeholder="End"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : error ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-sm text-red-600 mb-3">{error.message}</p>
            <Button size="sm" variant="secondary" onClick={fetchCampaigns}>Retry</Button>
          </motion.div>
        ) : campaigns.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No sent campaigns found</h3>
            <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
              {searchTerm || startDate || endDate ? 'Try adjusting your filters' : 'Sent campaigns will appear here'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {campaigns.map((campaign, index) => {
              const deliveryRate = campaign.stats.sent > 0
                ? Math.round((campaign.stats.delivered / campaign.stats.sent) * 100)
                : 0

              return (
                <motion.div
                  key={campaign._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => navigate(`/bulk-email/campaigns/${campaign._id}`)}
                >
                  <div className="flex items-center gap-4 px-4 py-3">
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>

                    {/* Main */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{campaign.name}</h3>
                      <p className="text-xs text-gray-500 truncate max-w-[300px]">{campaign.subject}</p>
                    </div>

                    {/* Meta */}
                    <div className="hidden md:flex items-center gap-4 shrink-0">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Users className="w-3.5 h-3.5" />
                        {campaign.stats.totalRecipients}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${deliveryRate}%` }} />
                        </div>
                        <span className="text-emerald-600 font-medium">{deliveryRate}%</span>
                      </div>
                      {campaign.stats.failed > 0 && (
                        <div className="flex items-center gap-1 text-xs text-red-500">
                          <XCircle className="w-3.5 h-3.5" />
                          {campaign.stats.failed}
                        </div>
                      )}
                      {campaign.sentAt && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(campaign.sentAt)}
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Sent
                    </span>
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
    </Layout>
  )
}
