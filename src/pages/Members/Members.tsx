import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Phone,
  Mail,
  Edit,
  Eye,
  Download,
  MapPin,
  Calendar,
  UserPlus,
  X,
  User,
  Filter,
  Building2,
  Users,
  Home
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { SkeletonTable } from '@/components/ui/Skeleton'
import PageToolbar, { SearchResult } from '@/components/ui/PageToolbar'
import FilterModal from '@/components/ui/FilterModal'
import { Member, MemberSearchParams, membersService } from '@/services/members-unified'
import { groupsService, Group } from '@/services/groups'
import { branchesService } from '@/services/branches'
import { formatDate } from '@/utils/formatters'
import { useAppStore } from '@/store'
import { useAuth } from '@/contexts/AuthContext-unified'

// Filter options
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'new_convert', label: 'New Convert' },
  { value: 'worker', label: 'Worker' },
  { value: 'leader', label: 'Leader' },
  { value: 'transferred', label: 'Transferred' },
]

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

const maritalStatusOptions = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
]

export default function Members() {
  const navigate = useNavigate()
  const { selectedBranch, branches } = useAppStore()
  const { hasPermission } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'assigned' | 'unassigned'>('assigned')
  const [searchParams, setSearchParams] = useState<MemberSearchParams>({
    page: 1,
    limit: 20,
    search: ''
  })
  const [pagination, setPagination] = useState<any>(null)
  const [assignedCount, setAssignedCount] = useState(0)
  const [unassignedCount, setUnassignedCount] = useState(0)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [districts, setDistricts] = useState<Group[]>([])
  const [units, setUnits] = useState<Group[]>([])
  const [allBranches, setAllBranches] = useState<any[]>([])
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [assigning, setAssigning] = useState(false)

  // Location assignment modal state
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [locationMember, setLocationMember] = useState<Member | null>(null)
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedDistrictId, setSelectedDistrictId] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [savingLocation, setSavingLocation] = useState(false)

  // Bulk selection state
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [showBulkLocationModal, setShowBulkLocationModal] = useState(false)
  const [bulkBranchId, setBulkBranchId] = useState('')
  const [bulkDistrictId, setBulkDistrictId] = useState('')
  const [bulkUnitId, setBulkUnitId] = useState('')
  const [savingBulkLocation, setSavingBulkLocation] = useState(false)

  // Permission checks
  const canAssignDistrict = hasPermission('members:assign-district')
  const canAssignUnit = hasPermission('members:assign-unit')
  const canUpdateMember = hasPermission('members:update')
  const canAssignLocation = canAssignDistrict || canAssignUnit || canUpdateMember

  // Bulk selection helpers
  const allSelected = members.length > 0 && selectedMembers.size === members.length
  const someSelected = selectedMembers.size > 0 && selectedMembers.size < members.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedMembers(new Set())
    } else {
      setSelectedMembers(new Set(members.map(m => m._id)))
    }
  }

  const toggleSelectMember = (memberId: string) => {
    setSelectedMembers(prev => {
      const next = new Set(prev)
      if (next.has(memberId)) {
        next.delete(memberId)
      } else {
        next.add(memberId)
      }
      return next
    })
  }

  const clearSelection = () => {
    setSelectedMembers(new Set())
  }

  // Filter states (applied filters)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [maritalStatusFilter, setMaritalStatusFilter] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')

  // Temporary filter states (for modal - only applied when user clicks Apply)
  const [tempStatusFilter, setTempStatusFilter] = useState('')
  const [tempGenderFilter, setTempGenderFilter] = useState('')
  const [tempMaritalStatusFilter, setTempMaritalStatusFilter] = useState('')
  const [tempDistrictFilter, setTempDistrictFilter] = useState('')
  const [tempBranchFilter, setTempBranchFilter] = useState('')
  const [tempDateFrom, setTempDateFrom] = useState('')
  const [tempDateTo, setTempDateTo] = useState('')

  // Applied date range filters
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')

  // Show branch filter only when viewing all expressions
  const showBranchFilter = !selectedBranch && branches.length > 0

  const hasActiveFilters = statusFilter || genderFilter || maritalStatusFilter || districtFilter || branchFilter || dateFromFilter || dateToFilter
  const activeFilterCount = [statusFilter, genderFilter, maritalStatusFilter, districtFilter, branchFilter, dateFromFilter, dateToFilter].filter(Boolean).length

  const openFilterModal = () => {
    // Sync temp filters with current applied filters
    setTempStatusFilter(statusFilter)
    setTempGenderFilter(genderFilter)
    setTempMaritalStatusFilter(maritalStatusFilter)
    setTempDistrictFilter(districtFilter)
    setTempBranchFilter(branchFilter)
    setTempDateFrom(dateFromFilter)
    setTempDateTo(dateToFilter)
    setShowFilterModal(true)
  }

  const closeFilterModal = () => {
    setShowFilterModal(false)
  }

  const applyFilters = () => {
    setStatusFilter(tempStatusFilter)
    setGenderFilter(tempGenderFilter)
    setMaritalStatusFilter(tempMaritalStatusFilter)
    setDistrictFilter(tempDistrictFilter)
    setBranchFilter(tempBranchFilter)
    setDateFromFilter(tempDateFrom)
    setDateToFilter(tempDateTo)
    setShowFilterModal(false)
  }

  const clearAllFilters = () => {
    setTempStatusFilter('')
    setTempGenderFilter('')
    setTempMaritalStatusFilter('')
    setTempDistrictFilter('')
    setTempBranchFilter('')
    setTempDateFrom('')
    setTempDateTo('')
  }

  const clearAppliedFilters = () => {
    setStatusFilter('')
    setGenderFilter('')
    setMaritalStatusFilter('')
    setDistrictFilter('')
    setBranchFilter('')
    setDateFromFilter('')
    setDateToFilter('')
  }

  useEffect(() => {
    loadMembers()
  }, [searchParams, activeTab, statusFilter, genderFilter, maritalStatusFilter, districtFilter, branchFilter, dateFromFilter, dateToFilter, selectedBranch])

  useEffect(() => {
    loadCounts()
  }, [statusFilter, genderFilter, maritalStatusFilter, districtFilter, branchFilter, dateFromFilter, dateToFilter, selectedBranch])

  useEffect(() => {
    loadLocationData()
  }, [])

  const loadLocationData = async () => {
    try {
      // Try dedicated endpoints first, fall back to generic groups endpoint
      let districtsData: Group[] = []
      let unitsData: Group[] = []

      try {
        const districtsRes = await groupsService.getDistricts({ limit: 100 })
        districtsData = districtsRes.items || []
      } catch (e) {
        console.log('Districts endpoint failed, trying generic groups')
        const res = await groupsService.getGroups({ type: 'district', limit: 100 })
        districtsData = res.items || []
      }

      try {
        const unitsRes = await groupsService.getUnits({ limit: 100 })
        unitsData = unitsRes.items || []
      } catch (e) {
        console.log('Units endpoint failed, trying generic groups')
        const res = await groupsService.getGroups({ type: 'unit', limit: 100 })
        unitsData = res.items || []
      }

      setDistricts(districtsData)
      setUnits(unitsData)

      // Load branches separately
      try {
        const branchesRes = await branchesService.getBranches()
        setAllBranches(branchesRes || [])
      } catch (e) {
        console.log('Branches not available')
        setAllBranches([])
      }
    } catch (error) {
      console.error('Error loading location data:', error)
    }
  }

  const hasDistrict = (member: Member) => {
    if (!member.district) return false
    // Handle both populated (object) and unpopulated (string ID) districts
    if (typeof member.district === 'string') return member.district.length > 0
    return member.district._id && member.district._id.length > 0
  }

  const loadMembers = async () => {
    try {
      setError(null)
      setLoading(true)

      // Build params with filters - only include non-empty values
      // Use selectedBranch (global) or branchFilter (from filter modal)
      const effectiveBranchId = selectedBranch?._id || branchFilter || undefined
      const params: MemberSearchParams = {
        ...searchParams,
        membershipStatus: statusFilter || undefined,
        gender: genderFilter ? (genderFilter as 'male' | 'female') : undefined,
        maritalStatus: maritalStatusFilter ? (maritalStatusFilter as Member['maritalStatus']) : undefined,
        branchId: effectiveBranchId,
        districtId: districtFilter || undefined,
        dateJoinedFrom: dateFromFilter || undefined,
        dateJoinedTo: dateToFilter || undefined,
      }
      const response = await membersService.getMembers(params)

      // Filter members based on active tab
      const filteredMembers = activeTab === 'assigned'
        ? response.items.filter(member => hasDistrict(member))
        : response.items.filter(member => !hasDistrict(member))

      setMembers(filteredMembers)
      setPagination(response.pagination)
    } catch (error: any) {
      console.error('Error loading members:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  const loadCounts = async () => {
    try {
      // Build params with same filters as loadMembers
      const effectiveBranchId = selectedBranch?._id || branchFilter || undefined
      const filterParams: MemberSearchParams = {
        membershipStatus: statusFilter || undefined,
        gender: genderFilter ? (genderFilter as 'male' | 'female') : undefined,
        maritalStatus: maritalStatusFilter ? (maritalStatusFilter as Member['maritalStatus']) : undefined,
        branchId: effectiveBranchId,
        districtId: districtFilter || undefined,
        dateJoinedFrom: dateFromFilter || undefined,
        dateJoinedTo: dateToFilter || undefined,
      }

      // Load members in batches to get accurate counts with filters applied
      let allMembers: Member[] = []
      let currentPage = 1
      let hasMore = true

      while (hasMore && currentPage <= 10) { // Limit to 10 pages to avoid infinite loops
        const response = await membersService.getMembers({ ...filterParams, page: currentPage, limit: 100 })
        allMembers = [...allMembers, ...response.items]
        hasMore = response.pagination.hasNext
        currentPage++
      }

      const assigned = allMembers.filter(member => hasDistrict(member)).length
      const unassigned = allMembers.filter(member => !hasDistrict(member)).length
      setAssignedCount(assigned)
      setUnassignedCount(unassigned)
    } catch (error) {
      console.error('Error loading counts:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams(prev => ({ ...prev, search: searchTerm, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }))
  }

  const handleTabChange = (tab: 'assigned' | 'unassigned') => {
    setActiveTab(tab)
    setSearchParams(prev => ({ ...prev, page: 1 }))
  }

  // Fetch search results for autocomplete
  const fetchSearchResults = useCallback(async (query: string): Promise<SearchResult[]> => {
    try {
      const response = await membersService.getMembers({ search: query, limit: 5 })
      return response.items.map((member) => ({
        id: member._id,
        title: `${member.firstName} ${member.lastName}`,
        subtitle: member.email || member.phone,
        type: 'Member',
        path: `/members/${member._id}`,
        icon: <User className="h-4 w-4 text-green-600" />
      }))
    } catch (error) {
      console.error('Error fetching search results:', error)
      return []
    }
  }, [])

  const handleSelectSearchResult = useCallback((result: SearchResult) => {
    navigate(result.path || `/members/${result.id}`)
  }, [navigate])

  const handleOpenAssignModal = (member: Member) => {
    setSelectedMember(member)
    setSelectedDistrict('')
    setShowAssignModal(true)
  }

  const handleCloseAssignModal = () => {
    setShowAssignModal(false)
    setSelectedMember(null)
    setSelectedDistrict('')
  }

  const handleAssignDistrict = async () => {
    if (!selectedMember || !selectedDistrict) return

    try {
      setAssigning(true)
      console.log('Assigning district:', {
        memberId: selectedMember._id,
        memberName: `${selectedMember.firstName} ${selectedMember.lastName}`,
        districtId: selectedDistrict
      })

      const updatedMember = await membersService.updateMember(selectedMember._id, {
        district: selectedDistrict
      })

      console.log('District assigned successfully:', updatedMember)

      // Reload members and counts
      await Promise.all([loadMembers(), loadCounts()])
      handleCloseAssignModal()

      // Show success message
      alert(`Successfully assigned ${selectedMember.firstName} ${selectedMember.lastName} to the district!`)
    } catch (error: any) {
      console.error('Error assigning district:', error)
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      })
      alert('Failed to assign district: ' + (error.response?.data?.message || error.message || 'Unknown error'))
    } finally {
      setAssigning(false)
    }
  }

  // Location Modal Handlers
  const handleOpenLocationModal = (member: Member) => {
    setLocationMember(member)
    // Pre-fill with existing values - prioritize member.branch directly
    const memberBranchId = typeof member.branch === 'object'
      ? member.branch?._id
      : member.branch || ''
    setSelectedBranchId(memberBranchId || member.district?.branch?._id || member.unit?.branch?._id || '')
    setSelectedDistrictId(typeof member.district === 'object' ? member.district?._id : member.district || '')
    setSelectedUnitId(typeof member.unit === 'object' ? member.unit?._id : member.unit || '')
    setShowLocationModal(true)
  }

  const handleCloseLocationModal = () => {
    setShowLocationModal(false)
    setLocationMember(null)
    setSelectedBranchId('')
    setSelectedDistrictId('')
    setSelectedUnitId('')
  }

  const handleSaveLocation = async () => {
    if (!locationMember) return

    try {
      setSavingLocation(true)

      const updateData: any = {}
      if (selectedBranchId) updateData.branch = selectedBranchId
      if (selectedDistrictId) updateData.district = selectedDistrictId
      if (selectedUnitId) updateData.unit = selectedUnitId

      await membersService.updateMember(locationMember._id, updateData)

      // Reload members and counts
      await Promise.all([loadMembers(), loadCounts()])
      handleCloseLocationModal()

      alert(`Successfully updated location for ${locationMember.firstName} ${locationMember.lastName}!`)
    } catch (error: any) {
      console.error('Error updating location:', error)
      alert('Failed to update location: ' + (error.response?.data?.message || error.message || 'Unknown error'))
    } finally {
      setSavingLocation(false)
    }
  }

  // Filter districts and units - show all by default, filter only if branch/district selected
  const getFilteredDistricts = (branchId: string) => {
    if (!branchId) return districts
    const filtered = districts.filter(d => {
      const dBranch = (d as any).branch
      // Handle both populated object and string ID
      const dBranchId = typeof dBranch === 'object' ? dBranch?._id : dBranch
      return dBranchId === branchId || String(dBranchId) === branchId
    })
    // If filtering results in empty, return all districts (branch might not be set on groups)
    return filtered.length > 0 ? filtered : districts
  }

  const getFilteredUnits = (districtId: string, branchId: string) => {
    let filtered = units

    if (districtId) {
      filtered = units.filter(u => {
        const uDistrict = (u as any).district
        const uDistrictId = typeof uDistrict === 'object' ? uDistrict?._id : uDistrict
        return uDistrictId === districtId || String(uDistrictId) === districtId
      })
    } else if (branchId) {
      filtered = units.filter(u => {
        const uBranch = (u as any).branch
        const uBranchId = typeof uBranch === 'object' ? uBranch?._id : uBranch
        return uBranchId === branchId || String(uBranchId) === branchId
      })
    }

    // If filtering results in empty, return all units
    return filtered.length > 0 ? filtered : units
  }

  // Single member modal filtered options
  const filteredDistricts = getFilteredDistricts(selectedBranchId)
  const filteredUnits = getFilteredUnits(selectedDistrictId, selectedBranchId)

  // Bulk modal filtered options
  const bulkFilteredDistricts = getFilteredDistricts(bulkBranchId)
  const bulkFilteredUnits = getFilteredUnits(bulkDistrictId, bulkBranchId)

  // Bulk Location Modal Handlers
  const handleOpenBulkLocationModal = () => {
    setBulkBranchId('')
    setBulkDistrictId('')
    setBulkUnitId('')
    setShowBulkLocationModal(true)
  }

  const handleCloseBulkLocationModal = () => {
    setShowBulkLocationModal(false)
    setBulkBranchId('')
    setBulkDistrictId('')
    setBulkUnitId('')
  }

  const handleSaveBulkLocation = async () => {
    if (selectedMembers.size === 0) return

    try {
      setSavingBulkLocation(true)

      const updateData: any = {}
      if (bulkBranchId) updateData.branch = bulkBranchId
      if (bulkDistrictId) updateData.district = bulkDistrictId
      if (bulkUnitId) updateData.unit = bulkUnitId

      // Update all selected members
      const updatePromises = Array.from(selectedMembers).map(memberId =>
        membersService.updateMember(memberId, updateData)
      )

      await Promise.all(updatePromises)

      // Reload members and counts
      await Promise.all([loadMembers(), loadCounts()])
      handleCloseBulkLocationModal()
      clearSelection()

      alert(`Successfully updated location for ${selectedMembers.size} member(s)!`)
    } catch (error: any) {
      console.error('Error updating bulk location:', error)
      alert('Failed to update locations: ' + (error.response?.data?.message || error.message || 'Unknown error'))
    } finally {
      setSavingBulkLocation(false)
    }
  }

  // Export members to CSV
  const handleExport = async () => {
    try {
      // Build params with same filters
      const effectiveBranchId = selectedBranch?._id || branchFilter || undefined
      const filterParams: MemberSearchParams = {
        membershipStatus: statusFilter || undefined,
        gender: genderFilter ? (genderFilter as 'male' | 'female') : undefined,
        maritalStatus: maritalStatusFilter ? (maritalStatusFilter as Member['maritalStatus']) : undefined,
        branchId: effectiveBranchId,
        districtId: districtFilter || undefined,
        dateJoinedFrom: dateFromFilter || undefined,
        dateJoinedTo: dateToFilter || undefined,
      }

      // Load all filtered members
      let allMembers: Member[] = []
      let currentPage = 1
      let hasMore = true

      while (hasMore && currentPage <= 20) {
        const response = await membersService.getMembers({ ...filterParams, page: currentPage, limit: 100 })
        const filteredItems = activeTab === 'assigned'
          ? response.items.filter(member => hasDistrict(member))
          : response.items.filter(member => !hasDistrict(member))
        allMembers = [...allMembers, ...filteredItems]
        hasMore = response.pagination.hasNext
        currentPage++
      }

      if (allMembers.length === 0) {
        alert('No members to export')
        return
      }

      // Create CSV content
      const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Gender', 'Status', 'Branch', 'District', 'Unit', 'Date Joined']
      const rows = allMembers.map(member => [
        member.firstName,
        member.lastName,
        member.email,
        member.phone,
        member.gender,
        member.membershipStatus,
        typeof member.branch === 'object' ? member.branch?.name || '' : '',
        member.district?.name || '',
        typeof member.unit === 'object' ? member.unit?.name || '' : '',
        member.dateJoined ? new Date(member.dateJoined).toLocaleDateString() : ''
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `members-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting members:', error)
      alert('Failed to export members')
    }
  }

  // Clear selection when members list changes
  useEffect(() => {
    setSelectedMembers(new Set())
  }, [activeTab, searchParams.page])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'worker':
      case 'leader':
        return 'success'
      case 'inactive':
      case 'transferred':
        return 'secondary'
      case 'new_convert':
        return 'primary'
      default:
        return 'secondary'
    }
  }

  if (loading) {
    return (
      <Layout title="Members" subtitle="Manage church members">
        <SkeletonTable />
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Members" subtitle="Manage church members">
        <ErrorBoundary error={error} onRetry={loadMembers} />
      </Layout>
    )
  }

  return (
    <Layout title="Members" subtitle="Manage church members">
      <div className="space-y-6">
        {/* Page Toolbar with Search and Actions */}
        <PageToolbar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchSubmit={handleSearch}
          searchPlaceholder="Search members by name, email, or phone..."
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
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/members/new')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </>
          }
        />

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="border-b border-gray-200"
        >
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => handleTabChange('assigned')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'assigned'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Tribesmen List
              <span className="ml-2 py-0.5 px-2.5 rounded-full text-xs bg-gray-100 text-gray-900">
                {assignedCount}
              </span>
            </button>
            <button
              onClick={() => handleTabChange('unassigned')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'unassigned'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Pending District Assignment
              <span className="ml-2 py-0.5 px-2.5 rounded-full text-xs bg-gray-100 text-gray-900">
                {unassignedCount}
              </span>
            </button>
          </nav>
        </motion.div>

        {/* Bulk Action Bar */}
        <AnimatePresence>
          {selectedMembers.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-primary-50 border border-primary-200 rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-primary-700">
                  {selectedMembers.size} member{selectedMembers.size !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={clearSelection}
                  className="text-sm text-primary-600 hover:text-primary-800 underline"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleOpenBulkLocationModal}
                  className="flex items-center gap-1.5"
                >
                  <MapPin className="h-4 w-4" />
                  Assign Location
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Members Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            {members.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {activeTab === 'assigned' ? 'No members with assigned districts' : 'No members without districts'}
                </h3>
                <p className="text-muted-foreground">
                  {activeTab === 'assigned'
                    ? 'All members have been assigned to districts or no members exist yet.'
                    : 'All members have districts assigned or no members exist yet.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      {canAssignLocation && (
                        <th className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = someSelected
                            }}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {members.map((member, index) => (
                    <motion.tr
                      key={member._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`hover:bg-muted/50 transition-colors ${selectedMembers.has(member._id) ? 'bg-primary-50' : ''}`}
                    >
                      {canAssignLocation && (
                        <td className="px-4 py-4 w-10">
                          <input
                            type="checkbox"
                            checked={selectedMembers.has(member._id)}
                            onChange={() => toggleSelectMember(member._id)}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {member.firstName} {member.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="h-3 w-3 mr-1" />
                            {member.phone}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Mail className="h-3 w-3 mr-1" />
                            {member.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusColor(member.membershipStatus)}>
                          {member.membershipStatus.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          {/* Branch - Top level, darkest */}
                          <div className="flex items-center text-sm font-medium text-gray-800">
                            <Building2 className="h-3 w-3 mr-1.5 flex-shrink-0 text-primary-600" />
                            <span className="truncate max-w-[120px]">
                              {typeof member.branch === 'object' ? member.branch?.name : 'No branch'}
                            </span>
                          </div>
                          {/* District - Mid level */}
                          <div className="flex items-center text-xs text-gray-500">
                            <Users className="h-3 w-3 mr-1.5 flex-shrink-0 text-gray-400" />
                            <span className="truncate max-w-[120px]">
                              {member.district?.name || 'No district'}
                            </span>
                          </div>
                          {/* Unit - Bottom level, lightest */}
                          {member.unit && (
                            <div className="flex items-center text-xs text-gray-400">
                              <Home className="h-3 w-3 mr-1.5 flex-shrink-0 text-gray-300" />
                              <span className="truncate max-w-[120px]">
                                {typeof member.unit === 'object' ? member.unit.name : 'Assigned'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(member.dateJoined)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1">
                          {canAssignLocation && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenLocationModal(member)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Assign Location"
                            >
                              <MapPin className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/members/${member._id}`)}
                            className="h-8 w-8 p-0"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/members/${member._id}/edit`)}
                            className="h-8 w-8 p-0"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {members.length > 0 && pagination && pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasPrev}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasNext}
                      onClick={() => handlePageChange(pagination.page + 1)}
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

      {/* Assign District Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Assign District</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Assign {selectedMember?.firstName} {selectedMember?.lastName} to a district
                  </p>
                </div>
                <button
                  onClick={handleCloseAssignModal}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Select District
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                    disabled={assigning}
                  >
                    <option value="">Choose a district...</option>
                    {districts.map((district) => (
                      <option key={district._id} value={district._id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={handleCloseAssignModal}
                  disabled={assigning}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignDistrict}
                  disabled={!selectedDistrict || assigning}
                  className="flex items-center gap-2"
                >
                  {assigning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Assign District
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={closeFilterModal}
        onApply={applyFilters}
        onReset={clearAllFilters}
        title="Filter Members"
        subtitle="Refine your search results"
        activeFilterCount={activeFilterCount}
        filters={[
          // Branch filter - only shown when viewing all expressions
          ...(showBranchFilter ? [{
            id: 'branch',
            label: 'Expression',
            value: tempBranchFilter,
            onChange: setTempBranchFilter,
            options: branches.map(b => ({ value: b._id, label: b.name })),
            placeholder: 'All Expressions',
          }] : []),
          {
            id: 'status',
            label: 'Membership Status',
            value: tempStatusFilter,
            onChange: setTempStatusFilter,
            options: statusOptions,
            placeholder: 'All Status',
          },
          {
            id: 'gender',
            label: 'Gender',
            value: tempGenderFilter,
            onChange: setTempGenderFilter,
            options: genderOptions,
            placeholder: 'All Genders',
          },
          {
            id: 'maritalStatus',
            label: 'Marital Status',
            value: tempMaritalStatusFilter,
            onChange: setTempMaritalStatusFilter,
            options: maritalStatusOptions,
            placeholder: 'All Marital Status',
          },
          {
            id: 'district',
            label: 'District',
            value: tempDistrictFilter,
            onChange: setTempDistrictFilter,
            options: districts.map(d => ({ value: d._id, label: d.name })),
            placeholder: 'All Districts',
          },
        ]}
        dateRange={{
          id: 'dateJoined',
          label: 'Date Joined',
          fromValue: tempDateFrom,
          toValue: tempDateTo,
          onFromChange: setTempDateFrom,
          onToChange: setTempDateTo,
        }}
      />

      {/* Assign Location Modal */}
      <AnimatePresence>
        {showLocationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">Assign Location</h3>
                    <p className="text-blue-100 text-sm">
                      {locationMember?.firstName} {locationMember?.lastName}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseLocationModal}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                {/* Current Location Info */}
                {(locationMember?.district || locationMember?.unit) && (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Current Location</p>
                    <div className="space-y-1">
                      {locationMember?.district && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>District: {typeof locationMember.district === 'object' ? locationMember.district.name : 'Assigned'}</span>
                        </div>
                      )}
                      {locationMember?.unit && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Home className="w-4 h-4 text-gray-400" />
                          <span>Unit: {typeof locationMember.unit === 'object' ? locationMember.unit.name : 'Assigned'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Branch Select */}
                {allBranches.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        Branch
                      </div>
                    </label>
                    <select
                      value={selectedBranchId}
                      onChange={(e) => {
                        setSelectedBranchId(e.target.value)
                        setSelectedDistrictId('')
                        setSelectedUnitId('')
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                      disabled={savingLocation}
                    >
                      <option value="">Select a branch...</option>
                      {allBranches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* District Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      District
                    </div>
                  </label>
                  <select
                    value={selectedDistrictId}
                    onChange={(e) => {
                      setSelectedDistrictId(e.target.value)
                      setSelectedUnitId('')
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                    disabled={savingLocation}
                  >
                    <option value="">Select a district...</option>
                    {(filteredDistricts.length > 0 ? filteredDistricts : districts).map((district) => (
                      <option key={district._id} value={district._id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                  {districts.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">No districts available</p>
                  )}
                </div>

                {/* Unit Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-gray-400" />
                      Unit
                    </div>
                  </label>
                  <select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                    disabled={savingLocation}
                  >
                    <option value="">Select a unit...</option>
                    {(filteredUnits.length > 0 ? filteredUnits : units).map((unit) => (
                      <option key={unit._id} value={unit._id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                  {units.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">No units available</p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={handleCloseLocationModal}
                  disabled={savingLocation}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveLocation}
                  disabled={(!selectedBranchId && !selectedDistrictId && !selectedUnitId) || savingLocation}
                  className="flex items-center gap-2"
                >
                  {savingLocation ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4" />
                      Save Location
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Assign Location Modal */}
      <AnimatePresence>
        {showBulkLocationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-green-500 to-green-600 px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">Bulk Assign Location</h3>
                    <p className="text-green-100 text-sm">
                      {selectedMembers.size} member{selectedMembers.size !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                  <button
                    onClick={handleCloseBulkLocationModal}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                  <p>This will update the location for all {selectedMembers.size} selected member{selectedMembers.size !== 1 ? 's' : ''}.</p>
                </div>

                {/* Branch Select */}
                {allBranches.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        Branch
                      </div>
                    </label>
                    <select
                      value={bulkBranchId}
                      onChange={(e) => {
                        setBulkBranchId(e.target.value)
                        setBulkDistrictId('')
                        setBulkUnitId('')
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-sm"
                      disabled={savingBulkLocation}
                    >
                      <option value="">Select a branch...</option>
                      {allBranches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* District Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      District
                    </div>
                  </label>
                  <select
                    value={bulkDistrictId}
                    onChange={(e) => {
                      setBulkDistrictId(e.target.value)
                      setBulkUnitId('')
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-sm"
                    disabled={savingBulkLocation}
                  >
                    <option value="">Select a district...</option>
                    {(bulkFilteredDistricts.length > 0 ? bulkFilteredDistricts : districts).map((district) => (
                      <option key={district._id} value={district._id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                  {districts.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">No districts available</p>
                  )}
                </div>

                {/* Unit Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-gray-400" />
                      Unit
                    </div>
                  </label>
                  <select
                    value={bulkUnitId}
                    onChange={(e) => setBulkUnitId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-sm"
                    disabled={savingBulkLocation}
                  >
                    <option value="">Select a unit...</option>
                    {(bulkFilteredUnits.length > 0 ? bulkFilteredUnits : units).map((unit) => (
                      <option key={unit._id} value={unit._id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                  {units.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">No units available</p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={handleCloseBulkLocationModal}
                  disabled={savingBulkLocation}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveBulkLocation}
                  disabled={(!bulkBranchId && !bulkDistrictId && !bulkUnitId) || savingBulkLocation}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  {savingBulkLocation ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating {selectedMembers.size}...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4" />
                      Update {selectedMembers.size} Member{selectedMembers.size !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  )
}