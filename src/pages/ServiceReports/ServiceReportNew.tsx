import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText } from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import ServiceReportForm from './ServiceReportForm'
import { serviceReportsService, CreateServiceReportData } from '@/services/service-reports'

export default function ServiceReportNew() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: CreateServiceReportData) => {
    try {
      setLoading(true)
      const report = await serviceReportsService.createServiceReport(data)
      navigate(`/members/service-reports/${report._id}`, {
        state: { message: 'Service report created successfully!' }
      })
    } catch (error: any) {
      alert('Failed to create service report: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/members/service-reports')
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
            onClick={() => navigate('/members/service-reports')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              New Service Report
            </h1>
            <p className="text-gray-600 mt-1">Create a new attendance report for a service</p>
          </div>
        </motion.div>

        {/* Form */}
        <ServiceReportForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </Layout>
  )
}