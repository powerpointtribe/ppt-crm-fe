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
  const { isAuthenticated, member } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!member) {
    return <Navigate to="/login" replace />
  }

  // Check if member has any allowed leadership role
  const leadership = member.leadershipRoles
  const roles = member.systemRoles || []

  const isDistrictPastor = leadership?.isDistrictPastor || false
  const isUnitHead = leadership?.isUnitHead || false
  const isChamp = leadership?.isChamp || false
  const isPastor = roles.includes('pastor') || roles.includes('super_admin')
  const isAdmin = roles.includes('admin') || roles.includes('super_admin')

  const hasAccess =
    (allowDistrictPastors && isDistrictPastor) ||
    (allowUnitHeads && isUnitHead) ||
    (allowChamps && isChamp) ||
    (allowPastors && isPastor) ||
    (allowAdmins && isAdmin)

  console.log(`LeadershipGuard: Checking leadership. District Pastor: ${isDistrictPastor}, Unit Head: ${isUnitHead}, Champ: ${isChamp}, Pastor: ${isPastor}, Admin: ${isAdmin}, Access: ${hasAccess}`)

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}