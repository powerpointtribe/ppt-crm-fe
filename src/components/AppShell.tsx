import { createContext, memo, Suspense, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import ConnectionStatus from './ConnectionStatus'
import DevModeIndicator from './DevModeIndicator'
import PageLoader from './PageLoader'
import { cn } from '@/utils/cn'

/** True below the persistent shell: Layout then renders only the header + page content. */
export const ShellContext = createContext(false)

const MemoizedSidebar = memo(Sidebar)

/**
 * The signed-in app frame. Rendered once by a parent route, so the sidebar (and its
 * state: open dropdowns, selected campus, scroll position) survives navigation and
 * only the page content changes.
 *
 * Lazy pages suspend into the Suspense below. Navigation runs in a transition
 * (`v7_startTransition` in main.tsx), so while a page's code loads the previous page
 * stays on screen instead of being swapped for a spinner. The fallback only shows on
 * a first load with nothing to keep (e.g. a hard refresh), and then only in the
 * content area.
 */
export default function AppShell() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <ShellContext.Provider value={true}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative overflow-x-hidden">
        <ConnectionStatus />
        <MemoizedSidebar />
        <main className={cn('flex flex-col min-h-screen transition-[margin] duration-200 ease-out', isMobile ? 'ml-0' : 'md:ml-[240px]')}>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
        <DevModeIndicator />
      </div>
    </ShellContext.Provider>
  )
}
