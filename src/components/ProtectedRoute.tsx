import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext-unified'
import LoadingSpinner from './ui/LoadingSpinner'
import { debugLog } from './DebugPanel'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, member } = useAuth()
  const location = useLocation()

  // Check if we have authentication data
  const hasToken = localStorage.getItem('auth_token')

  debugLog(`ProtectedRoute: auth=${isAuthenticated}, loading=${isLoading}, member=${!!member}, hasToken=${!!hasToken}`)

  // If still loading, show spinner
  if (isLoading) {
    debugLog('Auth context is loading, showing spinner...')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    debugLog('Not authenticated, redirecting to login')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  debugLog('Authentication check passed, rendering children')
  return <>{children}</>
}