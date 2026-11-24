import { apiService } from './api'

/**
 * Website admin (the public site's content, inbox, lost & found and giving).
 *
 * Ported from the website's own admin BFF (Power_Point_Tribe_Frontend/src/app/admin/_bff):
 * the same crm-be endpoints and the same field translation, but called straight from the CRM.
 *
 * UI conventions: `id`, campus refs as `campusId`, images as `{ url, alt }`,
 * status draft | published | scheduled.
 * crm-be: `_id`, `branch`, flat `<name>Url`/`<name>Alt` strings, status
 * draft | published + optional future `publishAt` (= scheduled).
 */

export type Doc = Record<string, unknown>
export type Meta = { page: number; limit: number; total: number; totalPages: number }
export type ListResult<T> = { data: T[]; meta: Meta }

/* ─── errors ─────────────────────────────────────────────────────────── */

/** A failed call, with class-validator messages mapped to form fields. */
export class WebsiteApiError extends Error {
  constructor(message: string, readonly fields: Record<string, string> = {}, readonly status?: number) {
    super(message)
  }
}

type FieldMap = {
  /** UI field → crm-be field. */
  renames?: Record<string, string>
  /** UI image field → crm-be url (and optional alt) fields. */
  images?: Record<string, { url: string; alt?: string }>
  /** Has draft / published (+ publishAt = scheduled). */
  publishable?: boolean
}

/** Backend field path (from a validation message) → UI field name. */
function uiField(path: string, map: FieldMap): string {
  const [head, ...rest] = path.split('.')
  const back: Record<string, string> = Object.fromEntries(Object.entries(map.renames ?? {}).map(([ui, be]) => [be, ui]))
  for (const [ui, f] of Object.entries(map.images ?? {})) {
    back[f.url] = ui
    if (f.alt) back[f.alt] = ui
  }
  return [back[head] ?? head, ...rest].join('.')
}

/** apiService rejects with `{ message, code }`; NestJS validation sends `message` as a string[]. */
function toError(err: unknown, map: FieldMap = {}): WebsiteApiError {
  const e = (err ?? {}) as { message?: unknown; code?: unknown }
  const messages = Array.isArray(e.message)
    ? e.message.filter((m): m is string => typeof m === 'string')
    : typeof e.message === 'string'
      ? [e.message]
      : []
  const fields: Record<string, string> = {}
  for (const m of messages) {
    const match = /^([a-zA-Z][\w]*(?:\.[\w]+)*) (must|should|is|has|each)\b/.exec(m)
    if (match) {
      const path = uiField(match[1], map)
      fields[path] ??= m
      fields[path.split('.')[0]] ??= m
    }
  }
  const status = typeof e.code === 'number' ? e.code : undefined
  return new WebsiteApiError(messages[0] ?? 'Something went wrong. Please try again.', fields, status)
}

async function call<T>(fn: () => Promise<T>, map?: FieldMap): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    throw toError(err, map)
  }
}

/* ─── translation ────────────────────────────────────────────────────── */

const isObj = (v: unknown): v is Doc => !!v && typeof v === 'object' && !Array.isArray(v)
const idOf = (v: unknown): unknown => (isObj(v) && '_id' in v ? String(v._id) : v)

/** Unwrap `ResponseUtil.success(data)`; raw responses pass through. */
const unwrap = (body: unknown): unknown => (isObj(body) && 'success' in body && 'data' in body ? body.data : body)

/** Keys kept whole (not reduced to an id) when coming from crm-be. */
const KEEP = new Set(['website', 'address', 'pendingChange', 'contact', 'payload', 'source'])

