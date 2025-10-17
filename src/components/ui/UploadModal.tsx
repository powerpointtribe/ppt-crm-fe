import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import Modal from './Modal'
import FileUpload from './FileUpload'
import Button from './Button'
import Card from './Card'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  moduleType: 'members' | 'users' | 'groups' | 'first-timers'
  onUpload: (file: File) => Promise<any>
  onDownloadTemplate?: () => void
}

export default function UploadModal({
  isOpen,
  onClose,
  moduleType,
  onUpload,
  onDownloadTemplate
}: UploadModalProps) {
  const [uploadResults, setUploadResults] = useState<{
    success: number
    errors: number
    total: number
    errorDetails?: string[]
  } | null>(null)

  const handleUpload = async (file: File) => {
    try {
      const result = await onUpload(file)

      // Extract results from API response
      setUploadResults({
        success: result.successCount || 0,
        errors: result.errorCount || 0,
        total: result.totalProcessed || 0,
        errorDetails: result.errors || []
      })

      return result
    } catch (error) {
      throw error
    }
  }

  const handleClose = () => {
    setUploadResults(null)
    onClose()
  }

  const getModuleTitle = () => {
    const titles = {
      members: 'Import Members',
      users: 'Import Users',
      groups: 'Import Groups',
      'first-timers': 'Import First Timers'
    }
    return titles[moduleType]
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getModuleTitle()}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {!uploadResults ? (
          <>
            {/* Upload Instructions */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Before You Start</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Make sure your file follows the correct format. Download our template to get started with the right column structure.
                  </p>
                </div>
              </div>

              {onDownloadTemplate && (
                <Button
                  variant="secondary"
                  onClick={onDownloadTemplate}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template File
                </Button>
              )}
            </div>

            {/* File Upload Component */}
            <FileUpload
              moduleType={moduleType}
              onFileSelect={() => {}}
              onUpload={handleUpload}
              acceptedTypes={['.csv', '.xlsx', '.xls']}
              maxSize={10}
            />

            {/* Additional Help */}
            <Card className="bg-blue-50 border-blue-200">
              <div className="space-y-3">
                <h4 className="font-medium text-blue-900">Tips for Successful Import</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use the template file to ensure correct formatting</li>
                  <li>• Check for duplicate entries before uploading</li>
                  <li>• Ensure email addresses are valid and unique</li>
                  <li>• Phone numbers should include country codes</li>
                  <li>• Dates should be in YYYY-MM-DD format</li>
                </ul>
              </div>
            </Card>
          </>
        ) : (
          /* Upload Results */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Results Summary */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                {uploadResults.errors === 0 ? (
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <AlertCircle className="h-8 w-8 text-yellow-600" />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Upload Complete
                </h3>
                <p className="text-gray-600 mt-1">
                  {uploadResults.errors === 0
                    ? `Successfully imported all ${uploadResults.success} records!`
                    : `Imported ${uploadResults.success} of ${uploadResults.total} records`
                  }
                </p>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="text-center p-4">
                <div className="text-2xl font-bold text-green-600">{uploadResults.success}</div>
                <div className="text-sm text-gray-600">Successful</div>
              </Card>
              <Card className="text-center p-4">
                <div className="text-2xl font-bold text-red-600">{uploadResults.errors}</div>
                <div className="text-sm text-gray-600">Errors</div>
              </Card>
              <Card className="text-center p-4">
                <div className="text-2xl font-bold text-gray-900">{uploadResults.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </Card>
            </div>

            {/* Error Details */}
            {uploadResults.errors > 0 && uploadResults.errorDetails && (
              <Card className="bg-red-50 border-red-200">
                <div className="space-y-3">
                  <h4 className="font-medium text-red-900 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Import Errors ({uploadResults.errors})
                  </h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {uploadResults.errorDetails.slice(0, 10).map((error, index) => (
                      <div key={index} className="text-sm text-red-800 bg-red-100 rounded px-2 py-1">
                        {error}
                      </div>
                    ))}
                    {uploadResults.errorDetails.length > 10 && (
                      <p className="text-sm text-red-700 italic">
                        +{uploadResults.errorDetails.length - 10} more errors...
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={handleClose}>
                Close
              </Button>
              {uploadResults.errors > 0 && (
                <Button
                  onClick={() => setUploadResults(null)}
                  variant="primary"
                >
                  Try Again
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </Modal>
  )
}