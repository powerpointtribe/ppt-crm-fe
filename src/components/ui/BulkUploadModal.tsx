import { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, X, Download, Eye } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import { bulkOperationsService, BulkOperationType } from '@/services/bulkOperations'
import { BulkOperationProgress } from '@/utils/bulkOperations'
import ValidationUtils from '@/utils/validation'

interface BulkUploadModalProps {
  isOpen: boolean
  onClose: () => void
  entityName: string
  entityType: string
  onSuccess?: (result: any) => void
  allowedFormats?: string[]
  maxFileSize?: number // in MB
  templateColumns?: string[]
}

interface UploadStep {
  id: 'upload' | 'preview' | 'processing' | 'complete'
  title: string
  description: string
}

const steps: UploadStep[] = [
  {
    id: 'upload',
    title: 'Upload File',
    description: 'Select a CSV or Excel file to upload'
  },
  {
    id: 'preview',
    title: 'Preview Data',
    description: 'Review and validate the data before importing'
  },
  {
    id: 'processing',
    title: 'Processing',
    description: 'Importing data into the system'
  },
  {
    id: 'complete',
    title: 'Complete',
    description: 'Import completed successfully'
  }
]

export default function BulkUploadModal({
  isOpen,
  onClose,
  entityName,
  entityType,
  onSuccess,
  allowedFormats = ['.csv', '.xlsx', '.xls'],
  maxFileSize = 10, // 10MB default
  templateColumns = []
}: BulkUploadModalProps) {
  const [currentStep, setCurrentStep] = useState<UploadStep['id']>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [progress, setProgress] = useState<BulkOperationProgress>({
    total: 0,
    processed: 0,
    failed: 0
  })
  const [results, setResults] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClose = () => {
    setCurrentStep('upload')
    setSelectedFile(null)
    setUploadError(null)
    setPreviewData([])
    setValidationErrors([])
    setProgress({ total: 0, processed: 0, failed: 0 })
    setResults(null)
    onClose()
  }

  const handleFileSelect = (file: File) => {
    setUploadError(null)

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedFormats.includes(fileExtension)) {
      setUploadError(`Invalid file type. Allowed formats: ${allowedFormats.join(', ')}`)
      return
    }

    // Validate file size
    if (file.size > maxFileSize * 1024 * 1024) {
      setUploadError(`File too large. Maximum size: ${maxFileSize}MB`)
      return
    }

    setSelectedFile(file)
    parseFile(file)
  }

  const parseFile = async (file: File) => {
    try {
      // Use the new preview functionality
      const previewResult = await bulkOperationsService.previewBulkOperation(
        entityType,
        file,
        BulkOperationType.CREATE
      )

      if (previewResult.successfulRecords) {
        // Additional client-side validation
        const clientValidationErrors = validateClientSide(previewResult.successfulRecords, entityType)

        setPreviewData(previewResult.successfulRecords.slice(0, 10)) // Show first 10 rows for preview

        // Combine server and client validation errors
        const allErrors = [
          ...previewResult.failedRecords.map(fr => fr.errors).flat(),
          ...clientValidationErrors
        ]
        setValidationErrors(allErrors)
        setCurrentStep('preview')
      } else {
        setUploadError(previewResult.message || 'Failed to parse file')
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to parse file')
    }
  }

  const validateClientSide = (records: any[], entityType: string): string[] => {
    const errors: string[] = []

    records.forEach((record, index) => {
      const rowNumber = index + 2 // Account for header row

      // Validate email if present
      if (record.email) {
        const emailValidation = ValidationUtils.validateEmail(record.email)
        if (!emailValidation.isValid) {
          errors.push(`Row ${rowNumber}: ${emailValidation.error}`)
        }
      }

      // Validate phone if present
      if (record.phone) {
        const phoneValidation = ValidationUtils.validatePhone(record.phone)
        if (!phoneValidation.isValid) {
          errors.push(`Row ${rowNumber}: ${phoneValidation.error}`)
        }
      }

      // Validate emergency contact email if present
      if (record.emergencyContactEmail) {
        const emergencyEmailValidation = ValidationUtils.validateOptionalEmail(record.emergencyContactEmail)
        if (!emergencyEmailValidation.isValid) {
          errors.push(`Row ${rowNumber}: Emergency contact - ${emergencyEmailValidation.error}`)
        }
      }

      // Validate emergency contact phone if present
      if (record.emergencyContactPhone) {
        const emergencyPhoneValidation = ValidationUtils.validateOptionalPhone(record.emergencyContactPhone)
        if (!emergencyPhoneValidation.isValid) {
          errors.push(`Row ${rowNumber}: Emergency contact - ${emergencyPhoneValidation.error}`)
        }
      }

      // Entity-specific validations
      if (entityType === 'members') {
        // Members require email
        if (!record.email) {
          errors.push(`Row ${rowNumber}: Email is required for members`)
        }
      }

      if (entityType === 'first-timers') {
        // First-timers require phone
        if (!record.phone) {
          errors.push(`Row ${rowNumber}: Phone is required for first-timers`)
        }
      }
    })

    return errors
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setCurrentStep('processing')

    try {
      const result = await bulkOperationsService.bulkUpload(
        entityType,
        selectedFile,
        BulkOperationType.CREATE,
        {},
        (progressUpdate) => {
          setProgress(progressUpdate)
        }
      )

      setResults(result)
      setCurrentStep('complete')

      if (onSuccess) {
        onSuccess(result)
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
      setCurrentStep('preview')
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const downloadTemplate = async () => {
    try {
      await bulkOperationsService.downloadTemplate(entityType)
    } catch (error) {
      console.error('Error downloading template:', error)
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === step.id
              ? 'bg-blue-600 text-white'
              : steps.findIndex(s => s.id === currentStep) > index
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-600'
          }`}>
            {steps.findIndex(s => s.id === currentStep) > index ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              index + 1
            )}
          </div>
          {index < steps.length - 1 && (
            <div className={`w-16 h-1 mx-2 ${
              steps.findIndex(s => s.id === currentStep) > index
                ? 'bg-green-600'
                : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  )

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900">
            Drop your file here, or{' '}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-500"
            >
              browse
            </button>
          </p>
          <p className="text-sm text-gray-600">
            Supports: {allowedFormats.join(', ')} (max {maxFileSize}MB)
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedFormats.join(',')}
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
        />
      </div>

      {templateColumns.length > 0 && (
        <div className="flex items-center justify-center">
          <Button
            variant="secondary"
            onClick={downloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Template
          </Button>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{uploadError}</p>
        </div>
      )}
    </div>
  )

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Data Preview</h3>
          <p className="text-sm text-gray-600">
            Showing first 10 rows of {selectedFile?.name}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => setCurrentStep('upload')}
        >
          Choose Different File
        </Button>
      </div>

      {validationErrors.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Validation Warnings:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {previewData.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(previewData[0]).map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value: any, cellIndex) => (
                      <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleUpload}>
          Import Data
        </Button>
      </div>
    </div>
  )

  const renderProcessingStep = () => (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
        <Upload className="w-8 h-8 text-blue-600 animate-pulse" />
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Upload</h3>
        <p className="text-gray-600">Please wait while we import your data...</p>
      </div>

      <div className="space-y-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: progress.total > 0 ? `${(progress.processed / progress.total) * 100}%` : '0%'
            }}
          />
        </div>
        <div className="text-sm text-gray-600">
          {progress.processed} of {progress.total} records processed
          {progress.failed > 0 && `, ${progress.failed} failed`}
        </div>
        {progress.current && (
          <div className="text-xs text-gray-500">{progress.current}</div>
        )}
      </div>
    </div>
  )

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Import Complete!</h3>
        <p className="text-gray-600">Your data has been successfully imported.</p>
      </div>

      {results && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-green-600">{results.successCount}</span>
              <p className="text-gray-600">Successful</p>
            </div>
            <div>
              <span className="font-medium text-red-600">{results.errorCount}</span>
              <p className="text-gray-600">Failed</p>
            </div>
            <div>
              <span className="font-medium text-blue-600">{results.totalCount}</span>
              <p className="text-gray-600">Total</p>
            </div>
          </div>

          {results.failedRecords && results.failedRecords.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-red-600 font-medium">
                View Errors ({results.failedRecords.length})
              </summary>
              <div className="mt-2 text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
                {results.failedRecords.map((failedRecord: any, index: number) => (
                  <div key={index}>
                    • Row {failedRecord.row}: {failedRecord.errors.join(', ')}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      <Button onClick={handleClose} className="w-full">
        Done
      </Button>
    </div>
  )

  const renderContent = () => {
    switch (currentStep) {
      case 'upload':
        return renderUploadStep()
      case 'preview':
        return renderPreviewStep()
      case 'processing':
        return renderProcessingStep()
      case 'complete':
        return renderCompleteStep()
      default:
        return renderUploadStep()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {entityName} - Bulk Upload
        </h2>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {renderStepIndicator()}
      {renderContent()}
    </Modal>
  )
}
