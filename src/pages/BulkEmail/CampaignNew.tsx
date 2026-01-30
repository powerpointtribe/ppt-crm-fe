import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save, Eye, Users, Send, Clock } from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { bulkEmailService } from '@/services/bulk-email'
import {
  EmailTemplate,
  RecipientFilterType,
  RecipientPreview
} from '@/types/bulk-email'
import { emailCampaignSchema, EmailCampaignFormData } from '@/schemas/bulk-email'
import { showToast } from '@/utils/toast'
import { useAppStore } from '@/store'

export default function CampaignNew() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { selectedBranch } = useAppStore()

  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [recipientPreview, setRecipientPreview] = useState<RecipientPreview | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')

  const preselectedTemplateId = searchParams.get('templateId')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<EmailCampaignFormData>({
    resolver: zodResolver(emailCampaignSchema),
    defaultValues: {
      branch: selectedBranch?._id || '',
      recipientFilter: {
        filterType: RecipientFilterType.ALL_MEMBERS,
      },
      htmlContent: '',
    },
  })

  const selectedTemplateId = watch('template')
  const htmlContent = watch('htmlContent')
  const filterType = watch('recipientFilter.filterType')

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    if (preselectedTemplateId && templates.length > 0) {
      const template = templates.find(t => t._id === preselectedTemplateId)
      if (template) {
        setValue('template', template._id)
        setValue('subject', template.subject)
        setValue('htmlContent', template.htmlContent)
      }
    }
  }, [preselectedTemplateId, templates, setValue])

  useEffect(() => {
    if (selectedTemplateId && templates.length > 0) {
      const template = templates.find(t => t._id === selectedTemplateId)
      if (template) {
        setValue('subject', template.subject)
        setValue('htmlContent', template.htmlContent)
      }
    }
  }, [selectedTemplateId, templates, setValue])

  const fetchTemplates = async () => {
    try {
      const data = await bulkEmailService.getActiveTemplates()
      setTemplates(data)
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const handlePreview = () => {
    let previewContent = htmlContent || ''
    previewContent = previewContent.replace(/\{\{firstName\}\}/g, 'John')
    previewContent = previewContent.replace(/\{\{lastName\}\}/g, 'Doe')
    previewContent = previewContent.replace(/\{\{email\}\}/g, 'john.doe@example.com')
    setPreviewHtml(previewContent)
    setShowPreview(true)
  }

  const onSubmit = async (data: EmailCampaignFormData) => {
    try {
      setLoading(true)
      const campaign = await bulkEmailService.createCampaign(data)
      showToast('success', 'Campaign created as draft')
      navigate(`/bulk-email/campaigns/${campaign._id}`)
    } catch (error: any) {
      showToast('error', error.message || 'Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  const onSubmitAndSend = async (data: EmailCampaignFormData) => {
    if (!window.confirm('Create and send this campaign immediately?')) return

    try {
      setLoading(true)
      const campaign = await bulkEmailService.createCampaign(data)
      await bulkEmailService.sendCampaign(campaign._id)
      showToast('success', 'Campaign is being sent')
      navigate(`/bulk-email/campaigns/${campaign._id}`)
    } catch (error: any) {
      showToast('error', error.message || 'Failed to send campaign')
    } finally {
      setLoading(false)
    }
  }

  const handleSchedule = async (data: EmailCampaignFormData) => {
    if (!scheduleDate) {
      showToast('error', 'Please select a date and time')
      return
    }

    try {
      setLoading(true)
      const campaign = await bulkEmailService.createCampaign(data)
      await bulkEmailService.scheduleCampaign(campaign._id, { scheduledAt: scheduleDate })
      showToast('success', 'Campaign scheduled successfully')
      navigate(`/bulk-email/campaigns/${campaign._id}`)
    } catch (error: any) {
      showToast('error', error.message || 'Failed to schedule campaign')
    } finally {
      setLoading(false)
      setShowScheduleModal(false)
    }
  }

  return (
    <Layout title="New Campaign">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/bulk-email/campaigns')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
        </div>

        <Card className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Email Campaign</h1>

          <form className="space-y-6">
            {/* Campaign Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Name <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('name')}
                placeholder="e.g., December Newsletter"
                error={errors.name?.message}
              />
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Use Template (Optional)
              </label>
              <select
                {...register('template')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a template or write custom content</option>
                {templates.map((template) => (
                  <option key={template._id} value={template._id}>
                    {template.name} - {template.subject}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject Line <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('subject')}
                placeholder="e.g., Important Update from Church"
                error={errors.subject?.message}
              />
            </div>

            {/* Recipient Filter */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Recipients
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter Type
                  </label>
                  <select
                    {...register('recipientFilter.filterType')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Membership Statuses
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['ACTIVE', 'INACTIVE', 'VISITOR', 'NEW_CONVERT'].map((status) => (
                        <label key={status} className="flex items-center">
                          <input
                            type="checkbox"
                            value={status}
                            className="rounded border-gray-300 text-blue-600 mr-2"
                            onChange={(e) => {
                              const currentStatuses = watch('recipientFilter.membershipStatuses') || []
                              if (e.target.checked) {
                                setValue('recipientFilter.membershipStatuses', [...currentStatuses, status])
                              } else {
                                setValue('recipientFilter.membershipStatuses',
                                  currentStatuses.filter(s => s !== status))
                              }
                            }}
                          />
                          {status.toLowerCase().replace('_', ' ')}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* HTML Content */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Email Content (HTML) <span className="text-red-500">*</span>
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePreview}
                  disabled={!htmlContent}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
              </div>
              <textarea
                {...register('htmlContent')}
                rows={15}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="<html>
<body>
  <h1>Hello {{firstName}}!</h1>
  <p>Your email content here...</p>
</body>
</html>"
              />
              {errors.htmlContent && (
                <p className="text-red-500 text-sm mt-1">{errors.htmlContent.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/bulk-email/campaigns')}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowScheduleModal(true)}
              >
                <Clock className="h-4 w-4 mr-2" />
                Schedule
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSubmit(onSubmit)}
                loading={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
                type="button"
                onClick={handleSubmit(onSubmitAndSend)}
                loading={loading}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Now
              </Button>
            </div>
          </form>
        </Card>

        {/* Preview Modal */}
        <Modal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          title="Email Preview"
          size="lg"
        >
          <div className="border rounded-lg overflow-hidden">
            <iframe
              srcDoc={previewHtml}
              className="w-full h-96 border-0"
              title="Email Preview"
            />
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </div>
        </Modal>

        {/* Schedule Modal */}
        <Modal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          title="Schedule Campaign"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Choose when you want this campaign to be sent.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Send Date & Time
              </label>
              <Input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit((data) => handleSchedule(data))}
                loading={loading}
              >
                <Clock className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  )
}
