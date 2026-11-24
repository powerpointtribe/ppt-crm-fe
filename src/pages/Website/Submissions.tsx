import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext-unified'
import { deleteSubmission, listSubmissions, updateSubmission, type ListResult, type Submission } from '@/services/website-admin'
import { showToast } from '@/utils/toast'
import { Empty, ErrorNote, errMsg, fmtStamp, Loading, Pager, StatusBadge, useWebsiteCan } from './shared'

const FORMS: Record<string, string> = {
  visit: 'Plan a visit',
  dc_interest: 'David’s Company',
  partner: 'Partnership',
  care_dropoff: 'Care Closet drop-off',
  event_notify: 'Event updates',
}
const STATUSES: [string, string][] = [['new', 'New'], ['in_progress', 'In progress'], ['done', 'Done'], ['spam', 'Spam']]

/** Field names in submissions are camelCase; show them as words. */
const words = (k: string) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
const show = (v: unknown) => (Array.isArray(v) ? v.join(', ') : v && typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—'))

export default function Submissions() {
  const [sp, setSp] = useSearchParams()
  const can = useWebsiteCan()
  const { member } = useAuth()
  const [list, setList] = useState<ListResult<Submission> | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const formType = sp.get('formType') ?? ''
  const status = sp.get('status') ?? ''
  const page = Number(sp.get('page') ?? '1')
  const canManage = can('U', 'form_submissions')

  // crm-be has no "assignable staff" list for website admins; offer the signed-in person.
  const me = member ? { id: String(member._id ?? member.id ?? ''), name: [member.firstName, member.lastName].filter(Boolean).join(' ') || String(member.email ?? 'Me') } : null

  const load = useCallback(() => {
    listSubmissions({ formType, status, page }).then(
      (r) => (setError(null), setList(r)),
      (e: unknown) => setError(errMsg(e, 'Couldn’t load submissions.')),
    )
  }, [formType, status, page])
  useEffect(load, [load])

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(sp)
    if (v) next.set(k, v)
    else next.delete(k)
    if (k !== 'page') next.delete('page')
    setSp(next, { replace: true })
  }

  async function patch(s: Submission, body: Parameters<typeof updateSubmission>[1]) {
    try {
      await updateSubmission(s.id, body)
      showToast.success('Saved')
      load()
    } catch (e) {
      showToast.error(errMsg(e, 'Couldn’t save.'))
    }
  }

  async function remove(s: Submission) {
    if (!window.confirm(`Delete ${s.contact.name || 'this'}’s submission? This can’t be undone.`)) return
    try {
      await deleteSubmission(s.id)
      showToast.success('Deleted')
      load()
    } catch (e) {
      showToast.error(errMsg(e, 'Couldn’t delete it.'))
    }
  }

  return (
    <Layout title="Form submissions" subtitle="Plan a visit, partnership, David’s Company and Care Closet forms. Contact people from your church phone or inbox.">
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select className="input sm:w-auto" aria-label="Form" value={formType} onChange={(e) => setParam('formType', e.target.value || null)}>
          <option value="">Form: all</option>
          {Object.entries(FORMS).map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </select>
        <select className="input sm:w-auto" aria-label="Status" value={status} onChange={(e) => setParam('status', e.target.value || null)}>
          <option value="">Status: all</option>
          {STATUSES.map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </select>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      {!list && !error && <Loading />}
      {list?.data.length === 0 && <Empty>No submissions match.</Empty>}

      <div className="flex flex-col gap-3">
        {list?.data.map((s) => (
          <article key={s.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              type="button"
              className="w-full grid grid-cols-2 sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto_auto] items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/40"
              aria-expanded={open === s.id}
              onClick={() => setOpen(open === s.id ? null : s.id)}
            >
              <strong className="text-sm text-gray-900 dark:text-white">{s.contact.name || '—'}</strong>
              <span className="text-sm text-gray-700 dark:text-gray-300">{FORMS[s.formType] ?? s.formType}</span>
              <span className="text-xs text-gray-500">{fmtStamp(s.createdAt)}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">{s.campus ?? ''}</span>
              <StatusBadge status={s.status} />
              {open === s.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {open === s.id && (
              <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-4 grid gap-6 md:grid-cols-2">
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                  <dt className="text-gray-500">Email</dt>
                  <dd>{s.contact.email ? <a className="text-primary-600 hover:underline" href={`mailto:${s.contact.email}`}>{s.contact.email}</a> : '—'}</dd>
                  <dt className="text-gray-500">Phone</dt>
                  <dd>{s.contact.phone ? <a className="text-primary-600 hover:underline" href={`tel:${s.contact.phone}`}>{s.contact.phone}</a> : '—'}</dd>
                  {Object.entries(s.payload ?? {})
                    .filter(([k]) => !['name', 'email', 'phone', 'consent', 'website'].includes(k))
                    .map(([k, v]) => (
                      <div key={k} className="contents">
                        <dt className="text-gray-500">{words(k)}</dt>
                        <dd className="text-gray-800 dark:text-gray-200 break-words">{show(v)}</dd>
                      </div>
                    ))}
                </dl>
                {canManage && (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="form-group">
                        <label className="label" htmlFor={`st-${s.id}`}>Status</label>
                        <select id={`st-${s.id}`} className="input" value={s.status} onChange={(e) => patch(s, { status: e.target.value })}>
                          {STATUSES.map(([k, l]) => (
                            <option key={k} value={k}>{l}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="label" htmlFor={`as-${s.id}`}>Assigned to</label>
                        <select id={`as-${s.id}`} className="input" value={s.assignedTo ?? ''} onChange={(e) => patch(s, { assignedTo: e.target.value || null })}>
                          <option value="">Not assigned</option>
                          {me && <option value={me.id}>{me.name}</option>}
                          {s.assignedTo && s.assignedTo !== me?.id && <option value={s.assignedTo}>Someone else</option>}
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="label" htmlFor={`n-${s.id}`}>Notes (staff only)</label>
                      <textarea
                        id={`n-${s.id}`}
                        className="input h-auto min-h-[80px] py-2"
                        rows={3}
                        maxLength={2000}
                        value={notes[s.id] ?? s.notes ?? ''}
                        onChange={(e) => setNotes({ ...notes, [s.id]: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => patch(s, { notes: notes[s.id] ?? s.notes ?? '' })}>
                        Save notes
                      </Button>
                      {can('D', 'form_submissions') && (
                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => remove(s)}>
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
      {list && <Pager meta={list.meta} onPage={(p) => setParam('page', String(p))} />}
    </Layout>
  )
}
