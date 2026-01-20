import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  XCircle,
  Banknote,
  AlertCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import {
  publicRejectSchema,
  type PublicRejectFormData,
} from '@/schemas/publicRequisition'
import { financeService } from '@/services/finance'

type ActionType = 'approve' | 'reject' | 'disburse'

interface LocationState {
  action?: ActionType
  success?: boolean
  needsReason?: boolean
  token?: string
}

export default function PublicActionResult() {
  const location = useLocation()
  const state = location.state as LocationState | null

  const action = state?.action || 'approve'
  const success = state?.success ?? false
  const needsReason = state?.needsReason ?? false
  const token = state?.token || ''

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(success)

  const rejectForm = useForm<PublicRejectFormData>({
    resolver: zodResolver(publicRejectSchema),
    defaultValues: { reason: '' },
  })

  const handleReject = async (data: PublicRejectFormData) => {
    try {
      setSubmitting(true)
      setError(null)
      await financeService.rejectWithToken(token, data)
      setCompleted(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject requisition')
    } finally {
      setSubmitting(false)
    }
  }

  // Reject form
  if (needsReason && !completed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full"
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-100 mb-3">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Reject Request</h1>
            <p className="text-gray-500 text-sm mt-1">Please provide a reason</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <form onSubmit={rejectForm.handleSubmit(handleReject)}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                {...rejectForm.register('reason')}
                rows={4}
                autoFocus
                className={`w-full rounded-lg border bg-white px-3 py-2.5
                  text-gray-900 text-sm placeholder:text-gray-400 resize-none
                  focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500
                  ${rejectForm.formState.errors.reason ? 'border-red-300' : 'border-gray-200'}`}
                placeholder="Why is this request being rejected?"
              />
              {rejectForm.formState.errors.reason && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {rejectForm.formState.errors.reason.message}
                </p>
              )}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-lg bg-red-600 hover:bg-red-700 transition-colors mt-4"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Request
                  </>
                )}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    )
  }

  // Success state
  const getSuccessConfig = () => {
    switch (action) {
      case 'approve':
        return {
          icon: CheckCircle,
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          title: 'Request Approved',
          description: 'The submitter and disbursers have been notified.',
        }
      case 'reject':
        return {
          icon: XCircle,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          title: 'Request Rejected',
          description: 'The submitter has been notified with your feedback.',
        }
      case 'disburse':
        return {
          icon: Banknote,
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          title: 'Disbursement Confirmed',
          description: 'The submitter has been notified of the payment.',
        }
      default:
        return {
          icon: CheckCircle,
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          title: 'Action Complete',
          description: 'Your action has been processed.',
        }
    }
  }

  const config = getSuccessConfig()
  const Icon = config.icon

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full"
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}
          >
            <Icon className={`w-8 h-8 ${config.iconColor}`} />
          </motion.div>

          <h1 className="text-xl font-semibold text-gray-900 mb-2">{config.title}</h1>
          <p className="text-gray-500 text-sm mb-6">{config.description}</p>

          <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
            <p className="text-xs font-medium text-gray-700 mb-2">What happens next</p>
            <ul className="text-xs text-gray-500 space-y-1.5">
              {action === 'approve' && (
                <>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 mt-0.5 text-gray-400" />
                    Disbursers will process the payment
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 mt-0.5 text-gray-400" />
                    Submitter will be notified when disbursed
                  </li>
                </>
              )}
              {action === 'reject' && (
                <>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 mt-0.5 text-gray-400" />
                    Submitter can review and resubmit
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 mt-0.5 text-gray-400" />
                    No further action needed from you
                  </li>
                </>
              )}
              {action === 'disburse' && (
                <>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 mt-0.5 text-gray-400" />
                    The requisition is now complete
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 mt-0.5 text-gray-400" />
                    Transaction reference has been recorded
                  </li>
                </>
              )}
            </ul>
          </div>

          <p className="text-xs text-gray-400">You can close this window</p>
        </div>
      </motion.div>
    </div>
  )
}
