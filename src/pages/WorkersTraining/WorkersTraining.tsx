import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  Users,
  Plus,
  BookOpen,
  Award,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Download
} from 'lucide-react'

import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { workersTrainingService } from '@/services/workers-training'
import {
  Cohort,
  WorkerTrainee,
  CohortStatisticsResponse,
  TraineeStatisticsResponse,
  CohortStatus,
  CohortType
} from '@/types/workers-training'

export default function WorkersTraining() {
  const navigate = useNavigate()
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [recentTrainees, setRecentTrainees] = useState<WorkerTrainee[]>([])
  const [cohortStats, setCohortStats] = useState<CohortStatisticsResponse | null>(null)
  const [traineeStats, setTraineeStats] = useState<TraineeStatisticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<CohortStatus | ''>('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [cohortsRes, traineesRes, cohortStatsRes, traineeStatsRes] = await Promise.all([
        workersTrainingService.getCohorts({ limit: 10 }),
        workersTrainingService.getTrainees({ limit: 10 }),
        workersTrainingService.getCohortStatistics(),
        workersTrainingService.getTraineeStatistics(),
      ])

      setCohorts(cohortsRes.cohorts || [])
      setRecentTrainees(traineesRes.trainees || [])
      setCohortStats(cohortStatsRes)
      setTraineeStats(traineeStatsRes)
    } catch (error) {
      console.error('Error fetching workers training data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCohorts = cohorts.filter(cohort => {
    const matchesSearch = !searchQuery ||
      cohort.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cohort.code.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = !statusFilter || cohort.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: CohortStatus) => {
    const colors = {
      [CohortStatus.PLANNING]: 'bg-gray-100 text-gray-800',
      [CohortStatus.REGISTRATION_OPEN]: 'bg-green-100 text-green-800',
      [CohortStatus.REGISTRATION_CLOSED]: 'bg-yellow-100 text-yellow-800',
      [CohortStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
      [CohortStatus.COMPLETED]: 'bg-purple-100 text-purple-800',
      [CohortStatus.CANCELLED]: 'bg-red-100 text-red-800',
      [CohortStatus.POSTPONED]: 'bg-orange-100 text-orange-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-start"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              Workers Training
            </h1>
            <p className="text-gray-600 mt-1">
              Manage cohorts, track progress, and develop future leaders
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate('/workers-training/trainees')}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              View All Trainees
            </Button>
            <Button
              onClick={() => navigate('/workers-training/cohorts/new')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Cohort
            </Button>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cohorts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {cohortStats?.summary.totalCohorts || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Trainees</p>
                <p className="text-2xl font-bold text-gray-900">
                  {cohortStats?.summary.totalParticipants || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {traineeStats?.performanceStats.averageAttendance.toFixed(1) || '0.0'}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {traineeStats?.performanceStats.averageGrade.toFixed(1) || '0.0'}%
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/workers-training/cohorts')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Cohorts</h3>
                <p className="text-sm text-gray-600">Create and manage training programs</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/workers-training/trainees')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Track Trainees</h3>
                <p className="text-sm text-gray-600">Monitor progress and assign units</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/workers-training/reports')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">View Reports</h3>
                <p className="text-sm text-gray-600">Analyze training effectiveness</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Recent Cohorts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Cohorts</h2>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search cohorts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as CohortStatus | '')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  {Object.values(CohortStatus).map(status => (
                    <option key={status} value={status}>
                      {workersTrainingService.getCohortStatusDisplayName(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Cohort</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Participants</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Start Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCohorts.map((cohort) => (
                    <tr key={cohort._id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{cohort.name}</p>
                          <p className="text-sm text-gray-500">{cohort.code}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">
                          {workersTrainingService.getCohortTypeDisplayName(cohort.type)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(cohort.status)}`}>
                          {workersTrainingService.getCohortStatusDisplayName(cohort.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-900">
                          {cohort.currentParticipants} / {cohort.maxParticipants || '∞'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">
                          {new Date(cohort.startDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/workers-training/cohorts/${cohort._id}`)}
                          >
                            View
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/workers-training/cohorts/${cohort._id}/trainees`)}
                          >
                            Trainees
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredCohorts.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No cohorts found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery || statusFilter
                      ? 'Try adjusting your filters to see more results.'
                      : 'Get started by creating your first training cohort.'
                    }
                  </p>
                  <Button onClick={() => navigate('/workers-training/cohorts/new')}>
                    Create New Cohort
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </Layout>
  )
}