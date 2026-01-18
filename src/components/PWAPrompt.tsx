import { usePWA } from '@/hooks/usePWA'
import { X, RefreshCw, Download, Wifi } from 'lucide-react'

export function PWAPrompt() {
  const {
    needRefresh,
    offlineReady,
    isInstallable,
    updateApp,
    installApp,
    closeUpdatePrompt,
    closeOfflinePrompt,
  } = usePWA()

  if (!needRefresh && !offlineReady && !isInstallable) {
    return null
  }

  return (
    <>
      {/* Update Available Prompt */}
      {needRefresh && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">
                Update Available
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                A new version is available. Reload to update.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={updateApp}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Update Now
                </button>
                <button
                  onClick={closeUpdatePrompt}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Later
                </button>
              </div>
            </div>
            <button
              onClick={closeUpdatePrompt}
              className="flex-shrink-0 text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Offline Ready Prompt */}
      {offlineReady && !needRefresh && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-lg shadow-lg border border-green-200 p-4 z-50 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Wifi className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">
                Ready to Work Offline
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                App has been cached and can work offline.
              </p>
            </div>
            <button
              onClick={closeOfflinePrompt}
              className="flex-shrink-0 text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Install Prompt - shown as a floating button */}
      {isInstallable && !needRefresh && !offlineReady && (
        <button
          onClick={installApp}
          className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 z-50 animate-slide-up"
        >
          <Download className="w-5 h-5" />
          <span className="text-sm font-medium">Install App</span>
        </button>
      )}
    </>
  )
}
