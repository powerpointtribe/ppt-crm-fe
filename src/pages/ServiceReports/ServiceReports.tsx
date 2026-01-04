import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  FileText,
  Users,
  Calendar,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  TrendingUp,
  UserCheck,
  BarChart3,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  User,
  Tag,
  StickyNote
} from 'lucide-react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { SkeletonTable } from '@/components/ui/Skeleton'
import FilterModal from '@/components/ui/FilterModal'
import ServiceReportForm from './ServiceReportForm'
import {
  serviceReportsService,
  ServiceReport,
  ServiceReportSearchParams,
  ServiceTag,
  SERVICE_TAG_LABELS,
  CreateServiceReportData
} from '@/services/service-reports'
import { formatDate, formatDateTime } from '@/utils/formatters'
import { useAppStore } from '@/store'
import { useAuth } from '@/contexts/AuthContext-unified'
import { cn } from '@/utils/cn'

export default function ServiceReports() {
  const navigate = useNavigate()
  const { selectedBranch, branches } = useAppStore()
  const { hasPermission } = useAuth()
  const [reports, setReports] = useState<ServiceReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchParams, setSearchParams] = useState<ServiceReportSearchParams>({
    page: 1,
    limit: 15,
    search: '',
    sortBy: 'date',
    sortOrder: 'desc'
  })
  const [pagination, setPagination] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false)
  const [quickCreateLoading, setQuickCreateLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<ServiceReport | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showChart, setShowChart] = useState(false)

  // Filter states
  const [serviceTagFilter, setServiceTagFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')

  // Temp filter states for modal
  const [tempServiceTagFilter, setTempServiceTagFilter] = useState('')
  const [tempDateFrom, setTempDateFrom] = useState('')
  const [tempDateTo, setTempDateTo] = useState('')
  const [tempBranchFilter, setTempBranchFilter] = useState('')

  // Show branch filter only if user has permission to view all branches
  const canViewAllBranches = hasPermission('branches:view-all')
  const showBranchFilter = canViewAllBranches && branches.length > 0

  // Permission checks for actions
  const canCreateReport = hasPermission('service-reports:create')
  const canUpdateReport = hasPermission('service-reports:update')
  const canDeleteReport = hasPermission('service-reports:delete')

  const memoizedSearchParams = useMemo(() => {
    const effectiveBranchId = selectedBranch?._id || branchFilter || undefined
    return {
      ...searchParams,
      serviceTag: serviceTagFilter || undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
      branchId: effectiveBranchId,
    }
  }, [
    searchParams.page,
    searchParams.limit,
    searchParams.search,
    searchParams.sortBy,
    searchParams.sortOrder,
    serviceTagFilter,
    dateFromFilter,
    dateToFilter,
    branchFilter,
    selectedBranch,
    searchParams.reportedBy,
    searchParams.serviceName,
    searchParams.minAttendance,
    searchParams.maxAttendance,
    searchParams.minFirstTimers
  ])

  const loadReports = useCallback(async () => {
    try {
      setLoading(true)
      const result = await serviceReportsService.getServiceReports(memoizedSearchParams)
      setReports(result.items)
      setPagination(result.pagination)
    } catch (err: any) {
      setError(err.message || 'Failed to load service reports')
    } finally {
      setLoading(false)
    }
  }, [memoizedSearchParams])

  const loadStats = useCallback(async () => {
    try {
      const statsData = await serviceReportsService.getServiceReportStats()
      setStats(statsData)
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }, [])

  const loadChartData = useCallback(async () => {
    try {
      const data = await serviceReportsService.getAttendanceChartData(10)
      setChartData(data)
    } catch (err) {
      console.error('Failed to load chart data:', err)
    }
  }, [])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  useEffect(() => {
    loadStats()
    loadChartData()
  }, [loadStats, loadChartData])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams(prev => ({
      ...prev,
      search: searchTerm,
      page: 1
    }))
  }

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }))
  }

  // Filter modal functions
  const openFilterModal = () => {
    setTempServiceTagFilter(serviceTagFilter)
    setTempDateFrom(dateFromFilter)
    setTempDateTo(dateToFilter)
    setTempBranchFilter(branchFilter)
    setShowFilterModal(true)
  }

  const closeFilterModal = () => {
    setShowFilterModal(false)
  }

  const applyFilters = () => {
    setServiceTagFilter(tempServiceTagFilter)
    setDateFromFilter(tempDateFrom)
    setDateToFilter(tempDateTo)
    setBranchFilter(tempBranchFilter)
    setSearchParams(prev => ({ ...prev, page: 1 }))
    setShowFilterModal(false)
  }

  const resetTempFilters = () => {
    setTempServiceTagFilter('')
    setTempDateFrom('')
    setTempDateTo('')
    setTempBranchFilter('')
  }

  const clearAppliedFilters = () => {
    setServiceTagFilter('')
    setDateFromFilter('')
    setDateToFilter('')
    setBranchFilter('')
  }

  const hasActiveFilters = !!(serviceTagFilter || dateFromFilter || dateToFilter || branchFilter)
  const activeFilterCount = [serviceTagFilter, dateFromFilter, dateToFilter, branchFilter].filter(Boolean).length

  // Quick create handlers
  const handleQuickCreate = async (data: CreateServiceReportData) => {
    try {
      setQuickCreateLoading(true)
      await serviceReportsService.createServiceReport(data)
      setShowQuickCreateModal(false)
      loadReports()
      loadStats()
    } catch (error: any) {
      alert('Failed to create service report: ' + error.message)
    } finally {
      setQuickCreateLoading(false)
    }
  }

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!confirm('Are you sure you want to delete this service report?')) {
      return
    }

    try {
      await serviceReportsService.deleteServiceReport(id)
      setShowDetailModal(false)
      setSelectedReport(null)
      loadReports()
      loadStats()
    } catch (err: any) {
      alert('Failed to delete service report: ' + err.message)
    }
  }

  const generatePdf = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      await serviceReportsService.generatePdfReport(id)
    } catch (err: any) {
      alert('Failed to generate PDF: ' + err.message)
    }
  }

  const openDetailModal = (report: ServiceReport) => {
    setSelectedReport(report)
    setShowDetailModal(true)
  }

  // Search Section
  const searchSection = (
    <form onSubmit={handleSearch} className="flex gap-2 flex-wrap items-center w-full">
      <div className="flex-1 min-w-[180px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
          />
        </div>
      </div>

      <button
        type="submit"
        className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
      >
        Search
      </button>

      <Button
        variant="secondary"
        size="sm"
        onClick={openFilterModal}
        className={cn("text-sm", hasActiveFilters && 'border-indigo-500 text-indigo-600')}
      >
        <Filter className="w-3.5 h-3.5 mr-1.5" />
        {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
      </Button>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAppliedFilters}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <X className="w-3.5 h-3.5" />
          Clear
        </button>
      )}

      {canCreateReport && (
        <div className="flex items-center gap-2 ml-auto">
          <Button size="sm" onClick={() => setShowQuickCreateModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            New Report
          </Button>
        </div>
      )}
    </form>
  )

  return (
    <Layout
      title="Service Reports"
      subtitle="Track attendance trends and service insights"
      searchSection={searchSection}
    >
      <div className="p-4 max-w-7xl mx-auto">

        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6"
          >
            <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-xs sm:text-sm font-medium text-gray-500">Total Reports</span>
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-gray-900">{stats?.overall?.totalReports || 0}</p>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-xs sm:text-sm font-medium text-gray-500">Peak Attendance</span>
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-gray-900">{(stats?.overall?.highestAttendance || 0).toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-xs sm:text-sm font-medium text-gray-500">Avg Attendance</span>
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-gray-900">{Math.round(stats?.overall?.averageAttendance || 0)}</p>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-xs sm:text-sm font-medium text-gray-500">First Timers</span>
                <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-gray-900">{stats?.overall?.totalFirstTimers || 0}</p>
            </div>
          </motion.div>
        )}

        {/* Chart Toggle */}
        {chartData.length > 0 && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowChart(!showChart)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                showChart
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              )}
            >
              <BarChart3 className="w-4 h-4" />
              {showChart ? 'Hide Chart' : 'Show Chart'}
            </button>
          </div>
        )}

        {/* Collapsible Chart */}
        <AnimatePresence>
          {showChart && chartData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-4 overflow-hidden"
            >
              <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
                <div className="h-48 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9}/>
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.7}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="formattedDate"
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        angle={-45}
                        textAnchor="end"
                        height={50}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        width={35}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="attendance" fill="url(#barGradient)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modern Compact Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <SkeletonTable rows={10} />
            ) : error ? (
              <div className="p-8 text-center">
                <div className="text-red-600 mb-2 text-sm">Error loading reports</div>
                <div className="text-gray-500 text-sm mb-4">{error}</div>
                <Button size="sm" onClick={loadReports}>Try Again</Button>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="md:hidden p-3 space-y-3">
                  {reports.map((report, index) => (
                    <motion.div
                      key={report._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-white border border-gray-100 rounded-xl p-4 space-y-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1),0_1px_3px_-1px_rgba(0,0,0,0.06)]"
                      onClick={() => openDetailModal(report)}
                    >
                      {/* Header: Service Name and Date */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 truncate max-w-[180px]">
                              {report.serviceName}
                            </h3>
                            <p className="text-sm text-gray-500">{formatDate(report.date)}</p>
                          </div>
                        </div>
                        {report.serviceTags && report.serviceTags.length > 0 && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                            {report.serviceTags.length} tag{report.serviceTags.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Attendance Stats */}
                      <div className="grid grid-cols-4 gap-2 text-center py-2 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-lg font-bold text-gray-900">{report.totalAttendance}</p>
                          <p className="text-xs text-gray-500">Total</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700">{report.numberOfMales}</p>
                          <p className="text-xs text-gray-500">Male</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700">{report.numberOfFemales}</p>
                          <p className="text-xs text-gray-500">Female</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700">{report.numberOfChildren}</p>
                          <p className="text-xs text-gray-500">Children</p>
                        </div>
                      </div>

                      {/* First Timers Highlight */}
                      {report.numberOfFirstTimers > 0 && (
                        <div className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-indigo-600" />
                            <span className="text-sm font-medium text-indigo-700">First Timers</span>
                          </div>
                          <span className="text-lg font-bold text-indigo-600">{report.numberOfFirstTimers}</span>
                        </div>
                      )}

                      {/* Actions */}
                      {(canUpdateReport || canDeleteReport) && (
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                          {canUpdateReport && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => navigate(`/members/service-reports/${report._id}/edit`)}
                              className="flex-1 text-xs"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => generatePdf(report._id, e)}
                            className="flex-1 text-xs"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            PDF
                          </Button>
                          {canDeleteReport && (
                            <button
                              onClick={(e) => handleDelete(report._id, e)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {reports.length === 0 && (
                    <div className="text-center py-16">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-gray-400" />
                      </div>
                      <h3 className="text-base font-medium text-gray-900 mb-1">No reports found</h3>
                      <p className="text-gray-500 text-sm mb-5">
                        {canCreateReport ? 'Create your first service report to start tracking.' : 'No service reports available.'}
                      </p>
                      {canCreateReport && (
                        <Button onClick={() => setShowQuickCreateModal(true)} size="sm">
                          <Plus className="w-4 h-4 mr-1" />
                          New Report
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                          M
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                          F
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                          C
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          New
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((report, index) => (
                        <motion.tr
                          key={report._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          onClick={() => openDetailModal(report)}
                          className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors group"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-white" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                                  {report.serviceName}
                                </p>
                                {report.serviceTags && report.serviceTags.length > 0 && (
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {report.serviceTags.length} tag{report.serviceTags.length > 1 ? 's' : ''}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-sm text-gray-600">{formatDate(report.date)}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="text-sm font-semibold text-gray-900">{report.totalAttendance}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                            <span className="text-sm text-gray-600">{report.numberOfMales}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                            <span className="text-sm text-gray-600">{report.numberOfFemales}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center hidden md:table-cell">
                            <span className="text-sm text-gray-600">{report.numberOfChildren}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={cn(
                              "text-sm",
                              report.numberOfFirstTimers > 0
                                ? "font-medium text-gray-900"
                                : "text-gray-400"
                            )}>
                              {report.numberOfFirstTimers}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {canUpdateReport && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); navigate(`/members/service-reports/${report._id}/edit`); }}
                                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => generatePdf(report._id, e)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              {canDeleteReport && (
                                <button
                                  onClick={(e) => handleDelete(report._id, e)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>

                  {reports.length === 0 && (
                    <div className="text-center py-16">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-gray-400" />
                      </div>
                      <h3 className="text-base font-medium text-gray-900 mb-1">No reports found</h3>
                      <p className="text-gray-500 text-sm mb-5">Create your first service report to start tracking.</p>
                      <Button onClick={() => setShowQuickCreateModal(true)} size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        New Report
                      </Button>
                    </div>
                  )}
                </div>

                {/* Compact Pagination */}
                {pagination && pagination.total > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                    <span className="text-xs text-gray-500">
                      {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={!pagination.hasPrev}
                        className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="px-3 py-1 text-sm font-medium text-gray-700">
                        {pagination.page} / {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={!pagination.hasNext}
                        className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={closeFilterModal}
        onApply={applyFilters}
        onReset={resetTempFilters}
        title="Filter Service Reports"
        subtitle="Refine your search results"
        activeFilterCount={activeFilterCount}
        filters={[
          ...(showBranchFilter ? [{
            id: 'branch',
            label: 'Campus',
            value: tempBranchFilter,
            onChange: setTempBranchFilter,
            options: branches.map(b => ({ value: b._id, label: b.name })),
            placeholder: 'All Campuses',
          }] : []),
          {
            id: 'serviceTag',
            label: 'Service Type',
            value: tempServiceTagFilter,
            onChange: setTempServiceTagFilter,
            options: Object.entries(SERVICE_TAG_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
            placeholder: 'All Service Types',
          },
        ]}
        dateRange={{
          id: 'serviceDate',
          label: 'Service Date Range',
          fromValue: tempDateFrom,
          toValue: tempDateTo,
          onFromChange: setTempDateFrom,
          onToChange: setTempDateTo,
        }}
      />

      {/* Quick Create Modal */}
      <AnimatePresence>
        {showQuickCreateModal && (
          <ServiceReportForm
            isModal
            onSubmit={handleQuickCreate}
            onCancel={() => setShowQuickCreateModal(false)}
            loading={quickCreateLoading}
          />
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1 pr-2">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{selectedReport.serviceName}</h2>
                    <p className="text-gray-500 text-xs sm:text-sm flex items-center gap-1.5 mt-1">
                      <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                      {formatDate(selectedReport.date)}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Attendance Stats */}
              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-5">
                  <div className="col-span-2 bg-gray-50 rounded-xl p-3 sm:p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{selectedReport.totalAttendance}</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">Total</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2 sm:p-3 text-center">
                    <p className="text-lg sm:text-xl font-bold text-gray-900">{selectedReport.numberOfMales}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Males</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2 sm:p-3 text-center">
                    <p className="text-lg sm:text-xl font-bold text-gray-900">{selectedReport.numberOfFemales}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Females</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1 bg-gray-50 rounded-xl p-2 sm:p-3 text-center">
                    <p className="text-lg sm:text-xl font-bold text-gray-900">{selectedReport.numberOfChildren}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Children</p>
                  </div>
                </div>

                {/* First Timers */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">First Timers</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{selectedReport.numberOfFirstTimers}</span>
                </div>

                {/* Tags */}
                {selectedReport.serviceTags && selectedReport.serviceTags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
                      <Tag className="w-3.5 h-3.5" />
                      Service Tags
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedReport.serviceTags.map(tag => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs bg-gray-100 text-gray-700"
                        >
                          {SERVICE_TAG_LABELS[tag]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedReport.notes && (
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
                      <StickyNote className="w-3.5 h-3.5" />
                      Notes
                    </div>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                      {selectedReport.notes}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{selectedReport.reportedBy.firstName} {selectedReport.reportedBy.lastName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{formatDateTime(selectedReport.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-gray-100">
                <button
                  onClick={() => handleDelete(selectedReport._id)}
                  className="text-sm text-gray-500 hover:text-red-600 font-medium flex items-center justify-center gap-1 transition-colors order-2 sm:order-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => generatePdf(selectedReport._id)}
                    className="flex-1 sm:flex-none"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowDetailModal(false)
                      navigate(`/members/service-reports/${selectedReport._id}/edit`)
                    }}
                    className="flex-1 sm:flex-none"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
