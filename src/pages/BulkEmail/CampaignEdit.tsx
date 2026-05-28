import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save, Eye, Mail, Users, FileText, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { bulkEmailService } from '@/services/bulk-email'
import {
  EmailCampaign, EmailTemplate, RecipientFilterType, CampaignStatus,
} from '@/types/bulk-email'
import { emailCampaignSchema, EmailCampaignFormData } from '@/schemas/bulk-email'
import { showToast } from '@/utils/toast'

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D7770] focus:border-transparent outline-none'
const selectCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D7770] focus:border-transparent outline-none bg-white'
const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

const STATUSES = ['ACTIVE', 'INACTIVE', 'VISITOR', 'NEW_CONVERT']

export default function CampaignEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [campaign, setCampaign] = useState<EmailCampaign | null>(null)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')

  const {
    register, handleSubmit, watch, setValue, reset,
    formState: { errors },
  } = useForm<EmailCampaignFormData>({
    resolver: zodResolver(emailCampaignSchema),
  })

  const htmlContent = watch('htmlContent')
  const selectedTemplateId = watch('template')
  const filterType = watch('recipientFilter.filterType')

  useEffect(() => { if (id) fetchData() }, [id])

  useEffect(() => {
    if (selectedTemplateId && templates.length > 0) {
      const template = templates.find(t => t._id === selectedTemplateId)
      if (template) {
        setValue('subject', template.subject)
        setValue('htmlContent', template.htmlContent)
      }
    }
  }, [selectedTemplateId, templates, setValue])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [campaignData, templatesData] = await Promise.all([
        bulkEmailService.getCampaignById(id!),
        bulkEmailService.getActiveTemplates(),
      ])
      if (campaignData.status !== CampaignStatus.DRAFT) {
        showToast('error', 'Only draft campaigns can be edited')
        navigate(`/bulk-email/campaigns/${id}`)
        return
      }
      setCampaign(campaignData)
      setTemplates(templatesData)
      reset({
        branch: typeof campaignData.branch === 'object' ? campaignData.branch._id : campaignData.branch,
        name: campaignData.name,
        subject: campaignData.subject,
        htmlContent: campaignData.htmlContent,
        template: typeof campaignData.template === 'object' ? campaignData.template._id : campaignData.template || '',
        recipientFilter: campaignData.recipientFilter,
      })
    } catch (error: any) {
      showToast('error', 'Failed to load campaign')
      navigate('/bulk-email/campaigns')
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = () => {
    let p = htmlContent || ''
    p = p.replace(/\{\{firstName\}\}/g, 'John')
    p = p.replace(/\{\{lastName\}\}/g, 'Doe')
    p = p.replace(/\{\{email\}\}/g, 'john.doe@example.com')
    setPreviewHtml(p)
    setShowPreview(true)
  }

  const onSubmit = async (data: EmailCampaignFormData) => {
    try {
      setSaving(true)
      await bulkEmailService.updateCampaign(id!, {
        name: data.name,
        subject: data.subject,
        htmlContent: data.htmlContent,
        template: data.template,
        recipientFilter: data.recipientFilter,
      })
      showToast('success', 'Campaign updated successfully')
      navigate(`/bulk-email/campaigns/${id}`)
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update campaign')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Layout title="Edit Campaign"><div className="flex justify-center py-16"><LoadingSpinner /></div></Layout>
  }

  if (!campaign) {
    return (
      <Layout title="Edit Campaign">
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-sm text-red-600 mb-3">Campaign not found</p>
          <Button size="sm" variant="secondary" onClick={() => navigate('/bulk-email/campaigns')}>Back to Campaigns</Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Edit Campaign">
      <div className="max-w-5xl mx-auto space-y-6 pb-10">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/bulk-email/campaigns/${id}`)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-sm text-gray-500 flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Back to Campaign</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Campaign Details */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Mail className="w-4.5 h-4.5 text-[#0D7770]" /> Campaign Details
            </h2>
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
              <div>
                <label className={labelCls}>Campaign Name <span className="text-red-500">*</span></label>
                <input {...register('name')} placeholder="e.g., December Newsletter" className={inputCls} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className={labelCls}>Template (Optional)</label>
                <select {...register('template')} className={selectCls}>
                  <option value="">Write custom content</option>
                  {templates.map((t) => (
                    <option key={t._id} value={t._id}>{t.name} — {t.subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Subject Line <span className="text-red-500">*</span></label>
                <input {...register('subject')} placeholder="e.g., Important Update from Church" className={inputCls} />
                {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
              </div>
            </div>
          </section>

          {/* Recipients */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-[#0D7770]" /> Recipients
            </h2>
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
              <div>
                <label className={labelCls}>Filter Type</label>
                <select {...register('recipientFilter.filterType')} className={selectCls}>
                  <option value={RecipientFilterType.ALL_MEMBERS}>All Members</option>
                  <option value={RecipientFilterType.BY_BRANCH}>By Branch</option>
                  <option value={RecipientFilterType.BY_GROUP}>By Group</option>
                  <option value={RecipientFilterType.BY_UNIT}>By Unit</option>
                  <option value={RecipientFilterType.BY_DISTRICT}>By District</option>
                  <option value={RecipientFilterType.BY_MEMBERSHIP_STATUS}>By Membership Status</option>
                </select>
              </div>

              {filterType === RecipientFilterType.BY_MEMBERSHIP_STATUS && (
                <div>
                  <label className={labelCls}>Membership Statuses</label>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((s) => {
                      const current = watch('recipientFilter.membershipStatuses') || []
                      const on = current.includes(s)
                      return (
                        <label
                          key={s}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                            on ? 'bg-[#0D7770]/10 text-[#0D7770] font-medium' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <input type="checkbox" value={s} className="sr-only"
                            checked={on}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setValue('recipientFilter.membershipStatuses', [...current, s])
                              } else {
                                setValue('recipientFilter.membershipStatuses', current.filter(x => x !== s))
                              }
                            }}
                          />
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${on ? 'bg-[#0D7770] border-[#0D7770]' : 'border-gray-300'}`}>
                            {on && <Check className="w-3 h-3 text-white" />}
                          </div>
                          {s.replace(/_/g, ' ').toLowerCase()}
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Email Content */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-[#0D7770]" /> Email Content
            </h2>
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls}>HTML Content <span className="text-red-500">*</span></label>
                  <button
                    type="button"
                    onClick={handlePreview}
                    disabled={!htmlContent}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#0D7770] hover:bg-[#0D7770]/5 rounded-lg font-medium transition-colors disabled:opacity-40"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                </div>
                <textarea
                  {...register('htmlContent')}
                  rows={14}
                  className={`${inputCls} font-mono resize-none`}
                />
                {errors.htmlContent && <p className="text-red-500 text-xs mt-1">{errors.htmlContent.message}</p>}
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => navigate(`/bulk-email/campaigns/${id}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex items-center gap-2">
              {saving ? (
                <><LoadingSpinner size="sm" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> Save Changes</>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Preview Modal */}
      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="Email Preview" size="lg">
        <div className="border border-gray-100 rounded-lg overflow-hidden">
          <iframe srcDoc={previewHtml} className="w-full h-[500px] border-0" title="Email Preview" />
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="secondary" size="sm" onClick={() => setShowPreview(false)}>Close</Button>
        </div>
      </Modal>
    </Layout>
  )
}
