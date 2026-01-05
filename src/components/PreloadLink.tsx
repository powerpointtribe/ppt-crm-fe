import { Link, LinkProps, useNavigate } from 'react-router-dom'
import { forwardRef, useCallback, useRef } from 'react'
import { routePreloader } from '@/utils/routePreloader'

interface PreloadLinkProps extends LinkProps {
  preloadDelay?: number
}

export const PreloadLink = forwardRef<HTMLAnchorElement, PreloadLinkProps>(
  ({ to, preloadDelay = 50, onMouseEnter, onFocus, ...props }, ref) => {
    const timeoutRef = useRef<NodeJS.Timeout>()

    const handlePreload = useCallback(() => {
      const path = typeof to === 'string' ? to : to.pathname || ''

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Preload after a small delay to avoid unnecessary preloads
      timeoutRef.current = setTimeout(() => {
        routePreloader.preload(path)
      }, preloadDelay)
    }, [to, preloadDelay])

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLAnchorElement>) => {
        handlePreload()
        onMouseEnter?.(e)
      },
      [handlePreload, onMouseEnter]
    )

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLAnchorElement>) => {
        handlePreload()
        onFocus?.(e)
      },
      [handlePreload, onFocus]
    )

    return (
      <Link
        ref={ref}
        to={to}
        onMouseEnter={handleMouseEnter}
        onFocus={handleFocus}
        {...props}
      />
    )
  }
)

PreloadLink.displayName = 'PreloadLink'

// Hook for programmatic preloading
export function usePreloadRoute() {
  const navigate = useNavigate()

  const preloadAndNavigate = useCallback(
    (path: string, options?: { replace?: boolean }) => {
      routePreloader.preload(path)
      navigate(path, options)
    },
    [navigate]
  )

  return { preloadAndNavigate, preload: routePreloader.preload }
}
