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
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Permission restrictions removed - always allow access to authenticated users
  console.log('FirstTimersGuard: Allowing access without permission check')
  return <>{children}</>
}