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
  Info
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
      const [timelineData] = await Promise.all([
        membersService.getMemberTimeline(memberId, { limit, offset: currentOffset })
      ])

      if (loadMore) {
        setActivities(prev => [...prev, ...timelineData.activities])
      } else {
        setActivities(timelineData.activities)
      }

      setHasMore(timelineData.activities.length === limit)
      setOffset(currentOffset + timelineData.activities.length)
    } catch (error: any) {
      console.error('Error loading timeline:', error)
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

  const getActivityIcon = (activityType: string) => {
    const iconMap: Record<string, JSX.Element> = {
      'MEMBER_REGISTRATION': <User className="h-4 w-4" />,
      'FIRST_TIME_VISITOR': <Heart className="h-4 w-4" />,
      'MEMBERSHIP_STATUS_CHANGE': <Users className="h-4 w-4" />,
      'UNIT_ASSIGNMENT': <MapPin className="h-4 w-4" />,
      'UNIT_TRANSFER': <MapPin className="h-4 w-4" />,
      'ROLE_PROMOTION': <ArrowUp className="h-4 w-4" />,
      'ROLE_CHANGE': <Users className="h-4 w-4" />,
      'ROLE_DEMOTION': <ArrowDown className="h-4 w-4" />,
      'LEADERSHIP_APPOINTMENT': <Crown className="h-4 w-4" />,
      'LEADERSHIP_PROMOTION': <Shield className="h-4 w-4" />,
      'TRAINING_ENROLLMENT': <GraduationCap className="h-4 w-4" />,
      'TRAINING_GRADUATION': <Award className="h-4 w-4" />,
      'DC_ENROLLMENT': <GraduationCap className="h-4 w-4" />,
      'LXL_ENROLLMENT': <GraduationCap className="h-4 w-4" />,
      'PASTORAL_TRAINING_START': <GraduationCap className="h-4 w-4" />,
      'INTERNSHIP_ASSIGNMENT': <Star className="h-4 w-4" />,
      'WATER_BAPTISM': <Heart className="h-4 w-4" />,
      'SPIRIT_BAPTISM': <Heart className="h-4 w-4" />,
      'BAPTISM': <Heart className="h-4 w-4" />,
      'SALVATION': <Heart className="h-4 w-4" />,
      'MARRIAGE': <Heart className="h-4 w-4" />,
      'CONFIRMATION': <CheckCircle className="h-4 w-4" />,
    }
    return iconMap[activityType] || <Info className="h-4 w-4" />
  }

  const getActivityColor = (activityType: string, priority: string) => {
    if (priority === 'CRITICAL') return 'text-red-600 bg-red-100'
    if (priority === 'HIGH') return 'text-orange-600 bg-orange-100'

    const colorMap: Record<string, string> = {
      'MEMBER_REGISTRATION': 'text-green-600 bg-green-100',
      'FIRST_TIME_VISITOR': 'text-blue-600 bg-blue-100',
      'ROLE_PROMOTION': 'text-green-600 bg-green-100',
      'LEADERSHIP_APPOINTMENT': 'text-purple-600 bg-purple-100',
      'TRAINING_GRADUATION': 'text-yellow-600 bg-yellow-100',
      'WATER_BAPTISM': 'text-blue-600 bg-blue-100',
      'SPIRIT_BAPTISM': 'text-indigo-600 bg-indigo-100',
      'SALVATION': 'text-red-600 bg-red-100',
    }
    return colorMap[activityType] || 'text-gray-600 bg-gray-100'
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      'CRITICAL': 'bg-red-100 text-red-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'LOW': 'bg-green-100 text-green-800',
    }
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'ACTIVE': return <Clock className="h-4 w-4 text-blue-500" />
      case 'PENDING': return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default: return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p>Error loading timeline: {error.message}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadTimeline()}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Timeline Statistics */}
      {statistics && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Timeline Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{statistics.totalActivities}</div>
              <div className="text-sm text-gray-600">Total Activities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{statistics.recentActivities}</div>
              <div className="text-sm text-gray-600">Recent (30d)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{statistics.milestones}</div>
              <div className="text-sm text-gray-600">Milestones</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{statistics.roleChanges}</div>
              <div className="text-sm text-gray-600">Role Changes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{statistics.trainings}</div>
              <div className="text-sm text-gray-600">Trainings</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Last Activity</div>
              <div className="text-sm font-medium">{formatDate(statistics.lastActivity)}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Timeline */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6">Activity Timeline</h3>

        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No timeline activities found for this member.
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {activities.map((activity, index) => (
                <motion.div
                  key={activity._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex gap-4"
                >
                  {/* Timeline line */}
                  {index < activities.length - 1 && (
                    <div className="absolute left-6 top-12 w-px h-full bg-gray-200"></div>
                  )}

                  {/* Activity icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getActivityColor(activity.activityType, activity.priority)}`}>
                    {getActivityIcon(activity.activityType)}
                  </div>

                  {/* Activity content */}
                  <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                          {getStatusIcon(activity.status)}
                          <Badge className={getPriorityBadge(activity.priority)} size="sm">
                            {activity.priority}
                          </Badge>
                        </div>

                        {activity.description && (
                          <p className="text-gray-700 mb-3">{activity.description}</p>
                        )}

                        {/* Activity details */}
                        <div className="space-y-2">
                          {/* Role changes */}
                          {activity.fromRole && activity.toRole && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-500">Role:</span>
                              <span className="text-red-600">{activity.fromRole}</span>
                              <ArrowUp className="h-3 w-3 text-gray-400" />
                              <span className="text-green-600">{activity.toRole}</span>
                            </div>
                          )}

                          {/* Unit transfers */}
                          {activity.fromUnit && activity.toUnit && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-500">Unit:</span>
                              <span className="text-red-600">{activity.fromUnit.name}</span>
                              <ArrowUp className="h-3 w-3 text-gray-400" />
                              <span className="text-green-600">{activity.toUnit.name}</span>
                            </div>
                          )}

                          {/* Training details */}
                          {activity.relatedCohort && (
                            <div className="flex items-center gap-2 text-sm">
                              <GraduationCap className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-500">Cohort:</span>
                              <span className="text-blue-600">{activity.relatedCohort.name}</span>
                            </div>
                          )}

                          {activity.certification && (
                            <div className="flex items-center gap-2 text-sm">
                              <Award className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-500">Certification:</span>
                              <span className="text-purple-600">{activity.certification}</span>
                            </div>
                          )}

                          {/* Location changes */}
                          {activity.previousLocation && activity.newLocation && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-500">Location:</span>
                              <span className="text-red-600">{activity.previousLocation}</span>
                              <ArrowUp className="h-3 w-3 text-gray-400" />
                              <span className="text-green-600">{activity.newLocation}</span>
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        {activity.tags && activity.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {activity.tags.map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="outline" size="sm">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Reason */}
                        {activity.reason && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                            <span className="font-medium text-gray-700">Reason: </span>
                            <span className="text-gray-600">{activity.reason}</span>
                          </div>
                        )}

                        {/* Notes */}
                        {activity.notes && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                            <span className="font-medium text-blue-700">Notes: </span>
                            <span className="text-blue-600">{activity.notes}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-right ml-4">
                        <div className="text-sm text-gray-500">{formatDate(activity.activityDate)}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          by {activity.initiatedBy.firstName} {activity.initiatedBy.lastName}
                        </div>
                        {activity.approvedBy && (
                          <div className="text-xs text-green-600 mt-1">
                            approved by {activity.approvedBy.firstName} {activity.approvedBy.lastName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => loadTimeline(true)}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Load More Activities'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}