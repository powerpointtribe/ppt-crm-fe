import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext-unified'

const logs: string[] = []

export const debugLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  const logMessage = `[${timestamp}] ${message}`
  logs.push(logMessage)
  console.log(logMessage)

  // Keep only last 50 logs
  if (logs.length > 50) {
    logs.splice(0, logs.length - 50)
  }
}

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [logList, setLogList] = useState<string[]>([])
  const [isPageVisible, setIsPageVisible] = useState(!document.hidden)
  const { isAuthenticated, member } = useAuth()

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    // Only update logs when panel is open and page is visible to avoid unnecessary re-renders
    if (!isOpen || !isPageVisible) return

    // Initialize logs when panel opens
    setLogList([...logs])

    const interval = setInterval(() => {
      // Only update if there are new logs to prevent unnecessary re-renders
      if (logs.length !== logList.length) {
        setLogList([...logs])
      }
    }, 2000) // Reduced frequency from 500ms to 2s

    return () => clearInterval(interval)
  }, [isOpen, isPageVisible, logList.length])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm z-50"
      >
        Debug
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg max-w-md max-h-96 overflow-auto z-50 border border-gray-600">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold">Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>

      <div className="mb-3 text-xs">
        <div>Auth: {isAuthenticated ? '✅' : '❌'}</div>
        <div>Token: {localStorage.getItem('auth_token') ? '✅' : '❌'}</div>
        <div>Member: {member ? '✅' : '❌'}</div>
        <div>Modules: {member?.accessibleModules?.length || 0}</div>
      </div>

      <div className="text-xs space-y-1 max-h-48 overflow-y-auto">
        {logList.slice(-20).map((log, i) => (
          <div key={i} className="text-gray-300 font-mono">
            {log}
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          logs.length = 0
          setLogList([])
        }}
        className="mt-2 bg-red-600 text-white px-2 py-1 rounded text-xs"
      >
        Clear
      </button>
    </div>
  )
}