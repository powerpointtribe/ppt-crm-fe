import { ReactNode, useEffect, useState, memo, useRef } from 'react'
import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import ConnectionStatus from './ConnectionStatus'
import DevModeIndicator from './DevModeIndicator'
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

// Fast page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
}

export default function Layout({ children, title = 'Dashboard', subtitle, searchSection, actions }: LayoutProps) {
  const [isMobile, setIsMobile] = useState(false)
  const location = useLocation()
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Smooth scroll to top on route change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative overflow-x-hidden">
      <ConnectionStatus />
      <MemoizedSidebar />

      <main
        className={cn(
          'flex flex-col min-h-screen transition-[margin] duration-200 ease-out',
          isMobile ? 'ml-0' : 'md:ml-[240px]'
        )}
      >
        <Header title={title} subtitle={subtitle} searchSection={searchSection} actions={actions} />

        <motion.div
          ref={contentRef}
          key={location.pathname}
          className="flex-1 p-4 md:p-6 overflow-x-hidden"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{
            duration: 0.15,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        >
          {children}
        </motion.div>
      </main>
      <DevModeIndicator />
    </div>
  )
}