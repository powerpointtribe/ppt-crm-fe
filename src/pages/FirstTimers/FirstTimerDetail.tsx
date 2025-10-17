import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Edit, Trash2, Phone, Mail, Calendar, MapPin, Heart,
  Users, Star, Clock, CheckCircle, AlertCircle, UserPlus, Plus,
  Building, User, Home, FileText, Tag, MessageSquare, Settings
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import FollowUpForm from '@/components/forms/FollowUpForm'
import FollowUpHistory from '@/components/ui/FollowUpHistory'
import { FirstTimer, firstTimersService, FollowUpRecord } from '@/services/first-timers'
import { formatDate } from '@/utils/formatters'
import { cn } from '@/utils/cn'

export default function FirstTimerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [firstTimer, setFirstTimer] = useState<FirstTimer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [showFollowUpForm, setShowFollowUpForm] = useState(false)
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false)

  useEffect(() => {
    if (id) {
      loadFirstTimer()
    }
  }, [id])

  const loadFirstTimer = async () => {
    try {
      setError(null)
      const data = await firstTimersService.getFirstTimerById(id!)
      setFirstTimer(data)
    } catch (error: any) {
      console.error('Error loading first timer:', error)
      setError({
        status: error.code || 500,
        message: 'Failed to load visitor details',
        details: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddFollowUp = async (followUpData: Omit<FollowUpRecord, 'contactedBy'>) => {
    try {
      setSubmittingFollowUp(true)
      await firstTimersService.addFollowUp(id!, followUpData)
      await loadFirstTimer() // Reload to get updated data
      setShowFollowUpForm(false)
    } catch (error) {
      console.error('Error adding follow-up:', error)
      // Handle error (could show toast notification)
    } finally {
      setSubmittingFollowUp(false)
    }
  }

  const handleStatusUpdate = async (status: FirstTimer['status']) => {
    try {
      await firstTimersService.updateStatus(id!, status)
      await loadFirstTimer()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleConvertToMember = async () => {
    try {
      await firstTimersService.convertToMember(id!)
      await loadFirstTimer()
    } catch (error) {
      console.error('Error converting to member:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      not_contacted: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle, label: 'Not Contacted' },
      contacted: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Phone, label: 'Contacted' },
      scheduled_visit: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Calendar, label: 'Visit Scheduled' },
      visited: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: CheckCircle, label: 'Visited' },
      joined_group: { color: 'bg-green-100 text-green-800 border-green-200', icon: Users, label: 'Joined Group' },
      converted: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: UserPlus, label: 'Converted' },
      lost_contact: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock, label: 'Lost Contact' }
    }
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.not_contacted
  }

  const getDaysSinceVisit = (dateOfVisit: string) => {
    const visitDate = new Date(dateOfVisit)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - visitDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <Layout title="Loading...">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error || !firstTimer) {
    return (
      <Layout title="Visitor Details">
        <ErrorBoundary
          error={error || { status: 404, message: 'Visitor not found' }}
          onRetry={loadFirstTimer}
        />
      </Layout>
    )
  }

  const statusConfig = getStatusBadge(firstTimer.status)
  const StatusIcon = statusConfig.icon
  const daysSinceVisit = getDaysSinceVisit(firstTimer.dateOfVisit)

  return (
    <Layout
      title={`${firstTimer.firstName} ${firstTimer.lastName}`}
      headerActions={
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/first-timers')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/first-timers/${id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            onClick={() => setShowFollowUpForm(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Follow-up
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status Overview */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {firstTimer.firstName[0]}{firstTimer.lastName[0]}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {firstTimer.firstName} {firstTimer.lastName}
                </h1>
                <p className="text-gray-600">{firstTimer.occupation || 'Occupation not specified'}</p>
                <div className="flex items-center gap-3 mt-2">
                  <StatusIcon className="h-4 w-4" />
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                  {firstTimer.converted && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <UserPlus className="w-3 h-3 mr-1" />
                      Converted
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Visited</p>
              <p className="text-lg font-semibold text-gray-900">{formatDate(firstTimer.dateOfVisit)}</p>
              <p className="text-sm text-gray-500">{daysSinceVisit} days ago</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(`tel:${firstTimer.phone}`, '_self')}
              className="flex items-center gap-2"
            >
              <Phone className="h-4 w-4" />
              Call
            </Button>
            {firstTimer.email && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(`mailto:${firstTimer.email}`, '_self')}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFollowUpForm(true)}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Follow-up
            </Button>
            {!firstTimer.converted && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleConvertToMember}
                className="flex items-center gap-2 text-green-600 hover:text-green-700"
              >
                <UserPlus className="h-4 w-4" />
                Convert
              </Button>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-600" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-gray-900">{firstTimer.phone}</p>
                  </div>
                  {firstTimer.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900">{firstTimer.email}</p>
                    </div>
                  )}
                  {firstTimer.dateOfBirth && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Date of Birth</label>
                      <p className="text-gray-900">{formatDate(firstTimer.dateOfBirth)}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {firstTimer.gender && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Gender</label>
                      <p className="text-gray-900 capitalize">{firstTimer.gender}</p>
                    </div>
                  )}
                  {firstTimer.maritalStatus && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Marital Status</label>
                      <p className="text-gray-900 capitalize">{firstTimer.maritalStatus}</p>
                    </div>
                  )}
                  {firstTimer.occupation && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Occupation</label>
                      <p className="text-gray-900">{firstTimer.occupation}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Address */}
            {firstTimer.address && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  Address
                </h3>
                <div className="text-gray-900">
                  {firstTimer.address.street && <p>{firstTimer.address.street}</p>}
                  <p>
                    {[firstTimer.address.city, firstTimer.address.state, firstTimer.address.zipCode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  {firstTimer.address.country && <p>{firstTimer.address.country}</p>}
                </div>
              </Card>
            )}

            {/* Emergency Contact */}
            {firstTimer.emergencyContact && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Name</label>
                    <p className="text-gray-900">{firstTimer.emergencyContact.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Relationship</label>
                    <p className="text-gray-900">{firstTimer.emergencyContact.relationship}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-gray-900">{firstTimer.emergencyContact.phone}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Family Members */}
            {firstTimer.familyMembers && firstTimer.familyMembers.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Family Members
                </h3>
                <div className="space-y-3">
                  {firstTimer.familyMembers.map((member, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.relationship}</p>
                      </div>
                      <div className="text-right text-sm">
                        {member.age && <p className="text-gray-600">Age: {member.age}</p>}
                        {member.attended && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Attended
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Interests & Prayer Requests */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {firstTimer.interests && firstTimer.interests.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-pink-600" />
                    Interests
                  </h3>
                  <div className="space-y-2">
                    {firstTimer.interests.map((interest, index) => (
                      <span key={index} className="inline-block bg-pink-100 text-pink-800 px-2 py-1 rounded-md text-sm mr-2 mb-2">
                        {interest}
                      </span>
                    ))}
                  </div>
                </Card>
              )}

              {firstTimer.prayerRequests && firstTimer.prayerRequests.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                    Prayer Requests
                  </h3>
                  <div className="space-y-2">
                    {firstTimer.prayerRequests.map((request, index) => (
                      <p key={index} className="text-gray-700 bg-yellow-50 p-2 rounded-md text-sm">
                        {request}
                      </p>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Notes */}
            {firstTimer.notes && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  Notes
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">{firstTimer.notes}</p>
              </Card>
            )}
          </div>

          {/* Right Column - Follow-up Management */}
          <div className="space-y-6">
            {/* Visit Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Visit Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Date of Visit</label>
                  <p className="text-gray-900">{formatDate(firstTimer.dateOfVisit)}</p>
                </div>
                {firstTimer.serviceType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Service Type</label>
                    <p className="text-gray-900 capitalize">{firstTimer.serviceType.replace('_', ' ')}</p>
                  </div>
                )}
                {firstTimer.howDidYouHear && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">How Did You Hear</label>
                    <p className="text-gray-900 capitalize">{firstTimer.howDidYouHear}</p>
                  </div>
                )}
                {firstTimer.visitorType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Visitor Type</label>
                    <p className="text-gray-900 capitalize">{firstTimer.visitorType.replace('_', ' ')}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Follow-up Management */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-indigo-600" />
                Management
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Status</label>
                  <select
                    value={firstTimer.status}
                    onChange={(e) => handleStatusUpdate(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="not_contacted">Not Contacted</option>
                    <option value="contacted">Contacted</option>
                    <option value="scheduled_visit">Visit Scheduled</option>
                    <option value="visited">Visited</option>
                    <option value="joined_group">Joined Group</option>
                    <option value="converted">Converted</option>
                    <option value="lost_contact">Lost Contact</option>
                  </select>
                </div>
                {firstTimer.assignedTo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Assigned To</label>
                    <p className="text-gray-900">{typeof firstTimer.assignedTo === 'object' ? `${firstTimer.assignedTo?.firstName} ${firstTimer.assignedTo?.lastName}` : firstTimer.assignedTo}</p>
                  </div>
                )}
                {firstTimer.tags && firstTimer.tags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Tags</label>
                    <div className="flex flex-wrap gap-1">
                      {firstTimer.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Follow-up History */}
            <FollowUpHistory
              followUps={firstTimer.followUps}
              onAddFollowUp={() => setShowFollowUpForm(true)}
            />
          </div>
        </div>
      </div>

      {/* Follow-up Form Modal */}
      <AnimatePresence>
        {showFollowUpForm && (
          <FollowUpForm
            onSubmit={handleAddFollowUp}
            onCancel={() => setShowFollowUpForm(false)}
            loading={submittingFollowUp}
          />
        )}
      </AnimatePresence>
    </Layout>
  )
}