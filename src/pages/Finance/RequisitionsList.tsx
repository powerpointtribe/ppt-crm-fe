import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { financeService } from '@/services/finance'
import { useAuth } from '@/contexts/AuthContext-unified'
import type { Requisition, RequisitionStatus, RequisitionQueryParams } from '@/types/finance'
import { requisitionStatusConfig } from '@/types/finance'

export default function RequisitionsList() {
  const navigate = useNavigate()
  const location = useLocation()
  const { hasPermission, member: currentUser } = useAuth()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<RequisitionStatus | ''>('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 })
  const [successMessage, setSuccessMessage] = useState<string | null>(
    location.state?.message || null
  )
  const [viewMode, setViewMode] = useState<'my' | 'all'>('my')

  const canCreate = hasPermission('finance:create-requisition')
  const canViewAll = hasPermission('finance:view-all-requisitions')

  useEffect(() => {
    loadRequisitions()
  }, [pagination.page, statusFilter, viewMode])

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const loadRequisitions = async () => {
    try {
      setLoading(true)
      const params: RequisitionQueryParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      }
      const response = viewMode === 'all' && canViewAll
        ? await financeService.getRequisitions(params)
        : await financeService.getMyRequisitions(params)
      setRequisitions(response.data)
      setPagination((prev) => ({ ...prev, total: response.total }))
    } catch (err: any) {
      setError(err.message || 'Failed to load requisitions')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }))
    loadRequisitions()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this draft requisition?')) return
    try {
      await financeService.deleteRequisition(id)
      loadRequisitions()
    } catch (err: any) {
      setError(err.message || 'Failed to delete requisition')
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit)

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {getGreeting()}, {currentUser?.firstName || 'there'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View and manage your expense requisitions
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => navigate('/finance/requisitions/new')}>
              <Plus className="w-4 h-4 mr-2" />
              New Requisition
            </Button>
          )}
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* View Mode Toggle */}
        {canViewAll && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setViewMode('my')
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'my'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              My Requisitions
            </button>
            <button
              onClick={() => {
                setViewMode('all')
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              All Requisitions
            </button>
          </div>
        )}

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by description or reference number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RequisitionStatus | '')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-800 dark:border-gray-600"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="pending_disbursement">Pending Disbursement</option>
              <option value="disbursed">Disbursed</option>
            </select>
            <Button variant="outline" onClick={handleSearch}>
              <Filter className="w-4 h-4 mr-2" />
              Apply
            </Button>
          </div>
        </Card>

        {/* Table */}
        <Card>
          {loading ? (
            <SkeletonTable rows={5} columns={5} />
          ) : requisitions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">No requisitions found</p>
              {canCreate && (
                <Button onClick={() => navigate('/finance/requisitions/new')}>
                  Create your first requisition
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Reference
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Description
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                      Amount
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Date Needed
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Created
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {requisitions.map((req) => {
                    const statusCfg = requisitionStatusConfig[req.status]
                    return (
                      <tr
                        key={req._id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="py-3 px-4">
                          {req.referenceNumber ? (
                            <code className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded dark:bg-blue-900/30 dark:text-blue-300">
                              {req.referenceNumber}
                            </code>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {req.eventDescription.substring(0, 50)}
                            {req.eventDescription.length > 50 ? '...' : ''}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          {formatCurrency(req.totalAmount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusCfg.bgColor} ${statusCfg.color}`}
                          >
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {formatDate(req.dateNeeded)}
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {formatDate(req.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/finance/requisitions/${req._id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {req.status === 'draft' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    navigate(`/finance/requisitions/${req._id}/edit`)
                                  }
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(req._id)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === totalPages}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}
