import { apiService } from './api'
import { ApiResponse } from '@/types/api'
import { transformSingleResponse, transformPaginatedResponse } from '@/utils/apiResponseTransform'

export enum BulkOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export interface BulkOperationResult {
  successCount: number
  errorCount: number
  totalCount: number
  successfulRecords: any[]
  failedRecords: Array<{
    row: number
    data: any
    errors: string[]
    operation?: BulkOperationType
  }>
  message: string
  operationType: BulkOperationType
}

export interface BulkOperationOptions {
  skipErrors?: boolean
  operationType: BulkOperationType
  identifierField?: string
  defaultValues?: Record<string, any>
  dryRun?: boolean
}

export interface BulkOperationHistory {
  _id: string
  entityType: string
  operation: BulkOperationType
  totalRecords: number
  successCount: number
  errorCount: number
  status: 'completed' | 'failed' | 'pending'
  createdBy: string
  createdAt: Date
  errors?: string[]
}

export interface BulkOperationStats {
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  pendingOperations: number
  recentActivity: Array<{
    id: string
    type: 'upload' | 'update' | 'delete' | 'export'
    entityType: string
    recordsProcessed: number
    status: 'completed' | 'failed' | 'pending'
    timestamp: string
    user: string
  }>
}

export interface Template {
  entityType: string
  name: string
  headers: string[]
  required: string[]
}

// For backward compatibility with existing UI components
export interface BulkUpdateData {
  [key: string]: any
}

export interface ProgressCallback {
  (progress: { total: number; processed: number; failed: number; current: string }): void
}

