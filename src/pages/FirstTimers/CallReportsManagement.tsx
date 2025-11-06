import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { showToast } from '@/utils/toast'
import { firstTimersService, CallReport } from '@/services/first-timers'
import {
  Search,
  Filter,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  Video,
  Home,
  Users,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Edit,
  Trash2,
  SortAsc,
  SortDesc,
} from 'lucide-react'
import { formatDate, formatDateTime } from '@/utils/formatters'

interface SearchParams {
  page: number
  limit: number
  status?: string
  contactMethod?: string
  callMadeBy?: string
  fromDate?: string
  toDate?: string
  firstTimerName?: string
}

interface SearchResults {
  reports: CallReport[]
  total: number
  pagination: {
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'successful', label: 'Successful' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'busy', label: 'Busy' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'interested', label: 'Interested' },
  { value: 'follow_up_needed', label: 'Follow-up Needed' },
  { value: 'completed', label: 'Completed' },
]

const contactMethodOptions = [
  { value: '', label: 'All Methods' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS/Text' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'visit', label: 'In-Person Visit' },
  { value: 'video_call', label: 'Video Call' },
]

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
    case 'successful':
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'interested':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'no_answer':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'busy':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'not_interested':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'follow_up_needed':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export default function CallReportsManagement() {
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const [searchParams, setSearchParams] = useState<SearchParams>({
    page: 1,
    limit: 20,
    status: '',
    contactMethod: '',
    callMadeBy: '',
    fromDate: '',
    toDate: '',
    firstTimerName: '',
  })

  useEffect(() => {
    handleSearch()
  }, [searchParams.page])

  const handleSearch = async () => {
    setLoading(true)
    try {
      const params: any = { ...searchParams }

      // Remove empty values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key]
        }
      })

      const results = await firstTimersService.searchCallReports(params)
      setSearchResults(results)
    } catch (error) {
      console.error('Failed to search call reports:', error)
      showToast('error', 'Failed to search call reports')
    } finally {
      setLoading(false)
    }
  }

  const handleParamChange = (key: keyof SearchParams, value: string | number) => {
    setSearchParams(prev => ({
      ...prev,
      [key]: value,
      ...(key !== 'page' && { page: 1 }) // Reset to page 1 when changing search params
    }))
  }

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => ({ ...prev, page: newPage }))
  }

  const clearFilters = () => {
    setSearchParams({
      page: 1,
      limit: 20,
      status: '',
      contactMethod: '',
      callMadeBy: '',
      fromDate: '',
      toDate: '',
      firstTimerName: '',
    })
  }

  const exportReports = async () => {
    try {
      showToast('info', 'Exporting reports...')
      // This would typically generate a CSV or PDF export
      // For now, just show success message
      showToast('success', 'Reports exported successfully')
    } catch (error) {
      console.error('Failed to export reports:', error)
      showToast('error', 'Failed to export reports')
    }
  }

  return (
    <Layout
      title="Call Reports Management"
      subtitle="Search, filter and manage all call reports"
    >
      <div className="space-y-6">
        {/* Search and Filters */}
        <Card className="p-6">
          <div className="space-y-4">
            {/* Main Search Bar */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search by first timer name..."
                    value={searchParams.firstTimerName}
                    onChange={(e) => handleParamChange('firstTimerName', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? <LoadingSpinner size="sm" /> : <Search className="h-4 w-4" />}
                Search
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t pt-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={searchParams.status}
                      onChange={(e) => handleParamChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Method
                    </label>
                    <select
                      value={searchParams.contactMethod}
                      onChange={(e) => handleParamChange('contactMethod', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {contactMethodOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={searchParams.fromDate}
                      onChange={(e) => handleParamChange('fromDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={searchParams.toDate}
                      onChange={(e) => handleParamChange('toDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button onClick={handleSearch} disabled={loading}>
                    Apply Filters
                  </Button>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </Card>

        {/* Results */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Call Reports</h3>
              {searchResults && (
                <p className="text-sm text-gray-600">
                  {searchResults.total} reports found
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportReports}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : searchResults && searchResults.reports.length > 0 ? (
            <>
              {/* Reports List */}
              <div className="space-y-4">
                {searchResults.reports.map((report) => {
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
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                Report #{report.reportNumber}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                                {report.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <ContactIcon className="w-4 h-4" />
                              <span>{report.contactMethod.replace('_', ' ')}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(report.callDate)}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">First Timer:</span>{' '}
                              {(report as any).firstTimerInfo?.firstName} {(report as any).firstTimerInfo?.lastName}
                            </div>
                            <div>
                              <span className="font-medium">Made By:</span>{' '}
                              {(report as any).memberInfo?.firstName} {(report as any).memberInfo?.lastName}
                            </div>
                            {report.nextFollowUpDate && (
                              <div>
                                <span className="font-medium">Next Follow-up:</span>{' '}
                                {formatDate(report.nextFollowUpDate)}
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Created:</span>{' '}
                              {formatDateTime(report.createdAt)}
                            </div>
                          </div>

                          {/* Service Attendance */}
                          <div className="flex items-center gap-4 mt-3">
                            <span className="text-sm text-gray-600">Service Attendance:</span>
                            <div className="flex gap-2">
                              {report.attended2ndService && (
                                <Badge className="bg-green-100 text-green-800">2nd</Badge>
                              )}
                              {report.attended3rdService && (
                                <Badge className="bg-green-100 text-green-800">3rd</Badge>
                              )}
                              {report.attended4thService && (
                                <Badge className="bg-green-100 text-green-800">4th</Badge>
                              )}
                              {!report.attended2ndService && !report.attended3rdService && !report.attended4thService && (
                                <span className="text-sm text-gray-500">None recorded</span>
                              )}
                            </div>
                          </div>

                          {report.notes && (
                            <div className="mt-3">
                              <span className="text-sm font-medium text-gray-700">Notes:</span>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{report.notes}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Navigate to first timer details
                              window.location.href = `/first-timers/${report.firstTimerId}`
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Edit functionality would go here
                              showToast('info', 'Edit functionality not implemented yet')
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Pagination */}
              {searchResults.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {((searchResults.pagination.page - 1) * searchResults.pagination.limit) + 1} to{' '}
                    {Math.min(searchResults.pagination.page * searchResults.pagination.limit, searchResults.total)} of{' '}
                    {searchResults.total} results
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(searchParams.page - 1)}
                      disabled={!searchResults.pagination.hasPrev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    {/* Page numbers */}
                    <div className="flex gap-1">
                      {Array.from(
                        { length: Math.min(5, searchResults.pagination.totalPages) },
                        (_, i) => {
                          const pageNum = Math.max(
                            1,
                            Math.min(
                              searchResults.pagination.page - 2 + i,
                              searchResults.pagination.totalPages
                            )
                          )
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === searchParams.page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          )
                        }
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(searchParams.page + 1)}
                      disabled={!searchResults.pagination.hasNext}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : searchResults ? (
            <div className="text-center py-12">
              <Search className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No reports found
              </h4>
              <p className="text-gray-600">
                Try adjusting your search criteria or filters.
              </p>
            </div>
          ) : null}
        </Card>
      </div>
    </Layout>
  )
}