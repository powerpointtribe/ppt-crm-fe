import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Edit, Trash2, FileInput, CheckCircle, XCircle,
  Type, Mail, Phone, Hash, AlignLeft, List, CircleDot,
  CheckSquare, ToggleLeft, Star, Calendar, Heading, FileText,
  Eye, X,
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
  const [showPreview, setShowPreview] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

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
              onClick={() => setShowPreview(true)}
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview
            </Button>
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
        {/* Preview Panel */}
        {showPreview && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowPreview(false)} />
            <div className="relative ml-auto w-full max-w-md bg-gray-900 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                <span className="text-sm font-semibold text-white">Form Preview</span>
                <button onClick={() => setShowPreview(false)} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <iframe
                  ref={iframeRef}
                  srcDoc={buildPreviewHtml(form)}
                  className="w-full h-full border-0"
                  title="Form preview"
                  sandbox="allow-scripts"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

function buildPreviewHtml(form: FormTemplate): string {
  const sortedFields = [...(form.fields || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const renderField = (f: any): string => {
    if (f.type === 'heading') {
      return `<div style="padding-top:28px"><h3 style="font-family:'Cormorant Garamond','Georgia',serif;font-size:20px;font-weight:700;color:#fff;margin:0">${f.label}</h3></div>`
    }
    if (f.type === 'paragraph') {
      return `<div style="padding-top:8px"><p style="font-size:13.5px;color:#d0daea;line-height:1.5;margin:0">${f.label}</p></div>`
    }
    if (f.type === 'rating') {
      const stars = [1,2,3,4,5].map(n => `<span style="font-size:22px;color:#4a6a8a;cursor:pointer">☆</span>`).join(' ')
      return `<div style="padding-top:22px"><label style="display:block;font-size:10.5px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#b0c4d8;margin-bottom:8px">${f.label}${f.required ? ' *' : ''}</label><div style="display:flex;gap:4px;align-items:center">${stars}</div></div>`
    }
    if (f.type === 'textarea') {
      return `<div style="padding-top:22px"><label style="display:block;font-size:10.5px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#b0c4d8;margin-bottom:8px">${f.label}${f.required ? ' *' : '<span style="text-transform:none;letter-spacing:0;font-weight:400;opacity:0.6;margin-left:4px">(optional)</span>'}</label><textarea placeholder="${f.placeholder || ''}" style="width:100%;font-family:inherit;font-size:15px;color:#f0f2f5;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:12px 14px;outline:none;resize:none;min-height:80px;line-height:1.55;box-sizing:border-box" readonly></textarea></div>`
    }
    if (f.type === 'radio') {
      const opts = (f.options || []).map((o: any) => `<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;color:#b0c4d8"><input type="radio" name="${f.key}" disabled style="accent-color:#7eb8e0" />${o.label}</label>`).join('')
      return `<div style="padding-top:22px"><label style="display:block;font-size:10.5px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#b0c4d8;margin-bottom:8px">${f.label}${f.required ? ' *' : ''}</label><div style="display:flex;flex-direction:column;gap:8px;margin-top:6px">${opts}</div></div>`
    }
    if (f.type === 'select') {
      const opts = (f.options || []).map((o: any) => `<option>${o.label}</option>`).join('')
      return `<div style="padding-top:22px"><label style="display:block;font-size:10.5px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#b0c4d8;margin-bottom:8px">${f.label}${f.required ? ' *' : ''}</label><select disabled style="width:100%;font-family:inherit;font-size:15px;color:#f0f2f5;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:12px 14px;outline:none;box-sizing:border-box"><option>${f.placeholder || 'Select...'}</option>${opts}</select></div>`
    }
    if (f.type === 'toggle') {
      return `<div style="padding-top:22px"><div style="display:inline-flex;align-items:center;gap:10px"><span style="width:36px;height:20px;border-radius:99px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.14);display:inline-block"></span><span style="font-size:13px;font-weight:500;color:rgba(176,196,216,0.45)">${f.label}</span></div></div>`
    }
    if (f.type === 'checkbox') {
      return `<div style="padding-top:22px"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;font-weight:400;color:#b0c4d8"><input type="checkbox" disabled style="accent-color:#7eb8e0" />${f.label}</label></div>`
    }
    // text, email, phone, number, date
    return `<div style="padding-top:22px"><label style="display:block;font-size:10.5px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#b0c4d8;margin-bottom:8px">${f.label}${f.required ? ' *' : '<span style="text-transform:none;letter-spacing:0;font-weight:400;opacity:0.6;margin-left:4px">(optional)</span>'}</label><input type="${f.type === 'phone' ? 'tel' : f.type}" placeholder="${f.placeholder || ''}" style="width:100%;font-family:inherit;font-size:15px;color:#f0f2f5;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:12px 14px;outline:none;box-sizing:border-box" readonly /></div>`
  }

  const fieldsHtml = sortedFields.map(renderField).join('\n')

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Hanken+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family:'Hanken Grotesk',system-ui,-apple-system,sans-serif;
    background:#0a1628;
    color:#f0f2f5;
    min-height:100vh;
    display:flex;
    align-items:flex-start;
    justify-content:center;
    padding:32px 16px;
    -webkit-font-smoothing:antialiased;
    position:relative;
    overflow-x:hidden;
  }
  body::before {
    content:"";
    position:fixed;
    inset:0;
    background:
      radial-gradient(ellipse 60% 50% at 20% 80%,rgba(30,70,120,0.35) 0%,transparent 70%),
      radial-gradient(ellipse 50% 40% at 80% 20%,rgba(40,80,140,0.25) 0%,transparent 60%),
      radial-gradient(ellipse 80% 60% at 50% 100%,rgba(20,50,100,0.3) 0%,transparent 50%);
    pointer-events:none;
    z-index:0;
  }
  .card {
    width:100%;
    max-width:400px;
    background:linear-gradient(170deg,rgba(18,36,66,0.95) 0%,rgba(15,31,56,0.98) 100%);
    border:1px solid rgba(126,184,224,0.12);
    border-radius:12px;
    box-shadow:0 24px 80px rgba(0,0,0,0.45);
    position:relative;
    z-index:2;
    backdrop-filter:blur(12px);
    overflow:hidden;
  }
  .card::before {
    content:"";display:block;height:2px;background:linear-gradient(90deg,transparent,#7eb8e0,transparent);opacity:0.5;
  }
  .inner { padding:32px 24px 28px; }
  .eyebrow { font-size:10px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#7eb8e0;margin:0 0 10px; }
  h1 { font-family:'Cormorant Garamond','Georgia',serif;font-weight:700;font-size:30px;line-height:1.1;color:#fff;margin:0 0 8px; }
  .sub { font-size:13px;line-height:1.55;color:#b0c4d8;margin:0 0 24px;max-width:32ch; }
  .btn {
    margin-top:28px;width:100%;display:flex;align-items:center;justify-content:center;gap:8px;
    font-family:inherit;font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;
    color:#fff;background:linear-gradient(135deg,#1a4a7a,#2568a8);border:1px solid rgba(126,184,224,0.2);
    border-radius:6px;padding:14px 20px;cursor:default;
  }
  .foot { text-align:center;font-size:11px;color:rgba(176,196,216,0.45);margin:18px 0 0; }
  .preview-badge { position:absolute;top:12px;right:12px;font-size:9px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#7eb8e0;background:rgba(126,184,224,0.12);padding:4px 10px;border-radius:99px;z-index:5; }
</style>
</head><body>
<div class="card">
  <span class="preview-badge">Preview</span>
  <div class="inner">
    <p class="eyebrow">Form Preview</p>
    <h1>${form.name}</h1>
    ${form.description ? `<p class="sub">${form.description}</p>` : ''}
    ${form.allowAnonymous ? `<div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:8px"><span style="width:36px;height:20px;border-radius:99px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.14);display:inline-block"></span><span style="font-size:13px;font-weight:500;color:rgba(176,196,216,0.45)">Share anonymously</span></div>` : ''}
    ${fieldsHtml}
    <div class="btn"><span>${form.submitButtonText || 'Submit'}</span> →</div>
    <p class="foot">${form.footerText || 'Form preview — submissions are disabled.'}</p>
  </div>
</div>
</body></html>`
}
