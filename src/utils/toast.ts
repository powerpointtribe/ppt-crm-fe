// Toast utility functions
// This would typically integrate with a toast library like react-hot-toast or react-toastify

type ToastType = 'success' | 'error' | 'warning' | 'info'

const displayToast = (type: ToastType, message: string) => {
  // For now, just use console.log as a placeholder
  // In a real app, you'd use a proper toast library
  console.log(`[${type.toUpperCase()}] ${message}`)

  // Example implementation with react-hot-toast:
  // import toast from 'react-hot-toast'
  // switch (type) {
  //   case 'success':
  //     toast.success(message)
  //     break
  //   case 'error':
  //     toast.error(message)
  //     break
  //   case 'warning':
  //     toast.warning(message)
  //     break
  //   case 'info':
  //     toast.info(message)
  //     break
  // }
}

// Legacy function signature: showToast('message', 'type') or showToast('type', 'message')
export const showToast = Object.assign(
  (arg1: string, arg2?: ToastType | string) => {
    // Support both (type, message) and (message, type) signatures
    if (arg2 && ['success', 'error', 'warning', 'info'].includes(arg2)) {
      displayToast(arg2 as ToastType, arg1)
    } else if (['success', 'error', 'warning', 'info'].includes(arg1)) {
      displayToast(arg1 as ToastType, arg2 || '')
    } else {
      displayToast('info', arg1)
    }
  },
  {
    success: (message: string) => displayToast('success', message),
    error: (message: string) => displayToast('error', message),
    warning: (message: string) => displayToast('warning', message),
    info: (message: string) => displayToast('info', message),
  }
)