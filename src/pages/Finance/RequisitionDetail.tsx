import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Banknote,
  Clock,
  User,
  Building2,
  FileText,
  Calendar,
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { financeService } from '@/services/finance'
import { useAuth } from '@/contexts/AuthContext-unified'
import type { Requisition } from '@/types/finance'
import { requisitionStatusConfig } from '@/types/finance'

export default function RequisitionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasPermission, member } = useAuth()
  const [requisition, setRequisition] = useState<Requisition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showDisburseModal, setShowDisburseModal] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [disbursementRef, setDisbursementRef] = useState('')
  const [disbursementNotes, setDisbursementNotes] = useState('')

  const canApprove = hasPermission('finance:approve-requisition')
  const canDisburse = hasPermission('finance:disburse')

  useEffect(() => {
    if (id) loadRequisition()
  }, [id])

  const loadRequisition = async () => {
    try {
      setLoading(true)
      const data = await financeService.getRequisition(id!)
      setRequisition(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load requisition')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    try {
      setActionLoading(true)
      await financeService.approveRequisition(id!, { notes: approvalNotes })
      setShowApproveModal(false)
      loadRequisition()
    } catch (err: any) {
      setError(err.message || 'Failed to approve')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason')
      return
    }
    try {
      setActionLoading(true)
      await financeService.rejectRequisition(id!, { reason: rejectionReason })
      setShowRejectModal(false)
      loadRequisition()
    } catch (err: any) {
      setError(err.message || 'Failed to reject')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDisburse = async () => {
    if (!disbursementRef.trim()) {
      setError('Please provide a disbursement reference')
      return
    }
    try {
      setActionLoading(true)
      await financeService.disburseRequisition(id!, {
        disbursementReference: disbursementRef,
        notes: disbursementNotes,
      })
      setShowDisburseModal(false)
      loadRequisition()
    } catch (err: any) {
      setError(err.message || 'Failed to disburse')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setActionLoading(true)
      await financeService.submitRequisition(id!)
      loadRequisition()
    } catch (err: any) {
      setError(err.message || 'Failed to submit')
    } finally {
      setActionLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </Layout>
    )
  }

  if (!requisition) {
    return (
      <Layout>
        <div className="p-6">
          <p className="text-red-500">{error || 'Requisition not found'}</p>
          <Button onClick={() => navigate('/finance/requisitions')} className="mt-4">
            Back to Requisitions
          </Button>
        </div>
      </Layout>
    )
  }

  const statusCfg = requisitionStatusConfig[requisition.status]
  const requestor = typeof requisition.requestor === 'object' ? requisition.requestor : null
  const isOwner = requestor?._id === member?._id

  const canShowApproveReject =
    canApprove &&
    (requisition.status === 'submitted' || requisition.status === 'pending_approval')

  const canShowDisburse =
    canDisburse &&
    (requisition.status === 'approved' || requisition.status === 'pending_disbursement')

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Requisition Details
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span
                className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${statusCfg.bgColor} ${statusCfg.color}`}
              >
                {statusCfg.label}
              </span>
              <span className="text-gray-500">Created {formatDate(requisition.createdAt)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            {requisition.status === 'draft' && isOwner && (
              <Button onClick={handleSubmit} disabled={actionLoading}>
                Submit for Approval
              </Button>
            )}
            {canShowApproveReject && (
              <>
                <Button variant="outline" onClick={() => setShowRejectModal(true)}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button onClick={() => setShowApproveModal(true)}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
            {canShowDisburse && (
              <Button onClick={() => setShowDisburseModal(true)}>
                <Banknote className="w-4 h-4 mr-2" />
                Disburse
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Request Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Event/Purpose</label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {requisition.eventDescription}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Date Needed</label>
                    <p className="font-medium">{formatDate(requisition.dateNeeded)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Last Request of This Nature</label>
                    <p className="font-medium">
                      {formatDate(requisition.lastRequestDate) || 'N/A'}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Discussed with P.Dams</label>
                  <p className="font-medium">
                    {requisition.discussedWithPDams ? 'Yes' : 'No'}
                    {requisition.discussedWithPDams && requisition.discussedDate && (
                      <span className="text-gray-500">
                        {' '}
                        (on {formatDate(requisition.discussedDate)})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </Card>

            {/* Cost Breakdown */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Cost Breakdown</h2>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm text-gray-500">Item</th>
                    <th className="text-center py-2 text-sm text-gray-500">Qty</th>
                    <th className="text-right py-2 text-sm text-gray-500">Unit Cost</th>
                    <th className="text-right py-2 text-sm text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {requisition.costBreakdown.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2">{item.item}</td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right">{formatCurrency(item.unitCost)}</td>
                      <td className="py-2 text-right">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td colSpan={3} className="py-3 text-right">
                      Total:
                    </td>
                    <td className="py-3 text-right text-lg text-primary">
                      {formatCurrency(requisition.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </Card>

            {/* Payment Details */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Bank Name</label>
                  <p className="font-medium">{requisition.creditAccount.bankName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Account Name</label>
                  <p className="font-medium">{requisition.creditAccount.accountName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Account Number</label>
                  <p className="font-medium">{requisition.creditAccount.accountNumber}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Requestor</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {requestor?.firstName} {requestor?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{requestor?.email}</p>
                </div>
              </div>
            </Card>

            {/* Timeline */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Timeline</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium">Created</p>
                    <p className="text-sm text-gray-500">{formatDate(requisition.createdAt)}</p>
                  </div>
                </div>

                {requisition.submittedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Submitted</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(requisition.submittedAt)}
                      </p>
                    </div>
                  </div>
                )}

                {requisition.approvedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Approved</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(requisition.approvedAt)}
                      </p>
                      {requisition.approvalNotes && (
                        <p className="text-sm text-gray-600 mt-1">
                          "{requisition.approvalNotes}"
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {requisition.rejectedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">Rejected</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(requisition.rejectedAt)}
                      </p>
                      {requisition.rejectionReason && (
                        <p className="text-sm text-red-600 mt-1">
                          "{requisition.rejectionReason}"
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {requisition.disbursedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium">Disbursed</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(requisition.disbursedAt)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Ref: {requisition.disbursementReference}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 m-4">
            <h3 className="text-lg font-semibold mb-4">Approve Requisition</h3>
            <p className="text-gray-500 mb-4">
              Approve this requisition for {formatCurrency(requisition.totalAmount)}?
            </p>
            <textarea
              placeholder="Add notes (optional)"
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              className="w-full p-3 border rounded-lg mb-4"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowApproveModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleApprove} disabled={actionLoading}>
                {actionLoading ? 'Approving...' : 'Approve'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 m-4">
            <h3 className="text-lg font-semibold mb-4">Reject Requisition</h3>
            <textarea
              placeholder="Reason for rejection (required)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 border rounded-lg mb-4"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
              >
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Disburse Modal */}
      {showDisburseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 m-4">
            <h3 className="text-lg font-semibold mb-4">Disburse Funds</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-500">Amount</p>
              <p className="text-xl font-bold text-primary">
                {formatCurrency(requisition.totalAmount)}
              </p>
              <p className="text-sm mt-2">
                To: {requisition.creditAccount.accountName} ({requisition.creditAccount.bankName})
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Disbursement Reference <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Transaction ID"
                  value={disbursementRef}
                  onChange={(e) => setDisbursementRef(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                <textarea
                  placeholder="Add notes"
                  value={disbursementNotes}
                  onChange={(e) => setDisbursementNotes(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setShowDisburseModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleDisburse}
                disabled={actionLoading || !disbursementRef.trim()}
              >
                {actionLoading ? 'Processing...' : 'Confirm Disbursement'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  )
}
