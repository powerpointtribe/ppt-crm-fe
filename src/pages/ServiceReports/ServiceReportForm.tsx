import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, FileText, Users, UserCheck, AlertCircle, Save, X } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
  serviceReportsService,
  CreateServiceReportData,
  ServiceTag,
  SERVICE_TAG_LABELS
} from '@/services/service-reports'

interface ServiceReportFormProps {
  onSubmit: (data: CreateServiceReportData) => Promise<void>
  onCancel: () => void
  initialData?: Partial<CreateServiceReportData>
  loading?: boolean
}

export default function ServiceReportForm({
  onSubmit,
  onCancel,
  initialData = {},
  loading = false
}: ServiceReportFormProps) {
  const [formData, setFormData] = useState<CreateServiceReportData>({
    date: new Date().toISOString().split('T')[0],
    serviceName: '',
    serviceTags: [],
    totalAttendance: 0,
    numberOfMales: 0,
    numberOfFemales: 0,
    numberOfChildren: 0,
    numberOfFirstTimers: 0,
    notes: '',
    ...initialData
  })

  const [errors, setErrors] = useState<string[]>([])

  // Validate attendance numbers in real-time
  useEffect(() => {
    const validationErrors = serviceReportsService.validateAttendanceNumbers(formData)
    setErrors(validationErrors)
  }, [formData.totalAttendance, formData.numberOfMales, formData.numberOfFemales, formData.numberOfChildren, formData.numberOfFirstTimers])

  const handleInputChange = (field: keyof CreateServiceReportData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleServiceTagChange = (tag: ServiceTag, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      serviceTags: checked
        ? [...(prev.serviceTags || []), tag]
        : (prev.serviceTags || []).filter(t => t !== tag)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (errors.length > 0) {
      return
    }

    await onSubmit(formData)
  }

  const calculateTotal = () => {
    return formData.numberOfMales + formData.numberOfFemales + formData.numberOfChildren
  }

  const autoCalculateTotal = () => {
    const calculatedTotal = calculateTotal()
    handleInputChange('totalAttendance', calculatedTotal)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Service Report</h2>
        </div>

        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
              <AlertCircle className="w-5 h-5" />
              Validation Errors
            </div>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-red-700">{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Service Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Service Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Name *
              </label>
              <input
                type="text"
                value={formData.serviceName}
                onChange={(e) => handleInputChange('serviceName', e.target.value)}
                placeholder="e.g., Sunday Morning Service"
                required
                maxLength={200}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Service Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Service Tags (Select all that apply)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(SERVICE_TAG_LABELS).map(([tag, label]) => (
                <label key={tag} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(formData.serviceTags || []).includes(tag as ServiceTag)}
                    onChange={(e) => handleServiceTagChange(tag as ServiceTag, e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Attendance Numbers */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Attendance Numbers
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Males *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.numberOfMales}
                  onChange={(e) => handleInputChange('numberOfMales', parseInt(e.target.value) || 0)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Females *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.numberOfFemales}
                  onChange={(e) => handleInputChange('numberOfFemales', parseInt(e.target.value) || 0)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Children *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.numberOfChildren}
                  onChange={(e) => handleInputChange('numberOfChildren', parseInt(e.target.value) || 0)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UserCheck className="w-4 h-4 inline mr-1" />
                  First Timers *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.numberOfFirstTimers}
                  onChange={(e) => handleInputChange('numberOfFirstTimers', parseInt(e.target.value) || 0)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Total Attendance */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Attendance *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.totalAttendance}
                  onChange={(e) => handleInputChange('totalAttendance', parseInt(e.target.value) || 0)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={autoCalculateTotal}
                className="mt-6"
              >
                Auto Calculate ({calculateTotal()})
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional observations, special events, or notes about the service..."
              maxLength={1000}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <div className="text-sm text-gray-500 mt-1">
              {(formData.notes?.length || 0)}/1000 characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            <Button
              type="submit"
              disabled={loading || errors.length > 0}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Report'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  )
}