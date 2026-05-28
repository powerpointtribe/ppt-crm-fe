import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save, FileText, Settings } from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmailEditor from '@/components/BulkEmail/EmailEditor'
import { bulkEmailService } from '@/services/bulk-email'
import { EmailTemplate, EmailTemplateCategory, TemplateModule } from '@/types/bulk-email'
import { emailTemplateSchema, EmailTemplateFormData } from '@/schemas/bulk-email'
import { showToast } from '@/utils/toast'

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D7770] focus:border-transparent outline-none'
const selectCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D7770] focus:border-transparent outline-none bg-white'
const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

export default function TemplateEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [template, setTemplate] = useState<EmailTemplate | null>(null)

  const {
    register, handleSubmit, control, reset,
    formState: { errors },
  } = useForm<EmailTemplateFormData>({
    resolver: zodResolver(emailTemplateSchema),
  })

  useEffect(() => {
    if (id) fetchTemplate()
  }, [id])

  const fetchTemplate = async () => {
    try {
      setLoading(true)
      const data = await bulkEmailService.getTemplateById(id!)
      setTemplate(data)
      reset({
        branch: typeof data.branch === 'object' ? data.branch?._id : data.branch,
        name: data.name,
        subject: data.subject,
        htmlContent: data.htmlContent,
        plainTextContent: data.plainTextContent || '',
        category: data.category,
        module: data.module || undefined,
        isActive: data.isActive,
      })
    } catch (error: any) {
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
        module: data.module,
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
    return <Layout title="Edit Template"><div className="flex justify-center py-16"><LoadingSpinner /></div></Layout>
  }

  if (!template) {
    return (
      <Layout title="Edit Template">
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-sm text-red-600 mb-3">Template not found</p>
          <Button size="sm" variant="secondary" onClick={() => navigate('/bulk-email/templates')}>Back to Templates</Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Edit Template">
      <div className="max-w-5xl mx-auto space-y-6 pb-10">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/bulk-email/templates/${id}`)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-sm text-gray-500 flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Back to Template</p>
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
                {template?.slug && (
                  <div>
                    <label className={labelCls}>Slug</label>
                    <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-500">
                      {template.slug}
                    </p>
                  </div>
                )}
              </div>

              {template?.variableDefinitions && template.variableDefinitions.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Available Variables</label>
                  <div className="flex flex-wrap gap-1.5">
                    {template.variableDefinitions.map((v) => (
                      <span key={v.name} className="px-2.5 py-1 rounded-lg bg-[#0D7770]/5 text-[#0D7770] text-xs font-mono" title={v.description || v.name}>
                        {`{{${v.name}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
                  placeholder="Plain text version for email clients that don't support HTML..."
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" {...register('isActive')} className="rounded border-gray-300 text-[#0D7770] focus:ring-[#0D7770] w-4 h-4" />
                <span className="text-sm text-gray-700">Active (available for use in campaigns)</span>
              </label>
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => navigate(`/bulk-email/templates/${id}`)}>
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
    </Layout>
  )
}
