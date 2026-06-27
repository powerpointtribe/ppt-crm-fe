import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Edit, Trash2, FileInput, CheckCircle, XCircle,
  Type, Mail, Phone, Hash, AlignLeft, List, CircleDot,
  CheckSquare, ToggleLeft, Star, Calendar, Heading, FileText,
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { bulkEmailService } from '@/services/bulk-email'
import { FormTemplate, FormTheme } from '@/types/bulk-email'
import { showToast } from '@/utils/toast'
import { formatDate } from '@/utils/formatters'

const FIELD_ICONS: Record<string, any> = {
  text: Type, email: Mail, phone: Phone, number: Hash, textarea: AlignLeft,
  select: List, radio: CircleDot, checkbox: CheckSquare, toggle: ToggleLeft,
  rating: Star, date: Calendar, heading: Heading, paragraph: FileText,
}

const THEME_LABELS: Record<string, string> = {
  default: 'Default (Light)',
  dark: 'Dark (JUBA)',
  custom: 'Custom',
}

export default function FormDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [form, setForm] = useState<FormTemplate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const data = await bulkEmailService.getFormTemplateById(id)
        setForm(data)
      } catch {
        showToast.error('Failed to load form')
        navigate('/bulk-email/forms')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

  const handleDelete = async () => {
    if (!form || !confirm('Delete this form template?')) return
    try {
      await bulkEmailService.deleteFormTemplate(form._id)
      showToast.success('Form deleted')
      navigate('/bulk-email/forms')
    } catch {
      showToast.error('Failed to delete form')
    }
  }

  if (loading) {
    return (
      <Layout title="Form Details">
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      </Layout>
    )
  }

  if (!form) return null

  const creator = typeof form.createdBy === 'object' && form.createdBy
    ? `${form.createdBy.firstName} ${form.createdBy.lastName}`
    : null

  return (
    <Layout title="Form Details">
      <div className="space-y-5 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/bulk-email/forms')}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-900">{form.name}</h1>
                {form.isActive ? (
                  <span className="flex items-center gap-0.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Active
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    <XCircle className="w-3 h-3" /> Inactive
                  </span>
                )}
              </div>
              {form.description && (
                <p className="text-sm text-gray-500 mt-0.5">{form.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/bulk-email/forms/${form._id}/edit`)}
            >
              <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
            </Button>
            {!form.isSystem && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
              </Button>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-xs text-gray-400 block">Module</span>
              <span className="font-medium text-gray-700 capitalize">{form.module}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Theme</span>
              <span className="font-medium text-gray-700">
                {THEME_LABELS[form.style?.theme] || form.style?.theme}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Fields</span>
              <span className="font-medium text-gray-700">{form.fields?.length || 0}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Anonymous</span>
              <span className="font-medium text-gray-700">
                {form.allowAnonymous ? 'Yes' : 'No'}
              </span>
            </div>
            {form.slug && (
              <div>
                <span className="text-xs text-gray-400 block">Slug</span>
                <span className="font-mono text-xs text-gray-700">{form.slug}</span>
              </div>
            )}
            <div>
              <span className="text-xs text-gray-400 block">Submit Button</span>
              <span className="font-medium text-gray-700">{form.submitButtonText}</span>
            </div>
            {creator && (
              <div>
                <span className="text-xs text-gray-400 block">Created by</span>
                <span className="font-medium text-gray-700">{creator}</span>
              </div>
            )}
            <div>
              <span className="text-xs text-gray-400 block">Created</span>
              <span className="font-medium text-gray-700">{formatDate(form.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* HTML Content */}
        {form.htmlContent ? (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Form HTML
            </h2>
            <pre className="bg-gray-50 rounded-lg p-4 text-xs font-mono text-gray-700 overflow-x-auto whitespace-pre-wrap border border-gray-100">
              {form.htmlContent}
            </pre>
          </div>
        ) : (form.fields?.length || 0) > 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Fields ({form.fields?.length || 0})
            </h2>
            <div className="space-y-2">
              {(form.fields || []).map((field, i) => {
                const Icon = FIELD_ICONS[field.type] || FileInput
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50"
                  >
                    <span className="text-xs text-gray-400 w-5 text-center font-mono">
                      {i + 1}
                    </span>
                    <Icon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-800">{field.label}</span>
                      <span className="text-[10px] text-gray-400 ml-2 font-mono">{field.key}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-100 capitalize">
                      {field.type}
                    </span>
                    {field.required && (
                      <span className="text-[10px] text-red-500 font-medium">Required</span>
                    )}
                    {field.width === 'half' && (
                      <span className="text-[10px] text-gray-400">Half</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        {/* Style preview */}
        {form.style?.theme === FormTheme.CUSTOM && form.style.primaryColor && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Custom Colors</h2>
            <div className="flex gap-3">
              {[
                { label: 'Primary', color: form.style.primaryColor },
                { label: 'Background', color: form.style.backgroundColor },
                { label: 'Text', color: form.style.textColor },
                { label: 'Card', color: form.style.cardColor },
              ]
                .filter((c) => c.color)
                .map((c) => (
                  <div key={c.label} className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-gray-200"
                      style={{ backgroundColor: c.color }}
                    />
                    <div>
                      <span className="text-[10px] text-gray-400 block">{c.label}</span>
                      <span className="text-[10px] font-mono text-gray-600">{c.color}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
