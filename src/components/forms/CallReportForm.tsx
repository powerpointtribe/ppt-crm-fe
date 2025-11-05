import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Save, X, Phone, Mail, MessageSquare, Video, Home, Users } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { CreateCallReportData, CallReport } from '@/services/first-timers'

interface CallReportFormProps {
  firstTimerId: string
  reportNumber: number
  existingReport?: CallReport
  onSubmit: (data: CreateCallReportData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

const contactMethods = [
  { value: 'phone', label: 'Phone Call', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'sms', label: 'SMS/Text', icon: MessageSquare },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { value: 'visit', label: 'In-Person Visit', icon: Home },
  { value: 'video_call', label: 'Video Call', icon: Video },
]

const statusOptions = [
  { value: 'successful', label: 'Successful Contact', color: 'bg-green-100 text-green-800' },
  { value: 'no_answer', label: 'No Answer', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'busy', label: 'Busy', color: 'bg-orange-100 text-orange-800' },
  { value: 'not_interested', label: 'Not Interested', color: 'bg-red-100 text-red-800' },
  { value: 'interested', label: 'Interested', color: 'bg-blue-100 text-blue-800' },
  { value: 'follow_up_needed', label: 'Follow-up Needed', color: 'bg-purple-100 text-purple-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
]

export default function CallReportForm({
  firstTimerId,
  reportNumber,
  existingReport,
  onSubmit,
  onCancel,
  isSubmitting = false
}: CallReportFormProps) {
  const [formData, setFormData] = useState<CreateCallReportData>({
    firstTimerId,
    reportNumber,
    callDate: existingReport?.callDate || new Date().toISOString().split('T')[0],
    status: existingReport?.status || 'successful',
    notes: existingReport?.notes || '',
    deductions: existingReport?.deductions || '',
    contactMethod: existingReport?.contactMethod || 'phone',
    attended2ndService: existingReport?.attended2ndService || false,
    attended3rdService: existingReport?.attended3rdService || false,
    attended4thService: existingReport?.attended4thService || false,
    nextFollowUpDate: existingReport?.nextFollowUpDate?.split('T')[0] || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const handleInputChange = (field: keyof CreateCallReportData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Call Report #{reportNumber}
              {existingReport && <span className="text-sm text-gray-500 ml-2">(Edit)</span>}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Call Date
                </label>
                <input
                  type="date"
                  value={formData.callDate}
                  onChange={(e) => handleInputChange('callDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Method
                </label>
                <select
                  value={formData.contactMethod}
                  onChange={(e) => handleInputChange('contactMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  {contactMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Call Status
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {statusOptions.map(status => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => handleInputChange('status', status.value)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      formData.status === status.value
                        ? `${status.color} border-current`
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Service Attendance Tracking */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Service Attendance
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.attended2ndService}
                    onChange={(e) => handleInputChange('attended2ndService', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Attended 2nd Service</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.attended3rdService}
                    onChange={(e) => handleInputChange('attended3rdService', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Attended 3rd Service</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.attended4thService}
                    onChange={(e) => handleInputChange('attended4thService', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Attended 4th Service</span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Call Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Describe the conversation, visitor's response, any prayer requests, etc."
                required
              />
            </div>

            {/* Deductions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deductions/Observations
              </label>
              <textarea
                value={formData.deductions}
                onChange={(e) => handleInputChange('deductions', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Any insights, concerns, or observations about the visitor"
              />
            </div>

            {/* Next Follow-up Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Next Follow-up Date (Optional)
              </label>
              <input
                type="date"
                value={formData.nextFollowUpDate}
                onChange={(e) => handleInputChange('nextFollowUpDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save Report'}</span>
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </motion.div>
  )
}