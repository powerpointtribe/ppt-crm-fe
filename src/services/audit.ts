import { apiService } from './api'
import { ApiResponse } from '@/types/api'
import { transformPaginatedResponse, transformSingleResponse } from '@/utils/apiResponseTransform'

// Enums
export enum AuditAction {
  // Authentication actions
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',

  // CRUD operations
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',

  // Member-specific actions
  MEMBER_CREATED = 'MEMBER_CREATED',
  MEMBER_UPDATED = 'MEMBER_UPDATED',
  MEMBER_DELETED = 'MEMBER_DELETED',
  MEMBER_STATUS_CHANGED = 'MEMBER_STATUS_CHANGED',
  MEMBER_ROLE_ASSIGNED = 'MEMBER_ROLE_ASSIGNED',

  // Inventory actions
  INVENTORY_ITEM_CREATED = 'INVENTORY_ITEM_CREATED',
  INVENTORY_ITEM_UPDATED = 'INVENTORY_ITEM_UPDATED',
  INVENTORY_ITEM_DELETED = 'INVENTORY_ITEM_DELETED',
  INVENTORY_MOVEMENT = 'INVENTORY_MOVEMENT',
  STOCK_ADJUSTMENT = 'STOCK_ADJUSTMENT',

  // Financial actions
  FINANCIAL_TRANSACTION = 'FINANCIAL_TRANSACTION',
  OFFERING_RECORDED = 'OFFERING_RECORDED',
  EXPENSE_CREATED = 'EXPENSE_CREATED',

  // System actions
  SYSTEM_CONFIG_CHANGED = 'SYSTEM_CONFIG_CHANGED',
  BACKUP_CREATED = 'BACKUP_CREATED',
  DATA_EXPORT = 'DATA_EXPORT',
  BULK_OPERATION = 'BULK_OPERATION',
}

export enum AuditEntity {
  MEMBER = 'MEMBER',
  USER = 'USER',
  GROUP = 'GROUP',
  MINISTRY = 'MINISTRY',
  INVENTORY_ITEM = 'INVENTORY_ITEM',
  INVENTORY_CATEGORY = 'INVENTORY_CATEGORY',
  INVENTORY_MOVEMENT = 'INVENTORY_MOVEMENT',
  FINANCIAL_TRANSACTION = 'FINANCIAL_TRANSACTION',
  OFFERING = 'OFFERING',
  EXPENSE = 'EXPENSE',
  SYSTEM_CONFIG = 'SYSTEM_CONFIG',
  AUDIT_LOG = 'AUDIT_LOG',
}

export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Interfaces
export interface AuditLog {
  _id: string
  action: AuditAction
  entity: AuditEntity
  entityId?: string
  performedBy: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  description: string
  severity: AuditSeverity
  ipAddress?: string
  userAgent?: string
  timestamp: string
  changes?: {
    before?: Record<string, any>
    after?: Record<string, any>
  }
  metadata?: Record<string, any>
  relatedDistrict?: {
    _id: string
    name: string
  }
  relatedUnit?: {
    _id: string
    name: string
  }
  success: boolean
  errorMessage?: string
  duration?: number
  sessionId?: string
  requestId?: string
  createdAt: string
}

