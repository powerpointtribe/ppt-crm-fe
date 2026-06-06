import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Cake, ChevronLeft, ChevronRight, Gift, Phone, Mail } from 'lucide-react'
import Layout from '@/components/Layout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { firstTimersService, FirstTimer } from '@/services/first-timers'
import { showToast } from '@/utils/toast'
import { cn } from '@/utils/cn'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/**
 * Parse a first-timer dateOfBirth into a { month (0-11), day } pair.
 * First-timer DOBs are stored as "MM-DD" (e.g. "03-17"), but we also tolerate
 * "YYYY-MM-DD" and full date strings just in case. Returns null if unparseable.
 */
function parseBirthday(dob?: string): { month: number; day: number } | null {
  if (!dob) return null
  const parts = dob.trim().split(/[-/]/).map((p) => parseInt(p, 10))
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    // MM-DD
    return { month: parts[0] - 1, day: parts[1] }
  }
  if (parts.length === 3 && !isNaN(parts[1]) && !isNaN(parts[2])) {
    // YYYY-MM-DD
    return { month: parts[1] - 1, day: parts[2] }
  }
  const d = new Date(dob)
  if (!isNaN(d.getTime())) return { month: d.getMonth(), day: d.getDate() }
  return null
}

interface BirthdayEntry {
  ft: FirstTimer
  month: number
  day: number
}

export default function FirstTimerBirthdays() {
  const navigate = useNavigate()
  const now = new Date()

  const [loading, setLoading] = useState(true)
  const [engaged, setEngaged] = useState<FirstTimer[]>([])
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await firstTimersService.getFirstTimers({ status: 'ENGAGED', limit: 100 })
        setEngaged(res.items || [])
      } catch (err) {
        console.error('Failed to load engaged first-timers:', err)
        showToast.error('Failed to load birthdays')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // All engaged first-timers that have a parseable birthday.
  const allBirthdays = useMemo<BirthdayEntry[]>(() => {
    return engaged
      .map((ft) => {
        const b = parseBirthday(ft.dateOfBirth)
        return b ? { ft, month: b.month, day: b.day } : null
      })
      .filter((e): e is BirthdayEntry => e !== null)
  }, [engaged])

  const monthBirthdays = useMemo(() => {
    return allBirthdays
      .filter((e) => e.month === selectedMonth)
      .sort((a, b) => a.day - b.day)
  }, [allBirthdays, selectedMonth])

  const isCurrentMonth = selectedMonth === now.getMonth()
  const todayDay = now.getDate()

  const renderCard = (entry: BirthdayEntry) => {
    const { ft, month, day } = entry
    const isToday = isCurrentMonth && day === todayDay
    const fullName = `${ft.firstName} ${ft.lastName}`.trim()

    return (
      <div
        key={ft._id}
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer',
          isToday
            ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
            : 'bg-white border-gray-100 hover:border-gray-200 dark:bg-gray-800 dark:border-gray-700',
        )}
        onClick={() => navigate(`/first-timers/${ft._id}`)}
      >
        <div
          className={cn(
            'flex flex-col items-center justify-center w-12 h-12 rounded-lg shrink-0',
            isToday ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300',
          )}
        >
          <span className="text-[10px] font-medium uppercase">{MONTH_SHORT[month]}</span>
          <span className="text-base font-bold leading-none">{day}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{fullName}</p>
            {isToday && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-600 text-white">
                <Gift className="w-3 h-3" /> Today
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
            {ft.phone && (
              <a
                href={`tel:${ft.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 hover:text-purple-600"
              >
                <Phone className="w-3 h-3" /> {ft.phone}
              </a>
            )}
            {ft.email && (
              <a
                href={`mailto:${ft.email}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 hover:text-purple-600 truncate"
              >
                <Mail className="w-3 h-3" /> <span className="truncate">{ft.email}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-5 max-w-3xl mx-auto">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate('/first-timers')}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-600 mb-1 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to First Timers
          </button>
          <div className="flex items-center gap-2">
            <Cake className="w-5 h-5 text-purple-600" />
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Engaged First-Timer Birthdays
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Birthdays of first-timers currently being engaged — a chance to reach out.
          </p>
        </div>

        {/* Month selector */}
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSelectedMonth((m) => (m + 11) % 12)}
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-500"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {MONTH_NAMES[selectedMonth]}
            {isCurrentMonth && <span className="ml-2 text-xs font-normal text-purple-600">(this month)</span>}
          </span>
          <button
            onClick={() => setSelectedMonth((m) => (m + 1) % 12)}
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-500"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" />
          </div>
        ) : monthBirthdays.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-50 mb-3">
              <Cake className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              No birthdays in {MONTH_NAMES[selectedMonth]}
            </h3>
            <p className="text-xs text-gray-500">
              No engaged first-timers have a birthday this month.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-gray-400">
              {monthBirthdays.length} birthday{monthBirthdays.length === 1 ? '' : 's'} in {MONTH_NAMES[selectedMonth]}
            </p>
            {monthBirthdays.map(renderCard)}
          </div>
        )}
      </div>
    </Layout>
  )
}
