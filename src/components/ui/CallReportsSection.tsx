import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Edit, Trash2, Phone, Mail, MessageSquare, Video, Home,
  CheckCircle, Clock, AlertCircle, Users, Calendar, FileText
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import CallReportForm from '@/components/forms/CallReportForm'
import { CallReport, CreateCallReportData, firstTimersService } from '@/services/first-timers'
import { formatDate } from '@/utils/formatters'

interface CallReportsSectionProps {
  firstTimerId: string
  maxReports?: number
}

const getContactMethodIcon = (method: string) => {
  switch (method) {
    case 'phone': return Phone
    case 'email': return Mail
    case 'sms':
    case 'whatsapp': return MessageSquare
    case 'video_call': return Video
    case 'visit': return Home
    default: return Phone
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'successful': return 'bg-green-100 text-green-800 border-green-200'
    case 'completed': return 'bg-green-100 text-green-800 border-green-200'
    case 'interested': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'no_answer': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'busy': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'not_interested': return 'bg-red-100 text-red-800 border-red-200'
    case 'follow_up_needed': return 'bg-purple-100 text-purple-800 border-purple-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export default function CallReportsSection({
  firstTimerId,
  maxReports = 4
}: CallReportsSectionProps) {
  const [callReports, setCallReports] = useState<CallReport[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingReport, setEditingReport] = useState<CallReport | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadCallReports()
    loadSummary()
  }, [firstTimerId])

  const loadCallReports = async () => {
    try {
      const reports = await firstTimersService.getCallReports(firstTimerId)
      setCallReports(reports)
    } catch (error) {
      console.error('Error loading call reports:', error)
    }
  }

  const loadSummary = async () => {
    try {
      const summaryData = await firstTimersService.getCallReportsSummary(firstTimerId)
      setSummary(summaryData)
    } catch (error) {
      console.error('Error loading summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReport = () => {
    const nextReportNumber = callReports.length + 1
    if (nextReportNumber <= maxReports) {
      setEditingReport(null)
      setShowForm(true)
    }
  }

  const handleEditReport = (report: CallReport) => {
    setEditingReport(report)
    setShowForm(true)
  }

  const handleSubmitReport = async (data: CreateCallReportData) => {
    try {
      setSubmitting(true)
      if (editingReport) {
        await firstTimersService.updateCallReport(editingReport._id, data)
      } else {
        await firstTimersService.createCallReport(data)
      }
      await loadCallReports()
      await loadSummary()
      setShowForm(false)
      setEditingReport(null)
    } catch (error) {
      console.error('Error saving call report:', error)
      throw error
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    if (window.confirm('Are you sure you want to delete this call report?')) {
      try {
        await firstTimersService.deleteCallReport(reportId)
        await loadCallReports()
        await loadSummary()
      } catch (error) {
        console.error('Error deleting call report:', error)
      }
    }
  }

  const nextReportNumber = callReports.length + 1
  const canAddReport = nextReportNumber <= maxReports

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Call Reports</h3>
            {summary && (
              <span className="text-sm text-gray-500">
                ({summary.completedReports}/{summary.totalReports} completed)
              </span>
            )}
          </div>
          {canAddReport && (
            <Button
              onClick={handleCreateReport}
              size="sm"
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Report #{nextReportNumber}</span>
            </Button>
          )}
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.completedReports}</div>
              <div className="text-sm text-gray-600">Reports Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{summary.remainingReports}</div>
              <div className="text-sm text-gray-600">Reports Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Service Attendance</div>
              <div className="flex justify-center space-x-2 mt-1">
                <span className={`w-3 h-3 rounded-full ${summary.serviceAttendance?.attended2nd ? 'bg-green-500' : 'bg-gray-300'}`} title="2nd Service"></span>
                <span className={`w-3 h-3 rounded-full ${summary.serviceAttendance?.attended3rd ? 'bg-green-500' : 'bg-gray-300'}`} title="3rd Service"></span>
                <span className={`w-3 h-3 rounded-full ${summary.serviceAttendance?.attended4th ? 'bg-green-500' : 'bg-gray-300'}`} title="4th Service"></span>
              </div>
            </div>
          </div>
        )}

        {/* Call Reports List */}
        <div className="space-y-4">
          {callReports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg mb-2">No call reports yet</p>
              <p className="text-sm">Create the first call report to track follow-up progress</p>
            </div>
          ) : (
            callReports.map((report) => {
              const ContactIcon = getContactMethodIcon(report.contactMethod)
              return (
                <motion.div
                  key={report._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900">
                            Report #{report.reportNumber}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                            {report.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <ContactIcon className="w-4 h-4" />
                          <span>{report.contactMethod.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(report.callDate)}</span>
                        </div>
                      </div>

                      {/* Service Attendance */}
                      <div className="flex items-center space-x-4 mb-3">
                        <span className="text-sm text-gray-600">Service Attendance:</span>
                        <div className="flex space-x-2">
                          {report.attended2ndService && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">2nd</span>
                          )}
                          {report.attended3rdService && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">3rd</span>
                          )}
                          {report.attended4thService && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">4th</span>
                          )}
                          {!report.attended2ndService && !report.attended3rdService && !report.attended4thService && (
                            <span className="text-sm text-gray-500">None recorded</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Notes:</span>
                          <p className="text-sm text-gray-600 mt-1">{report.notes}</p>
                        </div>
                        {report.deductions && (
                          <div>
                            <span className="text-sm font-medium text-gray-700">Deductions:</span>
                            <p className="text-sm text-gray-600 mt-1">{report.deductions}</p>
                          </div>
                        )}
                        {report.nextFollowUpDate && (
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>Next follow-up: {formatDate(report.nextFollowUpDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEditReport(report)}
                        className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                        title="Edit report"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report._id)}
                        className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                        title="Delete report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>

        {/* Progress Indicator */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Follow-up Progress</span>
            <span>{callReports.length} of {maxReports} reports</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(callReports.length / maxReports) * 100}%` }}
            />
          </div>
        </div>
      </Card>

      <AnimatePresence>
        {showForm && (
          <CallReportForm
            firstTimerId={firstTimerId}
            reportNumber={editingReport?.reportNumber || nextReportNumber}
            existingReport={editingReport || undefined}
            onSubmit={handleSubmitReport}
            onCancel={() => {
              setShowForm(false)
              setEditingReport(null)
            }}
            isSubmitting={submitting}
          />
        )}
      </AnimatePresence>
    </>
  )
}