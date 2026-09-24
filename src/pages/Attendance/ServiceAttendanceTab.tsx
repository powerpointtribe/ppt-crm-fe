import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import {
  QrCode,
  Users,
  UserCheck,
  Search,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Trash2,
  RefreshCw,
  AlertTriangle,
  MapPin,
  Calendar,
  UserX,
  Loader2,
  Plus,
  ArrowLeft,
  X,
} from 'lucide-react'
import {
  serviceAttendanceService,
  ServiceType,
  SERVICE_TYPE_LABELS,
  CREATE_SERVICE_TYPES,
} from '@/services/service-attendance'
import type { AttendanceRecord } from '@/services/service-attendance'
import { membersService } from '@/services/members-unified'
import { branchesService } from '@/services/branches'
import { showToast } from '@/utils/toast'
import { useAppStore } from '@/store'
import { useAuth } from '@/contexts/AuthContext-unified'
import type { Member } from '@/types'

interface ServiceSession {
  serviceDate: string
  serviceType: ServiceType
  serviceTitle: string | null
  totalCheckedIn: number
  totalPresent: number
  totalLate: number
  totalAbsent: number
  total: number
  lastCheckIn: string | null
}

type View = 'listing' | 'create' | 'detail'

export default function ServiceAttendanceTab() {
  const { currentUser } = useAppStore()
  const { hasPermission } = useAuth()

  const [view, setView] = useState<View>('listing')

  const [branchId, setBranchId] = useState('')
  const [branchName, setBranchName] = useState('')
  const [branchOptions, setBranchOptions] = useState<{ _id: string; name: string }[]>([])
  const canViewAllBranches = hasPermission('branches:view-all')

  const [serviceDate, setServiceDate] = useState(
    new Date().toISOString().split('T')[0],
  )
  const [serviceType, setServiceType] = useState<ServiceType>(
    ServiceType.SUNDAY_SERVICE,
  )
  const [serviceTitle, setServiceTitle] = useState('')

  const [sessions, setSessions] = useState<ServiceSession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionsTotal, setSessionsTotal] = useState(0)

  const [activeSession, setActiveSession] = useState<ServiceSession | null>(null)
  const [attendees, setAttendees] = useState<AttendanceRecord[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [mode, setMode] = useState<'qr' | 'manual'>('qr')

  const [copied, setCopied] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Member[]>([])
  const [searching, setSearching] = useState(false)
  const [checkingIn, setCheckingIn] = useState<string | null>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>()
  const [markingAbsent, setMarkingAbsent] = useState(false)

  useEffect(() => {
    if (currentUser?.branch) {
      const bid =
        typeof currentUser.branch === 'object'
          ? (currentUser.branch as any)._id
          : currentUser.branch
      setBranchId(bid)
      if (typeof currentUser.branch === 'object') {
        setBranchName((currentUser.branch as any).name || '')
      } else {
        branchesService.getBranches().then((list) => {
          const found = list.find((b: any) => b._id === bid)
          if (found) setBranchName(found.name)
        }).catch(() => {})
      }
    }
    if (canViewAllBranches) {
      branchesService.getBranchesForSelector().then((list) => {
        setBranchOptions(list)
        if (!branchId && list.length > 0) {
          setBranchId(list[0]._id)
          setBranchName(list[0].name)
        }
      }).catch(() => {})
    }
  }, [currentUser, canViewAllBranches])

  const loadSessions = useCallback(async () => {
    if (!branchId) return
    setSessionsLoading(true)
    try {
      const result = await serviceAttendanceService.getServiceSessions({
        branch: branchId,
        limit: 20,
      })
      setSessions(result.data)
      setSessionsTotal(result.total)
    } catch {
      setSessions([])
    } finally {
      setSessionsLoading(false)
    }
  }, [branchId])

  useEffect(() => { loadSessions() }, [loadSessions])

  const loadAttendees = useCallback(async () => {
    if (!activeSession) return
    setDetailLoading(true)
    try {
      const data = await serviceAttendanceService.getServiceAttendees(
        activeSession.serviceDate,
        activeSession.serviceType,
        branchId || undefined,
      )
      setAttendees(data)
    } catch {
      setAttendees([])
    } finally {
      setDetailLoading(false)
    }
  }, [activeSession, branchId])

  useEffect(() => {
    if (view === 'detail') loadAttendees()
  }, [view, loadAttendees])

  const baseUrl = window.location.origin
  const qrDate = view === 'detail' && activeSession ? activeSession.serviceDate.split('T')[0] : serviceDate
  const qrType = view === 'detail' && activeSession ? activeSession.serviceType : serviceType
  const qrTitle = view === 'detail' && activeSession ? (activeSession.serviceTitle || '') : serviceTitle
  const qrUrl = `${baseUrl}/check-in?branch=${branchId}&date=${qrDate}&type=${qrType}${qrTitle ? `&title=${encodeURIComponent(qrTitle)}` : ''}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl)
      setCopied(true)
      showToast.success('Check-in link copied')
      setTimeout(() => setCopied(false), 2000)
    } catch { showToast.error('Failed to copy link') }
  }

  const handleCreateSession = () => {
    const newSession: ServiceSession = {
      serviceDate: serviceDate + 'T00:00:00.000Z',
      serviceType,
      serviceTitle: serviceTitle || null,
      totalCheckedIn: 0,
      totalPresent: 0,
      totalLate: 0,
      totalAbsent: 0,
      total: 0,
      lastCheckIn: null,
    }
    setActiveSession(newSession)
    setView('detail')
    setMode('qr')
  }

  const handleOpenSession = (session: ServiceSession) => {
    setActiveSession(session)
    setView('detail')
    setMode('qr')
  }

  const handleBackToListing = () => {
    setView('listing')
    setActiveSession(null)
    setAttendees([])
    setSearchQuery('')
    setSearchResults([])
    loadSessions()
  }

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!query.trim()) { setSearchResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const result = await membersService.getMembers({ search: query, limit: 10, page: 1 })
        setSearchResults(result.items)
      } catch { setSearchResults([]) }
      finally { setSearching(false) }
    }, 300)
  }, [])

  const handleManualCheckIn = async (member: Member) => {
    if (!activeSession) return
    setCheckingIn(member._id)
    try {
      await serviceAttendanceService.checkIn({
        member: member._id,
        serviceDate: activeSession.serviceDate,
        serviceType: activeSession.serviceType,
        checkInMethod: 'manual',
        branch: branchId || undefined,
      })
      showToast.success(`${member.firstName} ${member.lastName} checked in`)
      setSearchQuery(''); setSearchResults([]); loadAttendees()
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to check in member'
      if (msg.includes('already')) showToast.info(`${member.firstName} is already checked in`)
      else showToast.error(msg)
    } finally { setCheckingIn(null) }
  }

  const handleDelete = async (id: string) => {
    try {
      await serviceAttendanceService.deleteRecord(id)
      showToast.success('Record removed'); loadAttendees()
    } catch { showToast.error('Failed to remove record') }
  }

  const handleMarkAbsent = async () => {
    if (!activeSession) return
    setMarkingAbsent(true)
    try {
      const result = await serviceAttendanceService.markAbsentees({
        serviceDate: activeSession.serviceDate,
        serviceType: activeSession.serviceType,
        branch: branchId || undefined,
      })
      showToast.success(`${result.marked} members marked absent`); loadAttendees()
    } catch (err: any) {
      showToast.error(err?.response?.data?.message || 'Failed to mark absentees')
    } finally { setMarkingAbsent(false) }
  }

  const alreadyCheckedIn = new Set(
    attendees.map((a) => typeof a.member === 'object' ? a.member._id : a.member),
  )

  const checkedIn = attendees.filter((a) => a.status !== 'absent')
  const late = attendees.filter((a) => a.status === 'late')

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    })

  const inputClass = 'w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400'

  // ─── CREATE VIEW ───────────────────────────────────────
  if (view === 'create') {
    return (
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => setView('listing')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to listing
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            New Service Attendance
          </h2>

          {canViewAllBranches && branchOptions.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Campus</label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <select
                  value={branchId}
                  onChange={(e) => {
                    setBranchId(e.target.value)
                    setBranchName(branchOptions.find((b) => b._id === e.target.value)?.name || '')
                  }}
                  className={inputClass + ' appearance-none cursor-pointer pr-7'}
                >
                  {branchOptions.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Service type</label>
            <div className="relative">
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                className={inputClass + ' pl-3 appearance-none cursor-pointer pr-7'}
              >
                {CREATE_SERVICE_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              {serviceType === ServiceType.OTHER ? 'Specify the service type' : 'Title (optional)'}
            </label>
            <input
              type="text"
              value={serviceTitle}
              onChange={(e) => setServiceTitle(e.target.value)}
              placeholder={serviceType === ServiceType.OTHER ? 'e.g. Prayer Meeting' : 'e.g. Thanksgiving Service'}
              className={inputClass + ' pl-3'}
            />
          </div>

          <button
            onClick={handleCreateSession}
            disabled={!serviceDate || !branchId || (serviceType === ServiceType.OTHER && !serviceTitle.trim())}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition"
          >
            Generate QR Code
          </button>
        </div>
      </div>
    )
  }

  // ─── DETAIL VIEW ───────────────────────────────────────
  if (view === 'detail' && activeSession) {
    const sessionTitle = activeSession.serviceTitle || SERVICE_TYPE_LABELS[activeSession.serviceType] || activeSession.serviceType
    const sessionDate = formatDate(activeSession.serviceDate)

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToListing}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">
              {sessionTitle}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {sessionDate}
              {branchName && ` · ${branchName}`}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-xs font-medium tabular-nums bg-gray-50 dark:bg-gray-800 px-2.5 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
            <span className="text-emerald-600 dark:text-emerald-400">{checkedIn.length}</span>
            <span className="text-gray-300 dark:text-gray-600">checked in</span>
          </div>
          <button
            onClick={loadAttendees}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left — Check-in panel */}
          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="flex border-b border-gray-100 dark:border-gray-700">
                {([
                  { key: 'qr' as const, icon: QrCode, label: 'QR Code' },
                  { key: 'manual' as const, icon: UserCheck, label: 'Manual' },
                ]).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setMode(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition ${
                      mode === tab.key
                        ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500'
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-4">
                <AnimatePresence mode="wait">
                  {mode === 'qr' ? (
                    <motion.div
                      key="qr"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="flex flex-col items-center"
                    >
                      {branchId ? (
                        <>
                          <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                            <QRCodeSVG value={qrUrl} size={180} level="M" includeMargin />
                          </div>
                          <p className="mt-2.5 text-[11px] text-gray-500 dark:text-gray-400 text-center">
                            Scan to check in · {SERVICE_TYPE_LABELS[qrType as ServiceType]}
                          </p>
                          <button
                            onClick={handleCopyLink}
                            className="mt-2 flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/25 px-2.5 py-1 rounded-md transition"
                          >
                            {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy link</>}
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-6 text-gray-400">
                          <AlertTriangle className="w-6 h-6" />
                          <p className="text-xs">No campus associated</p>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="manual"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                    >
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
                          placeholder="Search name, email, phone..."
                          className={inputClass}
                        />
                        {searchQuery && (
                          <button
                            onClick={() => { setSearchQuery(''); setSearchResults([]) }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-300 hover:text-gray-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="mt-2 max-h-[320px] overflow-y-auto space-y-0.5">
                        {searching && (
                          <div className="text-center py-5 text-xs text-gray-400">
                            <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                            Searching...
                          </div>
                        )}
                        {!searching && searchQuery && searchResults.length === 0 && (
                          <div className="text-center py-5 text-xs text-gray-400">No members found</div>
                        )}
                        {searchResults.map((member) => {
                          const isIn = alreadyCheckedIn.has(member._id)
                          return (
                            <div
                              key={member._id}
                              className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg transition ${
                                isIn
                                  ? 'bg-emerald-50/60 dark:bg-emerald-900/10'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">
                                  {member.firstName} {member.lastName}
                                </p>
                                <p className="text-[11px] text-gray-400 truncate">
                                  {member.phone || member.email || '—'}
                                </p>
                              </div>
                              {isIn ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              ) : (
                                <button
                                  onClick={() => handleManualCheckIn(member)}
                                  disabled={checkingIn === member._id}
                                  className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                                >
                                  {checkingIn === member._id ? '...' : 'Check in'}
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {hasPermission('attendance:bulk-record') && (
                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserX className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">Mark remaining absent</span>
                  </div>
                  <button
                    onClick={handleMarkAbsent}
                    disabled={markingAbsent}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-md text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50 transition"
                  >
                    {markingAbsent ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Mark absent'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right — Attendee list */}
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span className="text-[13px] font-semibold text-gray-900 dark:text-white">Checked In</span>
                  <span className="text-[11px] bg-indigo-50 dark:bg-indigo-900/25 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-semibold tabular-nums">
                    {checkedIn.length}
                  </span>
                </div>
                {late.length > 0 && (
                  <span className="flex items-center gap-1 text-[11px] text-amber-500 font-medium">
                    <Clock className="w-3 h-3" /> {late.length} late
                  </span>
                )}
              </div>

              <div className="max-h-[520px] overflow-y-auto">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 text-gray-300 dark:text-gray-600 animate-spin" />
                  </div>
                ) : checkedIn.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-gray-400 dark:text-gray-500">
                    <UserCheck className="w-8 h-8 text-gray-200 dark:text-gray-700 mb-2" />
                    <p className="text-sm">No one checked in yet</p>
                    <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-0.5">
                      Share the QR code or check in manually
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-gray-700/40">
                    {checkedIn.map((record) => {
                      const m = record.member
                      return (
                        <div
                          key={record._id}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50/60 dark:hover:bg-gray-700/20 transition group"
                        >
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-indigo-800/20 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                            {m.firstName?.[0]}{m.lastName?.[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate leading-tight">
                              {m.firstName} {m.lastName}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate leading-tight">
                              {m.phone || m.email || '—'}
                            </p>
                          </div>
                          <span
                            className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                              record.status === 'late'
                                ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/25 dark:text-amber-400'
                                : record.checkInMethod === 'qr'
                                  ? 'bg-violet-50 text-violet-600 dark:bg-violet-900/25 dark:text-violet-400'
                                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-400'
                            }`}
                          >
                            {record.status === 'late' ? (
                              <><Clock className="w-2.5 h-2.5" /> Late</>
                            ) : record.checkInMethod === 'qr' ? (
                              <><QrCode className="w-2.5 h-2.5" /> QR</>
                            ) : (
                              <><UserCheck className="w-2.5 h-2.5" /> Manual</>
                            )}
                          </span>
                          <span className="hidden md:block text-[11px] text-gray-400 tabular-nums w-12 text-right">
                            {record.checkInTime
                              ? new Date(record.checkInTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                              : '—'}
                          </span>
                          <button
                            onClick={() => handleDelete(record._id)}
                            className="p-1 rounded-md text-gray-200 dark:text-gray-700 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/15 transition"
                            title="Remove"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── LISTING VIEW (default) ────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {canViewAllBranches && branchOptions.length > 0 && (
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <select
                value={branchId}
                onChange={(e) => {
                  setBranchId(e.target.value)
                  setBranchName(branchOptions.find((b) => b._id === e.target.value)?.name || '')
                }}
                className="pl-8 pr-7 py-1.5 text-[13px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 appearance-none cursor-pointer"
                style={{ minWidth: 140 }}
              >
                {branchOptions.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          )}
          <button
            onClick={loadSessions}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => setView('create')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
        >
          <Plus className="w-3.5 h-3.5" />
          New attendance
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {sessionsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 text-gray-300 dark:text-gray-600 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
            <Calendar className="w-8 h-8 text-gray-200 dark:text-gray-700 mb-2" />
            <p className="text-sm font-medium">No attendance sessions yet</p>
            <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">
              Create one to start tracking attendance
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-700/40">
            {sessions.map((session, i) => {
              const title = session.serviceTitle || SERVICE_TYPE_LABELS[session.serviceType] || session.serviceType
              const year = new Date(session.serviceDate).getFullYear()
              const showYear = year !== new Date().getFullYear()

              return (
                <button
                  key={`${session.serviceDate}-${session.serviceType}-${i}`}
                  onClick={() => handleOpenSession(session)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 dark:hover:bg-gray-700/20 transition text-left group"
                >
                  <div className="w-11 h-11 rounded-lg bg-indigo-50 dark:bg-indigo-900/25 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase leading-none">
                      {new Date(session.serviceDate).toLocaleDateString('en-GB', { month: 'short' })}
                    </span>
                    <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 leading-tight">
                      {new Date(session.serviceDate).getDate()}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                      {title}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">
                      {SERVICE_TYPE_LABELS[session.serviceType]}
                      {showYear && ` · ${year}`}
                    </p>
                  </div>

                  <div className="hidden sm:flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                        {session.totalCheckedIn}
                      </p>
                      <p className="text-[10px] text-gray-400">checked in</p>
                    </div>
                    {session.totalLate > 0 && (
                      <div className="text-right">
                        <p className="text-sm font-bold text-amber-500 tabular-nums">
                          {session.totalLate}
                        </p>
                        <p className="text-[10px] text-gray-400">late</p>
                      </div>
                    )}
                    {session.totalAbsent > 0 && (
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-400 dark:text-gray-500 tabular-nums">
                          {session.totalAbsent}
                        </p>
                        <p className="text-[10px] text-gray-400">absent</p>
                      </div>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 transition shrink-0" />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {sessionsTotal > 20 && (
        <p className="text-center text-[11px] text-gray-400">
          Showing {sessions.length} of {sessionsTotal} sessions
        </p>
      )}
    </div>
  )
}
