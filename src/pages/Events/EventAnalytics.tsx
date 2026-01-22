import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  Users,
  TrendingUp,
  UserCheck,
  UserX,
  Clock,
  Target,
  Award,
  Filter,
  Building2,
  X,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { eventsService } from '@/services/events'
import { branchesService } from '@/services/branches'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { useAuth } from '@/contexts/AuthContext-unified'
import type { Branch } from '@/types/branch'
import type { EventsDashboardAnalytics, EventType } from '@/types/event'

export default function EventAnalytics() {
  const { selectedBranch } = useAuth()
  const [analytics, setAnalytics] = useState<EventsDashboardAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [branches, setBranches] = useState<Branch[]>([])
  const [showFilterModal, setShowFilterModal] = useState(false)

  // Filters
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState<EventType | ''>('')

  // Temp filters for modal
  const [tempDateFrom, setTempDateFrom] = useState('')
  const [tempDateTo, setTempDateTo] = useState('')
  const [tempEventType, setTempEventType] = useState<EventType | ''>('')

  useEffect(() => {
    loadBranches()
  }, [])

  useEffect(() => {
    loadAnalytics()
  }, [selectedBranch, dateFromFilter, dateToFilter, eventTypeFilter])

  const loadBranches = async () => {
    try {
      const response = await branchesService.getBranches({ limit: 100 })
      setBranches(response.items || [])
    } catch (error) {
      console.error('Error loading branches:', error)
    }
  }

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const data = await eventsService.getDashboardAnalytics({
        startDate: dateFromFilter || undefined,
        endDate: dateToFilter || undefined,
        eventType: eventTypeFilter || undefined,
      })
      setAnalytics(data)
    } catch (error) {
      console.error('Error loading event analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilter = () => {
    setDateFromFilter(tempDateFrom)
    setDateToFilter(tempDateTo)
    setEventTypeFilter(tempEventType)
    setShowFilterModal(false)
  }

  const handleClearFilter = () => {
    setDateFromFilter('')
    setDateToFilter('')
    setEventTypeFilter('')
    setTempDateFrom('')
    setTempDateTo('')
    setTempEventType('')
    setShowFilterModal(false)
  }

  const activeFilterCount = [dateFromFilter, dateToFilter, eventTypeFilter].filter(Boolean).length
  const hasActiveFilter = activeFilterCount > 0

  const formatDateRange = () => {
    if (dateFromFilter && dateToFilter) {
      return `${new Date(dateFromFilter).toLocaleDateString()} - ${new Date(dateToFilter).toLocaleDateString()}`
    }
    if (dateFromFilter) return `From ${new Date(dateFromFilter).toLocaleDateString()}`
    if (dateToFilter) return `Until ${new Date(dateToFilter).toLocaleDateString()}`
    return null
  }

  const eventTypeOptions: { value: EventType; label: string }[] = [
    { value: 'conference', label: 'Conference' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'retreat', label: 'Retreat' },
    { value: 'service', label: 'Service' },
    { value: 'outreach', label: 'Outreach' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'celebration', label: 'Celebration' },
    { value: 'training', label: 'Training' },
    { value: 'other', label: 'Other' },
  ]

  if (loading) {
    return (
      <Layout title="Event Analytics" subtitle="View event statistics and insights">
        <SkeletonTable />
      </Layout>
    )
  }

  const overview = analytics?.overview
  const trends = analytics?.attendanceTrends
  const engagement = analytics?.memberEngagement

  const overviewStats = [
    {
      title: 'Total Events',
      value: overview?.totalEvents || 0,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'All events in period',
    },
    {
      title: 'Total Registrations',
      value: overview?.totalRegistrations || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'All registrations',
    },
    {
      title: 'Attendance Rate',
      value: `${overview?.averageAttendanceRate || 0}%`,
      icon: UserCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Average attendance',
    },
    {
      title: 'Certifications',
      value: overview?.totalCertificationsIssued || 0,
      icon: Award,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      description: 'Certifications issued',
    },
  ]

  const eventBreakdown = [
    { label: 'Published', value: overview?.publishedEvents || 0, color: 'bg-green-500' },
    { label: 'Completed', value: overview?.completedEvents || 0, color: 'bg-blue-500' },
    { label: 'Upcoming', value: overview?.upcomingEvents || 0, color: 'bg-amber-500' },
    { label: 'Training', value: overview?.totalTrainingEvents || 0, color: 'bg-purple-500' },
  ]

  return (
    <Layout title="Event Analytics" subtitle="View event statistics and insights">
      <div className="space-y-6">
        {/* Filter Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {selectedBranch && (
              <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 border-primary-200">
                <Building2 className="h-3 w-3 text-primary-600" />
                <span className="text-primary-700">{selectedBranch.name}</span>
              </Badge>
            )}
            {formatDateRange() && (
              <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border-blue-200">
                <Calendar className="h-3 w-3 text-blue-600" />
                <span className="text-blue-700">{formatDateRange()}</span>
              </Badge>
            )}
            {eventTypeFilter && (
              <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border-purple-200">
                <Activity className="h-3 w-3 text-purple-600" />
                <span className="text-purple-700 capitalize">{eventTypeFilter}</span>
              </Badge>
            )}
            {hasActiveFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilter}
                className="text-gray-500 hover:text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTempDateFrom(dateFromFilter)
              setTempDateTo(dateToFilter)
              setTempEventType(eventTypeFilter)
              setShowFilterModal(true)
            }}
            className={hasActiveFilter ? 'border-primary-500 text-primary-600 bg-primary-50' : ''}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
            {hasActiveFilter && (
              <span className="ml-1.5 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {overviewStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </div>
                <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Event Breakdown & Attendance Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Event Status Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <PieChart className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-foreground">Event Breakdown</h3>
              </div>
              <div className="space-y-4">
                {eventBreakdown.map((item, index) => {
                  const total = overview?.totalEvents || 1
                  const percentage = Math.round((item.value / total) * 100) || 0
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                        <span className="text-sm font-bold text-gray-900">{item.value}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`${item.color} h-2 rounded-full transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </motion.div>

          {/* Attendance Trends Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-foreground">Attendance Trends</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-green-700">Peak Attendance</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-2">{trends?.peakAttendanceCount || 0}</p>
                  <p className="text-xs text-green-600 mt-1">{trends?.peakAttendanceDate || 'N/A'}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-medium text-amber-700">Lowest Attendance</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-900 mt-2">{trends?.lowestAttendanceCount || 0}</p>
                  <p className="text-xs text-amber-600 mt-1">{trends?.lowestAttendanceDate || 'N/A'}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">Average Rate</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-2">{trends?.averageAttendanceRate || 0}%</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {(trends?.growthRate || 0) >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-purple-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-xs font-medium text-purple-700">Growth Rate</span>
                  </div>
                  <p className={`text-2xl font-bold mt-2 ${(trends?.growthRate || 0) >= 0 ? 'text-purple-900' : 'text-red-900'}`}>
                    {trends?.growthRate || 0}%
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Member Engagement & Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Member Engagement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Users className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-foreground">Member Engagement</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{engagement?.totalUniqueAttendees || 0}</p>
                    <p className="text-xs text-gray-500">Unique Attendees</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-900">{engagement?.repeatAttendees || 0}</p>
                    <p className="text-xs text-green-600">Repeat Attendees</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-900">{engagement?.firstTimeAttendees || 0}</p>
                    <p className="text-xs text-blue-600">First Time</p>
                  </div>
                </div>

                {/* Top Attendees */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Top Attendees</h4>
                  <div className="space-y-2">
                    {engagement?.topAttendees?.slice(0, 5).map((attendee, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-600">
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{attendee.memberName}</span>
                        </div>
                        <Badge variant="outline">{attendee.eventsAttended} events</Badge>
                      </div>
                    )) || (
                      <p className="text-sm text-gray-500 text-center py-4">No data available</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Upcoming Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-foreground">Upcoming Events</h3>
              </div>
              <div className="space-y-3">
                {analytics?.upcomingEvents?.length ? (
                  analytics.upcomingEvents.map((event, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{event.title}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(event.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{event.registrationCount}</p>
                          <p className="text-xs text-gray-500">registered</p>
                        </div>
                      </div>
                      {event.capacity && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Capacity</span>
                            <span>{event.capacityPercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                (event.capacityPercentage || 0) >= 90 ? 'bg-red-500' :
                                (event.capacityPercentage || 0) >= 70 ? 'bg-amber-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(event.capacityPercentage || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No upcoming events</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Events by Month */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-foreground">Events by Month</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {analytics?.eventsByMonth?.length ? (
                analytics.eventsByMonth.map((month, index) => (
                  <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{month.total}</p>
                    <div className="flex justify-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        {month.completed}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs">
                        <X className="h-3 w-3 text-red-500" />
                        {month.cancelled}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No monthly data available</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Engagement by Event Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-foreground">Engagement by Event Type</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {engagement?.attendeesByEventType?.length ? (
                engagement.attendeesByEventType.map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 capitalize mb-2">{item.eventType}</p>
                    <p className="text-xl font-bold text-gray-900">{item.uniqueAttendees}</p>
                    <p className="text-xs text-gray-500">unique attendees</p>
                    <p className="text-sm text-gray-600 mt-1">{item.totalAttendances} total</p>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No engagement data available</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFilterModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Filter className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Filter Analytics</h3>
                      <p className="text-primary-100 text-sm">Refine your analytics view</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Event Type Filter */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Activity className="h-4 w-4 text-purple-600" />
                    Event Type
                  </label>
                  <select
                    value={tempEventType}
                    onChange={(e) => setTempEventType(e.target.value as EventType | '')}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  >
                    <option value="">All Types</option>
                    {eventTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">From</label>
                      <input
                        type="date"
                        value={tempDateFrom}
                        onChange={(e) => setTempDateFrom(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">To</label>
                      <input
                        type="date"
                        value={tempDateTo}
                        onChange={(e) => setTempDateTo(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Date Presets */}
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">Quick Select</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Last 30 days', days: 30 },
                      { label: 'Last 90 days', days: 90 },
                      { label: 'Last 6 months', days: 180 },
                      { label: 'Last year', days: 365 },
                    ].map((preset) => (
                      <button
                        key={preset.days}
                        onClick={() => {
                          const to = new Date()
                          const from = new Date()
                          from.setDate(from.getDate() - preset.days)
                          setTempDateFrom(from.toISOString().split('T')[0])
                          setTempDateTo(to.toISOString().split('T')[0])
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={handleClearFilter}
                  className="text-gray-600 hover:text-red-600"
                >
                  <X className="h-4 w-4 mr-1.5" />
                  Clear All
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilterModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleApplyFilter}>
                    <Filter className="h-4 w-4 mr-1.5" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </Layout>
  )
}
