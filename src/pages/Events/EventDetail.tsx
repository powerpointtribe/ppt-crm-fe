import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Edit,
  Calendar,
  MapPin,
  Clock,
  Users,
  Mail,
  Phone,
  Copy,
  ExternalLink,
  UserPlus,
  CheckCircle,
  Search,
  Trash2,
  PlayCircle,
  BarChart3,
  ClipboardCheck,
  Plus,
  AlertTriangle,
  Award,
  TrendingUp,
  UserCheck,
  UserX,
  BookOpen,
  GraduationCap,
  Eye,
  RefreshCw,
  Download,
  FileText,
  FileSpreadsheet,
  ChevronDown,
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { eventsService, Event, EventRegistration, EventStats } from '@/services/events'
import {
  RegistrationStatus,
  RegistrationSearchParams,
  EventSession,
  FullEventAnalytics,
  ParticipantAccountabilitySummary,
  ParticipantAccountabilityQueryParams,
  AttendanceStatusCategory,
  EventPartner,
  PartnerStatus,
  PartnerSearchParams,
} from '@/types/event'
import { formatDate } from '@/utils/formatters'
import { showToast } from '@/utils/toast'
import { useAuth } from '@/contexts/AuthContext-unified'
import { cn } from '@/utils/cn'

const statusColors: Record<RegistrationStatus, 'default' | 'success' | 'warning' | 'destructive'> = {
  pending: 'warning',
  confirmed: 'success',
  waitlisted: 'default',
  cancelled: 'destructive',
  attended: 'success',
  'no-show': 'destructive',
}

const attendanceStatusColors: Record<string, string> = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  needs_improvement: 'bg-yellow-100 text-yellow-800',
  at_risk: 'bg-orange-100 text-orange-800',
  failed: 'bg-red-100 text-red-800',
}

const sessionStatusColors: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
  scheduled: 'default',
  'in-progress': 'warning',
  completed: 'success',
  cancelled: 'destructive',
}

