import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Save, Eye, EyeOff, Code, ImagePlus, X,
  Plus, Trash2, ChevronUp, ChevronDown, GripVertical,
  Type, Mail, Phone, Hash, AlignLeft, List, CircleDot,
  CheckSquare, ToggleLeft, Star, Calendar, Heading, FileText,
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { bulkEmailService } from '@/services/bulk-email'
import { uploadService } from '@/services/upload'
import {
  FormTheme,
  FormModule,
  FormFieldType,
  CreateFormTemplateData,
  type FormField,
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

const FIELD_TYPES: { type: FormFieldType; label: string; icon: typeof Type; group: string }[] = [
  { type: FormFieldType.HEADING, label: 'Section Heading', icon: Heading, group: 'Layout' },
  { type: FormFieldType.PARAGRAPH, label: 'Paragraph', icon: FileText, group: 'Layout' },
  { type: FormFieldType.TEXT, label: 'Text', icon: Type, group: 'Input' },
  { type: FormFieldType.EMAIL, label: 'Email', icon: Mail, group: 'Input' },
  { type: FormFieldType.PHONE, label: 'Phone', icon: Phone, group: 'Input' },
  { type: FormFieldType.NUMBER, label: 'Number', icon: Hash, group: 'Input' },
  { type: FormFieldType.DATE, label: 'Date', icon: Calendar, group: 'Input' },
  { type: FormFieldType.TEXTAREA, label: 'Long Text', icon: AlignLeft, group: 'Input' },
  { type: FormFieldType.SELECT, label: 'Dropdown', icon: List, group: 'Choice' },
  { type: FormFieldType.RADIO, label: 'Radio', icon: CircleDot, group: 'Choice' },
  { type: FormFieldType.CHECKBOX, label: 'Checkbox', icon: CheckSquare, group: 'Choice' },
  { type: FormFieldType.TOGGLE, label: 'Toggle', icon: ToggleLeft, group: 'Choice' },
  { type: FormFieldType.RATING, label: 'Rating', icon: Star, group: 'Special' },
]

const HAS_OPTIONS = new Set([FormFieldType.SELECT, FormFieldType.RADIO, FormFieldType.CHECKBOX])
const HAS_PLACEHOLDER = new Set([
  FormFieldType.TEXT, FormFieldType.EMAIL, FormFieldType.PHONE,
  FormFieldType.NUMBER, FormFieldType.TEXTAREA, FormFieldType.DATE,
])
const IS_LAYOUT = new Set([FormFieldType.HEADING, FormFieldType.PARAGRAPH])

function makeKey(label: string, index: number) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '') || `field_${index}`
}

function newField(type: FormFieldType, order: number): FormField {
  const label = FIELD_TYPES.find(f => f.type === type)?.label || 'Field'
  return {
    key: makeKey(label, order),
    type,
    label,
    placeholder: '',
    required: false,
    width: 'full' as const,
    order,
    options: HAS_OPTIONS.has(type) ? [{ label: 'Option 1', value: 'option_1' }] : [],
    validation: {},
  }
}

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

// ---------- Field Card ----------

