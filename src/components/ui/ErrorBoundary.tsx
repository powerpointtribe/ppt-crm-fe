import { AlertTriangle, RefreshCw, LogOut, WifiOff, Server } from 'lucide-react'
import { motion } from 'framer-motion'
import Card from './Card'
import { useAuth } from '@/contexts/AuthContext-unified'

interface ErrorBoundaryProps {
  error: {
    status?: number
    message: string
    details?: string
  }
  onRetry?: () => void
  showLogout?: boolean
}

export default function ErrorBoundary({ error, onRetry, showLogout = false, children }: ErrorBoundaryProps & { children?: React.ReactNode }) {
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  // If no error, render children
  if (!error) {
    return <>{children}</>
  }

  const getErrorInfo = () => {
    // Check for network errors first
    if (error.message?.includes('Network') || error.message?.includes('network') ||
        error.message?.includes('connect') || error.message === 'NETWORK_ERROR') {
      return {
        title: 'Connection Problem',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        icon: WifiOff,
        color: 'text-orange-500',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        tips: [
          'Check your internet connection',
          'Verify the server is accessible',
          'Try refreshing the page',
          'Contact support if the problem persists'
        ]
      }
    }

    switch (error.status) {
      case 401:
        return {
          title: 'Authentication Required',
          message: 'Your session has expired or you don\'t have permission to access this resource.',
          icon: LogOut,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      case 403:
        return {
          title: 'Access Forbidden',
          message: 'You don\'t have permission to access this resource.',
          icon: AlertTriangle,
          color: 'text-orange-500',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        }
      case 404:
        return {
          title: 'Resource Not Found',
          message: 'The requested resource could not be found.',
          icon: AlertTriangle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        }
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          title: 'Server Error',
          message: 'The server is experiencing issues. Please try again in a few moments.',
          icon: Server,
          color: 'text-purple-500',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        }
      default:
        return {
          title: 'Something went wrong',
          message: error.message || 'An unexpected error occurred.',
          icon: AlertTriangle,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
    }
  }

  const errorInfo = getErrorInfo()
  const Icon = errorInfo.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center min-h-[200px] p-4"
    >
      <Card className={`max-w-md w-full ${errorInfo.bgColor} ${errorInfo.borderColor}`}>
        <div className="text-center p-6">
          <Icon className={`w-12 h-12 mx-auto mb-4 ${errorInfo.color}`} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {errorInfo.title}
          </h3>
          <p className="text-gray-600 mb-4">
            {errorInfo.message}
          </p>
          {error.details && (
            <p className="text-sm text-gray-500 mb-4 font-mono bg-gray-100 p-2 rounded">
              {error.details}
            </p>
          )}
          {errorInfo.tips && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md text-left">
              <h4 className="text-sm font-medium text-orange-800 mb-2">Troubleshooting Tips:</h4>
              <ul className="text-xs text-orange-700 space-y-1">
                {errorInfo.tips.map((tip, index) => (
                  <li key={index}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </button>
            )}
            {(showLogout || error.status === 401) && (
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}