import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Send,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Clock,
  Users,
  Play,
  XCircle
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

export default function Campaigns() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true)
      const params: CampaignQueryParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: selectedStatus as CampaignStatus || undefined,
      }

      const response = await bulkEmailService.getCampaigns(params)
      setCampaigns(response.items)
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
      }))
    } catch (error: any) {
      console.error('Error fetching campaigns:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, searchTerm, selectedStatus])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    setSearchParams({
      ...(searchTerm && { search: searchTerm }),
      ...(selectedStatus && { status: selectedStatus }),
    })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return

    try {
      await bulkEmailService.deleteCampaign(id)
      showToast('success', 'Campaign deleted successfully')
      fetchCampaigns()
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete campaign')
    }
  }

  const handleSend = async (id: string) => {
    if (!window.confirm('Send this campaign now?')) return

    try {
      await bulkEmailService.sendCampaign(id)
      showToast('success', 'Campaign is being sent')
      fetchCampaigns()
    } catch (error: any) {
      showToast('error', error.message || 'Failed to send campaign')
    }
  }

  const handleCancel = async (id: string) => {
    if (!window.confirm('Cancel this scheduled campaign?')) return

    try {
      await bulkEmailService.cancelCampaign(id)
      showToast('success', 'Campaign cancelled')
      fetchCampaigns()
    } catch (error: any) {
      showToast('error', error.message || 'Failed to cancel campaign')
    }
  }

  return (
    <Layout title="Email Campaigns">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Campaigns</h1>
            <p className="text-gray-600">Manage and send email campaigns</p>
          </div>
          <Link to="/bulk-email/campaigns/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </Link>
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
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Status</option>
              {Object.values(CampaignStatus).map((status) => (
                <option key={status} value={status}>
                  {status.toLowerCase().replace('_', ' ')}
                </option>
              ))}
            </select>
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
            <p className="text-gray-500 mb-4">No campaigns found</p>
            <Link to="/bulk-email/campaigns/new">
              <Button>Create First Campaign</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign, index) => (
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
                        {campaign.status === CampaignStatus.SCHEDULED && campaign.scheduledAt && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Scheduled: {formatDate(campaign.scheduledAt)}
                          </div>
                        )}
                        {campaign.status === CampaignStatus.SENT && campaign.sentAt && (
                          <div className="flex items-center text-green-600">
                            <Send className="h-4 w-4 mr-1" />
                            Sent: {formatDate(campaign.sentAt)}
                          </div>
                        )}
                        {campaign.status === CampaignStatus.SENT && (
                          <div className="text-gray-600">
                            {campaign.stats.delivered}/{campaign.stats.sent} delivered
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/bulk-email/campaigns/${campaign._id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {campaign.status === CampaignStatus.DRAFT && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/bulk-email/campaigns/${campaign._id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSend(campaign._id)}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Send
                          </Button>
                        </>
                      )}

                      {campaign.status === CampaignStatus.SCHEDULED && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(campaign._id)}
                          className="text-orange-600 hover:bg-orange-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      )}

                      {(campaign.status === CampaignStatus.DRAFT ||
                        campaign.status === CampaignStatus.CANCELLED) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(campaign._id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
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
