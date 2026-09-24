import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Calendar,
  TrendingUp,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react'
import { serviceAttendanceService } from '@/services/service-attendance'
import { showToast } from '@/utils/toast'

interface GroupOverview {
  _id: string
  name: string
  type: string
  memberCount: number
  leader: string | null
  totalMeetings: number
  lastMeetingDate: string | null
  avgAttendanceRate: number
}

interface MeetingHistory {
  date: string
  present: number
  absent: number
  total: number
  rate: number
}

type SortKey = 'name' | 'totalMeetings' | 'avgAttendanceRate' | 'lastMeetingDate'

export default function GroupMeetingOverview() {
  const [groups, setGroups] = useState<GroupOverview[]>([])
  const [uniqueMemberCount, setUniqueMemberCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'district' | 'unit'>('all')
  const [sortBy, setSortBy] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [history, setHistory] = useState<Record<string, MeetingHistory[]>>({})
  const [loadingHistory, setLoadingHistory] = useState<string | null>(null)

  useEffect(() => {
    loadOverview()
  }, [])

  const loadOverview = async () => {
    try {
      setLoading(true)
      const data = await serviceAttendanceService.getGroupMeetingOverview()
      setGroups(data.groups)
      setUniqueMemberCount(data.uniqueMemberCount)
    } catch {
      showToast.error('Failed to load meeting overview')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = async (groupId: string) => {
    if (expandedId === groupId) {
      setExpandedId(null)
      return
    }
    setExpandedId(groupId)
    if (!history[groupId]) {
      setLoadingHistory(groupId)
      try {
        const data = await serviceAttendanceService.getGroupMeetingHistory(groupId, 10)
        setHistory((prev) => ({ ...prev, [groupId]: data }))
      } catch {
        showToast.error('Failed to load meeting history')
      } finally {
        setLoadingHistory(null)
      }
    }
  }

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }

  const filtered = filter === 'all' ? groups : groups.filter((g) => g.type === filter)

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    switch (sortBy) {
      case 'name':
        return dir * a.name.localeCompare(b.name)
      case 'totalMeetings':
        return dir * (a.totalMeetings - b.totalMeetings)
      case 'avgAttendanceRate':
        return dir * (a.avgAttendanceRate - b.avgAttendanceRate)
      case 'lastMeetingDate': {
        const da = a.lastMeetingDate ? new Date(a.lastMeetingDate).getTime() : 0
        const db = b.lastMeetingDate ? new Date(b.lastMeetingDate).getTime() : 0
        return dir * (da - db)
      }
      default:
        return 0
    }
  })

  const totalMeetings = groups.reduce((s, g) => s + g.totalMeetings, 0)
  const totalMembers = uniqueMemberCount
  const avgRate =
    groups.length > 0
      ? Math.round(groups.reduce((s, g) => s + g.avgAttendanceRate, 0) / groups.length)
      : 0
  const activeGroups = groups.filter((g) => g.totalMeetings > 0).length

  const SortIcon = ({ field }: { field: SortKey }) => {
    if (sortBy !== field) return null
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5" />
    )
  }

  const rateColor = (rate: number) => {
    if (rate >= 75) return 'text-emerald-600 dark:text-emerald-400'
    if (rate >= 50) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-500 dark:text-red-400'
  }

  const rateBg = (rate: number) => {
    if (rate >= 75) return 'bg-emerald-500'
    if (rate >= 50) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const frontendUrl = window.location.origin

  return (
      <div className="space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: 'Total Groups',
              value: groups.length,
              icon: Users,
              color: 'text-indigo-600 dark:text-indigo-400',
              bg: 'bg-indigo-50 dark:bg-indigo-900/20',
            },
            {
              label: 'Total Meetings',
              value: totalMeetings,
              icon: ClipboardCheck,
              color: 'text-emerald-600 dark:text-emerald-400',
              bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            },
            {
              label: 'Total Members',
              value: totalMembers,
              icon: Users,
              color: 'text-blue-600 dark:text-blue-400',
              bg: 'bg-blue-50 dark:bg-blue-900/20',
            },
            {
              label: 'Avg Attendance',
              value: `${avgRate}%`,
              icon: TrendingUp,
              color: rateColor(avgRate),
              bg: avgRate >= 75
                ? 'bg-emerald-50 dark:bg-emerald-900/20'
                : avgRate >= 50
                  ? 'bg-amber-50 dark:bg-amber-900/20'
                  : 'bg-red-50 dark:bg-red-900/20',
            },
          ].map((card) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                  <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters + public link */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {(['all', 'district', 'unit'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  filter === f
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {f === 'all' ? 'All' : f === 'district' ? 'Districts' : 'Units'}
              </button>
            ))}
            <span className="text-xs text-gray-400 ml-1">
              {activeGroups}/{groups.length} have recorded meetings
            </span>
          </div>
          <a
            href={`${frontendUrl}/meeting-attendance`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Public attendance link
          </a>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-12 text-center">
            <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No {filter === 'all' ? 'groups' : filter === 'district' ? 'districts' : 'units'} found
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <button
                onClick={() => handleSort('name')}
                className="col-span-3 flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Group <SortIcon field="name" />
              </button>
              <div className="col-span-2">Leader</div>
              <div className="col-span-1 text-center">Members</div>
              <button
                onClick={() => handleSort('totalMeetings')}
                className="col-span-2 flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Meetings <SortIcon field="totalMeetings" />
              </button>
              <button
                onClick={() => handleSort('lastMeetingDate')}
                className="col-span-2 flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Last Meeting <SortIcon field="lastMeetingDate" />
              </button>
              <button
                onClick={() => handleSort('avgAttendanceRate')}
                className="col-span-2 flex items-center gap-1 justify-end hover:text-gray-700 dark:hover:text-gray-200"
              >
                Avg Rate <SortIcon field="avgAttendanceRate" />
              </button>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {sorted.map((group) => {
                const isExpanded = expandedId === group._id
                const meetings = history[group._id]
                const isLoadingThis = loadingHistory === group._id

                return (
                  <div key={group._id}>
                    <button
                      onClick={() => toggleExpand(group._id)}
                      className="w-full text-left px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
                    >
                      {/* Desktop */}
                      <div className="hidden md:grid md:grid-cols-12 gap-2 items-center">
                        <div className="col-span-3 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded uppercase tracking-wider ${
                              group.type === 'district'
                                ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                                : 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400'
                            }`}
                          >
                            {group.type === 'district' ? 'D' : 'U'}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {group.name}
                          </span>
                        </div>
                        <div className="col-span-2 text-sm text-gray-500 dark:text-gray-400 truncate">
                          {group.leader || '—'}
                        </div>
                        <div className="col-span-1 text-sm text-gray-600 dark:text-gray-300 text-center tabular-nums">
                          {group.memberCount}
                        </div>
                        <div className="col-span-2 text-sm text-gray-600 dark:text-gray-300 tabular-nums">
                          {group.totalMeetings}
                        </div>
                        <div className="col-span-2 text-sm text-gray-500 dark:text-gray-400">
                          {group.lastMeetingDate
                            ? new Date(group.lastMeetingDate).toLocaleDateString()
                            : '—'}
                        </div>
                        <div className="col-span-2 flex items-center justify-end gap-2">
                          {group.totalMeetings > 0 ? (
                            <>
                              <div className="w-16 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${rateBg(group.avgAttendanceRate)}`}
                                  style={{ width: `${group.avgAttendanceRate}%` }}
                                />
                              </div>
                              <span className={`text-sm font-semibold tabular-nums ${rateColor(group.avgAttendanceRate)}`}>
                                {group.avgAttendanceRate}%
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-gray-300 dark:text-gray-600">
                              No data
                            </span>
                          )}
                          <ChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </div>
                      </div>

                      {/* Mobile */}
                      <div className="md:hidden space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded uppercase tracking-wider ${
                                group.type === 'district'
                                  ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                                  : 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400'
                              }`}
                            >
                              {group.type === 'district' ? 'District' : 'Unit'}
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {group.name}
                            </span>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>{group.leader || 'No leader'}</span>
                          <span>{group.memberCount} members</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">
                            {group.totalMeetings} meetings
                          </span>
                          {group.totalMeetings > 0 ? (
                            <span className={`font-semibold ${rateColor(group.avgAttendanceRate)}`}>
                              {group.avgAttendanceRate}% avg
                            </span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">No data</span>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded history */}
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700"
                      >
                        <div className="px-4 py-3">
                          {isLoadingThis ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : meetings && meetings.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Recent meetings
                              </p>
                              <div className="space-y-1.5">
                                {meetings.map((m, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white dark:bg-gray-800"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                      <span className="text-xs text-gray-700 dark:text-gray-300">
                                        {new Date(m.date).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs tabular-nums">
                                      <span className="text-emerald-600 dark:text-emerald-400">
                                        {m.present} present
                                      </span>
                                      <span className="text-gray-400">
                                        {m.absent} absent
                                      </span>
                                      <span className={`font-semibold ${rateColor(m.rate)}`}>
                                        {m.rate}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
                              No meetings recorded yet
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
  )
}
