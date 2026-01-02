import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  User,
  Users,
  MapPin,
  GraduationCap,
  Crown,
  Shield,
  Star,
  Heart,
  Award,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronDown
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Button from '@/components/ui/Button'
import { membersService } from '@/services/members'
import { formatDate } from '@/utils/formatters'

interface TimelineActivity {
  _id: string
  activityType: string
  title: string
  description?: string
  activityDate: string
  effectiveDate?: string
  status: string
  priority: string
  fromRole?: string
  toRole?: string
  previousPosition?: string
  newPosition?: string
  fromUnit?: { _id: string; name: string }
  toUnit?: { _id: string; name: string }
  fromDistrict?: { _id: string; name: string }
  toDistrict?: { _id: string; name: string }
  travelStatus?: string
  previousLocation?: string
  newLocation?: string
  relatedCohort?: { _id: string; name: string }
  trainingOutcome?: string
  certification?: string
  initiatedBy: { _id: string; firstName: string; lastName: string }
  approvedBy?: { _id: string; firstName: string; lastName: string }
  reason: string
  notes?: string
  tags?: string[]
}

interface TimelineStatistics {
  totalActivities: number
  recentActivities: number
  milestones: number
  roleChanges: number
  trainings: number
  lastActivity: string
}

interface MemberTimelineProps {
  memberId: string
}

