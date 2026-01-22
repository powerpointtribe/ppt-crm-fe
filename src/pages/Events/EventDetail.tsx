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
  const [activeTab, setActiveTab] = useState<'info' | 'registrations' | 'sessions' | 'analytics' | 'accountability' | 'committee'>('info')
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

  const canUpdate = hasPermission('events:update')
  const canViewRegistrations = hasPermission('events:view-registrations')
  const canCheckIn = hasPermission('events:check-in')
  const canManageCommittee = hasPermission('events:manage-committee')

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
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
                  <Badge
                    variant={
                      event.status === 'published'
                        ? 'success'
                        : event.status === 'cancelled'
                        ? 'destructive'
                        : 'default'
                    }
                  >
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </Badge>
                </div>
                <p className="text-gray-500">{event.type.charAt(0).toUpperCase() + event.type.slice(1)}</p>
              </div>
              {event.registrationSlug && event.status === 'published' && (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={copyRegistrationLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(`/event-registration/${event.registrationSlug}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </Button>
                </div>
              )}
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.totalRegistrations}
                  </div>
                  <div className="text-sm text-gray-500">Total Registrations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.byStatus.confirmed}
                  </div>
                  <div className="text-sm text-gray-500">Confirmed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.byStatus.attended}
                  </div>
                  <div className="text-sm text-gray-500">Attended</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.byStatus.pending}
                  </div>
                  <div className="text-sm text-gray-500">Pending</div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px space-x-6 overflow-x-auto">
            {[
              { id: 'info', label: 'Event Info', icon: Calendar },
              { id: 'registrations', label: 'Registrations', icon: Users, permission: canViewRegistrations },
              { id: 'sessions', label: 'Sessions', icon: PlayCircle },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'accountability', label: 'Accountability', icon: ClipboardCheck, permission: canViewRegistrations },
              { id: 'committee', label: 'Committee', icon: UserPlus },
            ]
              .filter((tab) => tab.permission !== false)
              .map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      'flex items-center px-1 py-4 border-b-2 font-medium text-sm whitespace-nowrap',
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                )
              })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Date & Time</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                    <span>
                      {formatDate(event.startDate)}
                      {event.endDate !== event.startDate && (
                        <> - {formatDate(event.endDate)}</>
                      )}
                    </span>
                  </div>
                  {event.startTime && (
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-5 w-5 mr-3 text-gray-400" />
                      <span>
                        {event.startTime}
                        {event.endTime && <> - {event.endTime}</>}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Location</h3>
                <div className="space-y-3">
                  <div className="flex items-start text-gray-600">
                    <MapPin className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium">{event.location.name}</div>
                      {event.location.isVirtual ? (
                        event.location.virtualLink && (
                          <a
                            href={event.location.virtualLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline"
                          >
                            Join virtual meeting
                          </a>
                        )
                      ) : (
                        <>
                          {event.location.address && <div>{event.location.address}</div>}
                          {event.location.city && (
                            <div>
                              {event.location.city}, {event.location.state}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {event.description && (
              <Card className="md:col-span-2">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
                </div>
              </Card>
            )}

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {event.contactEmail && (
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-5 w-5 mr-3 text-gray-400" />
                      <a href={`mailto:${event.contactEmail}`} className="text-primary-600 hover:underline">
                        {event.contactEmail}
                      </a>
                    </div>
                  )}
                  {event.contactPhone && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="h-5 w-5 mr-3 text-gray-400" />
                      <a href={`tel:${event.contactPhone}`} className="text-primary-600 hover:underline">
                        {event.contactPhone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Registration Settings</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <Badge variant={event.registrationSettings.isOpen ? 'success' : 'destructive'}>
                      {event.registrationSettings.isOpen ? 'Open' : 'Closed'}
                    </Badge>
                  </div>
                  {event.registrationSettings.maxAttendees && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Max Attendees</span>
                      <span className="font-medium">{event.registrationSettings.maxAttendees}</span>
                    </div>
                  )}
                  {event.registrationSettings.deadline && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Deadline</span>
                      <span className="font-medium">
                        {formatDate(event.registrationSettings.deadline)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Approval Required</span>
                    <span className="font-medium">
                      {event.registrationSettings.requireApproval ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'registrations' && canViewRegistrations && (
          <Card>
            <div className="p-4 border-b">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search registrations..."
                      value={registrationSearch}
                      onChange={(e) => setRegistrationSearch(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && loadRegistrations()}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <select
                  value={registrationFilter}
                  onChange={(e) => setRegistrationFilter(e.target.value as RegistrationStatus | '')}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="waitlisted">Waitlisted</option>
                  <option value="attended">Attended</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no-show">No Show</option>
                </select>
              </div>
            </div>

            {loadingRegistrations ? (
              <div className="p-8 text-center">
                <LoadingSpinner />
              </div>
            ) : registrations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No registrations found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Attendee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Registered
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {registrations.map((reg) => (
                      <tr key={reg._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {reg.attendeeInfo.firstName} {reg.attendeeInfo.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{reg.attendeeInfo.email}</div>
                          <div className="text-sm text-gray-500">{reg.attendeeInfo.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={reg.attendeeType === 'member' ? 'success' : 'default'}>
                            {reg.attendeeType === 'member' ? 'Member' : 'Visitor'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={statusColors[reg.status]}>
                            {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
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
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Check In
                              </Button>
                            )}
                            {reg.status === 'pending' && (
                              <>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(reg._id, 'confirmed')}
                                >
                                  Confirm
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600"
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

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            {/* Sessions Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Event Sessions</h3>
                <p className="text-sm text-gray-500">Manage sessions and track attendance for this event</p>
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
              <Card className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Sessions Yet</h4>
                <p className="text-gray-500 mb-6">Create sessions to track attendance for multi-day or training events.</p>
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
          <div className="space-y-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <div className="space-y-6">
            {/* Accountability Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Participant Accountability</h3>
                <p className="text-sm text-gray-500">Track participant attendance, progress, and certification status</p>
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
    </Layout>
  )
}
