import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save, Eye } from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { bulkEmailService } from '@/services/bulk-email'
import {
  EmailCampaign,
  EmailTemplate,
  RecipientFilterType,
  CampaignStatus
} from '@/types/bulk-email'
import { emailCampaignSchema, EmailCampaignFormData } from '@/schemas/bulk-email'
import { showToast } from '@/utils/toast'

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
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EmailCampaignFormData>({
    resolver: zodResolver(emailCampaignSchema),
  })

  const htmlContent = watch('htmlContent')
  const selectedTemplateId = watch('template')
  const filterType = watch('recipientFilter.filterType')

  useEffect(() => {
    if (id) {
      fetchData()
    }
  }, [id])

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
        bulkEmailService.getActiveTemplates()
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
      console.error('Error fetching campaign:', error)
      showToast('error', 'Failed to load campaign')
      navigate('/bulk-email/campaigns')
    } finally {
      setLoading(false)
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
    return (
      <Layout title="Edit Campaign">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (!campaign) {
    return (
      <Layout title="Edit Campaign">
        <Card className="p-8 text-center">
          <p className="text-red-600">Campaign not found</p>
          <Button variant="outline" onClick={() => navigate('/bulk-email/campaigns')} className="mt-4">
            Back to Campaigns
          </Button>
        </Card>
      </Layout>
    )
  }

  return (
    <Layout title="Edit Campaign">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(`/bulk-email/campaigns/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaign
          </Button>
        </div>

        <Card className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Campaign</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              <h3 className="font-medium text-gray-900 mb-3">Recipients</h3>

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
                            checked={(watch('recipientFilter.membershipStatuses') || []).includes(status)}
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
                onClick={() => navigate(`/bulk-email/campaigns/${id}`)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
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
      </div>
    </Layout>
  )
}
