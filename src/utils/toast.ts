import toast from 'react-hot-toast';

type ToastType = 'success' | 'error' | 'warning' | 'info';

const displayToast = (type: ToastType, message: string) => {
  switch (type) {
    case 'success':
      toast.success(message, {
        duration: 4000,
        position: 'top-right',
      });
      break;
    case 'error':
      toast.error(message, {
        duration: 5000,
        position: 'top-right',
      });
      break;
    case 'warning':
      toast(message, {
        icon: '⚠️',
        duration: 4500,
        position: 'top-right',
        style: {
          background: '#f59e0b',
          color: '#fff',
        },
      });
      break;
    case 'info':
      toast(message, {
        icon: 'ℹ️',
        duration: 4000,
        position: 'top-right',
      });
      break;
  }
};

// Legacy function signature: showToast('message', 'type') or showToast('type', 'message')
export const showToast = Object.assign(
  (arg1: string, arg2?: ToastType | string) => {
    // Support both (type, message) and (message, type) signatures
    if (arg2 && ['success', 'error', 'warning', 'info'].includes(arg2)) {
      displayToast(arg2 as ToastType, arg1);
    } else if (['success', 'error', 'warning', 'info'].includes(arg1)) {
      displayToast(arg1 as ToastType, arg2 || '');
    } else {
      displayToast('info', arg1);
    }
  },
  {
    success: (message: string) => displayToast('success', message),
    error: (message: string) => displayToast('error', message),
    warning: (message: string) => displayToast('warning', message),
    info: (message: string) => displayToast('info', message),
  }
);

// Re-export toast for direct usage
export { toast };
