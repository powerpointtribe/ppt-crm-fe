import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Download,
  FileText,
  Users,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/utils/cn'
import Button from './Button'
import Card from './Card'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onUpload: (file: File) => Promise<any>
  acceptedTypes?: string[]
  maxSize?: number // in MB
  moduleType: 'members' | 'users' | 'groups' | 'first-timers'
  disabled?: boolean
  className?: string
}

interface FileWithPreview extends File {
  preview?: string
  status?: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  progress?: number
}

export default function FileUpload({
  onFileSelect,
  onUpload,
  acceptedTypes = ['.csv', '.xlsx', '.xls'],
  maxSize = 10,
  moduleType,
  disabled = false,
  className
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<FileWithPreview | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getModuleConfig = () => {
    const configs = {
      members: {
        title: 'Import Members',
        description: 'Upload member data in bulk',
        icon: Users,
        color: 'blue',
        sampleFields: ['firstName', 'lastName', 'email', 'phone', 'district']
      },
      users: {
        title: 'Import Users',
        description: 'Upload system users in bulk',
        icon: Users,
        color: 'green',
        sampleFields: ['firstName', 'lastName', 'email', 'role', 'phone']
      },
      groups: {
        title: 'Import Groups',
        description: 'Upload group data in bulk',
        icon: Users,
        color: 'purple',
        sampleFields: ['name', 'type', 'description', 'capacity']
      },
      'first-timers': {
        title: 'Import First Timers',
        description: 'Upload visitor data in bulk',
        icon: Users,
        color: 'orange',
        sampleFields: ['firstName', 'lastName', 'phone', 'visitDate']
      }
    }
    return configs[moduleType]
  }

  const config = getModuleConfig()

  const validateFile = (file: File): string | null => {
    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!acceptedTypes.includes(fileExtension)) {
      return `File type not supported. Please upload ${acceptedTypes.join(', ')} files only.`
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSize) {
      return `File size too large. Maximum size is ${maxSize}MB.`
    }

    return null
  }

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file)

    const fileWithPreview: FileWithPreview = {
      ...file,
      status: error ? 'error' : 'pending',
      error: error || undefined,
      progress: 0
    }

    setSelectedFile(fileWithPreview)
    onFileSelect(file)
  }, [onFileSelect, acceptedTypes, maxSize])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || selectedFile.status === 'error') return

    const updatedFile: FileWithPreview = {
      ...selectedFile,
      status: 'uploading',
      progress: 0
    }
    setSelectedFile(updatedFile)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = Math.min(prev + Math.random() * 30, 90)
          setSelectedFile(current => current ? { ...current, progress: newProgress } : null)
          return newProgress
        })
      }, 200)

      const result = await onUpload(selectedFile)

      clearInterval(progressInterval)
      setUploadProgress(100)

      setSelectedFile(prev => prev ? {
        ...prev,
        status: 'success',
        progress: 100
      } : null)

    } catch (error: any) {
      setSelectedFile(prev => prev ? {
        ...prev,
        status: 'error',
        error: error.message || 'Upload failed',
        progress: 0
      } : null)
      setUploadProgress(0)
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getStatusIcon = () => {
    if (!selectedFile) return File

    switch (selectedFile.status) {
      case 'success': return CheckCircle
      case 'error': return AlertCircle
      case 'uploading': return Upload
      default: return File
    }
  }

  const getStatusColor = () => {
    if (!selectedFile) return 'text-gray-400'

    switch (selectedFile.status) {
      case 'success': return 'text-green-500'
      case 'error': return 'text-red-500'
      case 'uploading': return 'text-blue-500'
      default: return 'text-gray-600'
    }
  }

  const IconComponent = config.icon
  const StatusIcon = getStatusIcon()

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <Card className="relative overflow-hidden">
        <div
          className={cn(
            'relative p-8 border-2 border-dashed rounded-lg transition-all duration-200',
            isDragOver && 'border-blue-400 bg-blue-50',
            !isDragOver && !selectedFile && 'border-gray-300 hover:border-gray-400',
            selectedFile && selectedFile.status === 'success' && 'border-green-400 bg-green-50',
            selectedFile && selectedFile.status === 'error' && 'border-red-400 bg-red-50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onDrop={disabled ? undefined : handleDrop}
          onDragOver={disabled ? undefined : handleDragOver}
          onDragLeave={disabled ? undefined : handleDragLeave}
        >
          <div className="text-center space-y-4">
            {/* Icon and Title */}
            <div className="flex flex-col items-center space-y-2">
              <div className={cn(
                'p-3 rounded-full',
                `bg-${config.color}-100`
              )}>
                <IconComponent className={cn('h-8 w-8', `text-${config.color}-600`)} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
              <p className="text-sm text-gray-600">{config.description}</p>
            </div>

            {/* File Selection Area */}
            {!selectedFile ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-gray-600">
                    Drop your file here, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-500 font-medium underline"
                      disabled={disabled}
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports {acceptedTypes.join(', ')} files up to {maxSize}MB
                  </p>
                </div>

                {/* Sample Data Info */}
                <div className="bg-gray-50 rounded-lg p-4 text-left">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Required Columns:</h4>
                  <div className="flex flex-wrap gap-2">
                    {config.sampleFields.map((field) => (
                      <span
                        key={field}
                        className="px-2 py-1 bg-white rounded text-xs text-gray-600 border"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* File Preview */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-center space-x-3">
                  <StatusIcon className={cn('h-6 w-6', getStatusColor())} />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={clearFile}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>

                {/* Progress Bar */}
                {selectedFile.status === 'uploading' && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-blue-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedFile.progress || 0}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}

                {/* Status Messages */}
                {selectedFile.status === 'success' && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Upload successful!</span>
                  </div>
                )}

                {selectedFile.status === 'error' && selectedFile.error && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{selectedFile.error}</span>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />
        </div>
      </Card>

      {/* Action Buttons */}
      <AnimatePresence>
        {selectedFile && selectedFile.status !== 'success' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex space-x-3"
          >
            <Button
              onClick={handleUpload}
              disabled={selectedFile.status === 'error' || selectedFile.status === 'uploading'}
              loading={selectedFile.status === 'uploading'}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              {selectedFile.status === 'uploading' ? 'Uploading...' : 'Upload File'}
            </Button>
            <Button variant="secondary" onClick={clearFile}>
              Cancel
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Section */}
      <Card className="bg-amber-50 border-amber-200">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-medium text-amber-900">Upload Guidelines</h4>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Ensure your CSV/Excel file has headers in the first row</li>
              <li>• Use the exact column names shown above</li>
              <li>• Remove any empty rows at the end of your file</li>
              <li>• Preview your data before uploading to avoid errors</li>
            </ul>
            <button className="text-sm text-amber-700 hover:text-amber-900 font-medium underline">
              Download Sample Template
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}