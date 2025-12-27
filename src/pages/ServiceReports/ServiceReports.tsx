import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus,
  FileText,
  Users,
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  UserCheck,
  BarChart3,
  X
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { SkeletonTable } from '@/components/ui/Skeleton'
import FilterModal from '@/components/ui/FilterModal'
import {
  serviceReportsService,
  ServiceReport,
  ServiceReportSearchParams,
  ServiceTag,
  SERVICE_TAG_LABELS
} from '@/services/service-reports'
import { formatDate } from '@/utils/formatters'
import { useAppStore } from '@/store'

export default function ServiceReports() {
  const navigate = useNavigate()
  const { selectedBranch, branches } = useAppStore()
  const [reports, setReports] = useState<ServiceReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchParams, setSearchParams] = useState<ServiceReportSearchParams>({
    page: 1,
    limit: 20,
    search: '',
    sortBy: 'date',
    sortOrder: 'desc'
  })
  const [pagination, setPagination] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [showFilterModal, setShowFilterModal] = useState(false)

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

  // Show branch filter when viewing "All Campuses"
  const showBranchFilter = !selectedBranch && branches.length > 0

  const memoizedSearchParams = useMemo(() => {
    // Use selectedBranch if set, otherwise use the filter dropdown
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service report?')) {
      return
    }

    try {
      await serviceReportsService.deleteServiceReport(id)
      loadReports()
    } catch (err: any) {
      alert('Failed to delete service report: ' + err.message)
    }
  }

  const generatePdf = async (id: string) => {
    try {
      await serviceReportsService.generatePdfReport(id)
    } catch (err: any) {
      alert('Failed to generate PDF: ' + err.message)
    }
  }

  const getServiceTagBadges = (tags: ServiceTag[]) => {
    return tags.map(tag => (
      <Badge
        key={tag}
        variant="secondary"
        className="text-xs"
      >
        {SERVICE_TAG_LABELS[tag]}
      </Badge>
    ))
  }

  // Search Section to be displayed in header
  const searchSection = (
    <form onSubmit={handleSearch} className="flex gap-3 flex-wrap items-center w-full">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by service name, date, or reporter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          />
        </div>
      </div>

      <button
        type="submit"
        className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
      >
        Search
      </button>

      <Button
        variant="secondary"
        onClick={openFilterModal}
        className={hasActiveFilters ? 'border-primary-500 text-primary-600' : ''}
      >
        <Filter className="w-4 h-4 mr-2" />
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
          onClick={clearAppliedFilters}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}

      <Button onClick={() => navigate('/members/service-reports/new')}>
        <Plus className="w-5 h-5 mr-2" />
        Create Report
      </Button>
    </form>
  )

  return (
    <Layout
      title="Service Reports"
      subtitle="Track attendance trends and service insights"
      searchSection={searchSection}
    >
      <div className="p-6 max-w-7xl mx-auto">

        {/* Modern Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-700 font-semibold text-sm uppercase tracking-wide mb-2">Total Reports</p>
                  <p className="text-3xl font-bold text-blue-900">{stats?.overall?.totalReports || 0}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                  <FileText className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-2xl p-6 border border-green-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700 font-semibold text-sm uppercase tracking-wide mb-2">Highest Attendance</p>
                  <p className="text-3xl font-bold text-green-900">{(stats?.overall?.highestAttendance || 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-700 font-semibold text-sm uppercase tracking-wide mb-2">Avg Attendance</p>
                  <p className="text-3xl font-bold text-amber-900">{Math.round(stats?.overall?.averageAttendance || 0)}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-700 font-semibold text-sm uppercase tracking-wide mb-2">Total First Timers</p>
                  <p className="text-3xl font-bold text-purple-900">{stats?.overall?.totalFirstTimers || 0}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                  <UserCheck className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Modern Attendance Chart */}
        {chartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 mb-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Attendance Trends</h2>
                    <p className="text-gray-600">Last 10 services performance overview</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-lg">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                  <span className="text-sm font-medium text-indigo-700">Attendance</span>
                </div>
              </div>

              <div className="h-96 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.6}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-20" stroke="#94a3b8" />
                    <XAxis
                      dataKey="formattedDate"
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        <span className="font-semibold text-indigo-700">{value}</span>,
                        <span className="text-gray-600">Attendance</span>
                      ]}
                      labelFormatter={(label) => {
                        const item = chartData.find(d => d.formattedDate === label)
                        return item ? (
                          <div className="font-semibold text-gray-900">
                            {item.serviceName}
                            <div className="text-sm text-gray-500 font-normal">{item.date}</div>
                          </div>
                        ) : label
                      }}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                        padding: '12px 16px'
                      }}
                      cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }}
                    />
                    <Bar
                      dataKey="attendance"
                      fill="url(#barGradient)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {/* Modern Reports Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <SkeletonTable rows={10} />
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-red-600 mb-2">Error loading service reports</div>
              <div className="text-gray-600">{error}</div>
              <Button onClick={loadReports} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Service
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Attendance
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      First Timers
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Tags
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Reported By
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report, index) => (
                    <motion.tr
                      key={report._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-50 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {report.serviceName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(report.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          {report.totalAttendance}
                        </div>
                        <div className="text-xs text-gray-500">
                          M: {report.numberOfMales} F: {report.numberOfFemales} C: {report.numberOfChildren}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                          <UserCheck className="w-4 h-4 text-purple-400" />
                          {report.numberOfFirstTimers}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {getServiceTagBadges(report.serviceTags)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {report.reportedBy.firstName} {report.reportedBy.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(report.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/members/service-reports/${report._id}`)}
                            className="p-2 h-9 w-9 bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/members/service-reports/${report._id}/edit`)}
                            className="p-2 h-9 w-9 bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generatePdf(report._id)}
                            className="p-2 h-9 w-9 bg-green-50 border-green-200 text-green-600 hover:bg-green-100 rounded-lg"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(report._id)}
                            className="p-2 h-9 w-9 bg-red-50 border-red-200 text-red-600 hover:bg-red-100 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

              {reports.length === 0 && (
                <div className="text-center py-16">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No service reports found</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">Get started by creating your first service report to track attendance and service insights.</p>
                  <Button
                    onClick={() => navigate('/members/service-reports/new')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-3"
                    size="lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Report
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Modern Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="border-t border-gray-100 bg-gray-50 px-8 py-4 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 font-medium">
                  Showing <span className="text-gray-900">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                  <span className="text-gray-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                  <span className="text-gray-900">{pagination.total}</span> results
                </div>
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className="px-4 py-2 bg-white border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium"
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className="px-4 py-2 bg-white border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
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
    </Layout>
  )
}