import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Phone,
  Search,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  Calendar,
  User,
  Eye,
  BarChart3,
  X
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import PageToolbar from '@/components/ui/PageToolbar'
import FilterModal from '@/components/ui/FilterModal'
import { formatDate, formatDateTime } from '@/utils/formatters'
import { callReportsService } from '@/services/call-reports'

type DateRangeFilter = '7days' | '30days' | '3months' | 'all'

interface CallReport {
  _id: string
  firstTimer: {
    _id: string
    firstName: string
    lastName: string
    phone: string
    email?: string
  }
  status: 'successful' | 'no_answer' | 'busy' | 'not_interested' | 'interested' | 'follow_up_needed' | 'completed'
  contactMethod: 'phone' | 'whatsapp' | 'sms' | 'email' | 'visit' | 'video_call' | 'in_visit'
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
  visitNumber?: number
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

// Helper function to calculate date range from filter
const getDateRangeFromFilter = (filter: DateRangeFilter): { fromDate: string; toDate: string } => {
  const today = new Date()
  const toDate = today.toISOString().split('T')[0]

  let fromDate: string
  switch (filter) {
    case '7days':
      const weekAgo = new Date(today)
      weekAgo.setDate(today.getDate() - 7)
      fromDate = weekAgo.toISOString().split('T')[0]
      break
    case '30days':
      const monthAgo = new Date(today)
      monthAgo.setDate(today.getDate() - 30)
      fromDate = monthAgo.toISOString().split('T')[0]
      break
    case '3months':
      const threeMonthsAgo = new Date(today)
      threeMonthsAgo.setMonth(today.getMonth() - 3)
      fromDate = threeMonthsAgo.toISOString().split('T')[0]
      break
    case 'all':
    default:
      fromDate = ''
      break
  }

  return { fromDate, toDate: filter === 'all' ? '' : toDate }
}

export default function CallReports() {
  const navigate = useNavigate()
  const [reports, setReports] = useState<CallReport[]>([])
  const [analytics, setAnalytics] = useState<CallReportsAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  // Tab and View State
  const [activeTab, setActiveTab] = useState<'reports' | 'analytics'>('reports')
  const [dateRange, setDateRange] = useState<DateRangeFilter>('7days')

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [showFilterModal, setShowFilterModal] = useState(false)

  // Temp filter states for modal
  const [tempStatusFilter, setTempStatusFilter] = useState('')
  const [tempMethodFilter, setTempMethodFilter] = useState('')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)

  // Calculate date range from filter
  const { fromDate: dateFromFilter, toDate: dateToFilter } = getDateRangeFromFilter(dateRange)

