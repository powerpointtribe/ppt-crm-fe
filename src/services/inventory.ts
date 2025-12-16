import { apiService } from './api'
import { ApiResponse } from '@/types/api'
import { transformPaginatedResponse, transformSingleResponse } from '@/utils/apiResponseTransform'

// Enums
export enum InventoryStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DISCONTINUED = 'DISCONTINUED',
  DAMAGED = 'DAMAGED',
}

export enum UnitOfMeasurement {
  PIECES = 'PIECES',
  KILOGRAMS = 'KILOGRAMS',
  GRAMS = 'GRAMS',
  LITERS = 'LITERS',
  MILLILITERS = 'MILLILITERS',
  METERS = 'METERS',
  CENTIMETERS = 'CENTIMETERS',
  BOXES = 'BOXES',
  PACKS = 'PACKS',
}

// Interfaces
export interface InventoryCategory {
  _id: string
  name: string
  description?: string
  parentCategory?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface InventoryItem {
  _id: string
  name: string
  description?: string
  itemCode: string
  barcode?: string
  category: InventoryCategory | string
  brand?: string
  model?: string
  serialNumber?: string
  unitOfMeasurement: UnitOfMeasurement
  currentStock: number
  minimumStock: number
  maximumStock: number
  reorderLevel: number
  unitCost: number
  currency: string
  status: InventoryStatus
  assignedUnit?: { _id: string; name: string }
  assignedDistrict?: { _id: string; name: string }
  location?: string
  supplier?: string
  supplierContact?: string
  purchaseDate?: string
  expiryDate?: string
  warrantyExpiry?: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
    unit: string
  }
  imageUrls?: string[]
  documentUrls?: string[]
  customFields?: Record<string, any>
  tags?: string[]
  notes?: string
  tracking: {
    isTracked: boolean
    trackingType: string
    individualItems?: Array<{
      serialNumber: string
      status: string
      assignedTo?: string
      assignmentDate?: string
      condition?: string
      lastMaintenanceDate?: string
      notes?: string
    }>
    batchInfo?: {
      batchNumber: string
      manufactureDate: string
      expiryDate: string
      quantity: number
    }
  }
  isDepreciable: boolean
  depreciationRate?: number
  lastStockCheck?: string
  createdBy: { _id: string; firstName: string; lastName: string } | string
  updatedBy?: { _id: string; firstName: string; lastName: string } | string
  lastStockCheckedBy?: { _id: string; firstName: string; lastName: string } | string
  createdAt: string
  updatedAt: string
  // Virtual fields
  stockStatus?: string
  totalValue?: number
}

export interface InventoryMovement {
  _id: string
  inventoryItem: InventoryItem | string
  movementType: string
  quantity: number
  fromQuantity: number
  toQuantity: number
  unitCost?: number
  totalCost?: number
  reason: string
  description?: string
  reference?: string
  fromLocation?: string
  toLocation?: string
  fromUnit?: { _id: string; name: string }
  toUnit?: { _id: string; name: string }
  approvedBy?: { _id: string; firstName: string; lastName: string }
  approvedAt?: string
  status: string
  metadata?: Record<string, any>
  createdBy: { _id: string; firstName: string; lastName: string } | string
  createdAt: string
  updatedAt: string
}

export interface CreateInventoryItemData {
  name: string
  description?: string
  itemCode: string
  barcode?: string
  category: string
  brand?: string
  model?: string
  serialNumber?: string
  unitOfMeasurement: UnitOfMeasurement
  currentStock: number
  minimumStock?: number
  maximumStock?: number
  reorderLevel?: number
  unitCost?: number
  currency?: string
  assignedUnit?: string
  assignedDistrict?: string
  location?: string
  supplier?: string
  supplierContact?: string
  purchaseDate?: string
  expiryDate?: string
  warrantyExpiry?: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
    unit: string
  }
  tags?: string[]
  notes?: string
  tracking?: {
    isTracked?: boolean
    trackingType?: string
    batchInfo?: {
      batchNumber: string
      manufactureDate: string
      expiryDate: string
      quantity: number
    }
  }
  isDepreciable?: boolean
  depreciationRate?: number
}

export interface CreateInventoryCategoryData {
  name: string
  description?: string
  parentCategory?: string
}

export interface CreateInventoryMovementData {
  inventoryItem: string
  movementType: string
  quantity: number
  reason: string
  description?: string
  reference?: string
  fromLocation?: string
  toLocation?: string
  fromUnit?: string
  toUnit?: string
  unitCost?: number
}