/** crm-be doc → UI doc. */
export function fromBackend(doc: Doc, map: FieldMap, now = new Date()): Doc {
  const out: Doc = {}
  for (const [k, v] of Object.entries(doc)) {
    if (k === '_id') out.id = String(v)
    // Populated refs (branch, series, ...) become plain ids.
    else out[k] = Array.isArray(v) || KEEP.has(k) ? v : idOf(v)
  }
  for (const [ui, be] of Object.entries(map.renames ?? {})) {
    if (be in out) {
      out[ui] = out[be] ?? null
      delete out[be]
    }
  }
  for (const [ui, f] of Object.entries(map.images ?? {})) {
    const url = out[f.url]
    out[ui] = typeof url === 'string' && url ? { url, alt: (f.alt && typeof out[f.alt] === 'string' ? out[f.alt] : '') as string } : null
    delete out[f.url]
    if (f.alt) delete out[f.alt]
  }
  if (map.publishable && out.status === 'published' && typeof out.publishAt === 'string' && new Date(out.publishAt) > now) {
    out.status = 'scheduled'
  }
  if (isObj(out.pendingChange) && isObj(out.pendingChange.fields)) {
    const back = Object.fromEntries(Object.entries(map.renames ?? {}).map(([ui, be]) => [be, ui]))
    const fields = out.pendingChange.fields as Doc
    out.pendingChange = { ...out.pendingChange, fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [back[k] ?? k, v])) }
  }
  return out
}

/** UI body (only changed keys) → crm-be body. */
export function toBackend(body: Doc, map: FieldMap): Doc {
  const out: Doc = { ...body }
  for (const [ui, be] of Object.entries(map.renames ?? {})) {
    if (ui in out) {
      out[be] = out[ui] === '' ? null : out[ui]
      delete out[ui]
    }
  }
  for (const [ui, f] of Object.entries(map.images ?? {})) {
    if (!(ui in out)) continue
    const img = out[ui] as { url?: string; alt?: string } | null
    out[f.url] = img?.url || null
    if (f.alt) out[f.alt] = img?.url ? img.alt || null : null
    delete out[ui]
  }
  if (map.publishable && out.status === 'scheduled') out.status = 'published'
  return out
}

/** `{ "website.showOnWebsite": true }` → `{ showOnWebsite: true }` (only the prefix's keys). */
function nestedUnder(body: Doc, prefix: string): Doc {
  const out: Doc = {}
  for (const [k, v] of Object.entries(body)) {
    if (k.startsWith(`${prefix}.`)) out[k.slice(prefix.length + 1)] = v === '' ? null : v
    else if (k === prefix && isObj(v)) Object.assign(out, v)
  }
  return out
}

/** createPaginatedResult → `{ data, meta }`. */
function toList<T>(body: unknown, map: (d: Doc) => T): ListResult<T> {
  const p = (isObj(body) ? body : {}) as { data?: unknown[]; total?: number; page?: number; limit?: number; totalPages?: number }
  const rows = Array.isArray(body) ? body : p.data ?? []
  return {
    data: rows.map((d) => map(d as Doc)),
    meta: { page: p.page ?? 1, limit: p.limit ?? 20, total: p.total ?? rows.length, totalPages: Math.max(1, p.totalPages ?? 1) },
  }
}

const qs = (params: Record<string, unknown>) => {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') sp.set(k, String(v))
  const s = sp.toString()
  return s ? `?${s}` : ''
}

/* ─── generic resources ──────────────────────────────────────────────── */

type ResourceDef = {
  endpoint: string
  map: FieldMap
  /** Sent on create and used as a list filter (snippets: kind). */
  fixed?: Record<string, string>
  /** UI list query param → crm-be param. */
  query?: Record<string, string>
  /** Edit-only: website fields on a CRM record; no create/delete. */
  editOnly?: 'events' | 'campuses' | 'products'
}

const CAMPUS = { campusId: 'branch' }
const IMG = (url: string, alt?: string) => ({ url, ...(alt ? { alt } : {}) })
const CONTENT_QUERY = { q: 'search', status: 'status', page: 'page', limit: 'limit' }

