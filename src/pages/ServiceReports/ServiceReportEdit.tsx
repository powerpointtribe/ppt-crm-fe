import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Edit2, Clock } from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import { SkeletonCard } from '@/components/ui/Skeleton'
import ServiceReportForm from './ServiceReportForm'
import {
  serviceReportsService,
  ServiceReport,
  UpdateServiceReportData
} from '@/services/service-reports'
import { formatDate } from '@/utils/formatters'

export default function ServiceReportEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [report, setReport] = useState<ServiceReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

  const handleSubmit = async (data: UpdateServiceReportData) => {
    try {
      setSaving(true)
      const updatedReport = await serviceReportsService.updateServiceReport(id!, data)
      navigate(`/members/service-reports/${updatedReport._id}`, {
        state: { message: 'Service report updated successfully!' }
      })
    } catch (error: any) {
      alert('Failed to update service report: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate(`/members/service-reports/${id}`)
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
                <Edit2 className="w-8 h-8 text-red-500" />
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

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Compact Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/members/service-reports/${id}`)}
              className="flex items-center gap-1.5 bg-white shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="h-6 w-px bg-gray-200" />
            <h1 className="text-lg font-semibold text-gray-900">Edit Report</h1>
          </motion.div>

          {/* Main Content - 2 Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-2">
              <ServiceReportForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                initialData={{
                  date: report.date,
                  serviceName: report.serviceName,
                  serviceTags: report.serviceTags,
                  totalAttendance: report.totalAttendance,
                  numberOfMales: report.numberOfMales,
                  numberOfFemales: report.numberOfFemales,
                  numberOfChildren: report.numberOfChildren,
                  numberOfFirstTimers: report.numberOfFirstTimers,
                  notes: report.notes
                }}
                loading={saving}
              />
            </div>

            {/* Current Data Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              {/* Current Report Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                    <Edit2 className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Editing</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Service</span>
                    <span className="font-medium text-gray-900">{report.serviceName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Date
                    </span>
                    <span className="font-medium text-gray-900">{formatDate(report.date)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Current Attendance</span>
                    <span className="font-bold text-indigo-600">{report.totalAttendance}</span>
                  </div>
                </div>
              </div>

              {/* Tips Card */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg border border-amber-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <h3 className="font-semibold text-amber-800">Edit Tips</h3>
                </div>
                <ul className="space-y-2 text-sm text-amber-700">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    <span>Changes are saved immediately when you click "Save Report"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    <span>Auto-sync recalculates totals as you edit numbers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    <span>Click Cancel to discard all changes</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  )
}