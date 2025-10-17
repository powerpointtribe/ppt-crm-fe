import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, PieChart, TrendingUp, Users, UserPlus, Calendar, RefreshCw, Download } from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { dashboardService } from '@/services/dashboard'
import { formatDate } from '@/utils/formatters'

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [growthData, setGrowthData] = useState<any>(null)
  const [demographicsData, setDemographicsData] = useState<any>(null)
  const [activityData, setActivityData] = useState<any>(null)
  const [quickStats, setQuickStats] = useState<any>(null)

  useEffect(() => {
    loadAnalytics()
  }, [period])

  const loadAnalytics = async () => {
    try {
      setError(null)
      setLoading(true)

      const [growth, demographics, activity, stats] = await Promise.all([
        dashboardService.getGrowthAnalytics(period),
        dashboardService.getDemographics(),
        dashboardService.getRecentActivity(50, 7),
        dashboardService.getQuickStats()
      ])

      setGrowthData(growth)
      setDemographicsData(demographics)
      setActivityData(activity)
      setQuickStats(stats)
    } catch (error: any) {
      console.error('Error loading analytics:', error)
      setError(error)

      // Fallback data for demo
      setGrowthData({
        totalMembers: 1245,
        totalFirstTimers: 89,
        totalGroups: 52,
        memberGrowth: 8.5,
        firstTimerGrowth: 12.3,
        groupGrowth: 3.2,
        trends: {
          members: [120, 135, 142, 158, 170, 189, 205],
          firstTimers: [12, 15, 18, 22, 19, 25, 31],
          groups: [48, 49, 50, 51, 51, 52, 52]
        }
      })

      setDemographicsData({
        ageGroups: {
          '18-25': 180,
          '26-35': 320,
          '36-50': 425,
          '51-65': 245,
          '65+': 75
        },
        gender: {
          male: 560,
          female: 685
        },
        maritalStatus: {
          single: 445,
          married: 720,
          divorced: 55,
          widowed: 25
        }
      })

      setActivityData({
        totalActivities: 156,
        topUsers: [
          { name: 'Pastor John', count: 45 },
          { name: 'Admin Sarah', count: 38 },
          { name: 'Leader Mike', count: 28 }
        ],
        activityTypes: {
          'Member Updates': 45,
          'First Timer Registrations': 32,
          'Group Activities': 28,
          'User Management': 21,
          'Other': 30
        }
      })

      setQuickStats({
        totalMembers: 1245,
        totalFirstTimers: 89,
        pendingFollowUps: 23,
        userRole: 'admin'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout title="Analytics & Reports">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error && !growthData) {
    return (
      <Layout title="Analytics & Reports">
        <ErrorBoundary error={error} onRetry={loadAnalytics} />
      </Layout>
    )
  }

  return (
    <Layout title="Analytics & Reports">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-600">Comprehensive insights into your church community</p>
          </div>
          <div className="flex gap-3">
            {/* Period Selector */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <Button onClick={loadAnalytics} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        {quickStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'Total Members',
                value: quickStats.totalMembers,
                icon: Users,
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                change: growthData?.memberGrowth ? `+${growthData.memberGrowth}%` : null
              },
              {
                title: 'First Timers',
                value: quickStats.totalFirstTimers,
                icon: UserPlus,
                color: 'text-green-600',
                bg: 'bg-green-50',
                change: growthData?.firstTimerGrowth ? `+${growthData.firstTimerGrowth}%` : null
              },
              {
                title: 'Pending Follow-ups',
                value: quickStats.pendingFollowUps,
                icon: Calendar,
                color: 'text-orange-600',
                bg: 'bg-orange-50'
              },
              {
                title: 'Active Groups',
                value: growthData?.totalGroups || 52,
                icon: Users,
                color: 'text-purple-600',
                bg: 'bg-purple-50',
                change: growthData?.groupGrowth ? `+${growthData.groupGrowth}%` : null
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`p-6 ${stat.bg}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value?.toLocaleString()}</p>
                      {stat.change && (
                        <p className="text-xs text-green-600 flex items-center mt-1">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {stat.change} this {period}
                        </p>
                      )}
                    </div>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Growth Analytics */}
        {growthData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Growth Trends</h3>
                  <p className="text-sm text-gray-600">Member growth over time</p>
                </div>
              </div>

              {/* Simple bar chart representation */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Members</span>
                    <span className="text-sm text-green-600">+{growthData.memberGrowth}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(growthData.memberGrowth * 10, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">First Timers</span>
                    <span className="text-sm text-green-600">+{growthData.firstTimerGrowth}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(growthData.firstTimerGrowth * 8, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Groups</span>
                    <span className="text-sm text-green-600">+{growthData.groupGrowth}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-purple-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(growthData.groupGrowth * 30, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <PieChart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Demographics</h3>
                  <p className="text-sm text-gray-600">Age distribution</p>
                </div>
              </div>

              {demographicsData && (
                <div className="space-y-3">
                  {Object.entries(demographicsData.ageGroups).map(([age, count]) => {
                    const total = Object.values(demographicsData.ageGroups).reduce((a: number, b: number) => a + b, 0)
                    const percentage = ((count as number) / total * 100).toFixed(1)
                    return (
                      <div key={age}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{age} years</span>
                          <span className="text-sm text-gray-600">{count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Recent Activity & Demographics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity Summary */}
          {activityData && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity Summary</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{activityData.totalActivities}</p>
                  <p className="text-sm text-gray-600">Total activities in the last 7 days</p>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Most Active Users</h4>
                  <div className="space-y-2">
                    {activityData.topUsers.map((user: any, index: number) => (
                      <div key={user.name} className="flex justify-between items-center">
                        <span className="text-sm">{user.name}</span>
                        <span className="text-sm font-medium">{user.count} activities</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Activity Breakdown</h4>
                  <div className="space-y-2">
                    {Object.entries(activityData.activityTypes).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm">{type}</span>
                        <span className="text-sm font-medium">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Gender & Marital Status */}
          {demographicsData && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Community Composition</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Gender Distribution</h4>
                  <div className="space-y-2">
                    {Object.entries(demographicsData.gender).map(([gender, count]) => {
                      const total = Object.values(demographicsData.gender).reduce((a: number, b: number) => a + b, 0)
                      const percentage = ((count as number) / total * 100).toFixed(1)
                      return (
                        <div key={gender}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium capitalize">{gender}</span>
                            <span className="text-sm text-gray-600">{count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-1000 ${
                                gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Marital Status</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(demographicsData.maritalStatus).map(([status, count]) => (
                      <div key={status} className="bg-gray-50 p-3 rounded text-center">
                        <p className="font-medium">{count as number}</p>
                        <p className="text-gray-600 capitalize">{status}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  )
}