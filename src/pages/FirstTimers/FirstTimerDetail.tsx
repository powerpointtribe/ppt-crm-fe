import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Edit, Phone, Mail, Calendar, MapPin,
  Users, Clock, CheckCircle, AlertCircle, UserPlus, Plus,
  User, MessageSquare, Star, Heart, Copy, Check
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import FollowUpForm from '@/components/forms/FollowUpForm'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { FirstTimer, firstTimersService, FollowUpRecord } from '@/services/first-timers'
import { formatDate } from '@/utils/formatters'
import { cn } from '@/utils/cn'

type TabType = 'overview' | 'followups' | 'details'

export default function FirstTimerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [firstTimer, setFirstTimer] = useState<FirstTimer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [showFollowUpForm, setShowFollowUpForm] = useState(false)
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [copiedField, setCopiedField] = useState<string | null>(null)

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
      await loadFirstTimer()
      setShowFollowUpForm(false)
      toast.success('Follow-up Added', 'Your follow-up has been recorded')
    } catch (error) {
      toast.error('Failed to Add Follow-up', 'Please try again')
    } finally {
      setSubmittingFollowUp(false)
    }
  }

  const handleStatusUpdate = async (status: string) => {
    try {
      await firstTimersService.updateStatus(id!, status as any)
      await loadFirstTimer()
      toast.success('Status Updated')
    } catch (error) {
      toast.error('Failed to Update Status')
    }
  }

  const handleConvertToMember = async () => {
    try {
      await firstTimersService.convertToMember(id!)
      await loadFirstTimer()
      toast.success('Converted to Member')
    } catch (error) {
      toast.error('Conversion Failed')
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      not_contacted: 'Not Contacted',
      contacted: 'Contacted',
      scheduled_visit: 'Visit Scheduled',
      visited: 'Visited',
      joined_group: 'Joined Group',
      converted: 'Converted',
      lost_contact: 'Lost Contact',
      NEW: 'New',
      ENGAGED: 'Engaged',
      CLOSED: 'Closed',
    }
    return labels[status] || status
  }

  const getDaysSinceVisit = (dateOfVisit: string) => {
    const visitDate = new Date(dateOfVisit)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - visitDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      phone: 'Phone Call',
      email: 'Email',
      sms: 'SMS',
      whatsapp: 'WhatsApp',
      visit: 'Home Visit',
      video_call: 'Video Call',
    }
    return labels[method] || method
  }

  const getOutcomeStyle = (outcome: string) => {
    if (outcome === 'successful' || outcome === 'interested') return 'text-green-700 bg-green-50'
    if (outcome === 'not_interested') return 'text-red-700 bg-red-50'
    return 'text-gray-700 bg-gray-100'
  }

  const getOutcomeLabel = (outcome: string) => {
    const labels: Record<string, string> = {
      successful: 'Successful',
      interested: 'Interested',
      no_answer: 'No Answer',
      busy: 'Busy',
      not_interested: 'Not Interested',
      follow_up_needed: 'Follow-up Needed',
    }
    return labels[outcome] || outcome
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

  const daysSinceVisit = getDaysSinceVisit(firstTimer.dateOfVisit)
  const sortedFollowUps = [...(firstTimer.followUps || [])].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview' },
    { id: 'followups' as TabType, label: 'Follow-ups', count: firstTimer.followUps?.length || 0 },
    { id: 'details' as TabType, label: 'Details' },
  ]

  return (
    <Layout title="">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/first-timers')}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to First Timers
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center text-white text-xl font-semibold">
                {firstTimer.firstName[0]}{firstTimer.lastName[0]}
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {firstTimer.firstName} {firstTimer.lastName}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-gray-500">
                    Visited {formatDate(firstTimer.dateOfVisit)}
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className="text-sm text-gray-500">{daysSinceVisit} days ago</span>
                  {firstTimer.converted && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Member
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/first-timers/${id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
              <Button
                size="sm"
                onClick={() => setShowFollowUpForm(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Follow-up
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => window.open(`tel:${firstTimer.phone}`, '_self')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Phone className="h-4 w-4" />
            Call
          </button>

          {firstTimer.email && (
            <button
              onClick={() => window.open(`mailto:${firstTimer.email}`, '_self')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
          )}

          <button
            onClick={() => window.open(`https://wa.me/${firstTimer.phone.replace(/\D/g, '')}`, '_blank')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </button>

          {!firstTimer.converted && (
            <button
              onClick={handleConvertToMember}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Convert to Member
            </button>
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
              <div className="space-y-8">
                {/* Contact & Visit Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Contact Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Contact Information</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{firstTimer.phone}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(firstTimer.phone, 'phone')}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-100 rounded transition-all"
                        >
                          {copiedField === 'phone' ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>

                      {firstTimer.email && (
                        <div className="flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-900">{firstTimer.email}</span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(firstTimer.email!, 'email')}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-100 rounded transition-all"
                          >
                            {copiedField === 'email' ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      )}

                      {firstTimer.address && (firstTimer.address.street || firstTimer.address.city) && (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                          <span className="text-gray-900">
                            {[firstTimer.address.street, firstTimer.address.city, firstTimer.address.state]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Visit Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Visit Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date of Visit</span>
                        <span className="text-gray-900">{formatDate(firstTimer.dateOfVisit)}</span>
                      </div>
                      {firstTimer.serviceType && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Service Type</span>
                          <span className="text-gray-900 capitalize">{firstTimer.serviceType.replace('_', ' ')}</span>
                        </div>
                      )}
                      {firstTimer.howDidYouHear && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">How They Heard</span>
                          <span className="text-gray-900 capitalize">{firstTimer.howDidYouHear.replace('_', ' ')}</span>
                        </div>
                      )}
                      {firstTimer.visitorType && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Visitor Type</span>
                          <span className="text-gray-900 capitalize">{firstTimer.visitorType.replace('_', ' ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Status</h3>
                  <div className="flex items-center gap-4">
                    <select
                      value={firstTimer.status}
                      onChange={(e) => handleStatusUpdate(e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    >
                      <option value="not_contacted">Not Contacted</option>
                      <option value="contacted">Contacted</option>
                      <option value="scheduled_visit">Visit Scheduled</option>
                      <option value="visited">Visited</option>
                      <option value="joined_group">Joined Group</option>
                      <option value="converted">Converted</option>
                      <option value="lost_contact">Lost Contact</option>
                    </select>

                    {firstTimer.assignedTo && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <User className="h-4 w-4" />
                        <span>Assigned to </span>
                        <span className="text-gray-900">
                          {typeof firstTimer.assignedTo === 'object'
                            ? `${(firstTimer.assignedTo as any)?.firstName} ${(firstTimer.assignedTo as any)?.lastName}`
                            : firstTimer.assignedTo}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Follow-up Summary */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Follow-up Summary</h3>
                  <div className="flex items-center gap-8">
                    <div>
                      <p className="text-3xl font-semibold text-gray-900">{firstTimer.followUps?.length || 0}</p>
                      <p className="text-sm text-gray-500">Total</p>
                    </div>
                    <div className="w-px h-10 bg-gray-200" />
                    <div>
                      <p className="text-3xl font-semibold text-gray-900">
                        {firstTimer.followUps?.filter(f => f.outcome === 'successful' || f.outcome === 'interested').length || 0}
                      </p>
                      <p className="text-sm text-gray-500">Successful</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Follow-ups Tab */}
            {activeTab === 'followups' && (
              <div>
                {sortedFollowUps.length === 0 ? (
                  <div className="text-center py-16">
                    <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-base font-medium text-gray-900 mb-1">No follow-ups yet</h3>
                    <p className="text-sm text-gray-500 mb-6">Start tracking your interactions with this visitor</p>
                    <Button onClick={() => setShowFollowUpForm(true)} size="sm">
                      <Plus className="h-4 w-4 mr-1.5" />
                      Add Follow-up
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {sortedFollowUps.map((followUp, index) => (
                      <div
                        key={index}
                        className="flex gap-4 py-4 border-b border-gray-100 last:border-0"
                      >
                        <div className="w-24 flex-shrink-0">
                          <p className="text-sm text-gray-900">{formatDate(followUp.date)}</p>
                          <p className="text-xs text-gray-500">{getMethodLabel(followUp.method)}</p>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-xs font-medium",
                              getOutcomeStyle(followUp.outcome)
                            )}>
                              {getOutcomeLabel(followUp.outcome)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{followUp.notes}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            by {typeof followUp.contactedBy === 'string'
                              ? followUp.contactedBy
                              : `${followUp.contactedBy.firstName} ${followUp.contactedBy.lastName}`}
                            {followUp.nextFollowUpDate && (
                              <span className="ml-3">
                                Next: {formatDate(followUp.nextFollowUpDate)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-8">
                {/* Personal Information */}
                {(firstTimer.dateOfBirth || firstTimer.gender || firstTimer.maritalStatus || firstTimer.occupation) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Personal Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {firstTimer.dateOfBirth && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Date of Birth</p>
                          <p className="text-sm text-gray-900">{formatDate(firstTimer.dateOfBirth)}</p>
                        </div>
                      )}
                      {firstTimer.gender && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Gender</p>
                          <p className="text-sm text-gray-900 capitalize">{firstTimer.gender}</p>
                        </div>
                      )}
                      {firstTimer.maritalStatus && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Marital Status</p>
                          <p className="text-sm text-gray-900 capitalize">{firstTimer.maritalStatus}</p>
                        </div>
                      )}
                      {firstTimer.occupation && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Occupation</p>
                          <p className="text-sm text-gray-900">{firstTimer.occupation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Emergency Contact */}
                {firstTimer.emergencyContact && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Emergency Contact</h3>
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Name</p>
                        <p className="text-sm text-gray-900">{firstTimer.emergencyContact.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Relationship</p>
                        <p className="text-sm text-gray-900">{firstTimer.emergencyContact.relationship}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Phone</p>
                        <p className="text-sm text-gray-900">{firstTimer.emergencyContact.phone}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Family Members */}
                {firstTimer.familyMembers && firstTimer.familyMembers.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Family Members</h3>
                    <div className="space-y-3">
                      {firstTimer.familyMembers.map((member, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <div>
                            <p className="text-sm text-gray-900">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.relationship}</p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            {member.age && <span>Age {member.age}</span>}
                            {member.attended && (
                              <span className="ml-3 text-green-600">Attended</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interests */}
                {firstTimer.interests && firstTimer.interests.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {firstTimer.interests.map((interest, idx) => (
                        <span key={idx} className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded-full">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prayer Requests */}
                {firstTimer.prayerRequests && firstTimer.prayerRequests.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Prayer Requests</h3>
                    <ul className="space-y-2">
                      {firstTimer.prayerRequests.map((request, idx) => (
                        <li key={idx} className="text-sm text-gray-700 pl-4 border-l-2 border-gray-200">
                          {request}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Notes */}
                {firstTimer.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Notes</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{firstTimer.notes}</p>
                  </div>
                )}

                {/* Show empty state if no details */}
                {!firstTimer.dateOfBirth && !firstTimer.gender && !firstTimer.maritalStatus &&
                 !firstTimer.occupation && !firstTimer.emergencyContact &&
                 (!firstTimer.familyMembers || firstTimer.familyMembers.length === 0) &&
                 (!firstTimer.interests || firstTimer.interests.length === 0) &&
                 (!firstTimer.prayerRequests || firstTimer.prayerRequests.length === 0) &&
                 !firstTimer.notes && (
                  <div className="text-center py-16">
                    <User className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-base font-medium text-gray-900 mb-1">No additional details</h3>
                    <p className="text-sm text-gray-500">
                      Edit this record to add more information
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setShowFollowUpForm(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center lg:hidden"
      >
        <Plus className="h-6 w-6" />
      </button>

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

      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} />
    </Layout>
  )
}