  const loadReports = useCallback(async (page: number = currentPage) => {
    try {
      setLoading(true)
      setError(null)

      const { fromDate, toDate } = getDateRangeFromFilter(dateRange)

      const searchParams = {
        page,
        limit: 10,
        ...(searchQuery && { callerName: searchQuery }),
        ...(statusFilter && { status: statusFilter }),
        ...(methodFilter && { contactMethod: methodFilter }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate })
      }

      const response = await callReportsService.searchReports(searchParams)
      setReports(response.reports || [])
      setPagination(response.pagination || {})
      setCurrentPage(page)
    } catch (err: any) {
      console.error('Error loading call reports:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, statusFilter, methodFilter, dateRange])

  const loadAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true)
      const { fromDate, toDate } = getDateRangeFromFilter(dateRange)
      const dateParams = { fromDate, toDate }

      const [globalAnalytics, teamPerformance] = await Promise.all([
        callReportsService.getGlobalAnalytics(dateParams),
        callReportsService.getTeamPerformance(dateParams)
      ])

      setAnalytics({
        ...globalAnalytics,
        teamPerformance: teamPerformance
      })
    } catch (err: any) {
      console.error('Error loading analytics:', err)
    } finally {
      setAnalyticsLoading(false)
    }
  }, [dateRange])

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const { fromDate, toDate } = getDateRangeFromFilter(dateRange)
      const dateParams = { fromDate, toDate }

      const globalAnalytics = await callReportsService.getGlobalAnalytics(dateParams)
      setAnalytics(prev => prev ? { ...prev, ...globalAnalytics } : globalAnalytics as CallReportsAnalytics)
    } catch (err: any) {
      console.error('Error loading stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }, [dateRange])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadReports(1)
  }

  // Filter modal functions
  const openFilterModal = () => {
    setTempStatusFilter(statusFilter)
    setTempMethodFilter(methodFilter)
    setShowFilterModal(true)
  }

  const closeFilterModal = () => {
    setShowFilterModal(false)
  }

  const applyFilters = () => {
    setStatusFilter(tempStatusFilter)
    setMethodFilter(tempMethodFilter)
    setShowFilterModal(false)
  }

  const resetTempFilters = () => {
    setTempStatusFilter('')
    setTempMethodFilter('')
  }

  const clearAppliedFilters = () => {
    setStatusFilter('')
    setMethodFilter('')
  }

  const handleTabChange = (tab: 'reports' | 'analytics') => {
    setActiveTab(tab)
    setSearchQuery('')
    clearAppliedFilters()
  }

  const handleDateRangeChange = (range: DateRangeFilter) => {
    setDateRange(range)
    setCurrentPage(1)
  }

  // Pagination handlers
  const handlePrevPage = () => {
    if (pagination && pagination.hasPrev) {
      loadReports(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (pagination && pagination.hasNext) {
      loadReports(currentPage + 1)
    }
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && pagination && page <= pagination.totalPages) {
      loadReports(page)
    }
  }

  useEffect(() => {
    loadReports(1)
    loadStats()
  }, [dateRange, statusFilter, methodFilter])

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalytics()
    }
  }, [activeTab, dateRange])

  const hasActiveFilters = !!(statusFilter || methodFilter)
  const activeFilterCount = [statusFilter, methodFilter].filter(Boolean).length

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'successful': return 'success'
      case 'interested': return 'success'
      case 'completed': return 'success'
      case 'follow_up_needed': return 'warning'
      case 'busy': return 'warning'
      case 'no_answer': return 'error'
      case 'not_interested': return 'error'
      default: return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'successful': return 'Successful'
      case 'interested': return 'Interested'
      case 'completed': return 'Completed'
      case 'follow_up_needed': return 'Follow-up Needed'
      case 'busy': return 'Busy'
      case 'no_answer': return 'No Answer'
      case 'not_interested': return 'Not Interested'
      default: return status
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'phone': return <Phone className="w-4 h-4" />
      case 'whatsapp': return <Phone className="w-4 h-4" />
      case 'sms': return <Phone className="w-4 h-4" />
      case 'email': return <User className="w-4 h-4" />
      case 'visit': return <User className="w-4 h-4" />
      case 'video_call': return <Phone className="w-4 h-4" />
      case 'in_visit': return <Users className="w-4 h-4" />
      default: return <Phone className="w-4 h-4" />
    }
  }

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      phone: 'Phone',
      whatsapp: 'WhatsApp',
      sms: 'SMS',
      email: 'Email',
      visit: 'Visit',
      video_call: 'Video Call',
      in_visit: 'In-Visit',
    }
    return labels[method] || method
  }

  const getVisitBadge = (visitNumber: number) => {
    const suffix = visitNumber === 2 ? 'nd' : visitNumber === 3 ? 'rd' : 'th'
    return `${visitNumber}${suffix} Visit`
  }

  if (error) {
    return (
      <Layout title="Call Reports">
        <ErrorBoundary error={error} />
      </Layout>
    )
  }

  const statusOptions = [
    { value: 'successful', label: 'Successful' },
    { value: 'interested', label: 'Interested' },
    { value: 'follow_up_needed', label: 'Follow-up Needed' },
    { value: 'no_answer', label: 'No Answer' },
    { value: 'busy', label: 'Busy' },
    { value: 'not_interested', label: 'Not Interested' },
    { value: 'completed', label: 'Completed' },
  ]

  const methodOptions = [
    { value: 'phone', label: 'Phone' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'sms', label: 'SMS' },
    { value: 'email', label: 'Email' },
    { value: 'visit', label: 'Visit' },
    { value: 'video_call', label: 'Video Call' },
    { value: 'in_visit', label: 'In-Visit' },
  ]

  return (
    <Layout title="Call Reports" subtitle="Track follow-up conversations and team performance">
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="relative">
          {statsLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <LoadingSpinner size="md" />
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <p className="text-sm font-medium text-gray-600">Call Success Rate</p>
                  <p className="text-2xl font-bold text-purple-600">{analytics?.conversionRate || 0}%</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Date Range Selector and Tabs */}
        <div className="flex items-center justify-between border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => handleTabChange('reports')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Phone className="h-4 w-4" />
              Reports
              {pagination && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === 'reports' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {pagination.total || 0}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('analytics')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </button>
          </nav>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2 pb-3">
            <span className="text-sm text-gray-500">Showing:</span>
            <select
              value={dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value as DateRangeFilter)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="3months">Last 3 months</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        {/* Page Toolbar with Search and Filters - Only for Reports tab */}
        {activeTab === 'reports' && (
          <PageToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={handleSearch}
            searchPlaceholder="Search by caller name..."
            secondaryActions={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openFilterModal}
                  className={hasActiveFilters ? 'border-primary-500 text-primary-600' : ''}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-500 text-white rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAppliedFilters}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            }
          />
        )}

        {/* Content */}
        {activeTab === 'reports' ? (
          // Reports List View
          loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16">
              <Phone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No call reports found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || hasActiveFilters ? 'Try adjusting your search or filters' : 'Call reports will appear here when created'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">First Timer</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Contact Method</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Called By</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Contact Date</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reports.map((report, index) => (
                      <motion.tr
                        key={report._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                              {report.firstTimer?.firstName?.charAt(0) || '?'}{report.firstTimer?.lastName?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {report.firstTimer?.firstName || 'Unknown'} {report.firstTimer?.lastName || ''}
                              </div>
                              <div className="text-sm text-gray-500">{report.firstTimer?.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={getStatusBadgeColor(report.status)}>
                            {getStatusLabel(report.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {getMethodIcon(report.contactMethod)}
                            <span className="text-sm text-gray-900">
                              {getMethodLabel(report.contactMethod)}
                            </span>
                            {report.contactMethod === 'in_visit' && report.visitNumber && (
                              <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                {getVisitBadge(report.visitNumber)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="h-3 w-3 mr-1" />
                            {report.callMadeBy?.firstName} {report.callMadeBy?.lastName}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDateTime(report.contactDate)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/first-timers/${report.firstTimer?._id}`)}
                              className="p-1"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {pagination && pagination.total > 0 && (
                <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      variant="secondary"
                      onClick={handlePrevPage}
                      disabled={!pagination.hasPrev}
                      className="relative inline-flex items-center px-4 py-2 text-sm font-medium"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleNextPage}
                      disabled={!pagination.hasNext}
                      className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium"
                    >
                      Next
                    </Button>
                  </div>

                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">{((currentPage - 1) * 10) + 1}</span>
                        {' '}to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * 10, pagination.total)}
                        </span>
                        {' '}of{' '}
                        <span className="font-medium">{pagination.total}</span>
                        {' '}results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={handlePrevPage}
                          disabled={!pagination.hasPrev}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>

                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                pageNum === currentPage
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          )
                        })}

                        <button
                          onClick={handleNextPage}
                          disabled={!pagination.hasNext}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          // Analytics View
          analyticsLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Status Distribution</h3>
                  <div className="space-y-3">
                    {Array.isArray(analytics?.statusDistribution) ? analytics.statusDistribution.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{getStatusLabel(item.status)}</span>
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
                          <span className="text-sm text-gray-600 capitalize">{item.method?.replace('_', ' ')}</span>
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
                          Call Success Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Array.isArray(analytics?.teamPerformance) ? analytics.teamPerformance.map((member, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                {member.member?.firstName?.charAt(0)}{member.member?.lastName?.charAt(0)}
                              </div>
                              <div className="ml-3 text-sm font-medium text-gray-900">
                                {member.member?.firstName} {member.member?.lastName}
                              </div>
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
        )}
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={closeFilterModal}
        onApply={applyFilters}
        onReset={resetTempFilters}
        title="Filter Call Reports"
        subtitle="Refine your search results"
        activeFilterCount={activeFilterCount}
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: tempStatusFilter,
            onChange: setTempStatusFilter,
            options: statusOptions,
            placeholder: 'All Statuses',
          },
          {
            id: 'method',
            label: 'Contact Method',
            value: tempMethodFilter,
            onChange: setTempMethodFilter,
            options: methodOptions,
            placeholder: 'All Methods',
          },
        ]}
      />
    </Layout>
  )
}
