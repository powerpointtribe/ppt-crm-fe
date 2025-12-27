import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext-unified'

interface ModuleAccessGuardProps {
  module: string
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

// Map modules to their primary view permission
const modulePermissionMap: Record<string, string> = {
  'members': 'members:view',
  'first-timers': 'first-timers:view',
  'units': 'units:view',
  'groups': 'units:view',
  'inventory': 'inventory:view',
  'branches': 'branches:view',
  'roles': 'roles:view-roles',
  'audit-logs': 'audit-logs:view',
  'bulk-operations': 'bulk-operations:view',
  'user-management': 'user-management:view',
  'dashboard': 'dashboard:view',
  'service-reports': 'service-reports:view',
  'workers-training': 'workers-training:view',
  'activity-tracker': 'activity-tracker:view',
}

/**
 * ModuleAccessGuard - Guards routes/components based on module access
 * Uses permissions-based access control (strict permissions)
 *
 * Module access is determined by having the module's 'view' permission
 */
export const ModuleAccessGuard: React.FC<ModuleAccessGuardProps> = ({
  module,
  children,
  fallback,
  redirectTo = '/dashboard'
}) => {
  const { isAuthenticated, member, hasPermission } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!member) {
    return <Navigate to="/login" replace />
  }

  // Get the required permission for this module
  const requiredPermission = modulePermissionMap[module] || `${module}:view`

  // Check if member has the required permission
  const hasAccess = hasPermission(requiredPermission)

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}