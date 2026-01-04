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
  Home,
  Cake,
  BarChart3,
  TrendingUp,
  UserCheck,
  UserX,
  Heart
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
  const [activeTab, setActiveTab] = useState<'assigned' | 'birthdays' | 'analytics'>('assigned')
  const [birthdayTimeFilter, setBirthdayTimeFilter] = useState<'past' | 'today' | 'future'>('today')
  const [searchParams, setSearchParams] = useState<MemberSearchParams>({
    page: 1,
    limit: 10,
    search: ''
  })
  const [pagination, setPagination] = useState<any>(null)
  const [assignedCount, setAssignedCount] = useState(0)
  const [birthdayCount, setBirthdayCount] = useState(0)
  const [allFilteredMembers, setAllFilteredMembers] = useState<Member[]>([])
  const [analyticsStats, setAnalyticsStats] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
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

  // Show branch filter only if user has permission to view all branches
  const canViewAllBranches = hasPermission('branches:view-all')
  const showBranchFilter = canViewAllBranches && branches.length > 0

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
  }, [searchParams, activeTab, birthdayTimeFilter, statusFilter, genderFilter, maritalStatusFilter, districtFilter, branchFilter, dateFromFilter, dateToFilter, selectedBranch])

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

  // Check if member has birthday this month
  const hasBirthdayThisMonth = (member: Member) => {
    if (!member.dateOfBirth) return false
    const currentMonth = new Date().getMonth() + 1 // 1-12

    // Handle different date formats: "YYYY-MM-DD", "MM-DD", or ISO string
    let birthMonth: number
    const dob = member.dateOfBirth

    if (dob.includes('T')) {
      // ISO date string
      birthMonth = new Date(dob).getMonth() + 1
    } else if (dob.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // YYYY-MM-DD format
      birthMonth = parseInt(dob.split('-')[1], 10)
    } else if (dob.match(/^\d{2}-\d{2}$/)) {
      // MM-DD format
      birthMonth = parseInt(dob.split('-')[0], 10)
    } else {
      // Try to parse as date
      const parsed = new Date(dob)
      if (!isNaN(parsed.getTime())) {
        birthMonth = parsed.getMonth() + 1
      } else {
        return false
      }
    }

    return birthMonth === currentMonth
  }

  // Get the birth day of the month for a member
  const getBirthDay = (member: Member): number | null => {
    if (!member.dateOfBirth) return null
    const dob = member.dateOfBirth

    if (dob.includes('T')) {
      // ISO date string
      return new Date(dob).getDate()
    } else if (dob.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // YYYY-MM-DD format
      return parseInt(dob.split('-')[2], 10)
    } else if (dob.match(/^\d{2}-\d{2}$/)) {
      // MM-DD format
      return parseInt(dob.split('-')[1], 10)
    } else {
      // Try to parse as date
      const parsed = new Date(dob)
      if (!isNaN(parsed.getTime())) {
        return parsed.getDate()
      }
      return null
    }
  }

  // Filter birthday members by past/today/future
  const filterBirthdaysByTime = (members: Member[], filter: 'past' | 'today' | 'future'): Member[] => {
    const today = new Date().getDate()

    return members.filter(member => {
      const birthDay = getBirthDay(member)
      if (birthDay === null) return false

      switch (filter) {
        case 'past':
          return birthDay < today
        case 'today':
          return birthDay === today
        case 'future':
          return birthDay > today
        default:
          return true
      }
    }).sort((a, b) => {
      const dayA = getBirthDay(a) || 0
      const dayB = getBirthDay(b) || 0
      return dayA - dayB // Sort ascending by day
    })
  }

  const loadMembers = async () => {
    try {
      setError(null)
      setLoading(true)

      // Build params with filters - only include non-empty values
      // Use selectedBranch (global) or branchFilter (from filter modal)
      const effectiveBranchId = selectedBranch?._id || branchFilter || undefined
      const filterParams: MemberSearchParams = {
        membershipStatus: statusFilter || undefined,
        gender: genderFilter ? (genderFilter as 'male' | 'female') : undefined,
        maritalStatus: maritalStatusFilter ? (maritalStatusFilter as Member['maritalStatus']) : undefined,
        branchId: effectiveBranchId,
        districtId: districtFilter || undefined,
        dateJoinedFrom: dateFromFilter || undefined,
        dateJoinedTo: dateToFilter || undefined,
        search: searchParams.search || undefined,
      }

      // Load all members to enable proper client-side filtering and pagination
      let allMembers: Member[] = []
      let currentPage = 1
      let hasMore = true

      while (hasMore && currentPage <= 20) { // Limit to 20 pages max
        const response = await membersService.getMembers({ ...filterParams, page: currentPage, limit: 100 })
        allMembers = [...allMembers, ...response.items]
        hasMore = response.pagination.hasNext
        currentPage++
      }

      // Filter members based on active tab
      let tabFilteredMembers: Member[]
      if (activeTab === 'assigned') {
        tabFilteredMembers = allMembers.filter(member => hasDistrict(member))
      } else {
        // First filter to get all birthdays this month
        const birthdayMembers = allMembers.filter(member => hasBirthdayThisMonth(member))
        // Then filter by past/today/future
        tabFilteredMembers = filterBirthdaysByTime(birthdayMembers, birthdayTimeFilter)
      }

      // Store all filtered members for reference
      setAllFilteredMembers(tabFilteredMembers)

      // Apply client-side pagination
      const page = searchParams.page || 1
      const limit = searchParams.limit || 10
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedMembers = tabFilteredMembers.slice(startIndex, endIndex)

      // Calculate pagination info
      const total = tabFilteredMembers.length
      const totalPages = Math.ceil(total / limit)

      setMembers(paginatedMembers)
      setPagination({
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      })

      // Update counts
      const assigned = allMembers.filter(member => hasDistrict(member)).length
      const birthdays = allMembers.filter(member => hasBirthdayThisMonth(member)).length
      setAssignedCount(assigned)
      setBirthdayCount(birthdays)
    } catch (error: any) {
      console.error('Error loading members:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  // Counts are now calculated in loadMembers, this function is kept for backwards compatibility
  const loadCounts = async () => {
    // Counts are updated in loadMembers
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams(prev => ({ ...prev, search: searchTerm, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }))
  }

  const handleTabChange = (tab: 'assigned' | 'birthdays' | 'analytics') => {
    setActiveTab(tab)
    setSearchParams(prev => ({ ...prev, page: 1 }))
    if (tab === 'analytics' && !analyticsStats) {
      loadAnalytics()
    }
  }

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true)
      const effectiveBranchId = selectedBranch?._id || branchFilter || undefined
      const stats = await membersService.getMemberStats(
        effectiveBranchId,
        dateFromFilter || undefined,
        dateToFilter || undefined
      )
      setAnalyticsStats(stats)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setAnalyticsLoading(false)
    }
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
          : response.items.filter(member => hasBirthdayThisMonth(member))
        allMembers = [...allMembers, ...filteredItems]
        hasMore = response.pagination.hasNext
        currentPage++
      }

      if (allMembers.length === 0) {
        alert('No members to export')
        return
      }

      // Create CSV content
      const headers = activeTab === 'birthdays'
        ? ['First Name', 'Last Name', 'Email', 'Phone', 'Date of Birth', 'Gender', 'Status', 'Branch', 'District', 'Unit']
        : ['First Name', 'Last Name', 'Email', 'Phone', 'Gender', 'Status', 'Branch', 'District', 'Unit', 'Date Joined']
      const rows = allMembers.map(member => activeTab === 'birthdays'
        ? [
            member.firstName,
            member.lastName,
            member.email,
            member.phone,
            member.dateOfBirth || '',
            member.gender,
            member.membershipStatus,
            typeof member.branch === 'object' ? member.branch?.name || '' : '',
            member.district?.name || '',
            typeof member.unit === 'object' ? member.unit?.name || '' : '',
          ]
        : [
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
          ]
      )

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
      <div className="space-y-6 max-w-full overflow-hidden">
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
          className="border-b border-gray-200 overflow-x-auto"
        >
          <nav className="flex space-x-4 sm:space-x-8 min-w-max" aria-label="Tabs">
            <button
              onClick={() => handleTabChange('assigned')}
              className={`
                py-2.5 px-1 border-b-2 font-medium text-sm transition-colors
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
              onClick={() => handleTabChange('birthdays')}
              className={`
                py-2.5 px-1 border-b-2 font-medium text-sm transition-colors flex items-center
                ${activeTab === 'birthdays'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Cake className="h-4 w-4 mr-1.5" />
              Birthdays This Month
              <span className="ml-2 py-0.5 px-2.5 rounded-full text-xs bg-gray-100 text-gray-900">
                {birthdayCount}
              </span>
            </button>
            <button
              onClick={() => handleTabChange('analytics')}
              className={`
                py-2.5 px-1 border-b-2 font-medium text-sm transition-colors flex items-center
                ${activeTab === 'analytics'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <BarChart3 className="h-4 w-4 mr-1.5" />
              Analytics
            </button>
          </nav>
        </motion.div>

        {/* Birthday Time Filter Toggle - Only show on birthdays tab */}
        {activeTab === 'birthdays' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-2"
          >
            <span className="text-sm text-gray-600">Show:</span>
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              <button
                onClick={() => {
                  setBirthdayTimeFilter('past')
                  setSearchParams(prev => ({ ...prev, page: 1 }))
                }}
                className={`
                  px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all
                  ${birthdayTimeFilter === 'past'
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                Past
              </button>
              <button
                onClick={() => {
                  setBirthdayTimeFilter('today')
                  setSearchParams(prev => ({ ...prev, page: 1 }))
                }}
                className={`
                  px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all
                  ${birthdayTimeFilter === 'today'
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                Today
              </button>
              <button
                onClick={() => {
                  setBirthdayTimeFilter('future')
                  setSearchParams(prev => ({ ...prev, page: 1 }))
                }}
                className={`
                  px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all
                  ${birthdayTimeFilter === 'future'
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                Upcoming
              </button>
            </div>
          </motion.div>
        )}

        {/* Bulk Action Bar */}
        <AnimatePresence>
          {selectedMembers.size > 0 && activeTab !== 'analytics' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-primary-50 border border-primary-200 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-primary-700">
                  {selectedMembers.size} member{selectedMembers.size !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={clearSelection}
                  className="text-sm text-primary-600 hover:text-primary-800 underline"
                >
                  Clear
                </button>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  size="sm"
                  onClick={handleOpenBulkLocationModal}
                  className="flex items-center gap-1.5 w-full sm:w-auto justify-center"
                >
                  <MapPin className="h-4 w-4" />
                  Assign Location
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analytics Tab Content */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : analyticsStats ? (
              <>
                {/* Overview Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    {
                      title: 'Total Members',
                      value: analyticsStats.total || 0,
                      icon: Users,
                      color: 'text-blue-600',
                      bgColor: 'bg-blue-50',
                      description: 'All active members'
                    },
                    {
                      title: 'Active Members',
                      value: analyticsStats.byStatus?.find((s: any) => s._id === 'MEMBER')?.count || 0,
                      icon: UserCheck,
                      color: 'text-green-600',
                      bgColor: 'bg-green-50',
                      description: 'Members with active status'
                    },
                    {
                      title: 'Unit Assignment',
                      value: `${analyticsStats.unitAssignmentRate || 0}%`,
                      icon: MapPin,
                      color: 'text-purple-600',
                      bgColor: 'bg-purple-50',
                      description: 'Members assigned to units'
                    },
                    {
                      title: 'Unassigned',
                      value: analyticsStats.membersWithoutUnits || 0,
                      icon: UserX,
                      color: 'text-orange-600',
                      bgColor: 'bg-orange-50',
                      description: 'Members without units'
                    }
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                            {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 truncate">{stat.description}</p>
                        </div>
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 ${stat.bgColor} rounded-lg flex items-center justify-center flex-shrink-0 ml-2`}>
                          <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Gender Distribution */}
                <Card className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-foreground">Gender Distribution</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Member breakdown by gender</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {analyticsStats.byGender?.map((item: any, index: number) => (
                      <div key={index} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm text-gray-600 capitalize">{item._id || 'Unknown'}</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{item.count.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {analyticsStats.total > 0 ? Math.round((item.count / analyticsStats.total) * 100) : 0}% of total
                            </p>
                          </div>
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 ${item._id === 'male' ? 'bg-blue-100' : 'bg-pink-100'} rounded-lg flex items-center justify-center flex-shrink-0 ml-2`}>
                            <User className={`h-5 w-5 sm:h-6 sm:w-6 ${item._id === 'male' ? 'text-blue-600' : 'text-pink-600'}`} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Additional Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Members by District */}
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-foreground">Members by District</h3>
                    </div>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {analyticsStats.byDistrict && analyticsStats.byDistrict.length > 0 ? (
                        analyticsStats.byDistrict.slice(0, 10).map((item: any, index: number) => {
                          const percentage = analyticsStats.total > 0 ? Math.round((item.count / analyticsStats.total) * 100) : 0
                          return (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{item._id}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                                  </div>
                                  <span className="text-xs text-gray-600 min-w-[3rem] text-right">{percentage}%</span>
                                </div>
                              </div>
                              <div className="ml-4 text-right">
                                <p className="text-lg font-bold text-gray-900">{item.count.toLocaleString()}</p>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>No district data available</p>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Leadership Roles */}
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Users className="h-5 w-5 text-purple-600" />
                      <h3 className="text-lg font-semibold text-foreground">Leadership Roles</h3>
                    </div>
                    <div className="space-y-3">
                      {analyticsStats.byLeadership && analyticsStats.byLeadership.length > 0 ? (
                        analyticsStats.byLeadership.map((item: any, index: number) => {
                          const leadershipLabels: Record<string, string> = {
                            'DC': "David's Company",
                            'LXL': 'League of Xtraordinary Leaders',
                            'DIRECTOR': 'Director',
                            'PASTOR': 'Pastor',
                            'CAMPUS_PASTOR': 'Campus Pastor',
                            'SENIOR_PASTOR': 'Senior Pastor'
                          }
                          const leadershipColors: Record<string, string> = {
                            'SENIOR_PASTOR': 'bg-amber-100 text-amber-600',
                            'CAMPUS_PASTOR': 'bg-orange-100 text-orange-600',
                            'PASTOR': 'bg-red-100 text-red-600',
                            'DIRECTOR': 'bg-purple-100 text-purple-600',
                            'LXL': 'bg-blue-100 text-blue-600',
                            'DC': 'bg-green-100 text-green-600'
                          }
                          const label = leadershipLabels[item._id] || item._id
                          const colorClass = leadershipColors[item._id] || 'bg-gray-100 text-gray-600'
                          return (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 ${colorClass.split(' ')[0]} rounded-lg flex items-center justify-center`}>
                                  <Heart className={`h-5 w-5 ${colorClass.split(' ')[1]}`} />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{label}</p>
                                  <p className="text-xs text-gray-500">{item.count} {item.count === 1 ? 'member' : 'members'}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className="font-bold">{item.count}</Badge>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Heart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>No leadership data available</p>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Age Distribution */}
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <h3 className="text-lg font-semibold text-foreground">Age Distribution</h3>
                    </div>
                    <div className="space-y-3">
                      {analyticsStats.byAge && analyticsStats.byAge.length > 0 ? (
                        analyticsStats.byAge.map((item: any, index: number) => {
                          const ageLabel = item._id === 'Unknown' ? 'Unknown' :
                            item._id === 0 ? 'Under 18' :
                            item._id === 18 ? '18-29' :
                            item._id === 30 ? '30-44' :
                            item._id === 45 ? '45-59' :
                            item._id === 60 ? '60+' : `${item._id}+`
                          const percentage = analyticsStats.total > 0 ? Math.round((item.count / analyticsStats.total) * 100) : 0
                          return (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-gray-900">{ageLabel}</p>
                                <p className="text-lg font-bold text-gray-900">{item.count.toLocaleString()}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                                </div>
                                <span className="text-xs text-gray-600 min-w-[3rem] text-right">{percentage}%</span>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>No age data available</p>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Membership Status */}
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <h3 className="text-lg font-semibold text-foreground">Membership Status</h3>
                    </div>
                    <div className="space-y-3">
                      {analyticsStats.byStatus && analyticsStats.byStatus.length > 0 ? (
                        analyticsStats.byStatus.map((item: any, index: number) => {
                          const statusLabels: Record<string, string> = {
                            'MEMBER': 'Member',
                            'DC': "David's Company",
                            'LXL': 'League of Xtraordinary Leaders',
                            'DIRECTOR': 'Director',
                            'PASTOR': 'Pastor',
                            'CAMPUS_PASTOR': 'Campus Pastor',
                            'SENIOR_PASTOR': 'Senior Pastor',
                            'LEFT': 'Left',
                            'RELOCATED': 'Relocated'
                          }
                          const statusColors: Record<string, string> = {
                            'MEMBER': 'bg-green-100 text-green-600',
                            'DC': 'bg-blue-100 text-blue-600',
                            'LXL': 'bg-indigo-100 text-indigo-600',
                            'DIRECTOR': 'bg-purple-100 text-purple-600',
                            'PASTOR': 'bg-red-100 text-red-600',
                            'CAMPUS_PASTOR': 'bg-orange-100 text-orange-600',
                            'SENIOR_PASTOR': 'bg-amber-100 text-amber-600',
                            'LEFT': 'bg-gray-100 text-gray-600',
                            'RELOCATED': 'bg-yellow-100 text-yellow-600'
                          }
                          const label = statusLabels[item._id] || item._id || 'Unknown'
                          const colorClass = statusColors[item._id] || 'bg-gray-100 text-gray-600'
                          const percentage = analyticsStats.total > 0 ? Math.round((item.count / analyticsStats.total) * 100) : 0
                          return (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge className={colorClass}>{label}</Badge>
                                  <span className="text-xs text-gray-500">{percentage}%</span>
                                </div>
                                <p className="text-lg font-bold text-gray-900">{item.count.toLocaleString()}</p>
                              </div>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>No status data available</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No analytics data</h3>
                <p className="text-muted-foreground">Unable to load analytics data.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Members Table */}
        {activeTab !== 'analytics' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full overflow-hidden"
        >
          <Card className="overflow-hidden">
            {members.length === 0 ? (
              <div className="text-center py-12">
                {activeTab === 'birthdays' ? (
                  <Cake className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                ) : (
                  <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                )}
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {activeTab === 'assigned'
                    ? 'No members with assigned districts'
                    : birthdayTimeFilter === 'today'
                      ? 'No birthdays today'
                      : birthdayTimeFilter === 'past'
                        ? 'No past birthdays this month'
                        : 'No upcoming birthdays this month'}
                </h3>
                <p className="text-muted-foreground">
                  {activeTab === 'assigned'
                    ? 'All members have been assigned to districts or no members exist yet.'
                    : birthdayTimeFilter === 'today'
                      ? 'No members have birthdays today.'
                      : birthdayTimeFilter === 'past'
                        ? 'No past birthdays have been recorded this month.'
                        : 'No upcoming birthdays remaining this month.'
                  }
                </p>
              </div>
            ) : (
              <>
              {/* Mobile Card View */}
              <div className="md:hidden p-3 space-y-3">
                {members.map((member, index) => (
                  <motion.div
                    key={member._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`bg-white border border-gray-100 rounded-xl p-4 space-y-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1),0_1px_3px_-1px_rgba(0,0,0,0.06)] ${selectedMembers.has(member._id) ? 'ring-2 ring-primary-500 bg-primary-50' : ''}`}
                    onClick={() => navigate(`/members/${member._id}`)}
                  >
                    {/* Header: Name and Checkbox */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {canAssignLocation && (
                          <input
                            type="checkbox"
                            checked={selectedMembers.has(member._id)}
                            onChange={(e) => {
                              e.stopPropagation()
                              toggleSelectMember(member._id)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {member.firstName} {member.lastName}
                          </h3>
                          <p className="text-sm text-gray-500 truncate max-w-[200px]">{member.email}</p>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(member.membershipStatus)} className="text-xs">
                        {member.membershipStatus.replace('_', ' ')}
                      </Badge>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-3 w-3 mr-1.5 text-gray-400" />
                        <span className="truncate">{member.phone || '-'}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-3 w-3 mr-1.5 text-gray-400" />
                        <span>{formatDate(member.dateJoined)}</span>
                      </div>
                    </div>

                    {/* Location Info */}
                    <div className="pt-2 border-t border-gray-100 space-y-1">
                      <div className="flex items-center text-sm">
                        <Building2 className="h-3 w-3 mr-1.5 text-primary-600" />
                        <span className="font-medium text-gray-700 truncate">
                          {typeof member.branch === 'object' ? member.branch?.name : 'No branch'}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Users className="h-3 w-3 mr-1.5 text-gray-400" />
                        <span className="truncate">
                          {member.district?.name || 'No district'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                      {canAssignLocation && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenLocationModal(member)}
                          className="flex-1 text-xs"
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          Location
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/members/${member._id}/edit`)}
                        className="flex-1 text-xs"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      {canAssignLocation && (
                        <th className="px-3 sm:px-4 py-3 w-10">
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
                      <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                        Contact
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                        Location
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
                      className={`hover:bg-muted/50 transition-colors cursor-pointer ${selectedMembers.has(member._id) ? 'bg-primary-50' : ''}`}
                      onClick={() => navigate(`/members/${member._id}`)}
                    >
                      {canAssignLocation && (
                        <td className="px-3 sm:px-4 py-4 w-10" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedMembers.has(member._id)}
                            onChange={() => toggleSelectMember(member._id)}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </td>
                      )}
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {member.firstName} {member.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[150px]">{member.email}</div>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap hidden lg:table-cell">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="h-3 w-3 mr-1" />
                            {member.phone}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Mail className="h-3 w-3 mr-1" />
                            <span className="truncate max-w-[150px]">{member.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <Badge variant={getStatusColor(member.membershipStatus)} className="text-xs">
                          {member.membershipStatus.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap hidden md:table-cell">
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
                      <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                          {canAssignLocation && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenLocationModal(member)}
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Assign Location"
                            >
                              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/members/${member._id}/edit`)}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}

            {/* Pagination */}
            {members.length > 0 && pagination && (
              <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasPrev}
                      onClick={() => handlePageChange(pagination.page - 1)}
                      className="text-xs sm:text-sm"
                    >
                      Previous
                    </Button>
                    <span className="text-xs sm:text-sm text-muted-foreground flex items-center px-2">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasNext}
                      onClick={() => handlePageChange(pagination.page + 1)}
                      className="text-xs sm:text-sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
        )}
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
          // Branch filter - only shown when viewing all campuses
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
                {locationMember?.district && (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Current Location</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>District: {typeof locationMember.district === 'object' ? locationMember.district.name : 'Assigned'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Branch Select - Only visible to users with branches:view-all permission */}
                {canViewAllBranches && allBranches.length > 0 && (
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
                    onChange={(e) => setSelectedDistrictId(e.target.value)}
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
                  disabled={(!selectedBranchId && !selectedDistrictId) || savingLocation}
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

                {/* Branch Select - Only visible to users with branches:view-all permission */}
                {canViewAllBranches && allBranches.length > 0 && (
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
                    onChange={(e) => setBulkDistrictId(e.target.value)}
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
                  disabled={(!bulkBranchId && !bulkDistrictId) || savingBulkLocation}
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