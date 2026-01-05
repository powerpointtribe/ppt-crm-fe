import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, CheckCircle, XCircle, Clock, Banknote, User } from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { financeService } from '@/services/finance'
import type { Requisition } from '@/types/finance'

export default function PendingApprovals() {
  const navigate = useNavigate()
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadPendingApprovals()
  }, [])

  const loadPendingApprovals = async () => {
    try {
      setLoading(true)
      const response = await financeService.getPendingApprovals({ limit: 50 })
      setRequisitions(response.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load pending approvals')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id)
      await financeService.approveRequisition(id, {})
      loadPendingApprovals()
    } catch (err: any) {
      setError(err.message || 'Failed to approve')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string, reason: string) => {
    if (!reason) {
      reason = prompt('Please enter rejection reason:') || ''
      if (!reason) return
    }
    try {
      setActionLoading(id)
      await financeService.rejectRequisition(id, { reason })
      loadPendingApprovals()
    } catch (err: any) {
      setError(err.message || 'Failed to reject')
    } finally {
      setActionLoading(null)
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
            Pending Approvals
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Review and approve requisition requests
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
              <CheckCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No pending approvals</p>
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
                      Date Needed
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Submitted
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
                              <p className="text-xs text-gray-500">{requestor?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm">
                            {req.eventDescription.substring(0, 40)}
                            {req.eventDescription.length > 40 ? '...' : ''}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          {formatCurrency(req.totalAmount)}
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-sm">
                          {formatDate(req.dateNeeded)}
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-sm">
                          {formatDate(req.submittedAt || req.createdAt)}
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReject(req._id, '')}
                              disabled={actionLoading === req._id}
                            >
                              <XCircle className="w-4 h-4 text-red-500" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(req._id)}
                              disabled={actionLoading === req._id}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
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
    </Layout>
  )
}
