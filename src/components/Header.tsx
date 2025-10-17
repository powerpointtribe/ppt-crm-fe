import { motion } from 'framer-motion'
import { Bell, Search, User, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext-unified'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  title: string
  actions?: React.ReactNode
}

export default function Header({ title, actions }: HeaderProps) {
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
      className="bg-background/95 backdrop-blur-sm border-b border-border p-4 md:p-6 flex items-center justify-between sticky top-0 z-30"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">{title}</h1>
          {member && (
            <p className="text-sm text-muted-foreground hidden sm:block">
              Welcome back, {member.firstName}!
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        {actions && (
          <div className="hidden sm:block">
            {actions}
          </div>
        )}

        <div className="flex items-center space-x-1 md:space-x-2">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
            <Search className="h-4 w-4 md:h-5 md:w-5" />
          </button>

          <button className="p-2 hover:bg-muted rounded-lg transition-colors relative text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4 md:h-5 md:w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
          </button>

          <div className="flex items-center space-x-1 md:space-x-2 ml-2 pl-2 border-l border-border">
            {member && (
              <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-muted/50 rounded-lg">
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
              className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              title={member ? `${member.firstName} ${member.lastName}` : 'Member Profile'}
            >
              <User className="h-4 w-4" />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4 md:h-5 md:w-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  )
}