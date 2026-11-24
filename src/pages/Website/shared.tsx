import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ImageIcon, Plus, Upload } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext-unified'
import { getLookups, uploadWebsiteImage, WebsiteApiError, type Lookups, type Meta } from '@/services/website-admin'
import { PERMISSIONS, STATUS_LABEL, type FieldDef } from './resources'

/* ─── permissions ────────────────────────────────────────────────────── */

/** Does the signed-in user hold `action` (C R U D P T X A) on `resource`? Mirrors crm-be; crm-be still decides. */
export function useWebsiteCan() {
  const { hasPermission } = useAuth()
  return useCallback(
    (action: string, resource: string) => (PERMISSIONS[resource]?.[action] ?? []).some((p) => hasPermission(p)),
    [hasPermission],
  )
}

/* ─── lookups (campuses, series, pastors), shared by every screen ───── */

const EMPTY: Lookups = { campuses: [], series: [], pastors: [] }
let cache: Lookups | null = null
let inflight: Promise<Lookups> | null = null
const listeners = new Set<(l: Lookups) => void>()

function fetchLookups(force = false) {
  if (!force && cache) return Promise.resolve(cache)
  if (!force && inflight) return inflight
  inflight = getLookups().then((l) => {
    cache = l
    inflight = null
    listeners.forEach((fn) => fn(l))
    return l
  })
  return inflight
}

export function useLookups() {
  const [lookups, setLookups] = useState<Lookups>(cache ?? EMPTY)
  useEffect(() => {
    listeners.add(setLookups)
    fetchLookups().then(setLookups, () => undefined)
    return () => {
      listeners.delete(setLookups)
    }
  }, [])
  const reload = useCallback(() => {
    fetchLookups(true).catch(() => undefined)
  }, [])
  return { lookups, reload }
}

/* ─── display bits ───────────────────────────────────────────────────── */

type Variant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive'
const TONE: Record<string, Variant> = {
  published: 'success', approved: 'success', listed: 'success', active: 'success', done: 'success', paid: 'success', fulfilled: 'success', collected: 'success',
  draft: 'secondary', moved_to_care_closet: 'secondary',
  scheduled: 'default', in_progress: 'default', ready: 'default', claim_pending: 'default', invited: 'default',
  pending_review: 'warning', new: 'warning', pending: 'warning', pending_payment: 'warning',
  spam: 'destructive', cancelled: 'destructive', refunded: 'destructive', rejected: 'destructive', disabled: 'destructive',
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={TONE[status] ?? 'secondary'}>{STATUS_LABEL[status] ?? status}</Badge>
}

export function Pager({ meta, onPage }: { meta: Meta; onPage: (p: number) => void }) {
  if (meta.totalPages <= 1) {
    return <p className="text-sm text-gray-500 dark:text-gray-400 py-3">{meta.total === 1 ? '1 item' : `${meta.total} items`}</p>
  }
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
        Previous
      </Button>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Page {meta.page} of {meta.totalPages} · {meta.total} items
      </p>
      <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>
        Next
      </Button>
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
      {children}
    </div>
  )
}

export function Loading() {
  return (
    <div className="flex justify-center py-12" aria-busy="true">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  )
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
      {children}
    </div>
  )
}

export const errMsg = (e: unknown, fallback: string) => (e instanceof WebsiteApiError || e instanceof Error ? e.message : fallback)

const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })
/** Amounts in major units (crm-be stores ₦ 5000 as 5000). */
export const fmtMoney = (amount: number, currency = 'NGN') =>
  currency === 'NGN' ? naira.format(amount) : new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)

