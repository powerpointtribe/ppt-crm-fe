import { useEffect } from 'react'

/**
 * Hook that forces light mode while the component is mounted.
 * Removes the 'dark' class from the document element and restores it on unmount.
 * Used for pages that should always be in light mode (login, auth pages, etc.)
 */
export function useForceLightMode() {
  useEffect(() => {
    const htmlElement = document.documentElement
    const wasDarkMode = htmlElement.classList.contains('dark')

    // Remove dark class to force light mode
    if (wasDarkMode) {
      htmlElement.classList.remove('dark')
    }

    // Restore dark class on unmount if it was previously set
    return () => {
      if (wasDarkMode) {
        htmlElement.classList.add('dark')
      }
    }
  }, [])
}
