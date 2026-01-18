import { apiService } from './api'

export type EntryImportEntityType = 'first_timer' | 'member' | 'group' | 'service_report' | 'expense_category'

export type EntryImportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'partially_completed'

export type EntryImportItemStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped'

export interface EntityTypeInfo {
  entityType: EntryImportEntityType
  displayName: string
  description: string
  sampleHeaders: string[]
  sampleRow: string[]
}

export interface EntryImport {
  _id: string
  entityType: EntryImportEntityType
  fileName: string
  fileUrl?: string
  totalRecords: number
  processedRecords: number
  successCount: number
  errorCount: number
  skippedCount: number
  status: EntryImportStatus
  createdBy: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  branch?: {
    _id: string
    name: string
  }
  message?: string
  options?: Record<string, any>
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface EntryImportItem {
  _id: string
  entryImport: string
  rowNumber: number
  rawData: Record<string, any>
  mappedData?: Record<string, any>
  status: EntryImportItemStatus
  createdEntityId?: string
  errors: string[]
  uniqueKey?: string
  processedAt?: string
  createdAt: string
  updatedAt: string
}

export interface EntryImportStats {
  total: number
  pending: number
  processing: number
  completed: number
  failed: number
  skipped: number
}

export interface UploadResponse {
  success: boolean
  message: string
  data: {
    importId: string
    fileName: string
    entityType: EntryImportEntityType
    totalRecords: number
    status: EntryImportStatus
  }
}

export interface GetImportsResponse {
  success: boolean
  data: EntryImport[]
  pagination: {
    total: number
    page: number
    totalPages: number
  }
}

export interface GetImportResponse {
  success: boolean
  data: {
    import: EntryImport
    stats: EntryImportStats
  }
}

export interface GetImportItemsResponse {
  success: boolean
  data: EntryImportItem[]
  pagination: {
    total: number
    page: number
    totalPages: number
  }
}

export interface TemplateResponse {
  success: boolean
  data: {
    entityType: EntryImportEntityType
    displayName: string
    description: string
    headers: string[]
    sampleRow: string[]
    csvContent: string
  }
}

export const entryImportService = {
  // Get available entity types for import
  async getEntityTypes(): Promise<{ success: boolean; data: EntityTypeInfo[] }> {
    return apiService.get('/entry-import/entity-types')
  },

  // Upload a CSV file for import
  async uploadCsv(
    entityType: EntryImportEntityType,
    file: File,
    branchId?: string,
    options?: Record<string, any>
  ): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    if (branchId) {
      formData.append('branchId', branchId)
    }
    if (options) {
      formData.append('options', JSON.stringify(options))
    }

    return apiService.post(`/entry-import/upload/${entityType}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  // Get all imports with pagination
  async getImports(params?: {
    page?: number
    limit?: number
    entityType?: EntryImportEntityType
    status?: EntryImportStatus
    branchId?: string
  }): Promise<GetImportsResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.set('page', params.page.toString())
    if (params?.limit) queryParams.set('limit', params.limit.toString())
    if (params?.entityType) queryParams.set('entityType', params.entityType)
    if (params?.status) queryParams.set('status', params.status)
    if (params?.branchId) queryParams.set('branchId', params.branchId)

    const queryString = queryParams.toString()
    return apiService.get(`/entry-import${queryString ? `?${queryString}` : ''}`)
  },

  // Get single import by ID with stats
  async getImportById(importId: string): Promise<GetImportResponse> {
    return apiService.get(`/entry-import/${importId}`)
  },

  // Get import items with pagination
  async getImportItems(
    importId: string,
    params?: {
      page?: number
      limit?: number
      status?: EntryImportItemStatus
    }
  ): Promise<GetImportItemsResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.set('page', params.page.toString())
    if (params?.limit) queryParams.set('limit', params.limit.toString())
    if (params?.status) queryParams.set('status', params.status)

    const queryString = queryParams.toString()
    return apiService.get(`/entry-import/${importId}/items${queryString ? `?${queryString}` : ''}`)
  },

  // Retry failed items
  async retryFailedItems(importId: string): Promise<{ success: boolean; message: string; data: { retriedCount: number } }> {
    return apiService.post(`/entry-import/${importId}/retry`)
  },

  // Delete an import
  async deleteImport(importId: string): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/entry-import/${importId}`)
  },

  // Get sample CSV template
  async getTemplate(entityType: EntryImportEntityType): Promise<TemplateResponse> {
    return apiService.get(`/entry-import/template/${entityType}`)
  },
}

export default entryImportService
