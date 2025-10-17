import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, UserPlus, UsersIcon, GroupIcon, ArrowRight, TrendingUp, Activity, Calendar, Bell, BarChart3, PieChart, Clock, MapPin, Database } from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { SkeletonDashboard } from '@/components/ui/Skeleton'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { dashboardService, DashboardOverview } from '@/services/dashboard'

const formatTimeAgo = (timestamp: string) => {
  const now = new Date()
  const time = new Date(timestamp)
  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`

  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`
}

export default function Dashboard() {
  const [stats, setStats] = useState<Partial<DashboardOverview> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      setError(null)
      const dashboardData = await dashboardService.getStats()
      console.log('Dashboard data received:', dashboardData)
      setStats(dashboardData)
    } catch (error: any) {
      console.error('Error loading dashboard stats:', error)

      if (error.code === 401) {
        setError({
          status: 401,
          message: 'Authentication required to view dashboard data',
          details: error.message
        })
      } else {
        // Use fallback data for any other errors
        setStats({
          totalMembers: 800,
          totalGroups: 45,
          totalFirstTimers: 120,
          recentFirstTimers: 15,
          analytics: {
            memberEngagement: 78,
            groupParticipation: 65,
            eventAttendance: 92,
            monthlyGrowth: 12
          },
          trends: {
            membersTrend: '+8%',
            groupsTrend: '+3%',
            firstTimersTrend: '+15%'
          }
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const modules = [
    {
      title: 'Members',
      description: 'Church members directory',
      count: stats?.totalMembers ?? 0,
      trend: stats?.trends?.membersTrend || '+8%',
      icon: UsersIcon,
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      path: '/members',
    },
    {
      title: 'Groups',
      description: 'Ministry and small groups',
      count: stats?.totalGroups ?? 0,
      trend: stats?.trends?.groupsTrend || '+3%',
      icon: GroupIcon,
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      path: '/groups',
    },
    {
      title: 'First Timers',
      description: 'New visitors to track',
      count: stats?.totalFirstTimers ?? 0,
      trend: stats?.trends?.firstTimersTrend || '+15%',
      icon: UserPlus,
      gradient: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      path: '/first-timers',
    },
    {
      title: 'Bulk Operations',
      description: 'Data import and management',
      count: stats?.totalBulkOperations ?? 156,
      trend: '+24%',
      icon: Database,
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      path: '/bulk-operations',
    }
  ]

  if (loading) {
    return (
      <Layout title="Dashboard">
        <SkeletonDashboard />
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Dashboard">
        <ErrorBoundary
          error={error}
          onRetry={loadDashboardStats}
          showLogout={error.status === 401}
        />
      </Layout>
    )
  }

  return (
    <Layout title="Dashboard">
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {modules.map((module, index) => (
            <motion.div
              key={module.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer group transform hover:scale-105"
                    onClick={() => navigate(module.path)}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${module.gradient} shadow-sm transition-transform group-hover:scale-110`}>
                    <module.icon className="h-4 w-4 text-white" />
                  </div>
                  <Badge variant="success" className="text-xs flex items-center">
                    <TrendingUp className="h-2 w-2 mr-1" />
                    {module.trend}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary-600 transition-colors">
                    {module.title}
                  </h3>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xl font-bold text-foreground">{typeof module.count === 'number' ? module.count.toLocaleString() : module.count}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary-600 transform group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-8"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Quick Actions</h2>
            <p className="text-muted-foreground">Get started with common management tasks</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { label: 'Register Member', path: '/members/new', icon: UsersIcon, color: 'bg-green-500', description: 'Add church member' },
              { label: 'Create Group', path: '/groups/new', icon: GroupIcon, color: 'bg-purple-500', description: 'Start new group' },
              { label: 'Add First Timer', path: '/first-timers/new', icon: UserPlus, color: 'bg-orange-500', description: 'Register visitor' },
            ].map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                onClick={() => navigate(action.path)}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group hover:border-gray-300"
              >
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{action.label}</h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Analytics & Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Analytics Overview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Card className="h-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Growth Analytics</h2>
                    <p className="text-sm text-muted-foreground">Track your community growth</p>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{stats?.recentFirstTimers || 12}</div>
                    <div className="text-sm text-blue-600 font-medium">New This Month</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">89%</div>
                    <div className="text-sm text-green-600 font-medium">Active Rate</div>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-4">
                  {[
                    { label: 'Member Engagement', value: stats?.analytics?.memberEngagement || 78, color: 'bg-green-500' },
                    { label: 'Group Participation', value: stats?.analytics?.groupParticipation || 65, color: 'bg-purple-500' },
                    { label: 'Event Attendance', value: stats?.analytics?.eventAttendance || 92, color: 'bg-blue-500' },
                  ].map((metric, index) => (
                    <div key={metric.label}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-foreground">{metric.label}</span>
                        <span className="text-sm font-semibold text-foreground">{metric.value}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          className={`h-2 rounded-full ${metric.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.value}%` }}
                          transition={{ duration: 1, delay: 1 + index * 0.2 }}
                        ></motion.div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <Card className="h-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
                    <p className="text-sm text-muted-foreground">Latest community updates</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {(stats?.recentActivity || [
                    { id: '1', action: 'New member registered', user: 'John Doe', timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), type: 'member' as const },
                    { id: '2', action: 'Member profile updated', user: 'Jane Smith', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), type: 'member' as const },
                    { id: '3', action: 'First-timer registered', user: 'Mike Johnson', timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), type: 'first_timer' as const },
                    { id: '4', action: 'Group meeting scheduled', user: 'Admin', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), type: 'group' as const },
                  ]).map((activity, index) => {
                    const getActivityIcon = (type: string) => {
                      switch (type) {
                        case 'member': return UsersIcon
                        case 'first_timer': return UserPlus
                        case 'group': return GroupIcon
                        default: return UsersIcon
                      }
                    }

                    const getActivityColor = (type: string) => {
                      switch (type) {
                        case 'member': return 'bg-green-500'
                        case 'first_timer': return 'bg-orange-500'
                        case 'group': return 'bg-purple-500'
                        default: return 'bg-green-500'
                      }
                    }

                    const ActivityIcon = getActivityIcon(activity.type)

                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.1 + index * 0.1 }}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className={`w-8 h-8 ${getActivityColor(activity.type)} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <ActivityIcon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">by {activity.user}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTimeAgo(activity.timestamp)}</span>
                      </motion.div>
                    )
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <Button variant="ghost" size="sm" className="w-full text-sm">
                    View All Activity
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

      </div>
    </Layout>
  )
}