export default function MemberTimeline({ memberId }: MemberTimelineProps) {
  const [activities, setActivities] = useState<TimelineActivity[]>([])
  const [statistics, setStatistics] = useState<TimelineStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const limit = 10

  useEffect(() => {
    loadTimeline()
    loadStatistics()
  }, [memberId])

  const loadTimeline = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
        setActivities([])
        setOffset(0)
      }

      const currentOffset = loadMore ? offset : 0
      const timelineData = await membersService.getMemberTimeline(memberId, { limit, offset: currentOffset })

      if (loadMore) {
        setActivities(prev => [...prev, ...timelineData.activities])
      } else {
        setActivities(timelineData.activities)
      }

      setHasMore(timelineData.activities.length === limit)
      setOffset(currentOffset + timelineData.activities.length)
    } catch (error: any) {
      console.error('[MemberTimeline] Error loading timeline:', error)
      setError(error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const stats = await membersService.getMemberTimelineStatistics(memberId)
      setStatistics(stats)
    } catch (error: any) {
      console.error('Error loading timeline statistics:', error)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const getActivityIcon = (activityType: string) => {
    const iconMap: Record<string, JSX.Element> = {
      'MEMBER_REGISTRATION': <User className="h-3 w-3" />,
      'FIRST_TIME_VISITOR': <Heart className="h-3 w-3" />,
      'MEMBERSHIP_STATUS_CHANGE': <Users className="h-3 w-3" />,
      'UNIT_ASSIGNMENT': <MapPin className="h-3 w-3" />,
      'UNIT_TRANSFER': <MapPin className="h-3 w-3" />,
      'ROLE_PROMOTION': <ArrowUp className="h-3 w-3" />,
      'ROLE_CHANGE': <Users className="h-3 w-3" />,
      'ROLE_DEMOTION': <ArrowDown className="h-3 w-3" />,
      'LEADERSHIP_APPOINTMENT': <Crown className="h-3 w-3" />,
      'LEADERSHIP_PROMOTION': <Shield className="h-3 w-3" />,
      'TRAINING_ENROLLMENT': <GraduationCap className="h-3 w-3" />,
      'TRAINING_GRADUATION': <Award className="h-3 w-3" />,
      'DC_ENROLLMENT': <GraduationCap className="h-3 w-3" />,
      'LXL_ENROLLMENT': <GraduationCap className="h-3 w-3" />,
      'PASTORAL_TRAINING_START': <GraduationCap className="h-3 w-3" />,
      'INTERNSHIP_ASSIGNMENT': <Star className="h-3 w-3" />,
      'WATER_BAPTISM': <Heart className="h-3 w-3" />,
      'SPIRIT_BAPTISM': <Heart className="h-3 w-3" />,
      'BAPTISM': <Heart className="h-3 w-3" />,
      'SALVATION': <Heart className="h-3 w-3" />,
      'MARRIAGE': <Heart className="h-3 w-3" />,
      'CONFIRMATION': <CheckCircle className="h-3 w-3" />,
    }
    return iconMap[activityType] || <Info className="h-3 w-3" />
  }

  const getActivityColor = (activityType: string, priority: string) => {
    if (priority === 'CRITICAL') return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400'
    if (priority === 'HIGH') return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400'

    const colorMap: Record<string, string> = {
      'MEMBER_REGISTRATION': 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
      'FIRST_TIME_VISITOR': 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
      'ROLE_PROMOTION': 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
      'LEADERSHIP_APPOINTMENT': 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
      'TRAINING_GRADUATION': 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
      'WATER_BAPTISM': 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
      'SPIRIT_BAPTISM': 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400',
      'SALVATION': 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
    }
    return colorMap[activityType] || 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400'
  }

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-500'
      case 'ACTIVE': return 'bg-blue-500'
      case 'PENDING': return 'bg-yellow-500'
      default: return 'bg-gray-400'
    }
  }

  const hasDetails = (activity: TimelineActivity) => {
    return (
      (activity.fromRole && activity.toRole) ||
      (activity.fromUnit && activity.toUnit) ||
      activity.relatedCohort ||
      activity.certification ||
      (activity.previousLocation && activity.newLocation) ||
      activity.reason ||
      activity.notes ||
      (activity.tags && activity.tags.length > 0)
    )
  }

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner size="md" />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-4">
        <div className="text-center text-red-600 dark:text-red-400">
          <p className="text-sm">Error loading timeline: {error.message}</p>
          <Button variant="outline" size="sm" onClick={() => loadTimeline()} className="mt-2">
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {/* Compact Statistics */}
      {statistics && (
        <Card className="p-3">
          <div className="flex flex-wrap gap-4 text-center">
            <div className="flex-1 min-w-[60px]">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{statistics.totalActivities}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
            </div>
            <div className="flex-1 min-w-[60px]">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">{statistics.recentActivities}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Recent</div>
            </div>
            <div className="flex-1 min-w-[60px]">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{statistics.milestones}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Milestones</div>
            </div>
            <div className="flex-1 min-w-[60px]">
              <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{statistics.roleChanges}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Roles</div>
            </div>
            <div className="flex-1 min-w-[60px]">
              <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{statistics.trainings}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Training</div>
            </div>
          </div>
        </Card>
      )}

      {/* Compact Timeline */}
      <Card className="p-3">
        <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">Activity Timeline</h3>

        {activities.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">No activities found.</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Activities will appear here when changes are made.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence>
              {activities.map((activity, index) => {
                const isExpanded = expandedItems.has(activity._id)
                const showExpandButton = hasDetails(activity)

                return (
                  <motion.div
                    key={activity._id}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="relative"
                  >
                    {/* Timeline connector */}
                    {index < activities.length - 1 && (
                      <div className="absolute left-[11px] top-6 w-px h-full bg-gray-200 dark:bg-gray-700" />
                    )}

                    <div className="flex gap-2">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${getActivityColor(activity.activityType, activity.priority)}`}>
                        {getActivityIcon(activity.activityType)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(activity.status)}`} />
                              <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                {activity.title}
                              </span>
                              {showExpandButton && (
                                <button
                                  onClick={() => toggleExpand(activity._id)}
                                  className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                >
                                  <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                              )}
                            </div>
                            {activity.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                                {activity.description}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">
                              {formatDate(activity.effectiveDate || activity.activityDate)}
                            </div>
                            {activity.initiatedBy && (
                              <div className="text-[10px] text-gray-400 dark:text-gray-500">
                                {activity.initiatedBy.firstName} {activity.initiatedBy.lastName?.[0]}.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expandable details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2 pl-2 border-l-2 border-gray-200 dark:border-gray-700 space-y-1 text-xs">
                                {activity.fromRole && activity.toRole && (
                                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                                    <span className="text-gray-400">Role:</span>
                                    <span className="text-red-500">{activity.fromRole}</span>
                                    <ArrowUp className="h-2.5 w-2.5" />
                                    <span className="text-green-500">{activity.toRole}</span>
                                  </div>
                                )}
                                {activity.fromUnit && activity.toUnit && (
                                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                                    <span className="text-gray-400">Unit:</span>
                                    <span className="text-red-500">{activity.fromUnit.name}</span>
                                    <ArrowUp className="h-2.5 w-2.5" />
                                    <span className="text-green-500">{activity.toUnit.name}</span>
                                  </div>
                                )}
                                {activity.relatedCohort && (
                                  <div className="text-gray-600 dark:text-gray-300">
                                    <span className="text-gray-400">Cohort:</span> {activity.relatedCohort.name}
                                  </div>
                                )}
                                {activity.certification && (
                                  <div className="text-gray-600 dark:text-gray-300">
                                    <span className="text-gray-400">Cert:</span> {activity.certification}
                                  </div>
                                )}
                                {activity.reason && (
                                  <div className="text-gray-600 dark:text-gray-300">
                                    <span className="text-gray-400">Reason:</span> {activity.reason}
                                  </div>
                                )}
                                {activity.notes && (
                                  <div className="text-gray-600 dark:text-gray-300">
                                    <span className="text-gray-400">Notes:</span> {activity.notes}
                                  </div>
                                )}
                                {activity.tags && activity.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {activity.tags.map((tag, i) => (
                                      <span key={i} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-[10px]">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Load More */}
            {hasMore && (
              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadTimeline(true)}
                  disabled={loadingMore}
                  className="text-xs"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
