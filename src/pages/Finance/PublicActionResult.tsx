import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, CreditCard, ArrowLeft } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

type ActionType = 'approve' | 'reject' | 'disburse'

interface LocationState {
  action?: ActionType
  success?: boolean
}

export default function PublicActionResult() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState | null

  const action = state?.action || 'approve'
  const success = state?.success ?? true

  const getConfig = () => {
    if (!success) {
      return {
        icon: <XCircle className="w-12 h-12 text-white" />,
        iconBg: 'bg-gradient-to-r from-red-500 to-rose-600',
        title: 'Action Failed',
        description: 'Something went wrong. Please try again or contact support.',
        bgGradient: 'from-red-50 via-white to-red-50',
      }
    }

    switch (action) {
      case 'approve':
        return {
          icon: <CheckCircle className="w-12 h-12 text-white" />,
          iconBg: 'bg-gradient-to-r from-green-500 to-emerald-600',
          title: 'Requisition Approved!',
          description:
            'The requisition has been approved successfully. The submitter and disbursers have been notified.',
          bgGradient: 'from-green-50 via-white to-green-50',
          nextSteps: [
            'The submitter has been notified of the approval',
            'Disbursers have received an email with payment details',
            'Funds will be released after disbursement confirmation',
          ],
        }
      case 'reject':
        return {
          icon: <XCircle className="w-12 h-12 text-white" />,
          iconBg: 'bg-gradient-to-r from-red-500 to-rose-600',
          title: 'Requisition Rejected',
          description:
            'The requisition has been rejected. The submitter has been notified with your feedback.',
          bgGradient: 'from-red-50 via-white to-orange-50',
          nextSteps: [
            'The submitter has been notified of the rejection',
            'They can review your feedback and resubmit if needed',
            'No further action is required from you',
          ],
        }
      case 'disburse':
        return {
          icon: <CreditCard className="w-12 h-12 text-white" />,
          iconBg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
          title: 'Disbursement Confirmed!',
          description:
            'The requisition has been marked as disbursed. The submitter has been notified that funds have been transferred.',
          bgGradient: 'from-blue-50 via-white to-indigo-50',
          nextSteps: [
            'The submitter has been notified of the disbursement',
            'The requisition is now complete',
            'Transaction reference has been recorded',
          ],
        }
      default:
        return {
          icon: <CheckCircle className="w-12 h-12 text-white" />,
          iconBg: 'bg-gradient-to-r from-gray-500 to-slate-600',
          title: 'Action Complete',
          description: 'Your action has been processed successfully.',
          bgGradient: 'from-gray-50 via-white to-blue-50',
        }
    }
  }

  const config = getConfig()

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgGradient}`}>
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg mx-auto"
        >
          <Card className="p-8 text-center shadow-xl">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className={`w-24 h-24 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-6`}
            >
              {config.icon}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-gray-900 mb-4"
            >
              {config.title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 mb-8"
            >
              {config.description}
            </motion.p>

            {config.nextSteps && success && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gray-50 rounded-lg p-6 mb-8 text-left"
              >
                <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
                <ul className="space-y-2">
                  {config.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-medium">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-sm text-gray-500"
            >
              <p>You can close this window now.</p>
              <p className="mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/requisition')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Submit a new requisition
                </Button>
              </p>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
