import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Filter, Download, Users, Phone, Mail, Edit, Eye, Trash2, Archive, Upload } from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import SearchInput from '@/components/ui/SearchInput'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { BulkSelectableTable, BulkSelectHeader, BulkSelectRow, TableBody, TableHead, TableCell } from '@/components/ui/BulkSelectableTable'
import BulkActions, { commonBulkActions, BulkAction } from '@/components/ui/BulkActions'
import BulkConfirmationModal from '@/components/ui/BulkConfirmationModal'
import BulkProgressModal from '@/components/ui/BulkProgressModal'
import BulkEditModal from '@/components/ui/BulkEditModal'
import BulkUploadModal from '@/components/ui/BulkUploadModal'
import { useBulkSelection } from '@/hooks/useBulkSelection'
import { Member, MemberSearchParams, membersService } from '@/services/members'
import { bulkOperationsService } from '@/services/bulkOperations'
import { downloadCSV, BulkOperationProgress } from '@/utils/bulkOperations'
import { formatDate } from '@/utils/formatters'

export default function MembersWithBulkOperations() {
  const navigate = useNavigate()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [searchParams, setSearchParams] = useState<MemberSearchParams>({
    page: 1,
    limit: 20,
    search: ''
  })
  const [pagination, setPagination] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)

  // Bulk operations state
  const bulkSelection = useBulkSelection<Member>()
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

  useEffect(() => {
    loadMembers()
  }, [searchParams.page, searchParams.limit, searchParams.search, searchParams.membershipStatus, searchParams.gender])

  useEffect(() => {
    loadStats()
  }, [])

  const loadMembers = async () => {
    try {
      setError(null)
      const response = await membersService.getMembers(searchParams)
      setMembers(response.items || [])
      setPagination(response.pagination)
    } catch (error: any) {
      console.error('Error loading members:', error)
      if (error.code === 401) {
        setError({
          status: 401,
          message: 'Authentication required to view members',
          details: error.message
        })
      } else {
        setError({
          status: error.code || 500,
          message: 'Failed to load members',
          details: error.message
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await membersService.getMemberStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error loading member stats:', error)
    }
  }

  const handleSearch = (search: string) => {
    setSearchParams(prev => ({ ...prev, search, page: 1 }))
  }

  const handleFilter = (filters: Partial<MemberSearchParams>) => {
    setSearchParams(prev => ({ ...prev, ...filters, page: 1 }))
  }

  // Bulk operations handlers
  const handleBulkDelete = () => {
    setBulkConfirmation({
      isOpen: true,
      action: 'delete'
    })
  }

  const handleBulkExport = () => {
    const selectedMembers = bulkSelection.getSelectedItems(members)
    downloadCSV(selectedMembers, 'members_export', [
      '_id', 'firstName', 'lastName', 'email', 'phone', 'gender', 'maritalStatus',
      'district', 'unit', 'membershipStatus', 'dateJoined', 'occupation'
    ])
    bulkSelection.clearSelection()
  }

  const handleBulkArchive = () => {
    setBulkConfirmation({
      isOpen: true,
      action: 'archive',
      title: 'Archive Members',
      message: `Archive ${bulkSelection.getSelectedCount()} members? They will be marked as inactive.`
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
    await loadMembers() // Refresh the members list
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
        result = await bulkOperationsService.bulkDelete('members', selectedIds, (progress) => {
          setBulkProgress(prev => ({ ...prev, progress }))
        })
      } else if (action === 'archive') {
        result = await bulkOperationsService.bulkUpdate('members', selectedIds, { membershipStatus: 'inactive' }, (progress) => {
          setBulkProgress(prev => ({ ...prev, progress }))
        })
      }

      if (result) {
        setBulkProgress(prev => ({
          ...prev,
          isComplete: true,
          errors: result.errors || []
        }))

        // Refresh the members list
        await loadMembers()
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
      const result = await bulkOperationsService.bulkUpdate('members', selectedIds, data, (progress) => {
        setBulkProgress(prev => ({ ...prev, progress }))
      })

      setBulkProgress(prev => ({
        ...prev,
        isComplete: true,
        errors: result.errors || []
      }))

      setBulkEdit({ isOpen: false, loading: false })
      await loadMembers()
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

  const getMembershipStatusBadge = (status: string) => {
    const statusColors = {
      new_convert: 'bg-blue-100 text-blue-800 border-blue-200',
      worker: 'bg-green-100 text-green-800 border-green-200',
      volunteer: 'bg-purple-100 text-purple-800 border-purple-200',
      leader: 'bg-orange-100 text-orange-800 border-orange-200',
      district_pastor: 'bg-red-100 text-red-800 border-red-200',
      champ: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      unit_head: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      transferred: 'bg-gray-100 text-gray-600 border-gray-200'
    }
    return statusColors[status as keyof typeof statusColors] || statusColors.new_convert
  }

  const getLeadershipRoles = (member: Member) => {
    const roles = []
    if (member.leadershipRoles?.isDistrictPastor) roles.push('District Pastor')
    if (member.leadershipRoles?.isChamp) roles.push('Champ')
    if (member.leadershipRoles?.isUnitHead) roles.push('Unit Head')
    return roles
  }

  // Define bulk actions
  const bulkActions: BulkAction[] = [
    {
      id: 'upload',
      label: 'Upload File',
      icon: <Upload className="w-4 h-4" />,
      variant: 'primary',
      onClick: handleBulkUpload,
      standalone: true // This action doesn't require selection
    },
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
      key: 'membershipStatus',
      label: 'Membership Status',
      type: 'select' as const,
      options: [
        { value: 'new_convert', label: 'New Convert' },
        { value: 'worker', label: 'Worker' },
        { value: 'volunteer', label: 'Volunteer' },
        { value: 'leader', label: 'Leader' },
        { value: 'district_pastor', label: 'District Pastor' },
        { value: 'champ', label: 'Champ' },
        { value: 'unit_head', label: 'Unit Head' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'transferred', label: 'Transferred' }
      ]
    },
    {
      key: 'district',
      label: 'District',
      type: 'text' as const,
      placeholder: 'Enter new district'
    },
    {
      key: 'unit',
      label: 'Unit',
      type: 'text' as const,
      placeholder: 'Enter new unit'
    },
    {
      key: 'notes',
      label: 'Notes',
      type: 'text' as const,
      placeholder: 'Add notes'
    }
  ]

  if (loading) {
    return (
      <Layout
        title="Members"
        headerActions={
          <Button onClick={() => navigate('/members/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        }
      >
        <SkeletonTable />
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Members">
        <ErrorBoundary
          error={error}
          onRetry={loadMembers}
        />
      </Layout>
    )
  }

  const isAllSelected = members.length > 0 && members.every(member => bulkSelection.selectedItems.has(member._id))
  const isIndeterminate = members.some(member => bulkSelection.selectedItems.has(member._id)) && !isAllSelected

  return (
    <Layout
      title="Members"
      headerActions={
        <Button onClick={() => navigate('/members/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Bulk Actions Bar */}
        <BulkActions
          selectedCount={bulkSelection.getSelectedCount()}
          totalCount={members.length}
          onClearSelection={bulkSelection.clearSelection}
          actions={bulkActions}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Total Members</h3>
                  <p className="text-2xl font-bold text-blue-600">{pagination?.total || 0}</p>
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
                  <p className="text-2xl font-bold text-green-600">
                    {stats?.activeCount || 0}
                  </p>
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
                  <h3 className="text-sm font-medium text-gray-600">New This Month</h3>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats?.newThisMonth || 0}
                  </p>
                </div>
                <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-orange-600 rounded-full"></div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Search members by name, email, or phone..."
                onSearch={handleSearch}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={searchParams.membershipStatus || ''}
                onChange={(e) => handleFilter({ membershipStatus: e.target.value as any })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="new_convert">New Convert</option>
                <option value="worker">Worker</option>
                <option value="volunteer">Volunteer</option>
                <option value="leader">Leader</option>
                <option value="district_pastor">District Pastor</option>
                <option value="champ">Champ</option>
                <option value="unit_head">Unit Head</option>
                <option value="inactive">Inactive</option>
                <option value="transferred">Transferred</option>
              </select>

              <select
                value={searchParams.gender || ''}
                onChange={(e) => handleFilter({ gender: e.target.value as any })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Members Table */}
        <Card className="overflow-hidden">
          <BulkSelectableTable>
            <BulkSelectHeader
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onToggle={() => bulkSelection.selectAll(members)}
            >
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Leadership</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </BulkSelectHeader>
            <TableBody>
              {members.map((member) => (
                <BulkSelectRow
                  key={member._id}
                  checked={bulkSelection.selectedItems.has(member._id)}
                  onToggle={() => bulkSelection.selectItem(member._id)}
                  onClick={() => navigate(`/members/${member._id}`)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {member.gender} • {member.maritalStatus}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {member.email}
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {member.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{typeof member.district === 'object' ? member.district?.name : member.district}</div>
                      {member.unit && <div className="text-gray-500">{typeof member.unit === 'object' ? member.unit?.name : member.unit}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getMembershipStatusBadge(member.membershipStatus)}`}>
                      {member.membershipStatus.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {getLeadershipRoles(member).map((role, index) => (
                        <div key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mb-1">
                          {role}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(member.dateJoined)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/members/${member._id}`)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/members/${member._id}/edit`)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </BulkSelectRow>
              ))}
            </TableBody>
          </BulkSelectableTable>

          {members.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No members found matching your criteria.
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
                onClick={() => setSearchParams(prev => ({ ...prev, page: prev.page! - 1 }))}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={!pagination.hasNext}
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
        entityName="member"
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
        entityName="member"
        loading={bulkEdit.loading}
      />

      {/* Bulk Progress Modal */}
      <BulkProgressModal
        isOpen={bulkProgress.isOpen}
        onClose={() => setBulkProgress(prev => ({ ...prev, isOpen: false }))}
        operation={bulkProgress.operation}
        entityName="member"
        progress={bulkProgress.progress}
        isComplete={bulkProgress.isComplete}
        errors={bulkProgress.errors}
      />

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={bulkUpload.isOpen}
        onClose={() => setBulkUpload({ isOpen: false })}
        entityName="member"
        entityType="members"
        onSuccess={handleUploadSuccess}
        templateColumns={[
          'firstName', 'lastName', 'email', 'phone', 'gender', 'maritalStatus',
          'district', 'unit', 'membershipStatus', 'dateJoined', 'occupation',
          'address', 'dateOfBirth', 'emergencyContact'
        ]}
      />
    </Layout>
  )
}