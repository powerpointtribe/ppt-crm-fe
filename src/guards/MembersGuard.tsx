import React from 'react'
import { PermissionGuard } from './PermissionGuard'

interface MembersGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

/**
 * MembersGuard - Guards routes/components that require members module access
 * Uses permissions-based access control (strict permissions)
 */
export const MembersGuard: React.FC<MembersGuardProps> = ({
  children,
  fallback,
  redirectTo = '/dashboard'
}) => {
  return (
    <PermissionGuard
      permission="members:view"
      fallback={fallback}
      redirectTo={redirectTo}
    >
      {children}
    </PermissionGuard>
  )
}