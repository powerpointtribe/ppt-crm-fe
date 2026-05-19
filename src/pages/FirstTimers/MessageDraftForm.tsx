import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Mail, Send, Clock, Eye, Users, Calendar, Search, Check, X, FileText, Sparkles, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Badge from '@/components/ui/Badge'
import { messageDraftsService, EmailTemplate, CreateMessageDraftData } from '@/services/message-drafts'
import { firstTimersService, FirstTimer } from '@/services/first-timers'
import { useToast } from '@/hooks/useToast'

const DEFAULT_MESSAGES: Record<number, { subject: string; message: string }> = {
  1: {
    subject: 'So glad you visited us! 🎉',
    message: `We hope you had an amazing time at the service! It was such a blessing having you with us.\n\nAt The PowerPoint Tribe, we are a community of believers committed to raising global leaders who transform their communities, industries, and nations through faith, excellence, and purpose.\n\nWe would love to know — how was your experience? Did anything stand out to you during the service?\n\nOne of our friendly team members will be reaching out to you soon. We're genuinely excited to connect with you and help you find your place in this family.`,
  },
  2: {
    subject: 'Welcome to The PowerPoint Tribe',
    message: `Thank you for joining us at the service. We appreciate you taking the time to worship with us, and we hope the experience was meaningful.\n\nThe PowerPoint Tribe is a faith-driven community raising leaders who transform their world through excellence and purpose. Whether you are a professional, entrepreneur, or student — there is a place for you here.\n\nWe would value your feedback on the service and would love to answer any questions you may have. A member of our team will be in touch shortly to connect with you personally.`,
  },
  3: {
    subject: 'You made our day! Welcome to the Tribe 🙌',
    message: `What a joy it was to have you with us! Your presence truly made the service even more special.\n\nThe PowerPoint Tribe is not just a church — it's a vibrant community of dreamers, builders, and world-changers united by faith and purpose. We believe God has something incredible in store for you, and we'd love to be part of your journey!\n\nHow did you find the experience? We'd love to hear your thoughts! One of our awesome team members will be reaching out soon — we can't wait to connect with you and share more about what makes this community so special.`,
  },
}

