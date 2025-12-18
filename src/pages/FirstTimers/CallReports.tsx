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
  RefreshCw,
  X
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
  status: 'willing_to_join' | 'committed_to_another_church' | 'unreachable' | 'others'
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
    contactCount: number
    pendingFollowUps: number
    totalAssigned: number
    closedCount: number
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

      // The transformSingleResponse already extracts the data
      setReports(response.reports || [])
      setPagination(response.pagination || {})
      setCurrentPage(page)
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

      // Debug: log the response structure
      console.log('DEBUG: Analytics responses:', {
        globalAnalytics,
        teamPerformance
      })

      // The transformSingleResponse already extracts the data
      setAnalytics({
        ...globalAnalytics,
        teamPerformance: teamPerformance
      })
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.totalReports || 0}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Contacted Today</p>
              <p className="text-2xl font-bold text-green-600">{analytics?.contactedToday || 0}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Phone className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Follow-ups</p>
              <p className="text-2xl font-bold text-orange-600">{analytics?.pendingFollowUps || 0}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-purple-600">{analytics?.conversionRate || 0}%</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Status Distribution</h3>
          <div className="space-y-3">
            {Array.isArray(analytics?.statusDistribution) ? analytics.statusDistribution.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 capitalize">{item.status}</span>
                <Badge variant={getStatusBadgeColor(item.status)}>{item.count}</Badge>
              </div>
            )) : (
              <p className="text-sm text-gray-500">No status data available</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Methods</h3>
          <div className="space-y-3">
            {Array.isArray(analytics?.methodDistribution) ? analytics.methodDistribution.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {getMethodIcon(item.method)}
                  <span className="text-sm text-gray-600 capitalize">{item.method}</span>
                </div>
                <Badge variant="info">{item.count}</Badge>
              </div>
            )) : (
              <p className="text-sm text-gray-500">No method data available</p>
            )}
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
                  Contacts Made
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending Follow Ups
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversion Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(analytics?.teamPerformance) ? analytics.teamPerformance.map((member, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {member.member.firstName} {member.member.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{member.contactCount || member.reportCount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{member.pendingFollowUps || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={member.conversionRate > 50 ? 'success' : 'warning'}>
                      {member.conversionRate}%
                    </Badge>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No team performance data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )

  const renderListView = () => (
    <div className="space-y-6">
      {/* Advanced Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Advanced Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Method</label>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">All Methods</option>
                <option value="phone">Phone</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="in_person">In Person</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <Input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <Input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={handleReset} className="w-full">
                Reset Filters
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {!showFilters && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(true)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Show Advanced Filters
          </Button>
        </div>
      )}

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
                  Notes
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
      <Layout title="Call Reports">
        <ErrorBoundary error={error} />
      </Layout>
    )
  }

  // Search Section to be displayed in header
  const searchSection = (
    <div className="flex gap-3 flex-wrap items-center w-full">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by first timer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          />
        </div>
      </div>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
      >
        <option value="">All Statuses</option>
        <option value="willing_to_join">Willing to Join</option>
        <option value="committed_to_another_church">Committed to Another Church</option>
        <option value="unreachable">Unreachable</option>
        <option value="others">Others</option>
      </select>

      <button
        type="button"
        onClick={handleSearch}
        className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
      >
        Search
      </button>

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
    </div>
  )

  return (
    <Layout
      title="Call Reports"
      searchSection={searchSection}
    >
      <div className="space-y-6">

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
