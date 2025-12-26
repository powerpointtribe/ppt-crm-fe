import { ReactNode, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import Header from './Header'
import ConnectionStatus from './ConnectionStatus'
import DevModeIndicator from './DevModeIndicator'
import { useAppStore } from '@/store'
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

export default function Layout({ children, title = 'Dashboard', subtitle, searchSection, actions }: LayoutProps) {
  const { sidebarCollapsed } = useAppStore()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="min-h-screen bg-background relative">
      <ConnectionStatus />
      <Sidebar />

      <main
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300',
          isMobile ? 'ml-0' : sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
        )}
      >
        <Header title={title} subtitle={subtitle} searchSection={searchSection} actions={actions} />

        <motion.div
          className="flex-1 p-4 md:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {children}
        </motion.div>
      </main>
      <DevModeIndicator />
    </div>
  )
}