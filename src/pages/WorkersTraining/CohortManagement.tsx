import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Filter,
  Download,
  BookOpen,
  Users,
  Calendar,
  MapPin,
  Clock,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2
} from 'lucide-react'

import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { workersTrainingService } from '@/services/workers-training'
import { Cohort, CohortStatus, CohortType, CohortQueryParams } from '@/types/workers-training'
import { PaginatedResponse } from '@/types'

export default function CohortManagement() {
  const navigate = useNavigate()
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    count: 0
  })

  const [filters, setFilters] = useState<CohortQueryParams>({
    page: 1,
    limit: 20,
    search: '',
    status: undefined,
    type: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  useEffect(() => {
    fetchCohorts()
  }, [filters])

  const fetchCohorts = async () => {
    try {
      setLoading(true)
      const response: PaginatedResponse<Cohort> = await workersTrainingService.getCohorts(filters)
      setCohorts(response.cohorts || [])
      setPagination(response.pagination)
    } catch (error) {
      console.error('Error fetching cohorts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }))
  }

  const handleStatusFilter = (status: CohortStatus | '') => {
    setFilters(prev => ({
      ...prev,
      status: status || undefined,
      page: 1
    }))
  }

  const handleTypeFilter = (type: CohortType | '') => {
    setFilters(prev => ({
      ...prev,
      type: type || undefined,
      page: 1
    }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleDeleteCohort = async (cohortId: string) => {
    if (confirm('Are you sure you want to delete this cohort? This action cannot be undone.')) {
      try {
        await workersTrainingService.deleteCohort(cohortId)
        fetchCohorts() // Refresh the list
      } catch (error) {
        console.error('Error deleting cohort:', error)
        alert('Failed to delete cohort. Please try again.')
      }
    }
  }

  const getStatusColor = (status: CohortStatus) => {
    const colors = {
      [CohortStatus.PLANNING]: 'bg-gray-100 text-gray-800',
      [CohortStatus.REGISTRATION_OPEN]: 'bg-green-100 text-green-800',
      [CohortStatus.REGISTRATION_CLOSED]: 'bg-yellow-100 text-yellow-800',
      [CohortStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
      [CohortStatus.COMPLETED]: 'bg-purple-100 text-purple-800',
      [CohortStatus.CANCELLED]: 'bg-red-100 text-red-800',
      [CohortStatus.POSTPONED]: 'bg-orange-100 text-orange-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getCapacityColor = (current: number, max: number) => {
    if (max === 0) return 'text-gray-600'
    const percentage = (current / max) * 100
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 75) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-start"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              Cohort Management
            </h1>
            <p className="text-gray-600 mt-1">
              Create and manage training cohorts
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {/* TODO: Export functionality */}}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              onClick={() => navigate('/workers-training/cohorts/new')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Cohort
            </Button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by name, code, or description..."
                    value={filters.search || ''}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <select
                value={filters.status || ''}
                onChange={(e) => handleStatusFilter(e.target.value as CohortStatus | '')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                {Object.values(CohortStatus).map(status => (
                  <option key={status} value={status}>
                    {workersTrainingService.getCohortStatusDisplayName(status)}
                  </option>
                ))}
              </select>

              <select
                value={filters.type || ''}
                onChange={(e) => handleTypeFilter(e.target.value as CohortType | '')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                {Object.values(CohortType).map(type => (
                  <option key={type} value={type}>
                    {workersTrainingService.getCohortTypeDisplayName(type)}
                  </option>
                ))}
              </select>
            </div>
          </Card>
        </motion.div>

        {/* Cohorts List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex space-x-4">
                    <div className="rounded-lg bg-gray-200 h-16 w-16"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Cohort</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Type</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Schedule</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Participants</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Location</th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cohorts.map((cohort) => (
                      <tr
                        key={cohort._id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/workers-training/cohorts/${cohort._id}`)}
                      >
                        <td className="py-6 px-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <BookOpen className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{cohort.name}</p>
                              <p className="text-sm text-gray-500">{cohort.code}</p>
                              {cohort.description && (
                                <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                                  {cohort.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-6">
                          <span className="text-sm text-gray-600">
                            {workersTrainingService.getCohortTypeDisplayName(cohort.type)}
                          </span>
                        </td>
                        <td className="py-6 px-6">
                          <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(cohort.status)}`}>
                            {workersTrainingService.getCohortStatusDisplayName(cohort.status)}
                          </span>
                        </td>
                        <td className="py-6 px-6">
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {new Date(cohort.startDate).toLocaleDateString()} -
                                {new Date(cohort.endDate).toLocaleDateString()}
                              </span>
                            </div>
                            {cohort.meetingDays && (
                              <div className="flex items-center gap-1 text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{cohort.meetingDays}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-6 px-6">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span
                              className={`text-sm font-medium ${getCapacityColor(cohort.currentParticipants, cohort.maxParticipants)}`}
                            >
                              {cohort.currentParticipants} / {cohort.maxParticipants || '∞'}
                            </span>
                          </div>
                        </td>
                        <td className="py-6 px-6">
                          {cohort.venue ? (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-32">{cohort.venue}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Not set</span>
                          )}
                        </td>
                        <td className="py-6 px-6 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/workers-training/cohorts/${cohort._id}`)
                              }}
                              className="flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/workers-training/cohorts/${cohort._id}/edit`)
                              }}
                              className="flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteCohort(cohort._id)
                              }}
                              className="flex items-center gap-1 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {cohorts.length === 0 && (
                  <div className="text-center py-16">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No cohorts found</h3>
                    <p className="text-gray-600 mb-6">
                      {filters.search || filters.status || filters.type
                        ? 'Try adjusting your filters to see more results.'
                        : 'Get started by creating your first training cohort.'
                      }
                    </p>
                    <Button onClick={() => navigate('/workers-training/cohorts/new')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Cohort
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.current - 1) * filters.limit!) + 1} to{' '}
                    {Math.min(pagination.current * filters.limit!, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pagination.current === 1}
                      onClick={() => handlePageChange(pagination.current - 1)}
                    >
                      Previous
                    </Button>

                    {[...Array(Math.min(pagination.pages, 5))].map((_, i) => {
                      const page = i + 1
                      return (
                        <Button
                          key={page}
                          variant={pagination.current === page ? "primary" : "secondary"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      )
                    })}

                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pagination.current === pagination.pages}
                      onClick={() => handlePageChange(pagination.current + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </Layout>
  )
}