import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  ListFilter,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Wallet,
  Receipt,
  X,
  CalendarDays,
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { financeService } from '@/services/finance'
import { useAuth } from '@/contexts/AuthContext-unified'
import type { Requisition, RequisitionStatus, RequisitionQueryParams, FinanceStatistics } from '@/types/finance'
import { requisitionStatusConfig } from '@/types/finance'

const statCards = [
  {
    key: 'requested',
    label: 'Requested',
    icon: Receipt,
    getValue: (s: FinanceStatistics) => s.totalAmountRequested || 0,
    getSub: (s: FinanceStatistics) => `${s.totalRequisitions || 0} total`,
    format: 'currency' as const,
    color: 'blue',
    accent: false,
  },
  {
    key: 'pending',
    label: 'Pending Approval',
    icon: Clock,
    getValue: (s: FinanceStatistics) => s.pendingApproval || 0,
    format: 'number' as const,
    color: 'amber',
    accent: (s: FinanceStatistics) => (s.pendingApproval || 0) > 0,
    link: '/finance/approvals',
    linkLabel: 'Review',
    linkPerm: 'finance:approve-requisition',
  },
  {
    key: 'disburse',
    label: 'To Disburse',
    icon: Wallet,
    getValue: (s: FinanceStatistics) => s.pendingDisbursement || 0,
    format: 'number' as const,
    color: 'violet',
    accent: (s: FinanceStatistics) => (s.pendingDisbursement || 0) > 0,
    link: '/finance/disbursements',
    linkLabel: 'Process',
    linkPerm: 'finance:disburse',
  },
  {
    key: 'disbursed',
    label: 'Disbursed',
    icon: TrendingUp,
    getValue: (s: FinanceStatistics) => s.totalAmountDisbursed || 0,
    getSub: (s: FinanceStatistics) => `${s.disbursed || 0} completed`,
    format: 'currency' as const,
    color: 'emerald',
    accent: false,
  },
]

const colorMap: Record<string, { bg: string; accentBg: string; iconBg: string; iconText: string; valueText: string }> = {
  blue: {
    bg: 'from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200/50 dark:border-slate-700/50',
    accentBg: 'from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200/50 dark:border-slate-700/50',
    iconBg: 'bg-blue-500/10', iconText: 'text-blue-600 dark:text-blue-400',
    valueText: 'text-gray-900 dark:text-white',
  },
  amber: {
    bg: 'from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200/50 dark:border-slate-700/50',
    accentBg: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200/50 dark:border-amber-700/50',
    iconBg: 'bg-amber-500/10', iconText: 'text-amber-600 dark:text-amber-400',
    valueText: 'text-amber-600 dark:text-amber-400',
  },
  violet: {
    bg: 'from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200/50 dark:border-slate-700/50',
    accentBg: 'from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200/50 dark:border-violet-700/50',
    iconBg: 'bg-violet-500/10', iconText: 'text-violet-600 dark:text-violet-400',
    valueText: 'text-violet-600 dark:text-violet-400',
  },
  emerald: {
    bg: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200/50 dark:border-emerald-700/50',
    accentBg: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200/50 dark:border-emerald-700/50',
    iconBg: 'bg-emerald-500/10', iconText: 'text-emerald-600 dark:text-emerald-400',
    valueText: 'text-emerald-600 dark:text-emerald-400',
  },
}

