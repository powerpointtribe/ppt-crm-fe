import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  MessageSquare,
  Star,
  Trash2,
  Search,
  Link2,
  Copy,
  Check,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  User,
  Mail,
  Phone,
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

interface Testimony {
  _id: string
  fullName: string
  email?: string
  phone?: string
  testimony: string
  title?: string
  isAnonymous: boolean
  isFeatured: boolean
  createdAt: string
}

interface TestimoniesTabProps {
  eventId: string
  event: Event | null
}

export default function TestimoniesTab({ eventId, event }: TestimoniesTabProps) {
  const [testimonies, setTestimonies] = useState<Testimony[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [showFormSelector, setShowFormSelector] = useState(false)
  const [availableForms, setAvailableForms] = useState<FormTemplate[]>([])
  const [loadingForms, setLoadingForms] = useState(false)
  const [linking, setLinking] = useState(false)

  const isEnabled = event?.testimonyFormEnabled ?? false
  const linkedFormId = (event as any)?.testimonyFormId?._id || (event as any)?.testimonyFormId || null
  const slug = event?.registrationSlug || ''
  const testimonyLink = slug
    ? `${window.location.origin}/event-testimony/${slug}`
    : ''

  const loadTestimonies = useCallback(async () => {
    try {
      setLoading(true)
      const result = await eventsService.getTestimonies(eventId, {
        page,
        limit: 10,
        search: search || undefined,
      })
      setTestimonies(result.data || [])
      setTotal(result.total || 0)
    } catch {
      showToast.error('Failed to load testimonies')
    } finally {
      setLoading(false)
    }
  }, [eventId, page, search])

  useEffect(() => {
    loadTestimonies()
  }, [loadTestimonies])

  const handleToggleForm = async () => {
    setToggling(true)
    try {
      if (isEnabled) {
        await eventsService.disableTestimonyForm(eventId)
        showToast.success('Testimony form disabled')
      } else {
        await eventsService.enableTestimonyForm(eventId)
        showToast.success('Testimony form enabled')
      }
      window.location.reload()
    } catch {
      showToast.error('Failed to toggle testimony form')
    } finally {
      setToggling(false)
    }
  }

  const handleCopyLink = () => {
    if (!testimonyLink) return
    navigator.clipboard.writeText(testimonyLink)
    setCopied(true)
    showToast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleToggleFeatured = async (testimonyId: string) => {
    try {
      await eventsService.toggleTestimonyFeatured(testimonyId)
      setTestimonies((prev) =>
        prev.map((t) =>
          t._id === testimonyId ? { ...t, isFeatured: !t.isFeatured } : t,
        ),
      )
    } catch {
      showToast.error('Failed to update testimony')
    }
  }

  const handleDelete = async (testimonyId: string) => {
    if (!confirm('Delete this testimony?')) return
    try {
      await eventsService.deleteTestimony(testimonyId)
      setTestimonies((prev) => prev.filter((t) => t._id !== testimonyId))
      setTotal((prev) => prev - 1)
      showToast.success('Testimony deleted')
    } catch {
      showToast.error('Failed to delete testimony')
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadTestimonies()
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
      await eventsService.linkTestimonyForm(eventId, formId)
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
    if (!confirm('Unlink the form template? The testimony form will use the default style.')) return
    try {
      await eventsService.unlinkTestimonyForm(eventId)
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

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="shadow-sm rounded-xl border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 p-4 border-b border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Testimony Collection
                </h3>
                <p className="text-xs text-gray-500">
                  {total} {total === 1 ? 'testimony' : 'testimonies'} submitted
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
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

              {isEnabled && (
                <>
                  <button
                    onClick={openFormSelector}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition-all"
                  >
                    <FileInput className="w-3.5 h-3.5" />
                    {linkedFormId ? 'Change Form' : 'Select Form'}
                  </button>

                  {linkedFormId && (
                    <button
                      onClick={handleUnlinkForm}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-all"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      Unlink
                    </button>
                  )}

                  {testimonyLink && (
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
                </>
              )}
            </div>
          </div>

          {isEnabled && testimonyLink && (
            <div className="mt-3 flex items-center gap-2 bg-white/70 rounded-lg px-3 py-2 border border-gray-200/50">
              <Link2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-600 truncate font-mono">
                {testimonyLink}
              </span>
            </div>
          )}
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
                placeholder="Search testimonies..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
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
        ) : testimonies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-3 bg-gray-100 rounded-full mb-3">
              <MessageSquare className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">No testimonies yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              {isEnabled
                ? 'Share the testimony link to start collecting responses'
                : 'Enable the testimony form to start collecting'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {testimonies.map((testimony, idx) => (
              <motion.div
                key={testimony._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-4 hover:bg-gray-50/50 transition-colors ${
                  testimony.isFeatured ? 'bg-amber-50/30' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                      testimony.isAnonymous
                        ? 'bg-gray-200 text-gray-500'
                        : 'bg-purple-100 text-purple-600'
                    }`}
                  >
                    {testimony.isAnonymous
                      ? <User className="w-3.5 h-3.5" />
                      : testimony.fullName.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {testimony.isAnonymous ? 'Anonymous' : testimony.fullName}
                      </span>
                      {testimony.isFeatured && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-medium">
                          <Sparkles className="w-2.5 h-2.5" />
                          Featured
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        {formatDate(testimony.createdAt)}
                      </span>
                    </div>

                    {testimony.title && (
                      <p className="text-xs font-medium text-gray-700 mt-0.5">
                        {testimony.title}
                      </p>
                    )}

                    <p className="text-sm text-gray-600 mt-1 leading-relaxed whitespace-pre-wrap">
                      {testimony.testimony}
                    </p>

                    {!testimony.isAnonymous && (testimony.email || testimony.phone) && (
                      <div className="flex items-center gap-3 mt-2">
                        {testimony.email && (
                          <span className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Mail className="w-2.5 h-2.5" />
                            {testimony.email}
                          </span>
                        )}
                        {testimony.phone && (
                          <span className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Phone className="w-2.5 h-2.5" />
                            {testimony.phone}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggleFeatured(testimony._id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        testimony.isFeatured
                          ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                          : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                      }`}
                      title={testimony.isFeatured ? 'Remove from featured' : 'Feature this testimony'}
                    >
                      <Star className={`w-3.5 h-3.5 ${testimony.isFeatured ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleDelete(testimony._id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete testimony"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
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
            Choose a pre-existing form template to use for this event's testimony collection, or use the default form style.
          </p>

          {loadingForms ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              <button
                onClick={handleUseDefault}
                disabled={linking}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all hover:border-gray-300 ${
                  !linkedFormId ? 'border-[#0D7770] bg-[#0D7770]/5' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-gray-100 rounded-lg">
                    <MessageSquare className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Default Form</span>
                    <span className="block text-[11px] text-gray-500">
                      Use the built-in testimony form with standard fields
                    </span>
                  </div>
                  {!linkedFormId && (
                    <span className="ml-auto text-[10px] text-[#0D7770] font-medium bg-[#0D7770]/10 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
              </button>

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