const lagos = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', ...o })
export const fmtDay = (iso?: string | null) => (iso ? lagos({ day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso)) : '—')
export const fmtStamp = (iso?: string | null) =>
  iso ? lagos({ day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) : '—'

/** Reads `a.b.c` from a nested doc. */
export const getPath = (o: Record<string, unknown>, path: string) =>
  path.split('.').reduce<unknown>((x, k) => (x as Record<string, unknown> | null | undefined)?.[k], o)

/* ─── form fields ────────────────────────────────────────────────────── */

const pad = (n: number) => String(n).padStart(2, '0')
function toLocalInput(iso: unknown, withTime: boolean) {
  if (typeof iso !== 'string' || !iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const day = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return withTime ? `${day}T${pad(d.getHours())}:${pad(d.getMinutes())}` : day
}
/** ISO for a complete input value; null while empty, half-typed (year 0002...) or out of range. */
function fromLocalInput(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(s)) return null
  const year = Number(s.slice(0, 4))
  if (year < 1900 || year > 2200) return null
  const d = new Date(s.length === 10 ? `${s}T12:00` : s) // date-only: local noon, so the day never shifts
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** Keeps the typed text locally: re-deriving it from ISO on every keystroke breaks half-typed years. */
function DateInput({ value, withTime, onChange, ...rest }: { value: unknown; withTime: boolean; onChange: (v: unknown) => void } & Record<string, unknown>) {
  const [text, setText] = useState(() => toLocalInput(value, withTime))
  return (
    <input
      className="input w-full"
      type={withTime ? 'datetime-local' : 'date'}
      min={withTime ? '1900-01-01T00:00' : '1900-01-01'}
      max={withTime ? '2200-12-31T23:59' : '2200-12-31'}
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        onChange(fromLocalInput(e.target.value))
      }}
      {...rest}
    />
  )
}

type FieldProps = { def: FieldDef; value: unknown; onChange: (v: unknown) => void; error?: string; disabled?: boolean }

export function FieldInput({ def, value, onChange, error, disabled }: FieldProps) {
  const id = useId()
  const { lookups } = useLookups()
  const a11y = {
    id,
    disabled,
    'aria-invalid': !!error,
    'aria-describedby': [error && `${id}-err`, def.help && `${id}-help`].filter(Boolean).join(' ') || undefined,
  }
  const cls = `input w-full${error ? ' input-error' : ''}`

  let control: ReactNode
  switch (def.type) {
    case 'textarea':
      control = <textarea className={`${cls} h-auto min-h-[120px] py-2`} rows={5} maxLength={def.max} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} {...a11y} />
      break
    case 'text':
    case 'url':
    case 'email':
      control = (
        <input
          className={cls}
          type={def.type}
          maxLength={def.max}
          placeholder={def.placeholder ?? (def.type === 'url' ? 'https://' : undefined)}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          {...a11y}
        />
      )
      break
    case 'number':
      control = (
        <input
          className={cls}
          type="number"
          inputMode="numeric"
          min={def.min}
          max={def.max}
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          {...a11y}
        />
      )
      break
    case 'money':
      control = (
        <input
          className={cls}
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={typeof value === 'number' ? String(value) : ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          {...a11y}
        />
      )
      break
    case 'date':
    case 'datetime':
      control = <DateInput value={value} withTime={def.type === 'datetime'} onChange={onChange} className={cls} {...a11y} />
      break
    case 'select':
      control = (
        <select className={cls} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)} {...a11y}>
          {(def.nullable || !def.required) && <option value="">{def.nullable ?? 'Choose…'}</option>}
          {def.required && !def.nullable && !value && <option value="">Choose…</option>}
          {def.options.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      )
      break
    case 'ref':
      control = (
        <select className={cls} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)} {...a11y}>
          <option value="">{def.nullable ?? 'Choose…'}</option>
          {(lookups[def.lookup] ?? []).map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      )
      break
    case 'bool':
      return (
        <div className="form-group">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-800 dark:text-gray-200">
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary-600" checked={!!value} onChange={(e) => onChange(e.target.checked)} {...a11y} />
            <span>{def.label}</span>
          </label>
          {def.help && <p id={`${id}-help`} className="form-description">{def.help}</p>}
          {error && <p id={`${id}-err`} className="form-error">{error}</p>}
        </div>
      )
    case 'tags':
      control = (
        <input
          className={cls}
          value={Array.isArray(value) ? value.join(', ') : ''}
          onChange={(e) => onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
          {...a11y}
        />
      )
      break
    case 'image':
      control = <ImageField value={(value as Img | null) ?? null} onChange={onChange} disabled={disabled} ratio={def.ratio} />
      break
    case 'images':
      control = <ImagesField value={(value as Img[] | null) ?? []} onChange={onChange} disabled={disabled} />
      break
    case 'times':
      control = <TimesField value={(value as Time[] | null) ?? []} onChange={onChange} disabled={disabled} />
      break
  }

  return (
    <div className="form-group">
      <label className="label" htmlFor={id}>
        {def.label}
        {'required' in def && def.required && <span className="text-red-500" aria-hidden="true"> *</span>}
      </label>
      {control}
      {def.help && <p id={`${id}-help`} className="form-description">{def.help}</p>}
      {error && <p id={`${id}-err`} className="form-error">{error}</p>}
    </div>
  )
}

