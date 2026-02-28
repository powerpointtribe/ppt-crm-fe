import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
  X,
  Download,
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { SkeletonTable } from '@/components/ui/Skeleton'
import PageToolbar, { SearchResult } from '@/components/ui/PageToolbar'
import FilterModal from '@/components/ui/FilterModal'
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
  const [searchParams, setSearchParams] = useState<EventSearchParams>({
    page: 1,
    limit: 12,
    sortBy: 'startDate',
    sortOrder: 'desc',
  })
  const [pagination, setPagination] = useState<any>(null)

  // Filter Modal State
  const [showFilterModal, setShowFilterModal] = useState(false)

  // Applied Filters
  const [statusFilter, setStatusFilter] = useState<EventStatus | ''>('')
  const [typeFilter, setTypeFilter] = useState<EventType | ''>('')

  // Temporary Filters (for modal)
  const [tempStatusFilter, setTempStatusFilter] = useState<EventStatus | ''>('')
  const [tempTypeFilter, setTempTypeFilter] = useState<EventType | ''>('')

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

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    loadEvents()
  }

  // Fetch search results for autocomplete
  const fetchSearchResults = useCallback(async (query: string): Promise<SearchResult[]> => {
    try {
      const response = await eventsService.getEvents({ search: query, limit: 5 })
      return (response.items || []).map((event) => ({
        id: event._id,
        title: event.title,
        subtitle: formatDate(event.startDate),
        type: 'Event',
        path: `/events/${event._id}`,
        icon: <Calendar className="h-4 w-4 text-primary-600" />
      }))
    } catch (error) {
      console.error('Error fetching search results:', error)
      return []
    }
  }, [])

  const handleSelectSearchResult = useCallback((result: SearchResult) => {
    navigate(result.path || `/events/${result.id}`)
  }, [navigate])

  // Filter Modal Handlers
  const openFilterModal = () => {
    setTempStatusFilter(statusFilter)
    setTempTypeFilter(typeFilter)
    setShowFilterModal(true)
  }

  const closeFilterModal = () => {
    setShowFilterModal(false)
  }

  const applyFilters = () => {
    setStatusFilter(tempStatusFilter)
    setTypeFilter(tempTypeFilter)
    setShowFilterModal(false)
  }

  const clearAllFilters = () => {
    setTempStatusFilter('')
    setTempTypeFilter('')
  }

  const clearAppliedFilters = () => {
    setStatusFilter('')
    setTypeFilter('')
  }

  const hasActiveFilters = !!(statusFilter || typeFilter)
  const activeFilterCount = [statusFilter, typeFilter].filter(Boolean).length

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

  if (loading) {
    return (
      <Layout title="Events" subtitle="Manage church events and registrations">
        <SkeletonTable />
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Events" subtitle="Manage church events and registrations">
        <Card className="p-8 text-center">
          <p className="text-red-500 mb-4">{error.message || 'Failed to load events'}</p>
          <Button onClick={loadEvents}>Retry</Button>
        </Card>
      </Layout>
    )
  }

  return (
    <Layout title="Events" subtitle="Manage church events and registrations">
      <div className="space-y-6 max-w-full overflow-hidden">
        {/* Page Toolbar with Search and Actions */}
        <PageToolbar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchSubmit={handleSearch}
          searchPlaceholder="Search events by title, location, or type..."
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
              {canCreate && (
                <Button size="sm" onClick={() => navigate('/events/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Event
                </Button>
              )}
            </>
          }
        />

        {/* Events Grid - Mobile & Desktop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full overflow-hidden"
        >
          {events.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No events found</h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters
                  ? 'No events match your current filters. Try adjusting your search criteria.'
                  : 'Get started by creating your first event.'
                }
              </p>
              {canCreate && !hasActiveFilters && (
                <Button onClick={() => navigate('/events/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {events.map((event, index) => (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => canView && navigate(`/events/${event._id}`)}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:border-primary-200 transition-all duration-300 cursor-pointer group"
                >
                  {/* Event Header with Image or Gradient */}
                  <div className="relative h-44 sm:h-52 bg-gradient-to-br from-primary-500 to-primary-700 overflow-hidden">
                    {event.bannerImage ? (
                      <img
                        src={event.bannerImage}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Calendar className="h-20 w-20 sm:h-24 sm:w-24 text-white opacity-20" />
                      </div>
                    )}

                    {/* Enhanced Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge variant={statusColors[event.status]} className="shadow-lg backdrop-blur-sm bg-white/95">
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </Badge>
                    </div>

                    {/* Global Badge */}
                    {event.isGlobal && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/95 text-gray-800 shadow-lg border-0 backdrop-blur-sm">
                          <span className="mr-1">🌍</span> Global Event
                        </Badge>
                      </div>
                    )}

                    {/* Capacity Indicator */}
                    {event.registrationSettings?.maxAttendees && (
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span className="font-semibold text-gray-700">
                              {event.registrationCount || 0} / {event.registrationSettings.maxAttendees}
                            </span>
                            <span className="text-gray-500 font-medium">
                              {Math.round(((event.registrationCount || 0) / event.registrationSettings.maxAttendees) * 100)}% Full
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-gradient-to-r from-primary-500 to-primary-600 h-1.5 rounded-full transition-all"
                              style={{
                                width: `${Math.min(((event.registrationCount || 0) / event.registrationSettings.maxAttendees) * 100, 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Event Content */}
                  <div className="p-5 space-y-4">
                    {/* Title & Type */}
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-primary-600 transition-colors leading-tight">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs font-medium bg-gray-100 text-gray-700 border-0">
                          {eventTypeLabels[event.type]}
                        </Badge>
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="space-y-2.5">
                      {/* Date */}
                      <div className="flex items-center text-sm text-gray-700">
                        <div className="flex-shrink-0 h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center mr-2.5">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="font-medium">
                          {formatDate(event.startDate)}
                          {event.endDate !== event.startDate && (
                            <span className="text-gray-500"> - {formatDate(event.endDate)}</span>
                          )}
                        </span>
                      </div>

                      {/* Time */}
                      {event.startTime && (
                        <div className="flex items-center text-sm text-gray-700">
                          <div className="flex-shrink-0 h-8 w-8 bg-green-50 rounded-lg flex items-center justify-center mr-2.5">
                            <Clock className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="font-medium">
                            {event.startTime}
                            {event.endTime && <span className="text-gray-500"> - {event.endTime}</span>}
                          </span>
                        </div>
                      )}

                      {/* Location */}
                      <div className="flex items-center text-sm text-gray-700">
                        <div className="flex-shrink-0 h-8 w-8 bg-purple-50 rounded-lg flex items-center justify-center mr-2.5">
                          <MapPin className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="line-clamp-1 font-medium">
                          {event.location.isVirtual ? (
                            <span className="text-primary-600">Virtual Event</span>
                          ) : (
                            <>
                              {event.location.name}
                              {event.location.city && (
                                <span className="text-gray-500 font-normal">
                                  , {event.location.city}
                                </span>
                              )}
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-base font-bold text-green-600">{event.confirmedCount || 0}</div>
                          <div className="text-xs text-gray-500 font-medium">Confirmed</div>
                        </div>
                        <div className="h-8 w-px bg-gray-200"></div>
                        <div className="text-center">
                          <div className="text-base font-bold text-blue-600">{event.attendedCount || 0}</div>
                          <div className="text-xs text-gray-500 font-medium">Attended</div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {event.registrationSlug && event.status === 'published' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyRegistrationLink(event.registrationSlug!)}
                            className="h-9 w-9 p-0 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                            title="Copy registration link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/events/${event._id}/edit`)
                            }}
                            className="h-9 w-9 p-0 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                            title="Edit event"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

          )}
        </motion.div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs sm:text-sm text-muted-foreground">
                Showing{' '}
                <span className="font-medium text-foreground">
                  {((pagination.page - 1) * pagination.limit) + 1}
                </span>
                {' '}-{' '}
                <span className="font-medium text-foreground">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>
                {' '}of{' '}
                <span className="font-medium text-foreground">{pagination.total}</span>
                {' '}events
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrev}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className="min-w-[80px]"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext}
                  onClick={() => handlePageChange(pagination.page + 1)}
                  className="min-w-[80px]"
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Filter Modal */}
        <FilterModal
          isOpen={showFilterModal}
          onClose={closeFilterModal}
          onApply={applyFilters}
          onReset={clearAllFilters}
          title="Filter Events"
          subtitle="Refine your event search"
          activeFilterCount={activeFilterCount}
          filters={[
            {
              id: 'status',
              label: 'Status',
              value: tempStatusFilter,
              onChange: (value) => setTempStatusFilter(value as EventStatus | ''),
              placeholder: 'All Statuses',
              options: [
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'completed', label: 'Completed' },
              ],
            },
            {
              id: 'type',
              label: 'Event Type',
              value: tempTypeFilter,
              onChange: (value) => setTempTypeFilter(value as EventType | ''),
              placeholder: 'All Types',
              options: Object.entries(eventTypeLabels).map(([value, label]) => ({
                value,
                label,
              })),
            },
          ]}
        />
      </div>
    </Layout>
  )
}
