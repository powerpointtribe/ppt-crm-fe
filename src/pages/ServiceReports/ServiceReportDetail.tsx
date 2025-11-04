import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  FileText,
  Calendar,
  Users,
  UserCheck,
  Edit,
  Download,
  Trash2,
  Clock,
  User
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { serviceReportsService, ServiceReport, SERVICE_TAG_LABELS } from '@/services/service-reports'
import { formatDate, formatDateTime } from '@/utils/formatters'

export default function ServiceReportDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [report, setReport] = useState<ServiceReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadReport()
    }
  }, [id])

  const loadReport = async () => {
    try {
      setLoading(true)
      const reportData = await serviceReportsService.getServiceReportById(id!)
      setReport(reportData)
    } catch (err: any) {
      setError(err.message || 'Failed to load service report')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this service report?')) {
      return
    }

    try {
      await serviceReportsService.deleteServiceReport(id!)
      navigate('/members/service-reports', {
        state: { message: 'Service report deleted successfully' }
      })
    } catch (err: any) {
      alert('Failed to delete service report: ' + err.message)
    }
  }

  const generatePdf = async () => {
    try {
      await serviceReportsService.generatePdfReport(id!)
    } catch (err: any) {
      alert('Failed to generate PDF: ' + err.message)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-6 max-w-7xl mx-auto">
          <SkeletonCard className="h-96" />
        </div>
      </Layout>
    )
  }

  if (error || !report) {
    return (
      <Layout>
        <div className="p-6 max-w-7xl mx-auto">
          <Card className="p-8 text-center">
            <div className="text-red-600 mb-2">Error loading service report</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <Button onClick={() => navigate('/members/service-reports')}>
              Back to Reports
            </Button>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Success Message */}
        {location.state?.message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800"
          >
            {location.state.message}
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/members/service-reports')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Reports
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                {report.serviceName}
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(report.date)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/members/service-reports/${id}/edit`)}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={generatePdf}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Attendance Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Attendance Overview
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{report.totalAttendance}</div>
                    <div className="text-sm text-blue-700">Total Attendance</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{report.numberOfMales}</div>
                    <div className="text-sm text-green-700">Males</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{report.numberOfFemales}</div>
                    <div className="text-sm text-purple-700">Females</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{report.numberOfChildren}</div>
                    <div className="text-sm text-orange-700">Children</div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* First Timers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-purple-600" />
                  First-Time Visitors
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">{report.numberOfFirstTimers}</div>
                    <div className="text-sm text-purple-700">First Timers</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-gray-600">
                      {report.totalAttendance - report.numberOfFirstTimers}
                    </div>
                    <div className="text-sm text-gray-700">Returning Members</div>
                  </div>
                </div>
                {report.numberOfFirstTimers > 0 && (
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                    <div className="text-sm text-purple-700">
                      First-timer rate: {((report.numberOfFirstTimers / report.totalAttendance) * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Service Tags */}
            {report.serviceTags && report.serviceTags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Service Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {report.serviceTags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-sm">
                        {SERVICE_TAG_LABELS[tag]}
                      </Badge>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Notes */}
            {report.notes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{report.notes}</p>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Report Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-gray-600">Reported by</div>
                      <div className="font-medium">
                        {report.reportedBy.firstName} {report.reportedBy.lastName}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-gray-600">Created</div>
                      <div className="font-medium">{formatDateTime(report.createdAt)}</div>
                    </div>
                  </div>
                  {report.updatedAt !== report.createdAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-gray-600">Last updated</div>
                        <div className="font-medium">{formatDateTime(report.updatedAt)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Demographics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Adults</span>
                    <span className="font-medium">{report.numberOfMales + report.numberOfFemales}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Children</span>
                    <span className="font-medium">{report.numberOfChildren}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Male %</span>
                    <span className="font-medium">
                      {((report.numberOfMales / report.totalAttendance) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Female %</span>
                    <span className="font-medium">
                      {((report.numberOfFemales / report.totalAttendance) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Children %</span>
                    <span className="font-medium">
                      {((report.numberOfChildren / report.totalAttendance) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  )
}