export interface InventoryQueryParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  status?: InventoryStatus
  assignedUnit?: string
  assignedDistrict?: string
  location?: string
  minStock?: number
  maxStock?: number
  lowStock?: boolean
  expiring?: boolean
  expiringDays?: number
  tags?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface InventoryStatistics {
  totalItems: number
  totalValue: number
  lowStockItems: number
  outOfStockItems: number
  expiringItems: number
  categoriesCount: number
  recentMovements: number
  topCategories: Array<{
    category: string
    count: number
    value: number
  }>
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export const inventoryService = {
  // Categories
  getCategories: async (): Promise<InventoryCategory[]> => {
    const response = await apiService.get<ApiResponse<InventoryCategory[]>>('/inventory/categories')
    return transformSingleResponse<InventoryCategory[]>(response) as InventoryCategory[]
  },

  getCategoryHierarchy: async (): Promise<any> => {
    const response = await apiService.get<ApiResponse<any>>('/inventory/categories/hierarchy')
    return transformSingleResponse(response)
  },

  createCategory: async (data: CreateInventoryCategoryData): Promise<InventoryCategory> => {
    const response = await apiService.post<ApiResponse<InventoryCategory>>('/inventory/categories', data)
    return transformSingleResponse<InventoryCategory>(response) as InventoryCategory
  },

  updateCategory: async (id: string, data: Partial<CreateInventoryCategoryData>): Promise<InventoryCategory> => {
    const response = await apiService.patch<ApiResponse<InventoryCategory>>(`/inventory/categories/${id}`, data)
    return transformSingleResponse<InventoryCategory>(response) as InventoryCategory
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiService.delete(`/inventory/categories/${id}`)
  },

  // Items
  getItems: async (params?: InventoryQueryParams): Promise<PaginatedResponse<InventoryItem>> => {
    const response = await apiService.get<ApiResponse<any>>('/inventory/items', { params })
    return transformPaginatedResponse<InventoryItem>(response)
  },

  getItemById: async (id: string): Promise<InventoryItem> => {
    const response = await apiService.get<ApiResponse<InventoryItem>>(`/inventory/items/${id}`)
    return transformSingleResponse<InventoryItem>(response) as InventoryItem
  },

  createItem: async (data: CreateInventoryItemData): Promise<InventoryItem> => {
    const response = await apiService.post<ApiResponse<InventoryItem>>('/inventory/items', data)
    return transformSingleResponse<InventoryItem>(response) as InventoryItem
  },

  updateItem: async (id: string, data: Partial<CreateInventoryItemData>): Promise<InventoryItem> => {
    const response = await apiService.patch<ApiResponse<InventoryItem>>(`/inventory/items/${id}`, data)
    return transformSingleResponse<InventoryItem>(response) as InventoryItem
  },

  deleteItem: async (id: string): Promise<void> => {
    await apiService.delete(`/inventory/items/${id}`)
  },

  // Statistics and Reports
  getStatistics: async (): Promise<InventoryStatistics> => {
    const response = await apiService.get<ApiResponse<InventoryStatistics>>('/inventory/items/statistics')
    return transformSingleResponse<InventoryStatistics>(response) as InventoryStatistics
  },

  getLowStockItems: async (): Promise<InventoryItem[]> => {
    const response = await apiService.get<ApiResponse<InventoryItem[]>>('/inventory/items/low-stock')
    return transformSingleResponse<InventoryItem[]>(response) as InventoryItem[]
  },

  getExpiringItems: async (days: number = 30): Promise<InventoryItem[]> => {
    const response = await apiService.get<ApiResponse<InventoryItem[]>>('/inventory/items/expiring', { params: { days } })
    return transformSingleResponse<InventoryItem[]>(response) as InventoryItem[]
  },

  // Movements
  getMovements: async (params?: {
    page?: number
    limit?: number
    itemId?: string
    movementType?: string
    startDate?: string
    endDate?: string
  }): Promise<PaginatedResponse<InventoryMovement>> => {
    const response = await apiService.get<ApiResponse<any>>('/inventory/movements', { params })
    return transformPaginatedResponse<InventoryMovement>(response)
  },

  getMovementById: async (id: string): Promise<InventoryMovement> => {
    const response = await apiService.get<ApiResponse<InventoryMovement>>(`/inventory/movements/${id}`)
    return transformSingleResponse<InventoryMovement>(response) as InventoryMovement
  },

  createMovement: async (data: CreateInventoryMovementData): Promise<InventoryMovement> => {
    const response = await apiService.post<ApiResponse<InventoryMovement>>('/inventory/movements', data)
    return transformSingleResponse<InventoryMovement>(response) as InventoryMovement
  },

  approveMovement: async (id: string): Promise<InventoryMovement> => {
    const response = await apiService.patch<ApiResponse<InventoryMovement>>(`/inventory/movements/${id}/approve`)
    return transformSingleResponse<InventoryMovement>(response) as InventoryMovement
  },

  // Bulk operations
  bulkUpdateStock: async (updates: Array<{ itemId: string; newStock: number; reason: string }>): Promise<any> => {
    const response = await apiService.post<ApiResponse<any>>('/inventory/items/bulk-update', { updates })
    return transformSingleResponse(response)
  },

  // Export functionality
  exportItems: async (format: 'csv' | 'excel' = 'csv', filters?: InventoryQueryParams): Promise<Blob> => {
    const response = await apiService.get(`/inventory/items/export`, {
      params: { format, ...filters },
      responseType: 'blob'
    })
    return response as unknown as Blob
  },
}