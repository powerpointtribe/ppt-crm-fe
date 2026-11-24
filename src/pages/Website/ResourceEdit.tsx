import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Trash2 } from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import { createResource, decideGivingAccount, deleteResource, getResource, updateResource, WebsiteApiError, type Doc } from '@/services/website-admin'
import { showToast } from '@/utils/toast'
import { resourceByKey, type FieldDef, type ResourceConfig } from './resources'
import { ErrorNote, errMsg, FieldInput, fmtStamp, getPath, Loading, StatusBadge, useLookups, useWebsiteCan } from './shared'

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
const DEFAULTS: Partial<Record<FieldDef['type'], unknown>> = { bool: false, images: [], tags: [], times: [] }

/** Form values for a doc (or defaults for a new item). */
function valuesFor(cfg: ResourceConfig, d: Doc) {
  const init: Doc = {}
  for (const f of cfg.fields) init[f.name] = getPath(d, f.name) ?? (d.id ? null : (DEFAULTS[f.type] ?? null))
  if (cfg.publishable || cfg.reviewStatus) {
    init.status = d.status ?? (cfg.reviewStatus ? 'pending_review' : 'draft')
    init.publishAt = d.publishAt ?? null
  }
  return init
}

/** `/website/:resource/new` and `/website/:resource/:id`. One editor per item (`key`), so switching always starts clean. */
export default function ResourceEdit() {
  const { resource = '', id = 'new' } = useParams()
  const cfg = resourceByKey(resource)
  if (!cfg) return <Navigate to="/website" replace />
  return <Editor key={`${resource}-${id}`} cfg={cfg} id={id === 'new' ? null : id} />
}

