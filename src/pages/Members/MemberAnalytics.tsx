import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  TrendingUp,
  UserCheck,
  UserX,
  Calendar,
  MapPin,
  Heart,
  User
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

  // Calculate active members (those with 'active' status)
  const activeMembers = stats?.byStatus?.find((s: any) => s._id === 'active')?.count || 0

  // Calculate inactive/other members
  const inactiveMembers = stats ? (stats.total - activeMembers) : 0

  // Calculate unit assignment rate
  const unitAssignmentRate = stats?.unitAssignmentRate || 0

  const membershipStats = [
    {
      title: 'Total Members',
      value: stats?.total || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'All active members'
    },
    {
      title: 'Active Members',
      value: activeMembers,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Members with active status'
    },
    {
      title: 'Unit Assignment',
      value: `${unitAssignmentRate}%`,
      icon: MapPin,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Members assigned to units'
    },
    {
      title: 'Unassigned',
      value: stats?.membersWithoutUnits || 0,
      icon: UserX,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Members without units'
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {membershipStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </div>
                <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Gender Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Gender Distribution</h3>
                <p className="text-sm text-muted-foreground">Member breakdown by gender</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {stats?.byGender?.map((item: any, index: number) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 capitalize">{item._id || 'Unknown'}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{item.count.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {stats?.total > 0 ? Math.round((item.count / stats.total) * 100) : 0}% of total
                      </p>
                    </div>
                    <div className={`w-12 h-12 ${item._id === 'male' ? 'bg-blue-100' : 'bg-pink-100'} rounded-lg flex items-center justify-center`}>
                      <User className={`h-6 w-6 ${item._id === 'male' ? 'text-blue-600' : 'text-pink-600'}`} />
                    </div>
                  </div>
                </div>
              ))}
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
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {stats?.byDistrict && stats.byDistrict.length > 0 ? (
                  stats.byDistrict.slice(0, 10).map((item: any, index: number) => {
                    const percentage = stats?.total > 0 ? Math.round((item.count / stats.total) * 100) : 0
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item._id}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 min-w-[3rem] text-right">{percentage}%</span>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-lg font-bold text-gray-900">{item.count.toLocaleString()}</p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No district data available</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Leadership Roles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Users className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-foreground">Leadership Roles</h3>
              </div>
              <div className="space-y-3">
                {stats?.byLeadership && stats.byLeadership.length > 0 ? (
                  stats.byLeadership.map((item: any, index: number) => {
                    const colors = ['bg-purple-100 text-purple-600', 'bg-blue-100 text-blue-600', 'bg-green-100 text-green-600']
                    const colorClass = colors[index % colors.length]
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${colorClass.split(' ')[0]} rounded-lg flex items-center justify-center`}>
                            <Heart className={`h-5 w-5 ${colorClass.split(' ')[1]}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item._id}</p>
                            <p className="text-xs text-gray-500">{item.count} {item.count === 1 ? 'member' : 'members'}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="font-bold">{item.count}</Badge>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Heart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No leadership data available</p>
                  </div>
                )}
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
              <div className="space-y-3">
                {stats?.byAge && stats.byAge.length > 0 ? (
                  stats.byAge.map((item: any, index: number) => {
                    const ageLabel = item._id === 'Unknown' ? 'Unknown' :
                      item._id === 0 ? 'Under 18' :
                      item._id === 18 ? '18-29' :
                      item._id === 30 ? '30-44' :
                      item._id === 45 ? '45-59' :
                      item._id === 60 ? '60+' : `${item._id}+`
                    const percentage = stats?.total > 0 ? Math.round((item.count / stats.total) * 100) : 0
                    return (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-900">{ageLabel}</p>
                          <p className="text-lg font-bold text-gray-900">{item.count.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 min-w-[3rem] text-right">{percentage}%</span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No age data available</p>
                  </div>
                )}
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
              <div className="space-y-3">
                {stats?.byStatus && stats.byStatus.length > 0 ? (
                  stats.byStatus.map((item: any, index: number) => {
                    const statusColors: any = {
                      'active': 'bg-green-100 text-green-600',
                      'new': 'bg-blue-100 text-blue-600',
                      'inactive': 'bg-gray-100 text-gray-600',
                      'suspended': 'bg-red-100 text-red-600'
                    }
                    const colorClass = statusColors[item._id] || 'bg-gray-100 text-gray-600'
                    const percentage = stats?.total > 0 ? Math.round((item.count / stats.total) * 100) : 0
                    return (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={colorClass}>{item._id || 'Unknown'}</Badge>
                            <span className="text-xs text-gray-500">{percentage}%</span>
                          </div>
                          <p className="text-lg font-bold text-gray-900">{item.count.toLocaleString()}</p>
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No status data available</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}
