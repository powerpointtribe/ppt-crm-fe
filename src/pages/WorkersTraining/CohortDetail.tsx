import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  Edit,
  MapPin,
  Trash2,
  Users,
  UserCheck,
  Target,
  Award,
} from 'lucide-react'

import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { workersTrainingService } from '@/services/workers-training'
import { CohortStatus, WorkersTrainingStatus } from '@/types/workers-training'
import { showToast } from '@/utils/toast'

// Refs may come back populated (objects) or as bare ids depending on the endpoint
type Person = { _id: string; firstName?: string; lastName?: string; email?: string; phone?: string }
type Ref<T> = T | string | null | undefined

interface TraineeRow {
  _id: string
  member: Ref<Person>
  status: WorkersTrainingStatus
  enrollmentDate?: string
  attendance?: { attendancePercentage?: number }
  academicPerformance?: { overallGrade?: number }
  outcome?: string
}

const asObj = <T extends object>(v: Ref<T>): T | null => (v && typeof v === 'object' ? v : null)
const personName = (v: Ref<Person>) => {
  const p = asObj(v)
  return [p?.firstName, p?.lastName].filter(Boolean).join(' ') || p?.email || null
}
const fmtDate = (v?: string | Date) => (v ? new Date(v).toLocaleDateString() : '—')
const pct = (v?: number) => (v == null ? '—' : `${Math.round(v)}%`)

