import { useState, useEffect, useMemo } from 'react'
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
  ChevronDown,
  ChevronUp,
  MapPin,
  Heart,
  Building2,
  FileText,
  MessageCircle,
  Phone,
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
    requiredModule: 'members',
    hasDropdown: true,
    subItems: [
      {
        icon: FileText,
        label: 'Service Reports',
        path: '/members/service-reports',
        color: 'text-blue-600'
      }
    ]
  },
  {
    icon: GroupIcon,
    label: 'Groups',
    path: '/groups',
    color: 'text-purple-600',
    requiredModule: 'units',
    hasDropdown: true,
    subItems: [
      {
        icon: MapPin,
        label: 'Districts',
        path: '/groups?page=1&limit=20&search=&type=district',
        color: 'text-blue-600'
      },
      {
        icon: Heart,
        label: 'Ministries',
        path: '/groups?page=1&limit=20&search=&type=ministry',
        color: 'text-red-600'
      },
      {
        icon: Building2,
        label: 'Units',
        path: '/groups?page=1&limit=20&search=&type=unit',
        color: 'text-green-600'
      }
    ]
  },
  {
    icon: UserPlus,
    label: 'First Timers',
    path: '/first-timers',
    color: 'text-orange-600',
    requiredModule: 'first_timers',
    hasDropdown: true,
    subItems: [
      {
        icon: UserCheck,
        label: 'My Assignments',
        path: '/my-assigned-first-timers',
        color: 'text-blue-600'
      },
      {
        icon: MessageCircle,
        label: 'Service Messaging',
        path: '/first-timers/service-messaging',
        color: 'text-purple-600'
      },
      {
        icon: Phone,
        label: 'Call Reports',
        path: '/first-timers/call-reports',
        color: 'text-green-600'
      }
    ]
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
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([])
  const { member, isLoading } = useAuth()

  // Remove permission filtering - show all menu items
  const menuItems = useMemo(() => {
    console.log('Sidebar: Showing all menu items without permission filtering');
    return baseMenuItems;
  }, [])

  const toggleDropdown = (itemPath: string) => {
    setOpenDropdowns(prev =>
      prev.includes(itemPath)
        ? prev.filter(path => path !== itemPath)
        : [...prev, itemPath]
    )
  }

  const isDropdownOpen = (itemPath: string) => openDropdowns.includes(itemPath)

  const isSubItemActive = (subItems: any[]) => {
    return subItems?.some(subItem => {
      if (subItem.path.includes('?')) {
        const [pathname, queryString] = subItem.path.split('?')
        const urlParams = new URLSearchParams(queryString)
        const currentParams = new URLSearchParams(location.search)

        // Check if pathname matches and all query params from subItem are present
        return location.pathname === pathname &&
               Array.from(urlParams.entries()).every(([key, value]) =>
                 currentParams.get(key) === value
               )
      }
      return location.pathname === subItem.path
    })
  }

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
                    const hasSubItems = item.hasDropdown && item.subItems
                    const isDropdownOpenState = isDropdownOpen(item.path)
                    const hasActiveSubItem = hasSubItems && isSubItemActive(item.subItems)

                    return (
                      <li key={item.path}>
                        {hasSubItems ? (
                          <div>
                            <div className="flex">
                              <Link
                                to={item.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                  'nav-link flex-1',
                                  (isActive || hasActiveSubItem) && 'nav-link-active bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                                )}
                              >
                                <item.icon className={cn("h-5 w-5 shrink-0", item.color)} />
                                <span className="font-medium">{item.label}</span>
                              </Link>
                              <button
                                onClick={() => toggleDropdown(item.path)}
                                className={cn(
                                  'px-3 py-2 hover:bg-muted rounded-r-md transition-colors',
                                  (isActive || hasActiveSubItem) && 'bg-primary-50 text-primary-700'
                                )}
                              >
                                {isDropdownOpenState ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </button>
                            </div>

                            <AnimatePresence>
                              {isDropdownOpenState && (
                                <motion.ul
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="ml-4 mt-1 space-y-1 overflow-hidden"
                                >
                                  {item.subItems.map((subItem) => {
                                    const isSubActive = (() => {
                                      if (subItem.path.includes('?')) {
                                        const [pathname, queryString] = subItem.path.split('?')
                                        const urlParams = new URLSearchParams(queryString)
                                        const currentParams = new URLSearchParams(location.search)
                                        return location.pathname === pathname &&
                                               Array.from(urlParams.entries()).every(([key, value]) =>
                                                 currentParams.get(key) === value
                                               )
                                      }
                                      return location.pathname === subItem.path
                                    })()
                                    return (
                                      <li key={subItem.path}>
                                        <Link
                                          to={subItem.path}
                                          onClick={() => setMobileMenuOpen(false)}
                                          className={cn(
                                            'nav-link text-sm',
                                            isSubActive && 'nav-link-active bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                                          )}
                                        >
                                          <subItem.icon className={cn("h-4 w-4 shrink-0", subItem.color)} />
                                          <span className="font-medium">{subItem.label}</span>
                                        </Link>
                                      </li>
                                    )
                                  })}
                                </motion.ul>
                              )}
                            </AnimatePresence>
                          </div>
                        ) : (
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
                        )}
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
            const hasSubItems = item.hasDropdown && item.subItems
            const isDropdownOpenState = isDropdownOpen(item.path)
            const hasActiveSubItem = hasSubItems && isSubItemActive(item.subItems)

            return (
              <motion.li
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {hasSubItems ? (
                  <div>
                    <div className={cn("flex", sidebarCollapsed ? "" : "")}>
                      <Link
                        to={item.path}
                        className={cn(
                          'nav-link relative group flex-1',
                          (isActive || hasActiveSubItem) && 'nav-link-active bg-primary-50 text-primary-700',
                          sidebarCollapsed ? 'justify-center' : ''
                        )}
                      >
                        <item.icon className={cn(
                          "h-5 w-5 shrink-0 transition-colors",
                          (isActive || hasActiveSubItem) ? 'text-primary-600' : item.color
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
                        {(isActive || hasActiveSubItem) && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r-full"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </Link>

                      {!sidebarCollapsed && (
                        <button
                          onClick={() => toggleDropdown(item.path)}
                          className={cn(
                            'px-3 py-2 hover:bg-muted rounded-r-md transition-colors relative group',
                            (isActive || hasActiveSubItem) && 'bg-primary-50 text-primary-700'
                          )}
                        >
                          {isDropdownOpenState ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Dropdown Content */}
                    <AnimatePresence>
                      {isDropdownOpenState && !sidebarCollapsed && (
                        <motion.ul
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="ml-4 mt-1 space-y-1 overflow-hidden"
                        >
                          {item.subItems.map((subItem, subIndex) => {
                            const isSubActive = (() => {
                              if (subItem.path.includes('?')) {
                                const [pathname, queryString] = subItem.path.split('?')
                                const urlParams = new URLSearchParams(queryString)
                                const currentParams = new URLSearchParams(location.search)
                                return location.pathname === pathname &&
                                       Array.from(urlParams.entries()).every(([key, value]) =>
                                         currentParams.get(key) === value
                                       )
                              }
                              return location.pathname === subItem.path
                            })()
                            return (
                              <motion.li
                                key={subItem.path}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: subIndex * 0.05 }}
                              >
                                <Link
                                  to={subItem.path}
                                  className={cn(
                                    'nav-link relative group text-sm',
                                    isSubActive && 'nav-link-active bg-primary-50 text-primary-700'
                                  )}
                                >
                                  <subItem.icon className={cn(
                                    "h-4 w-4 shrink-0 transition-colors",
                                    isSubActive ? 'text-primary-600' : subItem.color
                                  )} />
                                  <span className="font-medium">{subItem.label}</span>

                                  {/* Active indicator for sub items */}
                                  {isSubActive && (
                                    <motion.div
                                      layoutId="activeSubTab"
                                      className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r-full"
                                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                  )}
                                </Link>
                              </motion.li>
                            )
                          })}
                        </motion.ul>
                      )}
                    </AnimatePresence>

                    {/* Collapsed sidebar dropdown menu */}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-50">
                        <div className="bg-card border border-border rounded-md shadow-lg py-2 min-w-[200px]">
                          <div className="px-3 py-2 text-sm font-medium text-muted-foreground border-b border-border">
                            {item.label}
                          </div>
                          {item.subItems.map((subItem) => {
                            const isSubActive = (() => {
                              if (subItem.path.includes('?')) {
                                const [pathname, queryString] = subItem.path.split('?')
                                const urlParams = new URLSearchParams(queryString)
                                const currentParams = new URLSearchParams(location.search)
                                return location.pathname === pathname &&
                                       Array.from(urlParams.entries()).every(([key, value]) =>
                                         currentParams.get(key) === value
                                       )
                              }
                              return location.pathname === subItem.path
                            })()
                            return (
                              <Link
                                key={subItem.path}
                                to={subItem.path}
                                className={cn(
                                  'flex items-center space-x-2 px-3 py-2 text-sm hover:bg-muted transition-colors',
                                  isSubActive && 'bg-primary-50 text-primary-700'
                                )}
                              >
                                <subItem.icon className={cn("h-4 w-4", subItem.color)} />
                                <span>{subItem.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
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
                )}
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
