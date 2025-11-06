import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Phone,
  Search,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Calendar,
  User,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  Download,
  RefreshCw
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { showToast } from '@/utils/toast'
import { formatDate, formatDateTime } from '@/utils/formatters'
import { callReportsService } from '@/services/call-reports'

interface CallReport {
  _id: string
  firstTimer: {
    _id: string
    firstName: string
    lastName: string
    phone: string
    email?: string
  }
  status: 'pending' | 'contacted' | 'scheduled' | 'not_interested' | 'converted'
  contactMethod: 'phone' | 'whatsapp' | 'sms' | 'email' | 'in_person'
  callMadeBy: {
    _id: string
    firstName: string
    lastName: string
  }
  contactDate: string
  notes?: string
  outcome?: string
  nextAction?: string
  nextActionDate?: string
  createdAt: string
  updatedAt: string
}

interface CallReportsAnalytics {
  totalReports: number
  contactedToday: number
  pendingFollowUps: number
  conversionRate: number
  statusDistribution: Array<{ status: string; count: number }>
  methodDistribution: Array<{ method: string; count: number }>
  teamPerformance: Array<{
    member: { firstName: string; lastName: string }
    reportCount: number
    conversionRate: number
  }>
}

export default function CallReports() {
  const [reports, setReports] = useState<CallReport[]>([])
  const [analytics, setAnalytics] = useState<CallReportsAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [memberFilter, setMemberFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)

  // UI State
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list')

  const loadReports = useCallback(async (page: number = currentPage) => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = {
        page,
        limit: 20,
        ...(searchQuery && { firstTimerName: searchQuery }),
        ...(statusFilter && { status: statusFilter }),
        ...(methodFilter && { contactMethod: methodFilter }),
        ...(memberFilter && { callMadeBy: memberFilter }),
        ...(dateFromFilter && { fromDate: dateFromFilter }),
        ...(dateToFilter && { toDate: dateToFilter })
      }

      const response = await callReportsService.searchReports(searchParams)

      if (response.success) {
        setReports(response.data.data || [])
        setPagination(response.data)
        setCurrentPage(page)
      } else {
        throw new Error(response.message || 'Failed to load call reports')
      }
    } catch (err: any) {
      console.error('Error loading call reports:', err)
      setError(err)
      showToast('Failed to load call reports', 'error')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, statusFilter, methodFilter, memberFilter, dateFromFilter, dateToFilter])

  const loadAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true)
      const [globalAnalytics, teamPerformance] = await Promise.all([
        callReportsService.getGlobalAnalytics(),
        callReportsService.getTeamPerformance()
      ])

      if (globalAnalytics.success && teamPerformance.success) {
        setAnalytics({
          ...globalAnalytics.data,
          teamPerformance: teamPerformance.data
        })
      }
    } catch (err: any) {
      console.error('Error loading analytics:', err)
      showToast('Failed to load analytics', 'error')
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  const handleSearch = () => {
    setCurrentPage(1)
    loadReports(1)
  }

  const handleReset = () => {
    setSearchQuery('')
    setStatusFilter('')
    setMethodFilter('')
    setMemberFilter('')
    setDateFromFilter('')
    setDateToFilter('')
    setCurrentPage(1)
    loadReports(1)
  }

  useEffect(() => {
    loadReports()
    if (viewMode === 'analytics') {
      loadAnalytics()
    }
  }, [loadReports, viewMode])

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'contacted': return 'success'
      case 'scheduled': return 'info'
      case 'converted': return 'success'
      case 'not_interested': return 'warning'
      case 'pending': return 'secondary'
      default: return 'secondary'
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'phone': return <Phone className="w-4 h-4" />
      case 'whatsapp': return <Phone className="w-4 h-4" />
      case 'email': return <User className="w-4 h-4" />
      default: return <Phone className="w-4 h-4" />
    }
  }

  const renderAnalyticsView = () => (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.totalReports || 0}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Contacted Today</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.contactedToday || 0}</p>
            </div>
            <Phone className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Follow-ups</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.pendingFollowUps || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.conversionRate || 0}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Status Distribution</h3>
          <div className="space-y-3">
            {analytics?.statusDistribution?.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 capitalize">{item.status}</span>
                <Badge variant={getStatusBadgeColor(item.status)}>{item.count}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Methods</h3>
          <div className="space-y-3">
            {analytics?.methodDistribution?.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {getMethodIcon(item.method)}
                  <span className="text-sm text-gray-600 capitalize">{item.method}</span>
                </div>
                <Badge variant="info">{item.count}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Team Performance */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Team Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reports Made
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversion Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics?.teamPerformance?.map((member, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {member.member.firstName} {member.member.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{member.reportCount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={member.conversionRate > 50 ? 'success' : 'warning'}>
                      {member.conversionRate}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )

  const renderListView = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by first timer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="w-4 h-4" />
              Search
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t"
            >
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="scheduled">Scheduled</option>
                <option value="not_interested">Not Interested</option>
                <option value="converted">Converted</option>
              </select>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Methods</option>
                <option value="phone">Phone</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="in_person">In Person</option>
              </select>
              <Input
                type="date"
                placeholder="From Date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
              />
              <Input
                type="date"
                placeholder="To Date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
              />
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </motion.div>
          )}
        </div>
      </Card>

      {/* Reports List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  First Timer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Called By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <LoadingSpinner size="lg" />
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No call reports found
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {report.firstTimer.firstName} {report.firstTimer.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{report.firstTimer.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusBadgeColor(report.status)}>
                        {report.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getMethodIcon(report.contactMethod)}
                        <span className="text-sm text-gray-900 capitalize">
                          {report.contactMethod}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {report.callMadeBy.firstName} {report.callMadeBy.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDateTime(report.contactDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedReportId(report._id)
                            setShowReportModal(true)
                          }}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * pagination.limit) + 1} to{' '}
                {Math.min(currentPage * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!pagination.hasPrev}
                  onClick={() => loadReports(currentPage - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!pagination.hasNext}
                  onClick={() => loadReports(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )

  if (error) {
    return (
      <Layout>
        <ErrorBoundary error={error} />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Call Reports</h1>
            <p className="text-gray-600">Track and analyze first timer contact reports</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                onClick={() => setViewMode('list')}
              >
                Reports
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'analytics' ? 'primary' : 'ghost'}
                onClick={() => setViewMode('analytics')}
              >
                Analytics
              </Button>
            </div>
            <Button
              onClick={() => viewMode === 'list' ? loadReports() : loadAnalytics()}
              disabled={loading || analyticsLoading}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Content */}
        {analyticsLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : viewMode === 'analytics' ? (
          renderAnalyticsView()
        ) : (
          renderListView()
        )}
      </div>
    </Layout>
  )
}