const statusColors: Record<CohortStatus, string> = {
  [CohortStatus.PLANNING]: 'bg-gray-100 text-gray-800',
  [CohortStatus.REGISTRATION_OPEN]: 'bg-green-100 text-green-800',
  [CohortStatus.REGISTRATION_CLOSED]: 'bg-yellow-100 text-yellow-800',
  [CohortStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [CohortStatus.COMPLETED]: 'bg-purple-100 text-purple-800',
  [CohortStatus.CANCELLED]: 'bg-red-100 text-red-800',
  [CohortStatus.POSTPONED]: 'bg-orange-100 text-orange-800',
}

const traineeStatusColors: Record<WorkersTrainingStatus, string> = {
  [WorkersTrainingStatus.REGISTERED]: 'bg-gray-100 text-gray-800',
  [WorkersTrainingStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [WorkersTrainingStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [WorkersTrainingStatus.DROPPED_OUT]: 'bg-red-100 text-red-800',
  [WorkersTrainingStatus.DEFERRED]: 'bg-yellow-100 text-yellow-800',
  [WorkersTrainingStatus.SUSPENDED]: 'bg-orange-100 text-orange-800',
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-sm text-gray-900 dark:text-white">{value || '—'}</p>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
    </Card>
  )
}

export default function CohortDetail() {
  const navigate = useNavigate()
  const { cohortId } = useParams<{ cohortId: string }>()

  const [cohort, setCohort] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusSaving, setStatusSaving] = useState(false)

  const [trainees, setTrainees] = useState<TraineeRow[]>([])
  const [traineesLoading, setTraineesLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [traineeTotal, setTraineeTotal] = useState(0)

  const loadCohort = useCallback(async () => {
    if (!cohortId) return
    try {
      setLoading(true)
      setError(null)
      const raw: any = await workersTrainingService.getCohort(cohortId)
      setCohort(raw?.cohort ?? raw?.data ?? raw)
    } catch (err: any) {
      console.error('Error loading cohort:', err)
      setError(
        err?.response?.status === 404
          ? 'This cohort no longer exists.'
          : err?.response?.data?.message || 'Failed to load cohort.'
      )
    } finally {
      setLoading(false)
    }
  }, [cohortId])

  useEffect(() => {
    loadCohort()
  }, [loadCohort])

  useEffect(() => {
    if (!cohortId) return
    let cancelled = false
    setTraineesLoading(true)
    workersTrainingService
      .getTraineesByCohort(cohortId, { page, limit: 20 })
      .then((res: any) => {
        if (cancelled) return
        setTrainees(res?.trainees || [])
        setPages(res?.pagination?.pages || 1)
        setTraineeTotal(res?.pagination?.total ?? (res?.trainees?.length || 0))
      })
      .catch(err => {
        if (!cancelled) {
          console.error('Error loading cohort trainees:', err)
          setTrainees([])
        }
      })
      .finally(() => {
        if (!cancelled) setTraineesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [cohortId, page])

  const handleStatusChange = async (status: CohortStatus) => {
    if (!cohortId || status === cohort?.status) return
    try {
      setStatusSaving(true)
      await workersTrainingService.updateCohortStatus(cohortId, status)
      setCohort((prev: any) => ({ ...prev, status }))
      showToast.success(`Status set to ${workersTrainingService.getCohortStatusDisplayName(status)}`)
    } catch (err: any) {
      console.error('Error updating cohort status:', err)
      showToast.error(err?.response?.data?.message || 'Failed to update status.')
    } finally {
      setStatusSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!cohortId) return
    if (!confirm('Are you sure you want to delete this cohort? This action cannot be undone.')) return
    try {
      await workersTrainingService.deleteCohort(cohortId)
      showToast.success('Cohort deleted')
      navigate('/workers-training/cohorts')
    } catch (err: any) {
      console.error('Error deleting cohort:', err)
      showToast.error(err?.response?.data?.message || 'Failed to delete cohort.')
    }
  }

  if (loading) {
    return (
      <Layout title="Cohort">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error || !cohort) {
    return (
      <Layout title="Cohort">
        <Card className="p-8 text-center">
          <p className="text-red-600 mb-4">{error || 'Cohort not found.'}</p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/workers-training/cohorts')}>
              Back to cohorts
            </Button>
            {error && (
              <Button size="sm" onClick={loadCohort}>
                Retry
              </Button>
            )}
          </div>
        </Card>
      </Layout>
    )
  }

  const stats = cohort.statistics || {}
  const facilitators: Ref<Person>[] = cohort.facilitators || []
  const modules: any[] = cohort.modules || []
  const assignments: any[] = cohort.assignments || []
  const max = cohort.maxParticipants || 0
  const current = cohort.currentParticipants ?? traineeTotal

  return (
    <Layout title={cohort.name} subtitle={cohort.code}>
      <div className="space-y-6">
        {/* Header actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => navigate('/workers-training/cohorts')} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to cohorts
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={cohort.status}
              disabled={statusSaving}
              onChange={e => handleStatusChange(e.target.value as CohortStatus)}
              className="input h-9 w-auto"
              aria-label="Cohort status"
            >
              {Object.values(CohortStatus).map(s => (
                <option key={s} value={s}>
                  {workersTrainingService.getCohortStatusDisplayName(s)}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/workers-training/cohorts/${cohortId}/assignment`)}
              className="flex items-center gap-1"
            >
              <UserCheck className="w-4 h-4" />
              Assign trainees
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/workers-training/cohorts/${cohortId}/edit`)}
              className="flex items-center gap-1"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} className="flex items-center gap-1">
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Overview */}
        <Card className="p-6">
          <div className="flex flex-wrap items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{cohort.name}</h2>
                <span
                  className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                    statusColors[cohort.status as CohortStatus] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {workersTrainingService.getCohortStatusDisplayName(cohort.status)}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {cohort.code} · {workersTrainingService.getCohortTypeDisplayName(cohort.type)}
              </p>
              {cohort.description && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-line">{cohort.description}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Detail
              icon={<Calendar className="w-4 h-4" />}
              label="Runs"
              value={`${fmtDate(cohort.startDate)} – ${fmtDate(cohort.endDate)}`}
            />
            <Detail
              icon={<Calendar className="w-4 h-4" />}
              label="Registration"
              value={
                cohort.registrationStartDate || cohort.registrationEndDate
                  ? `${fmtDate(cohort.registrationStartDate)} – ${fmtDate(cohort.registrationEndDate)}`
                  : null
              }
            />
            <Detail
              icon={<Clock className="w-4 h-4" />}
              label="Meets"
              value={[cohort.meetingDays, cohort.meetingTime].filter(Boolean).join(' at ')}
            />
            <Detail
              icon={<MapPin className="w-4 h-4" />}
              label="Venue"
              value={[cohort.venue, cohort.address?.city].filter(Boolean).join(', ')}
            />
            <Detail
              icon={<Target className="w-4 h-4" />}
              label="Requirements"
              value={`${pct(cohort.minimumAttendance)} attendance · ${pct(cohort.passingGrade)} to pass`}
            />
            <Detail
              icon={<Award className="w-4 h-4" />}
              label="Cost"
              value={cohort.cost ? `${cohort.currency || ''} ${Number(cohort.cost).toLocaleString()}`.trim() : 'Free'}
            />
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Stat label="Participants" value={`${current} / ${max || '∞'}`} />
          <Stat
            label="Sessions"
            value={stats.totalSessions ? `${stats.completedSessions ?? 0} / ${stats.totalSessions}` : '—'}
          />
          <Stat label="Avg. attendance" value={pct(stats.averageAttendance)} />
          <Stat label="Avg. grade" value={pct(stats.averageGrade)} />
          <Stat label="Graduation rate" value={pct(stats.graduationRate)} />
        </div>

        {/* Trainees */}
        <Card>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              Trainees {traineeTotal > 0 && <span className="text-sm font-normal text-gray-500">({traineeTotal})</span>}
            </h3>
          </div>
          {traineesLoading ? (
            <div className="flex justify-center py-10">
              <LoadingSpinner />
            </div>
          ) : trainees.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600 mb-4">No trainees enrolled yet.</p>
              <Button size="sm" onClick={() => navigate(`/workers-training/cohorts/${cohortId}/assignment`)}>
                Assign trainees
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900 dark:text-white">Trainee</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900 dark:text-white">Status</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900 dark:text-white">Enrolled</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900 dark:text-white">Attendance</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900 dark:text-white">Grade</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900 dark:text-white">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {trainees.map(t => {
                    const m = asObj(t.member)
                    return (
                      <tr key={t._id}>
                        <td className="py-3 px-6">
                          <p className="font-medium text-gray-900 dark:text-white">{personName(t.member) || 'Unknown member'}</p>
                          {(m?.email || m?.phone) && (
                            <p className="text-xs text-gray-500">{m?.email || m?.phone}</p>
                          )}
                        </td>
                        <td className="py-3 px-6">
                          <span
                            className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                              traineeStatusColors[t.status] || 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {workersTrainingService.getTraineeStatusDisplayName(t.status)}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-gray-600 dark:text-gray-400">{fmtDate(t.enrollmentDate)}</td>
                        <td className="py-3 px-6 text-gray-600 dark:text-gray-400">{pct(t.attendance?.attendancePercentage)}</td>
                        <td className="py-3 px-6 text-gray-600 dark:text-gray-400">{pct(t.academicPerformance?.overallGrade)}</td>
                        <td className="py-3 px-6 text-gray-600 dark:text-gray-400">
                          {t.outcome ? workersTrainingService.getTrainingOutcomeDisplayName(t.outcome) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {pages > 1 && (
            <div className="flex justify-end gap-2 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-gray-600 self-center">
                Page {page} of {pages}
              </span>
              <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </Card>

        {/* Facilitators, modules, assignments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Leadership</h3>
            <div className="space-y-2 text-sm">
              {cohort.coordinator && (
                <p>
                  <span className="text-gray-500">Coordinator:</span> {personName(cohort.coordinator) || 'Assigned'}
                </p>
              )}
              {cohort.supervisor && (
                <p>
                  <span className="text-gray-500">Supervisor:</span> {personName(cohort.supervisor) || 'Assigned'}
                </p>
              )}
              {facilitators.length > 0 ? (
                <div>
                  <p className="text-gray-500 mb-1">Facilitators:</p>
                  <ul className="list-disc list-inside">
                    {facilitators.map((f, i) => (
                      <li key={asObj(f)?._id ?? (typeof f === 'string' ? f : i)}>{personName(f) || 'Assigned'}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                !cohort.coordinator && !cohort.supervisor && <p className="text-gray-500">No one assigned yet.</p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Modules</h3>
            {modules.length === 0 ? (
              <p className="text-sm text-gray-500">No modules defined.</p>
            ) : (
              <ol className="space-y-2 text-sm list-decimal list-inside">
                {modules.map((m, i) => (
                  <li key={i}>
                    <span className="font-medium text-gray-900 dark:text-white">{m.title}</span>
                    {m.duration ? <span className="text-gray-500"> · {m.duration}h</span> : null}
                    {m.isOptional && <span className="text-xs text-gray-400"> (optional)</span>}
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Assignments</h3>
            {assignments.length === 0 ? (
              <p className="text-sm text-gray-500">No assignments defined.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {assignments.map((a, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">{a.title}</span>
                    <span className="text-gray-500 whitespace-nowrap">Due {fmtDate(a.dueDate)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {cohort.notes && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Notes</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{cohort.notes}</p>
          </Card>
        )}

        <div className="text-right">
          <Link to="/workers-training/trainees" className="text-sm text-blue-600 hover:underline">
            All trainees →
          </Link>
        </div>
      </div>
    </Layout>
  )
}