function Editor({ cfg, id }: { cfg: ResourceConfig; id: string | null }) {
  const navigate = useNavigate()
  const can = useWebsiteCan()
  const { reload: reloadLookups } = useLookups()
  const [doc, setDoc] = useState<Doc | null>(id ? null : {})
  const [values, setValues] = useState<Doc>(() => (id ? {} : valuesFor(cfg, {})))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const statusField = cfg.publishable || cfg.reviewStatus ? 'status' : null
  // Read-only fields (managed in the CRM) are shown but never sent.
  const names = useMemo(() => [...cfg.fields.filter((f) => !f.readOnly).map((f) => f.name), ...(statusField ? ['status', 'publishAt'] : [])], [cfg, statusField])

  function load(d: Doc) {
    setDoc(d)
    setValues(valuesFor(cfg, d))
  }

  useEffect(() => {
    if (!id) return
    let live = true
    getResource(cfg.key, id)
      .then((d) => live && load(d))
      .catch((e: unknown) => live && setError(errMsg(e, 'Couldn’t load this item.')))
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when the item changes
  }, [cfg.key, id])

  const canWrite = id ? can('U', cfg.policy) : can('C', cfg.policy)
  const canPublish = can('P', cfg.policy)
  const visible = (name: string) => cfg.visible?.[name]?.(values) ?? true
  const backHref = `/website/${cfg.key}`

  function body() {
    const out: Doc = {}
    for (const n of names) {
      if (!visible(n)) continue
      const v = values[n]
      if (n === 'publishAt' && values.status !== 'scheduled') {
        if (doc?.publishAt) out.publishAt = null
        continue
      }
      if (n === 'slug' && !v) continue // made from the title by the API
      if (id && same(v, getPath(doc!, n))) continue // PATCH sends only what changed
      if (!id && n === 'status' && v === (cfg.reviewStatus ? 'pending_review' : 'draft')) continue
      out[n] = typeof v === 'string' ? v.trim() : v
    }
    return cfg.toBody ? cfg.toBody(out, values) : out
  }

  function fail(err: unknown, fallback: string) {
    if (err instanceof WebsiteApiError) {
      setErrors(err.fields)
      setError(Object.keys(err.fields).length ? `${err.message} See the highlighted fields.` : err.message)
    } else setError(fallback)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setError(null)
    const b = body()
    if (id && Object.keys(b).length === 0) {
      showToast.info('Nothing to save: no changes.')
      return
    }
    setBusy(true)
    try {
      const saved = id ? await updateResource(cfg.key, id, b) : await createResource(cfg.key, b)
      reloadLookups()
      if (!id) {
        showToast.success(`${cfg.singular[0].toUpperCase()}${cfg.singular.slice(1)} created`)
        navigate(`/website/${cfg.key}/${saved.id}`, { replace: true })
      } else {
        load(saved)
        showToast.success(saved.pendingChange ? 'Change saved. It shows on the website after someone else approves it.' : 'Saved. The website updates within a minute.')
      }
    } catch (err) {
      fail(err, 'Couldn’t save. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!id || !window.confirm(`Delete this ${cfg.singular}? This can’t be undone.`)) return
    setBusy(true)
    try {
      await deleteResource(cfg.key, id)
      showToast.success('Deleted')
      navigate(backHref, { replace: true })
    } catch (err) {
      setError(errMsg(err, 'Couldn’t delete it.'))
      setBusy(false)
    }
  }

  async function decide(action: 'approve' | 'reject') {
    if (!id) return
    setBusy(true)
    setError(null)
    try {
      load(await decideGivingAccount(id, action))
      showToast.success(action === 'approve' ? 'Approved. It now shows on the website.' : 'Change discarded.')
    } catch (err) {
      setError(errMsg(err, 'Couldn’t do that.'))
    } finally {
      setBusy(false)
    }
  }

  const title = !id ? `New ${cfg.singular}` : doc ? String(doc.title ?? doc.name ?? doc.question ?? doc.description ?? doc.bank ?? cfg.singular) : cfg.label
  const pending = doc?.pendingChange as { fields: Record<string, unknown>; requestedAt: string } | null | undefined
  const badge = doc?.status ? String(doc.status) : doc?.approvalStatus ? (pending ? 'pending' : String(doc.approvalStatus)) : null

  return (
    <Layout
      title={title}
      subtitle={cfg.label}
      actions={
        <Link to={backHref}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> {cfg.label}
          </Button>
        </Link>
      }
    >
      {!doc ? (
        error ? <ErrorNote>{error}</ErrorNote> : <Loading />
      ) : (
        <div className="max-w-3xl">
          {cfg.key === 'giving-accounts' && id && (doc.approvalStatus === 'draft' || pending) && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-4 flex flex-col gap-3">
              <p className="text-sm text-amber-900 dark:text-amber-200">
                {pending ? (
                  <>
                    A change is waiting for approval ({fmtStamp(pending.requestedAt)}):{' '}
                    {Object.entries(pending.fields)
                      .map(([k, v]) => `${k} → ${v ?? 'empty'}`)
                      .join(', ')}
                    . The website still shows the approved details.
                  </>
                ) : (
                  'This account is a draft. It isn’t on the website until someone other than its author approves it.'
                )}
              </p>
              {can('A', cfg.policy) && (
                <div className="flex gap-2">
                  <Button size="sm" disabled={busy} onClick={() => decide('approve')}>
                    <Check className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  {pending && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => decide('reject')}>
                      Discard change
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          <form className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6" onSubmit={save} noValidate>
            {badge && (
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">Current status</span>
                <StatusBadge status={badge} />
              </div>
            )}
            <fieldset disabled={!canWrite || busy} className="space-y-5">
              {cfg.fields
                .filter((f) => visible(f.name))
                .map((f) => (
                  <FieldInput key={f.name} def={f} value={values[f.name]} disabled={f.readOnly} error={errors[f.name]} onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))} />
                ))}
              {statusField && (
                <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <FieldInput
                    def={{
                      name: 'status',
                      label: cfg.reviewStatus ? 'Status' : 'Visibility',
                      type: 'select',
                      required: true,
                      options: cfg.reviewStatus ?? [['draft', 'Draft (hidden)'], ['published', 'Published'], ['scheduled', 'Scheduled']],
                      help: canPublish ? undefined : cfg.reviewStatus ? 'The care desk reviews new items before they’re listed.' : 'Only people with publish rights can change this.',
                    }}
                    value={values.status}
                    disabled={!canPublish}
                    error={errors.status}
                    onChange={(v) => setValues((s) => ({ ...s, status: v }))}
                  />
                  {values.status === 'scheduled' && (
                    <FieldInput
                      def={{ name: 'publishAt', label: 'Publish at', type: 'datetime', required: true }}
                      value={values.publishAt}
                      disabled={!canPublish}
                      error={errors.publishAt}
                      onChange={(v) => setValues((s) => ({ ...s, publishAt: v }))}
                    />
                  )}
                </div>
              )}
            </fieldset>

            {error && <div className="mt-5"><ErrorNote>{error}</ErrorNote></div>}

            <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              {canWrite && (
                <Button type="submit" loading={busy}>
                  {!busy && <Check className="w-4 h-4 mr-1" />}
                  {busy ? 'Saving…' : id ? 'Save changes' : `Create ${cfg.singular}`}
                </Button>
              )}
              {id && can('D', cfg.policy) && (
                <Button type="button" variant="ghost" className="text-red-600 hover:text-red-700" disabled={busy} onClick={remove}>
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              )}
              {doc.updatedAt ? <p className="text-xs text-gray-500 dark:text-gray-400 ml-auto">Last saved {fmtStamp(String(doc.updatedAt))}</p> : null}
            </div>
          </form>
        </div>
      )}
    </Layout>
  )
}
