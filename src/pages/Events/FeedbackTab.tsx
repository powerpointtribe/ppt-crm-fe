import { useState, useEffect, useCallback } from 'react'
import {
  MessageCircle,
  Trash2,
  Search,
  Link2,
  Copy,
  Check,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  Star,
  User,
  Mail,
  FileInput,
  Unlink,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import { eventsService } from '@/services/events'
import { bulkEmailService } from '@/services/bulk-email'
import { showToast } from '@/utils/toast'
import type { Event } from '@/types/event'
import type { FormTemplate } from '@/types/bulk-email'

interface FeedbackItem {
  _id: string
  fullName: string
  email?: string
  rating?: number
  message: string
  isAnonymous: boolean
  createdAt: string
}

interface FeedbackTabProps {
  eventId: string
  event: Event | null
}

export default function FeedbackTab({ eventId, event }: FeedbackTabProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState(false)
  const [toggling, setToggling] = useState(false)

  // Form selector state
  const [showFormSelector, setShowFormSelector] = useState(false)
  const [availableForms, setAvailableForms] = useState<FormTemplate[]>([])
  const [loadingForms, setLoadingForms] = useState(false)
  const [linking, setLinking] = useState(false)

  const isEnabled = event?.feedbackFormEnabled ?? false
  const linkedFormId = event?.feedbackFormId || null
  const slug = event?.registrationSlug || ''
  const feedbackLink = slug
    ? `${window.location.origin}/event-feedback/${slug}`
    : ''

  const loadFeedbacks = useCallback(async () => {
    try {
      setLoading(true)
      const result = await eventsService.getFeedbacks(eventId, {
        page,
        limit: 10,
        search: search || undefined,
      })
      setFeedbacks(result.data || [])
      setTotal(result.total || 0)
    } catch {
      showToast.error('Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }, [eventId, page, search])

  useEffect(() => {
    loadFeedbacks()
  }, [loadFeedbacks])

  const handleToggleForm = async () => {
    setToggling(true)
    try {
      if (isEnabled) {
        await eventsService.disableFeedbackForm(eventId)
        showToast.success('Feedback form disabled')
      } else {
        await eventsService.enableFeedbackForm(eventId)
        showToast.success('Feedback form enabled')
      }
      window.location.reload()
    } catch {
      showToast.error('Failed to toggle feedback form')
    } finally {
      setToggling(false)
    }
  }

  const handleCopyLink = () => {
    if (!feedbackLink) return
    navigator.clipboard.writeText(feedbackLink)
    setCopied(true)
    showToast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async (feedbackId: string) => {
    if (!confirm('Delete this feedback?')) return
    try {
      await eventsService.deleteFeedback(feedbackId)
      setFeedbacks((prev) => prev.filter((f) => f._id !== feedbackId))
      setTotal((prev) => prev - 1)
      showToast.success('Feedback deleted')
    } catch {
      showToast.error('Failed to delete feedback')
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadFeedbacks()
  }

  const openFormSelector = async () => {
    setShowFormSelector(true)
    setLoadingForms(true)
    try {
      const forms = await bulkEmailService.getActiveFormTemplates()
      setAvailableForms(forms)
    } catch {
      showToast.error('Failed to load form templates')
    } finally {
      setLoadingForms(false)
    }
  }

  const handleLinkForm = async (formId: string) => {
    setLinking(true)
    try {
      await eventsService.linkFeedbackForm(eventId, formId)
      showToast.success('Form linked successfully')
      setShowFormSelector(false)
      window.location.reload()
    } catch {
      showToast.error('Failed to link form')
    } finally {
      setLinking(false)
    }
  }

  const handleUnlinkForm = async () => {
    if (!confirm('Unlink the form template? The feedback form will use the default style.')) return
    try {
      await eventsService.unlinkFeedbackForm(eventId)
      showToast.success('Form unlinked — using default style')
      window.location.reload()
    } catch {
      showToast.error('Failed to unlink form')
    }
  }

  const handleUseDefault = async () => {
    if (linkedFormId) {
      await handleUnlinkForm()
    }
    setShowFormSelector(false)
  }

  const totalPages = Math.ceil(total / 10)

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  const tryParseJSON = (str: string): Record<string, any> | null => {
    try {
      const p = JSON.parse(str)
      return typeof p === 'object' && p !== null ? p : null
    } catch { return null }
  }

  const humanizeKey = (key: string) =>
    key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()

  const ratingColor = (n: number) =>
    n >= 4 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
    n >= 3 ? 'bg-amber-50 text-amber-700 border-amber-100' :
    'bg-red-50 text-red-700 border-red-100'

  return (
    <div className="space-y-4">
      <Card className="shadow-sm rounded-xl border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 p-4 border-b border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Event Feedback
                </h3>
                <p className="text-xs text-gray-500">
                  {total} {total === 1 ? 'response' : 'responses'} received
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Form template selector */}
              <button
                onClick={openFormSelector}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg text-xs font-medium hover:bg-violet-200 transition-all"
              >
                <FileInput className="w-3.5 h-3.5" />
                {linkedFormId ? 'Change Form' : 'Link Form'}
              </button>

              {linkedFormId && (
                <button
                  onClick={handleUnlinkForm}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-gray-500 hover:text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition-all"
                  title="Unlink form template"
                >
                  <Unlink className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={handleToggleForm}
                disabled={toggling}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isEnabled
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {toggling ? (
                  <LoadingSpinner />
                ) : isEnabled ? (
                  <ToggleRight className="w-4 h-4" />
                ) : (
                  <ToggleLeft className="w-4 h-4" />
                )}
                {isEnabled ? 'Form Active' : 'Form Inactive'}
              </button>

              {isEnabled && feedbackLink && (
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-200 transition-all"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              )}
            </div>
          </div>

          {/* Linked form info + share link */}
          <div className="mt-3 space-y-2">
            {linkedFormId && (
              <div className="flex items-center gap-2 bg-violet-50/80 rounded-lg px-3 py-2 border border-violet-200/50">
                <FileInput className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                <span className="text-xs text-violet-700 font-medium">
                  Using linked form template
                </span>
              </div>
            )}
            {isEnabled && feedbackLink && (
              <div className="flex items-center gap-2 bg-white/70 rounded-lg px-3 py-2 border border-gray-200/50">
                <Link2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-600 truncate font-mono">
                  {feedbackLink}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-100">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search feedback..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <Button size="sm" variant="outline" onClick={handleSearch}>
              Search
            </Button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-3 bg-gray-100 rounded-full mb-3">
              <MessageCircle className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">No feedback yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              {isEnabled
                ? 'Share the feedback link to start collecting responses'
                : 'Enable the feedback form to start collecting'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {feedbacks.map((fb) => {
              const parsed = tryParseJSON(fb.message)
              const ratings: [string, number][] = parsed
                ? (Object.entries(parsed).filter(([, v]) => typeof v === 'number' && v >= 1 && v <= 5) as [string, number][])
                : []
              const texts: [string, string][] = parsed
                ? (Object.entries(parsed).filter(([, v]) => typeof v === 'string' && String(v).trim()) as [string, string][])
                : []
              const avgRating = ratings.length > 0
                ? Math.round(ratings.reduce((sum, [, v]) => sum + v, 0) / ratings.length * 10) / 10
                : fb.rating || 0

              return (
                <div key={fb._id} className="px-4 py-3.5 hover:bg-gray-50/50 transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        fb.isAnonymous ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {fb.isAnonymous ? <User className="w-3 h-3" /> : fb.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[13px] font-semibold text-gray-800">
                        {fb.isAnonymous ? 'Anonymous' : fb.fullName}
                      </span>
                      {avgRating > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          {avgRating}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">{formatDate(fb.createdAt)}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(fb._id)}
                      className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {parsed ? (
                    <div className="ml-8 mt-2 space-y-2">
                      {ratings.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {ratings.map(([key, val]) => (
                            <span
                              key={key}
                              className={`inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[10px] font-medium border ${ratingColor(val)}`}
                            >
                              <span className="font-bold">{val}</span>
                              <span className="opacity-80">{humanizeKey(key)}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      {texts.length > 0 && (
                        <div className="space-y-1.5">
                          {texts.map(([key, val]) => (
                            <div key={key}>
                              <span className="text-[10px] font-medium text-gray-400 tracking-wide">{humanizeKey(key)}</span>
                              <p className="text-[13px] text-gray-600 leading-snug">{val}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="ml-8 mt-1.5 text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {fb.message}
                    </p>
                  )}

                  {!fb.isAnonymous && fb.email && (
                    <span className="ml-8 mt-1.5 inline-flex items-center gap-1 text-[10px] text-gray-400">
                      <Mail className="w-2.5 h-2.5" />
                      {fb.email}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages} ({total} total)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Form Selector Modal */}
      <Modal
        isOpen={showFormSelector}
        onClose={() => setShowFormSelector(false)}
        title="Select Form Template"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Choose a pre-existing form template to use for this event's feedback, or use the default form style.
          </p>

          {loadingForms ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {/* Default option */}
              <button
                onClick={handleUseDefault}
                disabled={linking}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all hover:border-gray-300 ${
                  !linkedFormId ? 'border-[#0D7770] bg-[#0D7770]/5' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-gray-100 rounded-lg">
                    <MessageCircle className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Default Form</span>
                    <span className="block text-[11px] text-gray-500">
                      Use the built-in feedback form with standard fields
                    </span>
                  </div>
                  {!linkedFormId && (
                    <span className="ml-auto text-[10px] text-[#0D7770] font-medium bg-[#0D7770]/10 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
              </button>

              {/* Available form templates */}
              {availableForms.map((form) => (
                <button
                  key={form._id}
                  onClick={() => handleLinkForm(form._id)}
                  disabled={linking}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all hover:border-indigo-300 ${
                    linkedFormId === form._id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-indigo-50 rounded-lg">
                      <FileInput className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900">{form.name}</span>
                      <span className="block text-[11px] text-gray-500 truncate">
                        {form.description || `${form.fields?.length || 0} fields · ${form.module}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-gray-400">
                        {form.fields?.length || 0} fields
                      </span>
                      {linkedFormId === form._id && (
                        <span className="text-[10px] text-indigo-600 font-medium bg-indigo-100 px-2 py-0.5 rounded-full">
                          Linked
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}

              {availableForms.length === 0 && (
                <div className="text-center py-6 text-gray-400">
                  <FileInput className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">No form templates created yet</p>
                  <p className="text-[10px] mt-1">
                    Create one in Messaging &rarr; Forms
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <Button variant="outline" size="sm" onClick={() => setShowFormSelector(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
