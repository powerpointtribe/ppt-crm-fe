import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Copy
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { bulkEmailService } from '@/services/bulk-email'
import { EmailTemplate, EmailTemplateCategory } from '@/types/bulk-email'
import { showToast } from '@/utils/toast'
import { formatDate } from '@/utils/formatters'

function getCategoryBadge(category: EmailTemplateCategory) {
  const colors: Record<EmailTemplateCategory, string> = {
    [EmailTemplateCategory.GENERAL]: 'bg-gray-100 text-gray-700',
    [EmailTemplateCategory.WELCOME]: 'bg-green-100 text-green-700',
    [EmailTemplateCategory.ANNOUNCEMENT]: 'bg-blue-100 text-blue-700',
    [EmailTemplateCategory.EVENT]: 'bg-purple-100 text-purple-700',
    [EmailTemplateCategory.REMINDER]: 'bg-orange-100 text-orange-700',
    [EmailTemplateCategory.NEWSLETTER]: 'bg-pink-100 text-pink-700',
  }

  return (
    <Badge className={colors[category]}>
      {category.toLowerCase().replace('_', ' ')}
    </Badge>
  )
}

export default function TemplateDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')

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
    } catch (error: any) {
      console.error('Error fetching template:', error)
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
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      })
      setPreviewHtml(preview.html)
      setShowPreview(true)
    } catch (error: any) {
      // Fallback to local preview
      let previewContent = template.htmlContent
      previewContent = previewContent.replace(/\{\{firstName\}\}/g, 'John')
      previewContent = previewContent.replace(/\{\{lastName\}\}/g, 'Doe')
      previewContent = previewContent.replace(/\{\{email\}\}/g, 'john.doe@example.com')
      setPreviewHtml(previewContent)
      setShowPreview(true)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showToast('success', 'Copied to clipboard')
  }

  if (loading) {
    return (
      <Layout title="Template Details">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error || !template) {
    return (
      <Layout title="Template Details">
        <Card className="p-8 text-center">
          <p className="text-red-600">{error?.message || 'Template not found'}</p>
          <Button variant="outline" onClick={() => navigate('/bulk-email/templates')} className="mt-4">
            Back to Templates
          </Button>
        </Card>
      </Layout>
    )
  }

  return (
    <Layout title={template.name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/bulk-email/templates')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Link to={`/bulk-email/templates/${template._id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Template Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
                  <p className="text-gray-600 mt-1">{template.subject}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getCategoryBadge(template.category)}
                  {template.isActive ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">HTML Content</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(template.htmlContent)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
                <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-sm font-mono max-h-96">
                  {template.htmlContent}
                </pre>
              </div>

              {template.plainTextContent && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">Plain Text Content</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(template.plainTextContent || '')}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-sm max-h-48">
                    {template.plainTextContent}
                  </pre>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Template Info</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {template.isActive ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-700">Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Inactive</span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="text-gray-900 capitalize mt-1">
                    {template.category.toLowerCase().replace('_', ' ')}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="text-gray-900 mt-1">{formatDate(template.createdAt)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="text-gray-900 mt-1">{formatDate(template.updatedAt)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Available Variables</h3>
              <div className="flex flex-wrap gap-2">
                {template.availableVariables.map((variable) => (
                  <code
                    key={variable}
                    className="px-2 py-1 bg-gray-100 rounded text-sm cursor-pointer hover:bg-blue-100"
                    onClick={() => copyToClipboard(`{{${variable}}}`)}
                  >
                    {`{{${variable}}}`}
                  </code>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link to={`/bulk-email/campaigns/new?templateId=${template._id}`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Use in Campaign
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>

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
