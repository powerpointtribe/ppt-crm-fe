import { useState, useEffect, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'

import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { workersTrainingService } from '@/services/workers-training'
import { CohortType, CreateCohortData } from '@/types/workers-training'
import { showToast } from '@/utils/toast'

interface FormState {
  name: string
  code: string
  type: CohortType
  description: string
  startDate: string
  endDate: string
  registrationStartDate: string
  registrationEndDate: string
  maxParticipants: string
  minimumAttendance: string
  passingGrade: string
  venue: string
  meetingDays: string
  meetingTime: string
  cost: string
  currency: string
  notes: string
}

const EMPTY: FormState = {
  name: '',
  code: '',
  type: CohortType.DAVID_COMPANY,
  description: '',
  startDate: '',
  endDate: '',
  registrationStartDate: '',
  registrationEndDate: '',
  maxParticipants: '30',
  minimumAttendance: '75',
  passingGrade: '60',
  venue: '',
  meetingDays: '',
  meetingTime: '',
  cost: '',
  currency: 'NGN',
  notes: '',
}

// <input type="date"> wants YYYY-MM-DD
const toDateInput = (value?: Date | string) => (value ? new Date(value).toISOString().slice(0, 10) : '')

const selectClass =
  'input w-full'

export default function CohortForm() {
  const navigate = useNavigate()
  const { cohortId } = useParams<{ cohortId: string }>()
  const isEdit = Boolean(cohortId)

  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!cohortId) return
    let cancelled = false
    ;(async () => {
      try {
        const raw: any = await workersTrainingService.getCohort(cohortId)
        const c = raw?.cohort ?? raw?.data ?? raw
        if (cancelled || !c) return
        setForm({
          name: c.name ?? '',
          code: c.code ?? '',
          type: c.type ?? CohortType.DAVID_COMPANY,
          description: c.description ?? '',
          startDate: toDateInput(c.startDate),
          endDate: toDateInput(c.endDate),
          registrationStartDate: toDateInput(c.registrationStartDate),
          registrationEndDate: toDateInput(c.registrationEndDate),
          maxParticipants: String(c.maxParticipants ?? ''),
          minimumAttendance: String(c.minimumAttendance ?? ''),
          passingGrade: String(c.passingGrade ?? ''),
          venue: c.venue ?? '',
          meetingDays: c.meetingDays ?? '',
          meetingTime: c.meetingTime ?? '',
          cost: c.cost != null ? String(c.cost) : '',
          currency: c.currency ?? 'NGN',
          notes: c.notes ?? '',
        })
      } catch (error) {
        console.error('Error loading cohort:', error)
        showToast.error('Could not load this cohort.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cohortId])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) next.name = 'Name is required'
    if (!form.code.trim()) next.code = 'Code is required'
    if (!form.startDate) next.startDate = 'Start date is required'
    if (!form.endDate) next.endDate = 'End date is required'
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      next.endDate = 'End date must be after start date'
    }
    if (
      form.registrationStartDate &&
      form.registrationEndDate &&
      form.registrationEndDate < form.registrationStartDate
    ) {
      next.registrationEndDate = 'Must be after registration start'
    }
    const pct = (v: string) => v !== '' && (Number(v) < 0 || Number(v) > 100)
    if (pct(form.minimumAttendance)) next.minimumAttendance = 'Must be between 0 and 100'
    if (pct(form.passingGrade)) next.passingGrade = 'Must be between 0 and 100'
    if (form.maxParticipants !== '' && Number(form.maxParticipants) < 0) {
      next.maxParticipants = 'Cannot be negative'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const optional = (v: string) => (v.trim() ? v.trim() : undefined)
    const optionalDate = (v: string) => (v ? new Date(v) : undefined)

    const payload: CreateCohortData = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      type: form.type,
      description: optional(form.description),
      startDate: new Date(form.startDate),
      endDate: new Date(form.endDate),
      registrationStartDate: optionalDate(form.registrationStartDate),
      registrationEndDate: optionalDate(form.registrationEndDate),
      maxParticipants: Number(form.maxParticipants || 0),
      minimumAttendance: Number(form.minimumAttendance || 0),
      passingGrade: Number(form.passingGrade || 0),
      facilitators: [],
      venue: optional(form.venue),
      meetingDays: optional(form.meetingDays),
      meetingTime: optional(form.meetingTime),
      modules: [],
      assignments: [],
      cost: form.cost !== '' ? Number(form.cost) : undefined,
      currency: optional(form.currency),
      notes: optional(form.notes),
    }

    try {
      setSaving(true)
      if (isEdit && cohortId) {
        // Don't wipe facilitators/modules/assignments that were set elsewhere
        const { facilitators, modules, assignments, ...rest } = payload
        await workersTrainingService.updateCohort(cohortId, rest)
        showToast.success('Cohort updated')
      } else {
        await workersTrainingService.createCohort(payload)
        showToast.success('Cohort created')
      }
      navigate('/workers-training/cohorts')
    } catch (error: any) {
      console.error('Error saving cohort:', error)
      const msg = error?.response?.data?.message ?? error?.message
      showToast.error(
        Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to save cohort. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  const title = isEdit ? 'Edit Cohort' : 'New Cohort'

  if (loading) {
    return (
      <Layout title={title}>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={title} subtitle={isEdit ? form.name : 'Set up a new training cohort'}>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/workers-training/cohorts')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to cohorts
          </Button>
        </div>

        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Basics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Name *"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              error={errors.name}
              placeholder="e.g. DC Batch 12"
            />
            <Input
              label="Code *"
              value={form.code}
              onChange={e => set('code', e.target.value)}
              error={errors.code}
              placeholder="e.g. DC-2026-12"
            />
            <div className="form-group">
              <label className="label">Type *</label>
              <select
                value={form.type}
                onChange={e => set('type', e.target.value as CohortType)}
                className={selectClass}
              >
                {Object.values(CohortType).map(type => (
                  <option key={type} value={type}>
                    {workersTrainingService.getCohortTypeDisplayName(type)}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Max participants"
              type="number"
              min={0}
              value={form.maxParticipants}
              onChange={e => set('maxParticipants', e.target.value)}
              error={errors.maxParticipants}
              description="0 means unlimited"
            />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              className="input w-full h-auto"
              placeholder="What this cohort covers"
            />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Schedule</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Start date *"
              type="date"
              value={form.startDate}
              onChange={e => set('startDate', e.target.value)}
              error={errors.startDate}
            />
            <Input
              label="End date *"
              type="date"
              value={form.endDate}
              onChange={e => set('endDate', e.target.value)}
              error={errors.endDate}
            />
            <Input
              label="Registration opens"
              type="date"
              value={form.registrationStartDate}
              onChange={e => set('registrationStartDate', e.target.value)}
            />
            <Input
              label="Registration closes"
              type="date"
              value={form.registrationEndDate}
              onChange={e => set('registrationEndDate', e.target.value)}
              error={errors.registrationEndDate}
            />
            <Input
              label="Meeting days"
              value={form.meetingDays}
              onChange={e => set('meetingDays', e.target.value)}
              placeholder="e.g. Saturdays"
            />
            <Input
              label="Meeting time"
              type="time"
              value={form.meetingTime}
              onChange={e => set('meetingTime', e.target.value)}
            />
            <Input
              label="Venue"
              value={form.venue}
              onChange={e => set('venue', e.target.value)}
              placeholder="e.g. Main Auditorium"
            />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Requirements & cost</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Minimum attendance (%)"
              type="number"
              min={0}
              max={100}
              value={form.minimumAttendance}
              onChange={e => set('minimumAttendance', e.target.value)}
              error={errors.minimumAttendance}
            />
            <Input
              label="Passing grade (%)"
              type="number"
              min={0}
              max={100}
              value={form.passingGrade}
              onChange={e => set('passingGrade', e.target.value)}
              error={errors.passingGrade}
            />
            <Input
              label="Cost"
              type="number"
              min={0}
              value={form.cost}
              onChange={e => set('cost', e.target.value)}
              placeholder="Leave blank if free"
            />
            <Input
              label="Currency"
              value={form.currency}
              onChange={e => set('currency', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="label">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              className="input w-full h-auto"
            />
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/workers-training/cohorts')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create cohort'}
          </Button>
        </div>
      </form>
    </Layout>
  )
}
