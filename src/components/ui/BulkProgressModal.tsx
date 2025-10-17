import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import { BulkOperationProgress } from '@/utils/bulkOperations'

interface BulkProgressModalProps {
  isOpen: boolean
  onClose: () => void
  operation: string
  entityName: string
  progress: BulkOperationProgress
  isComplete: boolean
  errors?: string[]
}

export default function BulkProgressModal({
  isOpen,
  onClose,
  operation,
  entityName,
  progress,
  isComplete,
  errors = []
}: BulkProgressModalProps) {
  const progressPercentage = progress.total > 0 ? (progress.processed / progress.total) * 100 : 0
  const hasErrors = errors.length > 0 || progress.failed > 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={isComplete ? onClose : undefined}
      title={`${operation} ${entityName}s`}
      showCloseButton={isComplete}
    >
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span>{progress.processed} of {progress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className={`h-2 rounded-full ${hasErrors ? 'bg-yellow-500' : 'bg-blue-600'}`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Current Status */}
        {progress.current && !isComplete && (
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-gray-700">{progress.current}</span>
          </div>
        )}

        {/* Summary */}
        {isComplete && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              {hasErrors ? (
                <XCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-medium">
                  {hasErrors ? 'Completed with errors' : 'Successfully completed'}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {progress.processed} {entityName}s processed
                  {progress.failed > 0 && `, ${progress.failed} failed`}
                </div>
              </div>
            </div>

            {/* Error Details */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="font-medium text-red-800 mb-2">Errors:</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {errors.slice(0, 10).map((error, index) => (
                    <div key={index} className="text-sm text-red-700">
                      • {error}
                    </div>
                  ))}
                  {errors.length > 10 && (
                    <div className="text-sm text-red-600 italic">
                      ... and {errors.length - 10} more errors
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {isComplete && (
          <div className="flex justify-end">
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}