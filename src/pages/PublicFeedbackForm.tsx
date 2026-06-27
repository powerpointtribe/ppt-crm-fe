import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { eventsService } from '@/services/events'
import { showToast } from '@/utils/toast'

export default function PublicFeedbackForm() {
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
  const [email, setEmail] = useState('')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [message, setMessage] = useState('')
  const [nameError, setNameError] = useState(false)
  const [messageError, setMessageError] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({})
  const [dynamicErrors, setDynamicErrors] = useState<Record<string, boolean>>({})
  const htmlFormRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!slug) return
    const load = async () => {
      try {
        setLoading(true)
        const info: any = await eventsService.getFeedbackFormInfo(slug)
        setEventInfo(info)
        if (!info.enabled) {
          setError('The feedback form for this event is not currently active.')
        }
        if (info.formConfig?.allowAnonymous) {
          setAnonymous(false)
        }
      } catch {
        setError('Event not found or feedback form is unavailable.')
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
    if (!message.trim()) {
      setMessageError(true)
      ok = false
    }
    if (!ok) return

    setSubmitting(true)
    try {
      await eventsService.submitFeedback(slug, {
        fullName: anonymous ? 'Anonymous' : fullName.trim(),
        email: email.trim() || undefined,
        rating: rating || undefined,
        message: message.trim(),
        isAnonymous: anonymous,
      })
      setSubmitted(true)
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="jf-page">
        <style>{styles}</style>
        <div className="jf-grain" />
        <div className="jf-card">
          <div style={{ padding: '60px 34px', textAlign: 'center' }}>
            <div className="jf-loader" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !eventInfo) {
    return (
      <div className="jf-page">
        <style>{styles}</style>
        <div className="jf-grain" />
        <div className="jf-card">
          <div className="jf-done">
            <div className="jf-tick jf-tick--err">
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

  const rawFormConfig = eventInfo?.formConfig || null
  const formConfig = rawFormConfig && (rawFormConfig.htmlContent || rawFormConfig.fields?.length > 0)
    ? rawFormConfig
    : null
  const successHeading = formConfig?.successHeading || 'Thank you'
  const successMsg = formConfig?.successMessage || 'Your feedback has been received. We appreciate you taking the time.'
  const btnText = formConfig?.submitButtonText || 'Submit feedback'
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
      const emailField = (formConfig.fields || []).find((f: any) => f.type === 'email')
      const ratingField = (formConfig.fields || []).find((f: any) => f.type === 'rating')
      const msgField = (formConfig.fields || []).find((f: any) => f.type === 'textarea')

      await eventsService.submitFeedback(slug, {
        fullName: anonymous ? 'Anonymous' : (dynamicValues[nameField?.key] || 'Anonymous'),
        email: dynamicValues[emailField?.key] || undefined,
        rating: dynamicValues[ratingField?.key] || undefined,
        message: dynamicValues[msgField?.key] || JSON.stringify(dynamicValues),
        isAnonymous: anonymous,
      })
      setSubmitted(true)
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to submit feedback')
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

    const ratingGroups = container.querySelectorAll('.rating-group')
    ratingGroups.forEach((group: any) => {
      const rName = group.dataset.name || 'rating'
      const active = group.querySelector('.star-btn.active')
      if (active) values[rName] = active.dataset.value
    })

    if (!hasRequired) return

    setSubmitting(true)
    try {
      await eventsService.submitFeedback(slug, {
        fullName: values.fullName || values.name || 'Anonymous',
        email: values.email || undefined,
        rating: values.rating ? parseInt(values.rating) : undefined,
        message: values.message || values.feedback || JSON.stringify(values),
        isAnonymous: anonymous,
      })
      setSubmitted(true)
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

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
        <div key={field.key} className="jf-field" style={{ paddingTop: 28 }}>
          <h3 style={{ fontFamily: 'var(--heading-font, inherit)', fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
            {field.label}
          </h3>
        </div>
      )
    }

    if (field.type === 'paragraph') {
      return (
        <div key={field.key} className="jf-field">
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            {field.label}
          </p>
        </div>
      )
    }

    if (field.type === 'rating') {
      const activeR = (focusedField === `${field.key}-hover` ? hoverRating : 0) || val || 0
      return (
        <div key={field.key} className="jf-field">
          <label>{field.label}{field.required && ' *'}</label>
          <div className="jf-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`jf-star${star <= activeR ? ' active' : ''}`}
                onClick={() => onChange(star)}
                onMouseEnter={() => { setHoverRating(star); setFocusedField(`${field.key}-hover`) }}
                onMouseLeave={() => { setHoverRating(0); setFocusedField(null) }}
              >
                <svg viewBox="0 0 24 24" fill={star <= activeR ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
            {val > 0 && (
              <span className="jf-rating-label">
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][val]}
              </span>
            )}
          </div>
          {hasErr && <p className="jf-msg show">This field is required.</p>}
        </div>
      )
    }

    if (field.type === 'toggle') {
      return (
        <div key={field.key} className="jf-field">
          <div
            className={`jf-anon${val ? ' on' : ''}`}
            role="switch"
            aria-checked={!!val}
            tabIndex={0}
            onClick={() => onChange(!val)}
            onKeyDown={(ev) => { if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); onChange(!val) } }}
          >
            <span className="jf-track" aria-hidden="true" />
            <span>{field.label}</span>
          </div>
        </div>
      )
    }

    if (field.type === 'select') {
      return (
        <div key={field.key} className={`jf-field${hasErr ? ' jf-err' : ''}`}>
          <label>{field.label}{!field.required && <span className="jf-optional"> (optional)</span>}</label>
          <select
            className={`jf-input${isFocused ? ' focused' : ''}${hasErr ? ' error' : ''}`}
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
          {hasErr && <p className="jf-msg show">This field is required.</p>}
        </div>
      )
    }

    if (field.type === 'radio') {
      return (
        <div key={field.key} className={`jf-field${hasErr ? ' jf-err' : ''}`}>
          <label>{field.label}{!field.required && <span className="jf-optional"> (optional)</span>}</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
            {(field.options || []).map((opt: any) => (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}>
                <input
                  type="radio"
                  name={field.key}
                  value={opt.value}
                  checked={val === opt.value}
                  onChange={() => onChange(opt.value)}
                  style={{ accentColor: 'var(--gold, var(--primary, #0D7770))' }}
                />
                {opt.label}
              </label>
            ))}
          </div>
          {hasErr && <p className="jf-msg show">This field is required.</p>}
        </div>
      )
    }

    if (field.type === 'checkbox') {
      return (
        <div key={field.key} className="jf-field">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontSize: 14, fontWeight: 400, color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={!!val}
              onChange={(e) => onChange(e.target.checked)}
              style={{ accentColor: 'var(--gold, var(--primary, #0D7770))' }}
            />
            {field.label}
          </label>
        </div>
      )
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.key} className={`jf-field${hasErr ? ' jf-err' : ''}`}>
          <label>{field.label}{!field.required && <span className="jf-optional"> (optional)</span>}</label>
          <textarea
            className={`jf-input${isFocused ? ' focused' : ''}${hasErr ? ' error' : ''}`}
            maxLength={field.validation?.maxLength || 3000}
            placeholder={field.placeholder}
            value={val}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocusedField(field.key)}
            onBlur={() => setFocusedField(null)}
          />
          {hasErr && <p className="jf-msg show">This field is required.</p>}
        </div>
      )
    }

    return (
      <div key={field.key} className={`jf-field${hasErr ? ' jf-err' : ''}`}>
        <label>{field.label}{!field.required && <span className="jf-optional"> (optional)</span>}</label>
        <input
          type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : field.type === 'phone' ? 'tel' : field.type === 'date' ? 'date' : 'text'}
          className={`jf-input${isFocused ? ' focused' : ''}${hasErr ? ' error' : ''}`}
          placeholder={field.placeholder}
          value={val}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocusedField(field.key)}
          onBlur={() => setFocusedField(null)}
        />
        {field.helpText && <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{field.helpText}</p>}
        {hasErr && <p className="jf-msg show">This field is required.</p>}
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="jf-page">
        <style>{styles}</style>
        <div className="jf-grain" />
        <div className="jf-card">
          <div className="jf-done">
            <div className="jf-tick">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h2>{successHeading}</h2>
            <p>{successMsg}</p>
            <button
              type="button"
              className="jf-again"
              onClick={() => {
                setSubmitted(false)
                setFullName('')
                setEmail('')
                setRating(0)
                setMessage('')
                setAnonymous(false)
                setDynamicValues({})
                setDynamicErrors({})
              }}
            >
              Submit more feedback
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { event } = eventInfo
  const activeRating = hoverRating || rating

  // HTML form rendering (when a form template with htmlContent is linked)
  if (formConfig && formConfig.htmlContent) {
    return (
      <div className="jf-page">
        <style>{styles}</style>
        <div className="jf-grain" />
        <main className="jf-card">
          <form onSubmit={handleHtmlFormSubmit} noValidate>
            <p className="jf-eyebrow">We'd love your feedback</p>
            <h1>{event.title}</h1>
            <p className="jf-sub">{formConfig.description || 'Help us improve by sharing your experience.'}</p>

            {showAnonymous && (
              <div
                className={`jf-anon${anonymous ? ' on' : ''}`}
                role="switch"
                aria-checked={anonymous}
                tabIndex={0}
                onClick={() => setAnonymous(!anonymous)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setAnonymous(!anonymous) }
                }}
              >
                <span className="jf-track" aria-hidden="true" />
                <span>Share anonymously</span>
              </div>
            )}

            <div
              ref={(el) => { htmlFormRef.current = el; setupHtmlFormInteractivity(el) }}
              className="jf-html-form"
              dangerouslySetInnerHTML={{ __html: formConfig.htmlContent }}
            />

            <button className="jf-btn" type="submit" disabled={submitting}>
              <span>{submitting ? 'Sending…' : btnText}</span>
              {!submitting && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              )}
            </button>

            <p className="jf-foot">Your feedback helps us create better experiences.</p>
          </form>
        </main>
      </div>
    )
  }

  // Dynamic form rendering (when a form template with structured fields is linked)
  if (formConfig && formConfig.fields?.length > 0) {
    return (
      <div className="jf-page">
        <style>{styles}</style>
        <div className="jf-grain" />
        <main className="jf-card">
          <form onSubmit={handleDynamicSubmit} noValidate>
            <p className="jf-eyebrow">We'd love your feedback</p>
            <h1>{event.title}</h1>
            <p className="jf-sub">{formConfig.description || 'Help us improve by sharing your experience.'}</p>

            {showAnonymous && (
              <div
                className={`jf-anon${anonymous ? ' on' : ''}`}
                role="switch"
                aria-checked={anonymous}
                tabIndex={0}
                onClick={() => setAnonymous(!anonymous)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setAnonymous(!anonymous) }
                }}
              >
                <span className="jf-track" aria-hidden="true" />
                <span>Share anonymously</span>
              </div>
            )}

            {(formConfig.fields || [])
              .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
              .map((field: any) => renderDynamicField(field))}

            <button className="jf-btn" type="submit" disabled={submitting}>
              <span>{submitting ? 'Sending…' : btnText}</span>
              {!submitting && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              )}
            </button>

            <p className="jf-foot">Your feedback helps us create better experiences.</p>
          </form>
        </main>
      </div>
    )
  }

  // Default hardcoded form (when no form template is linked)
  return (
    <div className="jf-page">
      <style>{styles}</style>
      <div className="jf-grain" />

      <main className="jf-card">
        <form onSubmit={handleSubmit} noValidate>
          <p className="jf-eyebrow">We'd love your feedback</p>
          <h1>{event.title}</h1>
          <p className="jf-sub">Help us improve by sharing your experience.</p>

          {/* Anonymous toggle */}
          <div
            className={`jf-anon${anonymous ? ' on' : ''}`}
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
            <span className="jf-track" aria-hidden="true" />
            <span>Share anonymously</span>
          </div>

          {/* Name + Email (collapse when anonymous) */}
          <div className={`jf-collapse${anonymous ? ' hide' : ''}`}>
            <div className="jf-collapse-inner">
              <div className={`jf-field${nameError ? ' jf-err' : ''}`}>
                <label htmlFor="jf-name">Name</label>
                <input
                  id="jf-name"
                  type="text"
                  className={`jf-input${focusedField === 'name' ? ' focused' : ''}${nameError ? ' error' : ''}`}
                  placeholder="Your name"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setNameError(false) }}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />
                <p className={`jf-msg${nameError ? ' show' : ''}`}>
                  Add your name, or switch on anonymous.
                </p>
              </div>

              <div className="jf-field">
                <label htmlFor="jf-email">Email <span className="jf-optional">(optional)</span></label>
                <input
                  id="jf-email"
                  type="email"
                  className={`jf-input${focusedField === 'email' ? ' focused' : ''}`}
                  placeholder="your@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
            </div>
          </div>

          {/* Star Rating */}
          <div className="jf-field">
            <label>How would you rate the event?</label>
            <div className="jf-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`jf-star${star <= activeRating ? ' active' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}
                >
                  <svg viewBox="0 0 24 24" fill={star <= activeRating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
              {rating > 0 && (
                <span className="jf-rating-label">
                  {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
                </span>
              )}
            </div>
          </div>

          {/* Message */}
          <div className={`jf-field${messageError ? ' jf-err' : ''}`}>
            <label htmlFor="jf-message">Your Feedback</label>
            <textarea
              id="jf-message"
              className={`jf-input${focusedField === 'message' ? ' focused' : ''}${messageError ? ' error' : ''}`}
              maxLength={3000}
              placeholder="What did you enjoy? What could we improve?"
              value={message}
              onChange={(e) => { setMessage(e.target.value); setMessageError(false) }}
              onFocus={() => setFocusedField('message')}
              onBlur={() => setFocusedField(null)}
            />
            <div className="jf-meta">
              <span className="jf-count">{message.length}</span>
            </div>
            <p className={`jf-msg${messageError ? ' show' : ''}`}>
              Please share your thoughts.
            </p>
          </div>

          <button className="jf-btn" type="submit" disabled={submitting}>
            <span>{submitting ? 'Sending…' : btnText}</span>
            {!submitting && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            )}
          </button>

          <p className="jf-foot">Your feedback helps us create better experiences.</p>
        </form>
      </main>
    </div>
  )
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Hanken+Grotesk:ital,wght@0,100..900;1,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');

  .jf-page {
    --bg: #0B0B0F;
    --bg-card: #131318;
    --bg-elevated: #1b1b20;
    --gold: #C9A24B;
    --gold-light: #d4b06a;
    --gold-dim: rgba(201, 162, 75, 0.08);
    --text: #e4e1e8;
    --text-secondary: #d1c5b2;
    --muted: rgba(209, 197, 178, 0.4);
    --border: rgba(255, 255, 255, 0.06);
    --border-strong: rgba(255, 255, 255, 0.12);
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
  }

  .jf-grain {
    position: fixed;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    opacity: 0.04;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 256px 256px;
  }

  .jf-card {
    width: 100%;
    max-width: 420px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-strong);
    border-radius: 0.5rem;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    position: relative;
    z-index: 2;
    animation: jf-card-in 0.35s var(--ease);
  }

  .jf-card::before {
    content: "";
    display: block;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
  }

  @keyframes jf-card-in {
    from { opacity: 0; transform: translateY(16px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .jf-card form { padding: 32px 28px 28px; }

  .jf-eyebrow {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--gold);
    margin: 0 0 10px;
  }

  .jf-card h1 {
    font-family: 'Playfair Display', 'Georgia', serif;
    font-weight: 600;
    font-size: 28px;
    line-height: 1.1;
    margin: 0 0 8px;
    color: var(--text);
  }

  .jf-sub {
    font-size: 13px;
    line-height: 1.55;
    color: var(--text-secondary);
    margin: 0 0 28px;
    max-width: 32ch;
  }

  .jf-anon {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    user-select: none;
    margin-bottom: 8px;
  }

  .jf-track {
    position: relative;
    width: 36px;
    height: 20px;
    border-radius: 99px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--border-strong);
    transition: background 0.25s var(--ease), border-color 0.25s var(--ease);
    flex: none;
  }

  .jf-track::after {
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

  .jf-anon.on .jf-track {
    background: var(--gold-dim);
    border-color: rgba(201, 162, 75, 0.3);
  }

  .jf-anon.on .jf-track::after {
    transform: translateX(16px);
    background: var(--gold);
  }

  .jf-anon > span:last-child {
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
    transition: color 0.2s var(--ease);
  }

  .jf-anon.on > span:last-child { color: var(--text-secondary); }

  .jf-field { padding-top: 22px; }

  .jf-field label {
    display: block;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 8px;
  }

  .jf-optional {
    text-transform: none;
    letter-spacing: 0;
    font-weight: 400;
    opacity: 0.6;
  }

  .jf-input {
    width: 100%;
    font-family: inherit;
    font-size: 15px;
    color: var(--text);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border);
    border-radius: 0.25rem;
    padding: 0.75rem 0.9rem;
    outline: none;
    transition: border-color 0.25s var(--ease), background 0.25s var(--ease), box-shadow 0.25s var(--ease);
  }

  .jf-input::placeholder { color: var(--muted); font-size: 14px; }

  .jf-input.focused {
    border-color: rgba(201, 162, 75, 0.4);
    background: rgba(255, 255, 255, 0.05);
    box-shadow: 0 0 0 3px rgba(201, 162, 75, 0.06);
  }

  .jf-input.error { border-color: #c0392b; }

  textarea.jf-input {
    resize: none;
    line-height: 1.55;
    min-height: 100px;
    display: block;
  }

  .jf-collapse {
    display: grid;
    grid-template-rows: 1fr;
    transition: grid-template-rows 0.35s 0.12s var(--ease), opacity 0.3s var(--ease);
  }

  .jf-collapse-inner { overflow: hidden; }

  .jf-collapse #jf-name,
  .jf-collapse #jf-email {
    transition: filter 0.3s var(--ease), opacity 0.3s var(--ease);
  }

  .jf-collapse.hide { grid-template-rows: 0fr; opacity: 0; }

  .jf-collapse.hide #jf-name,
  .jf-collapse.hide #jf-email {
    filter: blur(4px);
    opacity: 0;
  }

  .jf-meta { display: flex; justify-content: flex-end; margin-top: 6px; }

  .jf-count {
    font-size: 11px;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .jf-msg {
    font-size: 11.5px;
    color: #e74c3c;
    margin-top: 6px;
    display: none;
  }

  .jf-msg.show { display: block; }

  /* Star rating */
  .jf-stars {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .jf-star {
    background: none;
    border: none;
    padding: 2px;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.15);
    transition: color 0.15s var(--ease), transform 0.15s var(--ease);
  }

  .jf-star svg { width: 24px; height: 24px; }

  .jf-star.active { color: var(--gold); }
  .jf-star:hover { transform: scale(1.15); }

  .jf-rating-label {
    font-size: 12px;
    color: var(--gold);
    margin-left: 8px;
    font-weight: 500;
  }

  /* Button */
  .jf-btn {
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
    color: #0B0B0F;
    background: var(--gold);
    border: none;
    border-radius: 0.25rem;
    padding: 14px 20px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: background 0.3s var(--ease), transform 0.3s var(--ease), box-shadow 0.3s var(--ease);
  }

  .jf-btn:hover {
    background: var(--gold-light);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(201, 162, 75, 0.2);
  }

  .jf-btn:active { transform: translateY(0) scale(0.98); }
  .jf-btn:disabled { opacity: 0.5; cursor: default; transform: none; box-shadow: none; }

  .jf-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
    transform: translateX(-120%);
    transition: transform 0.6s var(--ease);
  }

  .jf-btn:hover::after { transform: translateX(120%); }
  .jf-btn svg { width: 14px; height: 14px; }

  .jf-foot {
    text-align: center;
    font-size: 11px;
    color: var(--muted);
    margin: 18px 0 0;
    letter-spacing: 0.01em;
  }

  .jf-done { padding: 56px 34px 52px; text-align: center; }

  .jf-tick {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    margin: 0 auto 22px;
    border: 1.5px solid var(--gold);
    color: var(--gold);
    display: grid;
    place-items: center;
    animation: jf-draw 0.4s var(--ease) both;
  }

  .jf-tick--err { border-color: #c0392b; color: #e74c3c; }
  .jf-tick svg { width: 22px; height: 22px; }

  .jf-done h2 {
    font-family: 'Playfair Display', 'Georgia', serif;
    font-weight: 600;
    font-size: 22px;
    margin: 0 0 10px;
    color: var(--text);
  }

  .jf-done p {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 0 auto;
    max-width: 30ch;
  }

  .jf-again {
    margin-top: 28px;
    background: none;
    border: 1px solid var(--border-strong);
    border-radius: 0.25rem;
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

  .jf-again:hover { border-color: rgba(201, 162, 75, 0.3); color: var(--gold); }

  .jf-loader {
    width: 22px;
    height: 22px;
    border: 1.5px solid var(--border-strong);
    border-top-color: var(--gold);
    border-radius: 50%;
    margin: 0 auto;
    animation: jf-spin 0.7s linear infinite;
  }

  @keyframes jf-draw {
    from { transform: scale(0.5); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  @keyframes jf-spin { to { transform: rotate(360deg); } }

  /* HTML form injection styles */
  .jf-html-form .form-group {
    margin-bottom: 20px;
  }

  .jf-html-form label {
    display: block;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-secondary);
    margin-bottom: 7px;
  }

  .jf-html-form .required { color: #ef4444; }
  .jf-html-form .optional { font-weight: 400; opacity: 0.5; text-transform: none; letter-spacing: 0; }

  .jf-html-form input[type="text"],
  .jf-html-form input[type="email"],
  .jf-html-form input[type="tel"],
  .jf-html-form input[type="number"],
  .jf-html-form input[type="date"],
  .jf-html-form select,
  .jf-html-form textarea {
    width: 100%;
    padding: 11px 14px;
    font-size: 14px;
    font-family: 'Hanken Grotesk', system-ui, sans-serif;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border-strong);
    border-radius: 0.5rem;
    outline: none;
    transition: border-color 0.25s var(--ease), box-shadow 0.25s var(--ease);
    box-sizing: border-box;
  }

  .jf-html-form input:focus,
  .jf-html-form select:focus,
  .jf-html-form textarea:focus {
    border-color: var(--gold);
    box-shadow: 0 0 0 2px var(--gold-dim);
  }

  .jf-html-form textarea {
    resize: vertical;
    min-height: 80px;
  }

  .jf-html-form select {
    appearance: none;
    cursor: pointer;
  }

  .jf-html-form .rating-group {
    display: flex;
    gap: 8px;
  }

  .jf-html-form .star-btn {
    width: 36px;
    height: 36px;
    font-size: 20px;
    line-height: 1;
    background: transparent;
    border: 1px solid var(--border-strong);
    color: var(--muted);
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.15s var(--ease);
  }

  .jf-html-form .star-btn:hover,
  .jf-html-form .star-btn.active {
    color: var(--gold);
    border-color: var(--gold);
    background: var(--gold-dim);
  }

  .jf-html-form input[type="checkbox"],
  .jf-html-form input[type="radio"] {
    accent-color: var(--gold);
  }

  .jf-html-form .checkbox-label,
  .jf-html-form .radio-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 400;
    text-transform: none;
    letter-spacing: 0;
    color: var(--text-secondary);
    cursor: pointer;
    margin-bottom: 6px;
  }

  .jf-html-form h2, .jf-html-form h3, .jf-html-form h4 {
    font-family: 'Playfair Display', serif;
    color: var(--text);
    margin: 20px 0 8px;
  }

  .jf-html-form p {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  @media (prefers-reduced-motion: reduce) {
    .jf-page, .jf-page * { transition: none !important; animation: none !important; }
  }
`
