import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus, UsersIcon, GroupIcon, ArrowRight, TrendingUp, TrendingDown, Activity, Calendar, ChevronDown, FileText, Eye, Edit, Trash2, LogIn, LogOut, Settings, Shield, Info, Globe, Building2, MapPin, User } from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { SkeletonDashboard } from '@/components/ui/Skeleton'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { dashboardService, DashboardOverview, DashboardScope } from '@/services/dashboard'
import { serviceReportsService, ServiceReportStats } from '@/services/service-reports'
import { auditService, AuditLog } from '@/services/audit'
import { useAppStore } from '@/store'
import { useAuth } from '@/contexts/AuthContext-unified'
import { useForceLightMode } from '@/hooks/useForceLightMode'

type DateRangePreset = '1m' | '3m' | '6m' | '1y' | 'custom'

interface DateRangeOption {
  label: string
  value: DateRangePreset
}

const dateRangePresets: DateRangeOption[] = [
  { label: 'Last Month', value: '1m' },
  { label: 'Last 3 Months', value: '3m' },
  { label: 'Last 6 Months', value: '6m' },
  { label: 'Last Year', value: '1y' },
  { label: 'Custom Range', value: 'custom' },
]

const getPresetDateRange = (preset: DateRangePreset): { startDate: string; endDate: string } => {
  const end = new Date()
  const start = new Date()

  switch (preset) {
    case '1m':
      start.setMonth(start.getMonth() - 1)
      break
    case '3m':
      start.setMonth(start.getMonth() - 3)
      break
    case '6m':
      start.setMonth(start.getMonth() - 6)
      break
    case '1y':
      start.setFullYear(start.getFullYear() - 1)
      break
    default:
      start.setMonth(start.getMonth() - 3) // Default to 3 months
  }

  return { startDate: start.toISOString(), endDate: end.toISOString() }
}

const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

