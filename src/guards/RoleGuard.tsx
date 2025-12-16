import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext-unified'

interface RoleGuardProps {
  allowedRoles: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
  requireAll?: boolean // If true, member must have ALL roles. If false, just one role is enough
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  fallback,
  redirectTo = '/dashboard',
  requireAll = false
}) => {
  const { isAuthenticated, member } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!member) {
    return <Navigate to="/login" replace />
  }

  // Check if member has the required role(s)
  const memberRoles = member.systemRoles || []
  const hasRequiredRole = requireAll
    ? allowedRoles.every(role => memberRoles.includes(role))
    : allowedRoles.some(role => memberRoles.includes(role))

  console.log(`RoleGuard: Checking roles. Required: ${allowedRoles.join(', ')}, Member has: ${memberRoles.join(', ')}, Access: ${hasRequiredRole}`)

  if (!hasRequiredRole) {
    if (fallback) {
      return <>{fallback}</>
    }
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}