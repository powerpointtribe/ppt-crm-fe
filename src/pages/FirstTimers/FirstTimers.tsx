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

      let updateData: any = {}

      if (editingItem.field === 'name') {
        // Split the name into first and last name
        const nameParts = editingItem.value.trim().split(' ')
        updateData.firstName = nameParts[0] || ''
        updateData.lastName = nameParts.slice(1).join(' ') || ''
      } else {
        updateData[editingItem.field] = editingItem.value
      }

      await firstTimersService.updateFirstTimer(editingItem.id, updateData)

      // Update local state
      setFirstTimers(prev => prev.map(visitor =>
        visitor._id === editingItem.id
          ? { ...visitor, ...updateData }
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
        color: 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300',
        icon: AlertCircle,
        label: 'Not Contacted'
      },
      contacted: {
        color: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300',
        icon: Phone,
        label: 'Contacted'
      },
      scheduled_visit: {
        color: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300',
        icon: Calendar,
        label: 'Visit Scheduled'
      },
      visited: {
        color: 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300',
        icon: UserCheck,
        label: 'Visited'
      },
      joined_group: {
        color: 'bg-gradient-to-r from-cyan-100 to-cyan-200 text-cyan-800 border-cyan-300',
        icon: CheckCircle,
        label: 'Joined Group'
      },
      converted: {
        color: 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300',
        icon: UserPlus,
        label: 'Converted'
      },
      lost_contact: {
        color: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300',
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

        {/* Enhanced Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">Total Visitors</p>
                    <p className="text-3xl font-bold text-blue-900">{stats.total || 0}</p>
                    <p className="text-xs text-blue-600 mt-1">All time</p>
                  </div>
                  <div className="p-3 bg-blue-200 rounded-full">
                    <UserPlus className="h-8 w-8 text-blue-700" />
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 mb-1">Need Follow-up</p>
                    <p className="text-3xl font-bold text-orange-900">{stats.needingFollowUp || 0}</p>
                    <p className="text-xs text-orange-600 mt-1">Require attention</p>
                  </div>
                  <div className="p-3 bg-orange-200 rounded-full">
                    <Clock className="h-8 w-8 text-orange-700" />
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-600 mb-1">Converted</p>
                    <p className="text-3xl font-bold text-emerald-900">{stats.converted || 0}</p>
                    <p className="text-xs text-emerald-600 mt-1">Success rate</p>
                  </div>
                  <div className="p-3 bg-emerald-200 rounded-full">
                    <CheckCircle className="h-8 w-8 text-emerald-700" />
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        )}


        {/* Enhanced Search and Filter */}
        <Card className="p-6 bg-gradient-to-r from-gray-50 to-white mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Search visitors by name, phone, or email..."
                onSearch={handleSearch}
                defaultValue={searchParams.search}
                debounceMs={500}
                className="w-full"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={searchParams.status || ''}
                onChange={(e) => handleFilter({ status: e.target.value as any || undefined })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
              >
                <option value="">All Status</option>
                <option value="not_contacted">Not Contacted</option>
                <option value="contacted">Contacted</option>
                <option value="visited">Visited</option>
                <option value="converted">Converted</option>
                <option value="lost_contact">Lost Contact</option>
              </select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchParams({ page: 1, limit: 10, search: '' })
                  handleSearch('')
                }}
                className="px-4 py-2 text-sm"
              >
                Clear
              </Button>
            </div>
          </div>
        </Card>

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

              // Dynamic avatar colors based on visitor characteristics
              const getAvatarColor = (visitor: any) => {
                if (visitor.status === 'converted') return 'from-emerald-500 to-emerald-600'
                if (visitor.status === 'visited') return 'from-purple-500 to-purple-600'
                if (visitor.status === 'contacted') return 'from-green-500 to-green-600'
                if (visitor.status === 'not_contacted') return 'from-red-500 to-red-600'
                if (visitor.assignedTo) return 'from-indigo-500 to-indigo-600'
                return 'from-blue-500 to-blue-600'
              }

              const getRingColor = (visitor: any) => {
                if (visitor.status === 'converted') return 'ring-emerald-100'
                if (visitor.status === 'visited') return 'ring-purple-100'
                if (visitor.status === 'contacted') return 'ring-green-100'
                if (visitor.status === 'not_contacted') return 'ring-red-100'
                if (visitor.assignedTo) return 'ring-indigo-100'
                return 'ring-blue-100'
              }

              const getCardBorder = (visitor: any, needsAttention: boolean) => {
                if (needsAttention) return 'border-orange-200 bg-gradient-to-r from-orange-50 to-orange-25'
                if (visitor.status === 'converted') return 'border-emerald-200 hover:border-emerald-300'
                if (visitor.status === 'visited') return 'border-purple-200 hover:border-purple-300'
                if (visitor.status === 'contacted') return 'border-green-200 hover:border-green-300'
                if (visitor.status === 'not_contacted') return 'border-red-200 hover:border-red-300'
                return 'border-gray-100 hover:border-blue-200'
              }

              return (
                <motion.div
                  key={visitor._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`bg-white rounded-xl border-2 ${getCardBorder(visitor, needsAttention)} shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
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
                        <div className={`w-10 h-10 bg-gradient-to-br ${getAvatarColor(visitor)} rounded-full flex items-center justify-center text-white font-bold shadow-md ring-2 ${getRingColor(visitor)}`}>
                          {visitor.firstName.charAt(0)}{visitor.lastName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          {/* Inline editable name */}
                          {editingItem?.id === visitor._id && editingItem?.field === 'name' ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingItem.value}
                                onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                                className="font-semibold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none"
                                autoFocus
                              />
                              <Button size="sm" onClick={handleSaveEdit} disabled={savingEdit}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <h3
                              className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                              onClick={() => handleInlineEdit(visitor._id, 'name', `${visitor.firstName} ${visitor.lastName}`)}
                              title="Click to edit name"
                            >
                              {visitor.firstName} {visitor.lastName}
                            </h3>
                          )}

                          <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                            {/* Inline editable phone */}
                            {editingItem?.id === visitor._id && editingItem?.field === 'phone' ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingItem.value}
                                  onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                                  className="bg-transparent border-b border-blue-500 focus:outline-none"
                                  autoFocus
                                />
                                <Button size="sm" onClick={handleSaveEdit} disabled={savingEdit}>
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <span
                                className="cursor-pointer hover:text-blue-600"
                                onClick={() => handleInlineEdit(visitor._id, 'phone', visitor.phone)}
                                title="Click to edit phone"
                              >
                                {visitor.phone}
                              </span>
                            )}

                            {/* Inline editable status */}
                            {editingItem?.id === visitor._id && editingItem?.field === 'status' ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={editingItem.value}
                                  onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                                  className="text-xs border rounded px-1 py-1"
                                  autoFocus
                                >
                                  <option value="not_contacted">Not Contacted</option>
                                  <option value="contacted">Contacted</option>
                                  <option value="visited">Visited</option>
                                  <option value="converted">Converted</option>
                                  <option value="lost_contact">Lost Contact</option>
                                </select>
                                <Button size="sm" onClick={handleSaveEdit} disabled={savingEdit}>
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <span
                                className={`px-2 py-1 rounded-full text-xs cursor-pointer hover:opacity-80 ${statusConfig.color}`}
                                onClick={() => handleInlineEdit(visitor._id, 'status', visitor.status)}
                                title="Click to edit status"
                              >
                                {statusConfig.label}
                              </span>
                            )}

                            {needsAttention && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Needs follow-up
                              </span>
                            )}
                            {visitor.assignedTo && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 border border-indigo-300">
                                <User className="h-3 w-3 mr-1" />
                                {typeof visitor.assignedTo === 'object' ? `${visitor.assignedTo?.firstName} ${visitor.assignedTo?.lastName}` : visitor.assignedTo}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickStatusChange(visitor._id, 'contacted')}
                          title="Mark as Contacted"
                          className={`p-1.5 transition-all duration-200 ${
                            visitor.status === 'contacted'
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300'
                          }`}
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </Button>

                        {/* Assign Member Dropdown */}
                        <div className="relative">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (allMembers.length === 0) loadAllMembers()
                              setActionMenuOpen(actionMenuOpen === `assign-${visitor._id}` ? null : `assign-${visitor._id}`)
                            }}
                            className={`px-3 py-1.5 text-xs transition-all duration-200 shadow-sm ${
                              visitor.assignedTo
                                ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                            }`}
                          >
                            <UserCog className="h-3 w-3 mr-1" />
                            {visitor.assignedTo ? 'Reassign' : 'Assign'}
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </Button>

                          <AnimatePresence>
                            {actionMenuOpen === `assign-${visitor._id}` && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute right-0 mt-1 w-64 bg-white rounded-md shadow-lg border z-20 max-h-48 overflow-y-auto"
                              >
                                <div className="py-1">
                                  <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b">
                                    Assign for Follow-up
                                  </div>
                                  {membersLoading ? (
                                    <div className="px-3 py-4 text-center">
                                      <LoadingSpinner size="sm" />
                                    </div>
                                  ) : (
                                    allMembers.map((member) => (
                                      <button
                                        key={member._id}
                                        onClick={() => {
                                          handleAssignmentSubmit(member._id, visitor._id)
                                          setActionMenuOpen(null)
                                        }}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-blue-50 text-left transition-colors duration-150 border-b border-gray-50 last:border-b-0"
                                      >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md ${
                                          member.unitType === 'gia' ? 'bg-gradient-to-br from-purple-400 to-purple-500' :
                                          member.unitType === 'leadership' ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' :
                                          member.unitType === 'ministry' ? 'bg-gradient-to-br from-green-400 to-green-500' :
                                          member.unitType === 'youth' ? 'bg-gradient-to-br from-blue-400 to-blue-500' :
                                          member.unitType === 'children' ? 'bg-gradient-to-br from-pink-400 to-pink-500' :
                                          'bg-gradient-to-br from-gray-400 to-gray-500'
                                        }`}>
                                          {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="font-semibold text-gray-900 truncate">
                                            {member.firstName} {member.lastName}
                                          </div>
                                          <div className="text-xs text-gray-600 truncate flex items-center gap-2">
                                            <span>{member.phone}</span>
                                            {member.unitType && (
                                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                member.unitType === 'gia' ? 'bg-purple-100 text-purple-700' :
                                                member.unitType === 'leadership' ? 'bg-yellow-100 text-yellow-700' :
                                                member.unitType === 'ministry' ? 'bg-green-100 text-green-700' :
                                                member.unitType === 'youth' ? 'bg-blue-100 text-blue-700' :
                                                member.unitType === 'children' ? 'bg-pink-100 text-pink-700' :
                                                'bg-gray-100 text-gray-600'
                                              }`}>
                                                {member.unitType.toUpperCase()}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </button>
                                    ))
                                  )}
                                  {allMembers.length === 0 && !membersLoading && (
                                    <div className="px-3 py-2 text-sm text-gray-500">
                                      No members found
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActionMenuOpen(actionMenuOpen === `more-${visitor._id}` ? null : `more-${visitor._id}`)}
                          className="p-1.5"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>

                        <AnimatePresence>
                          {actionMenuOpen === `more-${visitor._id}` && (
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
                                  Edit Full Form
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
                </motion.div>
              )
            })
          )}
        </div>

        {firstTimers.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16"
          >
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <UserPlus className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No visitors found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">Start tracking your church visitors and follow-ups to build stronger connections with your community.</p>
            <Button
              onClick={() => navigate('/first-timers/new')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Visitor
            </Button>
          </motion.div>
        )}

        {/* Enhanced Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mt-8"
          >
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  disabled={!pagination.hasPrev || loading}
                  onClick={() => setSearchParams(prev => ({ ...prev, page: prev.page! - 1 }))}
                  className="px-4 py-2"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Page</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg font-medium">
                    {pagination.page}
                  </span>
                  <span className="text-sm text-gray-600">of {pagination.totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  disabled={!pagination.hasNext || loading}
                  onClick={() => setSearchParams(prev => ({ ...prev, page: prev.page! + 1 }))}
                  className="px-4 py-2"
                >
                  Next
                </Button>
              </div>
            </Card>
          </motion.div>
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