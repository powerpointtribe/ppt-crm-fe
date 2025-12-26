import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext-unified'

interface RoleGuardProps {
  allowedRoles: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
  requireAll?: boolean
}

// Map roles to their equivalent permissions (strict permissions-based)
const roleToPermissionMap: Record<string, string[]> = {
  'super_admin': ['roles:view', 'roles:create'],
  'admin': ['roles:view'],
  'pastor': ['members:create', 'first-timers:view'],
  'branch_pastor': ['members:view', 'units:view'],
  'district_pastor': ['members:view', 'units:view'],
  'unit_head': ['members:view'],
  'member': ['dashboard:view'],
}

/**
 * RoleGuard - Guards routes/components based on role access
 * DEPRECATED: Use PermissionGuard instead for strict permissions-based access
 *
 * This guard now internally maps roles to permissions for backward compatibility
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  fallback,
  redirectTo = '/dashboard',
  requireAll = false
}) => {
  const { isAuthenticated, member, hasAnyPermission, hasAllPermissions } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!member) {
    return <Navigate to="/login" replace />
  }

  // Convert roles to permissions
  const requiredPermissions = allowedRoles.flatMap(role =>
    roleToPermissionMap[role] || [`${role}:view`]
  )

  // Check if member has the required permission(s)
  const hasAccess = requireAll
    ? hasAllPermissions(requiredPermissions)
    : hasAnyPermission(requiredPermissions)

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}