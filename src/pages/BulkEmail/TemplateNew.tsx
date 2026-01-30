import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save } from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import EmailEditor from '@/components/BulkEmail/EmailEditor'
import { bulkEmailService } from '@/services/bulk-email'
import { EmailTemplateCategory } from '@/types/bulk-email'
import { emailTemplateSchema, EmailTemplateFormData } from '@/schemas/bulk-email'
import { showToast } from '@/utils/toast'
import { useAppStore } from '@/store'

export default function TemplateNew() {
  const navigate = useNavigate()
  const { selectedBranch } = useAppStore()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EmailTemplateFormData>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      branch: selectedBranch?._id || '',
      category: EmailTemplateCategory.GENERAL,
      isActive: true,
      htmlContent: '',
    },
  })

  const onSubmit = async (data: EmailTemplateFormData) => {
    try {
      setLoading(true)
      const template = await bulkEmailService.createTemplate(data)
      showToast('success', 'Template created successfully')
      navigate(`/bulk-email/templates/${template._id}`)
    } catch (error: any) {
      showToast('error', error.message || 'Failed to create template')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="New Template">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/bulk-email/templates')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
        </div>

        <Card className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Email Template</h1>

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

            {/* Plain Text (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plain Text Version (Optional)
              </label>
              <textarea
                {...register('plainTextContent')}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Plain text version for email clients that don't support HTML. Variables like {{firstName}} work here too."
              />
              <p className="text-xs text-gray-500 mt-1">
                This is used as a fallback for email clients that don't render HTML
              </p>
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
                onClick={() => navigate('/bulk-email/templates')}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                <Save className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  )
}