const DEFS: Record<string, ResourceDef> = {
  sermons: {
    endpoint: '/website/sermons',
    map: { renames: { ...CAMPUS, seriesId: 'series', speakerId: 'speakerPastor' }, images: { thumbnail: IMG('thumbnailUrl') }, publishable: true },
    query: { ...CONTENT_QUERY, campusId: 'branch', seriesId: 'series', service: 'service' },
  },
  series: {
    endpoint: '/website/series',
    map: { renames: { service: 'serviceLabel' }, images: { artwork: IMG('artworkUrl', 'artworkAlt') }, publishable: true },
    query: CONTENT_QUERY,
  },
  devotionals: { endpoint: '/website/devotionals', map: { publishable: true }, query: CONTENT_QUERY },
  pastors: { endpoint: '/website/pastors', map: { renames: CAMPUS, images: { photo: IMG('photoUrl', 'photoAlt') }, publishable: true }, query: CONTENT_QUERY },
  testimonies: { endpoint: '/website/testimonies', map: { renames: CAMPUS, images: { image: IMG('imageUrl') }, publishable: true }, query: CONTENT_QUERY },
  units: { endpoint: '/website/snippets', fixed: { kind: 'unit' }, map: { publishable: true }, query: CONTENT_QUERY },
  'tribe-groups': { endpoint: '/website/snippets', fixed: { kind: 'tribe_group' }, map: { publishable: true }, query: CONTENT_QUERY },
  faqs: { endpoint: '/website/faqs', map: { publishable: true }, query: { ...CONTENT_QUERY, faqPage: 'faqPage' } },
  'giving-accounts': {
    endpoint: '/giving/accounts',
    map: { renames: CAMPUS },
    query: { q: 'search', page: 'page', limit: 'limit', currency: 'currency', approvalStatus: 'approvalStatus', campusId: 'branch' },
  },
  'lost-items': {
    endpoint: '/lost-found/items',
    map: { renames: CAMPUS, images: { photo: IMG('photoUrl') } },
    query: { q: 'search', page: 'page', limit: 'limit', status: 'status', type: 'type', campusId: 'branch' },
  },
  events: { endpoint: '/events', editOnly: 'events', map: {}, query: { q: 'search', page: 'page', limit: 'limit', status: 'status' } },
  campuses: { endpoint: '/branches', editOnly: 'campuses', map: {}, query: { q: 'search' } },
  products: { endpoint: '/store/products', editOnly: 'products', map: {}, query: { q: 'search', page: 'page', limit: 'limit' } },
}

/** Website fields staff may edit on a CRM product (price, stock, variants stay in the CRM store). */
const PRODUCT_KEYS = ['category', 'byline', 'badge', 'isFeatured'] as const

const defOf = (key: string) => {
  const d = DEFS[key]
  if (!d) throw new WebsiteApiError(`Unknown website resource "${key}".`)
  return d
}

function backendQuery(r: ResourceDef, ui: Record<string, string>) {
  const out: Record<string, string> = {}
  for (const [uiKey, beKey] of Object.entries(r.query ?? {})) {
    let v = ui[uiKey]
    if (!v) continue
    // UI "scheduled" = crm-be published (+ future publishAt).
    if (uiKey === 'status' && v === 'scheduled' && r.map.publishable) v = 'published'
    out[beKey] = v
  }
  return { ...out, ...r.fixed }
}

export async function listResource(key: string, params: Record<string, string>): Promise<ListResult<Doc>> {
  const def = defOf(key)
  const map = (d: Doc) => fromBackend(d, def.map)

  if (def.editOnly === 'campuses') {
    const body = await call(() => apiService.get('/branches'))
    const q = (params.q ?? '').toLowerCase()
    const all = ((unwrap(body) as Doc[]) ?? []).map(map).filter((b) => !q || String(b.name ?? '').toLowerCase().includes(q))
    all.sort((a, b) => Number((a.website as Doc | undefined)?.order ?? 0) - Number((b.website as Doc | undefined)?.order ?? 0))
    return { data: all, meta: { page: 1, limit: all.length || 1, total: all.length, totalPages: 1 } }
  }

  const body = await call(() => apiService.get(`${def.endpoint}${qs(backendQuery(def, params))}`), def.map)
  return toList(unwrap(body), map)
}

