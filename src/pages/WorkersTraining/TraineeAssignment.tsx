import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Users,
  Building,
  Award,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  MapPin,
  User,
  Calendar,
  Target
} from 'lucide-react'

import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { workersTrainingService } from '@/services/workers-training'
import { groupsService } from '@/services/groups'
import {
  WorkerTrainee,
  WorkersTrainingStatus,
  TrainingOutcome
} from '@/types/workers-training'
import { Group } from '@/types'

interface AssignmentDialogProps {
  trainee: WorkerTrainee | null
  isOpen: boolean
  onClose: () => void
  onAssign: (unitId: string, outcome: TrainingOutcome) => Promise<void>
  availableUnits: Group[]
}

const AssignmentDialog: React.FC<AssignmentDialogProps> = ({
  trainee,
  isOpen,
  onClose,
  onAssign,
  availableUnits
}) => {
  const [selectedUnit, setSelectedUnit] = useState<string>('')
  const [selectedOutcome, setSelectedOutcome] = useState<TrainingOutcome>(TrainingOutcome.ASSIGNED_TO_UNIT)
  const [loading, setLoading] = useState(false)

  const handleAssign = async () => {
    if (!selectedUnit || !trainee) return

    try {
      setLoading(true)
      await onAssign(selectedUnit, selectedOutcome)
      onClose()
      setSelectedUnit('')
    } catch (error) {
      console.error('Assignment failed:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !trainee) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Assign Trainee to Unit
          </h2>
          <p className="text-gray-600 mt-1">
            Assign {trainee.member} to a unit for their internship
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Outcome Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Training Outcome *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: TrainingOutcome.ASSIGNED_TO_UNIT, label: 'Assigned to Unit', icon: Building },
                { value: TrainingOutcome.ASSIGNED_TO_MINISTRY, label: 'Assigned to Ministry', icon: Users },
                { value: TrainingOutcome.GRADUATED, label: 'Graduated', icon: Award },
                { value: TrainingOutcome.PROMOTED_TO_LEADERSHIP, label: 'Promoted to Leadership', icon: Target }
              ].map((outcome) => (
                <label
                  key={outcome.value}
                  className={`cursor-pointer p-3 border-2 rounded-lg transition-all ${
                    selectedOutcome === outcome.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="outcome"
                    value={outcome.value}
                    checked={selectedOutcome === outcome.value}
                    onChange={(e) => setSelectedOutcome(e.target.value as TrainingOutcome)}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-2">
                    <outcome.icon className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">{outcome.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Unit Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Unit *
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableUnits.map((unit) => (
                <label
                  key={unit._id}
                  className={`cursor-pointer block p-4 border rounded-lg transition-all ${
                    selectedUnit === unit._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="unit"
                    value={unit._id}
                    checked={selectedUnit === unit._id}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900">{unit.name}</span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          {unit.type}
                        </span>
                      </div>
                      {unit.description && (
                        <p className="text-sm text-gray-600 mt-1 ml-6">{unit.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 ml-6 text-xs text-gray-500">
                        {unit.leader && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>Leader: {unit.leader}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{unit.memberCount || 0} members</span>
                        </div>
                      </div>
                    </div>
                    {selectedUnit === unit._id && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedUnit || loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Award className="w-4 h-4" />
            )}
            Assign to Unit
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default function TraineeAssignment() {
  const { cohortId } = useParams<{ cohortId: string }>()
  const navigate = useNavigate()
  const [trainees, setTrainees] = useState<WorkerTrainee[]>([])
  const [availableUnits, setAvailableUnits] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<WorkersTrainingStatus | ''>('')
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false)
  const [selectedTrainee, setSelectedTrainee] = useState<WorkerTrainee | null>(null)

  useEffect(() => {
    fetchData()
  }, [cohortId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [traineesRes, unitsRes] = await Promise.all([
        cohortId
          ? workersTrainingService.getTraineesByCohort(cohortId)
          : workersTrainingService.getTrainees({ limit: 100 }),
        groupsService.getGroups({ type: 'UNIT', limit: 100 })
      ])

      setTrainees(traineesRes.trainees || [])
      setAvailableUnits(unitsRes.groups || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignTrainee = (trainee: WorkerTrainee) => {
    setSelectedTrainee(trainee)
    setShowAssignmentDialog(true)
  }

  const handleAssignment = async (unitId: string, outcome: TrainingOutcome) => {
    if (!selectedTrainee) return

    try {
      await workersTrainingService.assignToUnit(selectedTrainee._id, unitId, outcome)
      fetchData() // Refresh the list
    } catch (error) {
      console.error('Error assigning trainee:', error)
      throw error
    }
  }

  const filteredTrainees = trainees.filter(trainee => {
    const matchesSearch = !searchQuery ||
      (trainee.member && trainee.member.toString().toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = !statusFilter || trainee.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const completedTrainees = filteredTrainees.filter(t =>
    t.status === WorkersTrainingStatus.COMPLETED
  )
  const unassignedTrainees = completedTrainees.filter(t => !t.assignedUnit)
  const assignedTrainees = completedTrainees.filter(t => t.assignedUnit)

  const getStatusColor = (status: WorkersTrainingStatus) => {
    const colors = {
      [WorkersTrainingStatus.REGISTERED]: 'bg-blue-100 text-blue-800',
      [WorkersTrainingStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
      [WorkersTrainingStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [WorkersTrainingStatus.DROPPED_OUT]: 'bg-red-100 text-red-800',
      [WorkersTrainingStatus.DEFERRED]: 'bg-purple-100 text-purple-800',
      [WorkersTrainingStatus.SUSPENDED]: 'bg-orange-100 text-orange-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getOutcomeColor = (outcome: TrainingOutcome) => {
    const colors = {
      [TrainingOutcome.GRADUATED]: 'bg-green-100 text-green-800',
      [TrainingOutcome.ASSIGNED_TO_UNIT]: 'bg-blue-100 text-blue-800',
      [TrainingOutcome.ASSIGNED_TO_MINISTRY]: 'bg-purple-100 text-purple-800',
      [TrainingOutcome.PROMOTED_TO_LEADERSHIP]: 'bg-yellow-100 text-yellow-800',
    }
    return colors[outcome] || 'bg-gray-100 text-gray-800'
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
              <Award className="w-8 h-8 text-blue-600" />
              Trainee Assignment
            </h1>
            <p className="text-gray-600 mt-1">
              Assign completed trainees to units for their internships
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate(cohortId ? `/workers-training/cohorts/${cohortId}` : '/workers-training')}
          >
            Back to {cohortId ? 'Cohort' : 'Training'}
          </Button>
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedTrainees.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unassigned</p>
                <p className="text-2xl font-bold text-orange-600">{unassignedTrainees.length}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned</p>
                <p className="text-2xl font-bold text-blue-600">{assignedTrainees.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Units</p>
                <p className="text-2xl font-bold text-purple-600">{availableUnits.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search trainees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as WorkersTrainingStatus | '')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                {Object.values(WorkersTrainingStatus).map(status => (
                  <option key={status} value={status}>
                    {workersTrainingService.getTraineeStatusDisplayName(status)}
                  </option>
                ))}
              </select>
            </div>
          </Card>
        </motion.div>

        {/* Trainees List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Completed Trainees
                </h2>
                <div className="text-sm text-gray-600">
                  {unassignedTrainees.length} pending assignment
                </div>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex space-x-4 p-4">
                      <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTrainees
                    .filter(t => t.status === WorkersTrainingStatus.COMPLETED)
                    .map((trainee) => (
                      <div
                        key={trainee._id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {trainee.member}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(trainee.status)}`}>
                                {workersTrainingService.getTraineeStatusDisplayName(trainee.status)}
                              </span>
                              {trainee.outcome && (
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getOutcomeColor(trainee.outcome)}`}>
                                  {workersTrainingService.getTrainingOutcomeDisplayName(trainee.outcome)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              {trainee.completionDate && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    Completed {new Date(trainee.completionDate).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              <div>
                                Attendance: {trainee.attendance.attendancePercentage.toFixed(1)}%
                              </div>
                              <div>
                                Grade: {trainee.academicPerformance.overallGrade.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {trainee.assignedUnit ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">Assigned</span>
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleAssignTrainee(trainee)}
                              className="flex items-center gap-2"
                              size="sm"
                            >
                              <ArrowRight className="w-4 h-4" />
                              Assign to Unit
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}

                  {filteredTrainees.filter(t => t.status === WorkersTrainingStatus.COMPLETED).length === 0 && (
                    <div className="text-center py-12">
                      <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No completed trainees</h3>
                      <p className="text-gray-600">
                        {searchQuery || statusFilter
                          ? 'Try adjusting your filters to see more results.'
                          : 'Trainees will appear here once they complete their training.'
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Assignment Dialog */}
        <AssignmentDialog
          trainee={selectedTrainee}
          isOpen={showAssignmentDialog}
          onClose={() => {
            setShowAssignmentDialog(false)
            setSelectedTrainee(null)
          }}
          onAssign={handleAssignment}
          availableUnits={availableUnits}
        />
      </div>
    </Layout>
  )
}