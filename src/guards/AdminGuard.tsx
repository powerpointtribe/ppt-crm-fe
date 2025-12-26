import React from 'react'
import { PermissionGuard } from './PermissionGuard'

interface AdminGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
  allowPastors?: boolean
}

/**
 * AdminGuard - Guards routes/components that require admin-level access
 * Uses permissions-based access control (strict permissions)
 *
 * Admin access is determined by having 'roles:view' permission
 * Pastor access (if allowed) is determined by having 'members:create' permission
 */
export const AdminGuard: React.FC<AdminGuardProps> = ({
  children,
  fallback,
  redirectTo = '/dashboard',
  allowPastors = false
}) => {
  // Admin permissions: can manage roles
  // Pastor permissions: can create members (if allowPastors is true)
  const requiredPermissions = allowPastors
    ? ['roles:view', 'members:create']
    : ['roles:view']

  return (
    <PermissionGuard
      anyPermission={requiredPermissions}
      fallback={fallback}
      redirectTo={redirectTo}
    >
      {children}
    </PermissionGuard>
  )
}