export async function getResource(key: string, id: string): Promise<Doc> {
  const def = defOf(key)
  const body = await call(() => apiService.get(`${def.endpoint}/${id}`), def.map)
  return fromBackend(unwrap(body) as Doc, def.map)
}

export async function createResource(key: string, ui: Doc): Promise<Doc> {
  const def = defOf(key)
  if (def.editOnly) throw new WebsiteApiError('These are created in the CRM.')
  const body = await call(() => apiService.post(def.endpoint, { ...toBackend(ui, def.map), ...def.fixed }), def.map)
  return fromBackend(unwrap(body) as Doc, def.map)
}

export async function updateResource(key: string, id: string, ui: Doc): Promise<Doc> {
  const def = defOf(key)
  let path = `${def.endpoint}/${id}`
  let payload: Doc
  switch (def.editOnly) {
    case 'events':
      path = `/events/${id}/website`
      payload = nestedUnder(ui, 'website')
      break
    case 'campuses':
      path = `/branches/${id}/website`
      payload = nestedUnder(ui, 'website')
      break
    case 'products':
      payload = Object.fromEntries(PRODUCT_KEYS.filter((k) => k in ui).map((k) => [k, ui[k] === '' ? null : ui[k]]))
      break
    default:
      payload = toBackend(ui, def.map)
  }
  if (!Object.keys(payload).length) throw new WebsiteApiError('Nothing to save: only the website fields can be changed here.')
  const body = await call(() => apiService.patch(path, payload), def.map)
  return fromBackend(unwrap(body) as Doc, def.map)
}

export async function deleteResource(key: string, id: string): Promise<void> {
  const def = defOf(key)
  if (def.editOnly) throw new WebsiteApiError('These are deleted in the CRM.')
  await call(() => apiService.delete(`${def.endpoint}/${id}`))
}

export async function decideGivingAccount(id: string, action: 'approve' | 'reject'): Promise<Doc> {
  const def = DEFS['giving-accounts']
  const body = await call(() => apiService.post(`/giving/accounts/${id}/${action}`), def.map)
  return fromBackend(unwrap(body) as Doc, def.map)
}

/* ─── lookups, summary, uploads ──────────────────────────────────────── */

export type LookupOption = { id: string; label: string; slug?: string }
export type Lookups = { campuses: LookupOption[]; series: LookupOption[]; pastors: LookupOption[] }

export async function getLookups(): Promise<Lookups> {
  const rows = async (path: string): Promise<Doc[]> => {
    try {
      const d = unwrap(await apiService.get(path))
      return (Array.isArray(d) ? d : isObj(d) && Array.isArray(d.data) ? d.data : []) as Doc[]
    } catch {
      return []
    }
  }
  const [branches, series, pastors] = await Promise.all([rows('/branches'), rows('/website/series?limit=100'), rows('/website/pastors?limit=100')])
  return {
    campuses: branches.map((b) => ({ id: String(b._id), label: String(b.name), slug: b.slug as string })),
    series: series.map((s) => ({ id: String(s._id), label: String(s.title), slug: s.slug as string })),
    pastors: pastors.map((p) => ({ id: String(p._id), label: String(p.name) })),
  }
}

export async function getSummary(): Promise<Record<string, number>> {
  try {
    return (unwrap(await apiService.get('/website/summary')) as Record<string, number>) ?? {}
  } catch (err) {
    // No dashboard permission at all: an empty dashboard, not an error.
    const e = toError(err)
    if (e.status === 403) return {}
    throw e
  }
}

export type MyLostItem = { id: string; description: string; foundOn: string; status: string }
export async function getMyLostItems(): Promise<MyLostItem[]> {
  const def = DEFS['lost-items']
  const body = await call(() => apiService.get('/lost-found/items/mine'))
  return ((unwrap(body) as Doc[]) ?? []).map((d) => fromBackend(d, def.map) as unknown as MyLostItem)
}