export default function MessageDraftForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEditing = !!id
  const toast = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Form state
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>(undefined)
  const [recipientMode, setRecipientMode] = useState<'by_date' | 'individual'>('by_date')
  const [serviceDate, setServiceDate] = useState('')
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([])
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  // Data state
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [firstTimers, setFirstTimers] = useState<FirstTimer[]>([])
  const [recipientSearch, setRecipientSearch] = useState('')

  // UI state
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [showTestEmailModal, setShowTestEmailModal] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [showSendConfirm, setShowSendConfirm] = useState(false)

  // Load templates on mount
  useEffect(() => {
    loadTemplates()
  }, [])

  // Load draft in edit mode
  useEffect(() => {
    if (isEditing && id) {
      loadDraft(id)
    }
  }, [id])

  // Load first timers when individual mode selected
  useEffect(() => {
    if (recipientMode === 'individual' && firstTimers.length === 0) {
      loadFirstTimers()
    }
  }, [recipientMode])

  // Debounced preview
  useEffect(() => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
    if (!message.trim()) {
      setPreviewHtml('')
      return
    }
    previewTimerRef.current = setTimeout(() => {
      fetchPreview()
    }, 800)
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
    }
  }, [message, selectedTemplateId, subject])

  const loadTemplates = async () => {
    try {
      const data = await messageDraftsService.getTemplates()
      setTemplates(data)
      if (data.length > 0 && !selectedTemplateId && !isEditing) {
        const firstId = data[0].id
        setSelectedTemplateId(firstId)
        const defaults = DEFAULT_MESSAGES[firstId]
        if (defaults) {
          setMessage(defaults.message)
          setSubject(defaults.subject)
        }
      }
    } catch (err) {
      console.error('Failed to load templates:', err)
    }
  }

  const loadDraft = async (draftId: string) => {
    try {
      setLoading(true)
      const draft = await messageDraftsService.getMessageDraftById(draftId)
      setSubject(draft.subject || '')
      setMessage(draft.message || '')
      setSelectedTemplateId(draft.templateId || undefined)
      setRecipientMode(draft.recipientMode || 'by_date')
      setSelectedRecipientIds(draft.recipientIds || [])
      if (draft.scheduledDate) {
        const d = new Date(draft.scheduledDate)
        setScheduledDate(d.toISOString().split('T')[0])
        setServiceDate(d.toISOString().split('T')[0])
      }
      if (draft.scheduledTime) {
        const t = new Date(draft.scheduledTime)
        const hours = t.getHours().toString().padStart(2, '0')
        const minutes = t.getMinutes().toString().padStart(2, '0')
        setScheduledTime(`${hours}:${minutes}`)
      }
    } catch (err: any) {
      toast.error('Failed to load draft', err?.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const loadFirstTimers = async () => {
    try {
      const res = await firstTimersService.getFirstTimers({ limit: 100 })
      setFirstTimers(res.items || [])
    } catch (err) {
      console.error('Failed to load first timers:', err)
    }
  }

  const fetchPreview = async () => {
    try {
      setPreviewLoading(true)
      const res = await messageDraftsService.previewMessage({
        message,
        templateId: selectedTemplateId,
        subject: subject || undefined,
      })
      setPreviewHtml(res.htmlPreview)
    } catch {
      // Silently fail preview
    } finally {
      setPreviewLoading(false)
    }
  }

  const insertVariable = (variable: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const before = message.substring(0, start)
    const after = message.substring(end)
    setMessage(before + variable + after)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + variable.length, start + variable.length)
    }, 0)
  }

  const buildDraftData = (status?: 'draft' | 'scheduled'): CreateMessageDraftData => ({
    message: message.trim(),
    subject: subject.trim() || undefined,
    templateId: selectedTemplateId,
    recipientMode,
    recipientIds: recipientMode === 'individual' ? selectedRecipientIds : undefined,
    scheduledDate: recipientMode === 'by_date' ? serviceDate : scheduledDate,
    scheduledTime: scheduledTime || '09:00',
  })

  const handleSave = async (status: 'draft' | 'scheduled' = 'draft') => {
    if (!message.trim()) {
      toast.warning('Message required', 'Please enter a message body')
      return
    }
    try {
      setSaving(true)
      const data = buildDraftData(status)
      if (isEditing && id) {
        await messageDraftsService.updateMessageDraft(id, data)
        toast.success('Draft updated')
      } else {
        await messageDraftsService.createMessageDraft(data)
        toast.success(status === 'scheduled' ? 'Message scheduled' : 'Draft saved')
      }
      navigate('/first-timers/message-drafts')
    } catch (err: any) {
      toast.error('Save failed', err?.message || 'An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleSendNow = async () => {
    if (!message.trim()) {
      toast.warning('Message required', 'Please enter a message body')
      return
    }
    try {
      setSaving(true)
      let draftId = id
      if (!draftId) {
        const created = await messageDraftsService.createMessageDraft(buildDraftData())
        draftId = created._id
      } else {
        await messageDraftsService.updateMessageDraft(draftId, buildDraftData())
      }
      await messageDraftsService.sendMessageNow(draftId)
      toast.success('Message sent', 'Your message is being delivered')
      navigate('/first-timers/message-drafts')
    } catch (err: any) {
      toast.error('Send failed', err?.message || 'An unexpected error occurred')
    } finally {
      setSaving(false)
      setShowSendConfirm(false)
    }
  }

  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) return
    try {
      setSendingTest(true)
      await messageDraftsService.sendTestEmail({
        email: testEmail.trim(),
        message: message.trim(),
        templateId: selectedTemplateId,
        subject: subject.trim() || undefined,
      })
      toast.success('Test email sent', `Sent to ${testEmail}`)
      setShowTestEmailModal(false)
      setTestEmail('')
    } catch (err: any) {
      toast.error('Test email failed', err?.message || 'An unexpected error occurred')
    } finally {
      setSendingTest(false)
    }
  }

  const toggleRecipient = useCallback((ftId: string) => {
    setSelectedRecipientIds(prev =>
      prev.includes(ftId) ? prev.filter(r => r !== ftId) : [...prev, ftId]
    )
  }, [])

  const filteredFirstTimers = firstTimers.filter(ft => {
    if (!recipientSearch) return true
    const q = recipientSearch.toLowerCase()
    return (
      ft.firstName.toLowerCase().includes(q) ||
      ft.lastName.toLowerCase().includes(q) ||
      (ft.email && ft.email.toLowerCase().includes(q))
    )
  })

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 pb-28">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/first-timers/message-drafts')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Back to Drafts
            </p>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Message Draft' : 'New Message Draft'}
            </h1>
          </div>
        </div>

        {/* A. Template Selector */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#0D7770]" />
            Choose a Template
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map(tpl => {
              const isSelected = selectedTemplateId === tpl.id
              return (
                <motion.div
                  key={tpl.id}
                  whileHover={{ y: -2 }}
                  onClick={() => {
                    setSelectedTemplateId(tpl.id)
                    // Pre-fill with default message for the selected template
                    const defaults = DEFAULT_MESSAGES[tpl.id]
                    if (defaults) {
                      // Only replace if message is empty or is a default from another template
                      const isCurrentDefault = Object.values(DEFAULT_MESSAGES).some(d => d.message === message)
                      if (!message.trim() || isCurrentDefault) {
                        setMessage(defaults.message)
                        setSubject(defaults.subject)
                      }
                    }
                  }}
                  className={`rounded-xl p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-2 border-[#0D7770] ring-2 ring-[#0D7770]/20 bg-white'
                      : 'border border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-sm">{tpl.name}</h3>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#0D7770] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{tpl.description}</p>
                  <div className="h-[200px] overflow-hidden rounded-lg border border-gray-100 bg-gray-50 relative">
                    <div
                      style={{
                        transform: 'scale(0.35)',
                        transformOrigin: 'top left',
                        pointerEvents: 'none',
                        width: '286%',
                      }}
                      dangerouslySetInnerHTML={{ __html: tpl.previewHtml }}
                    />
                  </div>
                </motion.div>
              )
            })}
            {templates.length === 0 && (
              <div className="col-span-3 text-center py-8 text-gray-400">
                <FileText className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Loading templates...</p>
              </div>
            )}
          </div>
        </section>

        {/* B + C. Editor + Live Preview side by side */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Subject + Message Editor */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#0D7770]" />
              Compose Message
            </h2>
            <Card>
              <div className="p-5 space-y-4">
                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Welcome to our church family!"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D7770] focus:border-transparent outline-none"
                  />
                </div>

                {/* Message */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Message</label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => insertVariable('{{firstName}}')}
                        className="text-xs px-2 py-1 bg-[#0D7770]/10 text-[#0D7770] rounded hover:bg-[#0D7770]/20 font-mono transition-colors"
                      >
                        {'{{firstName}}'}
                      </button>
                      <button
                        type="button"
                        onClick={() => insertVariable('{{lastName}}')}
                        className="text-xs px-2 py-1 bg-[#0D7770]/10 text-[#0D7770] rounded hover:bg-[#0D7770]/20 font-mono transition-colors"
                      >
                        {'{{lastName}}'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={10}
                    placeholder={'Dear {{firstName}},\n\nThank you for visiting our church! We are delighted to have you...'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D7770] focus:border-transparent outline-none resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{message.length} characters</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right: Live Preview */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#0D7770]" />
              Live Preview
            </h2>
            <Card>
              <div className="p-5">
                {previewLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <LoadingSpinner size="sm" />
                    <p className="text-sm text-gray-400">Generating preview...</p>
                  </div>
                ) : previewHtml ? (
                  <iframe
                    srcDoc={previewHtml}
                    title="Email Preview"
                    className="w-full min-h-[400px] border border-gray-100 rounded-lg bg-white"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                    <Eye className="w-8 h-8" />
                    <p className="text-sm">Start typing to see a live preview</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </section>

        {/* D. Recipient Selection */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0D7770]" />
            Recipients
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* By Service Date */}
            <div
              onClick={() => setRecipientMode('by_date')}
              className={`rounded-xl p-4 cursor-pointer transition-all ${
                recipientMode === 'by_date'
                  ? 'border-2 border-[#0D7770] ring-2 ring-[#0D7770]/20 bg-white'
                  : 'border border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  recipientMode === 'by_date' ? 'border-[#0D7770]' : 'border-gray-300'
                }`}>
                  {recipientMode === 'by_date' && <div className="w-2.5 h-2.5 rounded-full bg-[#0D7770]" />}
                </div>
                <div>
                  <Calendar className="w-5 h-5 text-[#0D7770] inline mr-2" />
                  <span className="font-medium text-gray-900 text-sm">By Service Date</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 ml-8">Send to all first-timers who visited on a specific date</p>
            </div>

            {/* Select Individuals */}
            <div
              onClick={() => setRecipientMode('individual')}
              className={`rounded-xl p-4 cursor-pointer transition-all ${
                recipientMode === 'individual'
                  ? 'border-2 border-[#0D7770] ring-2 ring-[#0D7770]/20 bg-white'
                  : 'border border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  recipientMode === 'individual' ? 'border-[#0D7770]' : 'border-gray-300'
                }`}>
                  {recipientMode === 'individual' && <div className="w-2.5 h-2.5 rounded-full bg-[#0D7770]" />}
                </div>
                <div>
                  <Users className="w-5 h-5 text-[#0D7770] inline mr-2" />
                  <span className="font-medium text-gray-900 text-sm">Select Individuals</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 ml-8">Hand-pick specific first-timers to receive this message</p>
            </div>
          </div>

          {/* Conditional inputs */}
          {recipientMode === 'by_date' && (
            <Card>
              <div className="p-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Date</label>
                <input
                  type="date"
                  value={serviceDate}
                  onChange={e => setServiceDate(e.target.value)}
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D7770] focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">All first-timers who visited on this date will receive the message</p>
              </div>
            </Card>
          )}

          {recipientMode === 'individual' && (
            <Card>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={recipientSearch}
                      onChange={e => setRecipientSearch(e.target.value)}
                      placeholder="Search first-timers..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D7770] focus:border-transparent outline-none"
                    />
                  </div>
                  {selectedRecipientIds.length > 0 && (
                    <Badge variant="info">{selectedRecipientIds.length} selected</Badge>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
                  {filteredFirstTimers.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6">No first-timers found</p>
                  )}
                  {filteredFirstTimers.map(ft => {
                    const isChecked = selectedRecipientIds.includes(ft._id)
                    const initials = `${ft.firstName[0] || ''}${ft.lastName[0] || ''}`.toUpperCase()
                    return (
                      <label
                        key={ft._id}
                        className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${
                          isChecked ? 'bg-[#0D7770]/5' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRecipient(ft._id)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          isChecked ? 'bg-[#0D7770] border-[#0D7770]' : 'border-gray-300'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#0D7770]/10 text-[#0D7770] flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{ft.firstName} {ft.lastName}</p>
                          <p className="text-xs text-gray-500 truncate">{ft.email || 'No email'}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            </Card>
          )}
        </section>

        {/* E. Schedule */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#0D7770]" />
            Schedule
          </h2>
          <Card>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Send Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D7770] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Send Time</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D7770] focus:border-transparent outline-none"
                />
              </div>
            </div>
          </Card>
        </section>
      </div>

      {/* F. Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={() => setShowTestEmailModal(true)}
            disabled={!message.trim()}
            className="flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Send Test Email
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleSave('scheduled')}
              disabled={saving || !scheduledDate || !scheduledTime}
              className="flex items-center gap-2 border-[#0D7770] text-[#0D7770] hover:bg-[#0D7770]/5"
            >
              <Clock className="w-4 h-4" />
              Schedule
            </Button>
            <Button
              onClick={() => setShowSendConfirm(true)}
              disabled={saving || !message.trim()}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              <Send className="w-4 h-4" />
              Send Now
            </Button>
          </div>
        </div>
      </div>

      {/* Test Email Modal */}
      {showTestEmailModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Send Test Email</h3>
              <button onClick={() => setShowTestEmailModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Send a preview of this email to a test address.</p>
            <input
              type="email"
              value={testEmail}
              onChange={e => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D7770] focus:border-transparent outline-none mb-4"
              onKeyDown={e => { if (e.key === 'Enter') handleSendTestEmail() }}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowTestEmailModal(false)}>Cancel</Button>
              <Button
                onClick={handleSendTestEmail}
                disabled={sendingTest || !testEmail.trim()}
                className="flex items-center gap-2 bg-[#0D7770] hover:bg-[#0D7770]/90 text-white"
              >
                <Send className="w-4 h-4" />
                {sendingTest ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Send Now Confirmation */}
      {showSendConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Send</h3>
              <button onClick={() => setShowSendConfirm(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to send this message now? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowSendConfirm(false)}>Cancel</Button>
              <Button
                onClick={handleSendNow}
                disabled={saving}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
              >
                <Send className="w-4 h-4" />
                {saving ? 'Sending...' : 'Send Now'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
