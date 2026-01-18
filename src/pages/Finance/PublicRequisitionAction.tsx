import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  XCircle,
  CreditCard,
  AlertCircle,
  Loader2,
  Clock,
  User,
  FileText,
  Building2,
  Calendar,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {
  publicApproveSchema,
  publicRejectSchema,
  publicDisburseSchema,
  type PublicApproveFormData,
  type PublicRejectFormData,
  type PublicDisburseFormData,
} from '@/schemas/publicRequisition'
import { financeService, type TokenVerificationResponse } from '@/services/finance'
import type { Requisition } from '@/types/finance'

type ActionType = 'approve' | 'reject' | 'disburse' | 'view'

export default function PublicRequisitionAction() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get('token') || ''
  const action = (searchParams.get('action') as ActionType) || 'view'

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokenData, setTokenData] = useState<TokenVerificationResponse | null>(null)

  // Approve form
  const approveForm = useForm<PublicApproveFormData>({
    resolver: zodResolver(publicApproveSchema),
    defaultValues: { notes: '' },
  })

  // Reject form
  const rejectForm = useForm<PublicRejectFormData>({
    resolver: zodResolver(publicRejectSchema),
    defaultValues: { reason: '' },
  })

  // Disburse form
  const disburseForm = useForm<PublicDisburseFormData>({
    resolver: zodResolver(publicDisburseSchema),
    defaultValues: { disbursementReference: '', notes: '' },
  })

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('No token provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await financeService.verifyActionToken(token)
        setTokenData(data)

        if (!data.valid) {
          setError(data.error || 'Invalid or expired token')
        }
      } catch (err: any) {
        console.error('Error verifying token:', err)
        setError(err.response?.data?.message || 'Failed to verify token')
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [token])

  const handleApprove = async (data: PublicApproveFormData) => {
    try {
      setSubmitting(true)
      setError(null)
      await financeService.approveWithToken(token, data)
      navigate('/requisition-result', {
        state: { action: 'approve', success: true },
      })
    } catch (err: any) {
      console.error('Error approving:', err)
      setError(err.response?.data?.message || 'Failed to approve requisition')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async (data: PublicRejectFormData) => {
    try {
      setSubmitting(true)
      setError(null)
      await financeService.rejectWithToken(token, data)
      navigate('/requisition-result', {
        state: { action: 'reject', success: true },
      })
    } catch (err: any) {
      console.error('Error rejecting:', err)
      setError(err.response?.data?.message || 'Failed to reject requisition')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDisburse = async (data: PublicDisburseFormData) => {
    try {
      setSubmitting(true)
      setError(null)
      await financeService.disburseWithToken(token, data)
      navigate('/requisition-result', {
        state: { action: 'disburse', success: true },
      })
    } catch (err: any) {
      console.error('Error disbursing:', err)
      setError(err.response?.data?.message || 'Failed to disburse requisition')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error && !tokenData?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>This could happen if:</p>
              <ul className="text-left list-disc list-inside space-y-1">
                <li>The link has expired (24 hours)</li>
                <li>The action has already been taken</li>
                <li>The link was copied incorrectly</li>
              </ul>
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  const requisition = tokenData?.requisition as Requisition | undefined

  const getActionColor = () => {
    switch (action) {
      case 'approve':
        return 'from-green-50 via-white to-green-50'
      case 'reject':
        return 'from-red-50 via-white to-red-50'
      case 'disburse':
        return 'from-blue-50 via-white to-blue-50'
      default:
        return 'from-gray-50 via-white to-blue-50'
    }
  }

  const getActionIcon = () => {
    switch (action) {
      case 'approve':
        return <CheckCircle className="w-6 h-6 text-white" />
      case 'reject':
        return <XCircle className="w-6 h-6 text-white" />
      case 'disburse':
        return <CreditCard className="w-6 h-6 text-white" />
      default:
        return <FileText className="w-6 h-6 text-white" />
    }
  }

  const getActionTitle = () => {
    switch (action) {
      case 'approve':
        return 'Approve Requisition'
      case 'reject':
        return 'Reject Requisition'
      case 'disburse':
        return 'Mark as Disbursed'
      default:
        return 'Requisition Details'
    }
  }

  const getIconBg = () => {
    switch (action) {
      case 'approve':
        return 'bg-gradient-to-r from-green-500 to-emerald-600'
      case 'reject':
        return 'bg-gradient-to-r from-red-500 to-rose-600'
      case 'disburse':
        return 'bg-gradient-to-r from-blue-500 to-indigo-600'
      default:
        return 'bg-gradient-to-r from-gray-500 to-slate-600'
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getActionColor()}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className={`inline-flex p-3 ${getIconBg()} rounded-full mb-4`}>
            {getActionIcon()}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{getActionTitle()}</h1>
          {tokenData?.expiresAt && (
            <p className="text-gray-500 mt-2 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              Link expires: {new Date(tokenData.expiresAt).toLocaleString()}
            </p>
          )}
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto mb-6"
          >
            <Card className="p-4 bg-red-50 border border-red-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-700">{error}</p>
              </div>
            </Card>
          </motion.div>
        )}

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Requisition Summary */}
          {requisition && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Requisition Summary
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Submitter</p>
                      <p className="font-medium">
                        {(requisition as any).submitterName ||
                          `${(requisition.requestor as any)?.firstName || ''} ${
                            (requisition.requestor as any)?.lastName || ''
                          }`.trim() ||
                          'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Branch</p>
                      <p className="font-medium">
                        {typeof requisition.branch === 'object'
                          ? requisition.branch.name
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Date Needed</p>
                      <p className="font-medium">
                        {new Date(requisition.dateNeeded).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Category</p>
                      <p className="font-medium">
                        {typeof requisition.expenseCategory === 'object'
                          ? requisition.expenseCategory.name
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-xs text-gray-500 mb-1">Purpose</p>
                  <p className="text-gray-800">{requisition.eventDescription}</p>
                </div>

                {/* Cost Breakdown */}
                <div className="mb-6">
                  <p className="text-xs text-gray-500 mb-2">Cost Breakdown</p>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium text-gray-600">Item</th>
                          <th className="text-center px-3 py-2 font-medium text-gray-600">Qty</th>
                          <th className="text-right px-3 py-2 font-medium text-gray-600">Unit</th>
                          <th className="text-right px-3 py-2 font-medium text-gray-600">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requisition.costBreakdown.map((item, index) => (
                          <tr key={index} className="border-t border-gray-200">
                            <td className="px-3 py-2">{item.item}</td>
                            <td className="px-3 py-2 text-center">{item.quantity}</td>
                            <td className="px-3 py-2 text-right">
                              {item.unitCost.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-right font-medium">
                              {item.total.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Total Amount */}
                <div className="p-4 bg-blue-50 rounded-lg flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-600">
                    NGN {requisition.totalAmount.toLocaleString()}
                  </span>
                </div>

                {/* Bank Details */}
                {(action === 'disburse' || action === 'view') && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-700 font-medium mb-2">Disbursement Account</p>
                    <div className="space-y-1">
                      <p className="font-medium">{requisition.creditAccount.bankName}</p>
                      <p>{requisition.creditAccount.accountName}</p>
                      <p className="font-mono text-lg font-bold text-green-700">
                        {requisition.creditAccount.accountNumber}
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {/* Action Form */}
          {action === 'approve' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Approval Notes (Optional)</h2>
                <form onSubmit={approveForm.handleSubmit(handleApprove)}>
                  <textarea
                    {...approveForm.register('notes')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4"
                    placeholder="Add any notes for the submitter..."
                  />
                  {approveForm.formState.errors.notes && (
                    <p className="text-red-500 text-sm mb-4">
                      {approveForm.formState.errors.notes.message}
                    </p>
                  )}
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Approve Requisition
                      </>
                    )}
                  </Button>
                </form>
              </Card>
            </motion.div>
          )}

          {action === 'reject' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Rejection Reason *</h2>
                <form onSubmit={rejectForm.handleSubmit(handleReject)}>
                  <textarea
                    {...rejectForm.register('reason')}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
                    placeholder="Please provide a reason for rejecting this requisition..."
                  />
                  {rejectForm.formState.errors.reason && (
                    <p className="text-red-500 text-sm mb-4">
                      {rejectForm.formState.errors.reason.message}
                    </p>
                  )}
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 mr-2" />
                        Reject Requisition
                      </>
                    )}
                  </Button>
                </form>
              </Card>
            </motion.div>
          )}

          {action === 'disburse' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Disbursement Details</h2>
                <form onSubmit={disburseForm.handleSubmit(handleDisburse)}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transaction Reference *
                    </label>
                    <input
                      {...disburseForm.register('disbursementReference')}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter transaction/transfer reference"
                    />
                    {disburseForm.formState.errors.disbursementReference && (
                      <p className="text-red-500 text-sm mt-1">
                        {disburseForm.formState.errors.disbursementReference.message}
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      {...disburseForm.register('notes')}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Any additional notes..."
                    />
                    {disburseForm.formState.errors.notes && (
                      <p className="text-red-500 text-sm mt-1">
                        {disburseForm.formState.errors.notes.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Marking as Disbursed...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Mark as Disbursed
                      </>
                    )}
                  </Button>
                </form>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