export interface AuditQueryParams {
  page?: number
  limit?: number
  action?: AuditAction | string
  entity?: AuditEntity | string
  performedBy?: string
  entityId?: string
  severity?: AuditSeverity | string
  success?: boolean
  startDate?: string
  endDate?: string
  ipAddress?: string
  search?: string
  relatedDistrict?: string
  relatedUnit?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface AuditStatistics {
  totalLogs: number
  recentLogs: number
  failedActions: number
  successfulActions: number
  uniqueUsers: number
  topActions: Array<{
    action: string
    count: number
    percentage: number
  }>
  activityByHour: Array<{
    hour: number
    count: number
  }>
  activityByDay: Array<{
    date: string
    count: number
  }>
  entityBreakdown: Array<{
    entity: string
    count: number
    percentage: number
  }>
  severityBreakdown: Array<{
    severity: string
    count: number
    percentage: number
  }>
  topUsers: Array<{
    user: {
      _id: string
      firstName: string
      lastName: string
      email: string
    }
    count: number
    percentage: number
  }>
  errorSummary: Array<{
    errorType: string
    count: number
    lastOccurrence: string
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

export const auditService = {
  // Get audit logs with filtering and pagination
  getAuditLogs: async (params?: AuditQueryParams): Promise<PaginatedResponse<AuditLog>> => {
    const response = await apiService.get<ApiResponse<any>>('/audit-logs', { params })
    return transformPaginatedResponse<AuditLog>(response)
  },

  // Get specific audit log by ID
  getAuditLogById: async (id: string): Promise<AuditLog> => {
    const response = await apiService.get<ApiResponse<AuditLog>>(`/audit-logs/${id}`)
    return transformSingleResponse<AuditLog>(response) as AuditLog
  },

  // Get audit statistics
  getStatistics: async (params?: {
    startDate?: string
    endDate?: string
    entityType?: string
  }): Promise<AuditStatistics> => {
    const response = await apiService.get<ApiResponse<AuditStatistics>>('/audit-logs/statistics', { params })
    return transformSingleResponse<AuditStatistics>(response) as AuditStatistics
  },

  // Export audit logs
  exportLogs: async (
    params?: AuditQueryParams,
    format: 'csv' | 'json' = 'json'
  ): Promise<Blob> => {
    const response = await apiService.get('/audit-logs/export', {
      params: { ...params, format },
      responseType: 'blob'
    })
    return response as unknown as Blob
  },

  // Delete old audit logs (Super Admin only)
  deleteOldLogs: async (beforeDate: string): Promise<{ deletedCount: number; message: string }> => {
    const response = await apiService.delete<ApiResponse<{ deletedCount: number; message: string }>>('/audit-logs/cleanup', {
      params: { beforeDate }
    })
    return transformSingleResponse(response) as { deletedCount: number; message: string }
  },

  // Get audit logs for specific entity
  getEntityAuditLogs: async (
    entityType: AuditEntity,
    entityId: string,
    params?: Omit<AuditQueryParams, 'entity' | 'entityId'>
  ): Promise<PaginatedResponse<AuditLog>> => {
    const queryParams = {
      ...params,
      entity: entityType,
      entityId
    }
    return auditService.getAuditLogs(queryParams)
  },

  // Get audit logs for specific user
  getUserAuditLogs: async (
    userId: string,
    params?: Omit<AuditQueryParams, 'performedBy'>
  ): Promise<PaginatedResponse<AuditLog>> => {
    const queryParams = {
      ...params,
      performedBy: userId
    }
    return auditService.getAuditLogs(queryParams)
  },

  // Get recent activity
  getRecentActivity: async (limit: number = 50): Promise<AuditLog[]> => {
    const response = await auditService.getAuditLogs({
      limit,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    })
    return response.items
  },

  // Get failed actions
  getFailedActions: async (
    params?: Omit<AuditQueryParams, 'success'>
  ): Promise<PaginatedResponse<AuditLog>> => {
    const queryParams = {
      ...params,
      success: false
    }
    return auditService.getAuditLogs(queryParams)
  },

  // Get critical actions
  getCriticalActions: async (
    params?: Omit<AuditQueryParams, 'severity'>
  ): Promise<PaginatedResponse<AuditLog>> => {
    const queryParams = {
      ...params,
      severity: AuditSeverity.CRITICAL
    }
    return auditService.getAuditLogs(queryParams)
  },

  // Get activity summary for date range
  getActivitySummary: async (startDate: string, endDate: string): Promise<{
    totalActions: number
    successfulActions: number
    failedActions: number
    uniqueUsers: number
    topActions: Array<{ action: string; count: number }>
    dailyActivity: Array<{ date: string; count: number }>
  }> => {
    const stats = await auditService.getStatistics({ startDate, endDate })
    return {
      totalActions: stats.totalLogs,
      successfulActions: stats.successfulActions,
      failedActions: stats.failedActions,
      uniqueUsers: stats.uniqueUsers,
      topActions: stats.topActions.slice(0, 5),
      dailyActivity: stats.activityByDay
    }
  },

  // Helper function to format audit log for display
  formatAuditLog: (log: AuditLog): {
    title: string
    description: string
    severity: AuditSeverity
    timestamp: string
    user: string
    success: boolean
  } => ({
    title: `${log.action.replace(/_/g, ' ')} - ${log.entity.replace(/_/g, ' ')}`,
    description: log.description,
    severity: log.severity,
    timestamp: log.timestamp,
    user: `${log.performedBy.firstName} ${log.performedBy.lastName}`,
    success: log.success
  }),

  // Helper function to get severity color
  getSeverityColor: (severity: AuditSeverity): string => {
    switch (severity) {
      case AuditSeverity.LOW: return 'text-green-600 bg-green-100'
      case AuditSeverity.MEDIUM: return 'text-yellow-600 bg-yellow-100'
      case AuditSeverity.HIGH: return 'text-orange-600 bg-orange-100'
      case AuditSeverity.CRITICAL: return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  },

  // Helper function to get action icon
  getActionIcon: (action: AuditAction): string => {
    switch (action) {
      case AuditAction.LOGIN:
      case AuditAction.LOGOUT:
        return 'login'
      case AuditAction.CREATE:
        return 'plus'
      case AuditAction.UPDATE:
        return 'edit'
      case AuditAction.DELETE:
        return 'trash'
      case AuditAction.VIEW:
      case AuditAction.READ:
        return 'eye'
      default:
        return 'activity'
    }
  }
}