export async function uploadWebsiteImage(file: File): Promise<{ url: string }> {
  if (file.size > 15 * 1024 * 1024) throw new WebsiteApiError('Images must be 15 MB or smaller.')
  const form = new FormData()
  form.set('file', file)
  form.set('folder', 'admin')
  const body = await call(() => apiService.post('/upload/website-image', form, { headers: { 'Content-Type': 'multipart/form-data' } }))
  return { url: String((unwrap(body) as Doc).url) }
}

/* ─── site settings ──────────────────────────────────────────────────── */

export type ServiceLine = { label: string; day: string; time: string; note: string }
export type SiteSettings = {
  serviceStrip: ServiceLine[]
  platformUrls: Record<string, string | null>
  heroVideo: { url: string | null; poster: { url: string; alt: string } | null }
  dcCohortDate: string | null
  contactEmails: Record<string, string | null>
}

function settingsFromBackend(d: Doc): SiteSettings {
  const hv = (isObj(d.heroVideo) ? d.heroVideo : {}) as Doc
  return {
    serviceStrip: (Array.isArray(d.serviceStrip) ? (d.serviceStrip as ServiceLine[]) : []).map((x) => ({ ...x, note: x.note ?? '' })),
    platformUrls: (d.platformUrls as SiteSettings['platformUrls']) ?? {},
    heroVideo: { url: (hv.url as string) ?? null, poster: hv.posterUrl ? { url: String(hv.posterUrl), alt: String(hv.posterAlt ?? '') } : null },
    dcCohortDate: (d.dcCohortDate as string) ?? null,
    contactEmails: (d.contactEmails as SiteSettings['contactEmails']) ?? {},
  }
}

function settingsToBackend(ui: Partial<SiteSettings>): Doc {
  const out: Doc = {}
  for (const k of ['serviceStrip', 'platformUrls', 'dcCohortDate', 'contactEmails'] as const) if (k in ui) out[k] = ui[k]
  if (ui.serviceStrip) out.serviceStrip = ui.serviceStrip.map(({ label, day, time, note }) => ({ label, day, time, ...(note ? { note } : {}) }))
  if (ui.heroVideo) {
    const poster = ui.heroVideo.poster
    out.heroVideo = { url: ui.heroVideo.url || null, posterUrl: poster?.url || null, posterAlt: poster?.alt || null }
  }
  return out
}

export async function getSiteSettings(): Promise<SiteSettings> {
  return settingsFromBackend(unwrap(await call(() => apiService.get('/website/settings'))) as Doc)
}

export async function updateSiteSettings(changes: Partial<SiteSettings>): Promise<SiteSettings> {
  const body = await call(() => apiService.patch('/website/settings', settingsToBackend(changes)))
  return settingsFromBackend(unwrap(body) as Doc)
}

/* ─── form submissions ───────────────────────────────────────────────── */

export type Submission = {
  id: string
  formType: string
  status: string
  notes: string
  createdAt: string
  assignedTo: string | null
  contact: { name: string; email: string | null; phone: string | null }
  campus: string | null
  payload: Record<string, unknown>
}

function toSubmission(d: Doc): Submission {
  const contact = (isObj(d.contact) ? d.contact : {}) as Doc
  const branch = isObj(d.branch) ? d.branch : null
  return {
    id: String(d._id),
    formType: String(d.formType),
    status: String(d.status),
    notes: String(d.notes ?? ''),
    createdAt: String(d.createdAt),
    assignedTo: isObj(d.assignedTo) ? String(d.assignedTo._id) : ((d.assignedTo as string) ?? null),
    contact: { name: String(contact.name ?? ''), email: (contact.email as string) ?? null, phone: (contact.phone as string) ?? null },
    campus: branch ? String(branch.name) : null,
    payload: (d.payload as Record<string, unknown>) ?? {},
  }
}

