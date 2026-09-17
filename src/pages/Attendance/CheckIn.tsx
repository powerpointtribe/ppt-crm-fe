import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Church,
  Calendar,
  Clock,
} from 'lucide-react'
import { serviceAttendanceService, SERVICE_TYPE_LABELS } from '@/services/service-attendance'
import type { ServiceType } from '@/services/service-attendance'

type CheckInState = 'form' | 'loading' | 'success' | 'already' | 'error'

export default function CheckIn() {
  const [searchParams] = useSearchParams()
  const branch = searchParams.get('branch') || ''
  const date = searchParams.get('date') || ''
  const type = (searchParams.get('type') || '') as ServiceType
  const title = searchParams.get('title') || ''

  const [identifier, setIdentifier] = useState('')
  const [state, setState] = useState<CheckInState>('form')
  const [memberName, setMemberName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const serviceLabel = SERVICE_TYPE_LABELS[type] || type
  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

  const isValid = branch && date && type

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim() || !isValid) return

    setState('loading')
    try {
      const result = await serviceAttendanceService.qrCheckIn({
        identifier: identifier.trim(),
        serviceDate: new Date(date).toISOString(),
        serviceType: type,
        branch,
      })
      setMemberName(`${result.member.firstName} ${result.member.lastName}`)
      setState(result.alreadyCheckedIn ? 'already' : 'success')
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Check-in failed. Please try again or speak to an usher.'
      setErrorMsg(msg)
      setState('error')
    }
  }

  const handleReset = () => {
    setIdentifier('')
    setMemberName('')
    setErrorMsg('')
    setState('form')
  }

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="max-w-sm w-full text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Invalid Check-in Link
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This QR code is missing required information. Please ask for a new
            code from the service team.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mx-auto mb-4">
            <Church className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {title || 'Service Check-in'}
          </h1>
          <div className="mt-2 space-y-0.5">
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {serviceLabel}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formattedDate}
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-indigo-500/5 border border-gray-100 dark:border-gray-700 overflow-hidden">
          {state === 'form' && (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Phone number or email
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 08012345678 or john@email.com"
                  autoFocus
                  required
                  className="w-full px-4 py-3 text-base rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Use the phone number or email registered with the church
                </p>
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 active:bg-indigo-800 transition"
              >
                Check In
              </button>
            </form>
          )}

          {state === 'loading' && (
            <div className="p-12 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Checking you in...
              </p>
            </div>
          )}

          {state === 'success' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Welcome, {memberName}!
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You have been checked in successfully. Enjoy the service!
              </p>
              <button
                onClick={handleReset}
                className="mt-6 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Check in another person
              </button>
            </motion.div>
          )}

          {state === 'already' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Already checked in
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {memberName}, you&apos;re already marked as present for this
                service.
              </p>
              <button
                onClick={handleReset}
                className="mt-6 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Check in another person
              </button>
            </motion.div>
          )}

          {state === 'error' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Check-in failed
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {errorMsg}
              </p>
              <button
                onClick={handleReset}
                className="mt-6 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Try again
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
