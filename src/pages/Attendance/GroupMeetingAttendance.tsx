import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Check,
  X,
  CheckCircle2,
  Search,
  Calendar,
  Send,
  Mail,
  Lock,
  LogIn,
  ChevronDown,
} from 'lucide-react'
import { serviceAttendanceService } from '@/services/service-attendance'
import { Toaster } from 'react-hot-toast'
import { showToast } from '@/utils/toast'

interface GroupMember {
  _id: string
  firstName: string
  lastName: string
}

interface LeaderGroup {
  _id: string
  name: string
  type: string
  members: GroupMember[]
}

export default function GroupMeetingAttendance() {
  // Auth state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [leaderName, setLeaderName] = useState('')
  const [groups, setGroups] = useState<LeaderGroup[]>([])
  const [error, setError] = useState('')

  // Attendance state
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0])
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setVerifying(true)
    setError('')
    try {
      const result = await serviceAttendanceService.publicVerifyLeader(email, password)
      setAuthenticated(true)
      setLeaderName(`${result.leader.firstName} ${result.leader.lastName}`)
      setGroups(result.groups)
      if (result.groups.length === 1) {
        setSelectedGroupId(result.groups[0]._id)
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Verification failed'
      setError(msg)
    } finally {
      setVerifying(false)
    }
  }

  const selectedGroup = groups.find((g) => g._id === selectedGroupId)
  const members = selectedGroup?.members || []

  const filtered = search
    ? members.filter((m) =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()),
      )
    : members

  const toggleMember = (id: string) => {
    setPresentIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const markAll = () => setPresentIds(new Set(members.map((m) => m._id)))
  const clearAll = () => setPresentIds(new Set())

  const handleSubmit = async () => {
    if (!selectedGroupId || !meetingDate) return
    setSubmitting(true)
    try {
      const result = await serviceAttendanceService.publicRecordGroupMeeting({
        email,
        password,
        groupId: selectedGroupId,
        meetingDate: new Date(meetingDate).toISOString(),
        presentMemberIds: Array.from(presentIds),
      })
      showToast.success(
        `Attendance recorded: ${result.present} present, ${result.absent} absent` +
          (result.skipped > 0 ? ` (${result.skipped} already recorded)` : ''),
      )
      setSubmitted(true)
    } catch {
      showToast.error('Failed to record attendance')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNewSession = () => {
    setSubmitted(false)
    setPresentIds(new Set())
    if (groups.length > 1) setSelectedGroupId('')
  }

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <Toaster position="top-right" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Meeting Attendance
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Sign in to mark attendance for your district or unit
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              <LogIn className="w-4 h-4" />
              {verifying ? 'Verifying...' : 'Continue'}
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  // Attendance screen
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Meeting Attendance
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Welcome, {leaderName}
            </p>
          </div>
          <button
            onClick={() => {
              setAuthenticated(false)
              setEmail('')
              setPassword('')
              setGroups([])
              setSelectedGroupId('')
              setPresentIds(new Set())
              setSubmitted(false)
            }}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Group + Date selection */}
        <div className="flex flex-col sm:flex-row gap-3">
          {groups.length > 1 && (
            <div className="relative flex-1">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <select
                value={selectedGroupId}
                onChange={(e) => {
                  setSelectedGroupId(e.target.value)
                  setPresentIds(new Set())
                  setSubmitted(false)
                }}
                className="w-full pl-9 pr-8 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 appearance-none cursor-pointer"
              >
                <option value="">Select your group</option>
                {groups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name} ({g.type === 'district' ? 'District' : 'Unit'})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => { setMeetingDate(e.target.value); setSubmitted(false) }}
              max={new Date().toISOString().split('T')[0]}
              className="w-full sm:w-auto pl-9 pr-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
            />
          </div>
        </div>

        {/* Member list */}
        {selectedGroup && members.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedGroup.name}
                </span>
                <span className="text-xs text-gray-400 tabular-nums">
                  {presentIds.size}/{members.length} present
                </span>
              </div>
              {!submitted && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={markAll}
                    className="text-xs px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 font-medium transition"
                  >
                    All present
                  </button>
                  <button
                    onClick={clearAll}
                    className="text-xs px-2.5 py-1.5 rounded-md bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 font-medium transition"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Search */}
            {members.length > 8 && !submitted && (
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
                  />
                </div>
              </div>
            )}

            {/* Members */}
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50 max-h-[420px] overflow-y-auto">
              {filtered.map((member) => {
                const isPresent = presentIds.has(member._id)
                return (
                  <button
                    key={member._id}
                    onClick={() => !submitted && toggleMember(member._id)}
                    disabled={submitted}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      submitted
                        ? 'cursor-default'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer active:bg-gray-100 dark:active:bg-gray-700'
                    } ${isPresent ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isPresent
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {isPresent ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <X className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {member.firstName} {member.lastName}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                      isPresent
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}>
                      {isPresent ? 'Present' : 'Absent'}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Submit / Success */}
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
              {submitted ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-medium">Attendance recorded successfully</span>
                  </div>
                  <button
                    onClick={handleNewSession}
                    className="text-xs px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 font-medium transition"
                  >
                    Record another
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-400">
                    Tap members to mark present, then submit
                  </span>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Submitting...' : 'Submit Attendance'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {selectedGroup && members.length === 0 && (
          <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-8 text-center">
            <Users className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No members in this group yet
            </p>
          </div>
        )}

        {!selectedGroupId && groups.length > 1 && (
          <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-8 text-center">
            <Users className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select a group above to begin marking attendance
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