export default function RequisitionsList() {
  const navigate = useNavigate()
  const location = useLocation()
  const { hasPermission, member: currentUser } = useAuth()

  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [statistics, setStatistics] = useState<FinanceStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<RequisitionStatus | ''>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 })
  const [successMessage, setSuccessMessage] = useState<string | null>(
    location.state?.message || null
  )
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all')
  const [showDateFilter, setShowDateFilter] = useState(false)

  const canCreate = hasPermission('finance:create-requisition')

  const hasFilters = !!(startDate || endDate || statusFilter || searchTerm)

  useEffect(() => { loadStatistics() }, [])
  useEffect(() => { loadRequisitions() }, [pagination.page, statusFilter, activeTab])
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const loadStatistics = async () => {
    try {
      setStatsLoading(true)
      const stats = await financeService.getStatistics()
      setStatistics(stats)
    } catch { /* non-critical */ } finally { setStatsLoading(false) }
  }

  const loadRequisitions = async () => {
    try {
      setLoading(true)
      const params: RequisitionQueryParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }
      const response = activeTab === 'all'
        ? await financeService.getRequisitions(params)
        : await financeService.getMyRequisitions(params)
      setRequisitions(response.data)
      setPagination((prev) => ({ ...prev, total: response.total }))
    } catch (err: any) {
      setError(err.message || 'Failed to load requisitions')
    } finally { setLoading(false) }
  }

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }))
    loadRequisitions()
  }

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setStatusFilter('')
    setSearchTerm('')
    setShowDateFilter(false)
    setPagination((prev) => ({ ...prev, page: 1 }))
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

  const fmtCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount)

  const fmtDateShort = (d: string) =>
    new Date(d).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })

  const totalPages = Math.ceil(pagination.total / pagination.limit)

  const getGreeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  }

  const getRequestorName = (req: Requisition) => {
    if (typeof req.requestor === 'object' && req.requestor) return `${req.requestor.firstName} ${req.requestor.lastName}`
    if (typeof req.createdBy === 'object' && req.createdBy) return `${req.createdBy.firstName} ${req.createdBy.lastName}`
    return req.submitterName || '-'
  }

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {getGreeting()}, {currentUser?.firstName || 'there'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manage and track expense requisitions
            </p>
          </div>
          {canCreate && (
            <Button size="sm" onClick={() => navigate('/finance/requisitions/new')}>
              <Plus className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">New Requisition</span>
              <span className="sm:hidden">New</span>
            </Button>
          )}
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-xs flex justify-between items-center">
            {successMessage}
            <button onClick={() => setSuccessMessage(null)}><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs flex justify-between items-center">
            {error}
            <button onClick={() => setError(null)}><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Stats */}
        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : statistics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statCards.map((card) => {
              const colors = colorMap[card.color]
              const isAccented = typeof card.accent === 'function' ? card.accent(statistics) : card.accent
              const value = card.getValue(statistics)
              return (
                <div key={card.key} className={`relative overflow-hidden rounded-xl p-3.5 border bg-gradient-to-br ${isAccented ? colors.accentBg : colors.bg}`}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className={`p-1 rounded-md ${colors.iconBg}`}>
                      <card.icon className={`w-3.5 h-3.5 ${colors.iconText}`} />
                    </div>
                    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{card.label}</span>
                  </div>
                  <p className={`text-lg font-bold ${colors.valueText}`}>
                    {card.format === 'currency' ? fmtCurrency(value) : value}
                  </p>
                  {card.getSub && (
                    <p className="text-[11px] text-gray-500 mt-0.5">{card.getSub(statistics)}</p>
                  )}
                  {card.link && card.linkPerm && hasPermission(card.linkPerm) && value > 0 && (
                    <button
                      onClick={() => navigate(card.link!)}
                      className={`mt-1 text-[11px] font-medium ${colors.iconText} flex items-center gap-0.5 group`}
                    >
                      {card.linkLabel}
                      <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Tabs + Filters Row */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 overflow-hidden">
          {/* Tab bar */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-1">
            <div className="flex">
              {[
                { key: 'all' as const, label: 'All Requisitions', icon: ListFilter },
                { key: 'my' as const, label: 'My Requisitions', icon: FileText },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setPagination((p) => ({ ...p, page: 1 })) }}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 pr-2">
              <span className="text-[11px] text-gray-400">{pagination.total} results</span>
            </div>
          </div>

          {/* Filter bar */}
          <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-700/50 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-8 h-8 text-xs"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as RequisitionStatus | ''); setPagination((p) => ({ ...p, page: 1 })) }}
              className="h-8 px-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary dark:bg-gray-800 dark:border-gray-600"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="disbursed">Disbursed</option>
            </select>
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className={`h-8 px-2.5 text-xs border rounded-lg flex items-center gap-1 transition-colors ${
                showDateFilter || startDate || endDate
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-gray-300 text-gray-500 hover:border-gray-400 dark:border-gray-600 dark:text-gray-400'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Date
            </button>
            <Button size="sm" variant="outline" onClick={handleSearch} className="h-8 text-xs px-3">
              <Search className="w-3 h-3 mr-1" />
              Search
            </Button>
            {hasFilters && (
              <button onClick={clearFilters} className="h-8 px-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                Clear all
              </button>
            )}
          </div>

          {/* Date range (collapsible) */}
          {showDateFilter && (
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700/50 flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/30">
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] text-gray-500">From</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-7 px-2 text-xs border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] text-gray-500">To</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-7 px-2 text-xs border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  onClick={() => { setStartDate(''); setEndDate('') }}
                  className="text-[11px] text-gray-400 hover:text-gray-600"
                >
                  Clear dates
                </button>
              )}
            </div>
          )}

          {/* Table (desktop) */}
          {loading ? (
            <SkeletonTable rows={5} columns={5} />
          ) : requisitions.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {activeTab === 'my' ? 'You have no requisitions yet' : 'No requisitions found'}
              </p>
              {hasFilters && (
                <button onClick={clearFilters} className="mt-2 text-xs text-primary hover:underline">
                  Clear filters
                </button>
              )}
              {canCreate && activeTab === 'my' && !hasFilters && (
                <Button size="sm" className="mt-3" onClick={() => navigate('/finance/requisitions/new')}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Create Requisition
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
                      <th className="text-left py-2 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Requisition</th>
                      {activeTab === 'all' && (
                        <th className="text-left py-2 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Requestor</th>
                      )}
                      <th className="text-right py-2 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="text-center py-2 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-right py-2 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {requisitions.map((req) => {
                      const statusCfg = requisitionStatusConfig[req.status]
                      return (
                        <tr
                          key={req._id}
                          className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                          onClick={() => navigate(`/finance/requisitions/${req._id}`)}
                        >
                          <td className="py-2.5 px-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                              {req.eventDescription.length > 45
                                ? req.eventDescription.substring(0, 45) + '...'
                                : req.eventDescription}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {req.referenceNumber || 'No ref'}
                            </p>
                          </td>
                          {activeTab === 'all' && (
                            <td className="py-2.5 px-3 text-xs text-gray-600 dark:text-gray-400">
                              {getRequestorName(req)}
                            </td>
                          )}
                          <td className="py-2.5 px-3 text-right">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {fmtCurrency(req.totalAmount)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${statusCfg.bgColor} ${statusCfg.color}`}>
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <p className="text-xs text-gray-500">{fmtDateShort(req.createdAt)}</p>
                            <p className="text-[10px] text-gray-400">Due {fmtDateShort(req.dateNeeded)}</p>
                          </td>
                          <td className="py-2.5 px-1" onClick={(e) => e.stopPropagation()}>
                            {req.status === 'draft' && (
                              <div className="flex gap-0.5">
                                <button
                                  onClick={() => navigate(`/finance/requisitions/${req._id}/edit`)}
                                  className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(req._id)}
                                  className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700/50">
                {requisitions.map((req) => {
                  const statusCfg = requisitionStatusConfig[req.status]
                  return (
                    <div
                      key={req._id}
                      className="px-3 py-3 hover:bg-gray-50/80 dark:hover:bg-gray-700/30 cursor-pointer active:bg-gray-100 transition-colors"
                      onClick={() => navigate(`/finance/requisitions/${req._id}`)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {req.eventDescription}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              {fmtCurrency(req.totalAmount)}
                            </span>
                            <span className="text-gray-300 dark:text-gray-600">·</span>
                            <span className="text-[11px] text-gray-400">
                              {fmtDateShort(req.createdAt)}
                            </span>
                            {req.referenceNumber && (
                              <>
                                <span className="text-gray-300 dark:text-gray-600">·</span>
                                <span className="text-[11px] text-gray-400 font-mono">
                                  {req.referenceNumber}
                                </span>
                              </>
                            )}
                          </div>
                          {activeTab === 'all' && (
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              by {getRequestorName(req)}
                            </p>
                          )}
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full ${statusCfg.bgColor} ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2.5 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-800/20">
              <span className="text-[11px] text-gray-500">
                {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={pagination.page === 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 min-w-[3rem] text-center">
                  {pagination.page} / {totalPages}
                </span>
                <button
                  disabled={pagination.page === totalPages}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
