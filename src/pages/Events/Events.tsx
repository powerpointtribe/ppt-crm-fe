import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Users,
  MapPin,
  Clock,
  Filter,
  Search,
  Copy,
  ExternalLink,
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { eventsService } from '@/services/events'
import { Event, EventSearchParams, EventStatus, EventType } from '@/types/event'
import { formatDate } from '@/utils/formatters'
import { showToast } from '@/utils/toast'
import { useAuth } from '@/contexts/AuthContext-unified'
import { useAppStore } from '@/store'

const eventTypeLabels: Record<EventType, string> = {
  conference: 'Conference',
  workshop: 'Workshop',
  seminar: 'Seminar',
  retreat: 'Retreat',
  service: 'Service',
  outreach: 'Outreach',
  meeting: 'Meeting',
  celebration: 'Celebration',
  training: 'Training',
  other: 'Other',
}

const statusColors: Record<EventStatus, 'default' | 'success' | 'warning' | 'danger'> = {
  draft: 'default',
  published: 'success',
  cancelled: 'danger',
  completed: 'warning',
}

export default function Events() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const { selectedBranch } = useAppStore()

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<EventStatus | ''>('')
  const [typeFilter, setTypeFilter] = useState<EventType | ''>('')
  const [searchParams, setSearchParams] = useState<EventSearchParams>({
    page: 1,
    limit: 10,
    sortBy: 'startDate',
    sortOrder: 'desc',
  })
  const [pagination, setPagination] = useState<any>(null)

  const canCreate = hasPermission('events:create')
  const canUpdate = hasPermission('events:update')
  const canDelete = hasPermission('events:delete')
  const canView = hasPermission('events:view-details')

  useEffect(() => {
    loadEvents()
  }, [searchParams, statusFilter, typeFilter, selectedBranch])

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params: EventSearchParams = {
        ...searchParams,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      }
      const response = await eventsService.getEvents(params)
      setEvents(response.items)
      setPagination(response.pagination)
    } catch (err: any) {
      console.error('Error loading events:', err)
      setError(err)
      showToast('error', 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [searchParams, searchTerm, statusFilter, typeFilter])

  const handleSearch = () => {
    setSearchParams((prev) => ({ ...prev, page: 1, search: searchTerm }))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event? This will also delete all registrations.')) {
      return
    }

    try {
      await eventsService.deleteEvent(id)
      showToast('success', 'Event deleted successfully')
      loadEvents()
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete event')
    }
  }

  const copyRegistrationLink = (slug: string) => {
    const link = `${window.location.origin}/event-registration/${slug}`
    navigator.clipboard.writeText(link)
    showToast('success', 'Registration link copied to clipboard')
  }

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => ({ ...prev, page: newPage }))
  }

  return (
    <Layout
      title="Events"
      headerActions={
        canCreate && (
          <Button onClick={() => navigate('/events/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        )
      }
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as EventStatus | '')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as EventType | '')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Types</option>
                  {Object.entries(eventTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <Button variant="secondary" onClick={handleSearch}>
                  <Filter className="h-4 w-4 mr-2" />
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Events List */}
        <Card>
          {loading ? (
            <SkeletonTable rows={5} columns={6} />
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-500">{error.message || 'Failed to load events'}</p>
              <Button className="mt-4" onClick={loadEvents}>
                Retry
              </Button>
            </div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first event.</p>
              {canCreate && (
                <Button onClick={() => navigate('/events/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registrations
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {events.map((event) => (
                      <tr key={event._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {event.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {eventTypeLabels[event.type]}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <Calendar className="inline h-4 w-4 mr-1 text-gray-400" />
                            {formatDate(event.startDate)}
                            {event.endDate !== event.startDate && (
                              <> - {formatDate(event.endDate)}</>
                            )}
                          </div>
                          {event.startTime && (
                            <div className="text-sm text-gray-500">
                              <Clock className="inline h-4 w-4 mr-1 text-gray-400" />
                              {event.startTime}
                              {event.endTime && <> - {event.endTime}</>}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <MapPin className="inline h-4 w-4 mr-1 text-gray-400" />
                            {event.location.isVirtual ? 'Virtual' : event.location.name}
                          </div>
                          {event.location.city && (
                            <div className="text-sm text-gray-500">
                              {event.location.city}, {event.location.state}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={statusColors[event.status]}>
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <Users className="inline h-4 w-4 mr-1 text-gray-400" />
                            {event.registrationCount || 0} registered
                          </div>
                          <div className="text-sm text-gray-500">
                            {event.confirmedCount || 0} confirmed
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {event.registrationSlug && event.status === 'published' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyRegistrationLink(event.registrationSlug!)}
                                title="Copy registration link"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}
                            {canView && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/events/${event._id}`)}
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {canUpdate && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/events/${event._id}/edit`)}
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(event._id)}
                                title="Delete"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} events
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!pagination.hasPrev}
                        onClick={() => handlePageChange(pagination.page - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="secondary"
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
            </>
          )}
        </Card>
      </div>
    </Layout>
  )
}
