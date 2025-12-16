import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext-unified'

interface PermissionGuardProps {
  /** Single permission required (e.g., 'members:create') */
  permission?: string
  /** Multiple permissions - user needs ANY one of these */
  anyPermission?: string[]
  /** Multiple permissions - user needs ALL of these */
  allPermissions?: string[]
  /** Content to render if user has permission */
  children: React.ReactNode
  /** Optional fallback content if user lacks permission */
  fallback?: React.ReactNode
  /** Optional redirect path if user lacks permission */
  redirectTo?: string
}

/**
 * PermissionGuard - Guards routes/components based on specific permissions
 *
 * Usage examples:
 *
 * // Single permission
 * <PermissionGuard permission="members:create">
 *   <CreateMemberButton />
 * </PermissionGuard>
 *
 * // Any one of multiple permissions
 * <PermissionGuard anyPermission={['members:view', 'members:view-district']}>
 *   <MembersList />
 * </PermissionGuard>
 *
 * // All of multiple permissions
 * <PermissionGuard allPermissions={['members:update', 'members:view']}>
 *   <EditMemberForm />
 * </PermissionGuard>
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  anyPermission,
  allPermissions,
  children,
  fallback,
  redirectTo = '/dashboard'
}) => {
  const { isAuthenticated, member, hasPermission, hasAnyPermission, hasAllPermissions } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!member) {
    return <Navigate to="/login" replace />
  }

  // Determine if user has required permission(s)
  let hasAccess = false
  let accessType = ''

  if (permission) {
    hasAccess = hasPermission(permission)
    accessType = `single permission '${permission}'`
  } else if (anyPermission && anyPermission.length > 0) {
    hasAccess = hasAnyPermission(anyPermission)
    accessType = `any of [${anyPermission.join(', ')}]`
  } else if (allPermissions && allPermissions.length > 0) {
    hasAccess = hasAllPermissions(allPermissions)
    accessType = `all of [${allPermissions.join(', ')}]`
  } else {
    console.warn('PermissionGuard: No permission criteria specified, denying access')
    hasAccess = false
    accessType = 'no criteria specified'
  }

  console.log(`PermissionGuard: Checking ${accessType}, Access: ${hasAccess}`)

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
