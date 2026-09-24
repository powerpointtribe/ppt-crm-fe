import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  UserPlus,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  UserCheck,
  UserMinus,
  GraduationCap,
  Heart,
  Percent,
  BarChart3,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Building2,
  X,
  ChevronDown,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from 'recharts'
import Layout from '@/components/Layout'
import { gisService } from '@/services/gis'
import { branchesService } from '@/services/branches'
import { showToast } from '@/utils/toast'
import { useAppStore } from '@/store'
import type { GisDashboard, GisFunnel, GisSnapshot } from '@/types/gis'
import { FUNNEL_STAGES } from '@/types/gis'

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

interface BranchOption {
  _id: string
  name: string
}

export default function GISDashboard() {
  const [dashboard, setDashboard] = useState<GisDashboard | null>(null)
  const [trends, setTrends] = useState<GisSnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [filterBranch, setFilterBranch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [branchOptions, setBranchOptions] = useState<BranchOption[]>([])

  const { branches: storeBranches } = useAppStore()

  useEffect(() => {
    if (storeBranches.length > 0) {
      setBranchOptions(storeBranches.map((b) => ({ _id: b._id, name: b.name })))
    } else {
      branchesService.getBranches().then((list) => {
        setBranchOptions(list.map((b: any) => ({ _id: b._id, name: b.name })))
      }).catch(() => {})
    }
  }, [storeBranches])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const filters: { branch?: string; startDate?: string; endDate?: string } = {}
      if (filterBranch) filters.branch = filterBranch
      if (startDate) filters.startDate = new Date(startDate).toISOString()
      if (endDate) filters.endDate = new Date(endDate + 'T23:59:59').toISOString()

      const [dashData, trendData] = await Promise.all([
        gisService.getDashboard(filters),
        gisService.getTrends(6, 'weekly', filterBranch || undefined).catch(() => []),
      ])
      setDashboard(dashData)
      setTrends(trendData)
    } catch {
      showToast.error('Failed to load GIS dashboard')
    } finally {
      setLoading(false)
    }
  }, [filterBranch, startDate, endDate])

  useEffect(() => {
    loadData()
  }, [loadData])

  const activeBranchName = branchOptions.find((b) => b._id === filterBranch)?.name
  const hasFilters = !!(filterBranch || startDate || endDate)
  const hasDateRange = !!(startDate && endDate)
  const rangeDays = hasDateRange
    ? Math.round((new Date(endDate + 'T23:59:59').getTime() - new Date(startDate).getTime()) / 86400000)
    : null
  const periodLabel = rangeDays !== null ? `${rangeDays}-day` : null

  if (loading) return <LoadingSkeleton />

  if (!dashboard) {
    return (
      <Layout title="Growth Intelligence">
        <div className="flex flex-col items-center justify-center py-28 text-gray-400 dark:text-gray-500">
          <AlertTriangle className="w-10 h-10 mb-4" />
          <p className="text-base font-medium">Unable to load dashboard</p>
          <button
            onClick={loadData}
            className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      </Layout>
    )
  }

  const { metrics, funnel } = dashboard

  return (
    <Layout
      title="Growth Intelligence"
      subtitle="Church health metrics and growth funnel"
      actions={
        <button
          onClick={async () => {
            try {
              await gisService.triggerSnapshot(filterBranch || undefined)
              showToast.success('Snapshot captured')
              loadData()
            } catch {
              showToast.error('Failed to capture snapshot')
            }
          }}
          className="text-xs px-3.5 py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 transition flex items-center gap-1.5 font-medium"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Snapshot
        </button>
      }
    >
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        {/* Filter bar */}
        <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="pl-9 pr-8 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="">All Campuses</option>
              {branchOptions.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || new Date().toISOString().split('T')[0]}
                placeholder="Start date"
                title="Start date"
                className="pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
              />
            </div>
            <span className="text-xs text-gray-400">to</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={new Date().toISOString().split('T')[0]}
                placeholder="End date"
                title="End date"
                className="pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
              />
            </div>
          </div>
          {hasFilters && (
            <button
              onClick={() => { setFilterBranch(''); setStartDate(''); setEndDate('') }}
              className="text-xs px-3 py-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center gap-1.5 font-medium"
            >
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
          {hasFilters && (
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
              Showing {activeBranchName || 'all campuses'}
              {startDate && ` from ${new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
              {endDate && ` to ${new Date(endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
            </span>
          )}
        </motion.div>

        {/* Hero KPIs */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <HeroKPI
            label="Active Members"
            value={metrics.totalActiveMembers}
            format="number"
            icon={Users}
            accent="#6366F1"
          />
          <HeroKPI
            label="Avg Sunday Attendance"
            value={metrics.avgSundayAttendance}
            format="number"
            icon={UserCheck}
            accent="#3B82F6"
          />
          <HeroKPI
            label={periodLabel ? `Growth (${periodLabel})` : 'Month-over-Month Growth'}
            value={metrics.growthRate}
            format="percent-signed"
            icon={metrics.growthRate >= 0 ? TrendingUp : TrendingDown}
            accent={metrics.growthRate >= 0 ? '#10B981' : '#EF4444'}
          />
        </motion.div>

        {/* Metric categories — 2-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricGroup
            title="Outreach"
            metrics={[
              { label: periodLabel ? `First Timers (${periodLabel})` : 'First Timers This Month', value: metrics.firstTimerCount, icon: UserPlus },
              { label: 'Conversion Rate', value: metrics.firstTimerConversionRate, suffix: '%', icon: Target, sub: periodLabel ? `${periodLabel} window` : '90-day window' },
              { label: 'Follow-Up Rate', value: metrics.followUpRate, suffix: '%', icon: Percent, health: metrics.followUpRate >= 80 ? 'good' : metrics.followUpRate >= 50 ? 'warn' : 'bad' },
              { label: periodLabel ? `New Members (${periodLabel})` : 'New Members This Month', value: metrics.newMembersThisMonth, icon: UserPlus },
            ]}
          />
          <MetricGroup
            title="Retention"
            metrics={[
              { label: `${periodLabel || '90-Day'} Retention Rate`, value: metrics.retentionRate90Day, suffix: '%', icon: Heart, health: metrics.retentionRate90Day >= 70 ? 'good' : metrics.retentionRate90Day >= 50 ? 'warn' : 'bad' },
              { label: 'Regular Attendees', value: metrics.regularAttendees ?? 0, icon: UserCheck, sub: periodLabel ? `4+ services in ${periodLabel} range` : '4+ services in 90 days' },
              { label: 'Not Attending', value: metrics.inactiveMembers, icon: UserMinus, sub: periodLabel ? `No attendance in ${periodLabel} range` : 'No attendance in 60+ days', health: metrics.inactiveMembers > 20 ? 'bad' : metrics.inactiveMembers > 10 ? 'warn' : 'good' },
              { label: periodLabel ? `Attrition (${periodLabel})` : 'Monthly Attrition', value: metrics.attritionCount, icon: UserMinus, health: metrics.attritionCount > 5 ? 'bad' : metrics.attritionCount > 2 ? 'warn' : 'good' },
            ]}
          />
          <MetricGroup
            title="Discipleship"
            metrics={[
              { label: 'Small Group Participation', value: metrics.smallGroupParticipationRate, suffix: '%', icon: Users },
              { label: 'Serving Rate', value: metrics.servingRate, suffix: '%', icon: Activity, sub: 'Members assigned to a unit' },
              { label: 'District/Unit Participation', value: metrics.districtUnitParticipationRate ?? 0, suffix: '%', icon: Users, sub: 'Attended a district or unit meeting' },
              { label: 'In Training', value: metrics.leadershipPipelineCount, icon: GraduationCap, sub: 'Leadership pipeline' },
            ]}
          />
          <motion.div variants={fadeUp}>
            <FunnelCard funnel={funnel} />
          </motion.div>
        </div>

        {/* Exit Reasons */}
        {metrics.exitReasons?.length > 0 && (
          <motion.div variants={fadeUp}>
            <ExitReasonsCard reasons={metrics.exitReasons} periodLabel={periodLabel} />
          </motion.div>
        )}

        {/* Trend Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div variants={fadeUp}>
            <AttendanceTrendChart trends={trends} />
          </motion.div>
          <motion.div variants={fadeUp}>
            <FunnelTrendChart trends={trends} />
          </motion.div>
        </div>
      </motion.div>
    </Layout>
  )
}

/* ── Hero KPI ── */

function HeroKPI({
  label,
  value,
  format,
  icon: Icon,
  accent,
}: {
  label: string
  value: number
  format: 'number' | 'percent-signed'
  icon: typeof Users
  accent: string
}) {
  const formatted =
    format === 'percent-signed'
      ? `${value > 0 ? '+' : ''}${value}%`
      : value.toLocaleString()

  return (
    <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-6 py-5">
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
            {label}
          </p>
          <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tabular-nums leading-none">
            {formatted}
          </p>
        </div>
        <div
          className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${accent}14` }}
        >
          <Icon className="w-6 h-6" style={{ color: accent }} />
        </div>
      </div>
    </div>
  )
}

/* ── Metric Group ── */

interface CompactMetric {
  label: string
  value: number
  suffix?: string
  sub?: string
  icon: typeof Users
  health?: 'good' | 'warn' | 'bad'
}

function MetricGroup({ title, metrics }: { title: string; metrics: CompactMetric[] }) {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-5"
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-5">
        {metrics.map((m) => {
          const healthColor =
            m.health === 'good' ? 'bg-emerald-400' :
            m.health === 'warn' ? 'bg-amber-400' :
            m.health === 'bad' ? 'bg-red-400' : null

          return (
            <div key={m.label} className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <m.icon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.label}</span>
                {healthColor && <span className={`w-2 h-2 rounded-full ${healthColor} shrink-0`} />}
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums pl-[22px]">
                {m.value.toLocaleString()}{m.suffix || ''}
              </p>
              {m.sub && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 pl-[22px] mt-0.5">{m.sub}</p>
              )}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

/* ── Funnel Card ── */

function FunnelCard({ funnel }: { funnel: GisFunnel }) {
  const stages = FUNNEL_STAGES.map((s) => ({
    ...s,
    count: funnel[s.key as keyof GisFunnel],
  }))
  const max = Math.max(...stages.map((s) => s.count), 1)

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-5 h-full flex flex-col">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
        Growth Funnel
      </p>
      <div className="flex-1 flex flex-col justify-between gap-1.5">
        {stages.map((stage, idx) => {
          const pct = Math.max((stage.count / max) * 100, 10)
          const prev = idx > 0 ? stages[idx - 1].count : null
          const conv = prev && prev > 0 ? Math.round((stage.count / prev) * 100) : null

          return (
            <div key={stage.key} className="flex items-center gap-3">
              <span className="w-14 text-xs font-medium text-gray-500 dark:text-gray-400 text-right shrink-0">
                {stage.label}
              </span>
              <div className="flex-1 relative h-7">
                <div
                  className="absolute left-0 top-0 h-full rounded-md flex items-center px-3 transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: stage.color,
                    minWidth: 44,
                  }}
                >
                  <span className="text-xs font-bold text-white leading-none">
                    {stage.count.toLocaleString()}
                  </span>
                </div>
              </div>
              <span className="w-12 text-[11px] text-gray-400 text-right tabular-nums shrink-0">
                {conv !== null && (
                  <span className="flex items-center justify-end gap-0.5">
                    <ArrowRight className="w-2.5 h-2.5" />{conv}%
                  </span>
                )}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Exit Reasons Card ── */

function ExitReasonsCard({ reasons, periodLabel }: { reasons: { reason: string; count: number }[]; periodLabel: string | null }) {
  const total = reasons.reduce((sum, r) => sum + r.count, 0)

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Why Members Left
        </p>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {periodLabel ? `${periodLabel} range` : 'This month'} &middot; {total} total
        </span>
      </div>
      <div className="space-y-2.5">
        {reasons.map((r) => {
          const pct = total > 0 ? Math.round((r.count / total) * 100) : 0
          return (
            <div key={r.reason} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 dark:text-gray-300 min-w-0 truncate flex-1">
                {r.reason}
              </span>
              <div className="w-32 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden shrink-0">
                <div
                  className="h-full bg-red-400 dark:bg-red-500 rounded-full transition-all"
                  style={{ width: `${Math.max(pct, 4)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 tabular-nums w-12 text-right shrink-0">
                {r.count} ({pct}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Attendance Trend Chart ── */

function AttendanceTrendChart({ trends }: { trends: GisSnapshot[] }) {
  const data = trends.map((s) => ({
    date: new Date(s.snapshotDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    attendance: s.metrics?.avgSundayAttendance || 0,
    members: s.metrics?.totalActiveMembers || 0,
  }))

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Attendance Trend</h3>
        <p className="text-xs text-gray-400 mt-0.5">Weekly snapshots</p>
      </div>
      {data.length === 0 ? (
        <div className="h-52 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
          No snapshot data yet — appears after the first weekly snapshot
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="gisAttGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gisMembGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 10,
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                padding: '10px 14px',
              }}
            />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <Area
              type="monotone"
              dataKey="members"
              stroke="#10B981"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              fill="url(#gisMembGrad)"
              name="Active Members"
            />
            <Area
              type="monotone"
              dataKey="attendance"
              stroke="#6366F1"
              strokeWidth={2}
              fill="url(#gisAttGrad)"
              name="Sunday Attendance"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

/* ── Funnel Trend Chart ── */

function FunnelTrendChart({ trends }: { trends: GisSnapshot[] }) {
  const data = trends.map((s) => ({
    date: new Date(s.snapshotDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    connect: s.funnelCounts?.connect || 0,
    belong: s.funnelCounts?.belong || 0,
    serve: s.funnelCounts?.serve || 0,
    lead: s.funnelCounts?.lead || 0,
  }))

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Funnel Progression</h3>
        <p className="text-xs text-gray-400 mt-0.5">Key stages over time</p>
      </div>
      {data.length === 0 ? (
        <div className="h-52 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
          No snapshot data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 10,
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                padding: '10px 14px',
              }}
            />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <Bar dataKey="connect" fill="#8B5CF6" name="Connect" radius={[3, 3, 0, 0]} />
            <Bar dataKey="belong" fill="#06B6D4" name="Belong" radius={[3, 3, 0, 0]} />
            <Bar dataKey="serve" fill="#F59E0B" name="Serve" radius={[3, 3, 0, 0]} />
            <Bar dataKey="lead" fill="#EC4899" name="Lead" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

/* ── Loading Skeleton ── */

function LoadingSkeleton() {
  return (
    <Layout title="Growth Intelligence">
      <div className="animate-pulse space-y-6">
        <div className="flex gap-2.5">
          <div className="h-9 w-40 bg-gray-100 dark:bg-gray-800 rounded-lg" />
          <div className="h-9 w-40 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-52 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-72 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="h-72 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    </Layout>
  )
}
