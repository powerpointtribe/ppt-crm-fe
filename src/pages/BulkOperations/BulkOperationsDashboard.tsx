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
  ArrowRight,
  Settings,
  RefreshCw
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { SkeletonDashboard } from '@/components/ui/Skeleton'
import BulkUploadModal from '@/components/ui/BulkUploadModal'
import ExportFilterModal from '@/components/ui/ExportFilterModal'
import { bulkOperationsService, BulkOperationType } from '@/services/bulkOperations'

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

interface EntityTemplate {
  entityType: string
  name: string
  headers: string[]
  required: string[]
}

type ActiveView = 'dashboard' | 'upload' | 'export' | 'history'

export default function BulkOperationsDashboard() {
  const [stats, setStats] = useState<BulkOperationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<ActiveView>('dashboard')
  const [selectedEntityType, setSelectedEntityType] = useState<string>('')
  const [bulkUpload, setBulkUpload] = useState<{
    isOpen: boolean
    entityType: string
    entityName: string
  }>({
    isOpen: false,
    entityType: '',
    entityName: ''
  })
  const [exportFilter, setExportFilter] = useState<{
    isOpen: boolean
    entityType: 'members' | 'groups' | 'first-timers'
    entityName: string
  }>({
    isOpen: false,
    entityType: 'members',
    entityName: ''
  })
  const navigate = useNavigate()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const statsData = await bulkOperationsService.getOperationsStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error loading bulk operations stats:', error)
      // Fallback to mock data if API fails
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

  const handleEntityAction = (entityType: string, entityName: string, action: string) => {
    console.log('handleEntityAction called:', { entityType, entityName, action })

    switch (action) {
      case 'Upload':
        console.log('Opening upload modal for:', entityType)
        setBulkUpload({
          isOpen: true,
          entityType,
          entityName
        })
        break
      case 'Export':
        console.log('Opening export filter modal for:', entityType)
        setExportFilter({
          isOpen: true,
          entityType: entityType as 'members' | 'groups' | 'first-timers',
          entityName
        })
        break
      case 'Template':
        console.log('Downloading template for:', entityType)
        handleDownloadTemplate(entityType)
        break
      default:
        console.log('Unknown action:', action)
        break
    }
  }

  const handleDownloadTemplate = (entityType: string) => {
    console.log('Downloading template for:', entityType)

    const templates = {
      members: {
        headers: ['firstName', 'lastName', 'email', 'phone', 'gender', 'dateOfBirth', 'maritalStatus', 'district', 'unit'],
        example: ['John', 'Doe', 'john.doe@example.com', '+1234567890', 'male', '1990-01-01', 'single', 'District 1', 'Unit A']
      },
      groups: {
        headers: ['name', 'description', 'type', 'district', 'unit', 'capacity', 'meetingDay', 'meetingTime'],
        example: ['Bible Study Group', 'Weekly Bible study and fellowship', 'bible_study', 'District 1', 'Unit A', '20', 'Wednesday', '19:00']
      },
      'first-timers': {
        headers: ['firstName', 'lastName', 'email', 'phone', 'gender', 'ageGroup', 'maritalStatus', 'serviceDate', 'invitedBy'],
        example: ['Jane', 'Smith', 'jane.smith@example.com', '+1234567890', 'female', 'adult', 'single', '2024-01-15', 'John Doe']
      }
    }

    const template = templates[entityType as keyof typeof templates]
    if (!template) {
      console.error('Template not found for:', entityType)
      return
    }

    // Create CSV content
    const csvContent = [
      template.headers.join(','),
      template.example.join(',')
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${entityType}-template.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    console.log('Template download completed for:', entityType)
  }

  const handleExportWithFilters = async (filters: any) => {
    try {
      console.log('Attempting to export data for:', exportFilter.entityType, 'with filters:', filters)

      // Transform frontend filter format to backend format
      const backendFilters = transformFiltersForBackend(filters, exportFilter.entityType)

      await bulkOperationsService.exportEntities(exportFilter.entityType, backendFilters)
      console.log('Export completed for:', exportFilter.entityType)
      // You could add a toast notification here for success
    } catch (error) {
      console.error('Error exporting data:', error)
      // You could add a toast notification here for error
      alert(`Failed to export ${exportFilter.entityType} data. Please try again.`)
    }
  }

  const transformFiltersForBackend = (filters: any, entityType: string) => {
    const backendFilters: any = {}

    // Common filters
    if (filters.searchText) {
      backendFilters.$or = [
        { firstName: { $regex: filters.searchText, $options: 'i' } },
        { lastName: { $regex: filters.searchText, $options: 'i' } },
        { email: { $regex: filters.searchText, $options: 'i' } },
        { phone: { $regex: filters.searchText, $options: 'i' } }
      ]
    }

    // Date range filters
    if (filters.dateFrom || filters.dateTo) {
      const dateField = entityType === 'members' ? 'dateJoined' :
                       entityType === 'first-timers' ? 'dateOfVisit' : 'createdAt'

      backendFilters[dateField] = {}
      if (filters.dateFrom) {
        backendFilters[dateField].$gte = new Date(filters.dateFrom)
      }
      if (filters.dateTo) {
        backendFilters[dateField].$lte = new Date(filters.dateTo + 'T23:59:59.999Z')
      }
    }

    // Entity-specific filters
    if (entityType === 'members') {
      if (filters.membershipStatus) backendFilters.membershipStatus = filters.membershipStatus
      if (filters.gender) backendFilters.gender = filters.gender
      if (filters.maritalStatus) backendFilters.maritalStatus = filters.maritalStatus
      if (filters.district) backendFilters.district = { $regex: filters.district, $options: 'i' }

      // Age filters (convert to date of birth range)
      if (filters.ageMin || filters.ageMax) {
        const now = new Date()
        backendFilters.dateOfBirth = {}

        if (filters.ageMax) {
          const minDate = new Date(now.getFullYear() - filters.ageMax - 1, now.getMonth(), now.getDate())
          backendFilters.dateOfBirth.$gte = minDate
        }
        if (filters.ageMin) {
          const maxDate = new Date(now.getFullYear() - filters.ageMin, now.getMonth(), now.getDate())
          backendFilters.dateOfBirth.$lte = maxDate
        }
      }
    } else if (entityType === 'groups') {
      if (filters.groupType) backendFilters.type = filters.groupType
      if (filters.isActive !== undefined) backendFilters.isActive = filters.isActive
      if (filters.maxCapacity) backendFilters.maxCapacity = { $lte: filters.maxCapacity }
    } else if (entityType === 'first-timers') {
      if (filters.status) backendFilters.status = filters.status
      if (filters.interestedInJoining !== undefined) backendFilters.interestedInJoining = filters.interestedInJoining
      if (filters.converted !== undefined) backendFilters.converted = filters.converted
      if (filters.howDidYouHear) backendFilters.howDidYouHear = filters.howDidYouHear
      if (filters.visitorType) backendFilters.visitorType = filters.visitorType
    }

    return backendFilters
  }

  const handleUploadSuccess = async (result: any) => {
    setBulkUpload({ isOpen: false, entityType: '', entityName: '' })
    await loadStats() // Refresh stats after successful upload
  }

  const entityModules = [
    {
      title: 'Members',
      description: 'Bulk operations for church members',
      icon: Users,
      gradient: 'from-emerald-500 to-emerald-600',
      entityType: 'members',
      operations: ['Upload', 'Update', 'Export', 'Delete']
    },
    {
      title: 'Groups',
      description: 'Manage groups in bulk',
      icon: Group,
      gradient: 'from-violet-500 to-violet-600',
      entityType: 'groups',
      operations: ['Upload', 'Update', 'Export']
    },
    {
      title: 'First Timers',
      description: 'Process visitor data efficiently',
      icon: UserPlus,
      gradient: 'from-orange-500 to-orange-600',
      entityType: 'first-timers',
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
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 group hover:border-gray-300"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${module.gradient} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <module.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{module.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEntityAction(module.entityType, module.title, 'Upload')
                    }}
                    className="text-xs"
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Upload
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEntityAction(module.entityType, module.title, 'Export')
                    }}
                    className="text-xs"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-sm"
                    onClick={() => setActiveView('history')}
                  >
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

                <div className="space-y-3">
                  {[
                    {
                      name: 'Members Template',
                      entityType: 'members',
                      icon: Users,
                      description: 'CSV template with member fields'
                    },
                    {
                      name: 'Groups Template',
                      entityType: 'groups',
                      icon: Group,
                      description: 'CSV template with group fields'
                    },
                    {
                      name: 'First Timers Template',
                      entityType: 'first-timers',
                      icon: UserPlus,
                      description: 'CSV template with visitor fields'
                    },
                    {
                      name: 'Operations Guide',
                      entityType: 'guide',
                      icon: FileText,
                      description: 'Step-by-step instructions'
                    }
                  ].map((template, index) => (
                    <motion.div
                      key={template.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.0 + index * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (template.entityType === 'guide') {
                          window.open('/docs/bulk-operations-guide.pdf', '_blank')
                        } else {
                          handleDownloadTemplate(template.entityType)
                        }
                      }}
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <template.icon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">{template.name}</p>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {template.entityType === 'guide' ? 'PDF' : 'CSV'}
                      </Badge>
                      <Download className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-sm"
                    onClick={() => window.open('/docs/bulk-operations-guide.pdf', '_blank')}
                  >
                    View Complete Guide
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={bulkUpload.isOpen}
        onClose={() => setBulkUpload({ isOpen: false, entityType: '', entityName: '' })}
        entityName={bulkUpload.entityName}
        entityType={bulkUpload.entityType}
        onSuccess={handleUploadSuccess}
        templateColumns={[]}
      />

      {/* Export Filter Modal */}
      <ExportFilterModal
        isOpen={exportFilter.isOpen}
        onClose={() => setExportFilter({ isOpen: false, entityType: 'members', entityName: '' })}
        onExport={handleExportWithFilters}
        entityType={exportFilter.entityType}
        entityName={exportFilter.entityName}
      />
    </Layout>
  )
}
