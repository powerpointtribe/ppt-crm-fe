import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Trash2,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import {
  entryImportService,
  EntryImport,
  EntryImportItem,
  EntryImportStats,
  EntryImportItemStatus,
} from '@/services/entry-import'

export default function ImportDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [entryImport, setEntryImport] = useState<EntryImport | null>(null)
  const [stats, setStats] = useState<EntryImportStats | null>(null)
  const [items, setItems] = useState<EntryImportItem[]>([])
  const [itemsTotal, setItemsTotal] = useState(0)
  const [itemsPage, setItemsPage] = useState(1)
  const [itemsLoading, setItemsLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<EntryImportItemStatus | 'all'>('all')
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    if (id) {
      loadImport()
    }
  }, [id])

  useEffect(() => {
    if (id) {
      loadItems()
    }
  }, [id, itemsPage, statusFilter])

  const loadImport = async () => {
    if (!id) return
    setLoading(true)
    try {
      const response = await entryImportService.getImportById(id)
      setEntryImport(response.data.import)
      setStats(response.data.stats)
    } catch (error: any) {
      console.error('Failed to load import:', error)
      toast.error('Failed to load import details')
    } finally {
      setLoading(false)
    }
  }

  const loadItems = async () => {
    if (!id) return
    setItemsLoading(true)
    try {
      const response = await entryImportService.getImportItems(id, {
        page: itemsPage,
        limit: 20,
        status: statusFilter === 'all' ? undefined : statusFilter,
      })
      setItems(response.data)
      setItemsTotal(response.pagination.total)
    } catch (error: any) {
      console.error('Failed to load items:', error)
    } finally {
      setItemsLoading(false)
    }
  }

  const handleRetry = async () => {
    if (!id) return
    setRetrying(true)
    try {
      const response = await entryImportService.retryFailedItems(id)
      toast.success(`Retrying ${response.data.retriedCount} failed items...`)
      loadImport()
      loadItems()
    } catch (error: any) {
      toast.error('Failed to retry items')
    } finally {
      setRetrying(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    if (!confirm('Are you sure you want to delete this import?')) return

    try {
      await entryImportService.deleteImport(id)
      toast.success('Import deleted')
      navigate('/entry-import')
    } catch (error: any) {
      toast.error('Failed to delete import')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'failed':
        return 'text-red-600 bg-red-100'
      case 'partially_completed':
        return 'text-amber-600 bg-amber-100'
      case 'processing':
        return 'text-blue-600 bg-blue-100'
      case 'skipped':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'failed':
        return <XCircle className="w-4 h-4" />
      case 'partially_completed':
        return <AlertTriangle className="w-4 h-4" />
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const totalPages = Math.ceil(itemsTotal / 20)

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    )
  }

  if (!entryImport) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Import not found</p>
          <Button onClick={() => navigate('/entry-import')} className="mt-4">
            Back to Imports
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/entry-import')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Imports
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{entryImport.fileName}</h1>
              <p className="text-gray-600 mt-1">
                {entryImport.entityType.replace('_', ' ')} import
                {' - '}
                {new Date(entryImport.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {entryImport.errorCount > 0 && ['completed', 'failed', 'partially_completed'].includes(entryImport.status) && (
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  disabled={retrying}
                >
                  {retrying ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Retry Failed
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Status and Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <p className="text-sm text-gray-600 mb-2">Status</p>
            <span className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-2 ${getStatusColor(entryImport.status)}`}>
              {getStatusIcon(entryImport.status)}
              {entryImport.status.replace('_', ' ')}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <p className="text-sm text-gray-600 mb-2">Total Records</p>
            <p className="text-2xl font-bold text-gray-900">{entryImport.totalRecords}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-green-50 rounded-xl border border-green-200 p-6"
          >
            <p className="text-sm text-green-700 mb-2">Imported</p>
            <p className="text-2xl font-bold text-green-600">{entryImport.successCount}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`rounded-xl border p-6 ${entryImport.errorCount > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}
          >
            <p className={`text-sm mb-2 ${entryImport.errorCount > 0 ? 'text-red-700' : 'text-gray-600'}`}>Failed</p>
            <p className={`text-2xl font-bold ${entryImport.errorCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {entryImport.errorCount}
            </p>
          </motion.div>
        </div>

        {/* Message */}
        {entryImport.message && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-4 mb-8 ${
              entryImport.status === 'completed' ? 'bg-green-50 border border-green-200' :
              entryImport.status === 'failed' ? 'bg-red-50 border border-red-200' :
              'bg-amber-50 border border-amber-200'
            }`}
          >
            <p className={`${
              entryImport.status === 'completed' ? 'text-green-800' :
              entryImport.status === 'failed' ? 'text-red-800' :
              'text-amber-800'
            }`}>
              {entryImport.message}
            </p>
          </motion.div>
        )}

        {/* Items List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Import Items</h2>
              <div className="flex items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as EntryImportItemStatus | 'all')
                    setItemsPage(1)
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="skipped">Skipped</option>
                </select>
                <button
                  onClick={loadItems}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                  disabled={itemsLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${itemsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {itemsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No items found</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-gray-500">
                            Row {item.rowNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${getStatusColor(item.status)}`}>
                            {getStatusIcon(item.status)}
                            {item.status}
                          </span>
                        </div>

                        {/* Mapped Data Preview */}
                        <div className="text-sm text-gray-700">
                          {item.mappedData && (
                            <p>
                              {item.mappedData.firstName} {item.mappedData.lastName}
                              {item.mappedData.phone && ` - ${item.mappedData.phone}`}
                              {item.mappedData.email && ` - ${item.mappedData.email}`}
                            </p>
                          )}
                        </div>

                        {/* Errors */}
                        {item.errors.length > 0 && (
                          <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-600">
                            {item.errors.map((error, i) => (
                              <p key={i}>{error}</p>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Raw Data Toggle */}
                      <details className="ml-4">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          View raw data
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto max-w-md">
                          {JSON.stringify(item.rawData, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {(itemsPage - 1) * 20 + 1} - {Math.min(itemsPage * 20, itemsTotal)} of {itemsTotal}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setItemsPage(p => Math.max(1, p - 1))}
                      disabled={itemsPage === 1}
                      className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {itemsPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setItemsPage(p => Math.min(totalPages, p + 1))}
                      disabled={itemsPage === totalPages}
                      className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </Layout>
  )
}
