import React from 'react'
import { RoleGuard } from './RoleGuard'

interface AdminGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
  allowPastors?: boolean
}

export const AdminGuard: React.FC<AdminGuardProps> = ({
  children,
  fallback,
  redirectTo = '/dashboard',
  allowPastors = false
}) => {
  const allowedRoles = allowPastors ? ['admin', 'pastor'] : ['admin']

  return (
    <RoleGuard
      allowedRoles={allowedRoles}
      fallback={fallback}
      redirectTo={redirectTo}
    >
      {children}
    </RoleGuard>
  )
}