export default function EventDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { hasPermission } = useAuth()

  const [event, setEvent] = useState<Event | null>(null)
  const [stats, setStats] = useState<EventStats | null>(null)
  const [registrations, setRegistrations] = useState<EventRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'registrations' | 'sessions' | 'analytics' | 'accountability' | 'committee' | 'partners'>('info')
  const [registrationSearch, setRegistrationSearch] = useState('')
  const [registrationFilter, setRegistrationFilter] = useState<RegistrationStatus | ''>('')
  const [loadingRegistrations, setLoadingRegistrations] = useState(false)

  // Sessions state
  const [sessions, setSessions] = useState<EventSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)

  // Analytics state
  const [analytics, setAnalytics] = useState<FullEventAnalytics | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

  // Accountability state
  const [accountability, setAccountability] = useState<ParticipantAccountabilitySummary | null>(null)
  const [loadingAccountability, setLoadingAccountability] = useState(false)
  const [accountabilityFilter, setAccountabilityFilter] = useState<AttendanceStatusCategory | ''>('')
  const [accountabilitySearch, setAccountabilitySearch] = useState('')

  // Partners state
  const [partners, setPartners] = useState<EventPartner[]>([])
  const [loadingPartners, setLoadingPartners] = useState(false)
  const [partnerFilter, setPartnerFilter] = useState<PartnerStatus | ''>('')
  const [partnerSearch, setPartnerSearch] = useState('')
  const [selectedPartner, setSelectedPartner] = useState<EventPartner | null>(null)
  const [showPartnerModal, setShowPartnerModal] = useState(false)

  // Export state
  const [showRegistrationExportMenu, setShowRegistrationExportMenu] = useState(false)
  const [showPartnerExportMenu, setShowPartnerExportMenu] = useState(false)
  const [exportingRegistrations, setExportingRegistrations] = useState(false)
  const [exportingPartners, setExportingPartners] = useState(false)

  const canUpdate = hasPermission('events:update')
  const canDelete = hasPermission('events:delete')
  const canViewRegistrations = hasPermission('events:view-registrations')
  const canCheckIn = hasPermission('events:check-in')
  const canManageCommittee = hasPermission('events:manage-committee')
  const [deleting, setDeleting] = useState(false)

  const handleDeleteEvent = async () => {
    if (!id) return
    if (!window.confirm('Are you sure you want to delete this event? This will also delete all registrations.')) return
    try {
      setDeleting(true)
      await eventsService.deleteEvent(id)
      showToast('success', 'Event deleted successfully')
      navigate('/events')
    } catch (err) {
      showToast('error', 'Failed to delete event')
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    if (id) {
      loadEvent(id)
    }
  }, [id])

  useEffect(() => {
    if (id && activeTab === 'registrations' && canViewRegistrations) {
      loadRegistrations()
    }
  }, [id, activeTab, registrationFilter])

  useEffect(() => {
    if (id && activeTab === 'sessions') {
      loadSessions()
    }
  }, [id, activeTab])

  useEffect(() => {
    if (id && activeTab === 'analytics') {
      loadAnalytics()
    }
  }, [id, activeTab])

  useEffect(() => {
    if (id && activeTab === 'accountability') {
      loadAccountability()
    }
  }, [id, activeTab, accountabilityFilter])

  useEffect(() => {
    if (id && activeTab === 'partners') {
      loadPartners()
    }
  }, [id, activeTab, partnerFilter])

  // Close export dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.export-dropdown-container')) {
        setShowRegistrationExportMenu(false)
        setShowPartnerExportMenu(false)
      }
    }

    if (showRegistrationExportMenu || showPartnerExportMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showRegistrationExportMenu, showPartnerExportMenu])

  const loadEvent = async (eventId: string) => {
    try {
      setError(null)
      const [eventData, statsData] = await Promise.all([
        eventsService.getEventById(eventId),
        eventsService.getEventStats(eventId),
      ])
      setEvent(eventData)
      setStats(statsData)
    } catch (error: any) {
      console.error('Error loading event:', error)
      setError(error.message || 'Failed to load event')
    } finally {
      setLoading(false)
    }
  }

  const loadRegistrations = async () => {
    if (!id) return

    try {
      setLoadingRegistrations(true)
      const params: RegistrationSearchParams = {
        page: 1,
        limit: 50,
        search: registrationSearch || undefined,
        status: registrationFilter || undefined,
      }
      const response = await eventsService.getRegistrations(id, params)
      setRegistrations(response.items)
    } catch (error: any) {
      console.error('Error loading registrations:', error)
      showToast('error', 'Failed to load registrations')
    } finally {
      setLoadingRegistrations(false)
    }
  }

  const handleCheckIn = async (registrationId: string) => {
    if (!id) return

    try {
      await eventsService.checkInAttendee(id, registrationId)
      showToast('success', 'Attendee checked in successfully')
      loadRegistrations()
      loadEvent(id)
    } catch (error: any) {
      showToast('error', error.message || 'Failed to check in attendee')
    }
  }

  const handleUpdateStatus = async (registrationId: string, status: RegistrationStatus) => {
    if (!id) return

    try {
      await eventsService.updateRegistrationStatus(id, registrationId, status)
      showToast('success', 'Registration status updated')
      loadRegistrations()
      loadEvent(id)
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update status')
    }
  }

  const copyRegistrationLink = () => {
    if (!event?.registrationSlug) return
    const link = `${window.location.origin}/event-registration/${event.registrationSlug}`
    navigator.clipboard.writeText(link)
    showToast('success', 'Registration link copied to clipboard')
  }

  // Load sessions
  const loadSessions = async () => {
    if (!id) return
    try {
      setLoadingSessions(true)
      const response = await eventsService.getSessions(id, { limit: 50 })
      setSessions(response.items || [])
    } catch (error: any) {
      console.error('Error loading sessions:', error)
      showToast('error', 'Failed to load sessions')
    } finally {
      setLoadingSessions(false)
    }
  }

  // Load analytics
  const loadAnalytics = async () => {
    if (!id) return
    try {
      setLoadingAnalytics(true)
      const data = await eventsService.getEventAnalytics(id)
      setAnalytics(data)
    } catch (error: any) {
      console.error('Error loading analytics:', error)
      showToast('error', 'Failed to load analytics')
    } finally {
      setLoadingAnalytics(false)
    }
  }

  // Load accountability
  const loadAccountability = async () => {
    if (!id) return
    try {
      setLoadingAccountability(true)
      const params: ParticipantAccountabilityQueryParams = {
        attendanceStatus: accountabilityFilter || undefined,
        search: accountabilitySearch || undefined,
        limit: 50,
      }
      const data = await eventsService.getParticipantAccountability(id, params)
      setAccountability(data)
    } catch (error: any) {
      console.error('Error loading accountability:', error)
      showToast('error', 'Failed to load accountability data')
    } finally {
      setLoadingAccountability(false)
    }
  }

  // Load partners
  const loadPartners = async () => {
    if (!id) return
    try {
      setLoadingPartners(true)
      const params: PartnerSearchParams = {
        status: partnerFilter || undefined,
        search: partnerSearch || undefined,
        limit: 50,
      }
      const response = await eventsService.getEventPartners(id, params)
      setPartners(response.items || [])
    } catch (error: any) {
      console.error('Error loading partners:', error)
      showToast('error', 'Failed to load partners')
    } finally {
      setLoadingPartners(false)
    }
  }

  // Update partner status
  const handleUpdatePartnerStatus = async (partnerId: string, status: PartnerStatus) => {
    if (!id) return
    try {
      await eventsService.updatePartnerStatus(id, partnerId, { status })
      showToast('success', 'Partner status updated')
      loadPartners()
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update partner status')
    }
  }

  // Export registrations
  const handleExportRegistrations = async (format: 'csv' | 'xlsx' | 'pdf') => {
    if (!id) return
    try {
      setExportingRegistrations(true)
      setShowRegistrationExportMenu(false)

      const params: RegistrationSearchParams = {
        search: registrationSearch || undefined,
        status: registrationFilter || undefined,
      }

      const blob = await eventsService.exportRegistrations(id, format, params)

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${event?.title || 'event'}-registrations-${new Date().toISOString().split('T')[0]}.${format === 'xlsx' ? 'xlsx' : format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      showToast('success', `Registrations exported as ${format.toUpperCase()}`)
    } catch (error: any) {
      showToast('error', error.message || 'Failed to export registrations')
    } finally {
      setExportingRegistrations(false)
    }
  }

  // Export partners
  const handleExportPartners = async (format: 'csv' | 'xlsx' | 'pdf') => {
    if (!id) return
    try {
      setExportingPartners(true)
      setShowPartnerExportMenu(false)

      const params: PartnerSearchParams = {
        search: partnerSearch || undefined,
        status: partnerFilter || undefined,
      }

      const blob = await eventsService.exportPartners(id, format, params)

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${event?.title || 'event'}-partners-${new Date().toISOString().split('T')[0]}.${format === 'xlsx' ? 'xlsx' : format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      showToast('success', `Partners exported as ${format.toUpperCase()}`)
    } catch (error: any) {
      showToast('error', error.message || 'Failed to export partners')
    } finally {
      setExportingPartners(false)
    }
  }

  // Delete session
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return
    try {
      await eventsService.deleteSession(sessionId)
      showToast('success', 'Session deleted')
      loadSessions()
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete session')
    }
  }

  if (loading) {
    return (
      <Layout title="Event Details">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error || !event) {
    return (
      <Layout
        title="Event Details"
        actions={
          <Button variant="secondary" onClick={() => navigate('/events')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        }
      >
        <div className="text-center py-12">
          <div className="text-red-600 text-lg font-medium">
            {error || 'Event not found'}
          </div>
          <Button className="mt-4" onClick={() => navigate('/events')}>
            Back to Events
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      title={event.title}
      actions={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/events')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {canUpdate && (
            <Button onClick={() => navigate(`/events/${id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              onClick={handleDeleteEvent}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-3">
        {/* Event Header */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
          {/* Compact header bar */}
          <div className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <h1 className="text-lg font-bold text-gray-900 truncate">{event.title}</h1>
                  <Badge
                    variant={
                      event.status === 'published' ? 'success'
                        : event.status === 'cancelled' ? 'destructive'
                        : 'default'
                    }
                    className="text-xs flex-shrink-0"
                  >
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </Badge>
                  {event.isGlobal && (
                    <Badge className="bg-gray-100 text-gray-600 border-0 text-xs flex-shrink-0">
                      Global
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    {formatDate(event.startDate)}
                  </span>
                  {event.startTime && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      {event.startTime}{event.endTime && ` – ${event.endTime}`}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    <span className="truncate max-w-[200px]">{event.location.name}</span>
                  </span>
                </div>
              </div>

              {event.registrationSlug && event.status === 'published' && event.registrationSettings?.integrationMode !== 'api' && (
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={copyRegistrationLink}
                    className="p-1.5 rounded-md text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                    title="Copy registration link"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => window.open(`/event-registration/${event.registrationSlug}`, '_blank')}
                    className="p-1.5 rounded-md text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                    title="Open registration page"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Inline Stats */}
            {stats && (
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                {[
                  { value: stats.totalRegistrations, label: 'Total', color: 'text-gray-900' },
                  { value: stats.byStatus.confirmed, label: 'Confirmed', color: 'text-green-600' },
                  { value: stats.byStatus.attended, label: 'Attended', color: 'text-blue-600' },
                  { value: stats.byStatus.pending, label: 'Pending', color: 'text-amber-600' },
                ].map((stat, i) => (
                  <div key={stat.label} className="flex items-center gap-1.5">
                    <span className={cn('text-base font-bold', stat.color)}>{stat.value}</span>
                    <span className="text-xs text-gray-400">{stat.label}</span>
                    {i < 3 && <span className="ml-3 text-gray-200">|</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <nav className="flex -mb-px overflow-x-auto px-1 scrollbar-thin">
            {[
              { id: 'info', label: 'Info', icon: Calendar },
              {
                id: 'registrations',
                label: 'Registrations',
                icon: Users,
                permission: canViewRegistrations,
                count: stats?.totalRegistrations
              },
              {
                id: 'partners',
                label: 'Partners',
                icon: UserPlus,
                permission: canViewRegistrations,
                count: partners.length || undefined
              },
              { id: 'sessions', label: 'Sessions', icon: PlayCircle, count: sessions.length || undefined },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'accountability', label: 'Accountability', icon: ClipboardCheck, permission: canViewRegistrations },
              { id: 'committee', label: 'Committee', icon: UserPlus },
            ]
              .filter((tab) => tab.permission !== false)
              .map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      'relative flex items-center gap-1.5 px-3 py-3 border-b-2 font-medium text-xs whitespace-nowrap transition-all',
                      isActive
                        ? 'border-primary-500 text-primary-600 bg-primary-50/50'
                        : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isActive && 'text-primary-600')} />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={cn(
                        'ml-1 px-2 py-0.5 text-xs font-semibold rounded-full',
                        isActive
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-600'
                      )}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
          </nav>
        </div>

        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 divide-y divide-gray-100">
            {/* Date & Time + Location row */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              <div className="p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Date & Time</h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                    <span className="font-medium text-gray-800">
                      {formatDate(event.startDate)}
                      {event.startTime && <span className="text-gray-500 ml-1">at {event.startTime}</span>}
                    </span>
                  </div>
                  {event.endDate && event.endDate !== event.startDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                      <span className="text-gray-600">
                        {formatDate(event.endDate)}
                        {event.endTime && <span className="text-gray-400 ml-1">at {event.endTime}</span>}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Location</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    <span className="font-medium text-gray-800">{event.location.name}</span>
                  </div>
                  {event.location.isVirtual ? (
                    event.location.virtualLink && (
                      <a
                        href={event.location.virtualLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium ml-5"
                      >
                        Join virtual meeting
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )
                  ) : (
                    <div className="ml-5 text-gray-500 text-xs">
                      {event.location.address && <span>{event.location.address}</span>}
                      {event.location.city && <span>{event.location.address ? ', ' : ''}{event.location.city}{event.location.state ? `, ${event.location.state}` : ''}</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            {/* Contact + Registration row */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              <div className="p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Contact</h3>
                <div className="space-y-1.5">
                  {event.contactEmail && (
                    <a href={`mailto:${event.contactEmail}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600 transition-colors">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                      <span>{event.contactEmail}</span>
                    </a>
                  )}
                  {event.contactPhone && (
                    <a href={`tel:${event.contactPhone}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600 transition-colors">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      <span>{event.contactPhone}</span>
                    </a>
                  )}
                  {!event.contactEmail && !event.contactPhone && (
                    <p className="text-xs text-gray-400">No contact info provided</p>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Registration</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Status</span>
                    <Badge variant={event.registrationSettings.isOpen ? 'success' : 'destructive'} className="text-xs">
                      {event.registrationSettings.isOpen ? 'Open' : 'Closed'}
                    </Badge>
                  </div>
                  {event.registrationSettings.maxAttendees && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Capacity</span>
                        <span className="text-xs font-semibold text-gray-900">
                          {stats?.totalRegistrations || 0} / {event.registrationSettings.maxAttendees}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-1.5 rounded-full transition-all"
                          style={{
                            width: `${Math.min(((stats?.totalRegistrations || 0) / event.registrationSettings.maxAttendees) * 100, 100)}%`
                          }}
                        />
                      </div>
                    </>
                  )}
                  {event.registrationSettings.deadline && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Deadline</span>
                      <span className="text-xs font-medium text-gray-900">{formatDate(event.registrationSettings.deadline)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Approval</span>
                    <span className="text-xs font-medium text-gray-700">
                      {event.registrationSettings.requireApproval ? 'Required' : 'Auto'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Integration Info */}
            {event.registrationSlug && (
              <div className="p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {event.registrationSettings?.integrationMode === 'api' ? 'API Integration' : 'Registration Link'}
                </h3>

                {event.registrationSettings?.integrationMode === 'api' ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs bg-blue-100 text-blue-700 border-0">API Mode</Badge>
                      <span className="text-xs text-gray-500">External website submits via API</span>
                    </div>
                    {event.registrationSettings?.apiKey && (
                      <div className="bg-gray-50 rounded-md px-3 py-2 border border-gray-200">
                        <p className="text-[10px] text-gray-400 mb-0.5">API Key</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-gray-800 font-mono break-all flex-1">{event.registrationSettings.apiKey}</code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(event.registrationSettings.apiKey!)
                              showToast('success', 'API key copied')
                            }}
                            className="flex-shrink-0 p-1.5 rounded-md bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                            title="Copy API key"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Endpoint: <code className="bg-gray-100 px-1 rounded text-[11px]">POST /api/v1/events/public/{event.registrationSlug}/register</code>
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 bg-gray-50 rounded-md px-3 py-2 border border-gray-200">
                      <p className="text-xs text-gray-500 truncate">
                        {window.location.origin}/event-registration/{event.registrationSlug}
                      </p>
                    </div>
                    <button
                      onClick={copyRegistrationLink}
                      className="flex-shrink-0 p-2 rounded-md bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                      title="Copy link"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => window.open(`/event-registration/${event.registrationSlug}`, '_blank')}
                      className="flex-shrink-0 p-2 rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'registrations' && canViewRegistrations && (
          <Card className="shadow-sm rounded-lg border-gray-100">
            {/* Toolbar */}
            <div className="p-3 border-b border-gray-100 bg-gray-50/50">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      value={registrationSearch}
                      onChange={(e) => setRegistrationSearch(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && loadRegistrations()}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
                    />
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <select
                    value={registrationFilter}
                    onChange={(e) => setRegistrationFilter(e.target.value as RegistrationStatus | '')}
                    className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="waitlisted">Waitlisted</option>
                    <option value="attended">Attended</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no-show">No Show</option>
                  </select>

                  {/* Export Dropdown */}
                  <div className="relative export-dropdown-container">
                    <Button
                      onClick={() => setShowRegistrationExportMenu(!showRegistrationExportMenu)}
                      size="sm"
                      variant="outline"
                      disabled={exportingRegistrations || registrations.length === 0}
                      className="gap-2"
                    >
                      {exportingRegistrations ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">Export</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>

                    {showRegistrationExportMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                        <button
                          onClick={() => handleExportRegistrations('csv')}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                        >
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span>Export as CSV</span>
                        </button>
                        <button
                          onClick={() => handleExportRegistrations('xlsx')}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                        >
                          <FileSpreadsheet className="h-4 w-4 text-green-600" />
                          <span>Export as Excel</span>
                        </button>
                        <button
                          onClick={() => handleExportRegistrations('pdf')}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                        >
                          <FileText className="h-4 w-4 text-red-600" />
                          <span>Export as PDF</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <Button onClick={loadRegistrations} size="sm" variant="outline">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {loadingRegistrations ? (
              <div className="p-8 text-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : registrations.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <h4 className="text-sm font-semibold text-gray-900 mb-1">No registrations found</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  {registrationFilter || registrationSearch
                    ? 'Try adjusting your filters or search query'
                    : 'Registrations will appear here once people sign up for this event'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Attendee
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Registered
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {registrations.map((reg) => (
                      <tr key={reg._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {reg.attendeeInfo.firstName[0]}{reg.attendeeInfo.lastName[0]}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="font-medium text-gray-900">
                                {reg.attendeeInfo.firstName} {reg.attendeeInfo.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{reg.attendeeInfo.email}</div>
                          <div className="text-sm text-gray-500">{reg.attendeeInfo.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={reg.attendeeType === 'member' ? 'success' : 'default'} className="font-medium">
                            {reg.attendeeType === 'member' ? 'Member' : 'Visitor'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={statusColors[reg.status]} className="font-medium">
                            {reg.status.charAt(0).toUpperCase() + reg.status.slice(1).replace('-', ' ')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(reg.registeredAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canCheckIn && reg.status !== 'attended' && reg.status !== 'cancelled' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleCheckIn(reg._id)}
                                className="font-medium"
                              >
                                <CheckCircle className="h-4 w-4 mr-1.5" />
                                Check In
                              </Button>
                            )}
                            {reg.status === 'pending' && (
                              <>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(reg._id, 'confirmed')}
                                  className="font-medium"
                                >
                                  Confirm
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleUpdateStatus(reg._id, 'cancelled')}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Partners Tab */}
        {activeTab === 'partners' && canViewRegistrations && (
          <Card className="shadow-sm rounded-lg border-gray-100">
            {/* Toolbar */}
            <div className="p-3 border-b border-gray-100 bg-gray-50/50">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, company, or email..."
                      value={partnerSearch}
                      onChange={(e) => setPartnerSearch(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && loadPartners()}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
                    />
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <select
                    value={partnerFilter}
                    onChange={(e) => setPartnerFilter(e.target.value as PartnerStatus | '')}
                    className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Statuses</option>
                    <option value={PartnerStatus.PENDING}>Pending</option>
                    <option value={PartnerStatus.CONTACTED}>Contacted</option>
                    <option value={PartnerStatus.IN_DISCUSSION}>In Discussion</option>
                    <option value={PartnerStatus.CONFIRMED}>Confirmed</option>
                    <option value={PartnerStatus.DECLINED}>Declined</option>
                  </select>

                  {/* Export Dropdown */}
                  <div className="relative export-dropdown-container">
                    <Button
                      onClick={() => setShowPartnerExportMenu(!showPartnerExportMenu)}
                      size="sm"
                      variant="outline"
                      disabled={exportingPartners || partners.length === 0}
                      className="gap-2"
                    >
                      {exportingPartners ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">Export</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>

                    {showPartnerExportMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                        <button
                          onClick={() => handleExportPartners('csv')}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                        >
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span>Export as CSV</span>
                        </button>
                        <button
                          onClick={() => handleExportPartners('xlsx')}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                        >
                          <FileSpreadsheet className="h-4 w-4 text-green-600" />
                          <span>Export as Excel</span>
                        </button>
                        <button
                          onClick={() => handleExportPartners('pdf')}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                        >
                          <FileText className="h-4 w-4 text-red-600" />
                          <span>Export as PDF</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <Button onClick={loadPartners} size="sm" variant="outline">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {loadingPartners ? (
              <div className="p-8 text-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : partners.length === 0 ? (
              <div className="p-8 text-center">
                <UserPlus className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <h4 className="text-sm font-semibold text-gray-900 mb-1">No Partnership Inquiries</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  {partnerFilter || partnerSearch
                    ? 'No partners match your current filters'
                    : 'Partnership inquiries will appear here when submitted'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Partner
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Interest
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {partners.map((partner) => (
                      <tr
                        key={partner._id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedPartner(partner)
                          setShowPartnerModal(true)
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center">
                              <UserPlus className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-3">
                              <div className="font-medium text-gray-900">{partner.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{partner.company || '—'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{partner.email}</div>
                          <div className="text-sm text-gray-500">{partner.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate" title={partner.interestDetails}>
                            {partner.interestDetails}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={
                              partner.status === PartnerStatus.CONFIRMED ? 'success' :
                              partner.status === PartnerStatus.DECLINED ? 'destructive' :
                              partner.status === PartnerStatus.PENDING ? 'warning' :
                              'default'
                            }
                            className="font-medium"
                          >
                            {partner.status.charAt(0).toUpperCase() + partner.status.slice(1).replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(partner.submittedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {partner.status === PartnerStatus.PENDING && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleUpdatePartnerStatus(partner._id, PartnerStatus.CONTACTED)}
                                className="font-medium"
                              >
                                Mark Contacted
                              </Button>
                            )}
                            {partner.status === PartnerStatus.CONTACTED && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleUpdatePartnerStatus(partner._id, PartnerStatus.IN_DISCUSSION)}
                                className="font-medium"
                              >
                                In Discussion
                              </Button>
                            )}
                            {partner.status === PartnerStatus.IN_DISCUSSION && (
                              <>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleUpdatePartnerStatus(partner._id, PartnerStatus.CONFIRMED)}
                                  className="font-medium"
                                >
                                  Confirm
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleUpdatePartnerStatus(partner._id, PartnerStatus.DECLINED)}
                                >
                                  Decline
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Event Sessions</h3>
                <p className="text-xs text-gray-500">Manage sessions and track attendance</p>
              </div>
              {canUpdate && (
                <Button onClick={() => navigate(`/events/${id}/sessions/new`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Session
                </Button>
              )}
            </div>

            {loadingSessions ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
              </div>
            ) : sessions.length === 0 ? (
              <Card className="p-8 text-center">
                <BookOpen className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <h4 className="text-sm font-medium text-gray-900 mb-1">No Sessions Yet</h4>
                <p className="text-xs text-gray-500 mb-4">Create sessions to track attendance for multi-day or training events.</p>
                {canUpdate && (
                  <Button onClick={() => navigate(`/events/${id}/sessions/new`)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Session
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {sessions.map((session, index) => (
                  <motion.div
                    key={session._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                            <span className="text-lg font-bold text-primary-600">{session.order || index + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{session.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(session.date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {session.startTime} - {session.endTime}
                              </span>
                              <Badge variant={sessionStatusColors[session.status] || 'default'}>
                                {session.status.charAt(0).toUpperCase() + session.status.slice(1).replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">{session.attendanceCount || 0}</div>
                            <div className="text-xs text-gray-500">Present</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-yellow-600">{session.lateCount || 0}</div>
                            <div className="text-xs text-gray-500">Late</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-600">{session.absentCount || 0}</div>
                            <div className="text-xs text-gray-500">Absent</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => navigate(`/events/${id}/sessions/${session._id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {canUpdate && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/events/${id}/sessions/${session._id}/edit`)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteSession(session._id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {session.description && (
                        <p className="text-sm text-gray-600 mt-3 pl-16">{session.description}</p>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            {loadingAnalytics ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
              </div>
            ) : analytics ? (
              <>
                {/* Registration Analytics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Total Registrations</p>
                          <p className="text-2xl font-bold text-gray-900">{analytics.registrations.totalRegistrations}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Attended</p>
                          <p className="text-2xl font-bold text-green-600">{analytics.registrations.attendedRegistrations}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <UserCheck className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">No Shows</p>
                          <p className="text-2xl font-bold text-red-600">{analytics.registrations.noShowRegistrations}</p>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg">
                          <UserX className="h-6 w-6 text-red-600" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Conversion Rate</p>
                          <p className="text-2xl font-bold text-purple-600">{analytics.registrations.conversionRate}%</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <TrendingUp className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </div>

                {/* Registration Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Registration Status</h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Confirmed', value: analytics.registrations.confirmedRegistrations, color: 'bg-green-500' },
                        { label: 'Pending', value: analytics.registrations.pendingRegistrations, color: 'bg-yellow-500' },
                        { label: 'Waitlisted', value: analytics.registrations.waitlistedRegistrations, color: 'bg-blue-500' },
                        { label: 'Cancelled', value: analytics.registrations.cancelledRegistrations, color: 'bg-red-500' },
                      ].map((item) => {
                        const total = analytics.registrations.totalRegistrations || 1
                        const percentage = Math.round((item.value / total) * 100)
                        return (
                          <div key={item.label} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">{item.label}</span>
                              <span className="font-medium">{item.value} ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className={`${item.color} h-2 rounded-full`} style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Attendee Breakdown</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-3xl font-bold text-green-700">{analytics.registrations.memberRegistrations}</p>
                        <p className="text-sm text-green-600">Members</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-3xl font-bold text-blue-700">{analytics.registrations.visitorRegistrations}</p>
                        <p className="text-sm text-blue-600">Visitors</p>
                      </div>
                    </div>
                    <div className="mt-6">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Daily Registration Trend</h5>
                      <div className="flex items-end gap-1 h-24">
                        {analytics.registrations.registrationsByDay?.slice(-14).map((day, i) => {
                          const maxCount = Math.max(...analytics.registrations.registrationsByDay.map(d => d.count)) || 1
                          const height = (day.count / maxCount) * 100
                          return (
                            <div
                              key={i}
                              className="flex-1 bg-primary-200 rounded-t hover:bg-primary-400 transition-colors"
                              style={{ height: `${Math.max(height, 5)}%` }}
                              title={`${day.date}: ${day.count} registrations`}
                            />
                          )
                        })}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Session Analytics (if available) */}
                {analytics.sessions && (
                  <Card className="p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Session Analytics</h4>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{analytics.sessions.totalSessions}</p>
                        <p className="text-sm text-gray-500">Total Sessions</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-700">{analytics.sessions.completedSessions}</p>
                        <p className="text-sm text-green-600">Completed</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-700">{analytics.sessions.averageAttendancePerSession}</p>
                        <p className="text-sm text-blue-600">Avg. Attendance</p>
                      </div>
                    </div>
                    {analytics.sessions.attendanceBySession && analytics.sessions.attendanceBySession.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Present</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Late</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Absent</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Rate</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {analytics.sessions.attendanceBySession.map((session) => (
                              <tr key={session.sessionId}>
                                <td className="px-4 py-3">
                                  <div className="font-medium text-gray-900">{session.sessionTitle}</div>
                                  <div className="text-sm text-gray-500">{session.date}</div>
                                </td>
                                <td className="px-4 py-3 text-center text-green-600 font-medium">{session.present}</td>
                                <td className="px-4 py-3 text-center text-yellow-600 font-medium">{session.late}</td>
                                <td className="px-4 py-3 text-center text-red-600 font-medium">{session.absent}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                                    session.attendanceRate >= 80 ? 'bg-green-100 text-green-700' :
                                    session.attendanceRate >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {session.attendanceRate}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                )}

                {/* Completion Analytics (for training events) */}
                {analytics.completion && (
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <GraduationCap className="h-5 w-5 text-purple-600" />
                      <h4 className="text-lg font-medium text-gray-900">Training Completion</h4>
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-700">{analytics.completion.totalEnrolled}</p>
                        <p className="text-sm text-blue-600">Enrolled</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-700">{analytics.completion.totalInProgress}</p>
                        <p className="text-sm text-yellow-600">In Progress</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-700">{analytics.completion.totalCompleted}</p>
                        <p className="text-sm text-green-600">Completed</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-700">{analytics.completion.totalCertified}</p>
                        <p className="text-sm text-purple-600">Certified</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-2xl font-bold text-red-700">{analytics.completion.totalDropped}</p>
                        <p className="text-sm text-red-600">Dropped</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 mt-6">
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Completion Rate</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-100 rounded-full h-3">
                            <div className="bg-green-500 h-3 rounded-full" style={{ width: `${analytics.completion.completionRate}%` }} />
                          </div>
                          <span className="text-lg font-bold text-green-600">{analytics.completion.completionRate}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Certification Rate</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-100 rounded-full h-3">
                            <div className="bg-purple-500 h-3 rounded-full" style={{ width: `${analytics.completion.certificationRate}%` }} />
                          </div>
                          <span className="text-lg font-bold text-purple-600">{analytics.completion.certificationRate}%</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <Card className="p-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No analytics data available</p>
              </Card>
            )}
          </div>
        )}

        {/* Accountability Tab */}
        {activeTab === 'accountability' && canViewRegistrations && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Participant Accountability</h3>
                <p className="text-xs text-gray-500">Track attendance, progress, and certification status</p>
              </div>
              <Button variant="secondary" onClick={() => loadAccountability()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {loadingAccountability ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
              </div>
            ) : accountability ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{accountability.totalParticipants}</p>
                      <p className="text-sm text-gray-500">Total Participants</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{accountability.excellentAttendance}</p>
                      <p className="text-sm text-green-600">Excellent (≥90%)</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{accountability.goodAttendance}</p>
                      <p className="text-sm text-blue-600">Good (75-89%)</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{accountability.atRisk}</p>
                      <p className="text-sm text-orange-600">At Risk (40-59%)</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{accountability.failed}</p>
                      <p className="text-sm text-red-600">Failed (&lt;40%)</p>
                    </div>
                  </Card>
                </div>

                {/* Alerts */}
                {accountability.alerts && accountability.alerts.length > 0 && (
                  <Card className="p-4 border-l-4 border-l-amber-500">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      <h4 className="font-medium text-gray-900">Accountability Alerts</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {accountability.alerts.map((alert, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg ${
                            alert.severity === 'critical' ? 'bg-red-50 border border-red-200' :
                            alert.severity === 'high' ? 'bg-orange-50 border border-orange-200' :
                            'bg-yellow-50 border border-yellow-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-medium ${
                              alert.severity === 'critical' ? 'text-red-700' :
                              alert.severity === 'high' ? 'text-orange-700' :
                              'text-yellow-700'
                            }`}>
                              {alert.type.replace('_', ' ').charAt(0).toUpperCase() + alert.type.replace('_', ' ').slice(1)}
                            </span>
                            <Badge variant={alert.severity === 'critical' ? 'destructive' : alert.severity === 'high' ? 'warning' : 'default'}>
                              {alert.count}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-600">
                            {alert.participants.slice(0, 3).map(p => p.name).join(', ')}
                            {alert.participants.length > 3 && ` +${alert.participants.length - 3} more`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Filter & Search */}
                <Card className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search participants..."
                          value={accountabilitySearch}
                          onChange={(e) => setAccountabilitySearch(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && loadAccountability()}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <select
                      value={accountabilityFilter}
                      onChange={(e) => setAccountabilityFilter(e.target.value as AttendanceStatusCategory | '')}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">All Attendance Status</option>
                      <option value="excellent">Excellent (≥90%)</option>
                      <option value="good">Good (75-89%)</option>
                      <option value="needs_improvement">Needs Improvement (60-74%)</option>
                      <option value="at_risk">At Risk (40-59%)</option>
                      <option value="failed">Failed (&lt;40%)</option>
                    </select>
                  </div>
                </Card>

                {/* Participants List */}
                <Card>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participant</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Sessions</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Attendance</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Assessments</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Progress</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Follow-up</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {accountability.participants.map((participant) => (
                          <tr key={participant.registrationId} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{participant.participantName}</div>
                              <div className="text-sm text-gray-500">{participant.participantEmail}</div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-medium">{participant.sessionsAttended}</span>
                              <span className="text-gray-400">/{participant.totalSessionsRequired}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded text-sm font-medium ${attendanceStatusColors[participant.attendanceStatus]}`}>
                                {participant.attendancePercentage}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-medium text-green-600">{participant.assessmentsPassed}</span>
                              <span className="text-gray-400">/</span>
                              <span className="font-medium text-red-600">{participant.assessmentsFailed}</span>
                              {participant.totalAssessments > 0 && (
                                <div className="text-xs text-gray-500">Avg: {participant.averageAssessmentScore}%</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                                <div
                                  className={`h-2 rounded-full ${
                                    participant.completionPercentage >= 80 ? 'bg-green-500' :
                                    participant.completionPercentage >= 60 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${participant.completionPercentage}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{participant.completionPercentage}%</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge
                                variant={
                                  participant.certificationStatus === 'certified' ? 'success' :
                                  participant.certificationStatus === 'completed' ? 'success' :
                                  participant.certificationStatus === 'in_progress' ? 'warning' :
                                  participant.certificationStatus === 'failed' ? 'destructive' :
                                  'default'
                                }
                              >
                                {participant.certificationStatus.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {participant.requiresFollowUp ? (
                                <span className="inline-flex items-center gap-1 text-amber-600">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span className="text-xs">{participant.followUpReason}</span>
                                </span>
                              ) : (
                                <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {accountability.participants.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      No participants match the current filters
                    </div>
                  )}
                </Card>

                {/* Certification Summary */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="h-5 w-5 text-purple-600" />
                    <h4 className="text-lg font-medium text-gray-900">Certification Summary</h4>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-700">{accountability.eligibleForCertification}</p>
                      <p className="text-sm text-gray-500">Eligible</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-700">{accountability.certified}</p>
                      <p className="text-sm text-green-600">Certified</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-700">{accountability.pendingCertification}</p>
                      <p className="text-sm text-yellow-600">Pending</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-700">{accountability.certificationRate}%</p>
                      <p className="text-sm text-purple-600">Rate</p>
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-12 text-center">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No accountability data available</p>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'committee' && (
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Committee Members</h3>
                {canManageCommittee && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/events/${id}/edit`)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Manage Committee
                  </Button>
                )}
              </div>

              {event.committee.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No committee members assigned
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {event.committee.map((member, index) => {
                    const memberData = typeof member.member === 'string' ? null : member.member
                    return (
                      <div
                        key={index}
                        className="flex items-center p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                          <Users className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {memberData
                              ? `${memberData.firstName} ${memberData.lastName}`
                              : 'Unknown Member'}
                          </div>
                          <div className="text-sm text-gray-500">{member.role}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Partner Detail Modal */}
      {showPartnerModal && selectedPartner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowPartnerModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <UserPlus className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{selectedPartner.name}</h3>
                    <p className="text-indigo-100 text-sm mt-1">Partnership Inquiry</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPartnerModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="mt-4">
                <Badge
                  variant={
                    selectedPartner.status === PartnerStatus.CONFIRMED ? 'success' :
                    selectedPartner.status === PartnerStatus.DECLINED ? 'destructive' :
                    selectedPartner.status === PartnerStatus.PENDING ? 'warning' :
                    'default'
                  }
                  className="font-semibold px-3 py-1 text-sm"
                >
                  {selectedPartner.status.charAt(0).toUpperCase() + selectedPartner.status.slice(1).replace('_', ' ')}
                </Badge>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Contact Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <a
                        href={`mailto:${selectedPartner.email}`}
                        className="text-sm font-medium text-gray-900 hover:text-primary-600 break-all"
                      >
                        {selectedPartner.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 mb-1">Phone</p>
                      <a
                        href={`tel:${selectedPartner.phone}`}
                        className="text-sm font-medium text-gray-900 hover:text-primary-600"
                      >
                        {selectedPartner.phone}
                      </a>
                    </div>
                  </div>
                </div>

                {selectedPartner.company && (
                  <div className="mt-4 flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 mb-1">Company</p>
                      <p className="text-sm font-medium text-gray-900">{selectedPartner.company}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Interest Details */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Partnership Interest</h4>
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{selectedPartner.interestDetails}</p>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Timeline</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="h-9 w-9 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Submitted</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(selectedPartner.submittedAt)}</p>
                    </div>
                  </div>

                  {selectedPartner.contactedAt && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="h-9 w-9 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-blue-600">Contacted</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(selectedPartner.contactedAt)}</p>
                      </div>
                    </div>
                  )}

                  {selectedPartner.confirmedAt && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <div className="h-9 w-9 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <Award className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-green-600">Confirmed</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(selectedPartner.confirmedAt)}</p>
                      </div>
                    </div>
                  )}

                  {selectedPartner.declinedAt && (
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                      <div className="h-9 w-9 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserX className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs text-red-600">Declined</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(selectedPartner.declinedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedPartner.notes && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Internal Notes</h4>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                    <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{selectedPartner.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer - Actions */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {selectedPartner.status === PartnerStatus.PENDING && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUpdatePartnerStatus(selectedPartner._id, PartnerStatus.CONTACTED)
                        setShowPartnerModal(false)
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      Mark as Contacted
                    </Button>
                  )}

                  {selectedPartner.status === PartnerStatus.CONTACTED && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUpdatePartnerStatus(selectedPartner._id, PartnerStatus.IN_DISCUSSION)
                        setShowPartnerModal(false)
                      }}
                    >
                      Move to Discussion
                    </Button>
                  )}

                  {selectedPartner.status === PartnerStatus.IN_DISCUSSION && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUpdatePartnerStatus(selectedPartner._id, PartnerStatus.CONFIRMED)
                          setShowPartnerModal(false)
                        }}
                        className="bg-green-600 text-white hover:bg-green-700"
                      >
                        <Award className="h-4 w-4 mr-1.5" />
                        Confirm Partnership
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUpdatePartnerStatus(selectedPartner._id, PartnerStatus.DECLINED)
                          setShowPartnerModal(false)
                        }}
                      >
                        <UserX className="h-4 w-4 mr-1.5" />
                        Decline
                      </Button>
                    </>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`mailto:${selectedPartner.email}`, '_blank')}
                  >
                    <Mail className="h-4 w-4 mr-1.5" />
                    Send Email
                  </Button>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowPartnerModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </Layout>
  )
}
