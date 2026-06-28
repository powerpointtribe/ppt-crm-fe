import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { eventsService } from '@/services/events'
import { showToast } from '@/utils/toast'

export default function PublicTestimonyForm() {
  const { slug } = useParams<{ slug: string }>()
  const [eventInfo, setEventInfo] = useState<{
    event: { title: string; bannerImage?: string; description?: string }
    enabled: boolean
    formConfig?: any
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [anonymous, setAnonymous] = useState(false)
  const [fullName, setFullName] = useState('')
  const [testimony, setTestimony] = useState('')
  const [nameError, setNameError] = useState(false)
  const [storyError, setStoryError] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({})
  const [dynamicErrors, setDynamicErrors] = useState<Record<string, boolean>>({})
  const [hoverRating, setHoverRating] = useState(0)
  const htmlFormRef = useRef<HTMLDivElement | null>(null)

  const setupHtmlFormInteractivity = useCallback((container: HTMLDivElement | null) => {
    if (!container) return
    const ratingGroups = container.querySelectorAll('.rating-group')
    ratingGroups.forEach((group) => {
      const stars = group.querySelectorAll('.star-btn')
      stars.forEach((star) => {
        star.addEventListener('click', () => {
          const val = parseInt((star as HTMLElement).dataset.value || '0')
          stars.forEach((s, i) => {
            if (i < val) s.classList.add('active')
            else s.classList.remove('active')
          })
        })
      })
    })
  }, [])

  useEffect(() => {
    if (!slug) return
    const load = async () => {
      try {
        setLoading(true)
        const info = await eventsService.getTestimonyFormInfo(slug)
        setEventInfo(info)
        if (!info.enabled) {
          setError('The testimony form for this event is not currently active.')
        }
      } catch {
        setError('Event not found or testimony form is unavailable.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slug) return

    let ok = true
    if (!anonymous && !fullName.trim()) {
      setNameError(true)
      ok = false
    }
    if (!testimony.trim()) {
      setStoryError(true)
      ok = false
    }
    if (!ok) return

    setSubmitting(true)
    try {
      await eventsService.submitTestimony(slug, {
        fullName: anonymous ? 'Anonymous' : fullName.trim(),
        testimony: testimony.trim(),
        isAnonymous: anonymous,
      })
      setSubmitted(true)
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to submit testimony')
    } finally {
      setSubmitting(false)
    }
  }

  const rawFormConfig = eventInfo?.formConfig || null
  const formConfig = rawFormConfig && (rawFormConfig.htmlContent || rawFormConfig.fields?.length > 0)
    ? rawFormConfig
    : null
  const successHeading = formConfig?.successHeading || 'Thank you'
  const successMsg = formConfig?.successMessage || 'Your testimony has been received. May it bless everyone who hears it.'
  const btnText = formConfig?.submitButtonText || 'Share testimony'
  const showAnonymous = formConfig ? formConfig.allowAnonymous : true

  const handleDynamicSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slug || !formConfig) return

    const errs: Record<string, boolean> = {}
    for (const field of formConfig.fields || []) {
      if (field.required && !dynamicValues[field.key]?.toString().trim()) {
        errs[field.key] = true
      }
    }
    if (Object.keys(errs).length > 0) {
      setDynamicErrors(errs)
      return
    }

    setSubmitting(true)
    try {
      const nameField = (formConfig.fields || []).find((f: any) => f.type === 'text' && (f.key === 'fullName' || f.key === 'name'))
      const msgField = (formConfig.fields || []).find((f: any) => f.type === 'textarea')

      await eventsService.submitTestimony(slug, {
        fullName: anonymous ? 'Anonymous' : (dynamicValues[nameField?.key] || 'Anonymous'),
        testimony: dynamicValues[msgField?.key] || JSON.stringify(dynamicValues),
        isAnonymous: anonymous,
      })
      setSubmitted(true)
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to submit testimony')
    } finally {
      setSubmitting(false)
    }
  }

  const handleHtmlFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slug) return

    const container = htmlFormRef.current
    if (!container) return

    const inputs = container.querySelectorAll('input, textarea, select')
    const values: Record<string, string> = {}
    let hasRequired = true

    inputs.forEach((el: any) => {
      const fieldName = el.name || el.id
      if (!fieldName) return
      if (el.type === 'checkbox') {
        values[fieldName] = el.checked ? 'yes' : 'no'
      } else if (el.type === 'radio') {
        if (el.checked) values[fieldName] = el.value
      } else {
        values[fieldName] = el.value
      }
      if (el.required && !el.value?.trim()) {
        hasRequired = false
        el.style.borderColor = '#ef4444'
      }
    })

    if (!hasRequired) return

    setSubmitting(true)
    try {
      await eventsService.submitTestimony(slug, {
        fullName: values.fullName || values.name || 'Anonymous',
        testimony: values.testimony || values.message || JSON.stringify(values),
        isAnonymous: anonymous,
      })
      setSubmitted(true)
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to submit testimony')
    } finally {
      setSubmitting(false)
    }
  }

  const renderDynamicField = (field: any) => {
    const val = dynamicValues[field.key] ?? ''
    const hasErr = dynamicErrors[field.key]
    const isFocused = focusedField === field.key

    const onChange = (v: any) => {
      setDynamicValues((prev) => ({ ...prev, [field.key]: v }))
      setDynamicErrors((prev) => ({ ...prev, [field.key]: false }))
    }

    if (field.type === 'heading') {
      return (
        <div key={field.key} className="jt-field" style={{ paddingTop: 28 }}>
          <h3 style={{ fontFamily: 'var(--heading-font, inherit)', fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
            {field.label}
          </h3>
        </div>
      )
    }

    if (field.type === 'paragraph') {
      return (
        <div key={field.key} className="jt-field">
          <p style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.5, margin: 0, opacity: 0.85 }}>
            {field.label}
          </p>
        </div>
      )
    }

    if (field.type === 'rating') {
      const activeR = (focusedField === `${field.key}-hover` ? hoverRating : 0) || val || 0
      return (
        <div key={field.key} className="jt-field">
          <label>{field.label}{field.required && ' *'}</label>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 4 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  color: star <= activeR ? 'var(--accent)' : 'var(--muted)',
                  transition: 'color 0.15s',
                }}
                onClick={() => onChange(star)}
                onMouseEnter={() => { setHoverRating(star); setFocusedField(`${field.key}-hover`) }}
                onMouseLeave={() => { setHoverRating(0); setFocusedField(null) }}
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill={star <= activeR ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
            {val > 0 && (
              <span style={{ fontSize: 11, color: 'var(--accent)', marginLeft: 4 }}>
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][val]}
              </span>
            )}
          </div>
          {hasErr && <p className="jt-msg show">This field is required.</p>}
        </div>
      )
    }

    if (field.type === 'toggle') {
      return (
        <div key={field.key} className="jt-field">
          <div
            className={`jt-anon${val ? ' on' : ''}`}
            role="switch"
            aria-checked={!!val}
            tabIndex={0}
            onClick={() => onChange(!val)}
            onKeyDown={(ev) => { if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); onChange(!val) } }}
          >
            <span className="jt-track" aria-hidden="true" />
            <span>{field.label}</span>
          </div>
        </div>
      )
    }

    if (field.type === 'select') {
      return (
        <div key={field.key} className={`jt-field${hasErr ? ' jt-err' : ''}`}>
          <label>{field.label}{!field.required && <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 4 }}>(optional)</span>}</label>
          <select
            className={`jt-input${isFocused ? ' focused' : ''}${hasErr ? ' error' : ''}`}
            value={val}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocusedField(field.key)}
            onBlur={() => setFocusedField(null)}
          >
            <option value="">{field.placeholder || 'Select...'}</option>
            {(field.options || []).map((opt: any) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {hasErr && <p className="jt-msg show">This field is required.</p>}
        </div>
      )
    }

    if (field.type === 'radio') {
      return (
        <div key={field.key} className={`jt-field${hasErr ? ' jt-err' : ''}`}>
          <label>{field.label}{!field.required && <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 4 }}>(optional)</span>}</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
            {(field.options || []).map((opt: any) => (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}>
                <input
                  type="radio"
                  name={field.key}
                  value={opt.value}
                  checked={val === opt.value}
                  onChange={() => onChange(opt.value)}
                  style={{ accentColor: 'var(--accent)' }}
                />
                {opt.label}
              </label>
            ))}
          </div>
          {hasErr && <p className="jt-msg show">This field is required.</p>}
        </div>
      )
    }

    if (field.type === 'checkbox') {
      return (
        <div key={field.key} className="jt-field">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontSize: 14, fontWeight: 400, color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={!!val}
              onChange={(e) => onChange(e.target.checked)}
              style={{ accentColor: 'var(--accent)' }}
            />
            {field.label}
          </label>
        </div>
      )
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.key} className={`jt-field${hasErr ? ' jt-err' : ''}`}>
          <label>{field.label}{!field.required && <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 4 }}>(optional)</span>}</label>
          <textarea
            className={`jt-input${isFocused ? ' focused' : ''}${hasErr ? ' error' : ''}`}
            maxLength={field.validation?.maxLength || 3000}
            placeholder={field.placeholder}
            value={val}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocusedField(field.key)}
            onBlur={() => setFocusedField(null)}
          />
          {hasErr && <p className="jt-msg show">This field is required.</p>}
        </div>
      )
    }

    return (
      <div key={field.key} className={`jt-field${hasErr ? ' jt-err' : ''}`}>
        <label>{field.label}{!field.required && <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 4 }}>(optional)</span>}</label>
        <input
          type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : field.type === 'phone' ? 'tel' : field.type === 'date' ? 'date' : 'text'}
          className={`jt-input${isFocused ? ' focused' : ''}${hasErr ? ' error' : ''}`}
          placeholder={field.placeholder}
          value={val}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocusedField(field.key)}
          onBlur={() => setFocusedField(null)}
        />
        {field.helpText && <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{field.helpText}</p>}
        {hasErr && <p className="jt-msg show">This field is required.</p>}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="jt-page">
        <style>{styles}</style>
        <div className="jt-grain" />
        <div className="jt-card">
          <div style={{ padding: '60px 34px', textAlign: 'center' }}>
            <div className="jt-loader" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !eventInfo) {
    return (
      <div className="jt-page">
        <style>{styles}</style>
        <div className="jt-grain" />
        <div className="jt-card">
          <div className="jt-done">
            <div className="jt-tick jt-tick--err">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </div>
            <h2>Unavailable</h2>
            <p>{error || 'Something went wrong.'}</p>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="jt-page">
        <style>{styles}</style>
        <div className="jt-grain" />
        <div className="jt-card">
          <div className="jt-done">
            <div className="jt-tick">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h2>{successHeading}</h2>
            <p>{successMsg}</p>
            <button
              type="button"
              className="jt-again"
              onClick={() => {
                setSubmitted(false)
                setFullName('')
                setTestimony('')
                setAnonymous(false)
                setDynamicValues({})
                setDynamicErrors({})
              }}
            >
              Share another testimony
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { event } = eventInfo

  // HTML form rendering (when a form template with htmlContent is linked)
  if (formConfig && formConfig.htmlContent) {
    return (
      <div className="jt-page">
        <style>{styles}</style>
        <div className="jt-grain" />
        <main className="jt-card">
          <form onSubmit={handleHtmlFormSubmit} noValidate>
            <p className="jt-eyebrow">Share your story</p>
            <h1>{event.title}</h1>
            <p className="jt-sub">{formConfig.description || 'Tell us what God has done through this gathering.'}</p>

            {showAnonymous && (
              <div
                className={`jt-anon${anonymous ? ' on' : ''}`}
                role="switch"
                aria-checked={anonymous}
                tabIndex={0}
                onClick={() => setAnonymous(!anonymous)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setAnonymous(!anonymous) }
                }}
              >
                <span className="jt-track" aria-hidden="true" />
                <span>Share anonymously</span>
              </div>
            )}

            <div
              ref={(el) => { htmlFormRef.current = el; setupHtmlFormInteractivity(el) }}
              className="jt-html-form"
              dangerouslySetInnerHTML={{ __html: formConfig.htmlContent }}
            />

            <button className="jt-btn" type="submit" disabled={submitting}>
              <span>{submitting ? 'Sending…' : btnText}</span>
              {!submitting && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              )}
            </button>

            <p className="jt-foot">Your testimony may be shared to encourage others.</p>
          </form>
        </main>
      </div>
    )
  }

  // Dynamic form rendering (when a form template with structured fields is linked)
  if (formConfig && formConfig.fields?.length > 0) {
    return (
      <div className="jt-page">
        <style>{styles}</style>
        <div className="jt-grain" />
        <main className="jt-card">
          <form onSubmit={handleDynamicSubmit} noValidate>
            <p className="jt-eyebrow">Share your story</p>
            <h1>{event.title}</h1>
            <p className="jt-sub">{formConfig.description || 'Tell us what God has done through this gathering.'}</p>

            {showAnonymous && (
              <div
                className={`jt-anon${anonymous ? ' on' : ''}`}
                role="switch"
                aria-checked={anonymous}
                tabIndex={0}
                onClick={() => setAnonymous(!anonymous)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setAnonymous(!anonymous) }
                }}
              >
                <span className="jt-track" aria-hidden="true" />
                <span>Share anonymously</span>
              </div>
            )}

            {(formConfig.fields || [])
              .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
              .map((field: any) => renderDynamicField(field))}

            <button className="jt-btn" type="submit" disabled={submitting}>
              <span>{submitting ? 'Sending…' : btnText}</span>
              {!submitting && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              )}
            </button>

            <p className="jt-foot">Your testimony may be shared to encourage others.</p>
          </form>
        </main>
      </div>
    )
  }

  // Default hardcoded form (when no form template is linked)
  return (
    <div className="jt-page">
      <style>{styles}</style>
      <div className="jt-grain" />

      <main className="jt-card">
        <form onSubmit={handleSubmit} noValidate>
          <p className="jt-eyebrow">Share your story</p>
          <h1>{event.title}</h1>
          <p className="jt-sub">Tell us what God has done through this gathering.</p>

          {/* Anonymous toggle */}
          <div
            className={`jt-anon${anonymous ? ' on' : ''}`}
            role="switch"
            aria-checked={anonymous}
            tabIndex={0}
            onClick={() => {
              setAnonymous(!anonymous)
              if (!anonymous) setNameError(false)
            }}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault()
                setAnonymous(!anonymous)
                if (!anonymous) setNameError(false)
              }
            }}
          >
            <span className="jt-track" aria-hidden="true" />
            <span>Share anonymously</span>
          </div>

          {/* Name field */}
          <div className={`jt-collapse${anonymous ? ' hide' : ''}`}>
            <div className="jt-collapse-inner">
              <div className={`jt-field${nameError ? ' jt-err' : ''}`}>
                <label htmlFor="jt-name">Name</label>
                <input
                  id="jt-name"
                  type="text"
                  className={`jt-input${focusedField === 'name' ? ' focused' : ''}${nameError ? ' error' : ''}`}
                  placeholder="Your name"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setNameError(false) }}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />
                <p className={`jt-msg${nameError ? ' show' : ''}`}>
                  Add your name, or switch on anonymous.
                </p>
              </div>
            </div>
          </div>

          {/* Testimony */}
          <div className={`jt-field${storyError ? ' jt-err' : ''}`}>
            <label htmlFor="jt-story">Testimony</label>
            <textarea
              id="jt-story"
              className={`jt-input${focusedField === 'story' ? ' focused' : ''}${storyError ? ' error' : ''}`}
              maxLength={2000}
              placeholder="Share what God has done…"
              value={testimony}
              onChange={(e) => { setTestimony(e.target.value); setStoryError(false) }}
              onFocus={() => setFocusedField('story')}
              onBlur={() => setFocusedField(null)}
            />
            <div className="jt-meta">
              <span className="jt-count">{testimony.length}</span>
            </div>
            <p className={`jt-msg${storyError ? ' show' : ''}`}>
              Tell us a little about what happened.
            </p>
          </div>

          <button className="jt-btn" type="submit" disabled={submitting}>
            <span>{submitting ? 'Sending…' : 'Share testimony'}</span>
            {!submitting && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            )}
          </button>

          <p className="jt-foot">Your testimony may be shared to encourage others.</p>
        </form>
      </main>
    </div>
  )
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Hanken+Grotesk:ital,wght@0,100..900;1,100..900&display=swap');

  .jt-page {
    --bg: #0a1628;
    --bg-card: #0f1f38;
    --bg-elevated: #122442;
    --accent: #7eb8e0;
    --accent-light: #a4cfe9;
    --accent-dim: rgba(126, 184, 224, 0.08);
    --text: #f0f2f5;
    --text-secondary: #b0c4d8;
    --muted: rgba(176, 196, 216, 0.45);
    --border: rgba(255, 255, 255, 0.07);
    --border-strong: rgba(255, 255, 255, 0.14);
    --ease: cubic-bezier(0.4, 0, 0.2, 1);

    font-family: 'Hanken Grotesk', system-ui, -apple-system, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 18px;
    -webkit-font-smoothing: antialiased;
    position: relative;
    overflow: hidden;
  }

  .jt-page::before {
    content: "";
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 50% at 20% 80%, rgba(30, 70, 120, 0.35) 0%, transparent 70%),
      radial-gradient(ellipse 50% 40% at 80% 20%, rgba(40, 80, 140, 0.25) 0%, transparent 60%),
      radial-gradient(ellipse 80% 60% at 50% 100%, rgba(20, 50, 100, 0.3) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }

  .jt-grain {
    position: fixed;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    opacity: 0.035;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 256px 256px;
  }

  .jt-card {
    width: 100%;
    max-width: 420px;
    background: linear-gradient(170deg, rgba(18, 36, 66, 0.95) 0%, rgba(15, 31, 56, 0.98) 100%);
    border: 1px solid rgba(126, 184, 224, 0.12);
    border-radius: 0.75rem;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45), 0 0 60px rgba(30, 70, 130, 0.08);
    overflow: hidden;
    position: relative;
    z-index: 2;
    animation: jt-card-in 0.35s var(--ease);
    backdrop-filter: blur(12px);
  }

  .jt-card::before {
    content: "";
    display: block;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
    opacity: 0.5;
  }

  @keyframes jt-card-in {
    from { opacity: 0; transform: translateY(16px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .jt-card form { padding: 32px 28px 28px; }

  .jt-eyebrow {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--accent);
    margin: 0 0 10px;
  }

  .jt-card h1 {
    font-family: 'Cormorant Garamond', 'Georgia', serif;
    font-weight: 700;
    font-size: 34px;
    line-height: 1.1;
    margin: 0 0 8px;
    color: #ffffff;
    letter-spacing: 0.01em;
  }

  .jt-sub {
    font-size: 13px;
    line-height: 1.55;
    color: var(--text-secondary);
    margin: 0 0 28px;
    max-width: 32ch;
  }

  .jt-anon {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    user-select: none;
    margin-bottom: 8px;
  }

  .jt-track {
    position: relative;
    width: 36px;
    height: 20px;
    border-radius: 99px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid var(--border-strong);
    transition: background 0.25s var(--ease), border-color 0.25s var(--ease);
    flex: none;
  }

  .jt-track::after {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--text-secondary);
    transition: transform 0.25s var(--ease), background 0.25s var(--ease);
  }

  .jt-anon.on .jt-track {
    background: var(--accent-dim);
    border-color: rgba(126, 184, 224, 0.35);
  }

  .jt-anon.on .jt-track::after {
    transform: translateX(16px);
    background: var(--accent);
  }

  .jt-anon > span:last-child {
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
    transition: color 0.2s var(--ease);
  }

  .jt-anon.on > span:last-child { color: var(--text-secondary); }

  .jt-field { padding-top: 22px; }

  .jt-field label {
    display: block;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }

  .jt-input {
    width: 100%;
    font-family: inherit;
    font-size: 15px;
    color: var(--text);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--border);
    border-radius: 0.375rem;
    padding: 0.75rem 0.9rem;
    outline: none;
    transition: border-color 0.25s var(--ease), background 0.25s var(--ease), box-shadow 0.25s var(--ease);
  }

  .jt-input::placeholder { color: var(--muted); font-size: 14px; }

  .jt-input.focused {
    border-color: rgba(126, 184, 224, 0.45);
    background: rgba(255, 255, 255, 0.06);
    box-shadow: 0 0 0 3px rgba(126, 184, 224, 0.08);
  }

  .jt-input.error { border-color: #c0392b; }

  textarea.jt-input {
    resize: none;
    line-height: 1.55;
    min-height: 100px;
    display: block;
  }

  .jt-collapse {
    display: grid;
    grid-template-rows: 1fr;
    transition: grid-template-rows 0.35s 0.12s var(--ease), opacity 0.3s var(--ease);
  }

  .jt-collapse-inner { overflow: hidden; }

  .jt-collapse #jt-name {
    transition: filter 0.3s var(--ease), opacity 0.3s var(--ease);
  }

  .jt-collapse.hide { grid-template-rows: 0fr; opacity: 0; }

  .jt-collapse.hide #jt-name {
    filter: blur(4px);
    opacity: 0;
  }

  .jt-meta { display: flex; justify-content: flex-end; margin-top: 6px; }

  .jt-count {
    font-size: 11px;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .jt-msg {
    font-size: 11.5px;
    color: #e74c3c;
    margin-top: 6px;
    display: none;
  }

  .jt-msg.show { display: block; }

  .jt-btn {
    margin-top: 28px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #ffffff;
    background: linear-gradient(135deg, #1a4a7a 0%, #2568a8 100%);
    border: 1px solid rgba(126, 184, 224, 0.2);
    border-radius: 0.375rem;
    padding: 14px 20px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: background 0.3s var(--ease), transform 0.3s var(--ease), box-shadow 0.3s var(--ease);
  }

  .jt-btn:hover {
    background: linear-gradient(135deg, #1f5690 0%, #2d74b8 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(30, 80, 140, 0.3);
  }

  .jt-btn:active { transform: translateY(0) scale(0.98); }
  .jt-btn:disabled { opacity: 0.5; cursor: default; transform: none; box-shadow: none; }

  .jt-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 50%, transparent 100%);
    transform: translateX(-120%);
    transition: transform 0.6s var(--ease);
  }

  .jt-btn:hover::after { transform: translateX(120%); }
  .jt-btn svg { width: 14px; height: 14px; }

  .jt-foot {
    text-align: center;
    font-size: 11px;
    color: var(--muted);
    margin: 18px 0 0;
    letter-spacing: 0.01em;
  }

  .jt-done { padding: 56px 34px 52px; text-align: center; }

  .jt-tick {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    margin: 0 auto 22px;
    border: 1.5px solid var(--accent);
    color: var(--accent);
    display: grid;
    place-items: center;
    animation: jt-draw 0.4s var(--ease) both;
  }

  .jt-tick--err { border-color: #c0392b; color: #e74c3c; }
  .jt-tick svg { width: 22px; height: 22px; }

  .jt-done h2 {
    font-family: 'Cormorant Garamond', 'Georgia', serif;
    font-weight: 700;
    font-size: 24px;
    margin: 0 0 10px;
    color: #ffffff;
  }

  .jt-done p {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 0 auto;
    max-width: 28ch;
  }

  .jt-again {
    margin-top: 28px;
    background: none;
    border: 1px solid var(--border-strong);
    border-radius: 0.375rem;
    font-family: inherit;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-secondary);
    padding: 10px 20px;
    cursor: pointer;
    transition: border-color 0.25s var(--ease), color 0.25s var(--ease);
  }

  .jt-again:hover { border-color: rgba(126, 184, 224, 0.35); color: var(--accent); }

  .jt-loader {
    width: 22px;
    height: 22px;
    border: 1.5px solid var(--border-strong);
    border-top-color: var(--accent);
    border-radius: 50%;
    margin: 0 auto;
    animation: jt-spin 0.7s linear infinite;
  }

  @keyframes jt-draw {
    from { transform: scale(0.5); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  @keyframes jt-spin { to { transform: rotate(360deg); } }

  @media (prefers-reduced-motion: reduce) {
    .jt-page, .jt-page * {
      transition: none !important;
      animation: none !important;
    }
  }
`
