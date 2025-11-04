import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText } from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import { SkeletonCard } from '@/components/ui/Skeleton'
import ServiceReportForm from './ServiceReportForm'
import {
  serviceReportsService,
  ServiceReport,
  UpdateServiceReportData
} from '@/services/service-reports'

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
          <div className="text-center py-12">
            <div className="text-red-600 mb-2">Error loading service report</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <Button onClick={() => navigate('/members/service-reports')}>
              Back to Reports
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/members/service-reports/${id}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Report
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              Edit Service Report
            </h1>
            <p className="text-gray-600 mt-1">{report.serviceName} - {report.date}</p>
          </div>
        </motion.div>

        {/* Form */}
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
    </Layout>
  )
}