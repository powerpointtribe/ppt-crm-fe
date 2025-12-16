export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  EXPORT = 'EXPORT',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET = 'PASSWORD_RESET',
  MEMBER_CREATED = 'MEMBER_CREATED',
  MEMBER_UPDATED = 'MEMBER_UPDATED',
  MEMBER_DELETED = 'MEMBER_DELETED',
  MEMBER_STATUS_CHANGED = 'MEMBER_STATUS_CHANGED',
  INVENTORY_ITEM_CREATED = 'INVENTORY_ITEM_CREATED',
  INVENTORY_ITEM_UPDATED = 'INVENTORY_ITEM_UPDATED',
  INVENTORY_ITEM_DELETED = 'INVENTORY_ITEM_DELETED',
  INVENTORY_STOCK_ADDED = 'INVENTORY_STOCK_ADDED',
  INVENTORY_STOCK_REMOVED = 'INVENTORY_STOCK_REMOVED',
  INVENTORY_ITEM_TRANSFERRED = 'INVENTORY_ITEM_TRANSFERRED',
  GROUP_CREATED = 'GROUP_CREATED',
  GROUP_UPDATED = 'GROUP_UPDATED',
  GROUP_MEMBER_ADDED = 'GROUP_MEMBER_ADDED',
  GROUP_MEMBER_REMOVED = 'GROUP_MEMBER_REMOVED',
  REPORT_GENERATED = 'REPORT_GENERATED',
  REPORT_DOWNLOADED = 'REPORT_DOWNLOADED',
  BULK_IMPORT = 'BULK_IMPORT',
  BULK_UPDATE = 'BULK_UPDATE',
  BULK_DELETE = 'BULK_DELETE',
}

export enum AuditEntity {
  MEMBER = 'MEMBER',
  GROUP = 'GROUP',
  INVENTORY_ITEM = 'INVENTORY_ITEM',
  INVENTORY_CATEGORY = 'INVENTORY_CATEGORY',
  UNIT = 'UNIT',
  MINISTRY = 'MINISTRY',
  SERVICE_REPORT = 'SERVICE_REPORT',
  FIRST_TIMER = 'FIRST_TIMER',
  ATTENDANCE = 'ATTENDANCE',
  USER = 'USER',
  SYSTEM = 'SYSTEM',
}

export interface AuditLog {
  _id: string;
  action: AuditAction;
  entityType: AuditEntity;
  entityId: string;
  performedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    systemRoles: string[];
  };
  performedByName: string;
  performedByEmail: string;
  performedByRoles: string[];
  description?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    source?: string;
    requestId?: string;
    sessionId?: string;
    location?: {
      country?: string;
      city?: string;
      coordinates?: [number, number];
    };
  };
  tableName?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isSystemGenerated: boolean;
  relatedUnit?: {
    _id: string;
    name: string;
    type: string;
  };
  relatedDistrict?: {
    _id: string;
    name: string;
    type: string;
  };
  tags?: string[];
  timestamp: string;
  createdAt: string;
}

export interface AuditLogQuery {
  action?: AuditAction;
  entityType?: AuditEntity;
  entityId?: string;
  performedBy?: string;
  startDate?: string;
  endDate?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  relatedUnit?: string;
  relatedDistrict?: string;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuditLogStatistics {
  actionCounts: Array<{ _id: string; count: number }>;
  entityCounts: Array<{ _id: string; count: number }>;
  severityCounts: Array<{ _id: string; count: number }>;
  dailyActivity: Array<{ _id: string; count: number }>;
  topUsers: Array<{
    _id: { id: string; name: string; email: string };
    count: number;
  }>;
  totalCount: number;
}