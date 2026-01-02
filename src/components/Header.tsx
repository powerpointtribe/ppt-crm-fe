import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Bell, User, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext-unified'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  title: string
  subtitle?: string
  /** @deprecated Use PageToolbar in content area instead for better layout control */
  searchSection?: ReactNode
  /** Optional actions to show next to the title */
  actions?: ReactNode
}

export default function Header({ title, subtitle, searchSection, actions }: HeaderProps) {
  const { member, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Helper to get primary role for display
  const getPrimaryRole = () => {
    // Check for new role-based system first
    if (member?.role && typeof member.role === 'object') {
      return member.role.displayName || member.role.name
    }

    // Check membership status for leadership levels
    if (member?.membershipStatus) {
      const status = member.membershipStatus
      if (status === 'SENIOR_PASTOR') return 'senior pastor'
      if (status === 'PASTOR') return 'pastor'
      if (status === 'DIRECTOR') return 'director'
      if (status === 'LXL') return 'lxl'
      if (status === 'DC') return 'dc'
    }

    if (!member?.systemRoles?.length) return 'member'

    // Prioritize admin and pastor roles for display
    if (member.systemRoles.includes('admin')) return 'admin'
    if (member.systemRoles.includes('pastor')) return 'pastor'

    // Default to first system role
    return member.systemRoles[0]
  }

  return (
    <motion.header
      className="bg-white dark:bg-slate-800 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-30 transition-colors duration-200"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="px-4 md:px-6 py-3">
        {/* Single Row Layout: Title on Left, User Info on Right */}
        <div className="flex items-center justify-between gap-4">
          {/* Left: Title, Subtitle, and optional inline actions */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">{title}</h1>
                {actions && <div className="hidden sm:flex items-center gap-2">{actions}</div>}
              </div>
              {(member || subtitle) && (
                <p className="text-sm text-gray-500 dark:text-slate-400 truncate">
                  {member ? `Welcome, ${member.firstName}` : ''}{member && subtitle ? ' • ' : ''}{subtitle || ''}
                </p>
              )}
            </div>
          </div>

          {/* Right: User Info and Actions */}
          <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors relative text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hidden md:block">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
            </button>

            <div className="flex items-center space-x-2 pl-2 border-l border-gray-200 dark:border-slate-700">
              {member && (
                <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900 dark:text-white">{member.firstName} {member.lastName}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 capitalize">{getPrimaryRole()?.replace('_', ' ')}</p>
                  </div>
                </div>
              )}

              <button
                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                title={member ? `${member.firstName} ${member.lastName}` : 'Member Profile'}
              >
                <User className="h-5 w-5" />
              </button>

              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Legacy Search Section - Use PageToolbar instead for new implementations */}
      {searchSection && (
        <div className="px-4 md:px-6 pb-4 pt-0">
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3">
            {searchSection}
          </div>
        </div>
      )}
    </motion.header>
  )
}