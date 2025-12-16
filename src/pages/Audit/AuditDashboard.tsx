import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Users,
  Download,
  Search,
  Filter,
  TrendingUp,
  Clock,
  Eye,
  FileText,
  BarChart3
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { auditService, AuditLog, AuditStatistics, AuditSeverity } from '@/services/audit'
import { formatDate, formatDateTime } from '@/utils/formatters'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color?: string
  change?: {
    value: number
    isPositive: boolean
    period: string
  }
}

function StatsCard({ title, value, subtitle, icon, color = 'blue', change }: StatsCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <div className={`text-${color}-600`}>
            {icon}
          </div>
        </div>
      </div>
      {change && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center">
            <span className={`text-sm font-medium ${
              change.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {change.isPositive ? '+' : ''}{change.value}%
            </span>
            <span className="text-sm text-gray-500 ml-2">{change.period}</span>
          </div>
        </div>
      )}
    </Card>
  )
}

export default function AuditDashboard() {
  const [statistics, setStatistics] = useState<AuditStatistics | null>(null)
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [stats, recent] = await Promise.all([
        auditService.getStatistics(),
        auditService.getRecentActivity(10)
      ])

      setStatistics(stats)
      setRecentLogs(recent)
    } catch (error: any) {
      console.error('Error loading audit dashboard:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityIcon = (severity: AuditSeverity) => {
    switch (severity) {
      case AuditSeverity.CRITICAL: return <AlertTriangle className="h-4 w-4" />
      case AuditSeverity.HIGH: return <AlertTriangle className="h-4 w-4" />
      case AuditSeverity.MEDIUM: return <Activity className="h-4 w-4" />
      default: return <CheckCircle className="h-4 w-4" />
    }
  }

  const getActionColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600'
  }

  if (loading) {
    return (
      <Layout title="Audit Dashboard">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Audit Dashboard">
        <div className="text-center text-red-600 p-8">
          <p>Error loading audit data: {error.message}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Audit Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Dashboard</h1>
            <p className="text-gray-600">Monitor system activity and security events</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
            <Link to="/audit/logs">
              <Button>
                <Eye className="h-4 w-4 mr-2" />
                View All Logs
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Logs"
              value={statistics.totalLogs.toLocaleString()}
              subtitle="All audit records"
              icon={<FileText className="h-6 w-6" />}
              color="blue"
            />
            <StatsCard
              title="Recent Activity"
              value={statistics.recentLogs}
              subtitle="Last 24 hours"
              icon={<Activity className="h-6 w-6" />}
              color="green"
            />
            <StatsCard
              title="Failed Actions"
              value={statistics.failedActions}
              subtitle="Requires attention"
              icon={<AlertTriangle className="h-6 w-6" />}
              color="red"
            />
            <StatsCard
              title="Active Users"
              value={statistics.uniqueUsers}
              subtitle="Users with recent activity"
              icon={<Users className="h-6 w-6" />}
              color="purple"
            />
          </div>
        )}

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/audit/logs">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                View All Logs
              </Button>
            </Link>
            <Link to="/audit/logs?success=false">
              <Button variant="outline" className="w-full justify-start">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Failed Actions
              </Button>
            </Link>
            <Link to="/audit/logs?severity=critical">
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Critical Events
              </Button>
            </Link>
            <Link to="/audit/reports">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Reports
              </Button>
            </Link>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <Link to="/audit/logs">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
            {recentLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentLogs.map((log) => (
                  <motion.div
                    key={log._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className={`p-1 rounded-full ${auditService.getSeverityColor(log.severity)}`}>
                      {getSeverityIcon(log.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 truncate">
                          {log.action.replace(/_/g, ' ')}
                        </p>
                        <Badge className={auditService.getSeverityColor(log.severity)} size="sm">
                          {log.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{log.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>by {log.performedBy.firstName} {log.performedBy.lastName}</span>
                        <span className={getActionColor(log.success)}>
                          {log.success ? '✓ Success' : '✗ Failed'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDateTime(log.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>

          {/* Top Actions */}
          {statistics?.topActions && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Actions</h3>
              <div className="space-y-3">
                {statistics.topActions.slice(0, 5).map((action, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900">
                        {action.action.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{action.count}</span>
                      <span className="text-xs text-gray-500">
                        ({action.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Entity Breakdown */}
        {statistics?.entityBreakdown && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Activity by Entity Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {statistics.entityBreakdown.slice(0, 6).map((entity, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">
                    {entity.entity.replace(/_/g, ' ')}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">{entity.count}</p>
                  <p className="text-sm text-gray-600">
                    {entity.percentage.toFixed(1)}% of total
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Error Summary */}
        {statistics?.errorSummary && statistics.errorSummary.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">Error Summary</h3>
              <Link to="/audit/logs?success=false">
                <Button variant="outline" size="sm" className="text-red-600">
                  View All Errors
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {statistics.errorSummary.slice(0, 5).map((error, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-red-900">{error.errorType}</p>
                    <p className="text-sm text-red-600">{error.count} occurrences</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-red-500">Last seen</p>
                    <p className="text-sm text-red-700">{formatDate(error.lastOccurrence)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}