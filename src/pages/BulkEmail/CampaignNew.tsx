import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Send, Clock, Eye, Users, Search, Check, X, FileText, Sparkles, ArrowLeft, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { bulkEmailService } from '@/services/bulk-email'
import { groupsService } from '@/services/groups'
import { membersService } from '@/services/members-unified'
import { useToast } from '@/hooks/useToast'
import { useAppStore } from '@/store'
import { EmailTemplate, RecipientFilterType, CreateEmailCampaignData } from '@/types/bulk-email'

const STATUSES = ['MEMBER', 'DC', 'LXL', 'DIRECTOR', 'PASTOR', 'CAMPUS_PASTOR', 'SENIOR_PASTOR']
const VARIABLES = ['{{firstName}}', '{{lastName}}', '{{fullName}}', '{{email}}', '{{branchName}}']
const FILTERS: { value: RecipientFilterType; label: string; desc: string }[] = [
  { value: RecipientFilterType.ALL_MEMBERS, label: 'All Members', desc: 'Send to every member' },
  { value: RecipientFilterType.BY_GROUP, label: 'By Group', desc: 'Filter by group' },
  { value: RecipientFilterType.BY_DISTRICT, label: 'By District', desc: 'Filter by district' },
  { value: RecipientFilterType.BY_UNIT, label: 'By Unit', desc: 'Filter by unit' },
  { value: RecipientFilterType.BY_MEMBERSHIP_STATUS, label: 'By Status', desc: 'Filter by membership level' },
  { value: RecipientFilterType.BY_MAILING_LIST, label: 'Mailing List', desc: 'Use a saved mailing list' },
  { value: RecipientFilterType.CUSTOM, label: 'Custom', desc: 'Hand-pick recipients' },
]

interface ListItem { _id: string; name?: string; firstName?: string; lastName?: string; email?: string }

