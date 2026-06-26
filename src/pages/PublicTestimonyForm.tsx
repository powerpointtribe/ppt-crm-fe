import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { eventsService } from '@/services/events'
import { showToast } from '@/utils/toast'

export default function PublicTestimonyForm() {
  const { slug } = useParams<{ slug: string }>()
  const [eventInfo, setEventInfo] = useState<{
    event: { title: string; bannerImage?: string; description?: string }
    enabled: boolean
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
            <h2>Thank you</h2>
            <p>Your testimony has been received. May it bless everyone who hears it.</p>
            <button
              type="button"
              className="jt-again"
              onClick={() => {
                setSubmitted(false)
                setFullName('')
                setTestimony('')
                setAnonymous(false)
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
  @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Hanken+Grotesk:ital,wght@0,100..900;1,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');

  .jt-page {
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

  /* Grain overlay */
  .jt-grain {
    position: fixed;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    opacity: 0.04;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 256px 256px;
  }

  /* Card */
  .jt-card {
    width: 100%;
    max-width: 420px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-strong);
    border-radius: 0.5rem;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    position: relative;
    z-index: 2;
    animation: jt-card-in 0.35s var(--ease);
  }

  .jt-card::before {
    content: "";
    display: block;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
  }

  @keyframes jt-card-in {
    from { opacity: 0; transform: translateY(16px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .jt-card form {
    padding: 32px 28px 28px;
  }

  /* Typography */
  .jt-eyebrow {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--gold);
    margin: 0 0 10px;
  }

  .jt-card h1 {
    font-family: 'Playfair Display', 'Georgia', serif;
    font-weight: 600;
    font-size: 28px;
    line-height: 1.1;
    margin: 0 0 8px;
    color: var(--text);
  }

  .jt-sub {
    font-size: 13px;
    line-height: 1.55;
    color: var(--text-secondary);
    margin: 0 0 28px;
    max-width: 32ch;
  }

  /* Anonymous toggle */
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
    background: rgba(255, 255, 255, 0.1);
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
    background: var(--gold-dim);
    border-color: rgba(201, 162, 75, 0.3);
  }

  .jt-anon.on .jt-track::after {
    transform: translateX(16px);
    background: var(--gold);
  }

  .jt-anon > span:last-child {
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
    transition: color 0.2s var(--ease);
  }

  .jt-anon.on > span:last-child {
    color: var(--text-secondary);
  }

  /* Fields */
  .jt-field {
    padding-top: 22px;
  }

  .jt-field label {
    display: block;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 8px;
  }

  .jt-input {
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

  .jt-input::placeholder {
    color: var(--muted);
    font-size: 14px;
  }

  .jt-input.focused {
    border-color: rgba(201, 162, 75, 0.4);
    background: rgba(255, 255, 255, 0.05);
    box-shadow: 0 0 0 3px rgba(201, 162, 75, 0.06);
  }

  .jt-input.error {
    border-color: #c0392b;
  }

  textarea.jt-input {
    resize: none;
    line-height: 1.55;
    min-height: 100px;
    display: block;
  }

  /* Name collapse */
  .jt-collapse {
    display: grid;
    grid-template-rows: 1fr;
    transition: grid-template-rows 0.35s 0.12s var(--ease), opacity 0.3s var(--ease);
  }

  .jt-collapse-inner {
    overflow: hidden;
  }

  .jt-collapse #jt-name {
    transition: filter 0.3s var(--ease), opacity 0.3s var(--ease);
  }

  .jt-collapse.hide {
    grid-template-rows: 0fr;
    opacity: 0;
  }

  .jt-collapse.hide #jt-name {
    filter: blur(4px);
    opacity: 0;
  }

  .jt-meta {
    display: flex;
    justify-content: flex-end;
    margin-top: 6px;
  }

  .jt-count {
    font-size: 11px;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  /* Error messages */
  .jt-msg {
    font-size: 11.5px;
    color: #e74c3c;
    margin-top: 6px;
    display: none;
  }

  .jt-msg.show {
    display: block;
  }

  /* Submit button */
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

  .jt-btn:hover {
    background: var(--gold-light);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(201, 162, 75, 0.2);
  }

  .jt-btn:active {
    transform: translateY(0) scale(0.98);
  }

  .jt-btn:disabled {
    opacity: 0.5;
    cursor: default;
    transform: none;
    box-shadow: none;
  }

  .jt-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
    transform: translateX(-120%);
    transition: transform 0.6s var(--ease);
  }

  .jt-btn:hover::after {
    transform: translateX(120%);
  }

  .jt-btn svg {
    width: 14px;
    height: 14px;
  }

  .jt-foot {
    text-align: center;
    font-size: 11px;
    color: var(--muted);
    margin: 18px 0 0;
    letter-spacing: 0.01em;
  }

  /* Success / Error states */
  .jt-done {
    padding: 56px 34px 52px;
    text-align: center;
  }

  .jt-tick {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    margin: 0 auto 22px;
    border: 1.5px solid var(--gold);
    color: var(--gold);
    display: grid;
    place-items: center;
    animation: jt-draw 0.4s var(--ease) both;
  }

  .jt-tick--err {
    border-color: #c0392b;
    color: #e74c3c;
  }

  .jt-tick svg {
    width: 22px;
    height: 22px;
  }

  .jt-done h2 {
    font-family: 'Playfair Display', 'Georgia', serif;
    font-weight: 600;
    font-size: 22px;
    margin: 0 0 10px;
    color: var(--text);
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

  .jt-again:hover {
    border-color: rgba(201, 162, 75, 0.3);
    color: var(--gold);
  }

  /* Loader */
  .jt-loader {
    width: 22px;
    height: 22px;
    border: 1.5px solid var(--border-strong);
    border-top-color: var(--gold);
    border-radius: 50%;
    margin: 0 auto;
    animation: jt-spin 0.7s linear infinite;
  }

  @keyframes jt-draw {
    from { transform: scale(0.5); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  @keyframes jt-spin {
    to { transform: rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    .jt-page, .jt-page * {
      transition: none !important;
      animation: none !important;
    }
  }
`
