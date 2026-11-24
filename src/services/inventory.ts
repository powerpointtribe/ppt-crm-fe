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
  PACKAGES = 'PACKAGES',
}

export enum InventoryMovementType {
  STOCK_IN = 'STOCK_IN',
  STOCK_OUT = 'STOCK_OUT',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
  DAMAGE = 'DAMAGE',
  EXPIRED = 'EXPIRED',
  DONATED = 'DONATED',
  SOLD = 'SOLD',
  RETURNED = 'RETURNED',
}

// Mirrors InventoryCategoryType in crm-be/src/common/enums/inventory.enum.ts
export const INVENTORY_CATEGORY_TYPES = [
  'GENERAL',
  'OFFICE_SUPPLIES',
  'ELECTRONICS',
  'FURNITURE',
  'BOOKS_MATERIALS',
  'FOOD_BEVERAGES',
  'CLEANING_SUPPLIES',
  'MEDICAL_SUPPLIES',
  'MUSICAL_INSTRUMENTS',
  'SOUND_EQUIPMENT',
  'DECORATIONS',
  'UNIFORMS_CLOTHING',
  'VEHICLES',
  'MAINTENANCE',
  'GIFTS_DONATIONS',
] as const

type UserRef = { _id: string; firstName: string; lastName: string; email?: string }

// Interfaces
export interface InventoryCategory {
  _id: string
  name: string
  code?: string
  type?: string
  color?: string
  sortOrder?: number
  description?: string
  parentCategory?: string | { _id: string; name: string; code?: string }
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
  inventoryItem: { _id: string; name: string; itemCode: string; unitOfMeasurement?: string } | string
  movementType: InventoryMovementType | string
  quantity: number
  previousStock: number
  newStock: number
  unitCost?: number
  totalCost?: number
  reason: string
  referenceNumber?: string
  batchNumber?: string
  supplier?: string
  supplierInvoiceNumber?: string
  fromUnit?: { _id: string; name: string }
  toUnit?: { _id: string; name: string }
  fromDistrict?: { _id: string; name: string }
  toDistrict?: { _id: string; name: string }
  performedBy?: UserRef | string
  approvedBy?: UserRef | string
  approvedDate?: string
  status: 'pending' | 'approved' | 'rejected' | string
  notes?: string
  metadata?: Record<string, any>
  movementDate: string
  createdAt: string
  updatedAt: string
}

export interface MovementStatistics {
  summary: {
    totalMovements: number
    totalQuantityIn: number
    totalQuantityOut: number
    totalValue: number
  }
  movementTypes: Array<{ _id: string; count: number; totalQuantity: number; totalValue: number }>
  dailyMovements: Array<{ _id: string; count: number; quantity: number }>
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
  status?: InventoryStatus
}

export interface CreateInventoryCategoryData {
  name: string
  code: string
  type?: string
  color?: string
  sortOrder?: number
  isActive?: boolean
  description?: string
  parentCategory?: string
}

export interface CreateInventoryMovementData {
  inventoryItem: string
  movementType: InventoryMovementType | string
  quantity: number
  reason: string
  unitCost?: number
  referenceNumber?: string
  batchNumber?: string
  expiryDate?: string
  supplier?: string
  supplierInvoiceNumber?: string
  supplierInvoiceDate?: string
  fromUnit?: string
  toUnit?: string
  fromDistrict?: string
  toDistrict?: string
  status?: 'pending' | 'approved'
  notes?: string
  movementDate?: string
}

export interface MovementQueryParams {
  page?: number
  limit?: number
  inventoryItemId?: string
  movementType?: string
  status?: string
  startDate?: string
  endDate?: string
}

const dropEmpty = (o: Record<string, any>) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== ''))

// The movements endpoint returns { movements, pagination: { current, pages, count, total } },
// which transformPaginatedResponse doesn't understand.
function toMovementPage(raw: any, limit: number): PaginatedResponse<InventoryMovement> {
  const body = raw?.movements ? raw : raw?.data?.movements ? raw.data : {}
  const p = body.pagination || {}
  const page = Number(p.current) || 1
  const totalPages = p.pages || 0
  return {
    items: body.movements || [],
    pagination: {
      page,
      limit,
      total: p.total || 0,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
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
  branchId?: string
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
    const response = await apiService.get<ApiResponse<any>>('/inventory/items/statistics')
    const data = transformSingleResponse<any>(response)

    // Transform backend response to match frontend interface
    const summary = data.summary || {}
    const categoryBreakdown = data.categoryBreakdown || []

    return {
      totalItems: summary.totalItems || 0,
      totalValue: summary.totalValue || 0,
      lowStockItems: summary.lowStockItems || 0,
      outOfStockItems: summary.outOfStockItems || 0,
      expiringItems: 0, // Not provided by backend
      categoriesCount: categoryBreakdown.length,
      recentMovements: 0, // Not provided by backend
      topCategories: categoryBreakdown.slice(0, 5).map((cat: any) => ({
        category: cat.categoryInfo?.name || 'Unknown',
        count: cat.itemCount || 0,
        value: cat.totalValue || 0
      }))
    }
  },

  /** Item count and stock value for every category, keyed by category id. */
  getCategoryBreakdown: async (): Promise<Array<{ id: string; name: string; count: number; value: number }>> => {
    const response = await apiService.get<ApiResponse<any>>('/inventory/items/statistics')
    const data = transformSingleResponse<any>(response) || {}
    return (data.categoryBreakdown || []).map((c: any) => ({
      id: String(c._id),
      name: c.categoryInfo?.name || 'Unknown',
      count: c.itemCount || 0,
      value: c.totalValue || 0,
    }))
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
  getMovements: async (params: MovementQueryParams = {}): Promise<PaginatedResponse<InventoryMovement>> => {
    const response = await apiService.get<any>('/inventory/movements', { params: dropEmpty(params) })
    return toMovementPage(response, params.limit || 20)
  },

  getMovementStatistics: async (
    params: { inventoryItemId?: string; startDate?: string; endDate?: string } = {},
  ): Promise<MovementStatistics> => {
    const response = await apiService.get<any>('/inventory/movements/statistics', { params: dropEmpty(params) })
    const data = transformSingleResponse<any>(response) || {}
    return {
      summary: data.summary || { totalMovements: 0, totalQuantityIn: 0, totalQuantityOut: 0, totalValue: 0 },
      movementTypes: data.movementTypes || [],
      dailyMovements: data.dailyMovements || [],
    }
  },

  rejectMovement: async (id: string, reason: string): Promise<void> => {
    await apiService.patch(`/inventory/movements/${id}/reject`, { reason })
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