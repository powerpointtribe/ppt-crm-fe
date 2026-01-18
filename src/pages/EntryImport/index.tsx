import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  FileText,
  Info,
  RefreshCw,
  Trash2,
  Eye,
  Clock,
  ChevronRight,
  BookOpen,
  FileDown,
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import {
  entryImportService,
  EntryImportEntityType,
  EntryImport,
  EntryImportStats,
  EntityTypeInfo,
} from '@/services/entry-import'
import { branchesService } from '@/services/branches'
import type { Branch } from '@/types/branch'

export default function EntryImportPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [entityTypes, setEntityTypes] = useState<EntityTypeInfo[]>([])
  const [selectedEntityType, setSelectedEntityType] = useState<EntryImportEntityType | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [downloadingSample, setDownloadingSample] = useState(false)

  // Branch selection for entity types that require it
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null)
  const [loadingBranches, setLoadingBranches] = useState(false)

  // Import tracking
  const [currentImport, setCurrentImport] = useState<EntryImport | null>(null)
  const [importStats, setImportStats] = useState<EntryImportStats | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  // Import history
  const [imports, setImports] = useState<EntryImport[]>([])
  const [loadingImports, setLoadingImports] = useState(false)


  // Load entity types on mount
  useEffect(() => {
    loadEntityTypes()
    loadImportHistory()
    loadBranches()

    // Check for entity type in URL params
    const entityTypeParam = searchParams.get('entityType')
    if (entityTypeParam && Object.values(['first_timer', 'member', 'group', 'service_report', 'expense_category']).includes(entityTypeParam)) {
      setSelectedEntityType(entityTypeParam as EntryImportEntityType)
    }
  }, [searchParams])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  const loadEntityTypes = async () => {
    try {
      const response = await entryImportService.getEntityTypes()
      setEntityTypes(response.data)
      if (response.data.length > 0 && !selectedEntityType) {
        setSelectedEntityType(response.data[0].entityType)
      }
    } catch (error: any) {
      console.error('Failed to load entity types:', error)
      toast.error('Failed to load import options')
    }
  }

  const loadBranches = async () => {
    console.log('Loading branches...')
    setLoadingBranches(true)
    try {
      // Try selector endpoint first (optimized for dropdowns), fall back to main endpoint
      let branchList: Branch[] = []
      try {
        branchList = await branchesService.getBranchesForSelector()
      } catch {
        console.log('Selector endpoint failed, trying main endpoint...')
        branchList = await branchesService.getBranches()
      }
      console.log('Branches loaded:', branchList)
      console.log('Branches count:', branchList?.length)
      setBranches(branchList || [])
      // Auto-select first branch if only one exists
      if (branchList?.length === 1) {
        setSelectedBranchId(branchList[0]._id)
      }
    } catch (error: any) {
      console.error('Failed to load branches:', error)
      toast.error('Failed to load branches')
    } finally {
      setLoadingBranches(false)
    }
  }

  const loadImportHistory = async () => {
    setLoadingImports(true)
    try {
      const response = await entryImportService.getImports({ limit: 10 })
      setImports(response.data)
    } catch (error: any) {
      console.error('Failed to load import history:', error)
    } finally {
      setLoadingImports(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a CSV file')
        return
      }
      setFile(selectedFile)
      setCurrentImport(null)
      setImportStats(null)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.csv')) {
        toast.error('Please select a CSV file')
        return
      }
      setFile(droppedFile)
      setCurrentImport(null)
      setImportStats(null)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const startPolling = useCallback((importId: string) => {
    // Clear any existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }

    const poll = async () => {
      try {
        const response = await entryImportService.getImportById(importId)
        setCurrentImport(response.data.import)
        setImportStats(response.data.stats)

        // Stop polling if import is complete
        if (['completed', 'failed', 'partially_completed'].includes(response.data.import.status)) {
          if (pollingInterval) {
            clearInterval(pollingInterval)
            setPollingInterval(null)
          }
          loadImportHistory()

          // Show completion toast
          if (response.data.import.status === 'completed') {
            toast.success(`Import completed! ${response.data.import.successCount} records imported.`)
          } else if (response.data.import.status === 'failed') {
            toast.error(`Import failed. ${response.data.import.errorCount} errors.`)
          } else {
            toast.warning(`Import partially completed. ${response.data.import.successCount} succeeded, ${response.data.import.errorCount} failed.`)
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }

    // Initial poll
    poll()

    // Set up interval
    const interval = setInterval(poll, 2000)
    setPollingInterval(interval)
  }, [pollingInterval, toast])

  const handleUpload = async () => {
    if (!file || !selectedEntityType) {
      toast.error('Please select a file and entity type')
      return
    }

    if (!selectedBranchId) {
      toast.error('Please select a branch/campus')
      return
    }

    setUploading(true)
    try {
      const response = await entryImportService.uploadCsv(
        selectedEntityType,
        file,
        selectedBranchId
      )

      toast.success('Import started! Processing in the background...')
      setCurrentImport({
        _id: response.data.importId,
        entityType: response.data.entityType,
        fileName: response.data.fileName,
        totalRecords: response.data.totalRecords,
        processedRecords: 0,
        successCount: 0,
        errorCount: 0,
        skippedCount: 0,
        status: response.data.status,
        createdBy: { _id: '', firstName: '', lastName: '', email: '' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // Start polling for progress
      startPolling(response.data.importId)
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to start import')
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadSample = async () => {
    if (!selectedEntityType) return

    setDownloadingSample(true)
    try {
      const response = await entryImportService.getTemplate(selectedEntityType)
      const csvContent = response.data.csvContent

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedEntityType}-import-template.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Sample CSV downloaded')
    } catch (error: any) {
      console.error('Download error:', error)
      toast.error('Failed to download sample CSV')
    } finally {
      setDownloadingSample(false)
    }
  }

  const handleRetry = async (importId: string) => {
    try {
      const response = await entryImportService.retryFailedItems(importId)
      toast.success(`Retrying ${response.data.retriedCount} failed items...`)
      startPolling(importId)
    } catch (error: any) {
      toast.error('Failed to retry items')
    }
  }

  const handleDelete = async (importId: string) => {
    if (!confirm('Are you sure you want to delete this import?')) return

    try {
      await entryImportService.deleteImport(importId)
      toast.success('Import deleted')
      loadImportHistory()
      if (currentImport?._id === importId) {
        setCurrentImport(null)
        setImportStats(null)
      }
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

  const selectedEntityInfo = entityTypes.find(e => e.entityType === selectedEntityType)

  return (
    <Layout>
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <h1 className="text-2xl font-bold text-gray-900">Entry Import</h1>
          <p className="text-gray-600 mt-1">
            Import records from CSV files. Only Super Admins can access this feature.
          </p>
        </div>

        {/* Branch Selection - At the top for all imports */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Branch/Campus <span className="text-red-500">*</span>
          </label>
          {loadingBranches ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading branches...
            </div>
          ) : branches.length === 0 ? (
            <p className="text-amber-600 text-sm">No branches found. Please create a branch first.</p>
          ) : (
            <select
              value={selectedBranchId || ''}
              onChange={(e) => setSelectedBranchId(e.target.value || null)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select a Branch --</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Entity Type Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Import Type</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {entityTypes.map((type) => (
                  <button
                    key={type.entityType}
                    onClick={() => setSelectedEntityType(type.entityType)}
                    className={`
                      p-4 rounded-lg border-2 text-left transition-all
                      ${selectedEntityType === type.entityType
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <p className="font-medium text-gray-900">{type.displayName}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{type.description}</p>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Drop Zone */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Upload CSV File
              </h2>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                  ${file
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <FileSpreadsheet className="w-12 h-12 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                        setCurrentImport(null)
                        setImportStats(null)
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <FileSpreadsheet className="w-12 h-12 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-700">
                        Drop your CSV file here, or click to browse
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Supports .csv files up to 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="mt-4 flex justify-end gap-3">
                <Button
                  onClick={handleDownloadSample}
                  variant="outline"
                  disabled={downloadingSample || !selectedEntityType}
                >
                  {downloadingSample ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Download Template
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!file || uploading || !selectedEntityType || !selectedBranchId}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Start Import
                    </>
                  )}
                </Button>
              </div>
            </motion.div>

            {/* Progress Section */}
            <AnimatePresence>
              {currentImport && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Import Progress</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(currentImport.status)}`}>
                      {getStatusIcon(currentImport.status)}
                      {currentImport.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Processing {currentImport.fileName}</span>
                      <span>{currentImport.processedRecords} / {currentImport.totalRecords}</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{
                          width: `${(currentImport.processedRecords / currentImport.totalRecords) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{currentImport.successCount}</p>
                      <p className="text-sm text-green-700">Imported</p>
                    </div>
                    <div className={`rounded-lg p-4 text-center ${currentImport.errorCount > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                      <p className={`text-2xl font-bold ${currentImport.errorCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {currentImport.errorCount}
                      </p>
                      <p className={`text-sm ${currentImport.errorCount > 0 ? 'text-red-700' : 'text-gray-500'}`}>Failed</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-gray-600">{currentImport.skippedCount}</p>
                      <p className="text-sm text-gray-500">Skipped</p>
                    </div>
                  </div>

                  {/* Message */}
                  {currentImport.message && (
                    <div className={`rounded-lg p-4 mb-4 ${
                      currentImport.status === 'completed' ? 'bg-green-50 border border-green-200' :
                      currentImport.status === 'failed' ? 'bg-red-50 border border-red-200' :
                      'bg-amber-50 border border-amber-200'
                    }`}>
                      <p className={`text-sm ${
                        currentImport.status === 'completed' ? 'text-green-800' :
                        currentImport.status === 'failed' ? 'text-red-800' :
                        'text-amber-800'
                      }`}>
                        {currentImport.message}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {['completed', 'failed', 'partially_completed'].includes(currentImport.status) && (
                    <div className="flex justify-end gap-3">
                      {currentImport.errorCount > 0 && (
                        <Button
                          variant="outline"
                          onClick={() => handleRetry(currentImport._id)}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retry Failed
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/entry-import/${currentImport._id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        onClick={() => {
                          setFile(null)
                          setCurrentImport(null)
                          setImportStats(null)
                        }}
                      >
                        New Import
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Import History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Imports</h2>
                <button
                  onClick={loadImportHistory}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={loadingImports}
                >
                  <RefreshCw className={`w-4 h-4 ${loadingImports ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {imports.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No imports yet</p>
              ) : (
                <div className="space-y-3">
                  {imports.map((imp) => (
                    <div
                      key={imp._id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(imp.status)}`}>
                            {imp.status.replace('_', ' ')}
                          </span>
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {imp.fileName}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {imp.successCount}/{imp.totalRecords} imported
                          {' - '}
                          {new Date(imp.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => navigate(`/entry-import/${imp._id}`)}
                          className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(imp._id)}
                          className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            {/* Master Member Guide & Template Downloads */}
            {selectedEntityType === 'master_member' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6"
              >
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Master Member Upload
                </h3>
                <p className="text-sm text-purple-700 mb-4">
                  Download the guide and template to help you prepare your member data for import.
                </p>
                <div className="space-y-3">
                  <a
                    href="/docs/master-member-upload-guide.md"
                    download="master-member-upload-guide.md"
                    className="flex items-center gap-3 w-full px-4 py-3 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors group"
                  >
                    <BookOpen className="w-5 h-5 text-purple-600 group-hover:text-purple-700" />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900 text-sm">Upload Guide</p>
                      <p className="text-xs text-gray-500">Step-by-step instructions</p>
                    </div>
                    <Download className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
                  </a>
                  <a
                    href="/docs/master-member-template.csv"
                    download="master-member-template.csv"
                    className="flex items-center gap-3 w-full px-4 py-3 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors group"
                  >
                    <FileDown className="w-5 h-5 text-green-600 group-hover:text-green-700" />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900 text-sm">CSV Template</p>
                      <p className="text-xs text-gray-500">Sample data with 10 rows</p>
                    </div>
                    <Download className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                  </a>
                </div>
              </motion.div>
            )}

            {/* Supported Fields */}
            {selectedEntityInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  {selectedEntityInfo.displayName} Columns
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedEntityInfo.sampleHeaders.map((header, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0"
                    >
                      <span className="text-gray-700">{header}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Tips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-blue-50 rounded-xl border border-blue-200 p-6"
            >
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Import Tips
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">1.</span>
                  Imports are processed in the background
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">2.</span>
                  Each row is processed individually
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">3.</span>
                  Duplicate detection is automatic
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">4.</span>
                  Failed rows can be retried
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">5.</span>
                  Download template for correct format
                </li>
              </ul>
            </motion.div>

            {/* Documentation Downloads - Always visible */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Documentation
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Download guides and templates for bulk imports.
              </p>
              <div className="space-y-2">
                <a
                  href="/docs/master-member-upload-guide.md"
                  download="master-member-upload-guide.md"
                  className="flex items-center gap-3 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors group"
                >
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <span className="flex-1 text-sm text-gray-700 group-hover:text-purple-700">Master Member Guide</span>
                  <Download className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
                </a>
                <a
                  href="/docs/master-member-template.csv"
                  download="master-member-template.csv"
                  className="flex items-center gap-3 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors group"
                >
                  <FileDown className="w-4 h-4 text-green-600" />
                  <span className="flex-1 text-sm text-gray-700 group-hover:text-green-700">Master Member Template</span>
                  <Download className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
