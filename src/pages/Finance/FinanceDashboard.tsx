import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Banknote,
  TrendingUp,
  ArrowRight,
  ArrowUpRight,
  Wallet,
  Receipt,
  Sparkles,
  Settings,
  Sliders,
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { financeService } from '@/services/finance'
import { useAuth } from '@/contexts/AuthContext-unified'
import type { FinanceStatistics, Requisition } from '@/types/finance'
import { requisitionStatusConfig } from '@/types/finance'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function FinanceDashboard() {
  const navigate = useNavigate()
  const { hasPermission, member } = useAuth()
  const [statistics, setStatistics] = useState<FinanceStatistics | null>(null)
  const [recentRequisitions, setRecentRequisitions] = useState<Requisition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const canCreateRequisition = hasPermission('finance:create-requisition')
  const canApprove = hasPermission('finance:approve-requisition')
  const canDisburse = hasPermission('finance:disburse')
  const canManageFormFields = hasPermission('finance:manage-form-fields')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [stats, requisitions] = await Promise.all([
        financeService.getStatistics(),
        financeService.getMyRequisitions({ limit: 5 }),
      ])
      setStatistics(stats)
      setRecentRequisitions(requisitions.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
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
    })
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg mt-2 animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <motion.div
        className="p-4 space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header with Greeting */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {getGreeting()}, {member?.firstName || 'there'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Here's what's happening with your finances
            </p>
          </div>
          {canCreateRequisition && (
            <Button
              size="sm"
              onClick={() => navigate('/finance/requisitions/new')}
              className="shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25 transition-all"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Requisition
            </Button>
          )}
        </motion.div>

        {error && (
          <motion.div
            variants={itemVariants}
            className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Main Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Requested */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-4 border border-slate-200/50 dark:border-slate-700/50">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-y-6 translate-x-6" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-500/10 rounded-lg">
                  <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Requested</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(statistics?.totalAmountRequested || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {statistics?.totalRequisitions || 0} total
              </p>
            </div>
          </div>

          {/* Pending Approval */}
          <div
            className={`relative overflow-hidden rounded-xl p-4 border transition-all ${
              statistics?.pendingApproval && statistics.pendingApproval > 0
                ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200/50 dark:border-amber-700/50'
                : 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200/50 dark:border-slate-700/50'
            }`}
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -translate-y-6 translate-x-6" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-amber-500/10 rounded-lg">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Pending Approval</span>
              </div>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {statistics?.pendingApproval || 0}
              </p>
              {canApprove && statistics?.pendingApproval && statistics.pendingApproval > 0 ? (
                <button
                  onClick={() => navigate('/finance/approvals')}
                  className="mt-1 text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-0.5 group"
                >
                  Review
                  <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              ) : (
                <p className="text-xs text-gray-500 mt-1">awaiting</p>
              )}
            </div>
          </div>

          {/* Pending Disbursement */}
          <div
            className={`relative overflow-hidden rounded-xl p-4 border transition-all ${
              statistics?.pendingDisbursement && statistics.pendingDisbursement > 0
                ? 'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200/50 dark:border-violet-700/50'
                : 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200/50 dark:border-slate-700/50'
            }`}
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full -translate-y-6 translate-x-6" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-violet-500/10 rounded-lg">
                  <Wallet className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">To Disburse</span>
              </div>
              <p className="text-xl font-bold text-violet-600 dark:text-violet-400">
                {statistics?.pendingDisbursement || 0}
              </p>
              {canDisburse && statistics?.pendingDisbursement && statistics.pendingDisbursement > 0 ? (
                <button
                  onClick={() => navigate('/finance/disbursements')}
                  className="mt-1 text-xs font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 flex items-center gap-0.5 group"
                >
                  Process
                  <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              ) : (
                <p className="text-xs text-gray-500 mt-1">pending</p>
              )}
            </div>
          </div>

          {/* Total Disbursed */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 border border-emerald-200/50 dark:border-emerald-700/50">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -translate-y-6 translate-x-6" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Disbursed</span>
              </div>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(statistics?.totalAmountDisbursed || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {statistics?.disbursed || 0} completed
              </p>
            </div>
          </div>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Recent Requisitions - Takes 3 columns */}
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <div className="rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Recent Requisitions
                </h2>
                <button
                  onClick={() => navigate('/finance/requisitions')}
                  className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 group"
                >
                  View all
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

              {recentRequisitions.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary/60" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    No requisitions yet
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">Create your first requisition</p>
                  {canCreateRequisition && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/finance/requisitions/new')}
                    >
                      <Plus className="w-3 h-3 mr-1.5" />
                      Create
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {recentRequisitions.map((req, index) => {
                    const statusCfg = requisitionStatusConfig[req.status]
                    return (
                      <motion.div
                        key={req._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                        onClick={() => navigate(`/finance/requisitions/${req._id}`)}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {req.eventDescription}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500">
                                {formatCurrency(req.totalAmount)}
                              </span>
                              <span className="text-gray-300 dark:text-gray-600">•</span>
                              <span className="text-xs text-gray-500">
                                {formatDate(req.createdAt)}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full ${statusCfg.bgColor} ${statusCfg.color}`}
                          >
                            {statusCfg.label}
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Column - Stats */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
            {/* Status Overview */}
            <div className="rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 p-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Status Overview
              </h2>
              <div className="space-y-2.5">
                {[
                  { label: 'Drafts', count: statistics?.byStatus?.find((s) => s.status === 'draft')?.count || 0, color: 'bg-gray-400' },
                  { label: 'Pending', count: statistics?.pendingApproval || 0, color: 'bg-amber-500' },
                  { label: 'Approved', count: statistics?.byStatus?.find((s) => s.status === 'approved')?.count || 0, color: 'bg-green-500' },
                  { label: 'Disbursed', count: statistics?.disbursed || 0, color: 'bg-emerald-500' },
                  { label: 'Rejected', count: statistics?.rejected || 0, color: 'bg-red-500' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Categories */}
            <div className="rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 p-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Top Categories
              </h2>
              {statistics?.byCategory && statistics.byCategory.length > 0 ? (
                <div className="space-y-3">
                  {statistics.byCategory.slice(0, 3).map((cat, index) => {
                    const maxAmount = Math.max(...statistics.byCategory.map(c => c.totalAmount))
                    const percentage = (cat.totalAmount / maxAmount) * 100
                    return (
                      <div key={cat.categoryId}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                            {cat.category}
                          </span>
                          <span className="text-[10px] text-gray-500 ml-2">
                            {cat.count}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.6, delay: index * 0.08 }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {formatCurrency(cat.totalAmount)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-3">
                  No data available
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions for Approvers/Disbursers */}
        {(canApprove || canDisburse) && (statistics?.pendingApproval || statistics?.pendingDisbursement) && (
          <motion.div variants={itemVariants}>
            <div className="rounded-xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 border border-primary/20 px-4 py-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Actions Required
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Pending items need your attention
                  </p>
                </div>
                <div className="flex gap-2">
                  {canApprove && statistics?.pendingApproval && statistics.pendingApproval > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/finance/approvals')}
                      className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-900/20 text-xs"
                    >
                      <Clock className="w-3 h-3 mr-1.5" />
                      {statistics.pendingApproval} to Approve
                    </Button>
                  )}
                  {canDisburse && statistics?.pendingDisbursement && statistics.pendingDisbursement > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/finance/disbursements')}
                      className="border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-600 dark:text-violet-400 dark:hover:bg-violet-900/20 text-xs"
                    >
                      <Banknote className="w-3 h-3 mr-1.5" />
                      {statistics.pendingDisbursement} to Disburse
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Admin Settings - Form Field Configuration */}
        {canManageFormFields && (
          <motion.div variants={itemVariants}>
            <div className="rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Form Settings
                    </h3>
                    <p className="text-xs text-gray-500">
                      Configure requisition form fields, labels, and validation
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/finance/settings/form-fields')}
                  className="text-xs"
                >
                  <Sliders className="w-3 h-3 mr-1.5" />
                  Configure
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  )
}
