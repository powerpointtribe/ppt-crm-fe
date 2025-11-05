import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, X, AlertCircle, Check } from 'lucide-react'
import Button from './Button'
import { cn } from '@/utils/cn'
import { uploadService } from '@/services/upload'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  className?: string
  placeholder?: string
  maxSizeMB?: number
  onError?: (error: string) => void
}

export default function ImageUpload({
  value,
  onChange,
  className,
  placeholder = "Upload a photo",
  maxSizeMB = 5,
  onError
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a JPEG, PNG, or WebP image'
    }

    // Check file size
    const maxSize = maxSizeMB * 1024 * 1024
    if (file.size > maxSize) {
      return `File size must be less than ${maxSizeMB}MB`
    }

    return null
  }

  const handleFileSelect = async (file: File) => {
    console.log('File selected for upload:', { name: file.name, size: file.size, type: file.type })

    const validationError = validateFile(file)
    if (validationError) {
      console.error('File validation error:', validationError)
      setError(validationError)
      onError?.(validationError)
      return
    }

    setError(null)
    setUploading(true)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      console.log('Starting image upload...')
      // Upload to backend using the upload service
      const result = await uploadService.uploadImage(file)
      console.log('Image upload successful:', result)
      onChange(result.url)
    } catch (error) {
      console.error('Image upload error:', error)
      const errorMsg = 'Failed to upload image. Please try again.'
      setError(errorMsg)
      onError?.(errorMsg)
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0 && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0 && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const removeImage = () => {
    setPreview(null)
    onChange('')
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer",
          preview || uploading
            ? "border-blue-300 bg-blue-50"
            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50",
          error && "border-red-300 bg-red-50"
        )}
        onClick={!preview ? openFileDialog : undefined}
      >
        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative aspect-square w-full max-w-[200px] mx-auto"
            >
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover rounded-lg"
              />

              {!uploading && (
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage()
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                >
                  <X className="w-3 h-3" />
                </motion.button>
              )}

              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {value && !uploading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg"
                >
                  <Check className="w-3 h-3" />
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center p-8 text-center"
            >
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mb-4",
                error
                  ? "bg-red-100 text-red-600"
                  : "bg-blue-100 text-blue-600"
              )}>
                {error ? <AlertCircle className="w-8 h-8" /> : <Camera className="w-8 h-8" />}
              </div>

              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {error ? 'Upload Error' : placeholder}
              </h4>

              {error ? (
                <p className="text-sm text-red-600 mb-4">{error}</p>
              ) : (
                <p className="text-sm text-gray-600 mb-4">
                  Drag and drop an image here, or click to browse
                </p>
              )}

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant={error ? "danger" : "primary"}
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={openFileDialog}
                >
                  <Upload className="w-4 h-4" />
                  {error ? 'Try Again' : 'Choose Photo'}
                </Button>
              </div>

              <p className="text-xs text-gray-500 mt-3">
                JPEG, PNG, or WebP • Max {maxSizeMB}MB
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}