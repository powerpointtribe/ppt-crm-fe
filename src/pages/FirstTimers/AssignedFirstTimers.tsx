import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Phone, Mail, Calendar, User, Eye, MessageCircle,
  Users, Clock, CheckCircle, TrendingUp, ChevronRight
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { FirstTimer, firstTimersService } from '@/services/first-timers'
import { formatDate } from '@/utils/formatters'

export default function AssignedFirstTimers() {
  const navigate = useNavigate()
  const [firstTimers, setFirstTimers] = useState<FirstTimer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)

  const loadMyAssignments = useCallback(async (page: number = currentPage) => {
    try {
      setLoading(true)
      setError(null)
      const response = await firstTimersService.getMyAssignments({
        page,
        limit: 10
      })
      setFirstTimers(response.items || [])
      setPagination(response.pagination)
      setCurrentPage(page)
    } catch (error: any) {
      console.error('Error loading my assignments:', error)
      setError({
        status: error.code || 500,
        message: 'Failed to load your assigned first-timers',
        details: error.message
      })
    } finally {
      setLoading(false)
    }
  }, [currentPage])

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const response = await firstTimersService.getFirstTimerStats()
      setStats(response)
    } catch (error: any) {
      console.error('Error loading stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMyAssignments()
    loadStats()
  }, [loadMyAssignments, loadStats])

  // Pagination handlers
  const handlePrevPage = () => {
    if (pagination && pagination.hasPrev) {
      const prevPage = currentPage - 1
      loadMyAssignments(prevPage)
    }
  }

  const handleNextPage = () => {
    if (pagination && pagination.hasNext) {
      const nextPage = currentPage + 1
      loadMyAssignments(nextPage)
    }
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && pagination && page <= pagination.totalPages) {
      loadMyAssignments(page)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_contacted': return 'bg-red-100 text-red-800'
      case 'contacted': return 'bg-blue-100 text-blue-800'
      case 'scheduled_visit': return 'bg-yellow-100 text-yellow-800'
      case 'visited': return 'bg-green-100 text-green-800'
      case 'joined_group': return 'bg-purple-100 text-purple-800'
      case 'converted': return 'bg-emerald-100 text-emerald-800'
      case 'lost_contact': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_contacted': return 'Not Contacted'
      case 'contacted': return 'Contacted'
      case 'scheduled_visit': return 'Visit Scheduled'
      case 'visited': return 'Visited'
      case 'joined_group': return 'Joined Group'
      case 'converted': return 'Converted'
      case 'lost_contact': return 'Lost Contact'
      default: return status
    }
  }

  const getIntegrationStageColor = (stage: string) => {
    switch (stage) {
      case 'none': return 'bg-gray-100 text-gray-800'
      case 'assigned_to_district': return 'bg-blue-100 text-blue-800'
      case 'started_cohort': return 'bg-yellow-100 text-yellow-800'
      case 'baptism_class': return 'bg-purple-100 text-purple-800'
      case 'baptized': return 'bg-green-100 text-green-800'
      case 'cell_group': return 'bg-indigo-100 text-indigo-800'
      case 'ministry_assigned': return 'bg-pink-100 text-pink-800'
      case 'leadership_training': return 'bg-orange-100 text-orange-800'
      case 'fully_integrated': return 'bg-emerald-100 text-emerald-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getIntegrationStageLabel = (stage: string) => {
    switch (stage) {
      case 'none': return 'Not Started'
      case 'assigned_to_district': return 'District Assigned'
      case 'started_cohort': return 'Starting Cohort'
      case 'baptism_class': return 'Baptism Class'
      case 'baptized': return 'Baptized'
      case 'cell_group': return 'Cell Group'
      case 'ministry_assigned': return 'Ministry Assigned'
      case 'leadership_training': return 'Leadership Training'
      case 'fully_integrated': return 'Fully Integrated'
      default: return stage
    }
  }

  const getPriorityLevel = (firstTimer: FirstTimer) => {
    const daysSinceVisit = Math.floor((Date.now() - new Date(firstTimer.dateOfVisit).getTime()) / (1000 * 60 * 60 * 24))
    const callReportsCount = firstTimer.callReportsCount || 0

    if (daysSinceVisit > 14 && callReportsCount === 0) return { level: 'high', label: 'Urgent' }
    if (daysSinceVisit > 7 && callReportsCount < 2) return { level: 'medium', label: 'Important' }
    if (daysSinceVisit <= 3) return { level: 'low', label: 'New' }
    return { level: 'normal', label: 'Normal' }
  }

  const getPriorityColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading && firstTimers.length === 0) {
    return (
      <Layout title="My Assigned First-Timers">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="My Assigned First-Timers">
        <ErrorBoundary
          error={error}
          onRetry={loadMyAssignments}
          showLogout={error.status === 401}
        />
      </Layout>
    )
  }

  return (
    <Layout title="My Assigned First-Timers">
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assigned</p>
                <p className="text-2xl font-bold text-gray-900">{firstTimers.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Not Contacted</p>
                <p className="text-2xl font-bold text-red-600">
                  {firstTimers.filter(ft => ft.status === 'not_contacted').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {firstTimers.filter(ft => ['contacted', 'scheduled_visit', 'visited'].includes(ft.status)).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {firstTimers.filter(ft => ['joined_group', 'converted'].includes(ft.status)).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* First-Timers List */}
        {firstTimers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No assignments yet</h3>
            <p className="text-gray-500 mb-6">
              You haven't been assigned any first-timers for follow-up yet.
            </p>
            <Button onClick={() => navigate('/first-timers')}>
              View All First-Timers
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Your Follow-up Assignments</h3>
              <p className="text-sm text-gray-600 mt-1">People assigned to you for follow-up and integration</p>
            </div>

            <div className="divide-y divide-gray-200">
              {firstTimers.map((visitor, index) => {
                const priority = getPriorityLevel(visitor)
                const daysSinceVisit = Math.floor((Date.now() - new Date(visitor.dateOfVisit).getTime()) / (1000 * 60 * 60 * 24))

                return (
                  <motion.div
                    key={visitor._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className="p-6 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                          {visitor.firstName.charAt(0)}{visitor.lastName.charAt(0)}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium text-gray-900">
                              {visitor.firstName} {visitor.lastName}
                            </h4>
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(priority.level)}`}>
                              {priority.label}
                            </span>
                          </div>

                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            {visitor.phone && (
                              <div className="flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {visitor.phone}
                              </div>
                            )}
                            {visitor.email && (
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {visitor.email}
                              </div>
                            )}
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Visited {daysSinceVisit} days ago
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 mt-2">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(visitor.status)}`}>
                              {getStatusLabel(visitor.status)}
                            </span>
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getIntegrationStageColor(visitor.integrationStage || 'none')}`}>
                              {getIntegrationStageLabel(visitor.integrationStage || 'none')}
                            </span>
                            {visitor.callReportsCount > 0 && (
                              <span className="inline-flex items-center text-xs text-gray-500">
                                <MessageCircle className="h-3 w-3 mr-1" />
                                {visitor.callReportsCount} report{visitor.callReportsCount !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/first-timers/${visitor._id}`)}
                          className="flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View Details</span>
                        </Button>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.total > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between sm:px-6 mt-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  {/* Mobile pagination */}
                  <Button
                    variant="secondary"
                    onClick={handlePrevPage}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleNextPage}
                    disabled={!pagination.hasNext}
                    className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium"
                  >
                    Next
                  </Button>
                </div>

                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{((currentPage - 1) * 10) + 1}</span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * 10, pagination.total)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{pagination.total}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      {/* Previous button */}
                      <button
                        onClick={handlePrevPage}
                        disabled={!pagination.hasPrev}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>

                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pageNum === currentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}

                      {/* Next button */}
                      <button
                        onClick={handleNextPage}
                        disabled={!pagination.hasNext}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}