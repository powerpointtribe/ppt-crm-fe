import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Edit, Trash2, Users, Calendar, Clock, Phone, Mail, MapPin, Crown, Shield, Star,
  Home, Settings as SettingsIcon, Plus, UserPlus, ArrowLeft, MoreVertical
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import Modal from '@/components/ui/Modal'
import { Group, groupsService } from '@/services/groups'
import { formatDate } from '@/utils/formatters'
import { showToast } from '@/utils/toast'

export default function GroupDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

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
    const variants = {
      district: 'primary' as const,
      unit: 'success' as const,
      fellowship: 'secondary' as const,
      ministry: 'warning' as const,
      committee: 'info' as const
    }
    return variants[type as keyof typeof variants] || 'default' as const
  }

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

  return (
    <Layout
      title={group.name}
      headerActions={
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/groups')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Groups
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/groups/${id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="danger"
            onClick={() => setDeleteModal(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <GroupIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                    <Badge variant={getGroupTypeBadge(group.type)} size="lg">
                      {group.type.toUpperCase()}
                    </Badge>
                    <Badge variant={group.isActive ? 'success' : 'danger'}>
                      {group.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {group.description && (
                    <p className="text-gray-600 max-w-2xl">{group.description}</p>
                  )}
                </div>
              </div>

              <div className="text-right text-sm text-gray-500">
                <p>Created: {formatDate(group.createdAt)}</p>
                <p>Updated: {formatDate(group.updatedAt)}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Leadership Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Crown className="h-5 w-5 text-yellow-500 mr-2" />
                    Leadership
                  </h3>
                </div>

                <div className="space-y-4">
                  {group.districtPastor && (
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <Crown className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">District Pastor</p>
                        <p className="text-blue-700">{typeof group.districtPastor === 'object' ? `${group.districtPastor?.firstName} ${group.districtPastor?.lastName}` : group.districtPastor}</p>
                      </div>
                    </div>
                  )}

                  {group.unitHead && (
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <Shield className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">Unit Head</p>
                        <p className="text-green-700">{typeof group.unitHead === 'object' ? `${group.unitHead?.firstName} ${group.unitHead?.lastName}` : group.unitHead}</p>
                      </div>
                    </div>
                  )}

                  {group.champs && group.champs.length > 0 && (
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="font-medium text-orange-900 mb-2 flex items-center">
                        <Star className="h-4 w-4 mr-2" />
                        Champions
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {group.champs.map((champ, index) => (
                          <Badge key={index} variant="warning" size="sm">
                            {champ}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {!group.districtPastor && !group.unitHead && (!group.champs || group.champs.length === 0) && (
                    <p className="text-gray-500 italic">No leadership assigned</p>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Meeting Schedule */}
            {group.meetingSchedule && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                    <Calendar className="h-5 w-5 text-green-500 mr-2" />
                    Meeting Schedule
                  </h3>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Calendar className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                      <p className="font-medium text-gray-900">{group.meetingSchedule.day}</p>
                      <p className="text-sm text-gray-600">Day</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Clock className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                      <p className="font-medium text-gray-900">{group.meetingSchedule.time}</p>
                      <p className="text-sm text-gray-600">Time</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Calendar className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                      <p className="font-medium text-gray-900 capitalize">{group.meetingSchedule.frequency}</p>
                      <p className="text-sm text-gray-600">Frequency</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Hosting Information */}
            {group.hostingInfo && group.hostingInfo.currentHost && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                    <Home className="h-5 w-5 text-purple-500 mr-2" />
                    Hosting Information
                  </h3>

                  <div className="space-y-4">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="font-medium text-purple-900">Current Host</p>
                      <p className="text-purple-700">{typeof group.hostingInfo.currentHost === 'object' ? `${group.hostingInfo.currentHost?.firstName} ${group.hostingInfo.currentHost?.lastName}` : group.hostingInfo.currentHost}</p>
                    </div>

                    {group.hostingInfo.hostRotation && group.hostingInfo.hostRotation.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-900 mb-2">Host Rotation</p>
                        <div className="flex flex-wrap gap-2">
                          {group.hostingInfo.hostRotation.map((host, index) => (
                            <Badge key={index} variant="secondary" size="sm">
                              {host}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {group.hostingInfo.nextRotationDate && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-900">Next Rotation</p>
                        <p className="text-gray-700">{formatDate(group.hostingInfo.nextRotationDate)}</p>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}
          </div>

          <div className="space-y-6">
            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Members
                    </span>
                    <span className="font-semibold text-gray-900">
                      {group.members?.length || 0}
                      {group.capacity && ` / ${group.capacity}`}
                    </span>
                  </div>

                  {group.capacity && (
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Capacity</span>
                        <span>{Math.round(((group.members?.length || 0) / group.capacity) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(((group.members?.length || 0) / group.capacity) * 100, 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Button className="w-full" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Manage Members
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Contact Information */}
            {group.contact && (group.contact.phone || group.contact.email || group.contact.address) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>

                  <div className="space-y-3">
                    {group.contact.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-900">{group.contact.phone}</span>
                      </div>
                    )}

                    {group.contact.email && (
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-900">{group.contact.email}</span>
                      </div>
                    )}

                    {group.contact.address && (
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                        <span className="text-gray-900">{group.contact.address}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>

                <div className="space-y-2">
                  <Button variant="secondary" size="sm" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Meeting
                  </Button>
                  <Button variant="secondary" size="sm" className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Announcement
                  </Button>
                  <Button variant="secondary" size="sm" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    View Reports
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
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
              <Button
                variant="secondary"
                onClick={() => setDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                loading={deleteLoading}
              >
                Delete Group
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  )
}