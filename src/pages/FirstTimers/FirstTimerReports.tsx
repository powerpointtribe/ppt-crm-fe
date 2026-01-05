import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts'
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  UserCheck,
  UserPlus,
  RefreshCw,
  ChevronRight,
  Target,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { firstTimersService } from '@/services/first-timers'
import { useAuth } from '@/contexts/AuthContext-unified'
import { showToast } from '@/utils/toast'
import { cn } from '@/utils/cn'

// Modern color palette
const COLORS = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  cyan: '#06B6D4',
  pink: '#EC4899',
}

const CHART_COLORS = ['#6366F1', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EC4899']

interface ReportFilters {
  startDate: string
  endDate: string
}

interface ReportStats {
  totalFirstTimers: number
  trafficSourceByService: any[]
  trafficSourceSummary: { name: string; value: number; percentage: number }[]
  joinUsChoicesByService: any[]
  joinUsChoicesSummary: { name: string; value: number; percentage: number }[]
  secondTimerRetention: {
    byService: any[]
    expectedCount: number
    actualCount: number
    retentionRate: number
  }
  thirdTimerRetention: {
    byService: any[]
    expectedCount: number
    actualCount: number
    retentionRate: number
  }
}

// Stat Card Component
const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'indigo'
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: any
  trend?: 'up' | 'down'
  trendValue?: string
  color?: 'indigo' | 'green' | 'orange' | 'pink' | 'cyan'
}) => {
  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    pink: 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={cn('p-2 rounded-lg', colorClasses[color])}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <div className={cn(
            'flex items-center gap-0.5 text-xs font-medium',
            trend === 'up' ? 'text-emerald-600' : 'text-red-500'
          )}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{title}</p>
        {subtitle && <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

// Chart Card Component
const ChartCard = ({
  title,
  subtitle,
  children,
  className,
  compact = false
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  compact?: boolean
}) => (
  <div className={cn(
    'bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700',
    compact ? 'p-4' : 'p-5',
    className
  )}>
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
)

// Progress Bar Component
const ProgressBar = ({
  label,
  value,
  total,
  color
}: {
  label: string
  value: number
  total: number
  color: string
}) => {
  const percentage = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-white">{value} ({percentage.toFixed(1)}%)</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-xs">
        <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-gray-600 dark:text-gray-400">
            <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
            {entry.name}: <span className="font-medium text-gray-900 dark:text-white">{entry.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function FirstTimerReports() {
  const navigate = useNavigate()
  const { member } = useAuth()

  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ReportFilters>(() => {
    const end = new Date()
    const start = new Date()
    start.setMonth(start.getMonth() - 1)
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    }
  })
  const [reportData, setReportData] = useState<ReportStats | null>(null)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  useEffect(() => {
    loadReportData()
  }, [filters])

  const loadReportData = async () => {
    try {
      setLoading(true)
      const data = await firstTimersService.getReportStatistics(
        filters.startDate,
        filters.endDate
      )
      if (data) {
        setReportData(data)
      } else {
        setReportData(generateMockData())
        showToast.info('No data available. Showing sample data.')
      }
    } catch (err) {
      console.error('Failed to load report data:', err)
      setReportData(generateMockData())
      showToast.warning('Could not load data. Showing sample data.')
    } finally {
      setLoading(false)
    }
  }

  const generateMockData = (): ReportStats => ({
    totalFirstTimers: 47,
    trafficSourceByService: [
      { service: 'Oct 26', 'Friend/Colleague': 7, 'Others': 1, 'Social Media': 2, 'Special Programs': 1 },
      { service: 'Nov 2', 'Friend/Colleague': 5, 'Others': 2, 'Social Media': 1, 'Special Programs': 0 },
      { service: 'Nov 9', 'Friend/Colleague': 4, 'Others': 0, 'Social Media': 3, 'Special Programs': 2 },
      { service: 'Nov 16', 'Friend/Colleague': 6, 'Others': 4, 'Social Media': 1, 'Special Programs': 0 },
      { service: 'Nov 23', 'Friend/Colleague': 3, 'Others': 2, 'Social Media': 2, 'Special Programs': 1 },
    ],
    trafficSourceSummary: [
      { name: 'Friend/Colleague', value: 25, percentage: 53.2 },
      { name: 'Others', value: 9, percentage: 19.1 },
      { name: 'Social Media', value: 9, percentage: 19.1 },
      { name: 'Special Programs', value: 4, percentage: 8.5 },
    ],
    joinUsChoicesByService: [
      { service: 'Oct 26', Yes: 7, Maybe: 2, No: 2 },
      { service: 'Nov 2', Yes: 5, Maybe: 2, No: 1 },
      { service: 'Nov 9', Yes: 6, Maybe: 2, No: 1 },
      { service: 'Nov 16', Yes: 8, Maybe: 2, No: 1 },
      { service: 'Nov 23', Yes: 5, Maybe: 2, No: 1 },
    ],
    joinUsChoicesSummary: [
      { name: 'Yes', value: 31, percentage: 66.0 },
      { name: 'Maybe', value: 10, percentage: 21.3 },
      { name: 'No', value: 6, percentage: 12.8 },
    ],
    secondTimerRetention: {
      byService: [
        { service: 'Oct 26', Yes: 4, null: 7 },
        { service: 'Nov 2', Yes: 3, null: 5 },
        { service: 'Nov 9', Yes: 2, null: 7 },
        { service: 'Nov 16', Yes: 1, null: 10 },
      ],
      expectedCount: 31,
      actualCount: 10,
      retentionRate: 32.26,
    },
    thirdTimerRetention: {
      byService: [
        { service: 'Oct 26', Yes: 3, null: 8 },
        { service: 'Nov 2', Yes: 2, null: 6 },
        { service: 'Nov 9', Yes: 1, null: 8 },
      ],
      expectedCount: 10,
      actualCount: 6,
      retentionRate: 60.0,
    },
  })

  // Calculate additional metrics
  const conversionFunnelData = reportData ? [
    { stage: 'First Visit', count: reportData.totalFirstTimers, fill: COLORS.primary },
    { stage: 'Interested', count: reportData.joinUsChoicesSummary.find(j => j.name === 'Yes')?.value || 0, fill: COLORS.secondary },
    { stage: '2nd Visit', count: reportData.secondTimerRetention.actualCount, fill: COLORS.cyan },
    { stage: '3rd Visit', count: reportData.thirdTimerRetention.actualCount, fill: COLORS.success },
  ] : []

  const weeklyTrendData = reportData?.trafficSourceByService.map((item, index) => ({
    week: item.service,
    visitors: Object.values(item).filter((v): v is number => typeof v === 'number').reduce((a, b) => a + b, 0),
    trend: index > 0 ? Math.floor(Math.random() * 20) - 10 : 0,
  })) || []

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 sm:p-6 space-y-5 max-w-[1600px] mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <button
              onClick={() => navigate('/first-timers')}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 mb-1 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to First Timers
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              First Timer Analytics
            </h1>
            <p className="text-xs text-gray-500">
              {getGreeting()}, {member?.firstName}. Here's your visitor insights.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="bg-transparent text-xs border-none focus:outline-none text-gray-700 dark:text-gray-300"
              />
              <span className="text-gray-300">-</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="bg-transparent text-xs border-none focus:outline-none text-gray-700 dark:text-gray-300"
              />
            </div>
            <button
              onClick={loadReportData}
              className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {reportData && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                title="Total First Timers"
                value={reportData.totalFirstTimers}
                subtitle="In selected period"
                icon={UserPlus}
                color="indigo"
                trend="up"
                trendValue="+12%"
              />
              <StatCard
                title="Interested in Joining"
                value={reportData.joinUsChoicesSummary.find(j => j.name === 'Yes')?.value || 0}
                subtitle={`${reportData.joinUsChoicesSummary.find(j => j.name === 'Yes')?.percentage.toFixed(0)}% of total`}
                icon={UserCheck}
                color="green"
              />
              <StatCard
                title="2nd Timer Rate"
                value={`${reportData.secondTimerRetention.retentionRate.toFixed(0)}%`}
                subtitle={`${reportData.secondTimerRetention.actualCount} returned`}
                icon={Target}
                color="cyan"
                trend={reportData.secondTimerRetention.retentionRate > 25 ? 'up' : 'down'}
                trendValue={reportData.secondTimerRetention.retentionRate > 25 ? 'Good' : 'Low'}
              />
              <StatCard
                title="3rd Timer Rate"
                value={`${reportData.thirdTimerRetention.retentionRate.toFixed(0)}%`}
                subtitle={`${reportData.thirdTimerRetention.actualCount} retained`}
                icon={Percent}
                color="pink"
                trend={reportData.thirdTimerRetention.retentionRate > 50 ? 'up' : 'down'}
                trendValue={reportData.thirdTimerRetention.retentionRate > 50 ? 'Great' : 'Needs work'}
              />
            </div>

            {/* Row 1: Conversion Funnel + Traffic Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Conversion Funnel */}
              <ChartCard title="Visitor Conversion Funnel" subtitle="From first visit to retention" compact>
                <div className="space-y-3">
                  {conversionFunnelData.map((item, index) => (
                    <div key={item.stage} className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.stage}</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{item.count}</span>
                      </div>
                      <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.count / conversionFunnelData[0].count) * 100}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                          className="h-full rounded-lg"
                          style={{ backgroundColor: item.fill }}
                        />
                        {index < conversionFunnelData.length - 1 && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">
                            {index > 0 && conversionFunnelData[index - 1].count > 0
                              ? `${((item.count / conversionFunnelData[index - 1].count) * 100).toFixed(0)}%`
                              : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ChartCard>

              {/* Traffic Source Breakdown */}
              <ChartCard title="Traffic Sources" subtitle="How visitors found us" className="lg:col-span-2" compact>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.trafficSourceSummary}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {reportData.trafficSourceSummary.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {reportData.trafficSourceSummary.map((item, index) => (
                      <ProgressBar
                        key={item.name}
                        label={item.name}
                        value={item.value}
                        total={reportData.totalFirstTimers}
                        color={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </div>
                </div>
              </ChartCard>
            </div>

            {/* Row 2: Weekly Trend + Join Us Choices */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Weekly Visitor Trend */}
              <ChartCard title="Weekly Visitor Trend" subtitle="Visitors per service" compact>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyTrendData}>
                      <defs>
                        <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="week" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="visitors"
                        stroke={COLORS.primary}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorVisitors)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* Join Us Intent */}
              <ChartCard title="'Join Us' Intent Analysis" subtitle="Visitor interest levels" compact>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.joinUsChoicesSummary}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          <Cell fill={COLORS.success} />
                          <Cell fill={COLORS.warning} />
                          <Cell fill={COLORS.danger} />
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center space-y-3">
                    {reportData.joinUsChoicesSummary.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: [COLORS.success, COLORS.warning, COLORS.danger][index] }}
                        />
                        <div className="flex-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{item.value}</span>
                          </div>
                          <p className="text-[10px] text-gray-400">{item.percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ChartCard>
            </div>

            {/* Row 3: Retention Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 2nd Timer Retention */}
              <ChartCard
                title="2nd Visit Retention"
                subtitle={`${reportData.secondTimerRetention.actualCount} of ${reportData.secondTimerRetention.expectedCount} expected visitors returned`}
                compact
              >
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{reportData.secondTimerRetention.expectedCount}</p>
                    <p className="text-[10px] text-gray-500">Expected</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{reportData.secondTimerRetention.actualCount}</p>
                    <p className="text-[10px] text-gray-500">Returned</p>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{reportData.secondTimerRetention.retentionRate.toFixed(1)}%</p>
                    <p className="text-[10px] text-gray-500">Rate</p>
                  </div>
                </div>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.secondTimerRetention.byService} barSize={24}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="service" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Yes" stackId="a" fill={COLORS.success} radius={[4, 4, 0, 0]} name="Returned" />
                      <Bar dataKey="null" stackId="a" fill="#E5E7EB" radius={[4, 4, 0, 0]} name="Pending" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* 3rd Timer Retention */}
              <ChartCard
                title="3rd Visit Retention"
                subtitle={`${reportData.thirdTimerRetention.actualCount} of ${reportData.thirdTimerRetention.expectedCount} 2nd timers returned again`}
                compact
              >
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{reportData.thirdTimerRetention.expectedCount}</p>
                    <p className="text-[10px] text-gray-500">Expected</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{reportData.thirdTimerRetention.actualCount}</p>
                    <p className="text-[10px] text-gray-500">Returned</p>
                  </div>
                  <div className="bg-pink-50 dark:bg-pink-900/30 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-pink-600 dark:text-pink-400">{reportData.thirdTimerRetention.retentionRate.toFixed(1)}%</p>
                    <p className="text-[10px] text-gray-500">Rate</p>
                  </div>
                </div>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.thirdTimerRetention.byService} barSize={24}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="service" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Yes" stackId="a" fill={COLORS.pink} radius={[4, 4, 0, 0]} name="Returned" />
                      <Bar dataKey="null" stackId="a" fill="#E5E7EB" radius={[4, 4, 0, 0]} name="Pending" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>

            {/* Row 4: Detailed Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Traffic Source by Service */}
              <ChartCard title="Traffic Source by Service" subtitle="Breakdown per week" compact>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.trafficSourceByService} barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="service" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="Friend/Colleague" stackId="a" fill={CHART_COLORS[0]} />
                      <Bar dataKey="Others" stackId="a" fill={CHART_COLORS[1]} />
                      <Bar dataKey="Social Media" stackId="a" fill={CHART_COLORS[2]} />
                      <Bar dataKey="Special Programs" stackId="a" fill={CHART_COLORS[3]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* Join Us by Service */}
              <ChartCard title="Join Us Intent by Service" subtitle="Interest levels per week" compact>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.joinUsChoicesByService} barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="service" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="Yes" stackId="a" fill={COLORS.success} />
                      <Bar dataKey="Maybe" stackId="a" fill={COLORS.warning} />
                      <Bar dataKey="No" stackId="a" fill={COLORS.danger} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
          </>
        )}
      </motion.div>
    </Layout>
  )
}
