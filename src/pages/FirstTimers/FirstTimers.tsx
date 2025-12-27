import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus, Phone, Mail, Calendar, User,
  MoreHorizontal, Eye, Edit, Trash2, UserPlus,
  Users, Clock, CheckCircle, TrendingUp, UserCheck,
  X, Filter
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import PageToolbar, { SearchResult } from '@/components/ui/PageToolbar'
import FilterModal from '@/components/ui/FilterModal'
import AssignmentModal from '@/components/ui/AssignmentModal'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { FirstTimer, FirstTimerSearchParams, firstTimersService } from '@/services/first-timers'
import { Member, membersService } from '@/services/members'
import { formatDate } from '@/utils/formatters'
import { useAppStore } from '@/store'

export default function FirstTimers() {
  const navigate = useNavigate()
  const toast = useToast()
  const { selectedBranch, branches } = useAppStore()
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
  const [branchFilter, setBranchFilter] = useState('')
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [showFilterModal, setShowFilterModal] = useState(false)

  // Temp filter states for modal
  const [tempStatusFilter, setTempStatusFilter] = useState('')
  const [tempVisitorTypeFilter, setTempVisitorTypeFilter] = useState('')
  const [tempHowDidYouHearFilter, setTempHowDidYouHearFilter] = useState('')
  const [tempDateFrom, setTempDateFrom] = useState('')
  const [tempDateTo, setTempDateTo] = useState('')
  const [tempBranchFilter, setTempBranchFilter] = useState('')

  // Show branch filter when viewing "All Campuses"
  const showBranchFilter = !selectedBranch && branches.length > 0
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
      // Use selectedBranch if set, otherwise use the filter dropdown
      const effectiveBranchId = selectedBranch?._id || branchFilter || undefined
      const params: FirstTimerSearchParams = {
        page,
        limit: 10,
        search: searchTerm,
        status: statusFilter || undefined,
        assignedTo: assignedFilter || undefined,
        visitorType: visitorTypeFilter || undefined,
        howDidYouHear: howDidYouHearFilter || undefined,
        visitDateFrom: dateFromFilter || undefined,
        visitDateTo: dateToFilter || undefined,
        branchId: effectiveBranchId
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
  }, [searchTerm, statusFilter, assignedFilter, visitorTypeFilter, howDidYouHearFilter, dateFromFilter, dateToFilter, currentPage, selectedBranch, branchFilter])

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
  }, [searchTerm, statusFilter, assignedFilter, visitorTypeFilter, howDidYouHearFilter, dateFromFilter, dateToFilter, branchFilter, selectedBranch])

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

  // Fetch search results for autocomplete
  const fetchSearchResults = useCallback(async (query: string): Promise<SearchResult[]> => {
    try {
      const response = await firstTimersService.getFirstTimers({ search: query, limit: 5 })
      return (response.items || []).map((firstTimer) => ({
        id: firstTimer._id,
        title: `${firstTimer.firstName} ${firstTimer.lastName}`,
        subtitle: firstTimer.email || firstTimer.phone,
        type: 'First Timer',
        path: `/first-timers/${firstTimer._id}`,
        icon: <UserPlus className="h-4 w-4 text-orange-600" />
      }))
    } catch (error) {
      console.error('Error fetching search results:', error)
      return []
    }
  }, [])

  const handleSelectSearchResult = useCallback((result: SearchResult) => {
    navigate(result.path || `/first-timers/${result.id}`)
  }, [navigate])

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

  // Modal filter functions
  const openFilterModal = () => {
    setTempStatusFilter(statusFilter)
    setTempVisitorTypeFilter(visitorTypeFilter)
    setTempHowDidYouHearFilter(howDidYouHearFilter)
    setTempDateFrom(dateFromFilter)
    setTempDateTo(dateToFilter)
    setTempBranchFilter(branchFilter)
    setShowFilterModal(true)
  }

  const closeFilterModal = () => {
    setShowFilterModal(false)
  }

  const applyFilters = () => {
    setStatusFilter(tempStatusFilter)
    setVisitorTypeFilter(tempVisitorTypeFilter)
    setHowDidYouHearFilter(tempHowDidYouHearFilter)
    setDateFromFilter(tempDateFrom)
    setDateToFilter(tempDateTo)
    setBranchFilter(tempBranchFilter)
    setShowFilterModal(false)
  }

  const resetTempFilters = () => {
    setTempStatusFilter('')
    setTempVisitorTypeFilter('')
    setTempHowDidYouHearFilter('')
    setTempDateFrom('')
    setTempDateTo('')
    setTempBranchFilter('')
  }

  const clearAppliedFilters = () => {
    setStatusFilter('')
    setVisitorTypeFilter('')
    setHowDidYouHearFilter('')
    setDateFromFilter('')
    setDateToFilter('')
    setBranchFilter('')
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

  const hasActiveFilters = !!(statusFilter || visitorTypeFilter || howDidYouHearFilter || dateFromFilter || dateToFilter || branchFilter)
  const activeFilterCount = [statusFilter, visitorTypeFilter, howDidYouHearFilter, dateFromFilter, dateToFilter, branchFilter].filter(Boolean).length

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


  const handleBulkAssign = async (assigneeId: string) => {
    if (selectedIds.length === 0 || !assigneeId) return

    try {
      setAssignmentLoading(true)
      await firstTimersService.bulkAssignForFollowUp(
        selectedIds.map(firstTimerId => ({ firstTimerId, assigneeId }))
      )

      // Get assignee name for the toast message
      const assignee = members.find(m => m._id === assigneeId)
      const assigneeName = assignee ? `${assignee.firstName} ${assignee.lastName}` : 'team member'

      // Reload data to reflect changes
      await loadFirstTimers()
      await loadStats()

      // Clear selections and close modal
      setSelectedIds([])
      setShowBulkAssignModal(false)
      setSelectedAssignee('')

      // Show success toast
      toast.success(
        'Assignment Successful',
        `${selectedIds.length} first-timer${selectedIds.length !== 1 ? 's' : ''} assigned to ${assigneeName}`
      )
    } catch (error: any) {
      console.error('Bulk assignment error:', error)
      toast.error(
        'Assignment Failed',
        error.message || 'Failed to assign first-timers. Please try again.'
      )
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

  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'not_contacted', label: 'Not Contacted' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'visited', label: 'Visited' },
    { value: 'converted', label: 'Converted' },
    { value: 'lost_contact', label: 'Lost Contact' },
  ]

  return (
    <Layout title="First Timers" subtitle="Manage visitors and follow-ups">
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

        {/* Page Toolbar with Search, Filters, and Actions */}
        <PageToolbar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchSubmit={handleSearch}
          searchPlaceholder="Search visitors by name, email, or phone..."
          enableAutocomplete={true}
          onFetchResults={fetchSearchResults}
          onSelectResult={handleSelectSearchResult}
          secondaryActions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openFilterModal}
                className={hasActiveFilters ? 'border-primary-500 text-primary-600' : ''}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-500 text-white rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAppliedFilters}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          }
          primaryActions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/my-assigned-first-timers')}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                My Assignments
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/first-timers/new')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Visitor
              </Button>
            </>
          }
        />

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
      <AssignmentModal
        isOpen={showBulkAssignModal}
        onClose={() => {
          setShowBulkAssignModal(false)
          setSelectedAssignee('')
        }}
        onAssign={handleBulkAssign}
        selectedFirstTimers={firstTimers.filter(ft => selectedIds.includes(ft._id))}
        members={members}
        membersLoading={membersLoading}
        assignmentLoading={assignmentLoading}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} />

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={closeFilterModal}
        onApply={applyFilters}
        onReset={resetTempFilters}
        title="Filter Visitors"
        subtitle="Refine your search results"
        activeFilterCount={activeFilterCount}
        filters={[
          ...(showBranchFilter ? [{
            id: 'branch',
            label: 'Campus',
            value: tempBranchFilter,
            onChange: setTempBranchFilter,
            options: branches.map(b => ({ value: b._id, label: b.name })),
            placeholder: 'All Campuses',
          }] : []),
          {
            id: 'status',
            label: 'Follow-up Status',
            value: tempStatusFilter,
            onChange: setTempStatusFilter,
            options: statusOptions,
            placeholder: 'All Status',
          },
          {
            id: 'visitorType',
            label: 'Visitor Type',
            value: tempVisitorTypeFilter,
            onChange: setTempVisitorTypeFilter,
            options: [
              { value: 'first_time', label: 'First Time' },
              { value: 'returning', label: 'Returning' },
            ],
            placeholder: 'All Types',
          },
          {
            id: 'howDidYouHear',
            label: 'How They Heard About Us',
            value: tempHowDidYouHearFilter,
            onChange: setTempHowDidYouHearFilter,
            options: [
              { value: 'friend', label: 'Friend' },
              { value: 'social_media', label: 'Social Media' },
              { value: 'website', label: 'Website' },
              { value: 'flyer', label: 'Flyer' },
              { value: 'other', label: 'Other' },
            ],
            placeholder: 'All Sources',
          },
        ]}
        dateRange={{
          id: 'visitDate',
          label: 'Visit Date Range',
          fromValue: tempDateFrom,
          toValue: tempDateTo,
          onFromChange: setTempDateFrom,
          onToChange: setTempDateTo,
        }}
      />
    </Layout>
  )
}