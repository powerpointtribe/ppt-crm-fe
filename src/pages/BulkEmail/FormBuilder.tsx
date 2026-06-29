import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Eye, EyeOff, Code, ImagePlus, X } from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { bulkEmailService } from '@/services/bulk-email'
import { uploadService } from '@/services/upload'
import {
  FormTheme,
  FormModule,
  CreateFormTemplateData,
} from '@/types/bulk-email'
import { showToast } from '@/utils/toast'

const THEME_OPTIONS = [
  { value: FormTheme.DEFAULT, label: 'Default (Light)', desc: 'Clean light theme' },
  { value: FormTheme.DARK, label: 'Dark (JUBA)', desc: 'Dark background with gold accents' },
  { value: FormTheme.CUSTOM, label: 'Custom', desc: 'Set your own colors' },
]

const MODULE_OPTIONS = [
  { value: FormModule.GENERAL, label: 'General' },
  { value: FormModule.EVENTS, label: 'Events' },
  { value: FormModule.FIRST_TIMERS, label: 'First Timers' },
  { value: FormModule.MEMBERS, label: 'Members' },
]

const DEFAULT_FEEDBACK_HTML = `<div class="form-group">
  <label for="fullName">Full Name <span class="required">*</span></label>
  <input type="text" id="fullName" name="fullName" placeholder="Your name" required />
</div>

<div class="form-group">
  <label for="email">Email <span class="optional">(optional)</span></label>
  <input type="email" id="email" name="email" placeholder="your@email.com" />
</div>

<div class="form-group">
  <label for="message">Your Feedback <span class="required">*</span></label>
  <textarea id="message" name="message" placeholder="What did you enjoy? What could we improve?" rows="4" required></textarea>
</div>`

export default function FormBuilder() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const previewRef = useRef<HTMLIFrameElement>(null)

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Form metadata
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [module, setModule] = useState<FormModule>(FormModule.GENERAL)
  const [submitButtonText, setSubmitButtonText] = useState('Submit')
  const [successMessage, setSuccessMessage] = useState(
    'Thank you for your submission.',
  )
  const [successHeading, setSuccessHeading] = useState('Thank you')
  const [allowAnonymous, setAllowAnonymous] = useState(false)
  const [isActive, setIsActive] = useState(true)

  // Style
  const [theme, setTheme] = useState<FormTheme>(FormTheme.DEFAULT)
  const [primaryColor, setPrimaryColor] = useState('#0D7770')
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [textColor, setTextColor] = useState('#1a1a1a')
  const [cardColor, setCardColor] = useState('#ffffff')

  // Thumbnail
  const [thumbnail, setThumbnail] = useState('')
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const thumbInputRef = useRef<HTMLInputElement>(null)

  // HTML content
  const [htmlContent, setHtmlContent] = useState(DEFAULT_FEEDBACK_HTML)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        setLoading(true)
        const form = await bulkEmailService.getFormTemplateById(id)
        setName(form.name)
        setSlug(form.slug || '')
        setDescription(form.description || '')
        setModule(form.module)
        setSubmitButtonText(form.submitButtonText || 'Submit')
        setSuccessMessage(form.successMessage || '')
        setSuccessHeading(form.successHeading || '')
        setAllowAnonymous(form.allowAnonymous)
        setIsActive(form.isActive)
        setTheme(form.style?.theme || FormTheme.DEFAULT)
        setPrimaryColor(form.style?.primaryColor || '#0D7770')
        setBackgroundColor(form.style?.backgroundColor || '#ffffff')
        setTextColor(form.style?.textColor || '#1a1a1a')
        setCardColor(form.style?.cardColor || '#ffffff')
        setHtmlContent(form.htmlContent || '')
        setThumbnail(form.thumbnail || '')
      } catch {
        showToast.error('Failed to load form')
        navigate('/bulk-email/forms')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

  const compressImage = (file: File, maxWidth = 1200, quality = 0.75): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, maxWidth / img.width)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            resolve(new File([blob!], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }))
          },
          'image/webp',
          quality,
        )
      }
      img.src = URL.createObjectURL(file)
    })
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingThumb(true)
    try {
      const compressed = await compressImage(file)
      const result = await uploadService.uploadImage(compressed)
      setThumbnail(result.url)
      showToast.success('Thumbnail uploaded')
    } catch {
      showToast.error('Failed to upload thumbnail')
    } finally {
      setUploadingThumb(false)
      if (thumbInputRef.current) thumbInputRef.current.value = ''
    }
  }

  const getStyleVars = () => {
    if (theme === FormTheme.DARK) {
      return {
        '--primary': '#C9A24B',
        '--bg': '#0B0B0F',
        '--text': '#e4e1e8',
        '--card': '#1b1b20',
        '--border': 'rgba(255,255,255,0.12)',
        '--input-bg': 'rgba(255,255,255,0.06)',
        '--font': "'Hanken Grotesk', sans-serif",
        '--heading-font': "'Playfair Display', serif",
      }
    }
    if (theme === FormTheme.CUSTOM) {
      return {
        '--primary': primaryColor,
        '--bg': backgroundColor,
        '--text': textColor,
        '--card': cardColor,
        '--border': 'rgba(0,0,0,0.1)',
        '--input-bg': 'rgba(0,0,0,0.03)',
        '--font': 'system-ui, sans-serif',
        '--heading-font': 'system-ui, sans-serif',
      }
    }
    return {
      '--primary': '#0D7770',
      '--bg': '#f9fafb',
      '--text': '#1a1a1a',
      '--card': '#ffffff',
      '--border': '#e5e7eb',
      '--input-bg': '#f9fafb',
      '--font': 'system-ui, sans-serif',
      '--heading-font': 'system-ui, sans-serif',
    }
  }

  const generatePreviewHtml = () => {
    const vars = getStyleVars()
    const varsCss = Object.entries(vars)
      .map(([k, v]) => `${k}: ${v};`)
      .join('\n      ')

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300;400;500;600&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      ${varsCss}
      font-family: var(--font);
      background: var(--bg);
      color: var(--text);
      padding: 32px 16px;
      min-height: 100vh;
      display: flex;
      justify-content: center;
    }
    .form-card {
      width: 100%;
      max-width: 440px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 32px 28px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.12);
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
      color: var(--text);
      opacity: 0.7;
    }
    .required { color: #ef4444; }
    .optional { font-weight: 400; opacity: 0.5; text-transform: none; }
    input[type="text"],
    input[type="email"],
    input[type="tel"],
    input[type="number"],
    input[type="date"],
    select,
    textarea {
      width: 100%;
      padding: 10px 14px;
      font-size: 14px;
      font-family: var(--font);
      color: var(--text);
      background: var(--input-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus, select:focus, textarea:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary), transparent 80%);
    }
    textarea { resize: vertical; min-height: 80px; }
    .rating-group {
      display: flex;
      gap: 6px;
    }
    .star-btn {
      width: 36px;
      height: 36px;
      font-size: 20px;
      border: 1px solid var(--border);
      background: var(--input-bg);
      color: var(--text);
      opacity: 0.3;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .star-btn:hover, .star-btn.active {
      opacity: 1;
      color: var(--primary);
      border-color: var(--primary);
    }
    .submit-btn {
      width: 100%;
      padding: 12px;
      font-size: 14px;
      font-weight: 600;
      color: white;
      background: var(--primary);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 8px;
    }
    input[type="checkbox"],
    input[type="radio"] {
      accent-color: var(--primary);
    }
    .checkbox-label, .radio-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 400;
      text-transform: none;
      letter-spacing: 0;
      opacity: 1;
      cursor: pointer;
      margin-bottom: 6px;
    }
  </style>
