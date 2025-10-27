import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus, Search, Phone, Mail, Calendar, User,
  MoreHorizontal, Eye, Edit, Trash2, UserPlus,
  Users, Clock, CheckCircle, TrendingUp
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { FirstTimer, FirstTimerSearchParams, firstTimersService } from '@/services/first-timers'
import { formatDate } from '@/utils/formatters'

export default function FirstTimers() {
  const navigate = useNavigate()
  const [firstTimers, setFirstTimers] = useState<FirstTimer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)

  const loadFirstTimers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params: FirstTimerSearchParams = {
        page: 1,
        limit: 50,
        search: searchQuery,
        status: statusFilter || undefined
      }
      const response = await firstTimersService.getFirstTimers(params)
      setFirstTimers(response.items || [])
    } catch (error: any) {
      console.error('Error loading first timers:', error)
      setError({
        status: error.code || 500,
        message: 'Failed to load first timers',
        details: error.message
      })
    } finally {
      setLoading(false)
    }
  }, [searchQuery, statusFilter])

  useEffect(() => {
    loadFirstTimers()
  }, [loadFirstTimers])

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const statsData = await firstTimersService.getFirstTimerStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error loading first timer stats:', error)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this visitor?')) return

    try {
      await firstTimersService.deleteFirstTimer(id)
      setFirstTimers(prev => prev.filter(visitor => visitor._id !== id))
      setActionMenuOpen(null)
    } catch (error) {
      console.error('Error deleting visitor:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_contacted': return 'bg-red-100 text-red-800'
      case 'contacted': return 'bg-blue-100 text-blue-800'
      case 'visited': return 'bg-green-100 text-green-800'
      case 'converted': return 'bg-purple-100 text-purple-800'
      case 'lost_contact': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_contacted': return 'Not Contacted'
      case 'contacted': return 'Contacted'
      case 'visited': return 'Visited'
      case 'converted': return 'Converted'
      case 'lost_contact': return 'Lost Contact'
      default: return status
    }
  }

  if (loading && firstTimers.length === 0) {
    return (
      <Layout title="First Timers">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="First Timers">
        <ErrorBoundary
          error={error}
          onRetry={loadFirstTimers}
          showLogout={error.status === 401}
        />
      </Layout>
    )
  }

  return (
    <Layout
      title="First Timers"
      headerActions={
        <Button onClick={() => navigate('/first-timers/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Visitor
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Overview Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Visitors</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Need Follow-up</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.needingFollowUp || 0}</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Converted</p>
                  <p className="text-2xl font-bold text-green-600">{stats.converted || 0}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.thisMonth || 0}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search visitors..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={handleStatusFilter}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">All Status</option>
            <option value="not_contacted">Not Contacted</option>
            <option value="contacted">Contacted</option>
            <option value="visited">Visited</option>
            <option value="converted">Converted</option>
            <option value="lost_contact">Lost Contact</option>
          </select>
        </div>

        {/* Visitors Table */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : firstTimers.length === 0 ? (
          <div className="text-center py-16">
            <UserPlus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No visitors found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || statusFilter ? 'Try adjusting your search or filters' : 'Add your first visitor to get started'}
            </p>
            <Button onClick={() => navigate('/first-timers/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Visitor
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Visitor</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Contact</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Visit Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Assigned To</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {firstTimers.map((visitor, index) => (
                    <motion.tr
                      key={visitor._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                            {visitor.firstName.charAt(0)}{visitor.lastName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {visitor.firstName} {visitor.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {visitor.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-3 w-3 mr-1" />
                              {visitor.phone}
                            </div>
                          )}
                          {visitor.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-3 w-3 mr-1" />
                              {visitor.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(visitor.dateOfVisit)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(visitor.status)}`}>
                          {getStatusLabel(visitor.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {visitor.assignedTo ? (
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="h-3 w-3 mr-1" />
                            <span>
                              {typeof visitor.assignedTo === 'object'
                                ? `${visitor.assignedTo?.firstName} ${visitor.assignedTo?.lastName}`
                                : visitor.assignedTo
                              }
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center">
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActionMenuOpen(actionMenuOpen === visitor._id ? null : visitor._id)}
                              className="p-1"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>

                            {actionMenuOpen === visitor._id && (
                              <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border z-10">
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      navigate(`/first-timers/${visitor._id}`)
                                      setActionMenuOpen(null)
                                    }}
                                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Eye className="h-3 w-3 mr-2" />
                                    View
                                  </button>
                                  <button
                                    onClick={() => {
                                      navigate(`/first-timers/${visitor._id}/edit`)
                                      setActionMenuOpen(null)
                                    }}
                                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Edit className="h-3 w-3 mr-2" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(visitor._id)}
                                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3 w-3 mr-2" />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}