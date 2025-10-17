import { useState, useCallback } from 'react'
import { ToastProps, ToastType } from '@/components/ui/Toast'

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const addToast = useCallback((
    type: ToastType,
    title: string,
    message?: string,
    duration?: number
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    const toast: ToastProps = {
      id,
      type,
      title,
      message,
      duration,
      onRemove: removeToast,
    }

    setToasts((prevToasts) => [...prevToasts, toast])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }, [])

  const success = useCallback((title: string, message?: string, duration?: number) => {
    addToast('success', title, message, duration)
  }, [addToast])

  const error = useCallback((title: string, message?: string, duration?: number) => {
    addToast('error', title, message, duration)
  }, [addToast])

  const warning = useCallback((title: string, message?: string, duration?: number) => {
    addToast('warning', title, message, duration)
  }, [addToast])

  const info = useCallback((title: string, message?: string, duration?: number) => {
    addToast('info', title, message, duration)
  }, [addToast])

  return {
    toasts,
    success,
    error,
    warning,
    info,
    removeToast,
  }
}