function FieldCard({
  field,
  index,
  total,
  onUpdate,
  onRemove,
  onMove,
}: {
  field: FormField
  index: number
  total: number
  onUpdate: (f: FormField) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isLayout = IS_LAYOUT.has(field.type)
  const hasOptions = HAS_OPTIONS.has(field.type)
  const hasPlaceholder = HAS_PLACEHOLDER.has(field.type)
  const meta = FIELD_TYPES.find(f => f.type === field.type)
  const Icon = meta?.icon || Type

  const set = (patch: Partial<FormField>) => onUpdate({ ...field, ...patch })

  return (
    <div className={`border rounded-lg transition-all ${
      field.type === FormFieldType.HEADING
        ? 'border-indigo-200 bg-indigo-50/40'
        : 'border-gray-200 bg-white'
    }`}>
      {/* Collapsed row */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <GripVertical className="w-3.5 h-3.5 text-gray-300 shrink-0" />
        <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide shrink-0">
          {meta?.label}
        </span>
        <span className="text-sm text-gray-800 font-medium truncate flex-1">
          {field.label}
        </span>
        {field.required && (
          <span className="text-[10px] font-semibold text-red-500 shrink-0">REQ</span>
        )}
        <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-20"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-20"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-500 ml-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Label</label>
              <input
                value={field.label}
                onChange={e => {
                  const label = e.target.value
                  set({ label, key: makeKey(label, index) })
                }}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0D7770]/30"
              />
            </div>
            {hasPlaceholder && (
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Placeholder</label>
                <input
                  value={field.placeholder || ''}
                  onChange={e => set({ placeholder: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0D7770]/30"
                />
              </div>
            )}
          </div>

          {!isLayout && (
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={e => set({ required: e.target.checked })}
                  className="rounded border-gray-300 accent-[#0D7770]"
                />
                <span className="text-xs text-gray-600">Required</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <select
                  value={field.width}
                  onChange={e => set({ width: e.target.value as 'full' | 'half' })}
                  className="text-xs border border-gray-200 rounded px-1.5 py-1"
                >
                  <option value="full">Full width</option>
                  <option value="half">Half width</option>
                </select>
              </label>
            </div>
          )}

          {hasOptions && (
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Options</label>
              <div className="space-y-1.5">
                {(field.options || []).map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      value={opt.label}
                      onChange={e => {
                        const updated = [...(field.options || [])]
                        updated[oi] = { label: e.target.value, value: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_') }
                        set({ options: updated })
                      }}
                      className="flex-1 px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0D7770]/30"
                      placeholder={`Option ${oi + 1}`}
                    />
                    <button
                      onClick={() => {
                        const updated = (field.options || []).filter((_, i) => i !== oi)
                        set({ options: updated })
                      }}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const n = (field.options?.length || 0) + 1
                    set({ options: [...(field.options || []), { label: `Option ${n}`, value: `option_${n}` }] })
                  }}
                  className="text-xs text-[#0D7770] hover:underline mt-1"
                >
                  + Add option
                </button>
              </div>
            </div>
          )}

          {!isLayout && (
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Help text <span className="text-gray-400">(optional)</span></label>
              <input
                value={field.helpText || ''}
                onChange={e => set({ helpText: e.target.value })}
                placeholder="Shown below the field"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0D7770]/30"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------- Add Field Picker ----------

function AddFieldPicker({ onAdd }: { onAdd: (type: FormFieldType) => void }) {
  const [open, setOpen] = useState(false)
  const groups = ['Layout', 'Input', 'Choice', 'Special']

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-[#0D7770] hover:text-[#0D7770] transition-colors flex items-center justify-center gap-1.5"
      >
        <Plus className="w-4 h-4" />
        Add Field
      </button>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">Choose field type</span>
        <button onClick={() => setOpen(false)} className="p-0.5 text-gray-400 hover:text-gray-600">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {groups.map(group => {
        const items = FIELD_TYPES.filter(f => f.group === group)
        if (!items.length) return null
        return (
          <div key={group}>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{group}</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {items.map(f => {
                const Icon = f.icon
                return (
                  <button
                    key={f.type}
                    onClick={() => { onAdd(f.type); setOpen(false) }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:border-[#0D7770] hover:text-[#0D7770] transition-colors"
                  >
                    <Icon className="w-3 h-3" />
                    {f.label}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------- Main FormBuilder ----------

export default function FormBuilder() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const previewRef = useRef<HTMLIFrameElement>(null)

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Editor mode: 'fields' (visual) or 'html' (raw)
  const [editorMode, setEditorMode] = useState<'fields' | 'html'>('fields')

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

  // Fields (visual editor)
  const [fields, setFields] = useState<FormField[]>([])

  // HTML content (raw editor)
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

        if (form.fields && form.fields.length > 0) {
          setFields(form.fields.map((f, i) => ({
            key: f.key,
            type: f.type,
            label: f.label,
            placeholder: f.placeholder || '',
            required: f.required ?? false,
            width: f.width || 'full',
            order: f.order ?? i,
            options: f.options || [],
            validation: f.validation || {},
            helpText: f.helpText,
            defaultValue: f.defaultValue,
          })))
          setEditorMode('fields')
        } else if (form.htmlContent) {
          setEditorMode('html')
        }
      } catch {
        showToast.error('Failed to load form')
        navigate('/bulk-email/forms')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

  // --- Thumbnail ---

  const MAX_THUMB_BYTES = 300 * 1024

  const compressImage = (file: File, maxWidth = 1200): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const url = img.src
        const compress = (width: number, quality: number) => {
          const canvas = document.createElement('canvas')
          const scale = Math.min(1, width / img.width)
          canvas.width = Math.round(img.width * scale)
          canvas.height = Math.round(img.height * scale)
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          canvas.toBlob(
            (blob) => {
              if (blob!.size > MAX_THUMB_BYTES) {
                if (quality > 0.3) compress(width, quality - 0.1)
                else if (width > 600) compress(Math.round(width * 0.7), 0.5)
                else {
                  URL.revokeObjectURL(url)
                  resolve(new File([blob!], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }))
                }
              } else {
                URL.revokeObjectURL(url)
                resolve(new File([blob!], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }))
              }
            },
            'image/webp',
            quality,
          )
        }
        compress(maxWidth, 0.75)
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

  // --- Field operations ---

  const addField = (type: FormFieldType) => {
    setFields(prev => [...prev, newField(type, prev.length)])
  }

  const updateField = (index: number, updated: FormField) => {
    setFields(prev => prev.map((f, i) => i === index ? updated : f))
  }

  const removeField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index))
  }

  const moveField = (index: number, dir: -1 | 1) => {
    setFields(prev => {
      const arr = [...prev]
      const target = index + dir
      if (target < 0 || target >= arr.length) return arr
      ;[arr[index], arr[target]] = [arr[target], arr[index]]
      return arr
    })
  }

  // --- Preview (HTML mode) ---

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
    .form-group { margin-bottom: 20px; }
    label {
      display: block; font-size: 12px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.05em;
      margin-bottom: 6px; color: var(--text); opacity: 0.7;
    }
    .required { color: #ef4444; }
    .optional { font-weight: 400; opacity: 0.5; text-transform: none; }
    input[type="text"], input[type="email"], input[type="tel"],
    input[type="number"], input[type="date"], select, textarea {
      width: 100%; padding: 10px 14px; font-size: 14px;
      font-family: var(--font); color: var(--text);
      background: var(--input-bg); border: 1px solid var(--border);
      border-radius: 8px; outline: none; transition: border-color 0.2s;
    }
    input:focus, select:focus, textarea:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary), transparent 80%);
    }
    textarea { resize: vertical; min-height: 80px; }
    .rating-group { display: flex; gap: 6px; }
    .star-btn {
      width: 36px; height: 36px; font-size: 20px;
      border: 1px solid var(--border); background: var(--input-bg);
      color: var(--text); opacity: 0.3; border-radius: 8px;
      cursor: pointer; transition: all 0.15s;
    }
    .star-btn:hover, .star-btn.active {
      opacity: 1; color: var(--primary); border-color: var(--primary);
    }
    .submit-btn {
      width: 100%; padding: 12px; font-size: 14px; font-weight: 600;
      color: white; background: var(--primary); border: none;
      border-radius: 8px; cursor: pointer; margin-top: 8px;
    }
    input[type="checkbox"], input[type="radio"] { accent-color: var(--primary); }
    .checkbox-label, .radio-label {
      display: flex; align-items: center; gap: 8px;
      font-size: 14px; font-weight: 400; text-transform: none;
      letter-spacing: 0; opacity: 1; cursor: pointer; margin-bottom: 6px;
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
    if (showPreview && editorMode === 'html' && previewRef.current) {
      const doc = previewRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(generatePreviewHtml())
        doc.close()
      }
    }
  }, [showPreview, editorMode, htmlContent, theme, primaryColor, backgroundColor, textColor, cardColor, submitButtonText])

  // --- Save ---

  const handleSave = async () => {
    if (!name.trim()) {
      showToast.error('Form name is required')
      return
    }
    if (fields.length === 0 && !htmlContent.trim()) {
      showToast.error(editorMode === 'html' ? 'HTML content is required' : 'Add at least one field')
      return
    }

    const orderedFields = fields.map((f, i) => ({ ...f, order: i }))
    const useFields = editorMode === 'fields' ? orderedFields.length > 0 : false
    const useHtml = editorMode === 'html' ? !!htmlContent.trim() : !useFields && !!htmlContent.trim()

    const data: CreateFormTemplateData = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim() || undefined,
      module,
      fields: useFields ? orderedFields : [],
      htmlContent: useHtml ? htmlContent : undefined,
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
            {editorMode === 'html' && (
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
            )}
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

        {/* Editor Mode Toggle */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Form Fields</h2>
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setEditorMode('fields')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  editorMode === 'fields'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Visual Editor
              </button>
              <button
                onClick={() => setEditorMode('html')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                  editorMode === 'html'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Code className="w-3 h-3" />
                HTML
              </button>
            </div>
          </div>

          {editorMode === 'fields' ? (
            <div className="space-y-2">
              {fields.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">
                  No fields yet. Click "Add Field" below to get started.
                </p>
              )}
              {fields.map((field, i) => (
                <FieldCard
                  key={`${field.key}-${i}`}
                  field={field}
                  index={i}
                  total={fields.length}
                  onUpdate={(f) => updateField(i, f)}
                  onRemove={() => removeField(i)}
                  onMove={(dir) => moveField(i, dir)}
                />
              ))}
              <AddFieldPicker onAdd={addField} />
              {fields.some(f => f.type === FormFieldType.HEADING) && fields.filter(f => f.type === FormFieldType.HEADING).length >= 1 && (
                <p className="text-[11px] text-indigo-500 mt-1">
                  Headings split the form into multi-step sections on the public page.
                </p>
              )}
            </div>
          ) : (
            <div className={`grid gap-5 ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              <div className="space-y-2">
                <p className="text-xs text-gray-500">
                  Write your form fields using HTML. Use standard form elements (input, textarea, select).
                  The form will be styled automatically based on the theme above.
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

              {showPreview && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-900">
                      Live Preview
                    </span>
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
          )}
        </div>
      </div>
    </Layout>
  )
}
