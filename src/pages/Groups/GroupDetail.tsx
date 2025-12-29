import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Edit, Trash2, Users, Calendar, Clock, Phone, Mail, MapPin, Crown, Shield, Star,
  Settings as SettingsIcon, UserPlus, ArrowLeft, Link2, CheckCircle,
  XCircle, X, User
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import Modal from '@/components/ui/Modal'
import {
  AddMembersModal,
  AssignLeaderModal,
  LinkUnitsModal,
  SetDefaultRoleModal,
  LeadershipSection,
  LinkedUnitsSection
} from '@/components/groups'
import { Group, groupsService, MemberReference, RoleReference } from '@/services/groups'
import { formatDate } from '@/utils/formatters'
import { showToast } from '@/utils/toast'
import { cn } from '@/utils/cn'

type TabType = 'overview' | 'members' | 'leadership' | 'settings'

export default function GroupDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  // Modal states
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [addMembersModal, setAddMembersModal] = useState(false)
  const [assignLeaderModal, setAssignLeaderModal] = useState<{
    isOpen: boolean
    role: 'districtPastor' | 'unitHead' | 'assistantUnitHead' | 'ministryDirector'
  }>({ isOpen: false, role: 'districtPastor' })
  const [linkUnitsModal, setLinkUnitsModal] = useState(false)
  const [setDefaultRoleModal, setSetDefaultRoleModal] = useState(false)

  useEffect(() => {
    if (id) {
      loadGroup()
    }
  }, [id])

  const loadGroup = async () => {
    try {
      setLoading(true)
      setError(null)
      const groupData = await groupsService.getGroupById(id!)
      setGroup(groupData)
    } catch (error: any) {
      console.error('Error loading group:', error)
      setError({
        status: error.status || 500,
        message: 'Failed to load group details',
        details: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleteLoading(true)
      await groupsService.deleteGroup(id!)
      showToast('success', 'Group deleted successfully')
      navigate('/groups')
    } catch (error: any) {
      console.error('Error deleting group:', error)
      showToast('error', error.message || 'Failed to delete group')
    } finally {
      setDeleteLoading(false)
      setDeleteModal(false)
    }
  }

  const handleToggleActive = async () => {
    if (!group) return
    try {
      if (group.isActive) {
        await groupsService.deactivateGroup(id!)
        showToast('success', 'Group deactivated')
      } else {
        await groupsService.activateGroup(id!)
        showToast('success', 'Group activated')
      }
      loadGroup()
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update group status')
    }
  }

  const handleRemoveLeader = async (role: string) => {
    if (!group) return
    try {
      if (role === 'districtPastor') {
        await groupsService.removeDistrictPastor(id!)
      } else if (role === 'unitHead') {
        await groupsService.removeUnitHead(id!)
      } else if (role === 'assistantUnitHead') {
        await groupsService.removeAssistantUnitHead(id!)
      } else if (role === 'ministryDirector') {
        await groupsService.removeMinistryDirector(id!)
      }
      showToast('success', 'Leader removed successfully')
      loadGroup()
    } catch (error: any) {
      showToast('error', error.message || 'Failed to remove leader')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      await groupsService.removeMemberFromGroup(id!, memberId)
      showToast('success', 'Member removed')
      loadGroup()
    } catch (error: any) {
      showToast('error', error.message || 'Failed to remove member')
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

  const getGroupTypeColor = (type: string) => {
    const colors = {
      district: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
      unit: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
      fellowship: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
      ministry: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
      committee: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' }
    }
    return colors[type as keyof typeof colors] || colors.fellowship
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview' },
    { id: 'members' as TabType, label: 'Members', count: group?.members?.length || 0 },
    { id: 'leadership' as TabType, label: 'Leadership' },
    { id: 'settings' as TabType, label: 'Settings' },
  ]

  if (loading) {
    return (
      <Layout title="Group Details">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Group Details">
        <ErrorBoundary
          error={error}
          onRetry={loadGroup}
          showLogout={error.status === 401}
        />
      </Layout>
    )
  }

  if (!group) {
    return (
      <Layout title="Group Details">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Group not found</h3>
          <p className="text-gray-600 mb-4">The group you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/groups')}>
            Back to Groups
          </Button>
        </div>
      </Layout>
    )
  }

  const GroupIcon = getGroupTypeIcon(group.type)
  const typeColor = getGroupTypeColor(group.type)
  const defaultRole = group.defaultRole as RoleReference | undefined

  return (
    <Layout title="">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/groups')}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Groups
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className={cn("w-16 h-16 rounded-xl flex items-center justify-center", typeColor.bg)}>
                <GroupIcon className={cn("h-8 w-8", typeColor.text)} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-semibold text-gray-900">{group.name}</h1>
                  <span className={cn(
                    "px-2 py-0.5 text-xs font-medium uppercase rounded-full",
                    typeColor.bg, typeColor.text
                  )}>
                    {group.type}
                  </span>
                  <span className={cn(
                    "px-2 py-0.5 text-xs font-medium rounded-full",
                    group.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  )}>
                    {group.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {group.description && (
                  <p className="text-gray-500 max-w-xl">{group.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Created {formatDate(group.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/groups/${id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteModal(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            size="sm"
            onClick={() => setAddMembersModal(true)}
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            Add Members
          </Button>

          {group.type === 'district' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAssignLeaderModal({ isOpen: true, role: 'districtPastor' })}
            >
              <Crown className="h-4 w-4 mr-1.5" />
              Assign Pastor
            </Button>
          )}

          {group.type === 'unit' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAssignLeaderModal({ isOpen: true, role: 'unitHead' })}
            >
              <Shield className="h-4 w-4 mr-1.5" />
              Assign Head
            </Button>
          )}

          {group.type === 'ministry' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setAssignLeaderModal({ isOpen: true, role: 'ministryDirector' })}
              >
                <Star className="h-4 w-4 mr-1.5" />
                Assign Director
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setLinkUnitsModal(true)}
              >
                <Link2 className="h-4 w-4 mr-1.5" />
                Link Units
              </Button>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "pb-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-2 text-gray-400">{tab.count}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Group Info */}
                  <Card className="p-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Group Information</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Type</p>
                        <p className="text-sm text-gray-900 capitalize">{group.type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <p className={cn(
                          "text-sm font-medium",
                          group.isActive ? "text-green-600" : "text-gray-500"
                        )}>
                          {group.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Members</p>
                        <p className="text-sm text-gray-900">
                          {group.currentMemberCount || group.members?.length || 0}
                          {group.maxCapacity ? ` / ${group.maxCapacity}` : ''}
                        </p>
                      </div>
                      {defaultRole && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Default Role</p>
                          <p className="text-sm text-gray-900">{defaultRole.displayName}</p>
                        </div>
                      )}
                    </div>

                    {group.vision && (
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Vision</p>
                        <p className="text-sm text-gray-900">{group.vision}</p>
                      </div>
                    )}

                    {group.mission && (
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-1">Mission</p>
                        <p className="text-sm text-gray-900">{group.mission}</p>
                      </div>
                    )}
                  </Card>

                  {/* Meeting Schedule */}
                  {group.meetingSchedule && (
                    <Card className="p-6">
                      <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        Meeting Schedule
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <Calendar className="h-5 w-5 text-gray-500 mx-auto mb-1" />
                          <p className="text-sm font-medium text-gray-900 capitalize">{group.meetingSchedule.day}</p>
                          <p className="text-xs text-gray-500">Day</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <Clock className="h-5 w-5 text-gray-500 mx-auto mb-1" />
                          <p className="text-sm font-medium text-gray-900">{group.meetingSchedule.time}</p>
                          <p className="text-xs text-gray-500">Time</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <MapPin className="h-5 w-5 text-gray-500 mx-auto mb-1" />
                          <p className="text-sm font-medium text-gray-900">
                            {group.meetingSchedule.isVirtual ? 'Virtual' : 'In-person'}
                          </p>
                          <p className="text-xs text-gray-500">Format</p>
                        </div>
                      </div>
                      {group.meetingSchedule.location && (
                        <p className="mt-4 text-sm text-gray-600">
                          Location: {group.meetingSchedule.location}
                        </p>
                      )}
                    </Card>
                  )}

                  {/* Linked Units (Ministry only) */}
                  {group.type === 'ministry' && (
                    <Card className="p-6">
                      <LinkedUnitsSection
                        group={group}
                        onManageLinks={() => setLinkUnitsModal(true)}
                      />
                    </Card>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <Card className="p-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-sm flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Members
                        </span>
                        <span className="font-semibold text-gray-900">
                          {group.currentMemberCount || group.members?.length || 0}
                        </span>
                      </div>
                      {group.maxCapacity && group.maxCapacity > 0 && (
                        <div>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Capacity</span>
                            <span>
                              {Math.round(((group.currentMemberCount || 0) / group.maxCapacity) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className={cn(
                                "h-2 rounded-full transition-all",
                                ((group.currentMemberCount || 0) / group.maxCapacity) >= 0.9
                                  ? "bg-red-500"
                                  : ((group.currentMemberCount || 0) / group.maxCapacity) >= 0.7
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                              )}
                              style={{
                                width: `${Math.min(((group.currentMemberCount || 0) / group.maxCapacity) * 100, 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Contact */}
                  {(group.contactPhone || group.contactEmail) && (
                    <Card className="p-6">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Contact</h3>
                      <div className="space-y-3">
                        {group.contactPhone && (
                          <a
                            href={`tel:${group.contactPhone}`}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                          >
                            <Phone className="h-4 w-4 text-gray-400" />
                            {group.contactPhone}
                          </a>
                        )}
                        {group.contactEmail && (
                          <a
                            href={`mailto:${group.contactEmail}`}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                          >
                            <Mail className="h-4 w-4 text-gray-400" />
                            {group.contactEmail}
                          </a>
                        )}
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Members ({group.members?.length || 0})
                  </h3>
                  <Button size="sm" onClick={() => setAddMembersModal(true)}>
                    <UserPlus className="h-4 w-4 mr-1.5" />
                    Add Members
                  </Button>
                </div>

                {group.members && group.members.length > 0 ? (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Contact</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {group.members.map((member, index) => {
                          // Handle various member formats
                          let memberRef: MemberReference | null = null
                          let memberId: string = ''

                          if (typeof member === 'string') {
                            // Plain string ID
                            memberId = member
                          } else if (member && typeof member === 'object') {
                            // Check if it's a populated member object
                            if ('firstName' in member && member.firstName) {
                              memberRef = member as MemberReference
                              memberId = memberRef._id
                            } else if ('_id' in member) {
                              // ObjectId object or unpopulated ref
                              memberId = String((member as any)._id || member)
                            } else {
                              // Might be a raw ObjectId - convert to string
                              memberId = String(member)
                            }
                          }

                          // If member data is not populated, show with limited info
                          if (!memberRef) {
                            return (
                              <tr key={memberId || index} className="hover:bg-gray-50">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                      <User className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-500 italic">Member data unavailable</p>
                                      <p className="text-xs text-gray-400 font-mono">{memberId.slice(-8)}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <p className="text-sm text-gray-400">-</p>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-600 rounded-full">
                                    Not loaded
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  {memberId && (
                                    <button
                                      onClick={() => handleRemoveMember(memberId)}
                                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                      title="Remove member"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            )
                          }

                          return (
                            <tr key={memberRef._id || index} className="hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                    <User className="h-4 w-4 text-gray-500" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {memberRef.firstName} {memberRef.lastName}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <p className="text-sm text-gray-600">{memberRef.email || memberRef.phone || '-'}</p>
                              </td>
                              <td className="py-3 px-4">
                                {memberRef.membershipStatus && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                    {memberRef.membershipStatus}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => handleRemoveMember(memberRef._id)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                  title="Remove member"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h4 className="font-medium text-gray-900 mb-1">No members yet</h4>
                    <p className="text-sm text-gray-500 mb-4">Add members to this group</p>
                    <Button size="sm" onClick={() => setAddMembersModal(true)}>
                      <UserPlus className="h-4 w-4 mr-1.5" />
                      Add Members
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Leadership Tab */}
            {activeTab === 'leadership' && (
              <Card className="p-6">
                <LeadershipSection
                  group={group}
                  onAssignLeader={(role) => setAssignLeaderModal({
                    isOpen: true,
                    role: role as any
                  })}
                  onRemoveLeader={handleRemoveLeader}
                />
              </Card>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Default Role */}
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">Default Role</h3>
                      <p className="text-sm text-gray-500">
                        {defaultRole
                          ? `New members will be assigned "${defaultRole.displayName}" role`
                          : 'No default role set. Members won\'t be auto-assigned a role.'}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSetDefaultRoleModal(true)}
                    >
                      {defaultRole ? 'Change' : 'Set Role'}
                    </Button>
                  </div>
                </Card>

                {/* Capacity */}
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">Capacity</h3>
                      <p className="text-sm text-gray-500">
                        {group.maxCapacity
                          ? `Maximum ${group.maxCapacity} members allowed`
                          : 'No capacity limit set'}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/groups/${id}/edit`)}
                    >
                      Edit
                    </Button>
                  </div>
                </Card>

                {/* Status */}
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">Group Status</h3>
                      <p className="text-sm text-gray-500">
                        {group.isActive
                          ? 'Group is active and visible'
                          : 'Group is inactive and hidden'}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleToggleActive}
                      className={group.isActive ? "text-orange-600 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}
                    >
                      {group.isActive ? (
                        <>
                          <XCircle className="h-4 w-4 mr-1.5" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1.5" />
                          Activate
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                {/* Danger Zone */}
                <Card className="p-6 border-red-200">
                  <h3 className="text-sm font-medium text-red-600 mb-4">Danger Zone</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Delete this group</p>
                      <p className="text-sm text-gray-500">Once deleted, this cannot be undone.</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteModal(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Delete Group
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modals */}
      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete Group"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{group.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleteLoading}>
              Delete Group
            </Button>
          </div>
        </div>
      </Modal>

      <AddMembersModal
        isOpen={addMembersModal}
        onClose={() => setAddMembersModal(false)}
        group={group}
        onSuccess={loadGroup}
      />

      <AssignLeaderModal
        isOpen={assignLeaderModal.isOpen}
        onClose={() => setAssignLeaderModal({ ...assignLeaderModal, isOpen: false })}
        group={group}
        leaderRole={assignLeaderModal.role}
        onSuccess={loadGroup}
      />

      {group.type === 'ministry' && (
        <LinkUnitsModal
          isOpen={linkUnitsModal}
          onClose={() => setLinkUnitsModal(false)}
          ministry={group}
          onSuccess={loadGroup}
        />
      )}

      <SetDefaultRoleModal
        isOpen={setDefaultRoleModal}
        onClose={() => setSetDefaultRoleModal(false)}
        group={group}
        onSuccess={loadGroup}
      />
    </Layout>
  )
}
