import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Edit, Phone, Mail, Calendar, MapPin,
  Users, Clock, CheckCircle, AlertCircle, UserPlus, Plus,
  User, MessageSquare, Star, Heart, Copy, Check, Archive, ArchiveRestore, X, XCircle
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import FollowUpForm from '@/components/forms/FollowUpForm'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { FirstTimer, firstTimersService, FollowUpRecord } from '@/services/first-timers'
import { Group, groupsService } from '@/services/groups'
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
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [archiveReason, setArchiveReason] = useState('')
  const [archiveLoading, setArchiveLoading] = useState(false)
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUpRecord | null>(null)
  const [showIntegrateModal, setShowIntegrateModal] = useState(false)
  const [districts, setDistricts] = useState<Group[]>([])
  const [units, setUnits] = useState<Group[]>([])
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('')
  const [integrateLoading, setIntegrateLoading] = useState(false)
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [closeReason, setCloseReason] = useState('')
  const [closeLoading, setCloseLoading] = useState(false)

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

  const handleReadyForIntegration = async () => {
    if (!firstTimer?.assignedTo) {
      toast.error('Cannot Mark Ready', 'First-timer must be assigned to someone before marking as ready for integration')
      return
    }
    if (!firstTimer?.followUps || firstTimer.followUps.length === 0) {
      toast.error('Cannot Mark Ready', 'At least one follow-up record is required before marking as ready for integration')
      return
    }
    try {
      await firstTimersService.markReadyForIntegration(id!)
      await loadFirstTimer()
      toast.success('Ready for Integration', 'First-timer has been marked as ready for integration. Notifications have been sent.')
    } catch (error: any) {
      toast.error('Failed', error.message || 'Failed to mark as ready for integration')
    }
  }

  const handleUnmarkReadyForIntegration = async () => {
    try {
      await firstTimersService.unmarkReadyForIntegration(id!)
      await loadFirstTimer()
      toast.success('Unmarked', 'First-timer is no longer marked as ready for integration')
    } catch (error: any) {
      toast.error('Failed', error.message || 'Failed to unmark ready for integration')
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleArchive = async () => {
    try {
      setArchiveLoading(true)
      await firstTimersService.archiveFirstTimer(id!, archiveReason || undefined)
      toast.success('Archived', 'First-timer has been archived successfully')
      setShowArchiveModal(false)
      setArchiveReason('')
      await loadFirstTimer()
    } catch (error: any) {
      toast.error('Archive Failed', error.message || 'Failed to archive first-timer')
    } finally {
      setArchiveLoading(false)
    }
  }

  const handleUnarchive = async () => {
    try {
      setArchiveLoading(true)
      await firstTimersService.unarchiveFirstTimer(id!)
      toast.success('Restored', 'First-timer has been restored successfully')
      await loadFirstTimer()
    } catch (error: any) {
      toast.error('Restore Failed', error.message || 'Failed to restore first-timer')
    } finally {
      setArchiveLoading(false)
    }
  }

  const handleClose = async () => {
    if (!firstTimer?.assignedTo) {
      toast.error('Cannot Close', 'First-timer must be assigned to someone before closing')
      return
    }
    if (!firstTimer?.followUps || firstTimer.followUps.length === 0) {
      toast.error('Cannot Close', 'At least one follow-up record is required before closing')
      return
    }
    try {
      setCloseLoading(true)
      await firstTimersService.closeFirstTimer(id!, closeReason || undefined)
      toast.success('Closed', 'First-timer has been closed successfully')
      setShowCloseModal(false)
      setCloseReason('')
      await loadFirstTimer()
    } catch (error: any) {
      toast.error('Close Failed', error.message || 'Failed to close first-timer')
    } finally {
      setCloseLoading(false)
    }
  }

  const openIntegrateModal = async () => {
    setShowIntegrateModal(true)
    setLoadingGroups(true)
    try {
      const [districtsRes, unitsRes] = await Promise.all([
        groupsService.getDistricts({ limit: 100 }),
        groupsService.getUnits({ limit: 100 }),
      ])
      setDistricts(districtsRes.items || [])
      setUnits(unitsRes.items || [])
    } catch (error) {
      toast.error('Failed to load groups')
    } finally {
      setLoadingGroups(false)
    }
  }

  const handleIntegrate = async () => {
    if (!selectedDistrict) {
      toast.error('Please select a district')
      return
    }
    try {
      setIntegrateLoading(true)
      await firstTimersService.integrateFirstTimer(
        id!,
        selectedDistrict,
        selectedUnit || undefined
      )
      toast.success('Integration Complete', 'First-timer has been successfully integrated as a member')
      setShowIntegrateModal(false)
      setSelectedDistrict('')
      setSelectedUnit('')
      await loadFirstTimer()
    } catch (error: any) {
      toast.error('Integration Failed', error.message || 'Failed to integrate first-timer')
    } finally {
      setIntegrateLoading(false)
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      NEW: 'New',
      ENGAGED: 'Engaged',
      READY_FOR_INTEGRATION: 'Ready for Integration',
      ARCHIVED: 'Archived',
      CLOSED: 'Closed',
      // Legacy status values
      not_contacted: 'Not Contacted',
      contacted: 'Contacted',
      scheduled_visit: 'Visit Scheduled',
      visited: 'Visited',
      joined_group: 'Joined Group',
      converted: 'Converted',
      lost_contact: 'Lost Contact',
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
      in_visit: 'In-Visit',
    }
    return labels[method] || method
  }

  const getVisitBadge = (visitNumber: number) => {
    const suffix = visitNumber === 2 ? 'nd' : visitNumber === 3 ? 'rd' : 'th'
    return `${visitNumber}${suffix} Visit`
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

  const formatPhoneForWhatsApp = (phone: string) => {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '')
    // If starts with 0, remove it and prepend 234 (Nigeria country code)
    if (cleaned.startsWith('0')) {
      cleaned = '234' + cleaned.substring(1)
    }
    // If doesn't start with 234, prepend it
    if (!cleaned.startsWith('234')) {
      cleaned = '234' + cleaned
    }
    return cleaned
  }

  const getReminderStyle = (reminderDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const reminder = new Date(reminderDate)
    reminder.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((reminder.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'text-red-600 font-medium' // Overdue
    if (diffDays === 0) return 'text-orange-600 font-medium' // Due today
    if (diffDays <= 2) return 'text-amber-600' // Due soon
    return 'text-gray-600' // Future
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
              {firstTimer.profilePhotoUrl ? (
                <button
                  onClick={() => setShowPhotoModal(true)}
                  className="relative group"
                >
                  <img
                    src={firstTimer.profilePhotoUrl}
                    alt={`${firstTimer.firstName} ${firstTimer.lastName}`}
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 shadow-sm cursor-pointer transition-transform group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.parentElement!.style.display = 'none'
                      e.currentTarget.parentElement!.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                  <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition-colors" />
                </button>
              ) : null}
              <div className={cn(
                "w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center text-white text-2xl font-semibold",
                firstTimer.profilePhotoUrl ? "hidden" : ""
              )}>
                {firstTimer.firstName[0]}{firstTimer.lastName[0]}
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {firstTimer.firstName} {firstTimer.lastName}
                </h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                    firstTimer.status === 'ENGAGED' && "bg-blue-100 text-blue-700",
                    firstTimer.status === 'NEW' && "bg-gray-100 text-gray-700",
                    firstTimer.status === 'READY_FOR_INTEGRATION' && "bg-green-100 text-green-700",
                    firstTimer.status === 'CLOSED' && "bg-purple-100 text-purple-700",
                    firstTimer.status === 'ARCHIVED' && "bg-orange-100 text-orange-700",
                    !['ENGAGED', 'NEW', 'READY_FOR_INTEGRATION', 'CLOSED', 'ARCHIVED'].includes(firstTimer.status) && "bg-gray-100 text-gray-600"
                  )}>
                    {getStatusLabel(firstTimer.status)}
                  </span>
                  {firstTimer.converted && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Member
                    </span>
                  )}
                  {firstTimer.isArchived && !firstTimer.status?.includes('ARCHIVED') && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      Archived
                    </span>
                  )}
                  {firstTimer.readyForIntegration && !firstTimer.converted && firstTimer.status !== 'READY_FOR_INTEGRATION' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Ready
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Visited {formatDate(firstTimer.dateOfVisit)} · {daysSinceVisit} days ago
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {firstTimer.status === 'CLOSED' ? (
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                  firstTimer.converted || firstTimer.memberRecord
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  Closed - {firstTimer.converted || firstTimer.memberRecord ? 'Member' : 'Inactive'}
                </span>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/first-timers/${id}/edit`)}
                  >
                    <Edit className="h-4 w-4 mr-1.5" />
                    Edit
                  </Button>
                  {firstTimer.isArchived ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleUnarchive}
                      disabled={archiveLoading}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <ArchiveRestore className="h-4 w-4 mr-1.5" />
                      {archiveLoading ? 'Restoring...' : 'Restore'}
                    </Button>
                  ) : !firstTimer.readyForIntegration && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowArchiveModal(true)}
                      className="text-orange-600 border-orange-200 hover:bg-orange-50"
                    >
                      <Archive className="h-4 w-4 mr-1.5" />
                      Archive
                    </Button>
                  )}
                  {firstTimer.readyForIntegration && (
                    <Button
                      size="sm"
                      onClick={openIntegrateModal}
                      disabled={!firstTimer.assignedTo || !firstTimer.followUps || firstTimer.followUps.length === 0}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={
                        !firstTimer.assignedTo
                          ? 'First-timer must be assigned to someone'
                          : !firstTimer.followUps || firstTimer.followUps.length === 0
                            ? 'At least one follow-up record is required'
                            : ''
                      }
                    >
                      <UserPlus className="h-4 w-4 mr-1.5" />
                      Integrate
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => setShowFollowUpForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Follow-up
                  </Button>
                  {(firstTimer.status === 'ENGAGED' || firstTimer.status === 'ARCHIVED' || firstTimer.isArchived) && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowCloseModal(true)}
                      disabled={!firstTimer.assignedTo || !firstTimer.followUps || firstTimer.followUps.length === 0}
                      className="text-purple-600 border-purple-200 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={
                        !firstTimer.assignedTo
                          ? 'First-timer must be assigned to someone'
                          : !firstTimer.followUps || firstTimer.followUps.length === 0
                            ? 'At least one follow-up record is required'
                            : ''
                      }
                    >
                      <XCircle className="h-4 w-4 mr-1.5" />
                      Close
                    </Button>
                  )}
                </>
              )}
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
            onClick={() => window.open(`https://wa.me/${formatPhoneForWhatsApp(firstTimer.phone)}`, '_blank')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </button>
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
                    {firstTimer.status === 'CLOSED' ? (
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                          firstTimer.converted || firstTimer.memberRecord
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          Closed - {firstTimer.converted || firstTimer.memberRecord ? 'Converted to Member' : 'Inactive'}
                        </span>
                      </div>
                    ) : (
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
                    )}

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
                    <p className="text-sm text-gray-500 mb-6">
                      {firstTimer.status === 'CLOSED'
                        ? 'This visitor has been closed'
                        : 'Start tracking your interactions with this visitor'}
                    </p>
                    {firstTimer.status !== 'CLOSED' && (
                      <Button onClick={() => setShowFollowUpForm(true)} size="sm">
                        <Plus className="h-4 w-4 mr-1.5" />
                        Add Follow-up
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                          <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Outcome</th>
                          <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                          <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">By</th>
                          <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Reminder</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sortedFollowUps.map((followUp, index) => (
                          <tr
                            key={index}
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => setSelectedFollowUp(followUp)}
                          >
                            <td className="py-3 px-2 text-sm text-gray-900 whitespace-nowrap">
                              {formatDate(followUp.date)}
                            </td>
                            <td className="py-3 px-2 text-sm whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="text-gray-600">{getMethodLabel(followUp.method)}</span>
                                {followUp.method === 'in_visit' && followUp.visitNumber && (
                                  <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                    {getVisitBadge(followUp.visitNumber)}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-2 whitespace-nowrap">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium",
                                getOutcomeStyle(followUp.outcome)
                              )}>
                                {getOutcomeLabel(followUp.outcome)}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-sm text-gray-600 max-w-[180px]">
                              <p className="truncate">
                                {followUp.notes || '—'}
                              </p>
                            </td>
                            <td className="py-3 px-2 text-sm text-gray-600 whitespace-nowrap">
                              {typeof followUp.contactedBy === 'string'
                                ? followUp.contactedBy
                                : `${followUp.contactedBy.firstName} ${followUp.contactedBy.lastName}`}
                            </td>
                            <td className={cn(
                              "py-3 px-2 text-sm whitespace-nowrap",
                              followUp.nextFollowUpDate ? getReminderStyle(followUp.nextFollowUpDate) : 'text-gray-400'
                            )}>
                              {followUp.nextFollowUpDate ? formatDate(followUp.nextFollowUpDate) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

      {/* Mobile FAB - only show if not closed */}
      {firstTimer.status !== 'CLOSED' && (
        <button
          onClick={() => setShowFollowUpForm(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center lg:hidden"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

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

      {/* Follow-up Detail Modal */}
      <AnimatePresence>
        {selectedFollowUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedFollowUp(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Follow-up Details</h3>
                <button
                  onClick={() => setSelectedFollowUp(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Date</span>
                  <span className="text-xs font-medium text-gray-900">{formatDate(selectedFollowUp.date)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Method</span>
                  <span className="text-xs font-medium text-gray-900">{getMethodLabel(selectedFollowUp.method)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Outcome</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-xs font-medium",
                    getOutcomeStyle(selectedFollowUp.outcome)
                  )}>
                    {getOutcomeLabel(selectedFollowUp.outcome)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Contacted By</span>
                  <span className="text-xs font-medium text-gray-900">
                    {typeof selectedFollowUp.contactedBy === 'string'
                      ? selectedFollowUp.contactedBy
                      : `${selectedFollowUp.contactedBy.firstName} ${selectedFollowUp.contactedBy.lastName}`}
                  </span>
                </div>
                {selectedFollowUp.nextFollowUpDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Reminder</span>
                    <span className={cn(
                      "text-xs font-medium",
                      getReminderStyle(selectedFollowUp.nextFollowUpDate)
                    )}>
                      {formatDate(selectedFollowUp.nextFollowUpDate)}
                    </span>
                  </div>
                )}
                {selectedFollowUp.notes && (
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500 block mb-1">Notes</span>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap">{selectedFollowUp.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Archive Modal */}
      <AnimatePresence>
        {showArchiveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
                setShowArchiveModal(false)
                setArchiveReason('')
              }} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
              >
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                      <Archive className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                      <h3 className="text-base font-semibold leading-6 text-gray-900">
                        Archive First Timer
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to archive {firstTimer?.firstName} {firstTimer?.lastName}? They will be moved to the archived list and can be restored later.
                        </p>
                        <div className="mt-4">
                          <label htmlFor="archiveReason" className="block text-sm font-medium text-gray-700">
                            Reason (optional)
                          </label>
                          <textarea
                            id="archiveReason"
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Enter reason for archiving..."
                            value={archiveReason}
                            onChange={(e) => setArchiveReason(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <Button
                    onClick={handleArchive}
                    disabled={archiveLoading}
                    className="inline-flex w-full justify-center rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 sm:ml-3 sm:w-auto"
                  >
                    {archiveLoading ? 'Archiving...' : 'Archive'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowArchiveModal(false)
                      setArchiveReason('')
                    }}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Modal */}
      <AnimatePresence>
        {showPhotoModal && firstTimer?.profilePhotoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={() => setShowPhotoModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-2xl max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowPhotoModal(false)}
                className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
              <img
                src={firstTimer.profilePhotoUrl}
                alt={`${firstTimer.firstName} ${firstTimer.lastName}`}
                className="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain"
              />
              <p className="text-center text-white/80 text-sm mt-3">
                {firstTimer.firstName} {firstTimer.lastName}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Integrate Modal */}
      <AnimatePresence>
        {showIntegrateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowIntegrateModal(false)
              setSelectedDistrict('')
              setSelectedUnit('')
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Integrate as Member</h3>
                    <p className="text-xs text-gray-500">Assign to district and unit</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowIntegrateModal(false)
                    setSelectedDistrict('')
                    setSelectedUnit('')
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {loadingGroups ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="md" />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        District <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select a district</option>
                        {districts.map((district) => (
                          <option key={district._id} value={district._id}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Unit <span className="text-gray-400">(optional)</span>
                      </label>
                      <select
                        value={selectedUnit}
                        onChange={(e) => setSelectedUnit(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select a unit</option>
                        {units.map((unit) => (
                          <option key={unit._id} value={unit._id}>
                            {unit.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600">
                        This will create a member record for <strong>{firstTimer?.firstName} {firstTimer?.lastName}</strong> and assign them to the selected district{selectedUnit ? ' and unit' : ''}.
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowIntegrateModal(false)
                    setSelectedDistrict('')
                    setSelectedUnit('')
                  }}
                  disabled={integrateLoading}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleIntegrate}
                  disabled={!selectedDistrict || integrateLoading || loadingGroups}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {integrateLoading ? 'Integrating...' : 'Integrate'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close Modal */}
      <AnimatePresence>
        {showCloseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
                setShowCloseModal(false)
                setCloseReason('')
              }} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
              >
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 sm:mx-0 sm:h-10 sm:w-10">
                      <XCircle className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                      <h3 className="text-base font-semibold leading-6 text-gray-900">
                        Close First Timer
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to close {firstTimer?.firstName} {firstTimer?.lastName}? This will mark them as inactive (not converted to member).
                        </p>
                        <div className="mt-4">
                          <label htmlFor="closeReason" className="block text-sm font-medium text-gray-700">
                            Reason (optional)
                          </label>
                          <textarea
                            id="closeReason"
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                            placeholder="Enter reason for closing..."
                            value={closeReason}
                            onChange={(e) => setCloseReason(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <Button
                    onClick={handleClose}
                    disabled={closeLoading}
                    className="inline-flex w-full justify-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 sm:ml-3 sm:w-auto"
                  >
                    {closeLoading ? 'Closing...' : 'Close'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowCloseModal(false)
                      setCloseReason('')
                    }}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