type Img = { url: string; alt: string }

/** Upload (JPEG/PNG/WebP, 15 MB) or remove. crm-be checks the file type and strips location data. */
export function ImageField({ value, onChange, disabled, ratio }: { value: Img | null; onChange: (v: Img | null) => void; disabled?: boolean; ratio?: string }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function upload(file: File) {
    setErr(null)
    setBusy(true)
    try {
      const res = await uploadWebsiteImage(file)
      onChange({ url: res.url, alt: value?.alt ?? '' })
    } catch (e) {
      setErr(errMsg(e, 'Upload failed. Try again.'))
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start">
      {value?.url ? (
        <img className="w-40 rounded-lg border border-gray-200 dark:border-gray-700 object-cover" src={value.url} alt="" style={{ aspectRatio: ratio ?? '4 / 3' }} />
      ) : (
        <div
          className="w-40 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 text-gray-400"
          style={{ aspectRatio: ratio ?? '4 / 3' }}
        >
          <ImageIcon className="w-5 h-5" />
          <span className="text-xs">No image</span>
        </div>
      )}
      <div className="flex flex-col gap-2 flex-1 w-full">
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={disabled} loading={busy} onClick={() => input.current?.click()}>
            {!busy && <Upload className="w-4 h-4 mr-1" />}
            {busy ? 'Uploading…' : value?.url ? 'Replace' : 'Upload'}
          </Button>
          {value?.url && (
            <Button type="button" variant="ghost" size="sm" disabled={disabled || busy} onClick={() => onChange(null)}>
              Remove
            </Button>
          )}
        </div>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        {value?.url && (
          <input
            className="input w-full"
            placeholder="Describe the image for screen readers"
            aria-label="Image description (alt text)"
            maxLength={300}
            value={value.alt}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, alt: e.target.value })}
          />
        )}
        {err && <p className="form-error" role="alert">{err}</p>}
      </div>
    </div>
  )
}

function ImagesField({ value, onChange, disabled }: { value: Img[]; onChange: (v: Img[]) => void; disabled?: boolean }) {
  const set = (i: number, v: Img | null) => onChange(v ? value.map((x, j) => (j === i ? v : x)) : value.filter((_, j) => j !== i))
  return (
    <div className="flex flex-col gap-3">
      {value.map((img, i) => (
        <ImageField key={`${img.url}-${i}`} value={img} onChange={(v) => set(i, v)} disabled={disabled} ratio="1 / 1" />
      ))}
      {value.length < 8 && <ImageField value={null} onChange={(v) => v && onChange([...value, v])} disabled={disabled} ratio="1 / 1" />}
    </div>
  )
}

type Time = { label: string; day: string; time: string }
function TimesField({ value, onChange, disabled }: { value: Time[]; onChange: (v: Time[]) => void; disabled?: boolean }) {
  const set = (i: number, k: keyof Time, v: string) => onChange(value.map((t, j) => (j === i ? { ...t, [k]: v } : t)))
  return (
    <div className="flex flex-col gap-2">
      {value.map((t, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2">
          <input className="input w-full" aria-label="Service" placeholder="Sunday service" value={t.label} disabled={disabled} onChange={(e) => set(i, 'label', e.target.value)} />
          <input className="input w-full" aria-label="Day" placeholder="Sundays" value={t.day} disabled={disabled} onChange={(e) => set(i, 'day', e.target.value)} />
          <input className="input w-full" aria-label="Time" placeholder="9:00am" value={t.time} disabled={disabled} onChange={(e) => set(i, 'time', e.target.value)} />
          <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => onChange(value.filter((_, j) => j !== i))}>
            Remove
          </Button>
        </div>
      ))}
      <div>
        <Button type="button" variant="outline" size="sm" disabled={disabled || value.length >= 12} onClick={() => onChange([...value, { label: '', day: '', time: '' }])}>
          <Plus className="w-4 h-4 mr-1" /> Add a service time
        </Button>
      </div>
    </div>
  )
}
