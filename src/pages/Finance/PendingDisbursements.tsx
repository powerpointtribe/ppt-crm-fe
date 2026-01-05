import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Banknote, User, Building2 } from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { financeService } from '@/services/finance'
import type { Requisition } from '@/types/finance'

export default function PendingDisbursements() {
  const navigate = useNavigate()
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null)
  const [disbursementRef, setDisbursementRef] = useState('')
  const [disbursementNotes, setDisbursementNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadPendingDisbursements()
  }, [])

  const loadPendingDisbursements = async () => {
    try {
      setLoading(true)
      const response = await financeService.getPendingDisbursements({ limit: 50 })
      setRequisitions(response.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load pending disbursements')
    } finally {
      setLoading(false)
    }
  }

  const openDisburseModal = (req: Requisition) => {
    setSelectedReq(req)
    setDisbursementRef('')
    setDisbursementNotes('')
    setShowModal(true)
  }

  const handleDisburse = async () => {
    if (!selectedReq || !disbursementRef.trim()) return
    try {
      setActionLoading(true)
      await financeService.disburseRequisition(selectedReq._id, {
        disbursementReference: disbursementRef,
        notes: disbursementNotes,
      })
      setShowModal(false)
      loadPendingDisbursements()
    } catch (err: any) {
      setError(err.message || 'Failed to disburse')
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pending Disbursements
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Process approved requisitions for fund disbursement
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <Card>
          {loading ? (
            <SkeletonTable rows={5} columns={6} />
          ) : requisitions.length === 0 ? (
            <div className="p-12 text-center">
              <Banknote className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No pending disbursements</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Requestor
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Description
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Bank Details
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Approved
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {requisitions.map((req) => {
                    const requestor =
                      typeof req.requestor === 'object' ? req.requestor : null
                    return (
                      <tr
                        key={req._id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {requestor?.firstName} {requestor?.lastName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm">
                            {req.eventDescription.substring(0, 40)}
                            {req.eventDescription.length > 40 ? '...' : ''}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-lg text-primary">
                          {formatCurrency(req.totalAmount)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium">
                                {req.creditAccount.accountName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {req.creditAccount.bankName} - {req.creditAccount.accountNumber}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-sm">
                          {formatDate(req.approvedAt || req.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/finance/requisitions/${req._id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" onClick={() => openDisburseModal(req)}>
                              <Banknote className="w-4 h-4 mr-1" />
                              Disburse
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Disburse Modal */}
      {showModal && selectedReq && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 m-4">
            <h3 className="text-lg font-semibold mb-4">Disburse Funds</h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-500">Amount to Disburse</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(selectedReq.totalAmount)}
              </p>
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm font-medium">
                  {selectedReq.creditAccount.accountName}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedReq.creditAccount.bankName} -{' '}
                  {selectedReq.creditAccount.accountNumber}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Disbursement Reference <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g., Transaction ID or Reference Number"
                  value={disbursementRef}
                  onChange={(e) => setDisbursementRef(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                <textarea
                  placeholder="Add any notes about this disbursement"
                  value={disbursementNotes}
                  onChange={(e) => setDisbursementNotes(e.target.value)}
                  className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => setShowModal(false)}>
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
