import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Phone,
  Mail,
  Edit,
  Eye,
  Search,
  Download,
  MapPin,
  Calendar,
  UserPlus,
  X
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Member, MemberSearchParams, membersService } from '@/services/members-unified'
import { groupsService } from '@/services/groups'
import { formatDate } from '@/utils/formatters'

export default function Members() {
  const navigate = useNavigate()
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
  const [districts, setDistricts] = useState<any[]>([])
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    loadMembers()
  }, [searchParams, activeTab])

  useEffect(() => {
    loadCounts()
    loadDistricts()
  }, [])

  const loadDistricts = async () => {
    try {
      const response = await groupsService.getGroups({ type: 'district', limit: 100 })
      setDistricts(response.items)
    } catch (error) {
      console.error('Error loading districts:', error)
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

      // Use server-side filtering based on active tab
      const params = { ...searchParams }
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
      // Load members in batches to get accurate counts
      let allMembers: Member[] = []
      let currentPage = 1
      let hasMore = true

      while (hasMore && currentPage <= 10) { // Limit to 10 pages to avoid infinite loops
        const response = await membersService.getMembers({ page: currentPage, limit: 100 })
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

  // Search Section to be displayed in header
  const searchSection = (
    <form onSubmit={handleSearch} className="flex gap-3 flex-wrap items-center w-full">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search members by name, email, or phone..."
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
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => navigate('/members/new')}
      >
        <Plus className="h-4 w-4" />
        Add Member
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Export
      </Button>
    </form>
  )

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
      <Layout title="Members" subtitle="Manage church members and their information" searchSection={searchSection}>
        <SkeletonTable />
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Members" subtitle="Manage church members and their information" searchSection={searchSection}>
        <ErrorBoundary error={error} onRetry={loadMembers} />
      </Layout>
    )
  }

  return (
    <Layout title="Members" subtitle="Manage church members and their information" searchSection={searchSection}>
      <div className="space-y-6">

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
              Assigned Districts
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
              Unassigned Districts
              <span className="ml-2 py-0.5 px-2.5 rounded-full text-xs bg-gray-100 text-gray-900">
                {unassignedCount}
              </span>
            </button>
          </nav>
        </motion.div>

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
                        District
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
                      className="hover:bg-muted/50 transition-colors"
                    >
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
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {member.district?.name || 'Not assigned'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(member.dateJoined)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {activeTab === 'unassigned' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenAssignModal(member)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Assign to District"
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/members/${member._id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/members/${member._id}/edit`)}
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
    </Layout>
  )
}