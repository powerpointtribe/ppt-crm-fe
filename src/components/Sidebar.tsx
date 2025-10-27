import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Home,
  Settings,
  ChevronLeft,
  ChevronRight,
  UsersIcon,
  UserPlus,
  Menu,
  X,
  LayoutDashboard,
  UserCheck,
  GroupIcon,
  Database,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAppStore } from '@/store'
import { useAuth } from '@/contexts/AuthContext-unified'

const baseMenuItems = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/dashboard',
    color: 'text-primary-600',
    requiredModule: null // Always visible
  },
  {
    icon: UsersIcon,
    label: 'Members',
    path: '/members',
    color: 'text-green-600',
    requiredModule: 'members'
  },
  {
    icon: GroupIcon,
    label: 'Groups',
    path: '/groups',
    color: 'text-purple-600',
    requiredModule: 'units'
  },
  {
    icon: UserPlus,
    label: 'First Timers',
    path: '/first-timers',
    color: 'text-orange-600',
    requiredModule: 'first_timers'
  },
  {
    icon: Database,
    label: 'Bulk Operations',
    path: '/bulk-operations',
    color: 'text-purple-600',
    requiredModule: null // Available to all authenticated users
  },
  {
    icon: Settings,
    label: 'Settings',
    path: '/settings',
    color: 'text-gray-600',
    requiredModule: null // Always visible
  },
]

export default function Sidebar() {
  const location = useLocation()
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore()
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { canAccessModule } = useAuth()

  // Filter menu items based on user access
  const menuItems = baseMenuItems.filter(item =>
    !item.requiredModule || canAccessModule(item.requiredModule)
  )

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-border"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Mobile Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-50 flex flex-col shadow-xl"
            >
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-bold text-lg text-foreground">
                  PowerPoint Tribe
                </h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 hover:bg-muted rounded-md transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 p-4">
                <ul className="space-y-2">
                  {menuItems.map((item) => {
                    const isActive = location.pathname === item.path
                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            'nav-link',
                            isActive && 'nav-link-active bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                          )}
                        >
                          <item.icon className={cn("h-5 w-5 shrink-0", item.color)} />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  return (
    <motion.div
      className={cn(
        'hidden md:flex fixed left-0 top-0 h-full bg-card border-r border-border z-40 flex-col shadow-sm',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="font-bold text-lg text-foreground"
              >
                PowerPoint Tribe
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 hover:bg-accent rounded-md transition-colors text-muted-foreground hover:text-foreground"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path
            return (
              <motion.li
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={item.path}
                  className={cn(
                    'nav-link relative group',
                    isActive && 'nav-link-active bg-primary-50 text-primary-700'
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive ? 'text-primary-600' : item.color
                  )} />

                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="font-medium"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Tooltip for collapsed sidebar */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-sm font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                      {item.label}
                    </div>
                  )}

                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              </motion.li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className={cn(
          "text-xs text-muted-foreground text-center",
          sidebarCollapsed && "hidden"
        )}>
          <p>© 2024 PowerPoint Tribe</p>
          <p className="mt-1">Church Management System</p>
        </div>
      </div>
    </motion.div>
  )
}