export async function listSubmissions(params: { formType?: string; status?: string; page?: number; q?: string }) {
  const body = await call(() => apiService.get(`/website/submissions${qs({ formType: params.formType, status: params.status, page: params.page, search: params.q })}`))
  return toList(unwrap(body), toSubmission)
}

export async function updateSubmission(id: string, changes: { status?: string; notes?: string; assignedTo?: string | null }) {
  const payload = Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v === '' ? null : v]))
  return toSubmission(unwrap(await call(() => apiService.patch(`/website/submissions/${id}`, payload))) as Doc)
}

export async function deleteSubmission(id: string) {
  await call(() => apiService.delete(`/website/submissions/${id}`))
}

/* ─── lost item claims ───────────────────────────────────────────────── */

export type Claim = {
  id: string
  status: string
  proof: string
  createdAt: string
  claimant: { name: string; phone: string | null }
  item: { id: string; description: string; status: string } | null
}

function toClaim(d: Doc): Claim {
  const item = isObj(d.lostItem) ? d.lostItem : null
  return {
    id: String(d._id),
    status: String(d.status),
    proof: String(d.proof ?? ''),
    createdAt: String(d.createdAt),
    claimant: (d.claimant as Claim['claimant']) ?? { name: '', phone: null },
    item: item ? { id: String(item._id), description: String(item.description), status: String(item.status) } : null,
  }
}

export async function listClaims(params: { status?: string; page?: number }) {
  return toList(unwrap(await call(() => apiService.get(`/lost-found/claims${qs(params)}`))), toClaim)
}

export async function decideClaim(id: string, status: 'approved' | 'rejected') {
  await call(() => apiService.patch(`/lost-found/claims/${id}`, { status }))
}

/* ─── donations ──────────────────────────────────────────────────────── */

export type Donation = {
  id: string
  receiptNo: string
  fund: string
  amount: number
  currency: string
  campus: string | null
  donor: { name: string | null; email: string | null; phone: string | null }
  createdAt: string
}
export type DonationTotal = { currency: string; fund: string; total: number; count: number }
export type DonationFilter = { from?: string; to?: string; fund?: string; campusId?: string }

function toDonation(d: Doc): Donation {
  const branch = isObj(d.branch) ? d.branch : null
  const donor = (isObj(d.donor) ? d.donor : {}) as Doc
  return {
    id: String(d._id),
    receiptNo: String(d.receiptNo ?? d.reference ?? ''),
    fund: String(d.fund),
    amount: typeof d.amount === 'number' ? d.amount : 0,
    currency: String(d.currency ?? 'NGN'),
    campus: branch ? String(branch.name) : null,
    donor: { name: (donor.name as string) ?? null, email: (donor.email as string) ?? null, phone: (donor.phone as string) ?? null },
    createdAt: String(d.createdAt),
  }
}

const donationQuery = (f: DonationFilter) => ({ from: f.from, to: f.to, fund: f.fund, branch: f.campusId })

export async function listDonations(f: DonationFilter & { page?: number }) {
  // Receipts: only gifts the payment provider confirmed.
  const body = await call(() => apiService.get(`/giving/donations${qs({ ...donationQuery(f), page: f.page, status: 'successful' })}`))
  return toList(unwrap(body), toDonation)
}

export async function getDonationTotals(f: DonationFilter): Promise<DonationTotal[]> {
  const body = await call(() => apiService.get(`/giving/donations/totals${qs(donationQuery(f))}`))
  return ((unwrap(body) as Doc[]) ?? []).map((t) => ({ currency: String(t.currency), fund: String(t.fund), total: Number(t.total ?? 0), count: Number(t.count ?? 0) }))
}

/** Downloads the CSV (the endpoint needs the bearer token, so a plain link won't do). */
export async function exportDonations(f: DonationFilter) {
  const csv = await call(() => apiService.get<string>(`/giving/donations/export${qs({ ...donationQuery(f), status: 'successful' })}`, { responseType: 'text', headers: { Accept: 'text/csv, application/json' } }))
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'donations.csv'
  a.click()
  URL.revokeObjectURL(url)
}
