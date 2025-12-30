import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, BarChart3, TrendingUp, Users } from 'lucide-react'
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
              onClick={() => navigate('/members/service-reports')}
              className="flex items-center gap-1.5 bg-white shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="h-6 w-px bg-gray-200" />
            <h1 className="text-lg font-semibold text-gray-900">New Service Report</h1>
          </motion.div>

          {/* Main Content - 2 Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-2">
              <ServiceReportForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
              />
            </div>

            {/* Tips Column */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              {/* Quick Tips Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Quick Tips</h3>
                </div>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                    <span>Auto-sync keeps your total updated as you enter attendance numbers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                    <span>Select service tags to help categorize and analyze trends later</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                    <span>First timers count helps track visitor engagement</span>
                  </li>
                </ul>
              </div>

              {/* Stats Preview */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-lg p-5 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-5 h-5" />
                  <h3 className="font-semibold">Why Track?</h3>
                </div>
                <p className="text-sm text-indigo-100 mb-4">
                  Service reports help you understand attendance patterns, growth trends, and the impact of special services.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <Users className="w-5 h-5 mx-auto mb-1 text-indigo-200" />
                    <span className="text-xs text-indigo-200">Track Growth</span>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <TrendingUp className="w-5 h-5 mx-auto mb-1 text-indigo-200" />
                    <span className="text-xs text-indigo-200">Spot Trends</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  )
}