import { apiService } from './api'
import { BulkOperationResult, BulkUpdateData, processBatch, ProgressCallback } from '@/utils/bulkOperations'

export interface BulkDeleteRequest {
  ids: string[]
  entityType: string
}

export interface BulkUpdateRequest {
  ids: string[]
  data: BulkUpdateData
  entityType: string
}

export interface BulkOperationsService {
  bulkDelete: (entityType: string, ids: string[], onProgress?: ProgressCallback) => Promise<BulkOperationResult>
  bulkUpdate: (entityType: string, ids: string[], data: BulkUpdateData, onProgress?: ProgressCallback) => Promise<BulkOperationResult>
  bulkExport: (entityType: string, ids: string[], format: 'csv' | 'json') => Promise<BulkOperationResult>
  bulkUpload: (entityType: string, formData: FormData, onProgress?: ProgressCallback) => Promise<BulkOperationResult>
  parseUploadFile: (entityType: string, formData: FormData) => Promise<BulkFileParseResult>
}

export interface BulkFileParseResult {
  success: boolean
  data?: any[]
  validationErrors?: string[]
  message?: string
}

class BulkOperationsServiceImpl implements BulkOperationsService {
  async bulkDelete(entityType: string, ids: string[], onProgress?: ProgressCallback): Promise<BulkOperationResult> {
    try {
      if (onProgress) {
        onProgress({ total: ids.length, processed: 0, failed: 0, current: 'Starting deletion...' })
      }

      // For APIs that support bulk delete
      if (this.supportsBulkEndpoint(entityType, 'delete')) {
        const response = await apiService.delete(`/${entityType}/bulk`, {
          data: { ids }
        })

        if (onProgress) {
          onProgress({ total: ids.length, processed: ids.length, failed: 0, current: 'Completed' })
        }

        return {
          success: true,
          processedCount: ids.length,
          failedCount: 0,
          message: `Successfully deleted ${ids.length} ${entityType}s`
        }
      }

      // Fallback to individual delete requests
      let processed = 0
      let failed = 0
      const errors: string[] = []

      const results = await processBatch(
        ids,
        async (id) => {
          if (onProgress) {
            onProgress({
              total: ids.length,
              processed,
              failed,
              current: `Deleting ${entityType} ${id}...`
            })
          }

          const result = await apiService.delete(`/${entityType}/${id}`)
          processed++
          return result
        },
        5, // batch size
        200 // delay between batches
      )

      results.forEach((result, index) => {
        if (result instanceof Error) {
          failed++
          errors.push(`Failed to delete ${entityType} ${ids[index]}: ${result.message}`)
        }
      })

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

  async bulkUpdate(entityType: string, ids: string[], data: BulkUpdateData, onProgress?: ProgressCallback): Promise<BulkOperationResult> {
    try {
      if (onProgress) {
        onProgress({ total: ids.length, processed: 0, failed: 0, current: 'Starting update...' })
      }

      // For APIs that support bulk update
      if (this.supportsBulkEndpoint(entityType, 'update')) {
        const response = await apiService.patch(`/${entityType}/bulk`, {
          ids,
          data
        })

        if (onProgress) {
          onProgress({ total: ids.length, processed: ids.length, failed: 0, current: 'Completed' })
        }

        return {
          success: true,
          processedCount: ids.length,
          failedCount: 0,
          message: `Successfully updated ${ids.length} ${entityType}s`
        }
      }

      // Fallback to individual update requests
      let processed = 0
      let failed = 0
      const errors: string[] = []

      const results = await processBatch(
        ids,
        async (id) => {
          if (onProgress) {
            onProgress({
              total: ids.length,
              processed,
              failed,
              current: `Updating ${entityType} ${id}...`
            })
          }

          const result = await apiService.patch(`/${entityType}/${id}`, data)
          processed++
          return result
        },
        5, // batch size
        200 // delay between batches
      )

      results.forEach((result, index) => {
        if (result instanceof Error) {
          failed++
          errors.push(`Failed to update ${entityType} ${ids[index]}: ${result.message}`)
        }
      })

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

  async bulkExport(entityType: string, ids: string[], format: 'csv' | 'json'): Promise<BulkOperationResult> {
    try {
      const response = await apiService.post(`/${entityType}/export`, {
        ids,
        format
      })

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

  async bulkUpload(entityType: string, formData: FormData, onProgress?: ProgressCallback): Promise<BulkOperationResult> {
    try {
      if (onProgress) {
        onProgress({ total: 1, processed: 0, failed: 0, current: 'Uploading file...' })
      }

      const response = await apiService.post(`/${entityType}/bulk/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (onProgress) {
        onProgress({
          total: response.data.total || 1,
          processed: response.data.processed || 1,
          failed: response.data.failed || 0,
          current: 'Upload completed'
        })
      }

      return {
        success: true,
        processedCount: response.data.processed || 0,
        failedCount: response.data.failed || 0,
        errors: response.data.errors,
        message: response.data.message || `Successfully uploaded ${response.data.processed || 0} ${entityType}s`
      }
    } catch (error: any) {
      return {
        success: false,
        processedCount: 0,
        failedCount: 0,
        errors: [error.response?.data?.message || error.message || 'Upload failed'],
        message: 'Bulk upload operation failed'
      }
    }
  }

  async parseUploadFile(entityType: string, formData: FormData): Promise<BulkFileParseResult> {
    try {
      const response = await apiService.post(`/${entityType}/bulk/parse`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      return {
        success: true,
        data: response.data.preview || [],
        validationErrors: response.data.validationErrors || [],
        message: response.data.message
      }
    } catch (error: any) {
      return {
        success: false,
        validationErrors: [error.response?.data?.message || error.message || 'Failed to parse file'],
        message: 'File parsing failed'
      }
    }
  }

  private supportsBulkEndpoint(entityType: string, operation: 'delete' | 'update'): boolean {
    // Define which entities support bulk endpoints
    const bulkSupportedEntities = ['users', 'members', 'groups', 'first-timers', 'prayers', 'payments']
    return bulkSupportedEntities.includes(entityType)
  }
}

export const bulkOperationsService = new BulkOperationsServiceImpl()