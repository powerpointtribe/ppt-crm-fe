import { ReactNode, useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, User, LogOut, X, Users, Cake, UserPlus, Shield, UserCheck, Check } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext-unified'
import { useNavigate } from 'react-router-dom'
import { notificationsService, NotificationItem } from '@/services/notifications'

interface HeaderProps {
  title: string
  subtitle?: string
  /** @deprecated Use PageToolbar in content area instead for better layout control */
  searchSection?: ReactNode
  /** Optional actions to show next to the title */
  actions?: ReactNode
}

const getNotificationIcon = (type: NotificationItem['type']) => {
  switch (type) {
    case 'assigned_first_timer':
      return <UserPlus className="h-4 w-4 text-blue-500" />
    case 'birthday_upcoming':
      return <Cake className="h-4 w-4 text-pink-500" />
    case 'ready_for_integration':
      return <Check className="h-4 w-4 text-green-500" />
    case 'membership_status_change':
      return <Shield className="h-4 w-4 text-purple-500" />
    case 'group_addition':
      return <Users className="h-4 w-4 text-indigo-500" />
    case 'member_joined_your_group':
      return <UserCheck className="h-4 w-4 text-teal-500" />
    default:
      return <Bell className="h-4 w-4 text-gray-500" />
  }
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export default function Header({ title, subtitle, searchSection, actions }: HeaderProps) {
  const { member, logout } = useAuth()
  const navigate = useNavigate()
  const [notificationCount, setNotificationCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotificationCount = async () => {
    try {
      const response = await notificationsService.getNotificationCount()
      if (response.success) {
        setNotificationCount(response.data.count)
      }
    } catch (error) {
      console.error('Failed to fetch notification count:', error)
    }
  }

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const response = await notificationsService.getMyNotifications()
      if (response.success) {
        setNotifications(response.data.items)
        setNotificationCount(response.data.totalCount)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (member) {
      fetchNotificationCount()
      // Refresh count every 5 minutes
      const interval = setInterval(fetchNotificationCount, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [member])

  const handleBellClick = () => {
    if (!isDropdownOpen) {
      fetchNotifications()
    }
    setIsDropdownOpen(!isDropdownOpen)
  }

  const handleDismissNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await notificationsService.dismissNotification(notificationId)
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      setNotificationCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to dismiss notification:', error)
    }
  }

  const handleDismissAll = async () => {
    try {
      await notificationsService.dismissAllNotifications()
      setNotifications([])
      setNotificationCount(0)
      setIsDropdownOpen(false)
    } catch (error) {
      console.error('Failed to dismiss all notifications:', error)
    }
  }

  const getNotificationRoute = (notification: NotificationItem): string | null => {
    switch (notification.type) {
      case 'assigned_first_timer':
        return notification.data?.firstTimerId ? `/first-timers/${notification.data.firstTimerId}` : '/first-timers'
      case 'birthday_upcoming':
        return notification.data?.memberId ? `/members/${notification.data.memberId}` : '/members'
      case 'ready_for_integration':
        return notification.data?.firstTimerId ? `/first-timers/${notification.data.firstTimerId}` : '/first-timers?tab=ready-for-integration'
      case 'membership_status_change':
        return '/profile'
      case 'group_addition':
        // Navigate to the group the user was added to
        if (notification.data?.toDistrict) return `/groups/${notification.data.toDistrict}`
        if (notification.data?.toUnit) return `/groups/${notification.data.toUnit}`
        if (notification.data?.toMinistries?.[0]) return `/groups/${notification.data.toMinistries[0]}`
        return '/groups'
      case 'member_joined_your_group':
        // Navigate to the group detail page
        return notification.data?.groupId ? `/groups/${notification.data.groupId}` : '/groups'
      default:
        return null
    }
  }

  const handleNotificationClick = async (notification: NotificationItem) => {
    const route = getNotificationRoute(notification)

    // Dismiss the notification
    try {
      await notificationsService.dismissNotification(notification.id)
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
      setNotificationCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to dismiss notification:', error)
    }

    // Close dropdown and navigate
    setIsDropdownOpen(false)
    if (route) {
      navigate(route)
    }
  }

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
      className="bg-white backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30"
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
                <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">{title}</h1>
                {actions && <div className="hidden sm:flex items-center gap-2">{actions}</div>}
              </div>
              {(member || subtitle) && (
                <p className="text-sm text-gray-500 truncate">
                  {member ? `Welcome, ${member.firstName}` : ''}{member && subtitle ? ' • ' : ''}{subtitle || ''}
                </p>
              )}
            </div>
          </div>

          {/* Right: User Info and Actions */}
          <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
            {/* Notification Bell with Dropdown */}
            <div className="relative hidden md:block" ref={dropdownRef}>
              <button
                onClick={handleBellClick}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative text-gray-500 hover:text-gray-900"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center px-1">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
                  >
                    {/* Header - only show if there are notifications */}
                    {notifications.length > 0 && (
                      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-end bg-gray-50">
                        <button
                          onClick={handleDismissAll}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Clear all
                        </button>
                      </div>
                    )}

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                      {isLoading ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                          Loading...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p>No notifications</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-b-0 cursor-pointer group"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {notification.description}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatTimeAgo(notification.createdAt)}
                                </p>
                              </div>
                              <button
                                onClick={(e) => handleDismissNotification(notification.id, e)}
                                className="flex-shrink-0 p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Dismiss without viewing"
                              >
                                <X className="h-4 w-4 text-gray-400" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
              {member && (
                <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{member.firstName} {member.lastName}</p>
                    <p className="text-xs text-gray-500 capitalize">{getPrimaryRole()?.replace('_', ' ')}</p>
                  </div>
                </div>
              )}

              <button
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-900"
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
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            {searchSection}
          </div>
        </div>
      )}
    </motion.header>
  )
}