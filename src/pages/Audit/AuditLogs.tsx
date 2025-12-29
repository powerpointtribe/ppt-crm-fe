import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  User,
  Shield,
  Activity,
  ChevronDown,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { auditService, AuditLog, AuditQueryParams, AuditSeverity, AuditAction, AuditEntity } from '@/services/audit'
import { formatDateTime } from '@/utils/formatters'
import { useAppStore } from '@/store'

type TabType = 'successful' | 'other'

export default function AuditLogs() {
  const { selectedBranch, branches } = useAppStore()
  const [activeTab, setActiveTab] = useState<TabType>('successful')
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    totalLogs: 0,
    successfulActions: 0,
    failedActions: 0,
  })

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAction, setSelectedAction] = useState('')
  const [selectedEntity, setSelectedEntity] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Show branch filter when viewing "All Campuses"
  const showBranchFilter = !selectedBranch && branches.length > 0

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  useEffect(() => {
    loadStats()
    loadLogs()
  }, [activeTab, pagination.page])

  useEffect(() => {
    // Reset to page 1 when filters change
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }))
    } else {
      loadLogs()
    }
  }, [selectedAction, selectedEntity, selectedSeverity, startDate, endDate, searchTerm, branchFilter, selectedBranch])

  const loadStats = async () => {
    try {
      setStatsLoading(true)
      const statistics = await auditService.getStatistics()
      setStats({
        totalLogs: statistics.totalLogs,
        successfulActions: statistics.successfulActions,
        failedActions: statistics.failedActions,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const loadLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      // Use selectedBranch if set, otherwise use the filter dropdown
      const effectiveBranchId = selectedBranch?._id || branchFilter || undefined
      const params: AuditQueryParams = {
        page: pagination.page,
        limit: pagination.limit,
        success: activeTab === 'successful' ? true : undefined, // Don't filter on "other" tab
        search: searchTerm || undefined,
        action: selectedAction as AuditAction || undefined,
        entity: selectedEntity as AuditEntity || undefined,
        severity: selectedSeverity as AuditSeverity || undefined,
        branchId: effectiveBranchId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy: 'timestamp',
        sortOrder: 'desc'
      }

      const response = await auditService.getAuditLogs(params)

      // Validate response
      if (!response || !response.items) {
        throw new Error('Invalid response from server')
      }

      setLogs(response.items || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 0,
        hasNext: response.pagination?.hasNext || false,
        hasPrev: response.pagination?.hasPrev || false
      }))
    } catch (err: any) {
      console.error('Error loading audit logs:', err)
      setError(err?.message || 'Failed to load audit logs')
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadLogs()
  }

  const handleExport = () => {
    // Implement export functionality
    console.log('Export functionality to be implemented')
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedAction('')
    setSelectedEntity('')
    setSelectedSeverity('')
    setBranchFilter('')
    setStartDate('')
    setEndDate('')
  }

  const getActionIcon = (action: string) => {
    if (!action) return <FileText className="h-4 w-4" />
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return <User className="h-4 w-4" />
    if (action.includes('CREATE')) return <CheckCircle className="h-4 w-4" />
    if (action.includes('DELETE')) return <AlertTriangle className="h-4 w-4" />
    if (action.includes('UPDATE')) return <Activity className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const hasActiveFilters = searchTerm || selectedAction || selectedEntity || selectedSeverity || branchFilter || startDate || endDate

  return (
    <Layout
      title="Audit Logs"
      subtitle="Monitor and track all system activities"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            {statsLoading ? (
              <div className="flex justify-center"><LoadingSpinner size="sm" /></div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Logs</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalLogs.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            {statsLoading ? (
              <div className="flex justify-center"><LoadingSpinner size="sm" /></div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Successful</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.successfulActions.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            {statsLoading ? (
              <div className="flex justify-center"><LoadingSpinner size="sm" /></div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{stats.failedActions.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Tabs */}
        <Card className="overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('successful')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'successful'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Successful Audits
                </div>
              </button>
              <button
                onClick={() => setActiveTab('other')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'other'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  All Other Types
                </div>
              </button>
            </div>
          </div>

          {/* Search and Filters - Only show on "All Other Types" tab */}
          {activeTab === 'other' && (
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-3 flex-wrap">
                  <div className="flex-1 min-w-[250px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="primary">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    <ChevronDown className={`h-4 w-4 ml-2 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </Button>
                  <Button variant="secondary" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                {/* Advanced Filters */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4"
                    >
                      {showBranchFilter && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Campus</label>
                          <select
                            value={branchFilter}
                            onChange={(e) => setBranchFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">All Campuses</option>
                            {branches.map(branch => (
                              <option key={branch._id} value={branch._id}>{branch.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                        <select
                          value={selectedAction}
                          onChange={(e) => setSelectedAction(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">All Actions</option>
                          <option value="CREATE">Create</option>
                          <option value="UPDATE">Update</option>
                          <option value="DELETE">Delete</option>
                          <option value="LOGIN">Login</option>
                          <option value="LOGOUT">Logout</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Entity</label>
                        <select
                          value={selectedEntity}
                          onChange={(e) => setSelectedEntity(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">All Entities</option>
                          <option value="MEMBER">Member</option>
                          <option value="USER">User</option>
                          <option value="GROUP">Group</option>
                          <option value="INVENTORY_ITEM">Inventory Item</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                        <select
                          value={selectedSeverity}
                          onChange={(e) => setSelectedSeverity(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">All Severities</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      {hasActiveFilters && (
                        <div className="flex items-end">
                          <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
                            <X className="h-4 w-4 mr-2" />
                            Clear Filters
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
                <p className="text-gray-600">
                  {hasActiveFilters ? 'Try adjusting your filters' : 'No audit logs available'}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          {formatDateTime(log.timestamp)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getActionIcon(log.action)}
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            {log.action ? log.action.replace(/_/g, ' ') : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(log.entity || log.entityType) ? (log.entity || log.entityType)!.replace(/_/g, ' ') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.performedBy?.firstName || ''} {log.performedBy?.lastName || ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={log.success ? 'success' : 'danger'}>
                          {log.success ? 'Success' : 'Failed'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.severity && (
                          <Badge className={auditService.getSeverityColor(log.severity)}>
                            {log.severity}
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.total > 0 && (
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={!pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedLog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
              >
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Audit Log Details</h3>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {/* Status Badges */}
                    <div className="flex items-center gap-3">
                      <Badge variant={selectedLog.success ? 'success' : 'danger'}>
                        {selectedLog.success ? 'Success' : 'Failed'}
                      </Badge>
                      {selectedLog.severity && (
                        <Badge className={auditService.getSeverityColor(selectedLog.severity)}>
                          {selectedLog.severity} Severity
                        </Badge>
                      )}
                    </div>

                    {/* Main Info Grid */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Action</label>
                        <p className="text-sm text-gray-900 mt-1 font-medium">{selectedLog.action ? selectedLog.action.replace(/_/g, ' ') : 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</label>
                        <p className="text-sm text-gray-900 mt-1">{(selectedLog.entity || selectedLog.entityType) ? (selectedLog.entity || selectedLog.entityType)!.replace(/_/g, ' ') : 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Performed By</label>
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedLog.performedBy?.firstName || ''} {selectedLog.performedBy?.lastName || ''}
                          <span className="text-gray-500 text-xs block">{selectedLog.performedBy?.email || ''}</span>
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</label>
                        <p className="text-sm text-gray-900 mt-1">{formatDateTime(selectedLog.timestamp)}</p>
                      </div>
                    </div>

                    {/* Description */}
                    {selectedLog.description && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</label>
                        <p className="text-sm text-gray-900 mt-2">{selectedLog.description}</p>
                      </div>
                    )}

                    {/* IP Address & User Agent */}
                    {(selectedLog.ipAddress || selectedLog.userAgent) && (
                      <div className="grid grid-cols-1 gap-4">
                        {selectedLog.ipAddress && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</label>
                            <p className="text-sm text-gray-900 mt-1 font-mono">{selectedLog.ipAddress}</p>
                          </div>
                        )}
                        {selectedLog.userAgent && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">User Agent</label>
                            <p className="text-sm text-gray-700 mt-1 break-all">{selectedLog.userAgent}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Error Message */}
                    {selectedLog.errorMessage && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <label className="text-xs font-medium text-red-700 uppercase tracking-wider">Error Message</label>
                        <p className="text-sm text-red-800 mt-2">{selectedLog.errorMessage}</p>
                      </div>
                    )}

                    {/* Changes */}
                    {selectedLog.changes && (
                      <div className="space-y-3">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Changes</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedLog.changes.before && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-2">Before</p>
                              <pre className="text-xs text-gray-900 bg-gray-100 p-3 rounded border border-gray-200 overflow-x-auto">
                                {JSON.stringify(selectedLog.changes.before, null, 2)}
                              </pre>
                            </div>
                          )}
                          {selectedLog.changes.after && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-2">After</p>
                              <pre className="text-xs text-gray-900 bg-gray-100 p-3 rounded border border-gray-200 overflow-x-auto">
                                {JSON.stringify(selectedLog.changes.after, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Metadata</label>
                        <pre className="text-xs text-gray-900 bg-gray-100 p-3 rounded border border-gray-200 mt-2 overflow-x-auto">
                          {JSON.stringify(selectedLog.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                  <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                    Close
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  )
}
