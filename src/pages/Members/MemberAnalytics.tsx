import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  TrendingUp,
  UserCheck,
  UserX,
  Plus,
  Calendar,
  MapPin,
  Heart,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { membersService } from '@/services/members-unified'
import { SkeletonTable } from '@/components/ui/Skeleton'

export default function MemberAnalytics() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const memberStats = await membersService.getMemberStats()
      setStats(memberStats)
    } catch (error) {
      console.error('Error loading member stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const membershipStats = [
    {
      title: 'Total Members',
      value: stats?.totalMembers || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Active Members',
      value: stats?.activeMembers || 0,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: '+8%',
      trendUp: true
    },
    {
      title: 'New This Month',
      value: stats?.newThisMonth || 0,
      icon: Plus,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: '+15%',
      trendUp: true
    },
    {
      title: 'Inactive',
      value: stats?.inactiveMembers || 0,
      icon: UserX,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: '-3%',
      trendUp: false
    }
  ]

  if (loading) {
    return (
      <Layout title="Member Analytics" subtitle="View member statistics and insights">
        <SkeletonTable />
      </Layout>
    )
  }

  return (
    <Layout title="Member Analytics" subtitle="View member statistics and insights">
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {membershipStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <Badge
                    variant={stat.trendUp ? 'success' : 'destructive'}
                    className="text-xs flex items-center gap-1"
                  >
                    {stat.trendUp ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                    {stat.trend}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                  <p className="text-3xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Growth Chart Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Membership Growth</h3>
                <p className="text-sm text-muted-foreground">Monthly member registrations over time</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">Last 6 Months</Badge>
              </div>
            </div>
            <div className="h-80 flex items-center justify-center bg-muted/20 rounded-lg">
              <p className="text-muted-foreground">Chart visualization coming soon</p>
            </div>
          </Card>
        </motion.div>

        {/* Additional Analytics Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Members by District */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-foreground">Members by District</h3>
              </div>
              <div className="space-y-4">
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <p className="text-muted-foreground">District breakdown coming soon</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Members by Ministry */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Heart className="h-5 w-5 text-red-600" />
                <h3 className="text-lg font-semibold text-foreground">Members by Ministry</h3>
              </div>
              <div className="space-y-4">
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <p className="text-muted-foreground">Ministry breakdown coming soon</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Age Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-foreground">Age Distribution</h3>
              </div>
              <div className="space-y-4">
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <p className="text-muted-foreground">Age distribution coming soon</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Membership Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-foreground">Membership Status</h3>
              </div>
              <div className="space-y-4">
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <p className="text-muted-foreground">Status breakdown coming soon</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}
