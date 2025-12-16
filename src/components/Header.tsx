import { motion } from 'framer-motion'
import { Bell, User, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext-unified'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  title: string
  subtitle?: string
  searchSection?: React.ReactNode
}

export default function Header({ title, subtitle, searchSection }: HeaderProps) {
  const { member, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Helper to get primary role for display
  const getPrimaryRole = () => {
    if (!member?.systemRoles?.length) return 'member'

    // Prioritize admin and pastor roles for display
    if (member.systemRoles.includes('admin')) return 'admin'
    if (member.systemRoles.includes('pastor')) return 'pastor'

    // Show leadership roles
    if (member.leadershipRoles?.isDistrictPastor) return 'district pastor'
    if (member.leadershipRoles?.isUnitHead) return 'unit head'
    if (member.leadershipRoles?.isChamp) return 'champ'

    // Default to first system role
    return member.systemRoles[0]
  }

  return (
    <motion.header
      className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-30"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Top Row: Search/Filters on Left, Welcome/User Info on Right */}
      <div className="p-4 md:p-6 flex items-center justify-between gap-4">
        {/* Left: Search and Filters Section */}
        <div className="flex-1 max-w-4xl">
          {searchSection || <div className="h-10" />}
        </div>

        {/* Right: User Info and Actions */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors relative text-muted-foreground hover:text-foreground hidden md:block">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
          </button>

          <div className="flex items-center space-x-2 ml-2 pl-2 border-l border-border">
            {member && (
              <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-foreground">{member.firstName} {member.lastName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{getPrimaryRole()?.replace('_', ' ')}</p>
                </div>
              </div>
            )}

            <button
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
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

      {/* Bottom Row: Module Title and Welcome Text */}
      <div className="px-4 md:px-6 pb-4 pt-2">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">{title}</h1>
        {member && (
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {member.firstName}! {subtitle && `• ${subtitle}`}
          </p>
        )}
      </div>
    </motion.header>
  )
}