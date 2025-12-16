import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext-unified'

interface MembersGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export const MembersGuard: React.FC<MembersGuardProps> = ({
  children,
  fallback,
  redirectTo = '/dashboard'
}) => {
  const { isAuthenticated, member, canAccessModule } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!member) {
    return <Navigate to="/login" replace />
  }

  // Check if member can access members module
  const hasAccess = canAccessModule('members')
  console.log(`MembersGuard: Checking members access, Access: ${hasAccess}`)

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}