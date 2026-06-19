import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Phone,
  Users,
  Calendar,
  CheckCircle,
  UserCheck,
  Clock,
  Trash2,
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { eventsService, Event, EventRegistration } from '@/services/events'
import { RegistrationStatus } from '@/types/event'
import { formatDate } from '@/utils/formatters'
import { showToast } from '@/utils/toast'
import { useAuth } from '@/contexts/AuthContext-unified'

const statusColors: Record<
  RegistrationStatus,
  'default' | 'success' | 'warning' | 'destructive'
> = {
  pending: 'warning',
  confirmed: 'success',
  waitlisted: 'default',
  cancelled: 'destructive',
  attended: 'success',
  'no-show': 'destructive',
}

// Fields rendered explicitly elsewhere — hide from the generic answers list.
const HIDDEN_RESPONSE_KEYS = new Set(['headshotUrl', 'fullName'])

function humanize(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase())
}

export default function RegistrationDetail() {
  const { id, regId } = useParams<{ id: string; regId: string }>()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()

  const canUpdate = hasPermission('events:update')
  const canCheckIn = hasPermission('events:check-in')

  const [event, setEvent] = useState<Event | null>(null)
  const [reg, setReg] = useState<EventRegistration | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [regenEmail, setRegenEmail] = useState('')
  const [regenBusy, setRegenBusy] = useState(false)

  const load = async () => {
    if (!id || !regId) return
    try {
      const [ev, r] = await Promise.all([
        eventsService.getEventById(id),
        eventsService.getRegistration(id, regId),
      ])
      setEvent(ev)
      setReg(r)
      setRegenEmail(r.attendeeInfo?.email || '')
    } catch (e: any) {
      setError(e?.message || 'Failed to load registration')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, regId])

  const refresh = async () => {
    if (!id || !regId) return
    const r = await eventsService.getRegistration(id, regId)
    setReg(r)
  }

  const handleCheckIn = async () => {
    if (!id || !regId) return
    setBusy(true)
    try {
      await eventsService.checkInAttendee(id, regId)
      showToast('success', 'Attendee checked in')
      await refresh()
    } catch (e: any) {
      showToast('error', e?.message || 'Failed to check in')
    } finally {
      setBusy(false)
    }
  }

  const handleStatus = async (status: RegistrationStatus) => {
    if (!id || !regId) return
    setBusy(true)
    try {
      await eventsService.updateRegistrationStatus(id, regId, status)
      showToast('success', `Marked as ${status}`)
      await refresh()
    } catch (e: any) {
      showToast('error', e?.message || 'Failed to update status')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !regId) return
    if (!window.confirm('Delete this registration? This cannot be undone.'))
      return
    setBusy(true)
    try {
      await eventsService.deleteRegistration(id, regId)
      showToast('success', 'Registration deleted')
      navigate(`/events/${id}?tab=registrations`)
    } catch (e: any) {
      showToast('error', e?.message || 'Failed to delete registration')
      setBusy(false)
    }
  }

  const handleAdmission = async (decision: 'accept' | 'reject') => {
    if (!id || !regId) return
    setBusy(true)
    try {
      if (decision === 'accept') {
        const res = await eventsService.acceptRegistration(id, regId)
        showToast('success', res.message || 'Accepted into the program')
      } else {
        await eventsService.rejectRegistration(id, regId)
        showToast('success', 'Marked as rejected')
      }
      await refresh()
    } catch (e: any) {
      showToast('error', e?.message || 'Failed to update admission')
    } finally {
      setBusy(false)
    }
  }

  const goNext = async (applied: 'yes' | 'no' | 'any') => {
    if (!id || !regId) return
    setBusy(true)
    try {
      const { nextId } = await eventsService.getNextRegistration(id, regId, applied)
      if (nextId) {
        navigate(`/events/${id}/registrations/${nextId}`)
      } else {
        showToast(
          'info',
          applied === 'yes'
            ? 'No more applicants who have applied.'
            : applied === 'any'
            ? 'This is the last registrant.'
            : 'No more registrants who haven’t applied yet.'
        )
      }
    } catch (e: any) {
      showToast('error', e?.message || 'Could not load the next registrant')
    } finally {
      setBusy(false)
    }
  }

  const handleRegenerate = async () => {
    if (!id || !regId) return
    setRegenBusy(true)
    try {
      const res = await eventsService.regenerateApplicationLink(
        id,
        regId,
        regenEmail.trim() || undefined
      )
      showToast(
        'success',
        res.message ||
          (res.sentTo
            ? `New link sent to ${res.sentTo}`
            : 'New application link generated')
      )
      await refresh()
    } catch (e: any) {
      showToast('error', e?.message || 'Failed to regenerate link')
    } finally {
      setRegenBusy(false)
    }
  }

  if (loading) {
    return (
      <Layout title="Registration">
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      </Layout>
    )
  }

  if (error || !reg) {
    return (
      <Layout title="Registration">
        <div className="text-center py-16">
          <p className="text-red-600 text-lg font-medium">
            {error || 'Registration not found'}
          </p>
          <Button className="mt-4" onClick={() => navigate(`/events/${id}?tab=registrations`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to event
          </Button>
        </div>
      </Layout>
    )
  }

  const info = reg.attendeeInfo
  const responses = reg.customFieldResponses || {}
  const headshot = responses.headshotUrl
  const answers = Object.entries(responses).filter(
    ([k, v]) => !HIDDEN_RESPONSE_KEYS.has(k) && v
  )

  const applicationBaseUrl =
    typeof event?.registrationSettings === 'object'
      ? event?.registrationSettings?.applicationBaseUrl
      : ''
  const applicationLink =
    applicationBaseUrl && reg.applicationToken
      ? `${applicationBaseUrl.replace(/\/+$/, '')}/apply/${reg.applicationToken}`
      : ''

  return (
    <Layout
      title="Registration"
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => navigate(`/events/${id}?tab=registrations`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to event
          </Button>
          {applicationBaseUrl && (
            <>
              <Button onClick={() => goNext('no')} disabled={busy} title="Next registrant who hasn't applied">
                Next (not applied)
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button variant="outline" onClick={() => goNext('yes')} disabled={busy} title="Next registrant who has applied">
                Next applied
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="max-w-4xl mx-auto space-y-5">
        {/* In-content back link (always visible, incl. mobile) */}
        <button
          type="button"
          onClick={() => navigate(`/events/${id}?tab=registrations`)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to registrations
        </button>

        {/* Header card */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {headshot ? (
              <img
                src={headshot}
                alt={`${info.firstName} ${info.lastName}`}
                className="h-16 w-16 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0">
                <span className="text-white font-semibold text-lg">
                  {info.firstName?.[0]}
                  {info.lastName?.[0]}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {info.firstName} {info.lastName}
              </h2>
              <p className="text-sm text-gray-500 truncate">{info.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge
                  variant={reg.attendeeType === 'member' ? 'success' : 'default'}
                  className="font-medium"
                >
                  {reg.attendeeType === 'member' ? 'Member' : 'Visitor'}
                </Badge>
                <Badge variant={statusColors[reg.status]} className="font-medium">
                  {reg.status.charAt(0).toUpperCase() +
                    reg.status.slice(1).replace('-', ' ')}
                </Badge>
                {reg.checkInCode && (
                  <span className="text-xs font-mono text-gray-500">
                    {reg.checkInCode}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Contact */}
          <Card className="p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Contact Information
            </h3>
            <div className="space-y-2.5 text-sm">
              {info.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-700 break-all">{info.email}</span>
                </div>
              )}
              {info.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-700">{info.phone}</span>
                </div>
              )}
              {info.gender && (
                <div className="flex items-center gap-2.5">
                  <Users className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-700 capitalize">{info.gender}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Timeline */}
          <Card className="p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Timeline
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-gray-500 w-24 shrink-0">Registered</span>
                <span className="text-gray-700">
                  {formatDate(reg.registeredAt)}
                </span>
              </div>
              {reg.confirmedAt && (
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                  <span className="text-gray-500 w-24 shrink-0">Confirmed</span>
                  <span className="text-gray-700">
                    {formatDate(reg.confirmedAt)}
                  </span>
                </div>
              )}
              {reg.checkedInAt && (
                <div className="flex items-center gap-2.5">
                  <UserCheck className="h-4 w-4 text-blue-400 shrink-0" />
                  <span className="text-gray-500 w-24 shrink-0">Checked in</span>
                  <span className="text-gray-700">
                    {formatDate(reg.checkedInAt)}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Admission — accept/reject into the program (gates LMS portal access).
            Only for events with the application/LMS flow. */}
        {applicationBaseUrl && (
        <Card className="p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Admission
          </h3>
          <div className="flex items-center gap-2.5 text-sm">
            <span className="text-gray-500 w-24 shrink-0">Status</span>
            {reg.admissionStatus === 'accepted' ? (
              <span className="text-green-600 font-medium">
                Accepted{reg.acceptedAt ? ` · ${formatDate(reg.acceptedAt)}` : ''}
              </span>
            ) : reg.admissionStatus === 'rejected' ? (
              <span className="text-red-600 font-medium">Rejected</span>
            ) : reg.admissionStatus === 'waitlisted' ? (
              <span className="text-amber-600 font-medium">Waitlisted</span>
            ) : (
              <span className="text-gray-500">Applied (no decision yet)</span>
            )}
          </div>
          {reg.admissionStatus === 'accepted' && (
            <p className="mt-2 text-xs text-gray-500">
              A set-password invite to the learning portal was emailed to{' '}
              {reg.attendeeInfo.email}. Use "Resend application link" below or
              re-accept to send it again.
            </p>
          )}
          {canUpdate && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                variant={reg.admissionStatus === 'accepted' ? 'outline' : 'primary'}
                size="sm"
                onClick={() => handleAdmission('accept')}
                disabled={busy}
              >
                {reg.admissionStatus === 'accepted'
                  ? 'Re-send portal invite'
                  : 'Accept into program'}
              </Button>
              {reg.admissionStatus !== 'rejected' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleAdmission('reject')}
                  disabled={busy}
                >
                  Reject
                </Button>
              )}
            </div>
          )}
        </Card>
        )}

        {/* Application — only for events with an application flow (CMIT). */}
        {applicationBaseUrl && (
          <Card className="p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Application
            </h3>
            <div className="flex items-center gap-2.5 text-sm">
              {!reg.applicationToken ? (
                <>
                  <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-500 w-24 shrink-0">Status</span>
                  <span className="text-gray-500">No link generated yet</span>
                </>
              ) : reg.applicationSubmittedAt ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-gray-500 w-24 shrink-0">Submitted</span>
                  <span className="text-gray-700">
                    {formatDate(reg.applicationSubmittedAt)}
                  </span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="text-gray-500 w-24 shrink-0">Status</span>
                  <span className="text-amber-600 font-medium">
                    Not yet submitted
                  </span>
                </>
              )}
            </div>

            {applicationLink && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  readOnly
                  value={applicationLink}
                  className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-600 font-mono"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigator.clipboard
                      .writeText(applicationLink)
                      .then(() => showToast('success', 'Application link copied'))
                      .catch(() => showToast('error', 'Could not copy link'))
                  }
                >
                  Copy link
                </Button>
              </div>
            )}

            {/* Regenerate & send */}
            {canUpdate && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-700">
                  Regenerate &amp; send application link
                </p>
                <p className="mt-0.5 text-[11px] text-gray-400 leading-relaxed">
                  Creates a fresh link (the old one stops working), unlocks the
                  form for editing, and emails it to the address below — their
                  registered email or a different one.
                </p>
                <div className="mt-2 flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={regenEmail}
                    onChange={(e) => setRegenEmail(e.target.value)}
                    placeholder="email to send the link to"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                  <Button
                    onClick={handleRegenerate}
                    disabled={regenBusy || !regenEmail.trim()}
                    className="shrink-0"
                  >
                    {regenBusy ? 'Sending…' : 'Regenerate & send'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Submission answers */}
        {answers.length > 0 && (
          <Card className="p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Submission
            </h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              {answers.map(([key, value]) => (
                <div key={key} className="min-w-0">
                  <dt className="text-xs font-medium text-gray-500 mb-0.5">
                    {humanize(key)}
                  </dt>
                  <dd className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        )}

        {/* Notes */}
        {reg.notes && (
          <Card className="p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Notes
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {reg.notes}
            </p>
          </Card>
        )}

        {/* Actions */}
        {(canUpdate || canCheckIn) && (
          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            {canCheckIn &&
              reg.status !== 'attended' &&
              reg.status !== 'cancelled' && (
                <Button
                  variant="secondary"
                  onClick={handleCheckIn}
                  disabled={busy}
                >
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  Check in
                </Button>
              )}
            {canUpdate && reg.status === 'pending' && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => handleStatus('confirmed')}
                  disabled={busy}
                >
                  Confirm
                </Button>
                <Button
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleStatus('cancelled')}
                  disabled={busy}
                >
                  Cancel registration
                </Button>
              </>
            )}
            {canUpdate && (
              <Button
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
                disabled={busy}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