const formatDateDisplay = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

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
  useForceLightMode()
  const { selectedBranch, branches } = useAppStore()
  const { member, hasPermission, isAdmin, canManageMembers, canAccessFirstTimers, canManageGroups } = useAuth()
  const [stats, setStats] = useState<Partial<DashboardOverview> | null>(null)
  const [serviceReportStats, setServiceReportStats] = useState<ServiceReportStats | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangePreset>('3m')
  const [showDateRangeDropdown, setShowDateRangeDropdown] = useState(false)
  const [branchFilter, setBranchFilter] = useState('')
  const [dashboardScope, setDashboardScope] = useState<DashboardScope | null>(null)
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 3)
    return formatDateForInput(date)
  })
  const [customEndDate, setCustomEndDate] = useState<string>(() => formatDateForInput(new Date()))
  const [appliedCustomDates, setAppliedCustomDates] = useState<{ start: string; end: string } | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Show branch filter when viewing "All Campuses"
  const showBranchFilter = !selectedBranch && branches.length > 0

  // Map permissions to audit entity types for filtering
  const getAccessibleAuditEntities = useMemo(() => {
    const entityMap: Array<{ permission: string; entities: string[] }> = [
      { permission: 'members:view', entities: ['MEMBER', 'USER'] },
      { permission: 'units:view', entities: ['GROUP', 'MINISTRY', 'UNIT'] },
      { permission: 'first-timers:view', entities: ['FIRST_TIMER', 'FIRST-TIMER'] },
      { permission: 'inventory:view-items', entities: ['INVENTORY_ITEM', 'INVENTORY_CATEGORY', 'INVENTORY_MOVEMENT'] },
      { permission: 'branches:view', entities: ['BRANCH'] },
      { permission: 'roles:view-roles', entities: ['ROLE', 'PERMISSION'] },
      { permission: 'audit-logs:view', entities: ['AUDIT_LOG'] },
      { permission: 'service-reports:view', entities: ['SERVICE_REPORT'] },
    ]

    // Admin sees everything
    if (isAdmin) {
      return null // null means no filtering
    }

    const accessibleEntities = new Set<string>()

    // Always allow system/auth events
    accessibleEntities.add('SYSTEM')
    accessibleEntities.add('AUTH')
    accessibleEntities.add('SYSTEM_CONFIG')

    entityMap.forEach(({ permission, entities }) => {
      if (hasPermission(permission)) {
        entities.forEach(entity => accessibleEntities.add(entity))
      }
    })

    return accessibleEntities
  }, [isAdmin, hasPermission])

  // Filter audit logs based on accessible entities
  const filterAuditLogsByAccess = (logs: AuditLog[]): AuditLog[] => {
    // Admin sees all logs
    if (!getAccessibleAuditEntities) {
      return logs
    }

    return logs.filter(log => {
      const entityType = (log.entityType || log.entity || '').toUpperCase()
      const action = (log.action || '').toUpperCase()

      // Allow auth-related actions for everyone (login, logout, password changes)
      if (action.includes('LOGIN') || action.includes('LOGOUT') || action.includes('PASSWORD')) {
        return true
      }

      // If no entity type, allow by default (system events)
      if (!entityType) {
        return true
      }

      // Check if user has access to this entity type
      return getAccessibleAuditEntities.has(entityType)
    })
  }

  const currentDateRangeOption = useMemo(() => {
    return dateRangePresets.find(opt => opt.value === selectedDateRange) || dateRangePresets[1]
  }, [selectedDateRange])

  const currentDateRange = useMemo(() => {
    if (selectedDateRange === 'custom' && appliedCustomDates) {
      return {
        startDate: new Date(appliedCustomDates.start).toISOString(),
        endDate: new Date(appliedCustomDates.end).toISOString()
      }
    }
    if (selectedDateRange === 'custom') {
      // Custom selected but not applied yet - use default 3 months
      return getPresetDateRange('3m')
    }
    return getPresetDateRange(selectedDateRange)
  }, [selectedDateRange, appliedCustomDates])

  // Only refresh when preset changes (not custom) or when custom dates are applied
  useEffect(() => {
    if (selectedDateRange !== 'custom') {
      loadDashboardStats()
    }
  }, [selectedDateRange])

  useEffect(() => {
    if (appliedCustomDates) {
      loadDashboardStats()
    }
  }, [appliedCustomDates])

  // Reload when branch filter changes
  useEffect(() => {
    loadDashboardStats()
  }, [branchFilter, selectedBranch])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDateRangeDropdown(false)
      }
    }

    if (showDateRangeDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDateRangeDropdown])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const range = currentDateRange
      // Use selectedBranch if set, otherwise use the filter dropdown
      const effectiveBranchId = selectedBranch?._id || branchFilter || undefined

      // Use scoped=true for non-admin users to get permission-filtered data
      const useScoped = !isAdmin

      // Load all data in parallel with date range filtering
      const [dashboardData, serviceStats, recentAuditLogs] = await Promise.all([
        dashboardService.getStats(range.startDate, range.endDate, effectiveBranchId, useScoped),
        serviceReportsService.getServiceReportStats({ dateFrom: range.startDate, dateTo: range.endDate, branchId: effectiveBranchId }).catch(() => null),
        // Fetch more logs than needed since we'll filter by permissions
        auditService.getRecentActivity(20, range.startDate, range.endDate).catch(() => [])
      ])

      console.log('Dashboard data received:', dashboardData)
      setStats(dashboardData)
      setServiceReportStats(serviceStats)

      // Filter audit logs based on user's accessible modules and limit to 5
      const filteredAuditLogs = filterAuditLogsByAccess(recentAuditLogs).slice(0, 5)
      setAuditLogs(filteredAuditLogs)

      // Store scope info from API response if available
      if (dashboardData?.scope) {
        setDashboardScope(dashboardData.scope)
      }
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

  const handleDateRangeChange = (value: DateRangePreset) => {
    setSelectedDateRange(value)
    setShowDateRangeDropdown(false)
    // Clear applied custom dates when switching to a preset
    if (value !== 'custom') {
      setAppliedCustomDates(null)
    }
  }

  const getTrendIcon = (trend: string) => {
    const value = parseFloat(trend)
    if (value > 0) return TrendingUp
    if (value < 0) return TrendingDown
    return TrendingUp
  }

  const getTrendVariant = (trend: string): 'success' | 'destructive' | 'default' => {
    const value = parseFloat(trend)
    if (value > 0) return 'success'
    if (value < 0) return 'destructive'
    return 'default'
  }

  // Define all available modules with their permission requirements
  const allModules = [
    {
      title: 'Members',
      description: 'New members in period',
      periodCount: stats?.periodMembers ?? 0,
      totalCount: stats?.totalMembers ?? 0,
      trend: stats?.trends?.membersTrend || '0%',
      icon: UsersIcon,
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      path: '/members',
      hasAccess: canManageMembers,
      requiredPermission: 'members:view',
    },
    {
      title: 'Groups',
      description: 'New groups in period',
      periodCount: stats?.periodGroups ?? 0,
      totalCount: stats?.totalGroups ?? 0,
      trend: stats?.trends?.groupsTrend || '0%',
      icon: GroupIcon,
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      path: '/groups',
      hasAccess: canManageGroups,
      requiredPermission: 'units:view',
    },
    {
      title: 'First Timers',
      description: 'New visitors in period',
      periodCount: stats?.periodFirstTimers ?? 0,
      totalCount: stats?.totalFirstTimers ?? 0,
      trend: stats?.trends?.firstTimersTrend || '0%',
      icon: UserPlus,
      gradient: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      path: '/first-timers',
      hasAccess: canAccessFirstTimers,
      requiredPermission: 'first-timers:view',
    },
  ]

  // Filter modules based on user permissions
  const modules = allModules.filter(module => module.hasAccess)

  // Determine user's scope for display
  const userScope = useMemo(() => {
    if (isAdmin) {
      return { type: 'global', label: 'Full Access', icon: Globe, color: 'text-blue-600 bg-blue-50' }
    }
    if (hasPermission('branches:view-all')) {
      return { type: 'global', label: 'All Campuses', icon: Globe, color: 'text-blue-600 bg-blue-50' }
    }
    if (hasPermission('members:view-district')) {
      return { type: 'district', label: 'District Level', icon: MapPin, color: 'text-purple-600 bg-purple-50' }
    }
    if (hasPermission('units:manage')) {
      return { type: 'unit', label: 'Unit Level', icon: Building2, color: 'text-green-600 bg-green-50' }
    }
    return { type: 'self', label: 'Personal', icon: User, color: 'text-gray-600 bg-gray-50' }
  }, [isAdmin, hasPermission])

  // Get user's role display name
  const userRoleDisplay = useMemo(() => {
    if (member?.role) {
      if (typeof member.role === 'object' && member.role.displayName) {
        return member.role.displayName
      }
      if (typeof member.role === 'string') {
        return member.role
      }
    }
    if (member?.membershipStatus) {
      const statusMap: Record<string, string> = {
        'SENIOR_PASTOR': 'Senior Pastor',
        'PASTOR': 'Pastor',
        'DIRECTOR': 'Director',
        'LXL': 'LXL',
        'DC': 'DC',
        'MEMBER': 'Member',
      }
      return statusMap[member.membershipStatus] || member.membershipStatus
    }
    return 'Member'
  }, [member])

  // Helper function to get audit action icon
  const getAuditActionIcon = (action: string) => {
    if (action.includes('LOGIN')) return LogIn
    if (action.includes('LOGOUT')) return LogOut
    if (action.includes('CREATE') || action.includes('CREATED')) return UserPlus
    if (action.includes('UPDATE') || action.includes('UPDATED')) return Edit
    if (action.includes('DELETE') || action.includes('DELETED')) return Trash2
    if (action.includes('VIEW') || action.includes('READ')) return Eye
    if (action.includes('CONFIG') || action.includes('SETTING')) return Settings
    return Activity
  }

  // Helper function to get audit action color
  const getAuditActionColor = (action: string) => {
    if (action.includes('LOGIN')) return 'bg-blue-500'
    if (action.includes('LOGOUT')) return 'bg-gray-500'
    if (action.includes('CREATE') || action.includes('CREATED')) return 'bg-green-500'
    if (action.includes('UPDATE') || action.includes('UPDATED')) return 'bg-yellow-500'
    if (action.includes('DELETE') || action.includes('DELETED')) return 'bg-red-500'
    if (action.includes('VIEW') || action.includes('READ')) return 'bg-purple-500'
    return 'bg-blue-500'
  }

  // Format audit action for display
  const formatAuditAction = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
  }

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
      <div className="space-y-6">
        {/* Scope Indicator & Date Range Filter */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4">
          {/* Scope Indicator */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${userScope.color}`}>
                <userScope.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{userScope.label}</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                <Shield className="h-4 w-4" />
                <span>Viewing as: <span className="font-medium text-gray-700 dark:text-slate-300">{userRoleDisplay}</span></span>
              </div>
            </div>
            {modules.length < allModules.length && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full">
                <Info className="h-3.5 w-3.5" />
                <span>Showing {modules.length} of {allModules.length} modules based on your access</span>
              </div>
            )}
          </div>

          {/* Date Range Filter */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-gray-500 dark:text-slate-400">
              Showing data for{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedDateRange === 'custom' && appliedCustomDates
                  ? `${formatDateDisplay(appliedCustomDates.start)} - ${formatDateDisplay(appliedCustomDates.end)}`
                  : selectedDateRange === 'custom'
                  ? 'custom range (select dates)'
                  : currentDateRangeOption.label.toLowerCase()}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Custom Date Inputs - Show when custom is selected */}
              {selectedDateRange === 'custom' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-slate-400">From:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      max={customEndDate}
                      className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-slate-400">To:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      min={customStartDate}
                      max={formatDateForInput(new Date())}
                      className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setAppliedCustomDates({ start: customStartDate, end: customEndDate })}
                    disabled={!customStartDate || !customEndDate}
                  >
                    Apply
                  </Button>
                </div>
              )}

              {/* Date Range Preset Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDateRangeDropdown(!showDateRangeDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg hover:border-gray-300 dark:hover:border-slate-500 transition-colors text-sm font-medium text-gray-900 dark:text-white"
                >
                  <Calendar className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                  {currentDateRangeOption.label}
                  <ChevronDown className={`h-4 w-4 text-gray-500 dark:text-slate-400 transition-transform ${showDateRangeDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showDateRangeDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
                    {dateRangePresets.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleDateRangeChange(option.value)}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          selectedDateRange === option.value ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {modules.length === 0 ? (
          <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-8 text-center">
            <Info className="h-12 w-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-slate-300 mb-2">No Modules Available</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              You don't have access to any dashboard modules. Please contact your administrator for permissions.
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
          {modules.map((module, index) => {
            const TrendIcon = module.trend ? getTrendIcon(module.trend) : null
            const trendVariant = module.trend ? getTrendVariant(module.trend) : 'default'

            return (
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
                    {module.trend && TrendIcon && (
                      <Badge variant={trendVariant} className="text-xs flex items-center">
                        <TrendIcon className="h-2 w-2 mr-1" />
                        {module.trend}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary-600 transition-colors">
                      {module.title}
                    </h3>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {module.periodCount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          In period • {module.totalCount.toLocaleString()} total
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary-600 transform group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
        )}

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

          {(() => {
            const quickActions = [
              { label: 'Register Member', path: '/members/new', icon: UsersIcon, color: 'bg-green-500', description: 'Add church member', hasAccess: hasPermission('members:create') },
              { label: 'Create Group', path: '/groups/new', icon: GroupIcon, color: 'bg-purple-500', description: 'Start new group', hasAccess: hasPermission('units:create') },
              { label: 'Add First Timer', path: '/first-timers/new', icon: UserPlus, color: 'bg-orange-500', description: 'Register visitor', hasAccess: hasPermission('first-timers:create') },
            ].filter(action => action.hasAccess)

            if (quickActions.length === 0) {
              return (
                <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-6 text-center">
                  <Info className="h-10 w-10 text-gray-400 dark:text-slate-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    No quick actions available based on your current permissions.
                  </p>
                </div>
              )
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    onClick={() => navigate(action.path)}
                    className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group hover:border-gray-300 dark:hover:border-slate-600"
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 ${action.color} rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1">{action.label}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">{action.description}</p>
                  </motion.div>
                ))}
              </div>
            )
          })()}
        </motion.div>

        {/* Service Reports & Audit Trail Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8">
          {/* Service Reports Stats */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Card className="h-full">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-xl font-semibold text-foreground truncate">Service Reports</h2>
                      <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Attendance and service statistics</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/service-reports')} className="text-xs sm:text-sm flex-shrink-0">
                    View All
                  </Button>
                </div>

                {serviceReportStats ? (
                  <>
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">
                          {serviceReportStats.overall?.totalReports?.toLocaleString() || 0}
                        </div>
                        <div className="text-xs sm:text-sm text-blue-600 font-medium">Total Reports</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-green-600 mb-1">
                          {serviceReportStats.overall?.totalAttendance?.toLocaleString() || 0}
                        </div>
                        <div className="text-xs sm:text-sm text-green-600 font-medium">Total Attendance</div>
                      </div>
                    </div>

                    {/* Additional Stats */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-foreground">Avg. Attendance</span>
                        <span className="text-sm font-bold text-foreground">
                          {Math.round(serviceReportStats.overall?.averageAttendance || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-foreground">Highest Attendance</span>
                        <span className="text-sm font-bold text-foreground">
                          {(serviceReportStats.overall?.highestAttendance || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-foreground">Total First Timers</span>
                        <span className="text-sm font-bold text-foreground">
                          {(serviceReportStats.overall?.totalFirstTimers || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-foreground">Avg. First Timers/Service</span>
                        <span className="text-sm font-bold text-foreground">
                          {Math.round(serviceReportStats.overall?.averageFirstTimers || 0)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No service reports data available</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/service-reports/new')}>
                      Create First Report
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Audit Trail / Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <Card className="h-full">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-xl font-semibold text-foreground truncate">Recent Activity</h2>
                      <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">System audit trail</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/audit/logs')} className="text-xs sm:text-sm flex-shrink-0">
                    View All
                  </Button>
                </div>

                <div className="space-y-3">
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log, index) => {
                      const ActionIcon = getAuditActionIcon(log.action)
                      const actionColor = getAuditActionColor(log.action)

                      return (
                        <motion.div
                          key={log._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.1 + index * 0.1 }}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className={`w-8 h-8 ${actionColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                            <ActionIcon className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">
                              {formatAuditAction(log.action)}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {log.description || `${log.entity || log.entityType || 'System'}`} • by {log.performedBy?.firstName || 'System'} {log.performedBy?.lastName || ''}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTimeAgo(log.timestamp || log.createdAt)}
                          </span>
                        </motion.div>
                      )
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Activity className="h-12 w-12 text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                      {!isAdmin && (
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          Activity is filtered based on your module access
                        </p>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </Card>
          </motion.div>
        </div>

      </div>
    </Layout>
  )
}
