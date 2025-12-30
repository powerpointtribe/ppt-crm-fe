import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus, Phone, Mail, Calendar, User,
  MoreHorizontal, Trash2, UserPlus, Edit,
  Users, Clock, CheckCircle, TrendingUp, UserCheck,
  X, Filter, RefreshCw, UserCog, Archive, ArchiveRestore
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
import { FirstTimer, FirstTimerSearchParams, firstTimersService, ArchiveStats, DateRangeFilter } from '@/services/first-timers'
import { Member, membersService } from '@/services/members'
import { Group, groupsService } from '@/services/groups'
import { formatDate } from '@/utils/formatters'
import { useAppStore } from '@/store'

export default function FirstTimers() {
  const navigate = useNavigate()
  const toast = useToast()
  const { selectedBranch, branches } = useAppStore()
  const [activeTab, setActiveTab] = useState<'all' | 'ready' | 'closed' | 'archived'>('all')
  const [dateRange, setDateRange] = useState<DateRangeFilter>('3months')
  const [firstTimers, setFirstTimers] = useState<FirstTimer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [archiveStats, setArchiveStats] = useState<ArchiveStats | null>(null)
  const [archiveModalOpen, setArchiveModalOpen] = useState<string | null>(null)
  const [archiveReason, setArchiveReason] = useState('')
  const [archiveLoading, setArchiveLoading] = useState(false)

  // Bulk archive modal state
  const [showBulkArchiveModal, setShowBulkArchiveModal] = useState(false)
  const [activeFirstTimersForArchive, setActiveFirstTimersForArchive] = useState<FirstTimer[]>([])
  const [activeFirstTimersLoading, setActiveFirstTimersLoading] = useState(false)
  const [selectedForArchive, setSelectedForArchive] = useState<string[]>([])
  const [bulkArchiveReason, setBulkArchiveReason] = useState('')
  const [archiveSearchTerm, setArchiveSearchTerm] = useState('')
  const [showBulkIntegrateModal, setShowBulkIntegrateModal] = useState(false)
  const [integrateLoading, setIntegrateLoading] = useState(false)
  const [districts, setDistricts] = useState<Group[]>([])
  const [units, setUnits] = useState<Group[]>([])
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('')
  const [loadingGroups, setLoadingGroups] = useState(false)
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
  const [showBulkActionsMenu, setShowBulkActionsMenu] = useState(false)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [selectedAssignee, setSelectedAssignee] = useState('')

  // Status update modal state
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedFirstTimerForStatus, setSelectedFirstTimerForStatus] = useState<FirstTimer | null>(null)
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)

  const loadFirstTimers = useCallback(async (page: number = currentPage, tab: 'all' | 'ready' | 'closed' | 'archived' = activeTab) => {
    try {
      setLoading(true)
      setError(null)
      // Use selectedBranch if set, otherwise use the filter dropdown
      const effectiveBranchId = selectedBranch?._id || branchFilter || undefined
      const params: FirstTimerSearchParams = {
        page,
        limit: 10,
        search: searchTerm,
        status: statusFilter as FirstTimer['status'] || undefined,
        assignedTo: assignedFilter || undefined,
        visitorType: visitorTypeFilter || undefined,
        howDidYouHear: howDidYouHearFilter || undefined,
        visitDateFrom: dateFromFilter || undefined,
        visitDateTo: dateToFilter || undefined,
        branchId: effectiveBranchId,
        dateRange: dateRange,
      }

      // Use different API based on active tab
      let response
      if (tab === 'archived') {
        response = await firstTimersService.getArchivedFirstTimers(params)
      } else if (tab === 'ready') {
        response = await firstTimersService.getReadyForIntegration(params)
      } else if (tab === 'closed') {
        // Closed tab - show first timers with CLOSED status
        response = await firstTimersService.getFirstTimers({ ...params, status: 'CLOSED' })
      } else {
        // "All Visitors" tab - show all first timers (filter by status if selected)
        response = await firstTimersService.getFirstTimers(params)
      }

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
  }, [searchTerm, statusFilter, assignedFilter, visitorTypeFilter, howDidYouHearFilter, dateFromFilter, dateToFilter, currentPage, selectedBranch, branchFilter, activeTab, dateRange])

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

  const loadArchiveStats = useCallback(async () => {
    try {
      const archiveStatsData = await firstTimersService.getArchiveStats()
      setArchiveStats(archiveStatsData)
    } catch (error) {
      console.error('Error loading archive stats:', error)
      setArchiveStats(null)
    }
  }, [])

  useEffect(() => {
    // Reset to page 1 when filters or tab change
    setCurrentPage(1)
    loadFirstTimers(1, activeTab)
  }, [searchTerm, statusFilter, assignedFilter, visitorTypeFilter, howDidYouHearFilter, dateFromFilter, dateToFilter, branchFilter, selectedBranch, activeTab])

  useEffect(() => {
    loadStats()
    loadArchiveStats()
  }, [loadStats, loadArchiveStats])

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

  // Close bulk actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showBulkActionsMenu) {
        const target = event.target as HTMLElement
        if (!target.closest('[data-bulk-actions-menu]')) {
          setShowBulkActionsMenu(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showBulkActionsMenu])

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
      case 'NEW': return 'bg-blue-100 text-blue-800'
      case 'ENGAGED': return 'bg-yellow-100 text-yellow-800'
      case 'READY_FOR_INTEGRATION': return 'bg-green-100 text-green-800'
      case 'ARCHIVED': return 'bg-orange-100 text-orange-800'
      case 'CLOSED': return 'bg-purple-100 text-purple-800'
      // Legacy status values
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
      case 'NEW': return 'New'
      case 'ENGAGED': return 'Engaged'
      case 'READY_FOR_INTEGRATION': return 'Ready for Integration'
      case 'ARCHIVED': return 'Archived'
      case 'CLOSED': return 'Closed'
      // Legacy status values
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

  const handleArchive = async (id: string, reason?: string) => {
    try {
      setArchiveLoading(true)
      await firstTimersService.archiveFirstTimer(id, reason)
      toast.success('Archived', 'First-timer has been archived successfully')
      setArchiveModalOpen(null)
      setArchiveReason('')
      setActionMenuOpen(null)
      await loadFirstTimers()
      await loadStats()
      await loadArchiveStats()
    } catch (error: any) {
      console.error('Archive error:', error)
      toast.error('Archive Failed', error.message || 'Failed to archive first-timer')
    } finally {
      setArchiveLoading(false)
    }
  }

  const handleUnarchive = async (id: string) => {
    try {
      setArchiveLoading(true)
      await firstTimersService.unarchiveFirstTimer(id)
      toast.success('Restored', 'First-timer has been restored successfully')
      setActionMenuOpen(null)
      await loadFirstTimers()
      await loadStats()
      await loadArchiveStats()
    } catch (error: any) {
      console.error('Unarchive error:', error)
      toast.error('Restore Failed', error.message || 'Failed to restore first-timer')
    } finally {
      setArchiveLoading(false)
    }
  }

  const handleTabChange = (tab: 'all' | 'ready' | 'closed' | 'archived') => {
    setActiveTab(tab)
    setSelectedIds([])
    setSearchTerm('')
    setShowBulkActionsMenu(false)
    clearAppliedFilters()
  }

  const handleDateRangeChange = (range: DateRangeFilter) => {
    setDateRange(range)
    setCurrentPage(1)
  }

  // Reload when dateRange changes
  useEffect(() => {
    loadFirstTimers(1, activeTab)
  }, [dateRange])

  // Load active first timers for bulk archive modal
  const loadActiveFirstTimersForArchive = async () => {
    try {
      setActiveFirstTimersLoading(true)
      const response = await firstTimersService.getFirstTimers({ page: 1, limit: 100 })
      setActiveFirstTimersForArchive(response.items || [])
    } catch (error: any) {
      console.error('Error loading active first timers:', error)
      toast.error('Failed to load', 'Could not load active first timers')
    } finally {
      setActiveFirstTimersLoading(false)
    }
  }

  const openBulkArchiveModal = async () => {
    setShowBulkArchiveModal(true)
    setSelectedForArchive([])
    setBulkArchiveReason('')
    setArchiveSearchTerm('')
    await loadActiveFirstTimersForArchive()
  }

  const handleBulkArchive = async () => {
    if (selectedForArchive.length === 0) {
      toast.error('No selection', 'Please select at least one first-timer to archive')
      return
    }

    try {
      setArchiveLoading(true)
      // Archive each selected first timer
      for (const id of selectedForArchive) {
        await firstTimersService.archiveFirstTimer(id, bulkArchiveReason || undefined)
      }
      toast.success('Archived', `${selectedForArchive.length} first-timer(s) archived successfully`)
      setShowBulkArchiveModal(false)
      setSelectedForArchive([])
      setBulkArchiveReason('')
      await loadFirstTimers()
      await loadStats()
      await loadArchiveStats()
    } catch (error: any) {
      console.error('Bulk archive error:', error)
      toast.error('Archive Failed', error.message || 'Failed to archive first-timers')
    } finally {
      setArchiveLoading(false)
    }
  }

  const handleBulkUnarchive = async () => {
    if (selectedIds.length === 0) {
      toast.error('No selection', 'Please select at least one first-timer to restore')
      return
    }

    try {
      setArchiveLoading(true)
      // Unarchive each selected first timer
      for (const id of selectedIds) {
        await firstTimersService.unarchiveFirstTimer(id)
      }
      toast.success('Restored', `${selectedIds.length} first-timer(s) restored successfully`)
      setSelectedIds([])
      await loadFirstTimers()
      await loadStats()
      await loadArchiveStats()
    } catch (error: any) {
      console.error('Bulk unarchive error:', error)
      toast.error('Restore Failed', error.message || 'Failed to restore first-timers')
    } finally {
      setArchiveLoading(false)
    }
  }

  const handleBulkReadyForIntegration = async () => {
    if (selectedIds.length === 0) {
      toast.error('No selection', 'Please select at least one first-timer')
      return
    }

    try {
      setBulkActionLoading(true)
      setShowBulkActionsMenu(false)
      let successCount = 0
      let skipCount = 0

      for (const id of selectedIds) {
        try {
          await firstTimersService.markReadyForIntegration(id)
          successCount++
        } catch (error: any) {
          // Skip if already marked
          if (error.message?.includes('already marked')) {
            skipCount++
          } else {
            throw error
          }
        }
      }

      let message = `${successCount} first-timer(s) marked as ready for integration`
      if (skipCount > 0) {
        message += ` (${skipCount} already marked)`
      }
      toast.success('Ready for Integration', message)
      setSelectedIds([])
      await loadFirstTimers()
      await loadStats()
    } catch (error: any) {
      console.error('Bulk ready for integration error:', error)
      toast.error('Action Failed', error.message || 'Failed to mark first-timers as ready for integration')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkArchiveSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error('No selection', 'Please select at least one first-timer to archive')
      return
    }

    try {
      setBulkActionLoading(true)
      setShowBulkActionsMenu(false)
      for (const id of selectedIds) {
        await firstTimersService.archiveFirstTimer(id)
      }
      toast.success('Archived', `${selectedIds.length} first-timer(s) archived successfully`)
      setSelectedIds([])
      await loadFirstTimers()
      await loadStats()
      await loadArchiveStats()
    } catch (error: any) {
      console.error('Bulk archive error:', error)
      toast.error('Archive Failed', error.message || 'Failed to archive first-timers')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkUnmarkReady = async () => {
    if (selectedIds.length === 0) {
      toast.error('No selection', 'Please select at least one first-timer')
      return
    }

    try {
      setBulkActionLoading(true)
      setShowBulkActionsMenu(false)
      for (const id of selectedIds) {
        await firstTimersService.unmarkReadyForIntegration(id)
      }
      toast.success('Unmarked', `${selectedIds.length} first-timer(s) unmarked from ready for integration`)
      setSelectedIds([])
      await loadFirstTimers()
      await loadStats()
    } catch (error: any) {
      console.error('Bulk unmark ready error:', error)
      toast.error('Action Failed', error.message || 'Failed to unmark first-timers')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedFirstTimerForStatus) return

    try {
      setStatusUpdateLoading(true)
      const id = selectedFirstTimerForStatus._id

      // Handle different status changes using the appropriate API methods
      if (newStatus === 'READY_FOR_INTEGRATION') {
        await firstTimersService.markReadyForIntegration(id)
      } else if (newStatus === 'ARCHIVED') {
        await firstTimersService.archiveFirstTimer(id)
      } else if (newStatus === 'CLOSED') {
        await firstTimersService.closeFirstTimer(id)
      } else {
        // For NEW and ENGAGED, use the general update status
        await firstTimersService.updateStatus(id, newStatus as any)
      }

      toast.success('Status Updated', `Status changed to ${newStatus.replace(/_/g, ' ')}`)
      setShowStatusModal(false)
      setSelectedFirstTimerForStatus(null)
      await loadFirstTimers()
      await loadStats()
      await loadArchiveStats()
    } catch (error: any) {
      toast.error('Update Failed', error.message || 'Failed to update status')
    } finally {
      setStatusUpdateLoading(false)
    }
  }

  const [integrateIds, setIntegrateIds] = useState<string[]>([])

  const openIntegrateModal = async (ids: string[]) => {
    if (ids.length === 0) {
      toast.error('No selection', 'Please select at least one first-timer to integrate')
      return
    }
    setIntegrateIds(ids)
    setShowBulkActionsMenu(false)
    setShowBulkIntegrateModal(true)
    setLoadingGroups(true)
    try {
      const [districtsRes, unitsRes] = await Promise.all([
        groupsService.getDistricts({ limit: 100 }),
        groupsService.getUnits({ limit: 100 }),
      ])
      setDistricts(districtsRes.items || [])
      setUnits(unitsRes.items || [])
    } catch (error) {
      toast.error('Failed to load groups')
    } finally {
      setLoadingGroups(false)
    }
  }

  const handleIntegrate = async () => {
    if (!selectedDistrict) {
      toast.error('Please select a district')
      return
    }

    try {
      setIntegrateLoading(true)
      let successCount = 0
      let failCount = 0

      for (const id of integrateIds) {
        try {
          await firstTimersService.integrateFirstTimer(id, selectedDistrict, selectedUnit || undefined)
          successCount++
        } catch (error: any) {
          console.error(`Failed to integrate ${id}:`, error)
          failCount++
        }
      }

      if (successCount > 0) {
        toast.success('Integration Complete', `${successCount} first-timer(s) integrated successfully${failCount > 0 ? ` (${failCount} failed)` : ''}`)
      } else {
        toast.error('Integration Failed', 'No first-timers were integrated')
      }

      setShowBulkIntegrateModal(false)
      setSelectedDistrict('')
      setSelectedUnit('')
      setIntegrateIds([])
      setSelectedIds([])
      await loadFirstTimers()
      await loadStats()
    } catch (error: any) {
      console.error('Integrate error:', error)
      toast.error('Integration Failed', error.message || 'Failed to integrate first-timers')
    } finally {
      setIntegrateLoading(false)
    }
  }

  const handleSingleIntegrate = (id: string) => {
    setActionMenuOpen(null)
    openIntegrateModal([id])
  }

  const toggleSelectForArchive = (id: string) => {
    setSelectedForArchive(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAllForArchive = () => {
    const filteredFirstTimers = activeFirstTimersForArchive.filter(ft =>
      !archiveSearchTerm ||
      `${ft.firstName} ${ft.lastName}`.toLowerCase().includes(archiveSearchTerm.toLowerCase()) ||
      ft.phone?.includes(archiveSearchTerm) ||
      ft.email?.toLowerCase().includes(archiveSearchTerm.toLowerCase())
    )
    if (selectedForArchive.length === filteredFirstTimers.length) {
      setSelectedForArchive([])
    } else {
      setSelectedForArchive(filteredFirstTimers.map(ft => ft._id))
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
    { value: 'NEW', label: 'New' },
    { value: 'ENGAGED', label: 'Engaged' },
    { value: 'READY_FOR_INTEGRATION', label: 'Ready for Integration' },
    { value: 'ARCHIVED', label: 'Archived' },
    { value: 'CLOSED', label: 'Closed (Converted)' },
  ]

  return (
    <Layout title="First Timers" subtitle="Manage visitors and follow-ups">
      <div className="space-y-6">
        {/* Overview Stats - show on all tabs */}
        {(stats || statsLoading) && (
          <div className="relative">
            {statsLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                <LoadingSpinner size="md" />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Visitors</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
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
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Ready for Integration</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">{stats?.readyForIntegration || 0}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <UserCog className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
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
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Conversion Rate</p>
                    <p className="text-xl sm:text-2xl font-bold text-purple-600">{stats?.conversionRate || 0}%</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
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
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Archived</p>
                    <p className="text-xl sm:text-2xl font-bold text-orange-600">{stats?.totalArchived || 0}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Archive className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Date Range Selector and Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 sm:space-x-6 overflow-x-auto scrollbar-hide" aria-label="Tabs">
            <button
              onClick={() => handleTabChange('all')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="h-4 w-4" />
              All Visitors
              {stats && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === 'all' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {stats.total ?? 0}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('ready')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'ready'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserCog className="h-4 w-4" />
              Ready for Integration
              {stats && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === 'ready' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {stats.readyForIntegration || 0}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('archived')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'archived'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Archive className="h-4 w-4" />
              Archived
              {stats && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === 'archived' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {stats.totalArchived || 0}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('closed')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'closed'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              Closed
              {stats && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === 'closed' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {stats.totalClosed || 0}
                </span>
              )}
            </button>
          </nav>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2 pb-3">
            <span className="text-sm text-gray-500">Showing:</span>
            <select
              value={dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value as DateRangeFilter)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="3months">Last 3 months</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

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
            activeTab === 'all' ? (
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
            ) : activeTab === 'archived' ? (
              <Button
                size="sm"
                onClick={openBulkArchiveModal}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive Visitors
              </Button>
            ) : null
          }
        />

        {/* Visitors Table */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : firstTimers.length === 0 ? (
          <div className="text-center py-16">
            {activeTab === 'archived' ? (
              <>
                <Archive className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No archived visitors</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm ? 'Try adjusting your search' : 'Archived first-timers will appear here'}
                </p>
                <Button variant="secondary" onClick={() => handleTabChange('all')}>
                  View All Visitors
                </Button>
              </>
            ) : activeTab === 'ready' ? (
              <>
                <UserCog className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No visitors ready for integration</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm ? 'Try adjusting your search' : 'First-timers marked as ready for integration will appear here'}
                </p>
                <Button variant="secondary" onClick={() => handleTabChange('all')}>
                  View All Visitors
                </Button>
              </>
            ) : activeTab === 'closed' ? (
              <>
                <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No closed visitors</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm ? 'Try adjusting your search' : 'Closed first-timers (converted to members or marked inactive) will appear here'}
                </p>
                <Button variant="secondary" onClick={() => handleTabChange('all')}>
                  View All Visitors
                </Button>
              </>
            ) : (
              <>
                <UserPlus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No visitors found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || statusFilter ? 'Try adjusting your search or filters' : 'Add your first visitor to get started'}
                </p>
                <Button onClick={() => navigate('/first-timers/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Visitor
                </Button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Bulk Actions Toolbar - not shown for closed tab */}
            {selectedIds.length > 0 && activeTab !== 'closed' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${activeTab === 'all' ? 'bg-blue-50 border-blue-200' : activeTab === 'ready' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'} border rounded-lg p-4 mb-4`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className={`text-sm font-medium ${activeTab === 'all' ? 'text-blue-900' : activeTab === 'ready' ? 'text-green-900' : 'text-orange-900'}`}>
                      {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedIds([])}
                      className={activeTab === 'all' ? 'text-blue-700 hover:text-blue-800' : activeTab === 'ready' ? 'text-green-700 hover:text-green-800' : 'text-orange-700 hover:text-orange-800'}
                    >
                      Clear selection
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    {activeTab === 'archived' ? (
                      <Button
                        onClick={handleBulkUnarchive}
                        disabled={archiveLoading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <ArchiveRestore className="h-4 w-4 mr-2" />
                        {archiveLoading ? 'Restoring...' : 'Restore Selected'}
                      </Button>
                    ) : (
                      <div className="relative" data-bulk-actions-menu>
                        <Button
                          onClick={() => setShowBulkActionsMenu(!showBulkActionsMenu)}
                          disabled={bulkActionLoading}
                          className={`${activeTab === 'all' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                          size="sm"
                        >
                          {bulkActionLoading ? (
                            <>
                              <LoadingSpinner size="sm" className="mr-2" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <MoreHorizontal className="h-4 w-4 mr-2" />
                              Bulk Actions
                            </>
                          )}
                        </Button>

                        {showBulkActionsMenu && (
                          <div className="absolute right-0 bottom-full mb-1 w-48 bg-white rounded-md shadow-lg border z-20">
                            <div className="py-1">
                              {activeTab === 'all' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setShowBulkActionsMenu(false)
                                      setShowBulkAssignModal(true)
                                    }}
                                    className="flex items-center w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                                  >
                                    <UserPlus className="h-3.5 w-3.5 mr-2 text-blue-600" />
                                    Assign for Follow-up
                                  </button>
                                  <button
                                    onClick={handleBulkReadyForIntegration}
                                    className="flex items-center w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                                  >
                                    <CheckCircle className="h-3.5 w-3.5 mr-2 text-green-600" />
                                    Ready for Integration
                                  </button>
                                  <button
                                    onClick={handleBulkArchiveSelected}
                                    className="flex items-center w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                                  >
                                    <Archive className="h-3.5 w-3.5 mr-2 text-orange-600" />
                                    Archive Selected
                                  </button>
                                </>
                              )}
                              {activeTab === 'ready' && (
                                <>
                                  <button
                                    onClick={() => openIntegrateModal(selectedIds)}
                                    className="flex items-center w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                                  >
                                    <UserPlus className="h-3.5 w-3.5 mr-2 text-green-600" />
                                    Integrate Selected
                                  </button>
                                  <button
                                    onClick={() => {
                                      setShowBulkActionsMenu(false)
                                      setShowBulkAssignModal(true)
                                    }}
                                    className="flex items-center w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                                  >
                                    <UserCheck className="h-3.5 w-3.5 mr-2 text-blue-600" />
                                    Assign for Follow-up
                                  </button>
                                  <button
                                    onClick={handleBulkUnmarkReady}
                                    className="flex items-center w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                                  >
                                    <X className="h-3.5 w-3.5 mr-2 text-gray-600" />
                                    Unmark Ready
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
                      {activeTab !== 'closed' && (
                        <input
                          type="checkbox"
                          checked={selectedIds.length === firstTimers.length && firstTimers.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      )}
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
                      className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                      onClick={() => navigate(`/first-timers/${visitor._id}`)}
                    >
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        {activeTab !== 'closed' && visitor.status !== 'CLOSED' && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(visitor._id)}
                            onChange={() => handleSelectItem(visitor._id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        )}
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
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(visitor.status)}`}>
                            {getStatusLabel(visitor.status)}
                          </span>
                          {visitor.status === 'CLOSED' && (
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              visitor.converted || visitor.memberRecord
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {visitor.converted || visitor.memberRecord ? 'Member' : 'Inactive'}
                            </span>
                          )}
                        </div>
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
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center">
                          {/* Hide action menu entirely for closed first timers */}
                          {visitor.status !== 'CLOSED' ? (
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
                                <div className={`absolute right-0 w-48 bg-white rounded-md shadow-lg border z-10 ${
                                  index >= firstTimers.length - 2 ? 'bottom-full mb-1' : 'top-full mt-1'
                                }`}>
                                  <div className="py-1">
                                    {/* Edit - always shown */}
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

                                    {/* NEW: Only Assign */}
                                    {visitor.status === 'NEW' && (
                                      <button
                                        onClick={() => {
                                          setSelectedIds([visitor._id])
                                          setShowBulkAssignModal(true)
                                          setActionMenuOpen(null)
                                        }}
                                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      >
                                        <UserCheck className="h-3 w-3 mr-2" />
                                        Assign
                                      </button>
                                    )}

                                    {/* ENGAGED: Assign + Update Status */}
                                    {visitor.status === 'ENGAGED' && (
                                      <>
                                        <button
                                          onClick={() => {
                                            setSelectedIds([visitor._id])
                                            setShowBulkAssignModal(true)
                                            setActionMenuOpen(null)
                                          }}
                                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                          <UserCheck className="h-3 w-3 mr-2" />
                                          Assign
                                        </button>
                                        <button
                                          onClick={() => {
                                            setSelectedFirstTimerForStatus(visitor)
                                            setShowStatusModal(true)
                                            setActionMenuOpen(null)
                                          }}
                                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                          <RefreshCw className="h-3 w-3 mr-2" />
                                          Update Status
                                        </button>
                                      </>
                                    )}

                                    {/* READY_FOR_INTEGRATION: Integrate or Move to Engaged */}
                                    {visitor.status === 'READY_FOR_INTEGRATION' && (
                                      <>
                                        <button
                                          onClick={() => {
                                            handleSingleIntegrate(visitor._id)
                                            setActionMenuOpen(null)
                                          }}
                                          className="flex items-center w-full px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                                        >
                                          <UserPlus className="h-3 w-3 mr-2" />
                                          Integrate
                                        </button>
                                        <button
                                          onClick={async () => {
                                            try {
                                              await firstTimersService.unmarkReadyForIntegration(visitor._id)
                                              setActionMenuOpen(null)
                                              loadFirstTimers()
                                              toast.success('Status Updated', 'Moved back to Engaged')
                                            } catch (error: any) {
                                              toast.error('Failed', error.message || 'Could not update status')
                                            }
                                          }}
                                          className="flex items-center w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                                        >
                                          <RefreshCw className="h-3 w-3 mr-2" />
                                          Move to Engaged
                                        </button>
                                      </>
                                    )}

                                    {/* ARCHIVED: Restore or Close */}
                                    {visitor.status === 'ARCHIVED' && (
                                      <>
                                        <button
                                          onClick={() => {
                                            handleUnarchive(visitor._id)
                                            setActionMenuOpen(null)
                                          }}
                                          disabled={archiveLoading}
                                          className="flex items-center w-full px-3 py-2 text-sm text-green-600 hover:bg-green-50 disabled:opacity-50"
                                        >
                                          <ArchiveRestore className="h-3 w-3 mr-2" />
                                          Restore
                                        </button>
                                        <button
                                          onClick={async () => {
                                            try {
                                              await firstTimersService.closeFirstTimer(visitor._id)
                                              setActionMenuOpen(null)
                                              loadFirstTimers()
                                              toast.success('Closed', 'First timer has been closed')
                                            } catch (error: any) {
                                              toast.error('Failed', error.message || 'Could not close')
                                            }
                                          }}
                                          className="flex items-center w-full px-3 py-2 text-sm text-purple-600 hover:bg-purple-50"
                                        >
                                          <X className="h-3 w-3 mr-2" />
                                          Close
                                        </button>
                                      </>
                                    )}

                                    {/* Delete - always shown */}
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
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.total > 0 && (
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

      {/* Archive Modal */}
      {archiveModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
              setArchiveModalOpen(null)
              setArchiveReason('')
            }} />
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Archive className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                      Archive First Timer
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to archive this first-timer? They will be moved to the archived list and can be restored later.
                      </p>
                      <div className="mt-4">
                        <label htmlFor="archiveReason" className="block text-sm font-medium text-gray-700">
                          Reason (optional)
                        </label>
                        <textarea
                          id="archiveReason"
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Enter reason for archiving..."
                          value={archiveReason}
                          onChange={(e) => setArchiveReason(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <Button
                  onClick={() => handleArchive(archiveModalOpen, archiveReason)}
                  disabled={archiveLoading}
                  className="inline-flex w-full justify-center rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 sm:ml-3 sm:w-auto"
                >
                  {archiveLoading ? 'Archiving...' : 'Archive'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setArchiveModalOpen(null)
                    setArchiveReason('')
                  }}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Integrate Modal */}
      {showBulkIntegrateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
              setShowBulkIntegrateModal(false)
              setSelectedDistrict('')
              setSelectedUnit('')
              setIntegrateIds([])
            }} />
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <UserPlus className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                      Integrate {integrateIds.length} First-Timer{integrateIds.length !== 1 ? 's' : ''}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Assign to a district to create member records
                    </p>
                  </div>
                </div>

                {loadingGroups ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="md" />
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        District <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select a district</option>
                        {districts.map((district) => (
                          <option key={district._id} value={district._id}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Unit <span className="text-gray-400">(optional)</span>
                      </label>
                      <select
                        value={selectedUnit}
                        onChange={(e) => setSelectedUnit(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select a unit</option>
                        {units.map((unit) => (
                          <option key={unit._id} value={unit._id}>
                            {unit.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600">
                        This will create member records for the selected first-timers and assign them to the chosen district{selectedUnit ? ' and unit' : ''}.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  onClick={handleIntegrate}
                  disabled={integrateLoading || !selectedDistrict || loadingGroups}
                  className="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 sm:ml-3 sm:w-auto disabled:opacity-50"
                >
                  {integrateLoading ? 'Integrating...' : `Integrate ${integrateIds.length} Visitor${integrateIds.length !== 1 ? 's' : ''}`}
                </button>
                <button
                  onClick={() => {
                    setShowBulkIntegrateModal(false)
                    setSelectedDistrict('')
                    setSelectedUnit('')
                    setIntegrateIds([])
                  }}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Archive Modal */}
      {showBulkArchiveModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
              setShowBulkArchiveModal(false)
              setSelectedForArchive([])
              setBulkArchiveReason('')
              setArchiveSearchTerm('')
            }} />
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl max-h-[90vh] flex flex-col">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 flex-shrink-0">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Archive className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                      Archive Visitors
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Select first-timers to move to the archive
                    </p>
                  </div>
                </div>

                {/* Search */}
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Search by name, phone, or email..."
                    value={archiveSearchTerm}
                    onChange={(e) => setArchiveSearchTerm(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  />
                </div>

                {/* Select all */}
                {activeFirstTimersForArchive.length > 0 && (
                  <div className="mt-3 flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedForArchive.length === activeFirstTimersForArchive.filter(ft =>
                          !archiveSearchTerm ||
                          `${ft.firstName} ${ft.lastName}`.toLowerCase().includes(archiveSearchTerm.toLowerCase()) ||
                          ft.phone?.includes(archiveSearchTerm) ||
                          ft.email?.toLowerCase().includes(archiveSearchTerm.toLowerCase())
                        ).length && selectedForArchive.length > 0}
                        onChange={toggleSelectAllForArchive}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Select all</span>
                    </label>
                    <span className="text-sm text-gray-500">
                      {selectedForArchive.length} selected
                    </span>
                  </div>
                )}
              </div>

              {/* First Timers List */}
              <div className="px-4 sm:px-6 overflow-y-auto flex-1 max-h-[40vh]">
                {activeFirstTimersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="md" />
                  </div>
                ) : activeFirstTimersForArchive.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No active first-timers found
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {activeFirstTimersForArchive
                      .filter(ft =>
                        !archiveSearchTerm ||
                        `${ft.firstName} ${ft.lastName}`.toLowerCase().includes(archiveSearchTerm.toLowerCase()) ||
                        ft.phone?.includes(archiveSearchTerm) ||
                        ft.email?.toLowerCase().includes(archiveSearchTerm.toLowerCase())
                      )
                      .map(ft => (
                        <label
                          key={ft._id}
                          className="flex items-center py-3 hover:bg-gray-50 cursor-pointer px-2 -mx-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedForArchive.includes(ft._id)}
                            onChange={() => toggleSelectForArchive(ft._id)}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {ft.firstName} {ft.lastName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {ft.phone || ft.email || 'No contact info'}
                                </p>
                              </div>
                              <div className="text-xs text-gray-400">
                                {formatDate(ft.dateOfVisit)}
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                  </div>
                )}
              </div>

              {/* Reason Input */}
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex-shrink-0">
                <label htmlFor="bulkArchiveReason" className="block text-sm font-medium text-gray-700">
                  Archive Reason (optional)
                </label>
                <textarea
                  id="bulkArchiveReason"
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  placeholder="Enter reason for archiving..."
                  value={bulkArchiveReason}
                  onChange={(e) => setBulkArchiveReason(e.target.value)}
                />
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 flex-shrink-0">
                <Button
                  onClick={handleBulkArchive}
                  disabled={archiveLoading || selectedForArchive.length === 0}
                  className="inline-flex w-full justify-center rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 sm:ml-3 sm:w-auto disabled:opacity-50"
                >
                  {archiveLoading ? 'Archiving...' : `Archive ${selectedForArchive.length} Visitor${selectedForArchive.length !== 1 ? 's' : ''}`}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowBulkArchiveModal(false)
                    setSelectedForArchive([])
                    setBulkArchiveReason('')
                    setArchiveSearchTerm('')
                  }}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedFirstTimerForStatus && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
              setShowStatusModal(false)
              setSelectedFirstTimerForStatus(null)
            }} />
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">
                    Update Status
                  </h3>
                  <button
                    onClick={() => {
                      setShowStatusModal(false)
                      setSelectedFirstTimerForStatus(null)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  {selectedFirstTimerForStatus.firstName} {selectedFirstTimerForStatus.lastName}
                </p>
                <div className="space-y-2">
                  {[
                    { value: 'READY_FOR_INTEGRATION', label: 'Ready for Integration', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
                    { value: 'ARCHIVED', label: 'Archived', color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
                    { value: 'CLOSED', label: 'Closed', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
                  ].map((status) => (
                    <button
                      key={status.value}
                      onClick={() => handleStatusUpdate(status.value)}
                      disabled={statusUpdateLoading || selectedFirstTimerForStatus.status === status.value}
                      className={`w-full px-4 py-2.5 text-sm font-medium rounded-lg text-left flex items-center justify-between ${
                        selectedFirstTimerForStatus.status === status.value
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : status.color
                      } disabled:opacity-50 transition-colors`}
                    >
                      <span>{status.label}</span>
                      {selectedFirstTimerForStatus.status === status.value && (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </button>
                  ))}
                </div>
                {statusUpdateLoading && (
                  <div className="flex items-center justify-center mt-4">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2 text-sm text-gray-500">Updating...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}