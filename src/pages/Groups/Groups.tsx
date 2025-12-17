import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Filter, Download, Users, MapPin, Calendar, Crown, Shield, Star, Settings as SettingsIcon, Eye, Edit, Trash2, Archive, Upload, Search } from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { BulkSelectableTable, BulkSelectHeader, BulkSelectRow, TableBody, TableHead, TableCell } from '@/components/ui/BulkSelectableTable'
import BulkActions, { commonBulkActions, BulkAction } from '@/components/ui/BulkActions'
import BulkConfirmationModal from '@/components/ui/BulkConfirmationModal'
import BulkProgressModal from '@/components/ui/BulkProgressModal'
import BulkEditModal from '@/components/ui/BulkEditModal'
import BulkUploadModal from '@/components/ui/BulkUploadModal'
import { useBulkSelection } from '@/hooks/useBulkSelection'
import { Group, GroupSearchParams, groupsService } from '@/services/groups'
import { bulkOperationsService } from '@/services/bulkOperations'
import { downloadCSV, BulkOperationProgress } from '@/utils/bulkOperations'
import { formatDate } from '@/utils/formatters'

export default function Groups() {
  const navigate = useNavigate()
  const [urlSearchParams, setUrlSearchParams] = useSearchParams()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState(urlSearchParams.get('search') || '')
  const [searchParams, setSearchParams] = useState<GroupSearchParams>({
    page: parseInt(urlSearchParams.get('page') || '1'),
    limit: parseInt(urlSearchParams.get('limit') || '20'),
    search: urlSearchParams.get('search') || '',
    type: (urlSearchParams.get('type') as GroupSearchParams['type']) || undefined
  })
  const [pagination, setPagination] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [filteredType, setFilteredType] = useState<string | null>(urlSearchParams.get('type'))

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
      limit: parseInt(urlSearchParams.get('limit') || '20'),
      search: urlSearchParams.get('search') || '',
      type: (urlSearchParams.get('type') as GroupSearchParams['type']) || undefined
    }
    setSearchParams(newParams)
    setFilteredType(urlSearchParams.get('type'))
  }, [urlSearchParams])

  useEffect(() => {
    loadGroups()
  }, [searchParams.page, searchParams.limit, searchParams.search, searchParams.type, searchParams.isActive])

  useEffect(() => {
    loadStats()
  }, [])

  const loadGroups = async () => {
    try {
      setError(null)
      const response = await groupsService.getGroups(searchParams)
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

      {!filteredType && (
        <select
          value={searchParams.type || ''}
          onChange={(e) => handleFilter({ type: e.target.value as any || undefined })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">All Types</option>
          <option value="district">Districts</option>
          <option value="unit">Units</option>
          <option value="fellowship">Fellowships</option>
          <option value="ministry">Ministries</option>
          <option value="committee">Committees</option>
        </select>
      )}

      <select
        value={searchParams.isActive?.toString() || ''}
        onChange={(e) => handleFilter({ isActive: e.target.value ? e.target.value === 'true' : undefined })}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
      >
        <option value="">All Status</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>

      <button
        type="submit"
        className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
      >
        Search
      </button>

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
      <div className="space-y-6">
        {/* Bulk Actions Bar */}
        <BulkActions
          selectedCount={bulkSelection.getSelectedCount()}
          totalCount={groups.length}
          onClearSelection={bulkSelection.clearSelection}
          actions={bulkActions}
        />

        {/* Stats Cards - Only show for general groups page */}
        {!filteredType && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Total Groups</h3>
                    <p className="text-2xl font-bold text-blue-600">{stats?.total || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Selected</h3>
                    <p className="text-2xl font-bold text-purple-600">{bulkSelection.getSelectedCount()}</p>
                  </div>
                  <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <div className="h-3 w-3 bg-purple-600 rounded-full"></div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Active</h3>
                    <p className="text-2xl font-bold text-green-600">{stats?.active || 0}</p>
                  </div>
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="h-3 w-3 bg-green-600 rounded-full"></div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Districts</h3>
                    <p className="text-2xl font-bold text-green-600">{stats?.districts || 0}</p>
                  </div>
                  <MapPin className="h-8 w-8 text-green-600" />
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Units</h3>
                    <p className="text-2xl font-bold text-orange-600">{stats?.units || 0}</p>
                  </div>
                  <SettingsIcon className="h-8 w-8 text-orange-600" />
                </div>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Subsection Stats - Show specific stats for filtered views */}
        {filteredType && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Total {getPageTitle()}</h3>
                    <p className="text-2xl font-bold text-blue-600">{pagination?.total || 0}</p>
                  </div>
                  {filteredType === 'district' && <MapPin className="h-8 w-8 text-blue-600" />}
                  {filteredType === 'unit' && <SettingsIcon className="h-8 w-8 text-blue-600" />}
                  {filteredType === 'ministry' && <Star className="h-8 w-8 text-blue-600" />}
                  {filteredType === 'fellowship' && <Users className="h-8 w-8 text-blue-600" />}
                  {filteredType === 'committee' && <Shield className="h-8 w-8 text-blue-600" />}
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Showing</h3>
                    <p className="text-2xl font-bold text-green-600">{groups.length}</p>
                  </div>
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="h-3 w-3 bg-green-600 rounded-full"></div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Selected</h3>
                    <p className="text-2xl font-bold text-purple-600">{bulkSelection.getSelectedCount()}</p>
                  </div>
                  <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <div className="h-3 w-3 bg-purple-600 rounded-full"></div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Page</h3>
                    <p className="text-2xl font-bold text-orange-600">{pagination?.page || 1}</p>
                    <p className="text-xs text-gray-500">of {pagination?.totalPages || 1}</p>
                  </div>
                  <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-orange-600" />
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Groups Table */}
        <Card className="overflow-hidden">
          <BulkSelectableTable>
            <BulkSelectHeader
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onToggle={() => bulkSelection.selectAll(groups)}
            >
              <TableHead>Group</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Leader</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Meeting Schedule</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </BulkSelectHeader>
            <TableBody>
              {groups.map((group) => {
                const GroupIcon = getGroupTypeIcon(group.type)
                const leaderInfo = getLeaderInfo(group)
                const LeaderIcon = leaderInfo?.icon

                return (
                  <BulkSelectRow
                    key={group._id}
                    checked={bulkSelection.selectedItems.has(group._id)}
                    onToggle={() => bulkSelection.selectItem(group._id)}
                    onClick={() => navigate(`/groups/${group._id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <GroupIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{group.name}</p>
                          {group.description && (
                            <p className="text-sm text-gray-600">{group.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getGroupTypeBadge(group.type)}`}>
                        {group.type.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {leaderInfo && LeaderIcon ? (
                        <div className="flex items-center space-x-2">
                          <LeaderIcon className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{leaderInfo.title}</p>
                            <p className="text-xs text-gray-600">
                              {typeof leaderInfo.id === 'object' ? `${leaderInfo.id?.firstName} ${leaderInfo.id?.lastName}` : `ID: ${leaderInfo.id}`}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No leader assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{group.members?.length || 0}</span>
                        {group.capacity && (
                          <span className="text-gray-600">/ {group.capacity}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {group.meetingSchedule ? (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-900">
                              {group.meetingSchedule.day}s
                            </p>
                            <p className="text-xs text-gray-600">
                              {group.meetingSchedule.time} - {group.meetingSchedule.frequency}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Not scheduled</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        group.isActive
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {group.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/groups/${group._id}`)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/groups/${group._id}/edit`)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </BulkSelectRow>
                )
              })}
            </TableBody>
          </BulkSelectableTable>

          {groups.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No groups found matching your criteria.
            </div>
          )}
        </Card>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={!pagination.hasPrev}
                onClick={() => {
                  const newParams = new URLSearchParams(urlSearchParams)
                  newParams.set('page', (pagination.page - 1).toString())
                  setUrlSearchParams(newParams)
                }}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={!pagination.hasNext}
                onClick={() => {
                  const newParams = new URLSearchParams(urlSearchParams)
                  newParams.set('page', (pagination.page + 1).toString())
                  setUrlSearchParams(newParams)
                }}
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
    </Layout>
  )
}