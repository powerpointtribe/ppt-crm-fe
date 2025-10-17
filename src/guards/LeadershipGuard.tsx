import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext-unified'

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
  const { isAuthenticated, member, hasSystemRole } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!member) {
    return <Navigate to="/login" replace />
  }

  const { leadershipRoles } = member

  const hasAccess =
    (allowAdmins && hasSystemRole('admin')) ||
    (allowPastors && hasSystemRole('pastor')) ||
    (allowDistrictPastors && leadershipRoles?.isDistrictPastor) ||
    (allowUnitHeads && leadershipRoles?.isUnitHead) ||
    (allowChamps && leadershipRoles?.isChamp)

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}