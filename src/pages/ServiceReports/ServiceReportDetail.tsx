import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  Users,
  UserCheck,
  Edit,
  Download,
  Trash2,
  Clock,
  User,
  Sparkles,
  Tag,
  StickyNote,
  CheckCircle,
  TrendingUp,
  MoreHorizontal
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import DemographicsPieChart from '@/components/charts/DemographicsPieChart'
import { serviceReportsService, ServiceReport, SERVICE_TAG_LABELS } from '@/services/service-reports'
import { formatDate, formatDateTime } from '@/utils/formatters'
import { cn } from '@/utils/cn'

export default function ServiceReportDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [report, setReport] = useState<ServiceReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showActions, setShowActions] = useState(false)

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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 p-6">
          <div className="max-w-5xl mx-auto">
            <SkeletonCard className="h-96" />
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !report) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 p-6">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <div className="text-red-600 font-semibold mb-2">Error loading service report</div>
              <div className="text-gray-600 mb-6">{error}</div>
              <Button onClick={() => navigate('/members/service-reports')}>
                Back to Reports
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  const firstTimerRate = report.totalAttendance > 0
    ? ((report.numberOfFirstTimers / report.totalAttendance) * 100).toFixed(1)
    : '0'

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
        {/* Success Message */}
        <AnimatePresence>
          {location.state?.message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-green-500 text-white px-4 py-3"
            >
              <div className="max-w-5xl mx-auto flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {location.state.message}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-6 max-w-5xl mx-auto">
          {/* Compact Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-3 mb-6"
          >
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/members/service-reports')}
                className="flex items-center gap-1.5 bg-white shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="h-6 w-px bg-gray-200" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{report.serviceName}</h1>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(report.date)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/members/service-reports/${id}/edit`)}
                  className="bg-white shadow-sm"
                >
                  <Edit className="w-4 h-4 mr-1.5" />
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={generatePdf}
                  className="bg-white shadow-sm"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  PDF
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDelete}
                  className="bg-white shadow-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Mobile Actions Dropdown */}
              <div className="sm:hidden relative">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowActions(!showActions)}
                  className="bg-white shadow-sm"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-10 min-w-[140px]"
                  >
                    <button
                      onClick={() => { navigate(`/members/service-reports/${id}/edit`); setShowActions(false); }}
                      className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => { generatePdf(); setShowActions(false); }}
                      className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Download PDF
                    </button>
                    <button
                      onClick={() => { handleDelete(); setShowActions(false); }}
                      className="w-full px-4 py-2 text-sm text-left hover:bg-red-50 text-red-600 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Hero Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl shadow-xl p-6 mb-6 text-white overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-indigo-200" />
                <span className="text-sm font-medium text-indigo-200">Total Attendance</span>
              </div>

              <div className="text-6xl font-bold mb-6">{report.totalAttendance}</div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-xs text-indigo-200">Males</span>
                  </div>
                  <div className="text-2xl font-bold">{report.numberOfMales}</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-2 h-2 rounded-full bg-pink-400" />
                    <span className="text-xs text-indigo-200">Females</span>
                  </div>
                  <div className="text-2xl font-bold">{report.numberOfFemales}</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-xs text-indigo-200">Children</span>
                  </div>
                  <div className="text-2xl font-bold">{report.numberOfChildren}</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-purple-400/30">
                  <div className="flex items-center gap-1 mb-1">
                    <Sparkles className="w-3 h-3 text-purple-300" />
                    <span className="text-xs text-indigo-200">First Timers</span>
                  </div>
                  <div className="text-2xl font-bold">{report.numberOfFirstTimers}</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-4">
              {/* First Timers Insight */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                      <UserCheck className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Visitor Insights</h3>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium",
                    parseFloat(firstTimerRate) >= 10
                      ? "bg-green-100 text-green-700"
                      : parseFloat(firstTimerRate) >= 5
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
                  )}>
                    {firstTimerRate}% new visitors
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600">{report.numberOfFirstTimers}</div>
                    <div className="text-sm text-purple-600 font-medium">First Timers</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-gray-600">
                      {report.totalAttendance - report.numberOfFirstTimers}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Returning</div>
                  </div>
                </div>

                {report.numberOfFirstTimers > 0 && (
                  <div className="mt-4 flex items-center gap-2 p-3 bg-indigo-50 rounded-xl">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm text-indigo-700">
                      Great job! {report.numberOfFirstTimers} new {report.numberOfFirstTimers === 1 ? 'person' : 'people'} visited this service.
                    </span>
                  </div>
                )}
              </motion.div>

              {/* Service Tags */}
              {report.serviceTags && report.serviceTags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">Service Tags</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {report.serviceTags.map(tag => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200"
                      >
                        {SERVICE_TAG_LABELS[tag]}
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Notes */}
              {report.notes && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <StickyNote className="w-4 h-4 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">Notes</h3>
                  </div>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                    {report.notes}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-4">
              {/* Report Metadata */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5"
              >
                <h3 className="font-semibold text-gray-900 mb-4">Report Details</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Reported by</div>
                      <div className="text-sm font-medium text-gray-900">
                        {report.reportedBy.firstName} {report.reportedBy.lastName}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Clock className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Created</div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatDateTime(report.createdAt)}
                      </div>
                    </div>
                  </div>
                  {report.updatedAt !== report.createdAt && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Clock className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-0.5">Last updated</div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDateTime(report.updatedAt)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Demographics Chart */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5"
              >
                <h3 className="font-semibold text-gray-900 mb-4">Demographics</h3>
                <DemographicsPieChart
                  data={{
                    numberOfMales: report.numberOfMales,
                    numberOfFemales: report.numberOfFemales,
                    numberOfChildren: report.numberOfChildren,
                    totalAttendance: report.totalAttendance
                  }}
                  size="sm"
                />
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Adults</span>
                    <span className="font-semibold text-gray-900">{report.numberOfMales + report.numberOfFemales}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Children</span>
                    <span className="font-semibold text-gray-900">{report.numberOfChildren}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}