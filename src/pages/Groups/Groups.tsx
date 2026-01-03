import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Filter, Download, Users, MapPin, Calendar, Crown, Shield, Star, Settings as SettingsIcon, Eye, Edit, Trash2, Archive, Upload, Search, X } from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { SkeletonTable } from '@/components/ui/Skeleton'
import FilterModal from '@/components/ui/FilterModal'
// BulkSelectableTable components removed - using custom compact table
import BulkActions, { commonBulkActions, BulkAction } from '@/components/ui/BulkActions'
import BulkConfirmationModal from '@/components/ui/BulkConfirmationModal'
import BulkProgressModal from '@/components/ui/BulkProgressModal'
import BulkEditModal from '@/components/ui/BulkEditModal'
import BulkUploadModal from '@/components/ui/BulkUploadModal'
import { useBulkSelection } from '@/hooks/useBulkSelection'
import { Group, GroupSearchParams, groupsService } from '@/services/groups'
import { bulkOperationsService } from '@/services/bulkOperations'
import { downloadCSV, BulkOperationProgress } from '@/utils/bulkOperations'
import { useAppStore } from '@/store'
import { useAuth } from '@/contexts/AuthContext-unified'

export default function Groups() {
  const navigate = useNavigate()
  const [urlSearchParams, setUrlSearchParams] = useSearchParams()
  const { selectedBranch, branches } = useAppStore()
  const { hasPermission } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState(urlSearchParams.get('search') || '')
  const [searchParams, setSearchParams] = useState<GroupSearchParams>({
    page: parseInt(urlSearchParams.get('page') || '1'),
    limit: parseInt(urlSearchParams.get('limit') || '10'),
    search: urlSearchParams.get('search') || '',
    type: (urlSearchParams.get('type') as GroupSearchParams['type']) || undefined
  })
  const [pagination, setPagination] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [filteredTypeStats, setFilteredTypeStats] = useState<{
    total: number
    active: number
    inactive: number
    totalMembers: number
  } | null>(null)
  const [filteredType, setFilteredType] = useState<string | null>(urlSearchParams.get('type'))
  const [showFilterModal, setShowFilterModal] = useState(false)

  // Filter states
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')

  // Temp filter states for modal
  const [tempTypeFilter, setTempTypeFilter] = useState('')
  const [tempStatusFilter, setTempStatusFilter] = useState('')
  const [tempDateFrom, setTempDateFrom] = useState('')
  const [tempDateTo, setTempDateTo] = useState('')
  const [tempBranchFilter, setTempBranchFilter] = useState('')

  // Show branch filter only if user has permission to view all branches
  const canViewAllBranches = hasPermission('branches:view-all')
  const showBranchFilter = canViewAllBranches && branches.length > 0

  // Bulk operations state
  const bulkSelection = useBulkSelection<Group>()
  const [bulkConfirmation, setBulkConfirmation] = useState<{
    isOpen: boolean
    action: 'delete' | 'export' | 'archive'
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

  const [bulkUpload, setBulkUpload] = useState<{
    isOpen: boolean
  }>({
    isOpen: false
  })

  // Update search params when URL changes
  useEffect(() => {
    const newParams: GroupSearchParams = {
      page: parseInt(urlSearchParams.get('page') || '1'),
      limit: parseInt(urlSearchParams.get('limit') || '10'),
      search: urlSearchParams.get('search') || '',
      type: (urlSearchParams.get('type') as GroupSearchParams['type']) || undefined
    }
    setSearchParams(newParams)
    setFilteredType(urlSearchParams.get('type'))
  }, [urlSearchParams])

  useEffect(() => {
    loadGroups()
  }, [searchParams.page, searchParams.limit, searchParams.search, searchParams.type, searchParams.isActive, branchFilter, selectedBranch])

  useEffect(() => {
    loadStats()
  }, [])

  // Load stats specific to the filtered type
  useEffect(() => {
    if (filteredType) {
      loadFilteredTypeStats()
    } else {
      setFilteredTypeStats(null)
    }
  }, [filteredType, selectedBranch])

  const loadFilteredTypeStats = async () => {
    if (!filteredType) return
    try {
      const effectiveBranchId = selectedBranch?._id || undefined
      // Fetch counts for active and inactive groups
      const [activeResponse, inactiveResponse] = await Promise.all([
        groupsService.getGroups({
          type: filteredType as GroupSearchParams['type'],
          isActive: true,
          branchId: effectiveBranchId,
          limit: 1 // Just need the total count from pagination
        }),
        groupsService.getGroups({
          type: filteredType as GroupSearchParams['type'],
          isActive: false,
          branchId: effectiveBranchId,
          limit: 1 // Just need the total count from pagination
        })
      ])

      // For total members, fetch in batches of 100 (API max limit)
      let totalMembers = 0
      let page = 1
      let hasMore = true

      while (hasMore) {
        const response = await groupsService.getGroups({
          type: filteredType as GroupSearchParams['type'],
          branchId: effectiveBranchId,
          page,
          limit: 100
        })

        totalMembers += response.items.reduce(
          (acc, g) => acc + (g.currentMemberCount || g.members?.length || 0),
          0
        )

        hasMore = response.pagination.hasNext
        page++

        // Safety limit to prevent infinite loops
        if (page > 50) break
      }

      setFilteredTypeStats({
        total: activeResponse.pagination.total + inactiveResponse.pagination.total,
        active: activeResponse.pagination.total,
        inactive: inactiveResponse.pagination.total,
        totalMembers
      })
    } catch (error) {
      console.error('Error loading filtered type stats:', error)
    }
  }

  const loadGroups = async () => {
    try {
      setError(null)
      // Use selectedBranch if set, otherwise use the filter dropdown
      const effectiveBranchId = selectedBranch?._id || branchFilter || undefined
      const response = await groupsService.getGroups({
        ...searchParams,
        branchId: effectiveBranchId
      })
      setGroups(response.items || [])
      setPagination(response.pagination)
    } catch (error: any) {
      console.error('Error loading groups:', error)
      if (error.code === 401) {
        setError({
          status: 401,
          message: 'Authentication required to view groups',
          details: error.message
        })
      } else {
        setError({
          status: error.code || 500,
          message: 'Failed to load groups',
          details: error.message
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await groupsService.getGroupStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error loading group stats:', error)
    }
  }

  const getPageTitle = () => {
    if (filteredType) {
      const typeNames = {
        district: 'Districts',
        unit: 'Units',
        ministry: 'Ministries',
        fellowship: 'Fellowships',
        committee: 'Committees'
      }
      return typeNames[filteredType as keyof typeof typeNames] || 'Groups'
    }
    return 'Groups'
  }

  const getPageSubtitle = () => {
    if (filteredType) {
      const subtitles = {
        district: 'Manage church districts and their district pastors',
        unit: 'Manage units and their unit heads',
        ministry: 'Manage ministries and their leaders',
        fellowship: 'Manage fellowship groups',
        committee: 'Manage committees and their members'
      }
      return subtitles[filteredType as keyof typeof subtitles] || 'Manage groups'
    }
    return 'Manage all groups, districts, units, ministries, and committees'
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const newParams = new URLSearchParams(urlSearchParams)
    newParams.set('search', searchTerm)
    newParams.set('page', '1')
    setUrlSearchParams(newParams)
  }

  const handleFilter = (filters: Partial<GroupSearchParams>) => {
    const newParams = new URLSearchParams(urlSearchParams)
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        newParams.set(key, value.toString())
      } else {
        newParams.delete(key)
      }
    })
    newParams.set('page', '1')
    setUrlSearchParams(newParams)
  }

  // Filter modal functions
  const openFilterModal = () => {
    setTempTypeFilter(typeFilter)
    setTempStatusFilter(statusFilter)
    setTempDateFrom(dateFromFilter)
    setTempDateTo(dateToFilter)
    setTempBranchFilter(branchFilter)
    setShowFilterModal(true)
  }

  const closeFilterModal = () => {
    setShowFilterModal(false)
  }

  const applyFilters = () => {
    setTypeFilter(tempTypeFilter)
    setStatusFilter(tempStatusFilter)
    setDateFromFilter(tempDateFrom)
    setDateToFilter(tempDateTo)
    setBranchFilter(tempBranchFilter)
    // Apply filters using URL params
    const newParams = new URLSearchParams(urlSearchParams)
    if (tempTypeFilter) {
      newParams.set('type', tempTypeFilter)
    } else {
      newParams.delete('type')
    }
    if (tempStatusFilter) {
      newParams.set('isActive', tempStatusFilter)
    } else {
      newParams.delete('isActive')
    }
    newParams.set('page', '1')
    setUrlSearchParams(newParams)
    setShowFilterModal(false)
  }

  const resetTempFilters = () => {
    setTempTypeFilter('')
    setTempStatusFilter('')
    setTempDateFrom('')
    setTempDateTo('')
    setTempBranchFilter('')
  }

  const clearAppliedFilters = () => {
    setTypeFilter('')
    setStatusFilter('')
    setDateFromFilter('')
    setDateToFilter('')
    setBranchFilter('')
    const newParams = new URLSearchParams(urlSearchParams)
    newParams.delete('type')
    newParams.delete('isActive')
    newParams.set('page', '1')
    setUrlSearchParams(newParams)
  }

  const hasActiveFilters = !!(typeFilter || statusFilter || dateFromFilter || dateToFilter || branchFilter)
  const activeFilterCount = [typeFilter, statusFilter, dateFromFilter, dateToFilter, branchFilter].filter(Boolean).length

  // Bulk operations handlers
  const handleBulkDelete = () => {
    setBulkConfirmation({
      isOpen: true,
      action: 'delete'
    })
  }

  const handleBulkExport = () => {
    const selectedGroups = bulkSelection.getSelectedItems(groups)
    downloadCSV(selectedGroups, 'groups_export', [
      '_id', 'name', 'type', 'description', 'isActive', 'members', 'capacity',
      'meetingSchedule', 'location', 'districtPastor', 'unitHead', 'createdAt'
    ])
    bulkSelection.clearSelection()
  }

  const handleBulkArchive = () => {
    setBulkConfirmation({
      isOpen: true,
      action: 'archive',
      title: 'Archive Groups',
      message: `Archive ${bulkSelection.getSelectedCount()} groups? They will be marked as inactive.`
    })
  }

  const handleBulkEdit = () => {
    setBulkEdit({ isOpen: true, loading: false })
  }

  const handleBulkUpload = () => {
    setBulkUpload({ isOpen: true })
  }

  const handleUploadSuccess = async (result: any) => {
    setBulkUpload({ isOpen: false })
    await loadGroups()
  }

  const confirmBulkOperation = async () => {
    const selectedIds = Array.from(bulkSelection.selectedItems)
    const action = bulkConfirmation.action

    setBulkConfirmation({ isOpen: false, action: 'delete' })
    setBulkProgress({
      isOpen: true,
      operation: action === 'delete' ? 'Deleting' : action === 'archive' ? 'Archiving' : 'Processing',
      progress: { total: selectedIds.length, processed: 0, failed: 0 },
      isComplete: false,
      errors: []
    })

    try {
      let result

      if (action === 'delete') {
        result = await bulkOperationsService.bulkDelete('groups', selectedIds, (progress) => {
          setBulkProgress(prev => ({ ...prev, progress }))
        })
      } else if (action === 'archive') {
        result = await bulkOperationsService.bulkUpdate('groups', selectedIds, { isActive: false }, (progress) => {
          setBulkProgress(prev => ({ ...prev, progress }))
        })
      }

      if (result) {
        setBulkProgress(prev => ({
          ...prev,
          isComplete: true,
          errors: result.errors || []
        }))

        // Refresh the groups list
        await loadGroups()
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
      const result = await bulkOperationsService.bulkUpdate('groups', selectedIds, data, (progress) => {
        setBulkProgress(prev => ({ ...prev, progress }))
      })

      setBulkProgress(prev => ({
        ...prev,
        isComplete: true,
        errors: result.errors || []
      }))

      setBulkEdit({ isOpen: false, loading: false })
      await loadGroups()
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

  const getGroupTypeIcon = (type: string) => {
    const icons = {
      district: MapPin,
      unit: SettingsIcon,
      fellowship: Users,
      ministry: Star,
      committee: Shield
    }
    return icons[type as keyof typeof icons] || Users
  }

  const getGroupTypeBadge = (type: string) => {
    const typeColors = {
      district: 'bg-blue-100 text-blue-800 border-blue-200',
      unit: 'bg-green-100 text-green-800 border-green-200',
      fellowship: 'bg-purple-100 text-purple-800 border-purple-200',
      ministry: 'bg-orange-100 text-orange-800 border-orange-200',
      committee: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return typeColors[type as keyof typeof typeColors] || typeColors.fellowship
  }

  const getLeaderInfo = (group: Group) => {
    if (group.type === 'district' && group.districtPastor) {
      return { title: 'District Pastor', id: group.districtPastor, icon: Crown }
    }
    if (group.type === 'unit' && group.unitHead) {
      return { title: 'Unit Head', id: group.unitHead, icon: Shield }
    }
    return null
  }

  // Define bulk actions
  const bulkActions: BulkAction[] = [
    commonBulkActions.export(handleBulkExport),
    {
      id: 'edit',
      label: 'Edit',
      icon: <Edit className="w-4 h-4" />,
      variant: 'secondary',
      onClick: handleBulkEdit
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: <Archive className="w-4 h-4" />,
      variant: 'secondary',
      onClick: handleBulkArchive
    },
    commonBulkActions.delete(handleBulkDelete)
  ]

  // Bulk edit fields configuration
  const bulkEditFields = [
    {
      key: 'type',
      label: 'Group Type',
      type: 'select' as const,
      options: [
        { value: 'district', label: 'District' },
        { value: 'unit', label: 'Unit' },
        { value: 'fellowship', label: 'Fellowship' },
        { value: 'ministry', label: 'Ministry' },
        { value: 'committee', label: 'Committee' }
      ]
    },
    {
      key: 'isActive',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ]
    },
    {
      key: 'capacity',
      label: 'Capacity',
      type: 'number' as const,
      placeholder: 'Enter group capacity'
    },
    {
      key: 'location',
      label: 'Location',
      type: 'text' as const,
      placeholder: 'Enter meeting location'
    },
    {
      key: 'description',
      label: 'Description',
      type: 'text' as const,
      placeholder: 'Update description'
    }
  ]

  if (loading) {
    return (
      <Layout
        title={getPageTitle()}
        subtitle={getPageSubtitle()}
        headerActions={
          <Button onClick={() => navigate('/groups/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        }
      >
        <SkeletonTable />
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title={getPageTitle()} subtitle={getPageSubtitle()}>
        <ErrorBoundary
          error={error}
          onRetry={loadGroups}
        />
      </Layout>
    )
  }

  const isAllSelected = groups.length > 0 && groups.every(group => bulkSelection.selectedItems.has(group._id))
  const isIndeterminate = groups.some(group => bulkSelection.selectedItems.has(group._id)) && !isAllSelected

  // Search Section to be displayed in header
  const searchSection = (
    <form onSubmit={handleSearch} className="flex gap-3 flex-wrap items-center w-full">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search groups by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          />
        </div>
      </div>

      <button
        type="submit"
        className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
      >
        Search
      </button>

      <Button
        type="button"
        variant="secondary"
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
          type="button"
          variant="ghost"
          onClick={clearAppliedFilters}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}

      <Button onClick={() => navigate('/groups/new')}>
        <Plus className="h-4 w-4 mr-2" />
        Create Group
      </Button>

      <Button variant="secondary" onClick={handleBulkUpload}>
        <Upload className="h-4 w-4 mr-2" />
        Upload
      </Button>
    </form>
  )

  return (
    <Layout
      title={getPageTitle()}
      subtitle={getPageSubtitle()}
      searchSection={searchSection}
    >
      <div className="space-y-3">
        {/* Bulk Actions Bar */}
        <BulkActions
          selectedCount={bulkSelection.getSelectedCount()}
          totalCount={groups.length}
          onClearSelection={bulkSelection.clearSelection}
          actions={bulkActions}
        />

        {/* Stats Cards - Only show for general groups page */}
        {!filteredType && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="p-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-500 truncate">Total</p>
                    <p className="text-base font-semibold text-gray-900">{stats?.total || 0}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-500 truncate">Active</p>
                    <p className="text-base font-semibold text-gray-900">{stats?.active || 0}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="p-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-500 truncate">Districts</p>
                    <p className="text-base font-semibold text-gray-900">{stats?.districts || 0}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <SettingsIcon className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-500 truncate">Units</p>
                    <p className="text-base font-semibold text-gray-900">{stats?.units || 0}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="p-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Star className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-500 truncate">Ministries</p>
                    <p className="text-base font-semibold text-gray-900">{stats?.ministries || 0}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-500 truncate">Fellowships</p>
                    <p className="text-base font-semibold text-gray-900">{stats?.fellowships || 0}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Subsection Stats - Show specific stats for filtered views */}
        {filteredType && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="p-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    {filteredType === 'district' && <MapPin className="h-4 w-4 text-blue-600" />}
                    {filteredType === 'unit' && <SettingsIcon className="h-4 w-4 text-blue-600" />}
                    {filteredType === 'ministry' && <Star className="h-4 w-4 text-blue-600" />}
                    {filteredType === 'fellowship' && <Users className="h-4 w-4 text-blue-600" />}
                    {filteredType === 'committee' && <Shield className="h-4 w-4 text-blue-600" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-500 truncate">Total</p>
                    <p className="text-base font-semibold text-gray-900">{filteredTypeStats?.total ?? pagination?.total ?? 0}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-500 truncate">Active</p>
                    <p className="text-base font-semibold text-gray-900">{filteredTypeStats?.active ?? 0}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="p-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-500 truncate">Inactive</p>
                    <p className="text-base font-semibold text-gray-900">{filteredTypeStats?.inactive ?? 0}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-500 truncate">Members</p>
                    <p className="text-base font-semibold text-gray-900">{filteredTypeStats?.totalMembers ?? 0}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {groups.length === 0 ? (
            <Card className="p-6 text-center">
              <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No groups found matching your criteria.</p>
            </Card>
          ) : (
            groups.map((group, index) => {
              const GroupIcon = getGroupTypeIcon(group.type)
              const leaderInfo = getLeaderInfo(group)

              return (
                <motion.div
                  key={group._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.015 }}
                  className={`bg-white border border-gray-100 rounded-xl p-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1),0_1px_3px_-1px_rgba(0,0,0,0.06)] ${bulkSelection.selectedItems.has(group._id) ? 'ring-2 ring-primary-500 bg-primary-50' : ''}`}
                  onClick={() => navigate(`/groups/${group._id}`)}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={bulkSelection.selectedItems.has(group._id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          bulkSelection.selectItem(group._id)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 flex-shrink-0"
                      />
                      <GroupIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <h3 className="font-medium text-gray-900 text-sm truncate">{group.name}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${getGroupTypeBadge(group.type)}`}>
                        {group.type.charAt(0).toUpperCase() + group.type.slice(1)}
                      </span>
                      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        group.isActive
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${group.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {group.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Info Row */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 pl-6">
                    {/* Leader */}
                    <div className="flex items-center gap-1">
                      {leaderInfo ? (
                        <>
                          <leaderInfo.icon className="h-3 w-3 text-gray-400" />
                          <span className="truncate max-w-[100px]">
                            {typeof leaderInfo.id === 'object'
                              ? `${leaderInfo.id?.firstName} ${leaderInfo.id?.lastName}`
                              : leaderInfo.title}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400">No leader</span>
                      )}
                    </div>
                    <span className="text-gray-300">|</span>
                    {/* Members */}
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-gray-400" />
                      <span>{group.currentMemberCount || group.members?.length || 0}{group.maxCapacity > 0 ? `/${group.maxCapacity}` : ''}</span>
                    </div>
                    {group.meetingSchedule && (
                      <>
                        <span className="text-gray-300">|</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>{group.meetingSchedule.day}s</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-gray-100 pl-6" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/groups/${group._id}`)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/groups/${group._id}/edit`)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </button>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>

        {/* Desktop Groups Table */}
        <Card className="overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-10 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isIndeterminate
                      }}
                      onChange={() => bulkSelection.selectAll(groups)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leader</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Members</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {groups.map((group) => {
                  const GroupIcon = getGroupTypeIcon(group.type)
                  const leaderInfo = getLeaderInfo(group)
                  const LeaderIcon = leaderInfo?.icon

                  return (
                    <tr
                      key={group._id}
                      onClick={() => navigate(`/groups/${group._id}`)}
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                        bulkSelection.selectedItems.has(group._id) ? 'bg-primary-50' : ''
                      }`}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={bulkSelection.selectedItems.has(group._id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => bulkSelection.selectItem(group._id)}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <GroupIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate text-sm">{group.name}</p>
                            {group.description && (
                              <p className="text-xs text-gray-500 truncate max-w-[180px]">{group.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${getGroupTypeBadge(group.type)}`}>
                          {group.type.charAt(0).toUpperCase() + group.type.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {leaderInfo && LeaderIcon ? (
                          <div className="flex items-center gap-1.5">
                            <LeaderIcon className="h-3.5 w-3.5 text-gray-400" />
                            <div className="min-w-0">
                              <p className="text-xs text-gray-900 truncate">
                                {typeof leaderInfo.id === 'object'
                                  ? `${leaderInfo.id?.firstName} ${leaderInfo.id?.lastName}`
                                  : leaderInfo.title}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-gray-900 font-medium">{group.currentMemberCount || group.members?.length || 0}</span>
                          {group.maxCapacity > 0 && (
                            <span className="text-gray-400">/{group.maxCapacity}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {group.meetingSchedule ? (
                          <div className="text-xs">
                            <span className="text-gray-900">{group.meetingSchedule.day}s</span>
                            <span className="text-gray-400"> · {group.meetingSchedule.time}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          group.isActive
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${group.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          {group.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/groups/${group._id}`)
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/groups/${group._id}/edit`)
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {groups.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No groups found matching your criteria.
            </div>
          )}
        </Card>

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={!pagination.hasPrev}
                onClick={() => {
                  const newParams = new URLSearchParams(urlSearchParams)
                  newParams.set('page', (pagination.page - 1).toString())
                  setUrlSearchParams(newParams)
                }}
                className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <span className="px-2 py-1 text-xs text-gray-600">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                disabled={!pagination.hasNext}
                onClick={() => {
                  const newParams = new URLSearchParams(urlSearchParams)
                  newParams.set('page', (pagination.page + 1).toString())
                  setUrlSearchParams(newParams)
                }}
                className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
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
        entityName="group"
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
        entityName="group"
        loading={bulkEdit.loading}
      />

      {/* Bulk Progress Modal */}
      <BulkProgressModal
        isOpen={bulkProgress.isOpen}
        onClose={() => setBulkProgress(prev => ({ ...prev, isOpen: false }))}
        operation={bulkProgress.operation}
        entityName="group"
        progress={bulkProgress.progress}
        isComplete={bulkProgress.isComplete}
        errors={bulkProgress.errors}
      />

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={bulkUpload.isOpen}
        onClose={() => setBulkUpload({ isOpen: false })}
        entityName="group"
        entityType="groups"
        onSuccess={handleUploadSuccess}
        templateColumns={[
          'name', 'type', 'description', 'isActive', 'capacity',
          'location', 'meetingDay', 'meetingTime', 'meetingFrequency',
          'districtPastor', 'unitHead'
        ]}
      />

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={closeFilterModal}
        onApply={applyFilters}
        onReset={resetTempFilters}
        title="Filter Groups"
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
          ...(!filteredType ? [{
            id: 'type',
            label: 'Group Type',
            value: tempTypeFilter,
            onChange: setTempTypeFilter,
            options: [
              { value: 'district', label: 'Districts' },
              { value: 'unit', label: 'Units' },
              { value: 'fellowship', label: 'Fellowships' },
              { value: 'ministry', label: 'Ministries' },
              { value: 'committee', label: 'Committees' },
            ],
            placeholder: 'All Types',
          }] : []),
          {
            id: 'status',
            label: 'Status',
            value: tempStatusFilter,
            onChange: setTempStatusFilter,
            options: [
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ],
            placeholder: 'All Status',
          },
        ]}
        dateRange={{
          id: 'createdDate',
          label: 'Created Date Range',
          fromValue: tempDateFrom,
          toValue: tempDateTo,
          onFromChange: setTempDateFrom,
          onToChange: setTempDateTo,
        }}
      />
    </Layout>
  )
}