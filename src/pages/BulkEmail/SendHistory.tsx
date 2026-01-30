import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Send,
  Search,
  Filter,
  Eye,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Pagination from '@/components/ui/Pagination'
import { bulkEmailService } from '@/services/bulk-email'
import { EmailCampaign, CampaignStatus, CampaignQueryParams } from '@/types/bulk-email'
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
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  // Summary stats
  const [stats, setStats] = useState({
    totalSent: 0,
    totalDelivered: 0,
    totalFailed: 0,
    avgDeliveryRate: 0,
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
        ...prev,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
      }))

      // Calculate summary stats
      const totalSent = response.items.reduce((sum, c) => sum + c.stats.sent, 0)
      const totalDelivered = response.items.reduce((sum, c) => sum + c.stats.delivered, 0)
      const totalFailed = response.items.reduce((sum, c) => sum + c.stats.failed, 0)
      const avgDeliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0

      setStats({
        totalSent,
        totalDelivered,
        totalFailed,
        avgDeliveryRate,
      })
    } catch (error: any) {
      console.error('Error fetching campaigns:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, searchTerm, startDate, endDate])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    setSearchParams({
      ...(searchTerm && { search: searchTerm }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    })
  }

  return (
    <Layout title="Send History">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Send History</h1>
            <p className="text-gray-600">View past email campaigns and their performance</p>
          </div>
          <Link to="/bulk-email/campaigns/new">
            <Button>
              <Send className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </Link>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Emails Sent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSent.toLocaleString()}</p>
              </div>
              <Send className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalDelivered.toLocaleString()}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Delivery Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgDeliveryRate.toFixed(1)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <div>
              <Input
                type="date"
                placeholder="Start date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Input
                type="date"
                placeholder="End date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button type="submit">
              <Filter className="h-4 w-4 mr-2" />
              Apply
            </Button>
          </form>
        </Card>

        {/* Campaigns List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-red-600">{error.message}</p>
            <Button variant="outline" onClick={fetchCampaigns} className="mt-4">
              Retry
            </Button>
          </Card>
        ) : campaigns.length === 0 ? (
          <Card className="p-8 text-center">
            <Send className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No sent campaigns found</p>
            <Link to="/bulk-email/campaigns">
              <Button variant="outline">View All Campaigns</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign, index) => {
              const deliveryRate = campaign.stats.sent > 0
                ? ((campaign.stats.delivered / campaign.stats.sent) * 100).toFixed(1)
                : 0

              return (
                <motion.div
                  key={campaign._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                          {getStatusBadge(campaign.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{campaign.subject}</p>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {campaign.stats.totalRecipients} recipients
                          </div>
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {campaign.stats.delivered} delivered ({deliveryRate}%)
                          </div>
                          {campaign.stats.failed > 0 && (
                            <div className="flex items-center text-red-600">
                              <XCircle className="h-4 w-4 mr-1" />
                              {campaign.stats.failed} failed
                            </div>
                          )}
                          {campaign.sentAt && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              Sent: {formatDate(campaign.sentAt)}
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/bulk-email/campaigns/${campaign._id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </div>

                    {/* Delivery Progress Bar */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Delivery Progress</span>
                        <span>{campaign.stats.delivered} / {campaign.stats.sent}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${deliveryRate}%` }}
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          />
        )}
      </div>
    </Layout>
  )
}
