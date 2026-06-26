import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MessageSquare,
  CheckCircle,
  AlertCircle,
  User,
  Mail,
  Phone,
  Sparkles,
  Send,
  Loader2,
} from 'lucide-react'
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

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    title: '',
    testimony: '',
    isAnonymous: false,
  })

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

    if (!form.isAnonymous && !form.fullName.trim()) {
      showToast.error('Please enter your name or check "Submit anonymously"')
      return
    }
    if (!form.testimony.trim()) {
      showToast.error('Please share your testimony')
      return
    }

    setSubmitting(true)
    try {
      await eventsService.submitTestimony(slug, {
        fullName: form.isAnonymous ? 'Anonymous' : form.fullName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        testimony: form.testimony.trim(),
        title: form.title.trim() || undefined,
        isAnonymous: form.isAnonymous,
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
      </div>
    )
  }

  if (error || !eventInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Unavailable</h2>
          <p className="text-sm text-gray-500">{error || 'Something went wrong.'}</p>
        </motion.div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-sm text-gray-500 mb-1">
            Your testimony has been submitted successfully.
          </p>
          <p className="text-xs text-gray-400">
            Thank you for sharing what God has done in your life.
          </p>
          <button
            onClick={() => {
              setSubmitted(false)
              setForm({ fullName: '', email: '', phone: '', title: '', testimony: '', isAnonymous: false })
            }}
            className="mt-6 text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Submit another testimony
          </button>
        </motion.div>
      </div>
    )
  }

  const { event } = eventInfo

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      {/* Banner */}
      {event.bannerImage && (
        <div className="relative h-48 sm:h-56 overflow-hidden">
          <img
            src={event.bannerImage}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-purple-200 text-xs font-medium uppercase tracking-wider">
                  Share Your Story
                </p>
                <h1 className="text-lg font-bold">{event.title}</h1>
              </div>
            </div>
            <p className="text-purple-100 text-sm leading-relaxed">
              We would love to hear what God has done in your life through this event.
              Your testimony encourages others and glorifies God.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Anonymous toggle */}
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={form.isAnonymous}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isAnonymous: e.target.checked }))
                }
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Submit anonymously
                </span>
                <p className="text-xs text-gray-400">
                  Your name won't be shown with your testimony
                </p>
              </div>
            </label>

            {!form.isAnonymous && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={form.fullName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fullName: e.target.value }))
                    }
                    placeholder="Enter your full name"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
                    required={!form.isAnonymous}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      placeholder="email@example.com"
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      placeholder="08012345678"
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                Title (optional)
              </label>
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="e.g. God healed my marriage"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                Your Testimony <span className="text-red-400">*</span>
              </label>
              <textarea
                value={form.testimony}
                onChange={(e) =>
                  setForm((f) => ({ ...f, testimony: e.target.value }))
                }
                placeholder="Share what God has done..."
                rows={5}
                maxLength={5000}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all resize-none"
                required
              />
              <div className="flex justify-end mt-1">
                <span className="text-[10px] text-gray-400">
                  {form.testimony.length}/5000
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium text-sm hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Testimony
                </>
              )}
            </button>
          </form>
        </motion.div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Your testimony may be shared to encourage others.
        </p>
      </div>
    </div>
  )
}
