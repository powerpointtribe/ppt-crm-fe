import { useState, useEffect, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Settings,
  UsersIcon,
  UserPlus,
  Menu,
  X,
  LayoutDashboard,
  Database,
  ChevronDown,
  MapPin,
  Heart,
  Building2,
  FileText,
  MessageCircle,
  Phone,
  Package,
  Shield,
  Archive,
  Activity,
  BarChart3,
  GitBranch,
  Boxes,
  UserCog,
  ClipboardList,
  FolderKanban,
  Building,
  Check,
  Globe,
  Plus,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAppStore, Branch } from '@/store'
import { useAuth } from '@/contexts/AuthContext-unified'
import { branchesService } from '@/services/branches'

interface MenuItem {
  icon: any
  label: string
  path: string
  requiredPermission: string | null
  hasDropdown?: boolean
  subItems?: SubMenuItem[]
}

interface SubMenuItem {
  icon: any
  label: string
  path: string
  requiredPermission: string
}

interface MenuGroup {
  label: string
  items: MenuItem[]
}

// Grouped menu items with required permissions
const menuGroups: MenuGroup[] = [
  {
    label: 'Main',
    items: [
      {
        icon: LayoutDashboard,
        label: 'Dashboard',
        path: '/dashboard',
        requiredPermission: 'dashboard:view',
      },
    ],
  },
  {
    label: 'People',
    items: [
      {
        icon: UsersIcon,
        label: 'Members',
        path: '/members',
        requiredPermission: 'members:view',
        hasDropdown: true,
        subItems: [
          {
            icon: BarChart3,
            label: 'Analytics',
            path: '/members/analytics',
            requiredPermission: 'members:view-stats',
          },
          {
            icon: FileText,
            label: 'Reports',
            path: '/members/reports',
            requiredPermission: 'members:view-stats',
          },
          {
            icon: ClipboardList,
            label: 'Service Reports',
            path: '/members/service-reports',
            requiredPermission: 'service-reports:view',
          },
        ],
      },
      {
        icon: UserPlus,
        label: 'First Timers',
        path: '/first-timers',
        requiredPermission: 'first-timers:view',
        hasDropdown: true,
        subItems: [
          {
            icon: Phone,
            label: 'Call Reports',
            path: '/first-timers/call-reports',
            requiredPermission: 'first-timers:view-call-reports',
          },
          {
            icon: MessageCircle,
            label: 'Messages',
            path: '/first-timers/message-drafts',
            requiredPermission: 'first-timers:view',
          },
        ],
      },
    ],
  },
  {
    label: 'Organization',
    items: [
      {
        icon: FolderKanban,
        label: 'Groups',
        path: '/groups',
        requiredPermission: 'units:view',
        hasDropdown: true,
        subItems: [
          {
            icon: MapPin,
            label: 'Districts',
            path: '/groups?page=1&limit=20&search=&type=district',
            requiredPermission: 'units:view',
          },
          {
            icon: Heart,
            label: 'Ministries',
            path: '/groups?page=1&limit=20&search=&type=ministry',
            requiredPermission: 'units:view',
          },
          {
            icon: Building2,
            label: 'Units',
            path: '/groups?page=1&limit=20&search=&type=unit',
            requiredPermission: 'units:view',
          },
        ],
      },
      {
        icon: GitBranch,
        label: 'Expressions',
        path: '/branches',
        requiredPermission: 'branches:view',
      },
    ],
  },
  {
    label: 'Resources',
    items: [
      {
        icon: Boxes,
        label: 'Inventory',
        path: '/inventory',
        requiredPermission: 'inventory:view-items',
        hasDropdown: true,
        subItems: [
          {
            icon: Package,
            label: 'Items',
            path: '/inventory/items',
            requiredPermission: 'inventory:view-items',
          },
          {
            icon: Archive,
            label: 'Categories',
            path: '/inventory/categories',
            requiredPermission: 'inventory:view-categories',
          },
          {
            icon: Activity,
            label: 'Movements',
            path: '/inventory/movements',
            requiredPermission: 'inventory:view-movements',
          },
          {
            icon: BarChart3,
            label: 'Reports',
            path: '/inventory/reports',
            requiredPermission: 'inventory:view-stats',
          },
        ],
      },
    ],
  },
  {
    label: 'Administration',
    items: [
      {
        icon: Shield,
        label: 'Audit Logs',
        path: '/audit',
        requiredPermission: 'audit-logs:view',
        hasDropdown: true,
        subItems: [
          {
            icon: FileText,
            label: 'Logs',
            path: '/audit/logs',
            requiredPermission: 'audit-logs:view',
          },
          {
            icon: BarChart3,
            label: 'Statistics',
            path: '/audit/reports',
            requiredPermission: 'audit-logs:view-statistics',
          },
        ],
      },
      {
        icon: Database,
        label: 'Bulk Upload',
        path: '/bulk-operations',
        requiredPermission: 'bulk-operations:view-history',
      },
      {
        icon: UserCog,
        label: 'Roles',
        path: '/roles',
        requiredPermission: 'roles:view-roles',
      },
      {
        icon: Users,
        label: 'Users',
        path: '/user-management',
        requiredPermission: 'users:view',
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        icon: Settings,
        label: 'Settings',
        path: '/settings',
        requiredPermission: null,
      },
    ],
  },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const {
    selectedBranch,
    setSelectedBranch,
    branches,
    setBranches,
  } = useAppStore()
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([])
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)
  const { member, hasPermission } = useAuth()

  const canViewAllBranches = hasPermission('branches:view-all')
  const canCreateBranch = hasPermission('branches:create')

  // Fetch branches if user has permission
  useEffect(() => {
    if (canViewAllBranches && branches.length === 0) {
      branchesService.getBranchesForSelector()
        .then((data) => {
          setBranches(data.filter(b => b.isActive))
        })
        .catch((err) => {
          console.error('Failed to fetch branches:', err)
        })
    }
  }, [canViewAllBranches, branches.length, setBranches])

  // Filter menu groups based on user permissions
  const filteredGroups = useMemo(() => {
    if (!member) return []

    return menuGroups
      .map((group) => ({
        ...group,
        items: group.items
          .filter((item) => {
            if (item.requiredPermission === null) return true
            return hasPermission(item.requiredPermission)
          })
          .map((item) => {
            if (item.hasDropdown && item.subItems) {
              return {
                ...item,
                subItems: item.subItems.filter(
                  (subItem) =>
                    !subItem.requiredPermission ||
                    hasPermission(subItem.requiredPermission)
                ),
              }
            }
            return item
          }),
      }))
      .filter((group) => group.items.length > 0)
  }, [member, hasPermission])

  const toggleDropdown = (itemPath: string) => {
    setOpenDropdowns((prev) =>
      prev.includes(itemPath)
        ? prev.filter((path) => path !== itemPath)
        : [...prev, itemPath]
    )
  }

  const isDropdownOpen = (itemPath: string) => openDropdowns.includes(itemPath)

  const isPathActive = (path: string) => {
    if (path.includes('?')) {
      const [pathname, queryString] = path.split('?')
      const urlParams = new URLSearchParams(queryString)
      const currentParams = new URLSearchParams(location.search)
      return (
        location.pathname === pathname &&
        Array.from(urlParams.entries()).every(
          ([key, value]) => currentParams.get(key) === value
        )
      )
    }
    return location.pathname === path
  }

  const isSubItemActive = (subItems?: SubMenuItem[]) => {
    return subItems?.some((subItem) => isPathActive(subItem.path))
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

  // Inline Branch Dropdown Component
  const BranchDropdown = () => {
    if (!canViewAllBranches) return null

    const handleSelectBranch = (branch: Branch | null) => {
      setSelectedBranch(branch)
      setBranchDropdownOpen(false)
    }

    return (
      <div className="relative">
        <button
          onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-200',
            'bg-slate-800/50 hover:bg-slate-700/50',
            'border border-slate-700/50 hover:border-slate-600'
          )}
        >
          {selectedBranch ? (
            <Building className="w-3 h-3 text-indigo-400" />
          ) : (
            <Globe className="w-3 h-3 text-emerald-400" />
          )}
          <span className="text-[11px] font-medium text-slate-300 max-w-[100px] truncate">
            {selectedBranch?.name || 'All Expressions'}
          </span>
          <ChevronDown
            className={cn(
              'w-3 h-3 text-slate-400 transition-transform duration-200',
              branchDropdownOpen && 'rotate-180'
            )}
          />
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {branchDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-1 z-50 min-w-[160px]"
            >
              <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
                {/* All Branches Option */}
                <button
                  onClick={() => handleSelectBranch(null)}
                  className={cn(
                    'w-full px-3 py-2 flex items-center gap-2 text-left transition-colors',
                    'hover:bg-slate-700/50',
                    !selectedBranch && 'bg-indigo-600/20'
                  )}
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] text-white flex-1">All Expressions</span>
                  {!selectedBranch && (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </button>

                {/* Divider */}
                {branches.length > 0 && (
                  <div className="h-px bg-slate-700 mx-2" />
                )}

                {/* Branch List */}
                <div className="max-h-48 overflow-y-auto">
                  {branches.map((branch) => (
                    <button
                      key={branch._id}
                      onClick={() => handleSelectBranch(branch)}
                      className={cn(
                        'w-full px-3 py-2 flex items-center gap-2 text-left transition-colors',
                        'hover:bg-slate-700/50',
                        selectedBranch?._id === branch._id && 'bg-indigo-600/20'
                      )}
                    >
                      <Building className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[11px] text-white flex-1 truncate">
                        {branch.name}
                      </span>
                      {selectedBranch?._id === branch._id && (
                        <Check className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                    </button>
                  ))}
                </div>

                {branches.length === 0 && (
                  <div className="px-3 py-2 text-[11px] text-slate-500 text-center">
                    No expressions available
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  const NavItem = ({
    item,
    onNavigate,
  }: {
    item: MenuItem
    onNavigate?: () => void
  }) => {
    const isActive = isPathActive(item.path)
    const hasSubItems = item.hasDropdown && item.subItems
    const isOpen = isDropdownOpen(item.path)
    const hasActiveSubItem = hasSubItems && isSubItemActive(item.subItems)

    return (
      <div>
        <div className="flex items-center">
          <Link
            to={item.path}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 flex-1 px-3 py-2 text-[13px] rounded-lg transition-all duration-200',
              'text-slate-400 hover:text-white hover:bg-slate-700/50',
              (isActive || hasActiveSubItem) &&
                'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-white border-l-2 border-indigo-500'
            )}
          >
            <item.icon
              className={cn(
                'w-4 h-4 flex-shrink-0',
                (isActive || hasActiveSubItem) && 'text-indigo-400'
              )}
            />
            <span className="font-medium truncate">{item.label}</span>
          </Link>
          {hasSubItems && (
            <button
              onClick={() => toggleDropdown(item.path)}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                'text-slate-500 hover:text-white hover:bg-slate-700/50'
              )}
            >
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </button>
          )}
        </div>

        {/* Sub Items */}
        <AnimatePresence>
          {hasSubItems && isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="ml-4 mt-1 pl-3 border-l border-slate-700 space-y-0.5">
                {item.subItems?.map((subItem) => {
                  const isSubActive = isPathActive(subItem.path)
                  return (
                    <Link
                      key={subItem.path}
                      to={subItem.path}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-2.5 px-2.5 py-1.5 text-[12px] rounded-md transition-all duration-200',
                        'text-slate-500 hover:text-white hover:bg-slate-700/30',
                        isSubActive &&
                          'text-indigo-300 bg-slate-700/40'
                      )}
                    >
                      <subItem.icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{subItem.label}</span>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Mobile Sidebar
  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-slate-800 text-white rounded-xl shadow-lg border border-slate-700"
        >
          <Menu className="h-5 w-5" />
        </button>

        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed left-0 top-0 h-full w-72 bg-slate-900 z-50 flex flex-col shadow-2xl"
              >
                {/* Mobile Header */}
                <div className="border-b border-slate-800 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">P</span>
                      </div>
                      <span className="font-semibold text-white text-sm">
                        PowerPoint Tribe
                      </span>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  {/* Branch Dropdown & Add Button */}
                  <div className="flex items-center gap-2 mt-3">
                    <BranchDropdown />
                    {canCreateBranch && (
                      <button
                        onClick={() => {
                          navigate('/branches/new')
                          setMobileMenuOpen(false)
                        }}
                        className="p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 transition-colors"
                        title="Add Branch"
                      >
                        <Plus className="w-3.5 h-3.5 text-white" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-4">
                  {filteredGroups.map((group) => (
                    <div key={group.label}>
                      <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        {group.label}
                      </div>
                      <div className="space-y-0.5">
                        {group.items.map((item) => (
                          <NavItem
                            key={item.path}
                            item={item}
                            onNavigate={() => setMobileMenuOpen(false)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>

                {/* Mobile Footer */}
                <div className="p-4 border-t border-slate-800">
                  <p className="text-[10px] text-slate-600 text-center">
                    Church Management System
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    )
  }

  // Desktop Sidebar
  return (
    <div
      className={cn(
        'hidden md:flex fixed left-0 top-0 h-full w-[240px] bg-slate-900 z-40 flex-col',
        'border-r border-slate-800'
      )}
    >
      {/* Header */}
      <div className="border-b border-slate-800 p-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-semibold text-white text-sm">
            PowerPoint Tribe
          </span>
        </div>
        {/* Branch Dropdown & Add Button */}
        <div className="flex items-center gap-2 mt-3">
          <BranchDropdown />
          {canCreateBranch && (
            <button
              onClick={() => navigate('/branches/new')}
              className="p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 transition-colors"
              title="Add Branch"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {filteredGroups.map((group) => (
          <div key={group.label}>
            <div className="px-3 py-1 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <div key={item.path} className="relative group">
                  <NavItem item={item} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800">
        <p className="text-[10px] text-slate-600 text-center">
          v1.0.0 &middot; CMS
        </p>
      </div>
    </div>
  )
}
