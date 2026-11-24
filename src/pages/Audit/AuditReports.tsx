import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Download, FileText, AlertTriangle, Users, Activity, RefreshCw } from 'lucide-react'

import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { auditService, AuditStatistics } from '@/services/audit'
import { showToast } from '@/utils/toast'

type RangeKey = '7d' | '30d' | '90d' | 'custom'

const RANGES: Array<{ key: RangeKey; label: string; days?: number }> = [
  { key: '7d', label: 'Last 7 days', days: 7 },
  { key: '30d', label: 'Last 30 days', days: 30 },
  { key: '90d', label: 'Last 90 days', days: 90 },
  { key: 'custom', label: 'Custom' },
]

const isoDay = (d: Date) => d.toISOString().slice(0, 10)
const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}
const pretty = (s?: string) => (s ? s.replace(/_/g, ' ') : 'Unknown')

function BreakdownList({
  title,
  rows,
  barClass = 'bg-blue-600',
}: {
  title: string
  rows: Array<{ label: string; count: number; percentage: number }>
  barClass?: string
}) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">No data for this period</p>
      ) : (
        <div className="space-y-3">
          {rows.map(row => (
            <div key={row.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-800 dark:text-gray-200 capitalize">{row.label}</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {row.count.toLocaleString()}{' '}
                  <span className="text-xs text-gray-400">({row.percentage.toFixed(1)}%)</span>
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${barClass} rounded-full`}
                  style={{ width: `${Math.min(100, row.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function StatTile({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className="text-gray-400">{icon}</div>
      </div>
    </Card>
  )
}

export default function AuditReports() {
  const [range, setRange] = useState<RangeKey>('30d')
  const [startDate, setStartDate] = useState(isoDay(daysAgo(30)))
  const [endDate, setEndDate] = useState(isoDay(new Date()))
  const [stats, setStats] = useState<AuditStatistics | null>(null)
  const [failedCount, setFailedCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState<'csv' | 'json' | null>(null)

  // Send the end date as end-of-day so "today" is included
  const params = useCallback(
    () => ({
      startDate: new Date(`${startDate}T00:00:00`).toISOString(),
      endDate: new Date(`${endDate}T23:59:59.999`).toISOString(),
    }),
    [startDate, endDate]
  )

  const load = useCallback(async () => {
    if (startDate > endDate) {
      setError('Start date must be before end date')
      return
    }
    try {
      setLoading(true)
      setError(null)
      const p = params()
      const [s, failed] = await Promise.all([
        auditService.getStatistics(p),
        // Statistics endpoint doesn't report failures, so count them via the logs endpoint
        auditService.getFailedActions({ ...p, limit: 1 }).catch(() => null),
      ])
      setStats(s)
      setFailedCount(failed ? failed.pagination.total : null)
    } catch (err: any) {
      console.error('Error loading audit report:', err)
      setError(err?.response?.data?.message || err?.message || 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }, [params, startDate, endDate])

  useEffect(() => {
    load()
  }, [load])

  const pickRange = (key: RangeKey) => {
    setRange(key)
    const days = RANGES.find(r => r.key === key)?.days
    if (days) {
      setStartDate(isoDay(daysAgo(days)))
      setEndDate(isoDay(new Date()))
    }
  }

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      setExporting(format)
      const blob = await auditService.exportLogs(params(), format)
      const file = blob instanceof Blob ? blob : new Blob([JSON.stringify(blob, null, 2)])
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-report-${startDate}-to-${endDate}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting audit logs:', err)
      showToast.error('Export failed. Please try again.')
    } finally {
      setExporting(null)
    }
  }

  const maxDaily = Math.max(1, ...(stats?.activityByDay ?? []).map(d => d.count))

  return (
    <Layout title="Audit Reports" subtitle="Activity summaries over a date range">
      <div className="space-y-6">
        {/* Controls */}
        <Card className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-wrap gap-2">
              {RANGES.map(r => (
                <Button
                  key={r.key}
                  size="sm"
                  variant={range === r.key ? 'primary' : 'outline'}
                  onClick={() => pickRange(r.key)}
                >
                  {r.label}
                </Button>
              ))}
            </div>
            {range === 'custom' && (
              <div className="flex gap-2 items-end">
                <Input type="date" label="From" value={startDate} max={endDate} onChange={e => setStartDate(e.target.value)} />
                <Input type="date" label="To" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            )}
            <div className="flex gap-2 ml-auto">
              <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleExport('csv')} disabled={!!exporting}>
                <Download className="h-4 w-4 mr-2" />
                {exporting === 'csv' ? 'Exporting…' : 'CSV'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleExport('json')} disabled={!!exporting}>
                <Download className="h-4 w-4 mr-2" />
                {exporting === 'json' ? 'Exporting…' : 'JSON'}
              </Button>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={load}>
              Retry
            </Button>
          </Card>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatTile label="Total events" value={stats.totalLogs.toLocaleString()} icon={<FileText className="h-6 w-6" />} />
              <StatTile
                label="Failed actions"
                value={failedCount == null ? '—' : failedCount.toLocaleString()}
                icon={<AlertTriangle className="h-6 w-6" />}
              />
              <StatTile label="Active users" value={stats.uniqueUsers} icon={<Users className="h-6 w-6" />} />
              <StatTile
                label="Avg. per day"
                value={
                  stats.activityByDay.length
                    ? Math.round(stats.totalLogs / stats.activityByDay.length).toLocaleString()
                    : 0
                }
                icon={<Activity className="h-6 w-6" />}
              />
            </div>

            {/* Daily activity */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Daily activity</h3>
              {stats.activityByDay.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No activity in this period</p>
              ) : (
                <div className="flex items-end gap-1 h-40 overflow-x-auto">
                  {[...stats.activityByDay]
                    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
                    .map(d => (
                      <div
                        key={d.date}
                        className="flex-1 min-w-[8px] bg-blue-500 hover:bg-blue-600 rounded-t"
                        style={{ height: `${(d.count / maxDaily) * 100}%` }}
                        title={`${d.date}: ${d.count.toLocaleString()} events`}
                      />
                    ))}
                </div>
              )}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BreakdownList
                title="Top actions"
                rows={stats.topActions.map(a => ({ label: pretty(a.action), count: a.count, percentage: a.percentage }))}
              />
              <BreakdownList
                title="By entity"
                rows={stats.entityBreakdown.map(e => ({ label: pretty(e.entity), count: e.count, percentage: e.percentage }))}
                barClass="bg-purple-600"
              />
              <BreakdownList
                title="By severity"
                rows={stats.severityBreakdown.map(s => ({ label: pretty(s.severity), count: s.count, percentage: s.percentage }))}
                barClass="bg-orange-500"
              />
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Most active users</h3>
                {stats.topUsers.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">No data for this period</p>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {stats.topUsers.slice(0, 10).map(u => (
                      <div key={u.user._id ?? u.user.email} className="flex justify-between py-2 text-sm">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {u.user.firstName} {u.user.lastName}
                          </p>
                          {u.user.email && <p className="text-xs text-gray-500">{u.user.email}</p>}
                        </div>
                        <span className="text-gray-600 dark:text-gray-400">{u.count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <div className="text-right">
              <Link to="/audit/logs" className="text-sm text-blue-600 hover:underline">
                Browse individual log entries →
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </Layout>
  )
}
