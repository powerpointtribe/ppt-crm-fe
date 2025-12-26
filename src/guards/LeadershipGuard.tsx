import React from 'react'
import { PermissionGuard } from './PermissionGuard'

interface LeadershipGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
  allowDistrictPastors?: boolean
  allowUnitHeads?: boolean
  allowChamps?: boolean
  allowPastors?: boolean
  allowAdmins?: boolean
}

/**
 * LeadershipGuard - Guards routes/components that require leadership-level access
 * DEPRECATED: Use PermissionGuard instead for strict permissions-based access
 *
 * This guard now maps leadership roles to permissions for backward compatibility
 * - District Pastors: units:update permission
 * - Unit Heads: members:view permission
 * - Champs: members:view permission
 * - Pastors: members:create permission
 * - Admins: roles:view permission
 */
export const LeadershipGuard: React.FC<LeadershipGuardProps> = ({
  children,
  fallback,
  redirectTo = '/dashboard',
  allowDistrictPastors = true,
  allowUnitHeads = true,
  allowChamps = true,
  allowPastors = true,
  allowAdmins = true
}) => {
  // Build list of required permissions based on allowed roles
  const requiredPermissions: string[] = []

  if (allowDistrictPastors) requiredPermissions.push('units:update')
  if (allowUnitHeads) requiredPermissions.push('members:view')
  if (allowChamps) requiredPermissions.push('members:view')
  if (allowPastors) requiredPermissions.push('members:create')
  if (allowAdmins) requiredPermissions.push('roles:view')

  // Remove duplicates
  const uniquePermissions = [...new Set(requiredPermissions)]

  return (
    <PermissionGuard
      anyPermission={uniquePermissions}
      fallback={fallback}
      redirectTo={redirectTo}
    >
      {children}
    </PermissionGuard>
  )
}