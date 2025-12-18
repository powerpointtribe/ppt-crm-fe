import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { showToast } from '@/utils/toast'
import { firstTimersService } from '@/services/first-timers'
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Users,
  Clock,
  CheckCircle,
  PhoneCall,
  Calendar,
  Filter,
  Download,
  Search,
  Eye,
  UserCheck,
  Target,
  Award,
} from 'lucide-react'
import { formatDate, formatNumber } from '@/utils/formatters'

interface GlobalAnalytics {
  totalReports: number
  totalFirstTimers: number
  avgReportsPerFirstTimer: number
  completionRate: number
  statusDistribution: Record<string, number>
  contactMethodDistribution: Record<string, number>
  overdueFirstTimers: number
  monthlyTrends: Array<{
    month: string
    reportsCreated: number
    firstTimersWithReports: number
  }>
}

interface TeamMember {
  callMadeBy: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  totalReports: number
  avgReportsPerFirstTimer: number
  successRate: number
  firstTimersManaged: number
  avgDaysBetweenReports: number
  overdueFirstTimers: number
}

interface OverdueReport {
  firstTimer: {
    _id: string
    firstName: string
    lastName: string
    phone: string
    email?: string
    dateOfVisit: string
  }
  assignedTo?: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  lastContactDate?: string
  daysSinceLastContact: number
  completedReports: number
  remainingReports: number
}

export default function CallReportsDashboard() {
  const [globalAnalytics, setGlobalAnalytics] = useState<GlobalAnalytics | null>(null)
  const [teamPerformance, setTeamPerformance] = useState<TeamMember[]>([])
  const [overdueReports, setOverdueReports] = useState<OverdueReport[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'overdue'>('overview')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [analytics, team, overdue] = await Promise.all([
        firstTimersService.getGlobalCallReportsAnalytics(),
        firstTimersService.getTeamPerformanceAnalytics(),
        firstTimersService.getOverdueCallReports(),
      ])

      setGlobalAnalytics(analytics)
      setTeamPerformance(team)
      setOverdueReports(overdue)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      showToast('error', 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'successful':
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'interested':
        return 'bg-blue-100 text-blue-800'
      case 'no_answer':
        return 'bg-yellow-100 text-yellow-800'
      case 'busy':
        return 'bg-orange-100 text-orange-800'
      case 'not_interested':
        return 'bg-red-100 text-red-800'
      case 'follow_up_needed':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPerformanceBadge = (rate: number, threshold: number = 75) => {
    if (rate >= 90) {
      return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    } else if (rate >= threshold) {
      return <Badge className="bg-blue-100 text-blue-800">Good</Badge>
    } else if (rate >= 50) {
      return <Badge className="bg-yellow-100 text-yellow-800">Average</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>
    }
  }

  if (loading) {
    return (
      <Layout title="Call Reports Dashboard" subtitle="Analytics and team performance">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Call Reports Dashboard" subtitle="Analytics and team performance">
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'team', label: 'Team Performance', icon: Users },
              { key: 'overdue', label: 'Overdue Reports', icon: AlertTriangle },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                  {tab.key === 'overdue' && overdueReports.length > 0 && (
                    <Badge className="bg-red-100 text-red-800 ml-1">
                      {overdueReports.length}
                    </Badge>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && globalAnalytics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Reports</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(globalAnalytics.totalReports)}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <PhoneCall className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">First Timers</p>
                    <p className="text-2xl font-bold text-green-600">{formatNumber(globalAnalytics.totalFirstTimers)}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                    <p className="text-2xl font-bold text-purple-600">{globalAnalytics.completionRate.toFixed(1)}%</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Target className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Overdue</p>
                    <p className="text-2xl font-bold text-red-600">{formatNumber(globalAnalytics.overdueFirstTimers)}</p>
                  </div>
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Status Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  Call Status Distribution
                </h3>
                <div className="space-y-3">
                  {Object.entries(globalAnalytics.statusDistribution).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                          {status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{count}</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(count / globalAnalytics.totalReports) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <PhoneCall className="h-5 w-5 text-green-600" />
                  Contact Method Distribution
                </h3>
                <div className="space-y-3">
                  {Object.entries(globalAnalytics.contactMethodDistribution).map(([method, count]) => (
                    <div key={method} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 capitalize">
                        {method.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{count}</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${(count / globalAnalytics.totalReports) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Monthly Trends */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Monthly Trends
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                {globalAnalytics.monthlyTrends.slice(0, 6).map((trend) => (
                  <div key={trend.month} className="text-center">
                    <div className="text-sm font-medium text-gray-900">{trend.month}</div>
                    <div className="text-2xl font-bold text-blue-600 mt-1">
                      {trend.reportsCreated}
                    </div>
                    <div className="text-xs text-gray-600">
                      {trend.firstTimersWithReports} first timers
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Team Performance Tab */}
        {activeTab === 'team' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  Team Performance
                </h3>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Team Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Reports
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        First Timers
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Success Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Days Between
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Overdue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamPerformance.map((member) => (
                      <tr key={member.callMadeBy._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {member.callMadeBy.firstName} {member.callMadeBy.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member.callMadeBy.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.totalReports}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.firstTimersManaged}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900 mr-2">
                              {member.successRate.toFixed(1)}%
                            </span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  member.successRate >= 75 ? 'bg-green-600' :
                                  member.successRate >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                                }`}
                                style={{ width: `${Math.min(member.successRate, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.avgDaysBetweenReports} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPerformanceBadge(member.successRate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {member.overdueFirstTimers > 0 ? (
                            <Badge className="bg-red-100 text-red-800">
                              {member.overdueFirstTimers}
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">None</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Overdue Tab */}
        {activeTab === 'overdue' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-red-600" />
                  Overdue Reports
                  {overdueReports.length > 0 && (
                    <Badge className="bg-red-100 text-red-800 ml-2">
                      {overdueReports.length}
                    </Badge>
                  )}
                </h3>
              </div>

              {overdueReports.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    All reports are up to date!
                  </h4>
                  <p className="text-gray-600">
                    Great job! No first timers have overdue follow-up reports.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {overdueReports.map((report) => (
                    <div
                      key={report.firstTimer._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-gray-900">
                              {report.firstTimer.firstName} {report.firstTimer.lastName}
                            </h4>
                            <Badge className={`${
                              report.daysSinceLastContact > 30 ? 'bg-red-100 text-red-800' :
                              report.daysSinceLastContact > 21 ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {report.daysSinceLastContact} days overdue
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Phone:</span> {report.firstTimer.phone}
                            </div>
                            {report.firstTimer.email && (
                              <div>
                                <span className="font-medium">Email:</span> {report.firstTimer.email}
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Visit Date:</span> {formatDate(report.firstTimer.dateOfVisit)}
                            </div>
                            {report.lastContactDate && (
                              <div>
                                <span className="font-medium">Last Contact:</span> {formatDate(report.lastContactDate)}
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Reports:</span> {report.completedReports}/4 completed
                            </div>
                            {report.assignedTo && (
                              <div>
                                <span className="font-medium">Assigned To:</span> {report.assignedTo.firstName} {report.assignedTo.lastName}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Navigate to first timer details
                              window.location.href = `/first-timers/${report.firstTimer._id}`
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </div>
    </Layout>
  )
}