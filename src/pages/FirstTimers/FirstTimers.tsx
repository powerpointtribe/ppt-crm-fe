import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Filter, Phone, Mail, Calendar, UserCheck, Clock,
  AlertCircle, CheckCircle, Eye, Edit, Trash2, UserPlus, Download,
  Archive, Star, MapPin, Users, TrendingUp, UserCog, X, Check,
  MoreHorizontal, MessageCircle, Video, User, Save, ChevronDown,
  PhoneCall, MessageSquare, ExternalLink, CalendarPlus
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import SearchInput from '@/components/ui/SearchInput'
import { BulkSelectableTable, BulkSelectHeader, BulkSelectRow, TableBody, TableHead, TableCell } from '@/components/ui/BulkSelectableTable'
import BulkActions, { commonBulkActions, BulkAction } from '@/components/ui/BulkActions'
import BulkConfirmationModal from '@/components/ui/BulkConfirmationModal'
import BulkProgressModal from '@/components/ui/BulkProgressModal'
import BulkEditModal from '@/components/ui/BulkEditModal'
import { useBulkSelection } from '@/hooks/useBulkSelection'
import { FirstTimer, FirstTimerSearchParams, firstTimersService } from '@/services/first-timers'
import { membersService, Member } from '@/services/members-unified'
import { bulkOperationsService } from '@/services/bulkOperations'
import { downloadCSV, BulkOperationProgress } from '@/utils/bulkOperations'
import { formatDate } from '@/utils/formatters'

