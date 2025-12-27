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
  User,
  Filter,
  Building2,
  X
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { membersService } from '@/services/members-unified'
import { branchesService } from '@/services/branches'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { useAuth } from '@/contexts/AuthContext-unified'
import type { Branch } from '@/types/branch'

export default function MemberAnalytics() {
  const { selectedBranch } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [tempBranchFilter, setTempBranchFilter] = useState('')
  const [tempDateFrom, setTempDateFrom] = useState('')
  const [tempDateTo, setTempDateTo] = useState('')

  useEffect(() => {
    loadBranches()
  }, [])

  useEffect(() => {
    loadStats()
  }, [selectedBranch, selectedBranchFilter, dateFromFilter, dateToFilter])

  const loadBranches = async () => {
    try {
      const response = await branchesService.getBranches({ limit: 100 })
      setBranches(response.items || [])
    } catch (error) {
      console.error('Error loading branches:', error)
    }
  }

  const loadStats = async () => {
    try {
      setLoading(true)
      const effectiveBranchId = selectedBranch?._id || selectedBranchFilter || undefined
      const memberStats = await membersService.getMemberStats(
        effectiveBranchId,
        dateFromFilter || undefined,
        dateToFilter || undefined
      )
      setStats(memberStats)
    } catch (error) {
      console.error('Error loading member stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilter = () => {
    setSelectedBranchFilter(tempBranchFilter)
    setDateFromFilter(tempDateFrom)
    setDateToFilter(tempDateTo)
    setShowFilterModal(false)
  }

  const handleClearFilter = () => {
    setSelectedBranchFilter('')
    setDateFromFilter('')
    setDateToFilter('')
    setTempBranchFilter('')
    setTempDateFrom('')
    setTempDateTo('')
    setShowFilterModal(false)
  }

  const activeFilterCount = [selectedBranchFilter, dateFromFilter, dateToFilter].filter(Boolean).length
  const hasActiveFilter = activeFilterCount > 0

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

  const getSelectedBranchName = () => {
    if (selectedBranch) return selectedBranch.name
    if (selectedBranchFilter) {
      const branch = branches.find(b => b._id === selectedBranchFilter)
      return branch?.name || 'Selected Branch'
    }
    return null
  }

  const formatDateRange = () => {
    if (dateFromFilter && dateToFilter) {
      return `${new Date(dateFromFilter).toLocaleDateString()} - ${new Date(dateToFilter).toLocaleDateString()}`
    }
    if (dateFromFilter) return `From ${new Date(dateFromFilter).toLocaleDateString()}`
    if (dateToFilter) return `Until ${new Date(dateToFilter).toLocaleDateString()}`
    return null
  }

  return (
    <Layout title="Member Analytics" subtitle="View member statistics and insights">
      <div className="space-y-6">
        {/* Filter Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {getSelectedBranchName() && (
              <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 border-primary-200">
                <Building2 className="h-3 w-3 text-primary-600" />
                <span className="text-primary-700">{getSelectedBranchName()}</span>
              </Badge>
            )}
            {formatDateRange() && (
              <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border-blue-200">
                <Calendar className="h-3 w-3 text-blue-600" />
                <span className="text-blue-700">{formatDateRange()}</span>
              </Badge>
            )}
            {hasActiveFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilter}
                className="text-gray-500 hover:text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTempBranchFilter(selectedBranchFilter)
              setTempDateFrom(dateFromFilter)
              setTempDateTo(dateToFilter)
              setShowFilterModal(true)
            }}
            className={hasActiveFilter ? 'border-primary-500 text-primary-600 bg-primary-50' : ''}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
            {hasActiveFilter && (
              <span className="ml-1.5 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

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

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFilterModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Filter className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Filter Analytics</h3>
                      <p className="text-primary-100 text-sm">Refine your analytics view</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Branch Filter */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Building2 className="h-4 w-4 text-primary-600" />
                    Campus
                  </label>
                  <select
                    value={tempBranchFilter}
                    onChange={(e) => setTempBranchFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  >
                    <option value="">All Campuses</option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Date Joined Range
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">From</label>
                      <input
                        type="date"
                        value={tempDateFrom}
                        onChange={(e) => setTempDateFrom(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">To</label>
                      <input
                        type="date"
                        value={tempDateTo}
                        onChange={(e) => setTempDateTo(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Filter members by the date they joined the church</p>
                </div>

                {/* Quick Date Presets */}
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">Quick Select</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Last 30 days', days: 30 },
                      { label: 'Last 90 days', days: 90 },
                      { label: 'Last 6 months', days: 180 },
                      { label: 'Last year', days: 365 },
                    ].map((preset) => (
                      <button
                        key={preset.days}
                        onClick={() => {
                          const to = new Date()
                          const from = new Date()
                          from.setDate(from.getDate() - preset.days)
                          setTempDateFrom(from.toISOString().split('T')[0])
                          setTempDateTo(to.toISOString().split('T')[0])
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={handleClearFilter}
                  className="text-gray-600 hover:text-red-600"
                >
                  <X className="h-4 w-4 mr-1.5" />
                  Clear All
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilterModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleApplyFilter}>
                    <Filter className="h-4 w-4 mr-1.5" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </Layout>
  )
}
