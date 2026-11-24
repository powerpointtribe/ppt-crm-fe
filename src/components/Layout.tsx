import { ReactNode, useContext, useEffect, useState, memo } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import ConnectionStatus from './ConnectionStatus'
import DevModeIndicator from './DevModeIndicator'
import { ShellContext } from './AppShell'
import { cn } from '@/utils/cn'

interface LayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
  /** @deprecated Use PageToolbar in children instead */
  searchSection?: ReactNode
  /** Optional actions to display next to the title */
  actions?: ReactNode
}

// Memoize Sidebar to prevent re-renders
const MemoizedSidebar = memo(Sidebar)

/**
 * A page's header and content. Inside the persistent AppShell (every signed-in route)
 * this renders only the header + content; the shell owns the sidebar, so it is not
 * rebuilt on navigation. Outside the shell it renders the full frame itself.
 *
 * The content is keyed by pathname so a page's subtree still starts fresh when the URL
 * changes (e.g. /members/1 → /members/2), as before. It renders at full opacity at once:
 * no fade-in from transparent, which read as a white flash on every navigation.
 */
export default function Layout({ children, title = 'Dashboard', subtitle, searchSection, actions }: LayoutProps) {
  const inShell = useContext(ShellContext)
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)

  useEffect(() => {
    if (inShell) return
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [inShell])

  const page = (
    <>
      <Header title={title} subtitle={subtitle} searchSection={searchSection} actions={actions} />
      <div key={location.pathname} className="flex-1 p-4 md:p-6 overflow-x-hidden">
        {children}
      </div>
    </>
  )

  if (inShell) return page

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative overflow-x-hidden">
      <ConnectionStatus />
      <MemoizedSidebar />
      <main className={cn('flex flex-col min-h-screen transition-[margin] duration-200 ease-out', isMobile ? 'ml-0' : 'md:ml-[240px]')}>
        {page}
      </main>
      <DevModeIndicator />
    </div>
  )
}
