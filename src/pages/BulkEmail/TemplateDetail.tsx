import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Edit, Trash2, FileText, Eye, CheckCircle, XCircle,
  Copy, Lock, Send, Code, AlignLeft,
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { bulkEmailService } from '@/services/bulk-email'
import { EmailTemplate, EmailTemplateCategory } from '@/types/bulk-email'
import { showToast } from '@/utils/toast'
import { formatDate } from '@/utils/formatters'

const CATEGORY_COLORS: Record<string, string> = {
  [EmailTemplateCategory.GENERAL]: 'bg-gray-50 text-gray-700',
  [EmailTemplateCategory.WELCOME]: 'bg-emerald-50 text-emerald-700',
  [EmailTemplateCategory.ANNOUNCEMENT]: 'bg-blue-50 text-blue-700',
  [EmailTemplateCategory.EVENT]: 'bg-purple-50 text-purple-700',
  [EmailTemplateCategory.REMINDER]: 'bg-amber-50 text-amber-700',
  [EmailTemplateCategory.NEWSLETTER]: 'bg-pink-50 text-pink-700',
}

export default function TemplateDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [activeContentTab, setActiveContentTab] = useState<'preview' | 'html' | 'plain'>('preview')

  useEffect(() => {
    if (id) fetchTemplate()
  }, [id])

  const fetchTemplate = async () => {
    try {
      setLoading(true)
      const data = await bulkEmailService.getTemplateById(id!)
      setTemplate(data)
    } catch (error: any) {
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this template?')) return
    try {
      await bulkEmailService.deleteTemplate(id!)
      showToast('success', 'Template deleted successfully')
      navigate('/bulk-email/templates')
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete template')
    }
  }

  const handlePreview = async () => {
    if (!template) return
    try {
      const preview = await bulkEmailService.previewTemplate(id!, {
        firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com',
      })
      setPreviewHtml(preview.html)
    } catch {
      let previewContent = template.htmlContent
      previewContent = previewContent.replace(/\{\{firstName\}\}/g, 'John')
      previewContent = previewContent.replace(/\{\{lastName\}\}/g, 'Doe')
      previewContent = previewContent.replace(/\{\{email\}\}/g, 'john.doe@example.com')
      setPreviewHtml(previewContent)
    }
    setShowPreview(true)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showToast('success', 'Copied to clipboard')
  }

  if (loading) {
    return <Layout title="Template Details"><div className="flex justify-center py-16"><LoadingSpinner /></div></Layout>
  }

  if (error || !template) {
    return (
      <Layout title="Template Details">
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-sm text-red-600 mb-3">{error?.message || 'Template not found'}</p>
          <Button size="sm" variant="secondary" onClick={() => navigate('/bulk-email/templates')}>Back to Templates</Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={template.name}>
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/bulk-email/templates')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900">{template.name}</h1>
                {template.isSystem && <Lock className="w-4 h-4 text-gray-400" title="System template" />}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{template.subject}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handlePreview}>
              <Eye className="w-3.5 h-3.5 mr-1" /> Preview
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate(`/bulk-email/templates/${template._id}/edit`)}>
              <Edit className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
            {!template.isSystem && (
              <Button variant="secondary" size="sm" onClick={handleDelete} className="text-red-600 hover:bg-red-50">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
              </Button>
            )}
          </div>
        </div>

        {/* Info chips */}
        <div className="flex gap-2 flex-wrap">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[template.category] || 'bg-gray-50 text-gray-700'}`}>
            {template.category.charAt(0) + template.category.slice(1).toLowerCase().replace('_', ' ')}
          </span>
          {template.isActive ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
              <CheckCircle className="w-3 h-3" /> Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
              <XCircle className="w-3 h-3" /> Inactive
            </span>
          )}
          {template.slug && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono bg-gray-50 text-gray-500 border border-gray-200">
              {template.slug}
            </span>
          )}
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs text-gray-500 bg-gray-50 border border-gray-200">
            Created {formatDate(template.createdAt)}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs text-gray-500 bg-gray-50 border border-gray-200">
            Updated {formatDate(template.updatedAt)}
          </span>
        </div>

        {/* Variables */}
        {template.availableVariables?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Available Variables</p>
            <div className="flex flex-wrap gap-1.5">
              {template.availableVariables.map((variable) => (
                <button
                  key={variable}
                  onClick={() => copyToClipboard(`{{${variable}}}`)}
                  className="px-2.5 py-1 rounded-lg bg-[#0D7770]/5 text-[#0D7770] text-xs font-mono hover:bg-[#0D7770]/10 transition-colors"
                  title="Click to copy"
                >
                  {`{{${variable}}}`}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Content tabs */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-4">
            <div className="flex gap-0">
              {[
                { key: 'preview' as const, label: 'Preview', icon: Eye },
                { key: 'html' as const, label: 'HTML', icon: Code },
                ...(template.plainTextContent ? [{ key: 'plain' as const, label: 'Plain Text', icon: AlignLeft }] : []),
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveContentTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeContentTab === tab.key
                      ? 'border-[#0D7770] text-[#0D7770]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              ))}
            </div>
            {activeContentTab === 'html' && (
              <button
                onClick={() => copyToClipboard(template.htmlContent)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
            )}
          </div>

          <div className="p-4">
            {activeContentTab === 'preview' && (
              <iframe
                srcDoc={template.htmlContent}
                className="w-full min-h-[400px] border border-gray-100 rounded-lg bg-white"
                title="Template Preview"
                sandbox="allow-same-origin"
              />
            )}
            {activeContentTab === 'html' && (
              <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-xs font-mono max-h-[500px] text-gray-700 leading-relaxed">
                {template.htmlContent}
              </pre>
            )}
            {activeContentTab === 'plain' && template.plainTextContent && (
              <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-sm max-h-[400px] text-gray-700 leading-relaxed">
                {template.plainTextContent}
              </pre>
            )}
          </div>
        </motion.div>

        {/* Quick action */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Link to={`/bulk-email/campaigns/new?templateId=${template._id}`}>
            <div className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all p-4 flex items-center gap-3 cursor-pointer">
              <div className="w-9 h-9 rounded-lg bg-[#0D7770]/10 flex items-center justify-center">
                <Send className="w-4 h-4 text-[#0D7770]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Use in Campaign</p>
                <p className="text-xs text-gray-500">Create a new campaign with this template</p>
              </div>
              <ArrowLeft className="w-4 h-4 text-gray-300 rotate-180" />
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Preview Modal */}
      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="Email Preview" size="lg">
        <div className="border border-gray-100 rounded-lg overflow-hidden">
          <iframe srcDoc={previewHtml} className="w-full h-[500px] border-0" title="Email Preview" />
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="secondary" size="sm" onClick={() => setShowPreview(false)}>Close</Button>
        </div>
      </Modal>
    </Layout>
  )
}
