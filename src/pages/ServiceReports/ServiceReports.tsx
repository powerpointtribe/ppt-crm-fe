import { useState, useEffect } from 'react'
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
  BarChart3
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import SearchInput from '@/components/ui/SearchInput'
import { SkeletonTable } from '@/components/ui/Skeleton'
import {
  serviceReportsService,
  ServiceReport,
  ServiceReportSearchParams,
  ServiceTag,
  SERVICE_TAG_LABELS
} from '@/services/service-reports'
import { formatDate } from '@/utils/formatters'

export default function ServiceReports() {
  const navigate = useNavigate()
  const [reports, setReports] = useState<ServiceReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [searchParams, setSearchParams] = useState<ServiceReportSearchParams>({
    page: 1,
    limit: 20,
    search: '',
    sortBy: 'date',
    sortOrder: 'desc'
  })
  const [pagination, setPagination] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    loadReports()
  }, [searchParams])

  useEffect(() => {
    loadStats()
  }, [])

  const loadReports = async () => {
    try {
      setLoading(true)
      const result = await serviceReportsService.getServiceReports(searchParams)
      setReports(result.items)
      setPagination(result.pagination)
    } catch (err: any) {
      setError(err.message || 'Failed to load service reports')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await serviceReportsService.getServiceReportStats()
      setStats(statsData)
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  const handleSearch = (query: string) => {
    setSearchParams(prev => ({
      ...prev,
      search: query,
      page: 1
    }))
  }

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }))
  }

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

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              Service Reports
            </h1>
            <p className="text-gray-600 mt-1">Track and manage service attendance reports</p>
          </div>
          <Button
            onClick={() => navigate('/members/service-reports/new')}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Report
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reports</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overall.totalReports}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Attendance</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overall.totalAttendance.toLocaleString()}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(stats.overall.averageAttendance)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total First Timers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overall.totalFirstTimers}</p>
                </div>
                <UserCheck className="w-8 h-8 text-purple-600" />
              </div>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Search service reports..."
                onSearch={handleSearch}
                className="w-full"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </Card>

        {/* Reports Table */}
        <Card>
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
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      First Timers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reported By
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <motion.tr
                      key={report._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/members/service-reports/${report._id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/members/service-reports/${report._id}/edit`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generatePdf(report._id)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(report._id)}
                            className="text-red-600 hover:text-red-700"
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
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No service reports found</h3>
                  <p className="text-gray-600 mb-4">Get started by creating your first service report.</p>
                  <Button onClick={() => navigate('/members/service-reports/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Service Report
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="border-t border-gray-200 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}