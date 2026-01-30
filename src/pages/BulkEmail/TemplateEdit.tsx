import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save } from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmailEditor from '@/components/BulkEmail/EmailEditor'
import { bulkEmailService } from '@/services/bulk-email'
import { EmailTemplate, EmailTemplateCategory } from '@/types/bulk-email'
import { emailTemplateSchema, EmailTemplateFormData } from '@/schemas/bulk-email'
import { showToast } from '@/utils/toast'

export default function TemplateEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [template, setTemplate] = useState<EmailTemplate | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EmailTemplateFormData>({
    resolver: zodResolver(emailTemplateSchema),
  })

  useEffect(() => {
    if (id) {
      fetchTemplate()
    }
  }, [id])

  const fetchTemplate = async () => {
    try {
      setLoading(true)
      const data = await bulkEmailService.getTemplateById(id!)
      setTemplate(data)

      reset({
        branch: typeof data.branch === 'object' ? data.branch._id : data.branch,
        name: data.name,
        subject: data.subject,
        htmlContent: data.htmlContent,
        plainTextContent: data.plainTextContent || '',
        category: data.category,
        isActive: data.isActive,
      })
    } catch (error: any) {
      console.error('Error fetching template:', error)
      showToast('error', 'Failed to load template')
      navigate('/bulk-email/templates')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: EmailTemplateFormData) => {
    try {
      setSaving(true)
      await bulkEmailService.updateTemplate(id!, {
        name: data.name,
        subject: data.subject,
        htmlContent: data.htmlContent,
        plainTextContent: data.plainTextContent,
        category: data.category,
        isActive: data.isActive,
      })
      showToast('success', 'Template updated successfully')
      navigate(`/bulk-email/templates/${id}`)
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update template')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout title="Edit Template">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (!template) {
    return (
      <Layout title="Edit Template">
        <Card className="p-8 text-center">
          <p className="text-red-600">Template not found</p>
          <Button variant="outline" onClick={() => navigate('/bulk-email/templates')} className="mt-4">
            Back to Templates
          </Button>
        </Card>
      </Layout>
    )
  }

  return (
    <Layout title="Edit Template">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(`/bulk-email/templates/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Template
          </Button>
        </div>

        <Card className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Template</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register('name')}
                  placeholder="e.g., Welcome Email"
                  error={errors.name?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('category')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {Object.values(EmailTemplateCategory).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0) + cat.slice(1).toLowerCase().replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject Line <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('subject')}
                placeholder="e.g., Welcome to {{branchName}}, {{firstName}}!"
                error={errors.subject?.message}
              />
              <p className="text-xs text-gray-500 mt-1">
                You can use dynamic variables like {'{{firstName}}'} in the subject line
              </p>
            </div>

            {/* Email Content Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Content (HTML) <span className="text-red-500">*</span>
              </label>
              <Controller
                name="htmlContent"
                control={control}
                render={({ field }) => (
                  <EmailEditor
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.htmlContent?.message}
                  />
                )}
              />
            </div>

            {/* Plain Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plain Text Version (Optional)
              </label>
              <textarea
                {...register('plainTextContent')}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Plain text version for email clients that don't support HTML..."
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                {...register('isActive')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Active (available for use in campaigns)
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/bulk-email/templates/${id}`)}
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
      </div>
    </Layout>
  )
}
