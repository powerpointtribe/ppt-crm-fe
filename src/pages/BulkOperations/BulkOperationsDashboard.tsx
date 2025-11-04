import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Upload,
  Download,
  Edit3,
  Trash2,
  Users,
  UserPlus,
  Group,
  FileText,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Database,
  FileSpreadsheet,
  Import,
  ArrowRight
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { SkeletonDashboard } from '@/components/ui/Skeleton'

interface BulkOperationStats {
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  pendingOperations: number
  recentActivity: Array<{
    id: string
    type: 'upload' | 'update' | 'delete' | 'export'
    entityType: string
    recordsProcessed: number
    status: 'completed' | 'failed' | 'pending'
    timestamp: string
    user: string
  }>
}

export default function BulkOperationsDashboard() {
  const [stats, setStats] = useState<BulkOperationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000))

      setStats({
        totalOperations: 156,
        successfulOperations: 142,
        failedOperations: 8,
        pendingOperations: 6,
        recentActivity: [
          {
            id: '1',
            type: 'upload',
            entityType: 'members',
            recordsProcessed: 250,
            status: 'completed',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            user: 'Admin User'
          },
          {
            id: '2',
            type: 'update',
            entityType: 'groups',
            recordsProcessed: 15,
            status: 'completed',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            user: 'John Doe'
          },
          {
            id: '3',
            type: 'export',
            entityType: 'first-timers',
            recordsProcessed: 45,
            status: 'failed',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            user: 'Jane Smith'
          }
        ]
      })
    } catch (error) {
      console.error('Error loading bulk operations stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }


  const entityModules = [
    {
      title: 'Members',
      description: 'Bulk operations for church members',
      icon: Users,
      gradient: 'from-emerald-500 to-emerald-600',
      path: '/bulk-operations/members',
      operations: ['Upload', 'Update', 'Export', 'Delete']
    },
    {
      title: 'Groups',
      description: 'Manage groups in bulk',
      icon: Group,
      gradient: 'from-violet-500 to-violet-600',
      path: '/bulk-operations/groups',
      operations: ['Upload', 'Update', 'Export']
    },
    {
      title: 'First Timers',
      description: 'Process visitor data efficiently',
      icon: UserPlus,
      gradient: 'from-orange-500 to-orange-600',
      path: '/bulk-operations/first-timers',
      operations: ['Upload', 'Update', 'Export']
    }
  ]

  if (loading) {
    return (
      <Layout title="Bulk Operations">
        <SkeletonDashboard />
      </Layout>
    )
  }

  return (
    <Layout title="Bulk Operations">
      <div className="space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Total Operations',
              value: stats?.totalOperations || 0,
              icon: Database,
              color: 'text-blue-600',
              bgColor: 'bg-blue-50',
              trend: '+12%'
            },
            {
              title: 'Successful',
              value: stats?.successfulOperations || 0,
              icon: CheckCircle,
              color: 'text-green-600',
              bgColor: 'bg-green-50',
              trend: '+8%'
            },
            {
              title: 'Failed',
              value: stats?.failedOperations || 0,
              icon: AlertCircle,
              color: 'text-red-600',
              bgColor: 'bg-red-50',
              trend: '-5%'
            },
            {
              title: 'Pending',
              value: stats?.pendingOperations || 0,
              icon: Clock,
              color: 'text-yellow-600',
              bgColor: 'bg-yellow-50',
              trend: '+2%'
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="p-4 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <Badge variant="success" className="text-xs flex items-center">
                    <TrendingUp className="h-2 w-2 mr-1" />
                    {stat.trend}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">{stat.title}</h3>
                  <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>


        {/* Entity Modules */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {entityModules.map((module, index) => (
              <motion.div
                key={module.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                onClick={() => navigate(module.path)}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group hover:border-gray-300"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${module.gradient} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <module.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{module.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {module.operations.map((op) => (
                    <Badge key={op} variant="secondary" className="text-xs">
                      {op}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center text-primary-600 text-sm font-medium group-hover:text-primary-700">
                  Manage {module.title}
                  <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Card className="h-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Recent Operations</h2>
                    <p className="text-sm text-muted-foreground">Latest bulk operation activity</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {(stats?.recentActivity || []).map((activity, index) => {
                    const getOperationIcon = (type: string) => {
                      switch (type) {
                        case 'upload': return Upload
                        case 'update': return Edit3
                        case 'delete': return Trash2
                        case 'export': return Download
                        default: return FileText
                      }
                    }

                    const getOperationColor = (type: string) => {
                      switch (type) {
                        case 'upload': return 'bg-blue-500'
                        case 'update': return 'bg-green-500'
                        case 'delete': return 'bg-red-500'
                        case 'export': return 'bg-purple-500'
                        default: return 'bg-gray-500'
                      }
                    }

                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case 'completed': return 'text-green-600'
                        case 'failed': return 'text-red-600'
                        case 'pending': return 'text-yellow-600'
                        default: return 'text-gray-600'
                      }
                    }

                    const OperationIcon = getOperationIcon(activity.type)

                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 + index * 0.1 }}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className={`w-8 h-8 ${getOperationColor(activity.type)} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <OperationIcon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground">
                            {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} {activity.entityType}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.recordsProcessed} records • by {activity.user}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={activity.status === 'completed' ? 'success' : activity.status === 'failed' ? 'destructive' : 'secondary'}
                            className="text-xs mb-1"
                          >
                            {activity.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <Button variant="ghost" size="sm" className="w-full text-sm">
                    View All Operations
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Quick Templates */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <Card className="h-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <FileSpreadsheet className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Templates & Guides</h2>
                    <p className="text-sm text-muted-foreground">Download templates and guides</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { name: 'Member Upload Template', type: 'CSV', icon: Users, description: 'Template for bulk member uploads' },
                    { name: 'Group Import Template', type: 'Excel', icon: Group, description: 'Format for group data imports' },
                    { name: 'First Timer Template', type: 'CSV', icon: UserPlus, description: 'Visitor registration template' },
                    { name: 'Bulk Operations Guide', type: 'PDF', icon: FileText, description: 'Complete guide to bulk operations' }
                  ].map((template, index) => (
                    <motion.div
                      key={template.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.0 + index * 0.1 }}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <template.icon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">{template.name}</p>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {template.type}
                      </Badge>
                      <Download className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <Button variant="ghost" size="sm" className="w-full text-sm">
                    View All Templates
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
