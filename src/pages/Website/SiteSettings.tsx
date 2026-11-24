import { useEffect, useState, type ReactNode } from 'react'
import { Check, Plus } from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import { getSiteSettings, updateSiteSettings, WebsiteApiError, type SiteSettings as Settings, type ServiceLine } from '@/services/website-admin'
import { showToast } from '@/utils/toast'
import { ErrorNote, errMsg, FieldInput, ImageField, Loading, useWebsiteCan } from './shared'

const PLATFORMS: [string, string][] = [
  ['youtube', 'YouTube'], ['spotify', 'Spotify (podcast and Push Buttons)'], ['medium', 'Medium (Push Buttons)'], ['mixlr', 'Mixlr'],
  ['soundcloud', 'SoundCloud'], ['instagram', 'Instagram'], ['facebook', 'Facebook'], ['x', 'X'],
]
const INBOXES: [string, string][] = [['general', 'General enquiries'], ['finance', 'Finance'], ['welfare', 'Welfare / care'], ['media', 'Media requests']]

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        {hint && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

export default function SiteSettings() {
  const can = useWebsiteCan()
  const editable = can('U', 'site_settings')
  const [s, setS] = useState<Settings | null>(null)
  const [initial, setInitial] = useState<Settings | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    // Ignore a response that lands after unmount (or StrictMode's second mount),
    // so a late load can never overwrite what someone has started typing.
    let live = true
    getSiteSettings().then(
      (v) => live && (setS(v), setInitial(v)),
      (e: unknown) => live && setError(errMsg(e, 'Couldn’t load settings.')),
    )
    return () => {
      live = false
    }
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!s || !initial) return
    const changes: Partial<Settings> = {}
    for (const k of Object.keys(s) as (keyof Settings)[]) {
      if (JSON.stringify(s[k]) !== JSON.stringify(initial[k])) (changes as Record<string, unknown>)[k] = s[k]
    }
    if (!Object.keys(changes).length) {
      showToast.info('Nothing to save: no changes.')
      return
    }
    setBusy(true)
    setErrors({})
    setError(null)
    try {
      const saved = await updateSiteSettings(changes)
      setS(saved)
      setInitial(saved)
      showToast.success('Saved. The website updates within a minute.')
    } catch (err) {
      if (err instanceof WebsiteApiError) setErrors(err.fields)
      setError(errMsg(err, 'Couldn’t save.'))
    } finally {
      setBusy(false)
    }
  }

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => s && setS({ ...s, [k]: v })
  const strip = (i: number, k: keyof ServiceLine, v: string) => s && set('serviceStrip', s.serviceStrip.map((x, j) => (j === i ? { ...x, [k]: v } : x)))

  return (
    <Layout title="Site settings" subtitle="Links and details used across every page: the service strip, social and listening links, the home video and contact inboxes.">
      {!s ? (
        error ? <ErrorNote>{error}</ErrorNote> : <Loading />
      ) : (
        <form className="max-w-3xl space-y-6" onSubmit={save} noValidate>
          <fieldset disabled={!editable || busy} className="space-y-6">
            <Section title="Service strip">
              {s.serviceStrip.map((x, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2">
                  <input className="input" aria-label="Label" placeholder="Sunday service" value={x.label} onChange={(e) => strip(i, 'label', e.target.value)} />
                  <input className="input" aria-label="Day" placeholder="Sundays" value={x.day} onChange={(e) => strip(i, 'day', e.target.value)} />
                  <input className="input" aria-label="Time" placeholder="9:00am" value={x.time} onChange={(e) => strip(i, 'time', e.target.value)} />
                  <input className="input" aria-label="Note" placeholder="All campuses" value={x.note} onChange={(e) => strip(i, 'note', e.target.value)} />
                  <Button type="button" variant="ghost" size="sm" onClick={() => set('serviceStrip', s.serviceStrip.filter((_, j) => j !== i))}>
                    Remove
                  </Button>
                </div>
              ))}
              {errors.serviceStrip && <p className="form-error">{errors.serviceStrip}</p>}
              <Button type="button" variant="outline" size="sm" disabled={s.serviceStrip.length >= 8} onClick={() => set('serviceStrip', [...s.serviceStrip, { label: '', day: '', time: '', note: '' }])}>
                <Plus className="w-4 h-4 mr-1" /> Add a line
              </Button>
            </Section>

            <Section title="Listening and social links" hint="Empty links are hidden on the website (never a dead button).">
              {PLATFORMS.map(([k, label]) => (
                <FieldInput
                  key={k}
                  def={{ name: k, label, type: 'url' }}
                  value={s.platformUrls[k] ?? ''}
                  error={errors[`platformUrls.${k}`]}
                  onChange={(v) => set('platformUrls', { ...s.platformUrls, [k]: (v as string) || null })}
                />
              ))}
            </Section>

            <Section title="Home page video">
              <FieldInput
                def={{ name: 'hv', label: 'Video file link', type: 'url', help: 'An .mp4 link (https) or a path on the website.' }}
                value={s.heroVideo.url ?? ''}
                error={errors['heroVideo.url'] ?? errors.heroVideo}
                onChange={(v) => set('heroVideo', { ...s.heroVideo, url: (v as string) || null })}
              />
              <div className="form-group">
                <span className="label">Poster image (shown while the video loads)</span>
                <ImageField value={s.heroVideo.poster} ratio="16 / 9" onChange={(v) => set('heroVideo', { ...s.heroVideo, poster: v })} />
              </div>
            </Section>

            <Section title="Dates and inboxes">
              <FieldInput def={{ name: 'dc', label: 'Next David’s Company cohort starts', type: 'date' }} value={s.dcCohortDate} onChange={(v) => set('dcCohortDate', v as string | null)} />
              {INBOXES.map(([k, label]) => (
                <FieldInput
                  key={k}
                  def={{ name: k, label: `${label} email`, type: 'email', help: k === 'general' ? '“Send us an email” buttons stay hidden until an inbox is set.' : undefined }}
                  value={s.contactEmails[k] ?? ''}
                  error={errors[`contactEmails.${k}`]}
                  onChange={(v) => set('contactEmails', { ...s.contactEmails, [k]: (v as string) || null })}
                />
              ))}
            </Section>
          </fieldset>
          {error && <ErrorNote>{error}</ErrorNote>}
          {editable && (
            <Button type="submit" loading={busy}>
              {!busy && <Check className="w-4 h-4 mr-1" />}
              {busy ? 'Saving…' : 'Save settings'}
            </Button>
          )}
        </form>
      )}
    </Layout>
  )
}
