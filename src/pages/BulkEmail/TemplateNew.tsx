import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save, FileText, Settings } from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmailEditor from '@/components/BulkEmail/EmailEditor'
import { bulkEmailService } from '@/services/bulk-email'
import { EmailTemplateCategory, TemplateModule } from '@/types/bulk-email'
import { emailTemplateSchema, EmailTemplateFormData } from '@/schemas/bulk-email'
import { showToast } from '@/utils/toast'
import { useAppStore } from '@/store'

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D7770] focus:border-transparent outline-none'
const selectCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D7770] focus:border-transparent outline-none bg-white'
const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

export default function TemplateNew() {
  const navigate = useNavigate()
  const { selectedBranch } = useAppStore()
  const [loading, setLoading] = useState(false)

  const {
    register, handleSubmit, control,
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
      <div className="max-w-5xl mx-auto space-y-6 pb-10">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/bulk-email/templates')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-sm text-gray-500 flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Back to Templates</p>
            <h1 className="text-xl font-bold text-gray-900">Create Email Template</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-[#0D7770]" /> Template Info
            </h2>
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Template Name <span className="text-red-500">*</span></label>
                  <input {...register('name')} placeholder="e.g., Welcome Email" className={inputCls} />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Category <span className="text-red-500">*</span></label>
                  <select {...register('category')} className={selectCls}>
                    {Object.values(EmailTemplateCategory).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0) + cat.slice(1).toLowerCase().replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Module</label>
                  <select {...register('module')} className={selectCls}>
                    <option value="">No module (standalone)</option>
                    {Object.values(TemplateModule).map((mod) => (
                      <option key={mod} value={mod}>
                        {mod.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Group this template under a specific module</p>
                </div>
              </div>

              <div>
                <label className={labelCls}>Subject Line <span className="text-red-500">*</span></label>
                <input {...register('subject')} placeholder="e.g., Welcome to {{branchName}}, {{firstName}}!" className={inputCls} />
                {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
                <p className="text-xs text-gray-400 mt-1">Use {'{{firstName}}'}, {'{{lastName}}'}, etc. for dynamic variables</p>
              </div>
            </div>
          </section>

          {/* Email Content */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Settings className="w-4.5 h-4.5 text-[#0D7770]" /> Email Content
            </h2>
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
              <div>
                <label className={labelCls}>HTML Content <span className="text-red-500">*</span></label>
                <Controller
                  name="htmlContent"
                  control={control}
                  render={({ field }) => (
                    <EmailEditor value={field.value} onChange={field.onChange} error={errors.htmlContent?.message} />
                  )}
                />
              </div>

              <div>
                <label className={labelCls}>Plain Text Version (Optional)</label>
                <textarea
                  {...register('plainTextContent')}
                  rows={4}
                  className={`${inputCls} resize-none`}
                  placeholder="Plain text version for email clients that don't support HTML. Variables like {{firstName}} work here too."
                />
                <p className="text-xs text-gray-400 mt-1">Fallback for email clients that don't render HTML</p>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" {...register('isActive')} className="rounded border-gray-300 text-[#0D7770] focus:ring-[#0D7770] w-4 h-4" />
                <span className="text-sm text-gray-700">Active (available for use in campaigns)</span>
              </label>
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => navigate('/bulk-email/templates')}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex items-center gap-2">
              {loading ? (
                <><LoadingSpinner size="sm" /> Creating...</>
              ) : (
                <><Save className="w-4 h-4" /> Create Template</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