</head>
<body>
  <div class="form-card">
    ${htmlContent}
    <button class="submit-btn" type="button">${submitButtonText}</button>
  </div>
</body>
</html>`
  }

  useEffect(() => {
    if (showPreview && previewRef.current) {
      const doc = previewRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(generatePreviewHtml())
        doc.close()
      }
    }
  }, [showPreview, htmlContent, theme, primaryColor, backgroundColor, textColor, cardColor, submitButtonText])

  const handleSave = async () => {
    if (!name.trim()) {
      showToast.error('Form name is required')
      return
    }
    if (!htmlContent.trim()) {
      showToast.error('HTML content is required')
      return
    }

    const data: CreateFormTemplateData = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim() || undefined,
      module,
      htmlContent,
      fields: [],
      style: {
        theme,
        ...(theme === FormTheme.CUSTOM && {
          primaryColor,
          backgroundColor,
          textColor,
          cardColor,
        }),
        ...(theme === FormTheme.DARK && {
          primaryColor: '#C9A24B',
          backgroundColor: '#0B0B0F',
          textColor: '#e4e1e8',
          cardColor: '#1b1b20',
          fontFamily: 'Hanken Grotesk',
          headingFontFamily: 'Playfair Display',
        }),
      },
      submitButtonText,
      successMessage,
      successHeading: successHeading || undefined,
      allowAnonymous,
      thumbnail: thumbnail || undefined,
      isActive,
    }

    setSaving(true)
    try {
      if (isEdit && id) {
        await bulkEmailService.updateFormTemplate(id, data)
        showToast.success('Form updated')
      } else {
        const created = await bulkEmailService.createFormTemplate(data)
        showToast.success('Form created')
        navigate(`/bulk-email/forms/${created._id}`)
        return
      }
    } catch (err: any) {
      showToast.error(
        err?.response?.data?.message || 'Failed to save form',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout title={isEdit ? 'Edit Form' : 'New Form'}>
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={isEdit ? 'Edit Form' : 'New Form'}>
      <div className="space-y-5 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/bulk-email/forms')}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {isEdit ? 'Edit Form Template' : 'Create Form Template'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (
                <EyeOff className="w-3.5 h-3.5 mr-1.5" />
              ) : (
                <Eye className="w-3.5 h-3.5 mr-1.5" />
              )}
              {showPreview ? 'Hide Preview' : 'Preview'}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-1.5" />
              {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>

        {/* Form Details */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Form Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Event Feedback Form"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7770]/20 focus:border-[#0D7770]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Slug <span className="text-gray-400">(optional)</span>
              </label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. event-feedback"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7770]/20 focus:border-[#0D7770]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Description
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the form"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7770]/20 focus:border-[#0D7770]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Module
              </label>
              <select
                value={module}
                onChange={(e) => setModule(e.target.value as FormModule)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7770]/20"
              >
                {MODULE_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Submit Button Text
              </label>
              <input
                value={submitButtonText}
                onChange={(e) => setSubmitButtonText(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7770]/20"
              />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowAnonymous}
                  onChange={(e) => setAllowAnonymous(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-xs text-gray-600">Allow anonymous</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-xs text-gray-600">Active</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Success Heading
              </label>
              <input
                value={successHeading}
                onChange={(e) => setSuccessHeading(e.target.value)}
                placeholder="Thank you"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7770]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Success Message
              </label>
              <input
                value={successMessage}
                onChange={(e) => setSuccessMessage(e.target.value)}
                placeholder="Thank you for your submission."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7770]/20"
              />
            </div>
          </div>
        </div>

        {/* Thumbnail */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Link Thumbnail</h2>
          <p className="text-xs text-gray-500">
            Image shown when the form link is shared on social media. Compressed to WebP before upload.
          </p>
          <input
            ref={thumbInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleThumbnailUpload}
            className="hidden"
          />
          {thumbnail ? (
            <div className="relative inline-block">
              <img
                src={thumbnail}
                alt="Thumbnail preview"
                className="h-28 rounded-lg border border-gray-200 object-cover"
              />
              <button
                type="button"
                onClick={() => setThumbnail('')}
                className="absolute -top-2 -right-2 p-1 bg-white rounded-full border border-gray-200 text-gray-400 hover:text-red-500 shadow-sm"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => thumbInputRef.current?.click()}
              disabled={uploadingThumb}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-[#0D7770] hover:text-[#0D7770] transition-colors"
            >
              {uploadingThumb ? (
                <LoadingSpinner />
              ) : (
                <ImagePlus className="w-4 h-4" />
              )}
              {uploadingThumb ? 'Uploading...' : 'Upload Thumbnail'}
            </button>
          )}
        </div>

        {/* Theme/Style */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Appearance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {THEME_OPTIONS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`text-left p-3 rounded-lg border-2 transition-all ${
                  theme === t.value
                    ? 'border-[#0D7770] bg-[#0D7770]/5'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <span className="text-sm font-medium text-gray-900">
                  {t.label}
                </span>
                <span className="block text-[11px] text-gray-500 mt-0.5">
                  {t.desc}
                </span>
              </button>
            ))}
          </div>

          {theme === FormTheme.CUSTOM && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              {[
                { label: 'Primary', value: primaryColor, set: setPrimaryColor },
                {
                  label: 'Background',
                  value: backgroundColor,
                  set: setBackgroundColor,
                },
                { label: 'Text', value: textColor, set: setTextColor },
                { label: 'Card', value: cardColor, set: setCardColor },
              ].map((c) => (
                <div key={c.label}>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">
                    {c.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={c.value}
                      onChange={(e) => c.set(e.target.value)}
                      className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                    />
                    <input
                      value={c.value}
                      onChange={(e) => c.set(e.target.value)}
                      className="flex-1 px-2 py-1 text-xs font-mono border border-gray-200 rounded"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HTML Editor + Preview */}
        <div
          className={`grid gap-5 ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}
        >
          {/* Editor */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">
                Form HTML
              </h2>
            </div>
            <p className="text-xs text-gray-500">
              Write your form fields using HTML. Use standard form elements
              (input, textarea, select). The form will be styled
              automatically based on the theme above.
            </p>
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder="<div class='form-group'>&#10;  <label for='name'>Name</label>&#10;  <input type='text' id='name' name='name' placeholder='Your name' required />&#10;</div>"
              className="w-full px-4 py-3 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7770]/20 focus:border-[#0D7770] bg-gray-50"
              style={{ minHeight: 400, lineHeight: 1.6, tabSize: 2 }}
              spellCheck={false}
            />
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Live Preview
                </h2>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-100">
                <iframe
                  ref={previewRef}
                  className="w-full border-0"
                  style={{ minHeight: 500 }}
                  title="Form Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