export default function CampaignNew() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const toast = useToast()
  const { selectedBranch } = useAppStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [campaignName, setCampaignName] = useState('')
  const [subject, setSubject] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<RecipientFilterType>(RecipientFilterType.ALL_MEMBERS)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [ccEmails, setCcEmails] = useState('')
  const [bccEmails, setBccEmails] = useState('')
  const [schedDate, setSchedDate] = useState('')
  const [schedTime, setSchedTime] = useState('')

  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [listItems, setListItems] = useState<ListItem[]>([])
  const [listSearch, setListSearch] = useState('')

  const [showAllTemplates, setShowAllTemplates] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [showTestModal, setShowTestModal] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [showSendConfirm, setShowSendConfirm] = useState(false)

  useEffect(() => { loadTemplates() }, [])

  useEffect(() => {
    const tid = searchParams.get('templateId')
    if (tid && templates.length) {
      const tpl = templates.find(t => t._id === tid)
      if (tpl) { setTemplateId(tpl._id); setSubject(tpl.subject); setHtmlContent(tpl.htmlContent) }
    }
  }, [searchParams, templates])

  useEffect(() => {
    setSelectedIds([]); setListItems([]); setListSearch('')
    const loaders: Record<string, () => void> = {
      [RecipientFilterType.BY_GROUP]: () => loadGroupType('groups'),
      [RecipientFilterType.BY_DISTRICT]: () => loadGroupType('districts'),
      [RecipientFilterType.BY_UNIT]: () => loadGroupType('units'),
      [RecipientFilterType.BY_MAILING_LIST]: loadMailingLists,
      [RecipientFilterType.CUSTOM]: loadMembers,
    }
    loaders[filterType]?.()
  }, [filterType])

  useEffect(() => {
    if (previewTimer.current) clearTimeout(previewTimer.current)
    if (!htmlContent.trim()) { setPreviewHtml(''); return }
    previewTimer.current = setTimeout(() => {
      const replacements: [RegExp, string][] = [
        [/\{\{firstName\}\}/g, 'John'], [/\{\{lastName\}\}/g, 'Doe'],
        [/\{\{fullName\}\}/g, 'John Doe'], [/\{\{email\}\}/g, 'john@example.com'],
        [/\{\{branchName\}\}/g, selectedBranch?.name || 'Main Branch'],
      ]
      setPreviewHtml(replacements.reduce((h, [re, val]) => h.replace(re, val), htmlContent))
    }, 800)
    return () => { if (previewTimer.current) clearTimeout(previewTimer.current) }
  }, [htmlContent, selectedBranch])

  const loadTemplates = async () => {
    try {
      const apiTemplates = await bulkEmailService.getActiveTemplates()
      setTemplates(apiTemplates || [])
    } catch {
      setTemplates([])
    }
  }

  const loadGroupType = async (type: 'groups' | 'districts' | 'units') => {
    try {
      const fn = type === 'districts' ? groupsService.getDistricts
        : type === 'units' ? groupsService.getUnits : groupsService.getGroups
      const res = await fn({ limit: 100 })
      setListItems(res.items.map(g => ({ _id: g._id, name: g.name })))
    } catch (e) { console.error(`Failed to load ${type}:`, e) }
  }

  const loadMembers = async () => {
    try {
      const res = await membersService.getMembers({ limit: 200 })
      setListItems(res.items.map(m => ({ _id: m._id, firstName: m.firstName, lastName: m.lastName, email: m.email })))
    } catch (e) { console.error('Failed to load members:', e) }
  }

  const loadMailingLists = async () => {
    try {
      const res = await bulkEmailService.getMailingLists({ limit: 100 })
      const items = res?.items || res?.data?.items || []
      setListItems(items.map((l: any) => ({ _id: l._id, name: `${l.name} (${l.contactCount} contacts)` })))
    } catch (e) { console.error('Failed to load mailing lists:', e) }
  }

  const insertVariable = (v: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const { selectionStart: s, selectionEnd: e } = ta
    setHtmlContent(htmlContent.substring(0, s) + v + htmlContent.substring(e))
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + v.length, s + v.length) }, 0)
  }

  const toggleId = useCallback((id: string) => {
    setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }, [])
  const toggleStatus = useCallback((s: string) => {
    setSelectedStatuses(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])
  }, [])

  const buildData = (): CreateEmailCampaignData => {
    const rf: any = { filterType }
    if (filterType === RecipientFilterType.BY_GROUP) rf.groupIds = selectedIds
    else if (filterType === RecipientFilterType.BY_DISTRICT) rf.districtIds = selectedIds
    else if (filterType === RecipientFilterType.BY_UNIT) rf.unitIds = selectedIds
    else if (filterType === RecipientFilterType.BY_MEMBERSHIP_STATUS) rf.membershipStatuses = selectedStatuses
    else if (filterType === RecipientFilterType.BY_MAILING_LIST) rf.mailingListIds = selectedIds
    else if (filterType === RecipientFilterType.CUSTOM) rf.customMemberIds = selectedIds
    const data: any = { name: campaignName.trim(), subject: subject.trim(),
      htmlContent: htmlContent.trim(), recipientFilter: rf }
    if (selectedBranch?._id) data.branch = selectedBranch._id
    if (templateId) data.template = templateId
    const parsedCc = ccEmails.split(',').map(e => e.trim()).filter(Boolean)
    const parsedBcc = bccEmails.split(',').map(e => e.trim()).filter(Boolean)
    if (parsedCc.length) data.ccEmails = parsedCc
    if (parsedBcc.length) data.bccEmails = parsedBcc
    return data
  }

  const validate = () => {
    if (!campaignName.trim() || !subject.trim() || !htmlContent.trim()) {
      toast.warning('Missing fields', 'Please fill in campaign name, subject, and content'); return false
    }
    return true
  }

  const handleSaveDraft = async () => {
    if (!validate()) return
    try {
      setSaving(true)
      const c = await bulkEmailService.createCampaign(buildData())
      toast.success('Draft saved'); navigate(`/bulk-email/campaigns/${c._id}`)
    } catch (e: any) { toast.error('Save failed', e?.message || 'An error occurred')
    } finally { setSaving(false) }
  }

  const handleSchedule = async () => {
    if (!validate()) return
    if (!schedDate || !schedTime) { toast.warning('Schedule required', 'Please set a date and time'); return }
    try {
      setSaving(true)
      const c = await bulkEmailService.createCampaign(buildData())
      await bulkEmailService.scheduleCampaign(c._id, { scheduledAt: `${schedDate}T${schedTime}:00` })
      toast.success('Campaign scheduled'); navigate('/bulk-email/campaigns')
    } catch (e: any) { toast.error('Schedule failed', e?.message || 'An error occurred')
    } finally { setSaving(false) }
  }

  const handleSendNow = async () => {
    if (!validate()) return
    try {
      setSaving(true)
      const c = await bulkEmailService.createCampaign(buildData())
      await bulkEmailService.sendCampaign(c._id)
      toast.success('Campaign sent', 'Your campaign is being delivered')
      navigate(`/bulk-email/campaigns/${c._id}`)
    } catch (e: any) { toast.error('Send failed', e?.message || 'An error occurred')
    } finally { setSaving(false); setShowSendConfirm(false) }
  }

  const handleSendTest = async () => {
    if (!testEmail.trim() || !validate()) return
    try {
      setSendingTest(true)
      const c = await bulkEmailService.createCampaign(buildData())
      await bulkEmailService.sendCampaign(c._id)
      toast.success('Test email sent', `Preview sent to ${testEmail}`)
      setShowTestModal(false); setTestEmail('')
    } catch (e: any) { toast.error('Test email failed', e?.message || 'An error occurred')
    } finally { setSendingTest(false) }
  }

  const selectTemplate = (tpl: EmailTemplate) => {
    setTemplateId(tpl._id); setSubject(tpl.subject); setHtmlContent(tpl.htmlContent)
  }

  const filtered = listItems.filter(item => {
    if (!listSearch) return true
    const q = listSearch.toLowerCase()
    return item.name ? item.name.toLowerCase().includes(q)
      : `${item.firstName} ${item.lastName}`.toLowerCase().includes(q) || item.email?.toLowerCase().includes(q)
  })

  const needsList = [RecipientFilterType.BY_GROUP, RecipientFilterType.BY_DISTRICT,
    RecipientFilterType.BY_UNIT, RecipientFilterType.BY_MAILING_LIST, RecipientFilterType.CUSTOM].includes(filterType)

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D7770] focus:border-transparent outline-none'

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 pb-28">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/bulk-email/campaigns')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-sm text-gray-500 flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Back to Campaigns</p>
            <h1 className="text-2xl font-bold text-gray-900">New Email Campaign</h1>
          </div>
        </div>

        {/* A. Template Selector */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#0D7770]" /> Choose a Template
            </h2>
            {templates.length > 0 && (
              <span className="text-xs text-gray-400">{templates.length} templates available</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div whileHover={{ y: -2 }} onClick={() => setTemplateId(null)}
              className={`rounded-xl p-4 cursor-pointer transition-all ${!templateId
                ? 'border-2 border-[#0D7770] ring-2 ring-[#0D7770]/20 bg-white' : 'border border-gray-200 hover:border-gray-300 bg-white'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 text-sm">Start from Scratch</h3>
                {!templateId && <span className="w-5 h-5 rounded-full bg-[#0D7770] flex items-center justify-center"><Check className="w-3 h-3 text-white" /></span>}
              </div>
              <p className="text-xs text-gray-500">Write custom content without a template</p>
              <div className="h-[80px] flex items-center justify-center mt-3 rounded-lg border border-dashed border-gray-200 bg-gray-50">
                <FileText className="w-8 h-8 text-gray-300" />
              </div>
            </motion.div>
            {(showAllTemplates ? templates : templates.slice(0, 5)).map(tpl => {
              const sel = templateId === tpl._id
              return (
                <motion.div key={tpl._id} whileHover={{ y: -2 }} onClick={() => selectTemplate(tpl)}
                  className={`rounded-xl p-4 cursor-pointer transition-all ${sel
                    ? 'border-2 border-[#0D7770] ring-2 ring-[#0D7770]/20 bg-white' : 'border border-gray-200 hover:border-gray-300 bg-white'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-sm truncate">{tpl.name}</h3>
                    {sel && <span className="w-5 h-5 rounded-full bg-[#0D7770] flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3 text-white" /></span>}
                  </div>
                  <Badge variant="info">{tpl.category}</Badge>
                  <p className="text-xs text-gray-500 truncate mt-2">{tpl.subject}</p>
                </motion.div>
              )
            })}
            {!templates.length && <div className="col-span-2 text-center py-8 text-gray-400"><FileText className="w-8 h-8 mx-auto mb-2" /><p className="text-sm">Loading templates...</p></div>}
          </div>
          {templates.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllTemplates(!showAllTemplates)}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-[#0D7770] hover:bg-[#0D7770]/5 rounded-lg transition-colors"
            >
              {showAllTemplates ? (
                <><ChevronUp className="w-4 h-4" /> Show Less</>
              ) : (
                <><ChevronDown className="w-4 h-4" /> View All {templates.length} Templates</>
              )}
            </button>
          )}
        </section>

        {/* B. Campaign Details */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#0D7770]" /> Campaign Details
          </h2>
          <Card>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name <span className="text-red-500">*</span></label>
                <input type="text" value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="e.g., December Newsletter" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line <span className="text-red-500">*</span></label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., Important Update from Church" className={inputCls} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CC <span className="text-xs text-gray-400 font-normal">(comma-separated)</span></label>
                  <input type="text" value={ccEmails} onChange={e => setCcEmails(e.target.value)} placeholder="e.g., pastor@church.org, admin@church.org" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">BCC <span className="text-xs text-gray-400 font-normal">(comma-separated)</span></label>
                  <input type="text" value={bccEmails} onChange={e => setBccEmails(e.target.value)} placeholder="e.g., records@church.org" className={inputCls} />
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* C. Editor + Preview */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0D7770]" /> Email Content
            </h2>
            <Card>
              <div className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">HTML Content <span className="text-red-500">*</span></label>
                  <div className="flex gap-1 flex-wrap">
                    {VARIABLES.map(v => (
                      <button key={v} type="button" onClick={() => insertVariable(v)}
                        className="text-xs px-2 py-1 bg-[#0D7770]/10 text-[#0D7770] rounded hover:bg-[#0D7770]/20 font-mono transition-colors">{v}</button>
                    ))}
                  </div>
                </div>
                <textarea ref={textareaRef} value={htmlContent} onChange={e => setHtmlContent(e.target.value)} rows={12}
                  placeholder={'<html>\n<body>\n  <h1>Hello {{firstName}}!</h1>\n  <p>Content here...</p>\n</body>\n</html>'}
                  className={`${inputCls} font-mono resize-none`} />
                <p className="text-xs text-gray-400 mt-1 text-right">{htmlContent.length} characters</p>
              </div>
            </Card>
          </div>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#0D7770]" /> Live Preview
            </h2>
            <Card>
              <div className="p-5">
                {previewHtml ? (
                  <iframe srcDoc={previewHtml} title="Email Preview" className="w-full min-h-[400px] border border-gray-100 rounded-lg bg-white" sandbox="allow-same-origin" />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                    <Eye className="w-8 h-8" /><p className="text-sm">Start typing to see a live preview</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </section>

        {/* D. Recipients */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0D7770]" /> Recipients
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {FILTERS.map(opt => {
              const active = filterType === opt.value
              return (
                <div key={opt.value} onClick={() => setFilterType(opt.value)}
                  className={`rounded-xl p-4 cursor-pointer transition-all ${active
                    ? 'border-2 border-[#0D7770] ring-2 ring-[#0D7770]/20 bg-white' : 'border border-gray-200 hover:border-gray-300 bg-white'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${active ? 'border-[#0D7770]' : 'border-gray-300'}`}>
                      {active && <div className="w-2.5 h-2.5 rounded-full bg-[#0D7770]" />}
                    </div>
                    <span className="font-medium text-gray-900 text-sm">{opt.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 ml-8">{opt.desc}</p>
                </div>
              )
            })}
          </div>

          {filterType === RecipientFilterType.BY_MEMBERSHIP_STATUS && (
            <Card>
              <div className="p-5">
                <p className="text-sm font-medium text-gray-700 mb-3">Select statuses:</p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(s => {
                    const on = selectedStatuses.includes(s)
                    return (
                      <label key={s} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                        on ? 'bg-[#0D7770]/10 text-[#0D7770] font-medium' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                        <input type="checkbox" checked={on} onChange={() => toggleStatus(s)} className="sr-only" />
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${on ? 'bg-[#0D7770] border-[#0D7770]' : 'border-gray-300'}`}>
                          {on && <Check className="w-3 h-3 text-white" />}
                        </div>
                        {s.replace(/_/g, ' ')}
                      </label>
                    )
                  })}
                </div>
              </div>
            </Card>
          )}

          {needsList && (
            <Card>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={listSearch} onChange={e => setListSearch(e.target.value)}
                      placeholder={filterType === RecipientFilterType.CUSTOM ? 'Search members...' : 'Search...'}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D7770] focus:border-transparent outline-none" />
                  </div>
                  {selectedIds.length > 0 && <Badge variant="info">{selectedIds.length} selected</Badge>}
                </div>
                <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
                  {!listItems.length && (
                    <div className="flex items-center justify-center py-6"><LoadingSpinner size="sm" /><p className="text-sm text-gray-400 ml-2">Loading...</p></div>
                  )}
                  {filtered.map(item => {
                    const on = selectedIds.includes(item._id)
                    const name = item.name || `${item.firstName} ${item.lastName}`
                    const initials = item.name ? item.name.substring(0, 2).toUpperCase()
                      : `${(item.firstName || '')[0]}${(item.lastName || '')[0]}`.toUpperCase()
                    return (
                      <label key={item._id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${on ? 'bg-[#0D7770]/5' : ''}`}>
                        <input type="checkbox" checked={on} onChange={() => toggleId(item._id)} className="sr-only" />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${on ? 'bg-[#0D7770] border-[#0D7770]' : 'border-gray-300'}`}>
                          {on && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#0D7770]/10 text-[#0D7770] flex items-center justify-center text-xs font-semibold flex-shrink-0">{initials}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                          {item.email && <p className="text-xs text-gray-500 truncate">{item.email}</p>}
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
            <Clock className="w-5 h-5 text-[#0D7770]" /> Schedule
          </h2>
          <Card>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Send Date</label>
                <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Send Time</label>
                <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)} className={inputCls} />
              </div>
            </div>
          </Card>
        </section>
      </div>

      {/* F. Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button variant="secondary" onClick={() => setShowTestModal(true)} disabled={!htmlContent.trim()} className="flex items-center gap-2">
            <Mail className="w-4 h-4" /> Send Test Email
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleSaveDraft} disabled={saving} className="flex items-center gap-2">
              <FileText className="w-4 h-4" /> {saving ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button variant="secondary" onClick={handleSchedule} disabled={saving || !schedDate || !schedTime}
              className="flex items-center gap-2 border-[#0D7770] text-[#0D7770] hover:bg-[#0D7770]/5">
              <Clock className="w-4 h-4" /> Schedule
            </Button>
            <Button onClick={() => setShowSendConfirm(true)} disabled={saving || !htmlContent.trim()}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white">
              <Send className="w-4 h-4" /> Send Now
            </Button>
          </div>
        </div>
      </div>

      {/* Test Email Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Send Test Email</h3>
              <button onClick={() => setShowTestModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Send a preview of this campaign to a test address.</p>
            <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="test@example.com"
              className={`${inputCls} mb-4`} onKeyDown={e => { if (e.key === 'Enter') handleSendTest() }} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowTestModal(false)}>Cancel</Button>
              <Button onClick={handleSendTest} disabled={sendingTest || !testEmail.trim()}
                className="flex items-center gap-2 bg-[#0D7770] hover:bg-[#0D7770]/90 text-white">
                <Send className="w-4 h-4" /> {sendingTest ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Send Confirmation */}
      {showSendConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Send</h3>
              <button onClick={() => setShowSendConfirm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to send this campaign now? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowSendConfirm(false)}>Cancel</Button>
              <Button onClick={handleSendNow} disabled={saving} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white">
                <Send className="w-4 h-4" /> {saving ? 'Sending...' : 'Send Now'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
