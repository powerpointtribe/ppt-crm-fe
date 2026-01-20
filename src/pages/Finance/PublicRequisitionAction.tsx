import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  XCircle,
  Banknote,
  AlertCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { financeService } from '@/services/finance'

type ActionType = 'approve' | 'reject' | 'disburse'

export default function PublicRequisitionAction() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get('token') || ''
  const action = searchParams.get('action') as ActionType

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const performAction = async () => {
      if (!token) {
        setError('No token provided')
        return
      }

      if (!action || !['approve', 'reject', 'disburse'].includes(action)) {
        setError('Invalid action')
        return
      }

      try {
        // Perform the action directly
        if (action === 'approve') {
          await financeService.approveWithToken(token, {})
        } else if (action === 'reject') {
          // For reject, we need a reason - redirect to a simple form
          navigate('/requisition-result', {
            state: { action: 'reject', needsReason: true, token }
          })
          return
        } else if (action === 'disburse') {
          await financeService.disburseWithToken(token, { disbursementReference: 'N/A' })
        }

        // Redirect to success page
        navigate('/requisition-result', { state: { action, success: true } })
      } catch (err: any) {
        setError(err.response?.data?.message || `Failed to ${action} requisition`)
      }
    }

    performAction()
  }, [token, action, navigate])

  // Loading state while performing action
  if (!error) {
    const getActionText = () => {
      switch (action) {
        case 'approve': return 'Approving'
        case 'reject': return 'Processing'
        case 'disburse': return 'Processing'
        default: return 'Processing'
      }
    }

    const getActionIcon = () => {
      switch (action) {
        case 'approve': return <CheckCircle className="w-6 h-6 text-green-600" />
        case 'reject': return <XCircle className="w-6 h-6 text-red-600" />
        case 'disburse': return <Banknote className="w-6 h-6 text-blue-600" />
        default: return <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
      }
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-14 h-14 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4">
            {getActionIcon()}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{getActionText()} request...</span>
          </div>
        </motion.div>
      </div>
    )
  }

  // Error state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full"
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Action Failed</h1>
          <p className="text-gray-500 text-sm mb-5">{error}</p>
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <p className="text-xs text-gray-600 mb-2">This could happen if:</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 mt-0.5 text-gray-400" />
                The link has expired (24 hours)
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 mt-0.5 text-gray-400" />
                The action has already been taken
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 mt-0.5 text-gray-400" />
                The link was copied incorrectly
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