export default function FirstTimers() {
  const navigate = useNavigate()
  const [firstTimers, setFirstTimers] = useState<FirstTimer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [searchParams, setSearchParams] = useState<FirstTimerSearchParams>({
    page: 1,
    limit: 10,
    search: ''
  })
  const [pagination, setPagination] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)

  // Inline editing state
  const [editingItem, setEditingItem] = useState<{
    id: string
    field: string
    value: string
  } | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  // Action menu state
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)

  // Bulk operations state
  const bulkSelection = useBulkSelection<FirstTimer>()
  const [bulkConfirmation, setBulkConfirmation] = useState<{
    isOpen: boolean
    action: 'delete' | 'export' | 'archive' | 'assign'
    title?: string
    message?: string
  }>({ isOpen: false, action: 'delete' })

  const [bulkProgress, setBulkProgress] = useState<{
    isOpen: boolean
    operation: string
    progress: BulkOperationProgress
    isComplete: boolean
    errors: string[]
  }>({
    isOpen: false,
    operation: '',
    progress: { total: 0, processed: 0, failed: 0 },
    isComplete: false,
    errors: []
  })

  const [bulkEdit, setBulkEdit] = useState<{
    isOpen: boolean
    loading: boolean
  }>({
    isOpen: false,
    loading: false
  })

  // Assignment modal state
  const [assignmentModal, setAssignmentModal] = useState<{
    isOpen: boolean
    firstTimerId: string | null
    loading: boolean
  }>({
    isOpen: false,
    firstTimerId: null,
    loading: false
  })

  const [allMembers, setAllMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(false)

  const loadFirstTimers = useCallback(async () => {
    try {
      // Only show loading spinner for pagination/filters, not search (since SearchInput handles that)
      if (searchParams.page === 1 && !searchParams.search) {
        setLoading(true)
      }
      setError(null)
      const response = await firstTimersService.getFirstTimers(searchParams)
      setFirstTimers(response.items || [])
      setPagination(response.pagination)
    } catch (error: any) {
      console.error('Error loading first timers:', error)
      if (error.code === 401) {
        setError({
          status: 401,
          message: 'Authentication required to view first timers',
          details: error.message
        })
      } else {
        setError({
          status: error.code || 500,
          message: 'Failed to load first timers',
          details: error.message
        })
      }
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    loadFirstTimers()
  }, [loadFirstTimers])

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const statsData = await firstTimersService.getFirstTimerStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error loading first timer stats:', error)
    }
  }

  const loadAllMembers = async () => {
    try {
      setMembersLoading(true)
      const response = await membersService.getMembers({
        limit: 200,
        status: 'active'
      })
      setAllMembers(response.items || [])
    } catch (error) {
      console.error('Error loading members:', error)
    } finally {
      setMembersLoading(false)
    }
  }

  // Inline editing functions
  const handleInlineEdit = (id: string, field: string, currentValue: string) => {
    setEditingItem({ id, field, value: currentValue })
    setActionMenuOpen(null)
  }

  const handleSaveEdit = async () => {
    if (!editingItem) return

    try {
      setSavingEdit(true)
      await firstTimersService.updateFirstTimer(editingItem.id, {
        [editingItem.field]: editingItem.value
      })

      // Update local state
      setFirstTimers(prev => prev.map(visitor =>
        visitor._id === editingItem.id
          ? { ...visitor, [editingItem.field]: editingItem.value }
          : visitor
      ))

      setEditingItem(null)
    } catch (error) {
      console.error('Error updating first timer:', error)
    } finally {
      setSavingEdit(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
  }

  // Quick actions
  const handleQuickStatusChange = async (id: string, newStatus: string) => {
    try {
      await firstTimersService.updateFirstTimer(id, { status: newStatus })
      setFirstTimers(prev => prev.map(visitor =>
        visitor._id === id ? { ...visitor, status: newStatus } : visitor
      ))
      setActionMenuOpen(null)
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleAssignToMember = (firstTimerId: string) => {
    setAssignmentModal({
      isOpen: true,
      firstTimerId,
      loading: false
    })
    if (allMembers.length === 0) {
      loadAllMembers()
    }
    setActionMenuOpen(null)
  }

  const handleAssignmentSubmit = async (memberId: string, firstTimerId?: string) => {
    const targetId = firstTimerId || assignmentModal.firstTimerId
    if (!targetId) return

    try {
      if (assignmentModal.firstTimerId) {
        setAssignmentModal(prev => ({ ...prev, loading: true }))
      }

      await firstTimersService.assignToUser(targetId, memberId)
      await loadFirstTimers()

      if (assignmentModal.firstTimerId) {
        setAssignmentModal({
          isOpen: false,
          firstTimerId: null,
          loading: false
        })
      }
    } catch (error) {
      console.error('Error assigning first timer:', error)
      if (assignmentModal.firstTimerId) {
        setAssignmentModal(prev => ({ ...prev, loading: false }))
      }
    }
  }

  const handleSearch = useCallback((search: string) => {
    setSearchParams(prev => ({ ...prev, search, page: 1 }))
  }, [])

  const handleFilter = useCallback((filters: Partial<FirstTimerSearchParams>) => {
    setSearchParams(prev => ({ ...prev, ...filters, page: 1 }))
  }, [])

  // Bulk operations handlers
  const handleBulkDelete = () => {
    setBulkConfirmation({
      isOpen: true,
      action: 'delete'
    })
  }

  const handleBulkExport = () => {
    const selectedVisitors = bulkSelection.getSelectedItems(firstTimers)
    downloadCSV(selectedVisitors, 'first_timers_export', [
      '_id', 'firstName', 'lastName', 'phone', 'email', 'dateOfVisit',
      'visitorType', 'status', 'howDidYouHear', 'occupation'
    ])
    bulkSelection.clearSelection()
  }

  const handleBulkStatusUpdate = () => {
    setBulkEdit({ isOpen: true, loading: false })
    if (allMembers.length === 0) {
      loadAllMembers()
    }
  }

  const confirmBulkOperation = async () => {
    const selectedIds = Array.from(bulkSelection.selectedItems)
    const action = bulkConfirmation.action

    setBulkConfirmation({ isOpen: false, action: 'delete' })
    setBulkProgress({
      isOpen: true,
      operation: action === 'delete' ? 'Deleting' : 'Processing',
      progress: { total: selectedIds.length, processed: 0, failed: 0 },
      isComplete: false,
      errors: []
    })

    try {
      let result

      if (action === 'delete') {
        result = await bulkOperationsService.bulkDelete('first-timers', selectedIds, (progress) => {
          setBulkProgress(prev => ({ ...prev, progress }))
        })
      }

      if (result) {
        setBulkProgress(prev => ({
          ...prev,
          isComplete: true,
          errors: result.errors || []
        }))

        await loadFirstTimers()
        bulkSelection.clearSelection()
      }
    } catch (error) {
      setBulkProgress(prev => ({
        ...prev,
        isComplete: true,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      }))
    }
  }

  const handleBulkEditSubmit = async (data: any) => {
    const selectedIds = Array.from(bulkSelection.selectedItems)
    setBulkEdit(prev => ({ ...prev, loading: true }))

    setBulkProgress({
      isOpen: true,
      operation: 'Updating',
      progress: { total: selectedIds.length, processed: 0, failed: 0 },
      isComplete: false,
      errors: []
    })

    try {
      const result = await bulkOperationsService.bulkUpdate('first-timers', selectedIds, data, (progress) => {
        setBulkProgress(prev => ({ ...prev, progress }))
      })

      setBulkProgress(prev => ({
        ...prev,
        isComplete: true,
        errors: result.errors || []
      }))

      setBulkEdit({ isOpen: false, loading: false })
      await loadFirstTimers()
      bulkSelection.clearSelection()
    } catch (error) {
      setBulkProgress(prev => ({
        ...prev,
        isComplete: true,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      }))
      setBulkEdit(prev => ({ ...prev, loading: false }))
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      not_contacted: {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertCircle,
        label: 'Not Contacted'
      },
      contacted: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Phone,
        label: 'Contacted'
      },
      scheduled_visit: {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Calendar,
        label: 'Visit Scheduled'
      },
      visited: {
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: UserCheck,
        label: 'Visited'
      },
      joined_group: {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        label: 'Joined Group'
      },
      converted: {
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: UserPlus,
        label: 'Converted'
      },
      lost_contact: {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Clock,
        label: 'Lost Contact'
      }
    }
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.not_contacted
  }

  const getVisitorTypeBadge = (type: string) => {
    const typeColors = {
      first_time: 'bg-blue-100 text-blue-800 border-blue-200',
      returning: 'bg-green-100 text-green-800 border-green-200',
      new_to_area: 'bg-purple-100 text-purple-800 border-purple-200',
      church_shopping: 'bg-orange-100 text-orange-800 border-orange-200'
    }
    return typeColors[type as keyof typeof typeColors] || typeColors.first_time
  }

  const getDaysSinceVisit = (dateOfVisit: string) => {
    const visitDate = new Date(dateOfVisit)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - visitDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const needsFollowUp = (firstTimer: FirstTimer) => {
    const daysSinceVisit = getDaysSinceVisit(firstTimer.dateOfVisit)
    const lastFollowUp = firstTimer.followUps[firstTimer.followUps.length - 1]

    if (!lastFollowUp && daysSinceVisit > 3) return true
    if (lastFollowUp && lastFollowUp.nextFollowUpDate) {
      const nextFollowUpDate = new Date(lastFollowUp.nextFollowUpDate)
      return nextFollowUpDate <= new Date()
    }
    return false
  }

  // Define bulk actions
  const bulkActions: BulkAction[] = [
    commonBulkActions.export(handleBulkExport),
    {
      id: 'status',
      label: 'Update Status',
      icon: <Edit className="w-4 h-4" />,
      variant: 'secondary',
      onClick: handleBulkStatusUpdate
    },
    commonBulkActions.delete(handleBulkDelete)
  ]

  // Bulk edit fields configuration
  const bulkEditFields = [
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'not_contacted', label: 'Not Contacted' },
        { value: 'contacted', label: 'Contacted' },
        { value: 'scheduled_visit', label: 'Visit Scheduled' },
        { value: 'visited', label: 'Visited' },
        { value: 'joined_group', label: 'Joined Group' },
        { value: 'converted', label: 'Converted' },
        { value: 'lost_contact', label: 'Lost Contact' }
      ]
    },
    {
      key: 'assignedTo',
      label: 'Assign to Member',
      type: 'select' as const,
      options: [
        { value: '', label: 'Select member...' },
        ...allMembers.map(member => ({
          value: member._id,
          label: `${member.firstName} ${member.lastName}${member.phone ? ` - ${member.phone}` : ''}${member.unitType ? ` (${member.unitType.toUpperCase()})` : ''}`
        }))
      ]
    }
  ]

  // Only show full page loading on initial load
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

  const isAllSelected = firstTimers.length > 0 && firstTimers.every(visitor => bulkSelection.selectedItems.has(visitor._id))
  const isIndeterminate = firstTimers.some(visitor => bulkSelection.selectedItems.has(visitor._id)) && !isAllSelected

  return (
    <Layout
      title="First Timers"
      headerActions={
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/first-timers/follow-up-schedule')}
            className="hidden sm:flex"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Follow-up Schedule
          </Button>
          <Button onClick={() => navigate('/first-timers/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Visitor
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Bulk Actions Bar */}
        <BulkActions
          selectedCount={bulkSelection.getSelectedCount()}
          totalCount={firstTimers.length}
          onClearSelection={bulkSelection.clearSelection}
          actions={bulkActions}
        />

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total || 0}</p>
                </div>
                <UserPlus className="h-8 w-8 text-blue-500" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Need Follow-up</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.needingFollowUp || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Converted</p>
                  <p className="text-2xl font-bold text-green-600">{stats.converted || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </Card>
          </div>
        )}


        {/* Search and Filter */}
        <div className="flex gap-4">
          <SearchInput
            placeholder="Search by name..."
            onSearch={handleSearch}
            defaultValue={searchParams.search}
            debounceMs={500}
            className="flex-1"
          />
          <select
            value={searchParams.status || ''}
            onChange={(e) => handleFilter({ status: e.target.value as any || undefined })}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Status</option>
            <option value="not_contacted">Not Contacted</option>
            <option value="contacted">Contacted</option>
            <option value="visited">Visited</option>
            <option value="converted">Converted</option>
          </select>
        </div>

        {/* Modern Visitor Cards Layout */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" />
              <span className="ml-2 text-gray-600">Loading visitors...</span>
            </div>
          ) : (
            firstTimers?.map((visitor, index) => {
              const statusConfig = getStatusBadge(visitor.status)
              const StatusIcon = statusConfig.icon
              const daysSinceVisit = getDaysSinceVisit(visitor.dateOfVisit)
              const needsAttention = needsFollowUp(visitor)

              return (
                <div
                  key={visitor._id}
                  className={`bg-white rounded-lg border ${needsAttention ? 'border-orange-200 bg-orange-50' : 'border-gray-200'} shadow-sm hover:shadow-md transition-all duration-200`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={bulkSelection.selectedItems.has(visitor._id)}
                          onChange={() => bulkSelection.selectItem(visitor._id)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {visitor.firstName.charAt(0)}{visitor.lastName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {visitor.firstName} {visitor.lastName}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{visitor.phone}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                            {needsAttention && (
                              <span className="text-orange-600 text-xs">Needs follow-up</span>
                            )}
                            {visitor.assignedTo && (
                              <span className="text-blue-600 text-xs">
                                Assigned: {typeof visitor.assignedTo === 'object' ? `${visitor.assignedTo?.firstName} ${visitor.assignedTo?.lastName}` : visitor.assignedTo}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleQuickStatusChange(visitor._id, 'contacted')}
                          className="p-2"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAssignToMember(visitor._id)}
                          className="p-2"
                        >
                          <UserCog className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActionMenuOpen(actionMenuOpen === visitor._id ? null : visitor._id)}
                          className="p-2"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>

                        <AnimatePresence>
                          {actionMenuOpen === visitor._id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border z-10"
                            >
                              <div className="py-1">
                                <button
                                  onClick={() => navigate(`/first-timers/${visitor._id}`)}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50"
                                >
                                  <Eye className="h-4 w-4" />
                                  View
                                </button>
                                <button
                                  onClick={() => navigate(`/first-timers/${visitor._id}/edit`)}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleQuickStatusChange(visitor._id, 'converted')}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-green-700 hover:bg-green-50"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Convert
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {firstTimers.length === 0 && (
          <div className="text-center py-12">
            <UserPlus className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No visitors found</h3>
            <p className="text-gray-600 mb-4">Start tracking your church visitors and follow-ups.</p>
            <Button onClick={() => navigate('/first-timers/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Visitor
            </Button>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={!pagination.hasPrev || loading}
                onClick={() => setSearchParams(prev => ({ ...prev, page: prev.page! - 1 }))}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={!pagination.hasNext || loading}
                onClick={() => setSearchParams(prev => ({ ...prev, page: prev.page! + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Confirmation Modal */}
      <BulkConfirmationModal
        isOpen={bulkConfirmation.isOpen}
        onClose={() => setBulkConfirmation({ isOpen: false, action: 'delete' })}
        onConfirm={confirmBulkOperation}
        action={bulkConfirmation.action}
        selectedCount={bulkSelection.getSelectedCount()}
        entityName="visitor"
        customTitle={bulkConfirmation.title}
        customMessage={bulkConfirmation.message}
      />

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={bulkEdit.isOpen}
        onClose={() => setBulkEdit({ isOpen: false, loading: false })}
        onSave={handleBulkEditSubmit}
        fields={bulkEditFields}
        selectedCount={bulkSelection.getSelectedCount()}
        entityName="visitor"
        loading={bulkEdit.loading}
      />

      {/* Bulk Progress Modal */}
      <BulkProgressModal
        isOpen={bulkProgress.isOpen}
        onClose={() => setBulkProgress(prev => ({ ...prev, isOpen: false }))}
        operation={bulkProgress.operation}
        entityName="visitor"
        progress={bulkProgress.progress}
        isComplete={bulkProgress.isComplete}
        errors={bulkProgress.errors}
      />

      {/* GIA Assignment Modal */}
      {assignmentModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Assign Member for Follow-up</h3>

            {membersLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
                <span className="ml-2">Loading members...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select GIA Member
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAssignmentSubmit(e.target.value)
                      }
                    }}
                    disabled={assignmentModal.loading}
                    defaultValue=""
                  >
                    <option value="">Select a member for follow-up...</option>
                    {allMembers.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.firstName} {member.lastName}
                        {member.phone && ` - ${member.phone}`}
                        {member.unitType && ` (${member.unitType.toUpperCase()})`}
                      </option>
                    ))}
                  </select>
                </div>

                {allMembers.length === 0 && !membersLoading && (
                  <p className="text-sm text-gray-500">
                    No active members found.
                  </p>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => setAssignmentModal({
                      isOpen: false,
                      firstTimerId: null,
                      loading: false
                    })}
                    disabled={assignmentModal.loading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>

                {assignmentModal.loading && (
                  <div className="flex items-center justify-center py-2">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2 text-sm">Assigning...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}