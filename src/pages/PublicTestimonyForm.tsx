import { useState, useEffect, useRef } from 'react'
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
  const cardRef = useRef<HTMLDivElement>(null)

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
      <div className="testimony-page">
        <style>{styles}</style>
        <div className="card">
          <div style={{ padding: '60px 34px', textAlign: 'center' }}>
            <div className="loader" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !eventInfo) {
    return (
      <div className="testimony-page">
        <style>{styles}</style>
        <div className="card">
          <div className="done">
            <div className="tick err-tick">
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
      <div className="testimony-page">
        <style>{styles}</style>
        <div className="card" ref={cardRef}>
          <div className="done">
            <div className="tick">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h2>Thank you</h2>
            <p>Your testimony has been received. May it bless everyone who hears it.</p>
            <button
              type="button"
              className="again"
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
    <div className="testimony-page">
      <style>{styles}</style>
      <main className="card" ref={cardRef}>
        <form onSubmit={handleSubmit} noValidate>
          <p className="eyebrow">Share your story</p>
          <h1>{event.title}</h1>
          <p className="sub">Tell us what God has done through this gathering.</p>

          {/* Anonymous toggle */}
          <div
            className={`anon${anonymous ? ' on' : ''}`}
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
            <span className="track" aria-hidden="true" />
            <span>Share anonymously</span>
          </div>

          {/* Name field (collapses when anonymous) */}
          <div className={`collapse${anonymous ? ' hide' : ''}`}>
            <div className="inner">
              <div className={`field${nameError ? ' errline' : ''}`}>
                <label htmlFor="nameInput">Name</label>
                <div className={`input-wrap${focusedField === 'name' ? ' focused' : ''}`}>
                  <input
                    id="nameInput"
                    type="text"
                    placeholder="Your name"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value)
                      setNameError(false)
                    }}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
                <p className={`msg${nameError ? ' show' : ''}`}>
                  Add your name, or switch on anonymous.
                </p>
              </div>
            </div>
          </div>

          {/* Testimony */}
          <div className={`field${storyError ? ' errline' : ''}`}>
            <label htmlFor="story">Testimony</label>
            <div className={`input-wrap${focusedField === 'story' ? ' focused' : ''}`}>
              <textarea
                id="story"
                maxLength={2000}
                placeholder="Share what God has done…"
                value={testimony}
                onChange={(e) => {
                  setTestimony(e.target.value)
                  setStoryError(false)
                }}
                onFocus={() => setFocusedField('story')}
                onBlur={() => setFocusedField(null)}
              />
            </div>
            <div className="meta">
              <span className="count">{testimony.length}</span>
            </div>
            <p className={`msg${storyError ? ' show' : ''}`}>
              Tell us a little about what happened.
            </p>
          </div>

          <button className="go" type="submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Share testimony'}
            {!submitting && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            )}
          </button>

          <p className="foot">Your testimony may be shared to encourage others.</p>
        </form>
      </main>
    </div>
  )
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');

  .testimony-page {
    --ink: #17161c;
    --soft: #6b6975;
    --faint: #a3a1ad;
    --line: #e4e3e8;
    --line-dark: #cdccd4;
    --paper: #ffffff;
    --canvas: #f4f3f1;
    --accent: #4b3bd6;
    --radius: 18px;

    font-family: "Inter", system-ui, -apple-system, sans-serif;
    background: var(--canvas);
    color: var(--ink);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 18px;
    -webkit-font-smoothing: antialiased;
  }

  .testimony-page .card {
    width: 100%;
    max-width: 400px;
    background: var(--paper);
    border-radius: var(--radius);
    border: 1px solid var(--line);
    box-shadow: 0 18px 50px -34px rgba(20, 18, 40, 0.35);
    overflow: hidden;
  }

  .testimony-page .card::before {
    content: "";
    display: block;
    height: 3px;
    background: linear-gradient(90deg, var(--accent), #7b6cf0 60%, var(--accent));
  }

  .testimony-page form {
    padding: 30px 30px 26px;
  }

  .testimony-page .eyebrow {
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--faint);
    margin: 0 0 9px;
  }

  .testimony-page h1 {
    font-family: "Fraunces", serif;
    font-weight: 600;
    font-size: 27px;
    line-height: 1.1;
    margin: 0 0 6px;
    color: var(--ink);
  }

  .testimony-page .sub {
    font-size: 13px;
    line-height: 1.5;
    color: var(--soft);
    margin: 0 0 26px;
    max-width: 32ch;
  }

  /* Anonymous toggle */
  .testimony-page .anon {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    cursor: pointer;
    user-select: none;
    margin-bottom: 6px;
  }

  .testimony-page .anon .track {
    position: relative;
    width: 34px;
    height: 19px;
    border-radius: 99px;
    background: var(--line-dark);
    transition: background 0.2s;
    flex: none;
  }

  .testimony-page .anon .track::after {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
    transition: transform 0.2s;
  }

  .testimony-page .anon.on .track {
    background: var(--ink);
  }

  .testimony-page .anon.on .track::after {
    transform: translateX(15px);
  }

  .testimony-page .anon span {
    font-size: 13px;
    font-weight: 500;
    color: var(--soft);
    transition: color 0.2s;
  }

  .testimony-page .anon.on span {
    color: var(--ink);
  }

  /* Fields — underline style */
  .testimony-page .field {
    padding-top: 20px;
  }

  .testimony-page .field label {
    display: block;
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--faint);
    margin-bottom: 6px;
  }

  .testimony-page .input-wrap {
    position: relative;
  }

  .testimony-page .input-wrap::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    height: 1.5px;
    width: 100%;
    background: var(--accent);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.25s ease;
  }

  .testimony-page .input-wrap.focused::after {
    transform: scaleX(1);
  }

  .testimony-page input,
  .testimony-page textarea {
    width: 100%;
    font-family: inherit;
    font-size: 15.5px;
    color: var(--ink);
    border: none;
    border-bottom: 1.5px solid var(--line-dark);
    border-radius: 0;
    background: transparent;
    padding: 6px 0;
    outline: none;
  }

  .testimony-page input::placeholder,
  .testimony-page textarea::placeholder {
    color: var(--faint);
    font-size: 14.5px;
  }

  .testimony-page textarea {
    resize: none;
    line-height: 1.55;
    min-height: 88px;
    display: block;
    font-size: 15px;
  }

  /* Name collapse animation */
  .testimony-page .collapse {
    display: grid;
    grid-template-rows: 1fr;
    transition: grid-template-rows 0.35s 0.18s ease, opacity 0.3s, padding-top 0.35s 0.18s ease;
  }

  .testimony-page .collapse > .inner {
    overflow: hidden;
  }

  .testimony-page .collapse #nameInput {
    transition: filter 0.28s ease, opacity 0.28s ease;
  }

  .testimony-page .collapse.hide {
    grid-template-rows: 0fr;
    opacity: 0;
    padding-top: 0;
  }

  .testimony-page .collapse.hide #nameInput {
    filter: blur(6px);
    opacity: 0;
  }

  .testimony-page .meta {
    display: flex;
    justify-content: flex-end;
    margin-top: 7px;
  }

  .testimony-page .count {
    font-size: 11px;
    color: var(--faint);
    font-variant-numeric: tabular-nums;
  }

  /* Error messages */
  .testimony-page .msg {
    font-size: 11.5px;
    color: #b4452f;
    margin-top: 7px;
    display: none;
  }

  .testimony-page .msg.show {
    display: block;
  }

  .testimony-page .errline input,
  .testimony-page .errline textarea {
    border-bottom-color: #b4452f;
  }

  /* Submit button */
  .testimony-page button.go {
    margin-top: 28px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: #fff;
    background: var(--ink);
    border: none;
    border-radius: 11px;
    padding: 13px;
    cursor: pointer;
    transition: opacity 0.18s, transform 0.12s;
  }

  .testimony-page button.go:hover {
    opacity: 0.88;
  }

  .testimony-page button.go:active {
    transform: translateY(1px);
  }

  .testimony-page button.go:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .testimony-page button.go svg {
    width: 14px;
    height: 14px;
  }

  .testimony-page .foot {
    text-align: center;
    font-size: 11px;
    color: var(--faint);
    margin: 16px 0 0;
    letter-spacing: 0.01em;
  }

  /* Success state */
  .testimony-page .done {
    padding: 54px 34px 56px;
    text-align: center;
  }

  .testimony-page .done .tick {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    margin: 0 auto 20px;
    border: 1.5px solid var(--ink);
    display: grid;
    place-items: center;
    animation: testimony-draw 0.4s ease both;
  }

  .testimony-page .done .tick.err-tick {
    border-color: #b4452f;
    color: #b4452f;
  }

  .testimony-page .done .tick svg {
    width: 22px;
    height: 22px;
  }

  .testimony-page .done h2 {
    font-family: "Fraunces", serif;
    font-weight: 600;
    font-size: 21px;
    margin: 0 0 8px;
  }

  .testimony-page .done p {
    font-size: 13px;
    color: var(--soft);
    line-height: 1.55;
    margin: 0 auto;
    max-width: 28ch;
  }

  .testimony-page .again {
    margin-top: 24px;
    background: none;
    border: none;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    color: var(--accent);
    cursor: pointer;
    padding: 0;
    transition: opacity 0.15s;
  }

  .testimony-page .again:hover {
    opacity: 0.7;
  }

  /* Loader */
  .testimony-page .loader {
    width: 24px;
    height: 24px;
    border: 2px solid var(--line);
    border-top-color: var(--ink);
    border-radius: 50%;
    margin: 0 auto;
    animation: testimony-spin 0.6s linear infinite;
  }

  @keyframes testimony-draw {
    from { transform: scale(0.5); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  @keyframes testimony-spin {
    to { transform: rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    .testimony-page * {
      transition: none !important;
      animation: none !important;
    }
  }
`
