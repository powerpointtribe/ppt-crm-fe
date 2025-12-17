import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  User,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  X,
  Clock
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { auditService, AuditLog, AuditQueryParams, AuditSeverity, AuditAction, AuditEntity } from '@/services/audit'
import { formatDateTime, formatDate } from '@/utils/formatters'

export default function AuditLogs() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedAction, setSelectedAction] = useState(searchParams.get('action') || '')
  const [selectedEntity, setSelectedEntity] = useState(searchParams.get('entity') || '')
  const [selectedSeverity, setSelectedSeverity] = useState(searchParams.get('severity') || '')
  const [selectedSuccess, setSelectedSuccess] = useState(searchParams.get('success') || '')
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '')

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  useEffect(() => {
    loadLogs()
  }, [searchParams])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const params: AuditQueryParams = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: 50,
        search: searchParams.get('search') || undefined,
        action: searchParams.get('action') as AuditAction || undefined,
        entity: searchParams.get('entity') as AuditEntity || undefined,
        severity: searchParams.get('severity') as AuditSeverity || undefined,
        success: searchParams.get('success') === 'true' ? true : searchParams.get('success') === 'false' ? false : undefined,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
        sortBy: 'timestamp',
        sortOrder: 'desc'
      }

      const response = await auditService.getAuditLogs(params)
      setLogs(response.items)
      setPagination(response.pagination)
    } catch (error: any) {
      console.error('Error loading audit logs:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateUrlParams({ search: searchTerm || undefined })
  }

  const handleExport = () => {
    // Implement export functionality
    console.log('Export functionality to be implemented')
  }

  const updateUrlParams = (updates: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value)
      } else {
        newParams.delete(key)
      }
    })
    newParams.set('page', '1')
    setSearchParams(newParams)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedAction('')
    setSelectedEntity('')
    setSelectedSeverity('')
    setSelectedSuccess('')
    setStartDate('')
    setEndDate('')
    setSearchParams({})
  }

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('page', page.toString())
    setSearchParams(newParams)
  }

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return <User className="h-4 w-4" />
    if (action.includes('CREATE')) return <CheckCircle className="h-4 w-4" />
    if (action.includes('DELETE')) return <AlertTriangle className="h-4 w-4" />
    if (action.includes('UPDATE')) return <Activity className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const hasActiveFilters = searchTerm || selectedAction || selectedEntity || selectedSeverity || selectedSuccess || startDate || endDate

  // Search Section to be displayed in header
  const searchSection = (
    <form onSubmit={handleSearch} className="flex gap-3 flex-wrap items-center w-full">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          />
        </div>
      </div>

      {!showFilters && selectedAction && (
        <select
          value={selectedAction}
          onChange={(e) => {
            setSelectedAction(e.target.value)
            updateUrlParams({ action: e.target.value || undefined })
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">All Actions</option>
          <option value="LOGIN">Login</option>
          <option value="LOGOUT">Logout</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
        </select>
      )}

      {!showFilters && selectedEntity && (
        <select
          value={selectedEntity}
          onChange={(e) => {
            setSelectedEntity(e.target.value)
            updateUrlParams({ entity: e.target.value || undefined })
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">All Entities</option>
          <option value="MEMBER">Member</option>
          <option value="USER">User</option>
          <option value="INVENTORY_ITEM">Inventory Item</option>
        </select>
      )}

      <button
        type="submit"
        className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
      >
        Search
      </button>

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
    </form>
  )

  if (loading) {
    return (
      <Layout
        title="Audit Logs"
        subtitle="View and analyze system activity logs"
        searchSection={searchSection}
      >
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      title="Audit Logs"
      subtitle="View and analyze system activity logs"
      searchSection={searchSection}
    >
      <div className="space-y-6">
        {/* Advanced Filters */}
        {showFilters && (
          <Card className="p-6">
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                  <select
                    value={selectedAction}
                    onChange={(e) => {
                      setSelectedAction(e.target.value)
                      updateUrlParams({ action: e.target.value || undefined })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Actions</option>
                    <option value="LOGIN">Login</option>
                    <option value="LOGOUT">Logout</option>
                    <option value="CREATE">Create</option>
                    <option value="UPDATE">Update</option>
                    <option value="DELETE">Delete</option>
                    <option value="MEMBER_CREATED">Member Created</option>
                    <option value="INVENTORY_ITEM_CREATED">Inventory Item Created</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entity</label>
                  <select
                    value={selectedEntity}
                    onChange={(e) => {
                      setSelectedEntity(e.target.value)
                      updateUrlParams({ entity: e.target.value || undefined })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Entities</option>
                    <option value="MEMBER">Member</option>
                    <option value="USER">User</option>
                    <option value="INVENTORY_ITEM">Inventory Item</option>
                    <option value="FINANCIAL_TRANSACTION">Financial Transaction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                  <select
                    value={selectedSeverity}
                    onChange={(e) => {
                      setSelectedSeverity(e.target.value)
                      updateUrlParams({ severity: e.target.value || undefined })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Severities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Success Status</label>
                  <select
                    value={selectedSuccess}
                    onChange={(e) => {
                      setSelectedSuccess(e.target.value)
                      updateUrlParams({ success: e.target.value || undefined })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All</option>
                    <option value="true">Successful</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value)
                      updateUrlParams({ startDate: e.target.value || undefined })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value)
                      updateUrlParams({ endDate: e.target.value || undefined })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </motion.div>
          </Card>
        )}

        {/* Active Filters Badge */}
        {hasActiveFilters && !showFilters && (
          <Card className="p-4">
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <Badge variant="outline">
                  Search: {searchTerm}
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      updateUrlParams({ search: undefined })
                    }}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedAction && (
                <Badge variant="outline">
                  Action: {selectedAction}
                  <button
                    onClick={() => {
                      setSelectedAction('')
                      updateUrlParams({ action: undefined })
                    }}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          </Card>
        )}

        {/* Logs List */}
        {error ? (
          <div className="text-center text-red-600 p-8">
            <p>Error loading audit logs: {error.message}</p>
            <Button variant="outline" size="sm" onClick={loadLogs} className="mt-4">
              Retry
            </Button>
          </div>
        ) : logs.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
            <p className="text-gray-600">No audit logs match your current filters</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
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
                    <tr key={log._id} className="hover:bg-gray-50">
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
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.entity.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.performedBy.firstName} {log.performedBy.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {log.success ? 'Success' : 'Failed'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={auditService.getSeverityColor(log.severity)}>
                          {log.severity}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="outline"
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
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
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
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Log Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Audit Log Details</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedLog(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Action</label>
                      <p className="text-sm text-gray-900">{selectedLog.action.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Entity</label>
                      <p className="text-sm text-gray-900">{selectedLog.entity.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Performed By</label>
                      <p className="text-sm text-gray-900">
                        {selectedLog.performedBy.firstName} {selectedLog.performedBy.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Timestamp</label>
                      <p className="text-sm text-gray-900">{formatDateTime(selectedLog.timestamp)}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-sm text-gray-900">{selectedLog.description}</p>
                  </div>

                  {selectedLog.ipAddress && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">IP Address</label>
                      <p className="text-sm text-gray-900">{selectedLog.ipAddress}</p>
                    </div>
                  )}

                  {selectedLog.errorMessage && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Error Message</label>
                      <p className="text-sm text-red-600">{selectedLog.errorMessage}</p>
                    </div>
                  )}

                  {selectedLog.changes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Changes</label>
                      <pre className="text-sm text-gray-900 bg-gray-100 p-3 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(selectedLog.changes, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  )
}