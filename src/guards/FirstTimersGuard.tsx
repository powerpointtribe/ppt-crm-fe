import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext-unified'

interface FirstTimersGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export const FirstTimersGuard: React.FC<FirstTimersGuardProps> = ({
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

  // Check if member can access first-timers module
  const hasAccess = canAccessModule('first-timers')
  console.log(`FirstTimersGuard: Checking first-timers access, Access: ${hasAccess}`)

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}