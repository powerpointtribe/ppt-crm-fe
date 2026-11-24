import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Users, Search, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react'

import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { workersTrainingService } from '@/services/workers-training'
import {
  Cohort,
  WorkersTrainingStatus,
  TrainingOutcome,
  TraineeQueryParams,
} from '@/types/workers-training'

// The list endpoint populates these refs, so they arrive as objects (or null if the ref is dangling)
type PopulatedMember = { _id: string; firstName?: string; lastName?: string; email?: string; phone?: string }
type PopulatedCohort = { _id: string; name?: string; code?: string }
type PopulatedUnit = { _id: string; name?: string }

interface TraineeRow {
  _id: string
  member: PopulatedMember | string | null
  cohort: PopulatedCohort | string | null
  status: WorkersTrainingStatus
  enrollmentDate?: string
  attendance?: { attendancePercentage?: number }
  academicPerformance?: { overallGrade?: number }
  outcome?: TrainingOutcome
  assignedUnit?: PopulatedUnit | string | null
}

interface Pagination {
  current: number
  pages: number
  total: number
  count: number
}

const asObj = <T extends object>(v: T | string | null | undefined): T | null =>
  v && typeof v === 'object' ? v : null

const memberName = (t: TraineeRow) => {
  const m = asObj(t.member)
  const name = [m?.firstName, m?.lastName].filter(Boolean).join(' ')
  return name || 'Unknown member'
}

const statusColors: Record<WorkersTrainingStatus, string> = {
  [WorkersTrainingStatus.REGISTERED]: 'bg-gray-100 text-gray-800',
  [WorkersTrainingStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [WorkersTrainingStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [WorkersTrainingStatus.DROPPED_OUT]: 'bg-red-100 text-red-800',
  [WorkersTrainingStatus.DEFERRED]: 'bg-yellow-100 text-yellow-800',
  [WorkersTrainingStatus.SUSPENDED]: 'bg-orange-100 text-orange-800',
}

export default function TraineeManagement() {
  const navigate = useNavigate()
  const [trainees, setTrainees] = useState<TraineeRow[]>([])
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState<Pagination>({ current: 1, pages: 1, total: 0, count: 0 })
  const [filters, setFilters] = useState<TraineeQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'enrollmentDate',
    sortOrder: 'desc',
  })

  useEffect(() => {
    workersTrainingService
      .getCohorts({ limit: 100 })
      .then((res: any) => setCohorts(res?.cohorts || []))
      .catch((err) => console.error('Error fetching cohorts:', err))
  }, [])

  useEffect(() => {
    let cancelled = false
    const fetchTrainees = async () => {
      try {
        setLoading(true)
        setError(null)
        const res: any = await workersTrainingService.getTrainees(filters)
        if (cancelled) return
        setTrainees(res?.trainees || [])
        setPagination(res?.pagination || { current: 1, pages: 1, total: 0, count: 0 })
      } catch (err: any) {
        if (cancelled) return
        console.error('Error fetching trainees:', err)
        setError(err?.response?.data?.message || 'Failed to load trainees.')
        setTrainees([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchTrainees()
    return () => {
      cancelled = true
    }
  }, [filters])

  // The backend ignores `search`, so filter the current page on the client
  const visibleTrainees = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return trainees
    return trainees.filter((t) => {
      const m = asObj(t.member)
      const c = asObj(t.cohort)
      return [memberName(t), m?.email, m?.phone, c?.name, c?.code]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [trainees, search])

  const updateFilter = (patch: Partial<TraineeQueryParams>) =>
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }))

  const selectClass =
    'px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'

  return (
    <Layout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap justify-between items-start gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-green-600" />
              Trainees
            </h1>
            <p className="text-gray-600 mt-1">Monitor trainee progress and assign units</p>
          </div>
          <Button
            onClick={() => navigate('/workers-training/trainees/assignment')}
            className="flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            Assign to Units
          </Button>
        </motion.div>

        <Card className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search name, email, phone or cohort..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filters.cohort || ''}
              onChange={(e) => updateFilter({ cohort: e.target.value || undefined })}
              className={selectClass}
            >
              <option value="">All Cohorts</option>
              {cohorts.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={filters.status || ''}
              onChange={(e) =>
                updateFilter({ status: (e.target.value as WorkersTrainingStatus) || undefined })
              }
              className={selectClass}
            >
              <option value="">All Status</option>
              {Object.values(WorkersTrainingStatus).map((s) => (
                <option key={s} value={s}>
                  {workersTrainingService.getTraineeStatusDisplayName(s)}
                </option>
              ))}
            </select>
            <select
              value={filters.outcome || ''}
              onChange={(e) =>
                updateFilter({ outcome: (e.target.value as TrainingOutcome) || undefined })
              }
              className={selectClass}
            >
              <option value="">All Outcomes</option>
              {Object.values(TrainingOutcome).map((o) => (
                <option key={o} value={o}>
                  {workersTrainingService.getTrainingOutcomeDisplayName(o)}
                </option>
              ))}
            </select>
          </div>
        </Card>

        <Card>
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-12 bg-gray-100 rounded" />
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-600">{error}</div>
          ) : visibleTrainees.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No trainees found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Trainee</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Cohort</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Attendance</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Grade</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Outcome / Unit</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Enrolled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {visibleTrainees.map((t) => {
                    const m = asObj(t.member)
                    const c = asObj(t.cohort)
                    const unit = asObj(t.assignedUnit)
                    const attendance = t.attendance?.attendancePercentage
                    const grade = t.academicPerformance?.overallGrade
                    return (
                      <tr key={t._id} className="hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <p className="font-medium text-gray-900">{memberName(t)}</p>
                          <p className="text-sm text-gray-500">{m?.email || m?.phone || '—'}</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-gray-900">{c?.name || '—'}</p>
                          {c?.code && <p className="text-sm text-gray-500">{c.code}</p>}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              statusColors[t.status] || 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {workersTrainingService.getTraineeStatusDisplayName(t.status)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-900">
                          {typeof attendance === 'number' ? `${Math.round(attendance)}%` : '—'}
                        </td>
                        <td className="py-4 px-6 text-gray-900">
                          {typeof grade === 'number' ? grade.toFixed(1) : '—'}
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-gray-900">
                            {t.outcome
                              ? workersTrainingService.getTrainingOutcomeDisplayName(t.outcome)
                              : '—'}
                          </p>
                          {unit?.name && <p className="text-sm text-gray-500">{unit.name}</p>}
                        </td>
                        <td className="py-4 px-6 text-gray-600 text-sm">
                          {t.enrollmentDate ? new Date(t.enrollmentDate).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Page {pagination.current} of {pagination.pages} · {pagination.total} trainees
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  disabled={pagination.current <= 1}
                  onClick={() => updateFilter({ page: pagination.current - 1 })}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  disabled={pagination.current >= pagination.pages}
                  onClick={() => updateFilter({ page: pagination.current + 1 })}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}
