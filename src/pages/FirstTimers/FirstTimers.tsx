import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus, Search, Phone, Mail, Calendar, User,
  MoreHorizontal, Eye, Edit, Trash2, UserPlus,
  Users, Clock, CheckCircle, TrendingUp, UserCheck,
  Filter, X, ChevronDown
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import Modal from '@/components/ui/Modal'
import { FirstTimer, FirstTimerSearchParams, firstTimersService } from '@/services/first-timers'
import { Member, membersService } from '@/services/members'
import { formatDate } from '@/utils/formatters'

export default function FirstTimers() {
  const navigate = useNavigate()
  const [firstTimers, setFirstTimers] = useState<FirstTimer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [assignedFilter, setAssignedFilter] = useState('')
  const [visitorTypeFilter, setVisitorTypeFilter] = useState('')
  const [howDidYouHearFilter, setHowDidYouHearFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false)
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [selectedAssignee, setSelectedAssignee] = useState('')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)

  const loadFirstTimers = useCallback(async (page: number = currentPage) => {
    try {
      setLoading(true)
      setError(null)
      const params: FirstTimerSearchParams = {
        page,
        limit: 10,
        search: searchTerm,
        status: statusFilter || undefined,
        assignedTo: assignedFilter || undefined,
        visitorType: visitorTypeFilter || undefined,
        howDidYouHear: howDidYouHearFilter || undefined,
        visitDateFrom: dateFromFilter || undefined,
        visitDateTo: dateToFilter || undefined
      }
      const response = await firstTimersService.getFirstTimers(params)
      setFirstTimers(response.items || [])
      setPagination(response.pagination)
      setCurrentPage(page)
    } catch (error: any) {
      console.error('Error loading first timers:', error)
      setError({
        status: error.code || 500,
        message: 'Failed to load first timers',
        details: error.message
      })
    } finally {
      setLoading(false)
    }
  }, [searchTerm, statusFilter, assignedFilter, visitorTypeFilter, howDidYouHearFilter, dateFromFilter, dateToFilter, currentPage])

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const statsData = await firstTimersService.getFirstTimerStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error loading first timer stats:', error)
      // Set stats to null or empty object to handle error state
      setStats(null)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1)
    loadFirstTimers(1)
  }, [searchTerm, statusFilter, assignedFilter, visitorTypeFilter, howDidYouHearFilter, dateFromFilter, dateToFilter])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const loadMembers = useCallback(async () => {
    try {
      setMembersLoading(true)
      const response = await membersService.getMembers({ limit: 100 })
      setMembers(response.items || [])
    } catch (error: any) {
      console.error('Error loading members:', error)
    } finally {
      setMembersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (showBulkAssignModal) {
      loadMembers()
    }
  }, [showBulkAssignModal, loadMembers])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadFirstTimers(1)
  }

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value)
  }

  const handleAssignedFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAssignedFilter(e.target.value)
  }

  const handleVisitorTypeFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVisitorTypeFilter(e.target.value)
  }

  const handleHowDidYouHearFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setHowDidYouHearFilter(e.target.value)
  }

  const handleDateFromFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFromFilter(e.target.value)
  }

  const handleDateToFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateToFilter(e.target.value)
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setAssignedFilter('')
    setVisitorTypeFilter('')
    setHowDidYouHearFilter('')
    setDateFromFilter('')
    setDateToFilter('')
  }

  // Pagination handlers
  const handlePrevPage = () => {
    if (pagination && pagination.hasPrev) {
      const prevPage = currentPage - 1
      loadFirstTimers(prevPage)
    }
  }

  const handleNextPage = () => {
    if (pagination && pagination.hasNext) {
      const nextPage = currentPage + 1
      loadFirstTimers(nextPage)
    }
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && pagination && page <= pagination.totalPages) {
      loadFirstTimers(page)
    }
  }

  const hasActiveFilters = !!(
    searchTerm || statusFilter || assignedFilter ||
    visitorTypeFilter || howDidYouHearFilter ||
    dateFromFilter || dateToFilter
  )

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this visitor?')) return

    try {
      await firstTimersService.deleteFirstTimer(id)
      setFirstTimers(prev => prev.filter(visitor => visitor._id !== id))
      setActionMenuOpen(null)
      // Reload stats to reflect the updated counts after deletion
      await loadStats()
    } catch (error) {
      console.error('Error deleting visitor:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_contacted': return 'bg-red-100 text-red-800'
      case 'contacted': return 'bg-blue-100 text-blue-800'
      case 'visited': return 'bg-green-100 text-green-800'
      case 'converted': return 'bg-purple-100 text-purple-800'
      case 'lost_contact': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_contacted': return 'Not Contacted'
      case 'contacted': return 'Contacted'
      case 'visited': return 'Visited'
      case 'converted': return 'Converted'
      case 'lost_contact': return 'Lost Contact'
      default: return status
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.length === firstTimers.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(firstTimers.map(ft => ft._id))
    }
  }

  const handleSelectItem = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    )
  }


  const handleBulkAssign = async () => {
    if (selectedIds.length === 0 || !selectedAssignee) return

    try {
      setAssignmentLoading(true)
      await firstTimersService.bulkAssignForFollowUp(
        selectedIds.map(firstTimerId => ({ firstTimerId, assigneeId: selectedAssignee }))
      )

      // Reload data to reflect changes
      await loadFirstTimers()
      await loadStats()

      // Clear selections and close modal
      setSelectedIds([])
      setShowBulkAssignModal(false)
      setSelectedAssignee('')

      // Show success message (you can implement a toast system later)
      alert(`Successfully assigned ${selectedIds.length} first-timers for follow-up`)
    } catch (error: any) {
      console.error('Bulk assignment error:', error)
      alert('Failed to assign first-timers. Please try again.')
    } finally {
      setAssignmentLoading(false)
    }
  }

  if (loading && firstTimers.length === 0) {
    return (
      <Layout title="First Timers">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="First Timers">
        <ErrorBoundary
          error={error}
          onRetry={loadFirstTimers}
          showLogout={error.status === 401}
        />
      </Layout>
    )
  }

  // Search Section to be displayed in header
  const searchSection = (
    <form onSubmit={handleSearch} className="flex gap-3 flex-wrap items-center w-full">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search visitors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          />
        </div>
      </div>

      <select
        value={statusFilter}
        onChange={handleStatusFilter}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
      >
        <option value="">All Status</option>
        <option value="new">New</option>
        <option value="engaged">Engaged</option>
        <option value="closed">Closed</option>
      </select>

      <button
        type="submit"
        className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
      >
        Search
      </button>

      <Button
        variant="secondary"
        onClick={() => navigate('/my-assigned-first-timers')}
      >
        <UserCheck className="h-4 w-4 mr-2" />
        My Assignments
      </Button>

      <Button onClick={() => navigate('/first-timers/new')}>
        <Plus className="h-4 w-4 mr-2" />
        Add Visitor
      </Button>
    </form>
  )

  return (
    <Layout
      title="First Timers"
      searchSection={searchSection}
    >
      <div className="space-y-6">
        {/* Overview Stats */}
        {(stats || statsLoading) && (
          <div className="relative">
            {statsLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                <LoadingSpinner size="md" />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Visitors</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
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
                  <p className="text-sm font-medium text-gray-600">Need Follow-up</p>
                  <p className="text-2xl font-bold text-orange-600">{stats?.needingFollowUp || 0}</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-600" />
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
                  <p className="text-sm font-medium text-gray-600">Converted</p>
                  <p className="text-2xl font-bold text-green-600">{stats?.converted || 0}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
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
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-purple-600">{stats?.thisMonth || 0}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </motion.div>
            </div>
          </div>
        )}

        {/* Visitors Table */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : firstTimers.length === 0 ? (
          <div className="text-center py-16">
            <UserPlus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No visitors found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter ? 'Try adjusting your search or filters' : 'Add your first visitor to get started'}
            </p>
            <Button onClick={() => navigate('/first-timers/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Visitor
            </Button>
          </div>
        ) : (
          <>
            {/* Bulk Actions Toolbar */}
            {selectedIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedIds([])}
                      className="text-blue-700 hover:text-blue-800"
                    >
                      Clear selection
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => setShowBulkAssignModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assign for Follow-up
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === firstTimers.length && firstTimers.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Visitor</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Contact</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Visit Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Assigned To</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {firstTimers.map((visitor, index) => (
                    <motion.tr
                      key={visitor._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(visitor._id)}
                          onChange={() => handleSelectItem(visitor._id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                            {visitor.firstName.charAt(0)}{visitor.lastName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {visitor.firstName} {visitor.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {visitor.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-3 w-3 mr-1" />
                              {visitor.phone}
                            </div>
                          )}
                          {visitor.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-3 w-3 mr-1" />
                              {visitor.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(visitor.dateOfVisit)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(visitor.status)}`}>
                          {getStatusLabel(visitor.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {visitor.assignedTo ? (
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="h-3 w-3 mr-1" />
                            <span>
                              {typeof visitor.assignedTo === 'object'
                                ? `${visitor.assignedTo?.firstName} ${visitor.assignedTo?.lastName}`
                                : visitor.assignedTo
                              }
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center">
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActionMenuOpen(actionMenuOpen === visitor._id ? null : visitor._id)}
                              className="p-1"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>

                            {actionMenuOpen === visitor._id && (
                              <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border z-10">
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      navigate(`/first-timers/${visitor._id}`)
                                      setActionMenuOpen(null)
                                    }}
                                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Eye className="h-3 w-3 mr-2" />
                                    View
                                  </button>
                                  <button
                                    onClick={() => {
                                      navigate(`/first-timers/${visitor._id}/edit`)
                                      setActionMenuOpen(null)
                                    }}
                                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Edit className="h-3 w-3 mr-2" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(visitor._id)}
                                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3 w-3 mr-2" />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between sm:px-6">
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
          </>
        )}
      </div>

      {/* Bulk Assignment Modal */}
      <Modal
        isOpen={showBulkAssignModal}
        onClose={() => {
          setShowBulkAssignModal(false)
          setSelectedAssignee('')
        }}
        title="Assign First-Timers for Follow-up"
        size="md"
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Assign {selectedIds.length} selected first-timer{selectedIds.length !== 1 ? 's' : ''} to a team member for follow-up.
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Team Member
            </label>
            {membersLoading ? (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a team member...</option>
                {members.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.firstName} {member.lastName}
                    {member.leadershipRoles?.isDistrictPastor && ' (District Pastor)'}
                    {member.leadershipRoles?.isChamp && ' (Champ)'}
                    {member.leadershipRoles?.isUnitHead && ' (Unit Head)'}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowBulkAssignModal(false)
                setSelectedAssignee('')
              }}
              disabled={assignmentLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkAssign}
              loading={assignmentLoading}
              disabled={!selectedAssignee || assignmentLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Assign for Follow-up
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}