class BulkOperationsServiceImpl {
  // Download CSV templates
  async downloadTemplate(entityType: string): Promise<void> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/bulk-operations/templates/${entityType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to download template')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${entityType}-template.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading template:', error)
      throw error
    }
  }

  // Get available templates
  async getAvailableTemplates(): Promise<Template[]> {
    const response = await apiService.get<ApiResponse<Template[]>>('/bulk-operations/templates')
    return transformSingleResponse<Template[]>(response) as Template[]
  }

  // Upload file for bulk operations
  async bulkUpload(
    entityType: string,
    file: File,
    operation: BulkOperationType,
    options: BulkOperationOptions = {},
    onProgress?: ProgressCallback
  ): Promise<BulkOperationResult> {
    if (onProgress) {
      onProgress({ total: 1, processed: 0, failed: 0, current: 'Uploading file...' })
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('operation', operation)
    formData.append('options', JSON.stringify(options))

    const response = await apiService.post<ApiResponse<BulkOperationResult>>(
      `/bulk-operations/upload/${entityType}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    const result = transformSingleResponse<BulkOperationResult>(response) as BulkOperationResult

    if (onProgress) {
      onProgress({
        total: result.totalCount,
        processed: result.successCount,
        failed: result.errorCount,
        current: 'Upload completed'
      })
    }

    return result
  }

  // Preview bulk operation without executing
  async previewBulkOperation(
    entityType: string,
    file: File,
    operation: BulkOperationType,
    options: BulkOperationOptions = {}
  ): Promise<BulkOperationResult> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('operation', operation)
    formData.append('options', JSON.stringify({ ...options, dryRun: true }))

    const response = await apiService.post<ApiResponse<BulkOperationResult>>(
      `/bulk-operations/preview/${entityType}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return transformSingleResponse<BulkOperationResult>(response) as BulkOperationResult
  }

  // Export entities as CSV
  async exportEntities(entityType: string, filters: any = {}): Promise<void> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/bulk-operations/export/${entityType}?filters=${encodeURIComponent(JSON.stringify(filters))}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to export data')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      const timestamp = new Date().toISOString().split('T')[0]
      a.download = `${entityType}-export-${timestamp}.csv`

      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting data:', error)
      throw error
    }
  }

  // Get bulk operations history
  async getOperationsHistory(params: {
    page?: number
    limit?: number
    entityType?: string
    operation?: BulkOperationType
  } = {}): Promise<any> {
    const response = await apiService.get<ApiResponse<any>>('/bulk-operations/operations', { params })
    return transformPaginatedResponse(response)
  }

  // Get bulk operations statistics
  async getOperationsStats(): Promise<BulkOperationStats> {
    const response = await apiService.get<ApiResponse<BulkOperationStats>>('/bulk-operations/stats')
    return transformSingleResponse<BulkOperationStats>(response) as BulkOperationStats
  }

  // Update template configuration (admin only)
  async updateTemplate(entityType: string, templateConfig: any): Promise<any> {
    const response = await apiService.patch<ApiResponse<any>>(
      `/bulk-operations/templates/${entityType}`,
      templateConfig
    )
    return transformSingleResponse(response)
  }

  // Convenience methods for specific entity types
  async uploadMembers(file: File, operation: BulkOperationType = BulkOperationType.CREATE, options?: BulkOperationOptions, onProgress?: ProgressCallback): Promise<BulkOperationResult> {
    return this.bulkUpload('members', file, operation, options, onProgress)
  }

  async uploadGroups(file: File, operation: BulkOperationType = BulkOperationType.CREATE, options?: BulkOperationOptions, onProgress?: ProgressCallback): Promise<BulkOperationResult> {
    return this.bulkUpload('groups', file, operation, options, onProgress)
  }

  async uploadFirstTimers(file: File, operation: BulkOperationType = BulkOperationType.CREATE, options?: BulkOperationOptions, onProgress?: ProgressCallback): Promise<BulkOperationResult> {
    return this.bulkUpload('first-timers', file, operation, options, onProgress)
  }

  async previewMembers(file: File, operation: BulkOperationType = BulkOperationType.CREATE, options?: BulkOperationOptions): Promise<BulkOperationResult> {
    return this.previewBulkOperation('members', file, operation, options)
  }

  async previewGroups(file: File, operation: BulkOperationType = BulkOperationType.CREATE, options?: BulkOperationOptions): Promise<BulkOperationResult> {
    return this.previewBulkOperation('groups', file, operation, options)
  }

  async previewFirstTimers(file: File, operation: BulkOperationType = BulkOperationType.CREATE, options?: BulkOperationOptions): Promise<BulkOperationResult> {
    return this.previewBulkOperation('first-timers', file, operation, options)
  }

  async exportMembers(filters: any = {}): Promise<void> {
    return this.exportEntities('members', filters)
  }

  async exportGroups(filters: any = {}): Promise<void> {
    return this.exportEntities('groups', filters)
  }

  async exportFirstTimers(filters: any = {}): Promise<void> {
    return this.exportEntities('first-timers', filters)
  }

  // Backward compatibility methods for existing UI components
  async bulkDelete(entityType: string, ids: string[], onProgress?: ProgressCallback): Promise<any> {
    try {
      if (onProgress) {
        onProgress({ total: ids.length, processed: 0, failed: 0, current: 'Starting deletion...' })
      }

      // Use individual delete requests for now
      let processed = 0
      let failed = 0
      const errors: string[] = []

      for (const id of ids) {
        try {
          await apiService.delete(`/${entityType}/${id}`)
          processed++
          if (onProgress) {
            onProgress({
              total: ids.length,
              processed,
              failed,
              current: `Deleting ${entityType} ${id}...`
            })
          }
        } catch (error: any) {
          failed++
          errors.push(`Failed to delete ${entityType} ${id}: ${error.message}`)
        }
      }

      if (onProgress) {
        onProgress({ total: ids.length, processed, failed, current: 'Completed' })
      }

      return {
        success: failed === 0,
        processedCount: processed,
        failedCount: failed,
        errors: errors.length > 0 ? errors : undefined,
        message: failed === 0
          ? `Successfully deleted ${processed} ${entityType}s`
          : `Deleted ${processed} ${entityType}s, ${failed} failed`
      }
    } catch (error) {
      return {
        success: false,
        processedCount: 0,
        failedCount: ids.length,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        message: 'Bulk delete operation failed'
      }
    }
  }

  async bulkUpdate(entityType: string, ids: string[], data: BulkUpdateData, onProgress?: ProgressCallback): Promise<any> {
    try {
      if (onProgress) {
        onProgress({ total: ids.length, processed: 0, failed: 0, current: 'Starting update...' })
      }

      // Use individual update requests for now
      let processed = 0
      let failed = 0
      const errors: string[] = []

      for (const id of ids) {
        try {
          await apiService.patch(`/${entityType}/${id}`, data)
          processed++
          if (onProgress) {
            onProgress({
              total: ids.length,
              processed,
              failed,
              current: `Updating ${entityType} ${id}...`
            })
          }
        } catch (error: any) {
          failed++
          errors.push(`Failed to update ${entityType} ${id}: ${error.message}`)
        }
      }

      if (onProgress) {
        onProgress({ total: ids.length, processed, failed, current: 'Completed' })
      }

      return {
        success: failed === 0,
        processedCount: processed,
        failedCount: failed,
        errors: errors.length > 0 ? errors : undefined,
        message: failed === 0
          ? `Successfully updated ${processed} ${entityType}s`
          : `Updated ${processed} ${entityType}s, ${failed} failed`
      }
    } catch (error) {
      return {
        success: false,
        processedCount: 0,
        failedCount: ids.length,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        message: 'Bulk update operation failed'
      }
    }
  }

  async bulkExport(entityType: string, ids: string[], format: 'csv' | 'json'): Promise<any> {
    try {
      await this.exportEntities(entityType, { _id: { $in: ids } })
      return {
        success: true,
        processedCount: ids.length,
        failedCount: 0,
        message: `Successfully exported ${ids.length} ${entityType}s as ${format.toUpperCase()}`
      }
    } catch (error) {
      return {
        success: false,
        processedCount: 0,
        failedCount: ids.length,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        message: 'Export operation failed'
      }
    }
  }

  // Legacy method for file parsing
  async parseUploadFile(entityType: string, formData: FormData): Promise<any> {
    try {
      const file = formData.get('file') as File
      const operation = formData.get('operation') as BulkOperationType || BulkOperationType.CREATE

      const result = await this.previewBulkOperation(entityType, file, operation)

      return {
        success: true,
        data: result.successfulRecords,
        validationErrors: result.failedRecords.map(fr => fr.errors).flat(),
        message: result.message
      }
    } catch (error: any) {
      return {
        success: false,
        validationErrors: [error.message || 'Failed to parse file'],
        message: 'File parsing failed'
      }
    }
  }
}

export const bulkOperationsService = new BulkOperationsServiceImpl()