import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, X, AlertCircle } from 'lucide-react'

export default function DevModeIndicator() {
  const [isExpanded, setIsExpanded] = useState(false)
  const isDev = import.meta.env.DEV

  if (!isDev) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-2 bg-yellow-500 text-yellow-900 p-3 rounded-lg shadow-lg max-w-sm"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <h4 className="font-medium text-sm">Development Mode</h4>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-yellow-700 hover:text-yellow-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="text-xs space-y-1">
              <p>• Using proxy to API server ✅</p>
              <p>• API connected successfully ✅</p>
              <p>• Test credentials available on login</p>
              <p>• API Base: {import.meta.env.VITE_API_BASE_URL || '/api/v1'}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-yellow-500 text-yellow-900 p-2 rounded-full shadow-lg hover:bg-yellow-400 transition-colors"
        title="Development Mode Info"
      >
        <Settings className="h-5 w-5" />
      </motion.button>
    </div>
  )
}