import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Eye, Calendar, Clock } from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { messageDraftsService } from '@/services/message-drafts'

export default function MessageDraftForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [preview, setPreview] = useState<{ preview: string; htmlPreview: string } | null>(null)
  const [error, setError] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (isEditing) {
      loadDraft()
    }
  }, [id])

  const loadDraft = async () => {
    if (!id) return
    try {
      setLoading(true)
      const draft = await messageDraftsService.getMessageDraftById(id)
      setTitle(draft.title)
      setMessage(draft.message)

      // Format date for input
      const date = new Date(draft.scheduledDate)
      const dateStr = date.toISOString().split('T')[0]
      setScheduledDate(dateStr)

      // Format time for input
      const timeDate = new Date(draft.scheduledTime)
      const hours = timeDate.getHours().toString().padStart(2, '0')
      const minutes = timeDate.getMinutes().toString().padStart(2, '0')
      setScheduledTime(`${hours}:${minutes}`)
    } catch (error: any) {
      console.error('Error loading draft:', error)
      setError({
        status: error?.code || error?.response?.status || 500,
        message: 'Failed to load draft',
        details: error?.message || error?.response?.data?.message || 'An unexpected error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async () => {
    if (!message.trim()) {
      alert('Please enter a message first')
      return
    }

    try {
      setPreviewLoading(true)
      const previewData = await messageDraftsService.previewMessage({ message })
      setPreview(previewData)
      setShowPreview(true)
    } catch (error: any) {
      console.error('Error generating preview:', error)
      alert('Failed to generate preview: ' + (error?.message || 'An unexpected error occurred'))
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) {
      alert('Please enter a message')
      return
    }

    if (!scheduledDate) {
      alert('Please select a scheduled date')
      return
    }

    if (!scheduledTime) {
      alert('Please select a scheduled time')
      return
    }

    try {
      setLoading(true)
      const data = {
        title: title.trim() || undefined, // Let backend generate default if empty
        message: message.trim(),
        scheduledDate,
        scheduledTime,
      }

      if (isEditing && id) {
        await messageDraftsService.updateMessageDraft(id, data)
      } else {
        await messageDraftsService.createMessageDraft(data)
      }

      navigate('/first-timers/message-drafts')
    } catch (error: any) {
      console.error('Error saving draft:', error)
      alert('Failed to save draft: ' + (error?.message || error?.response?.data?.message || 'An unexpected error occurred'))
    } finally {
      setLoading(false)
    }
  }

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('message-textarea') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = message
    const before = text.substring(0, start)
    const after = text.substring(end, text.length)

    setMessage(before + variable + after)

    // Set cursor position after the inserted variable
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + variable.length, start + variable.length)
    }, 0)
  }

  if (loading && isEditing) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      </Layout>
    )
  }

  return (
    <ErrorBoundary error={error}>
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/first-timers/message-drafts')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isEditing ? 'Edit Message Draft' : 'New Message Draft'}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Compose a message to send to first timers
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title and Message Composer */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Welcome Message for New Visitors (leave empty for auto-generated title)"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    If not provided, defaults to "First Timers Draft for {'{'}date{'}'}"
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Message
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => insertVariable('{{firstName}}')}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                      >
                        Insert First Name
                      </button>
                      <button
                        type="button"
                        onClick={() => insertVariable('{{lastName}}')}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                      >
                        Insert Last Name
                      </button>
                    </div>
                  </div>
                  <textarea
                    id="message-textarea"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Dear {{firstName}} {{lastName}},&#10;&#10;Thank you for visiting our church! We're thrilled to have you join our community..."
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Available variables: <code className="bg-gray-100 px-1 py-0.5 rounded">{'{{firstName}}'}</code> and <code className="bg-gray-100 px-1 py-0.5 rounded">{'{{lastName}}'}</code>
                  </p>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handlePreview}
                  disabled={previewLoading || !message.trim()}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  {previewLoading ? 'Generating Preview...' : 'Preview Message'}
                </Button>
              </div>
            </div>

            {/* Schedule Settings */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Message will be sent to all first timers who visited on this date
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Scheduled Time
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Time when the message should be sent
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/first-timers/message-drafts')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : isEditing ? 'Update Draft' : 'Create Draft'}
              </Button>
            </div>
          </form>

          {/* Preview Modal */}
          {showPreview && preview && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Message Preview</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    This is how the message will appear in the email
                  </p>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                  <div dangerouslySetInnerHTML={{ __html: preview.htmlPreview }} />
                </div>
                <div className="p-6 border-t border-gray-200 flex justify-end">
                  <Button onClick={() => setShowPreview(false)}>
                    Close Preview
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ErrorBoundary>
  )
}
