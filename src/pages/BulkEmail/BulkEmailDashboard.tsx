import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Mail,
  FileText,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  TrendingUp,
  Users,
  BarChart3
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { bulkEmailService } from '@/services/bulk-email'
import {
  BulkEmailStatistics,
  EmailCampaign,
  CampaignStatus,
  EmailTemplateCategory
} from '@/types/bulk-email'
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

export default function BulkEmailDashboard() {
  const [statistics, setStatistics] = useState<BulkEmailStatistics | null>(null)
  const [recentCampaigns, setRecentCampaigns] = useState<EmailCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [stats, campaignsResponse] = await Promise.all([
        bulkEmailService.getStatistics(),
        bulkEmailService.getCampaigns({ limit: 5 })
      ])
      setStatistics(stats)
      setRecentCampaigns(campaignsResponse.items)
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout title="Bulk Email">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Bulk Email">
        <Card className="p-8 text-center">
          <p className="text-red-600">{error.message}</p>
          <Button variant="outline" onClick={fetchDashboardData} className="mt-4">
            Retry
          </Button>
        </Card>
      </Layout>
    )
  }

  return (
    <Layout title="Bulk Email">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bulk Email</h1>
            <p className="text-gray-600">Manage email templates and campaigns</p>
          </div>
          <div className="flex gap-2">
            <Link to="/bulk-email/templates/new">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </Link>
            <Link to="/bulk-email/campaigns/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Templates</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {statistics?.templates.total || 0}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {statistics?.templates.active || 0} active
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Campaigns</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {statistics?.campaigns.total || 0}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {statistics?.campaigns.thisMonth || 0} this month
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Send className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Emails Sent</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {statistics?.emails.totalSent.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {statistics?.emails.delivered.toLocaleString() || 0} delivered
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Delivery Rate</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {statistics?.emails.deliveryRate.toFixed(1) || 0}%
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    {statistics?.emails.failed || 0} failed
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions & Recent Campaigns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/bulk-email/templates" className="block">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Manage Templates</p>
                    <p className="text-sm text-gray-600">Create and edit email templates</p>
                  </div>
                </div>
              </Link>
              <Link to="/bulk-email/campaigns" className="block">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Send className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">View Campaigns</p>
                    <p className="text-sm text-gray-600">Manage email campaigns</p>
                  </div>
                </div>
              </Link>
              <Link to="/bulk-email/history" className="block">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Send History</p>
                    <p className="text-sm text-gray-600">View campaign analytics</p>
                  </div>
                </div>
              </Link>
            </div>
          </Card>

          {/* Recent Campaigns */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Recent Campaigns</h3>
                <Link to="/bulk-email/campaigns">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>

              {recentCampaigns.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No campaigns yet</p>
                  <Link to="/bulk-email/campaigns/new">
                    <Button variant="outline" className="mt-4">Create First Campaign</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentCampaigns.map((campaign, index) => (
                    <motion.div
                      key={campaign._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link to={`/bulk-email/campaigns/${campaign._id}`}>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <Send className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{campaign.name}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Users className="h-3 w-3" />
                                <span>{campaign.stats.totalRecipients} recipients</span>
                                <span>•</span>
                                <span>{formatDate(campaign.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(campaign.status)}
                            {campaign.status === CampaignStatus.SENT && (
                              <span className="text-xs text-gray-500">
                                {campaign.stats.delivered}/{campaign.stats.sent}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Template Categories */}
        {statistics && (
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Templates by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.values(EmailTemplateCategory).map((category) => (
                <div
                  key={category}
                  className="text-center p-4 bg-gray-50 rounded-lg"
                >
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.templates.byCategory[category] || 0}
                  </p>
                  <p className="text-sm text-gray-600 capitalize">
                    {category.toLowerCase().replace('_', ' ')}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}
