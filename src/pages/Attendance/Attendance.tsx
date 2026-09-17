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
  Trash2,
  RefreshCw,
  AlertTriangle,
  MapPin,
  Calendar,
  UserX,
  Loader2,
} from 'lucide-react'
import Layout from '@/components/Layout'
import {
  serviceAttendanceService,
  ServiceType,
  SERVICE_TYPE_LABELS,
} from '@/services/service-attendance'
import type { AttendanceRecord } from '@/services/service-attendance'
import { membersService } from '@/services/members-unified'
import { branchesService } from '@/services/branches'
import { showToast } from '@/utils/toast'
import { useAppStore } from '@/store'
import { useAuth } from '@/contexts/AuthContext-unified'
import type { Member } from '@/types'

export default function Attendance() {
  const { currentUser } = useAppStore()
  const { hasPermission } = useAuth()

  const [serviceDate, setServiceDate] = useState(
    new Date().toISOString().split('T')[0],
  )
  const [serviceType, setServiceType] = useState<ServiceType>(
    ServiceType.SUNDAY_FIRST_SERVICE,
  )
  const [attendees, setAttendees] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'qr' | 'manual'>('qr')

  const [serviceTitle, setServiceTitle] = useState('')

  // Branch / campus state
  const [branchId, setBranchId] = useState('')
  const [branchName, setBranchName] = useState('')
  const [branchOptions, setBranchOptions] = useState<
    { _id: string; name: string }[]
  >([])
  const canViewAllBranches = hasPermission('branches:view-all')

  // QR state
  const [copied, setCopied] = useState(false)

  // Manual check-in state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Member[]>([])
  const [searching, setSearching] = useState(false)
  const [checkingIn, setCheckingIn] = useState<string | null>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>()

  // Mark absent state
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
        branchesService
          .getBranches()
          .then((list) => {
            const found = list.find((b: any) => b._id === bid)
            if (found) setBranchName(found.name)
          })
          .catch(() => {})
      }
    }

    if (canViewAllBranches) {
      branchesService
        .getBranchesForSelector()
        .then((list) => {
          setBranchOptions(list)
          if (!branchId && list.length > 0) {
            setBranchId(list[0]._id)
            setBranchName(list[0].name)
          }
        })
        .catch(() => {})
    }
  }, [currentUser, canViewAllBranches])

  const loadAttendees = useCallback(async () => {
    if (!serviceDate || !serviceType) return
    setLoading(true)
    try {
      const data = await serviceAttendanceService.getServiceAttendees(
        serviceDate,
        serviceType,
      )
      setAttendees(data)
    } catch {
      setAttendees([])
    } finally {
      setLoading(false)
    }
  }, [serviceDate, serviceType])

  useEffect(() => {
    loadAttendees()
  }, [loadAttendees])

  // QR code URL
  const baseUrl = window.location.origin
  const qrUrl = `${baseUrl}/check-in?branch=${branchId}&date=${serviceDate}&type=${serviceType}${serviceTitle ? `&title=${encodeURIComponent(serviceTitle)}` : ''}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl)
      setCopied(true)
      showToast.success('Check-in link copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast.error('Failed to copy link')
    }
  }

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const result = await membersService.getMembers({
          search: query,
          limit: 10,
          page: 1,
        })
        setSearchResults(result.items)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [])

  const handleManualCheckIn = async (member: Member) => {
    setCheckingIn(member._id)
    try {
      await serviceAttendanceService.checkIn({
        member: member._id,
        serviceDate,
        serviceType,
        checkInMethod: 'manual',
      })
      showToast.success(`${member.firstName} ${member.lastName} checked in`)
      setSearchQuery('')
      setSearchResults([])
      loadAttendees()
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'Failed to check in member'
      if (msg.includes('already')) {
        showToast.info(`${member.firstName} is already checked in`)
      } else {
        showToast.error(msg)
      }
    } finally {
      setCheckingIn(null)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await serviceAttendanceService.deleteRecord(id)
      showToast.success('Record removed')
      loadAttendees()
    } catch {
      showToast.error('Failed to remove record')
    }
  }

  const handleMarkAbsent = async () => {
    setMarkingAbsent(true)
    try {
      const result = await serviceAttendanceService.markAbsentees({
        serviceDate,
        serviceType,
      })
      showToast.success(`${result.marked} members marked absent`)
      loadAttendees()
    } catch (err: any) {
      showToast.error(
        err?.response?.data?.message || 'Failed to mark absentees',
      )
    } finally {
      setMarkingAbsent(false)
    }
  }

  const alreadyCheckedIn = new Set(
    attendees.map((a) =>
      typeof a.member === 'object' ? a.member._id : a.member,
    ),
  )

  const presentCount = attendees.filter((a) => a.status === 'present').length
  const lateCount = attendees.filter((a) => a.status === 'late').length
  const absentCount = attendees.filter((a) => a.status === 'absent').length

  const formattedDate = serviceDate
    ? new Date(serviceDate + 'T00:00:00').toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : ''

  return (
    <Layout
      title="Service Attendance"
      subtitle="Record and track attendance for services"
    >
      <div className="space-y-5">
        {/* Controls bar */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4"
        >
          <div className="flex flex-wrap items-end gap-3">
            {/* Campus selector — only for multi-campus users */}
            {canViewAllBranches && branchOptions.length > 0 && (
              <div className="min-w-[160px]">
                <label className="block text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                  Campus
                </label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <select
                    value={branchId}
                    onChange={(e) => {
                      setBranchId(e.target.value)
                      const found = branchOptions.find(
                        (b) => b._id === e.target.value,
                      )
                      setBranchName(found?.name || '')
                    }}
                    className="w-full pl-8 pr-8 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 appearance-none cursor-pointer"
                  >
                    {branchOptions.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Date */}
            <div className="min-w-[150px]">
              <label className="block text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                />
              </div>
            </div>

            {/* Service type */}
            <div className="min-w-[170px]">
              <label className="block text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Service
              </label>
              <div className="relative">
                <select
                  value={serviceType}
                  onChange={(e) =>
                    setServiceType(e.target.value as ServiceType)
                  }
                  className="w-full px-3 py-2 pr-8 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 appearance-none cursor-pointer"
                >
                  {Object.entries(SERVICE_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Service title */}
            <div className="min-w-[200px] flex-1">
              <label className="block text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Service Title
              </label>
              <input
                type="text"
                value={serviceTitle}
                onChange={(e) => setServiceTitle(e.target.value)}
                placeholder="e.g. The Blessing"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 placeholder:text-gray-400"
              />
            </div>

            {/* Stats pills + actions — pushed right */}
            <div className="flex items-center gap-2 ml-auto">
              <div className="hidden sm:flex items-center gap-1.5 text-xs bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-lg">
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-semibold text-gray-900 dark:text-white tabular-nums">
                  {presentCount}
                </span>
                {lateCount > 0 && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-semibold text-gray-900 dark:text-white tabular-nums">
                      {lateCount}
                    </span>
                  </>
                )}
                {absentCount > 0 && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <UserX className="w-3.5 h-3.5 text-red-400" />
                    <span className="font-semibold text-gray-900 dark:text-white tabular-nums">
                      {absentCount}
                    </span>
                  </>
                )}
              </div>
              <button
                onClick={loadAttendees}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left — QR / Manual check-in */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="lg:col-span-2 space-y-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-gray-100 dark:border-gray-700">
                {(['qr', 'manual'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
                      activeTab === tab
                        ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 bg-indigo-50/40 dark:bg-indigo-900/15'
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab === 'qr' ? (
                      <QrCode className="w-3.5 h-3.5" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5" />
                    )}
                    {tab === 'qr' ? 'QR Code' : 'Manual'}
                  </button>
                ))}
              </div>

              <div className="p-4">
                <AnimatePresence mode="wait">
                  {activeTab === 'qr' ? (
                    <motion.div
                      key="qr"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col items-center"
                    >
                      {branchId ? (
                        <>
                          {/* QR Code */}
                          <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                            <QRCodeSVG
                              value={qrUrl}
                              size={200}
                              level="M"
                              includeMargin
                            />
                          </div>

                          {/* Service info under QR */}
                          <div className="mt-3 text-center">
                            {serviceTitle && (
                              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
                                {serviceTitle}
                              </p>
                            )}
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              {SERVICE_TYPE_LABELS[serviceType]}
                            </p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                              {formattedDate}
                              {branchName && ` · ${branchName}`}
                            </p>
                          </div>

                          {/* Copy link */}
                          <button
                            onClick={handleCopyLink}
                            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/25 px-3 py-1.5 rounded-lg transition"
                          >
                            {copied ? (
                              <>
                                <Check className="w-3 h-3" /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" /> Copy link
                              </>
                            )}
                          </button>

                          {/* How it works */}
                          <div className="mt-4 w-full border-t border-gray-100 dark:border-gray-700 pt-3">
                            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                              How it works
                            </p>
                            <ol className="list-decimal pl-4 text-[11px] text-gray-400 dark:text-gray-500 space-y-0.5">
                              <li>Display this QR code on screen or projector</li>
                              <li>Members scan with their phone camera</li>
                              <li>They enter phone/email to check in</li>
                            </ol>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
                          <AlertTriangle className="w-7 h-7" />
                          <p className="text-xs">
                            No campus associated with your account
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="manual"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
                          placeholder="Search name, email, phone..."
                          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 placeholder:text-gray-400"
                        />
                      </div>

                      <div className="mt-2 max-h-[360px] overflow-y-auto space-y-1">
                        {searching && (
                          <div className="text-center py-6 text-xs text-gray-400">
                            <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                            Searching...
                          </div>
                        )}
                        {!searching &&
                          searchQuery &&
                          searchResults.length === 0 && (
                            <div className="text-center py-6 text-xs text-gray-400">
                              No members found
                            </div>
                          )}
                        {searchResults.map((member) => {
                          const isCheckedIn = alreadyCheckedIn.has(member._id)
                          return (
                            <div
                              key={member._id}
                              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition ${
                                isCheckedIn
                                  ? 'border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-900/10'
                                  : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {member.firstName} {member.lastName}
                                </p>
                                <p className="text-[11px] text-gray-400 truncate">
                                  {member.phone || member.email || '—'}
                                </p>
                              </div>
                              {isCheckedIn ? (
                                <span className="shrink-0 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Present
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleManualCheckIn(member)}
                                  disabled={checkingIn === member._id}
                                  className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                                >
                                  {checkingIn === member._id
                                    ? 'Marking...'
                                    : 'Mark Present'}
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
            </div>

            {/* Mark absent action card */}
            {hasPermission('attendance:bulk-record') && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
                    <UserX className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Mark Absentees
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                      Mark all remaining active members as absent for this
                      service. This runs automatically 6 hours after service.
                    </p>
                    <button
                      onClick={handleMarkAbsent}
                      disabled={markingAbsent}
                      className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-orange-200 dark:border-orange-800/40 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50 transition"
                    >
                      {markingAbsent ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Marking...
                        </span>
                      ) : (
                        'Mark absent now'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Right — Attendee list */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="lg:col-span-3"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Attendees
                  </h3>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full font-medium tabular-nums">
                    {attendees.filter((a) => a.status !== 'absent').length}
                  </span>
                </div>
              </div>

              <div className="max-h-[560px] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-5 h-5 text-gray-300 dark:text-gray-600 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-gray-400">
                      Loading attendees...
                    </p>
                  </div>
                ) : attendees.filter((a) => a.status !== 'absent').length ===
                  0 ? (
                  <div className="p-10 text-center">
                    <UserCheck className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      No one has checked in yet
                    </p>
                    <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-0.5">
                      Share the QR code or manually add attendees
                    </p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-sm z-10">
                      <tr>
                        <th className="text-left px-4 py-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          Member
                        </th>
                        <th className="text-left px-4 py-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                          Status
                        </th>
                        <th className="text-left px-4 py-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                          Time
                        </th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                      {attendees
                        .filter((a) => a.status !== 'absent')
                        .map((record) => {
                          const m = record.member
                          return (
                            <tr
                              key={record._id}
                              className="hover:bg-gray-50/60 dark:hover:bg-gray-750/40 transition"
                            >
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[11px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                                    {m.firstName?.[0]}
                                    {m.lastName?.[0]}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate leading-tight">
                                      {m.firstName} {m.lastName}
                                    </p>
                                    <p className="text-[11px] text-gray-400 truncate">
                                      {m.phone || m.email || '—'}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 hidden sm:table-cell">
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                    record.status === 'late'
                                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/25 dark:text-amber-400'
                                      : record.checkInMethod === 'qr'
                                        ? 'bg-violet-50 text-violet-600 dark:bg-violet-900/25 dark:text-violet-400'
                                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-400'
                                  }`}
                                >
                                  {record.status === 'late' ? (
                                    <Clock className="w-3 h-3" />
                                  ) : record.checkInMethod === 'qr' ? (
                                    <QrCode className="w-3 h-3" />
                                  ) : (
                                    <UserCheck className="w-3 h-3" />
                                  )}
                                  {record.status === 'late'
                                    ? 'Late'
                                    : record.checkInMethod === 'qr'
                                      ? 'QR'
                                      : 'Manual'}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 hidden sm:table-cell">
                                <span className="text-[11px] text-gray-400 tabular-nums">
                                  {record.checkInTime
                                    ? new Date(
                                        record.checkInTime,
                                      ).toLocaleTimeString('en-GB', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : '—'}
                                </span>
                              </td>
                              <td className="px-2 py-2.5">
                                <button
                                  onClick={() => handleDelete(record._id)}
                                  className="p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/15 transition"
                                  title="Remove"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}
