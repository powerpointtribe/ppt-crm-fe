import { useState, useEffect, useCallback } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

interface PWAState {
  needRefresh: boolean
  offlineReady: boolean
  isInstallable: boolean
  isInstalled: boolean
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log('SW Registered:', registration)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  // Check if app is already installed
  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIosStandalone = (navigator as any).standalone === true
      setIsInstalled(isStandalone || isIosStandalone)
    }

    checkInstalled()

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    mediaQuery.addEventListener('change', checkInstalled)

    return () => {
      mediaQuery.removeEventListener('change', checkInstalled)
    }
  }, [])

  // Capture the install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setInstallPrompt(null)
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const installApp = useCallback(async () => {
    if (!installPrompt) return false

    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice

      if (outcome === 'accepted') {
        setInstallPrompt(null)
        return true
      }
      return false
    } catch (error) {
      console.error('Install prompt error:', error)
      return false
    }
  }, [installPrompt])

  const updateApp = useCallback(() => {
    updateServiceWorker(true)
  }, [updateServiceWorker])

  const closeUpdatePrompt = useCallback(() => {
    setNeedRefresh(false)
  }, [setNeedRefresh])

  const closeOfflinePrompt = useCallback(() => {
    setOfflineReady(false)
  }, [setOfflineReady])

  const state: PWAState = {
    needRefresh,
    offlineReady,
    isInstallable: !!installPrompt,
    isInstalled,
  }

  return {
    ...state,
    installApp,
    updateApp,
    closeUpdatePrompt,
    closeOfflinePrompt,
  }
}
