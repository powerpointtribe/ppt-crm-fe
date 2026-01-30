import { useState, useRef, useCallback } from 'react'
import { Eye, Code, Copy, Check, RefreshCw, ClipboardPaste } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { showToast } from '@/utils/toast'

interface Variable {
  name: string
  label: string
  sampleValue: string
}

const DEFAULT_VARIABLES: Variable[] = [
  { name: 'firstName', label: 'First Name', sampleValue: 'John' },
  { name: 'lastName', label: 'Last Name', sampleValue: 'Doe' },
  { name: 'email', label: 'Email', sampleValue: 'john.doe@example.com' },
  { name: 'phone', label: 'Phone', sampleValue: '+1234567890' },
  { name: 'branchName', label: 'Branch Name', sampleValue: 'Main Branch' },
  { name: 'groupName', label: 'Group Name', sampleValue: 'Youth Group' },
  { name: 'unitName', label: 'Unit Name', sampleValue: 'Media Unit' },
  { name: 'districtName', label: 'District Name', sampleValue: 'Central District' },
  { name: 'membershipStatus', label: 'Membership Status', sampleValue: 'Active' },
  { name: 'joinDate', label: 'Join Date', sampleValue: 'January 15, 2024' },
]

interface EmailEditorProps {
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
}

export default function EmailEditor({ value, onChange, error, placeholder }: EmailEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')
  const [sampleData, setSampleData] = useState<Record<string, string>>(
    DEFAULT_VARIABLES.reduce((acc, v) => ({ ...acc, [v.name]: v.sampleValue }), {})
  )
  const [showSampleDataModal, setShowSampleDataModal] = useState(false)
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null)

  // Insert variable at cursor position
  const insertVariable = useCallback((variableName: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const variable = `{{${variableName}}}`

    const newValue = value.substring(0, start) + variable + value.substring(end)
    onChange(newValue)

    // Set cursor position after the inserted variable
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + variable.length, start + variable.length)
    }, 0)

    showToast('success', `Inserted {{${variableName}}}`)
  }, [value, onChange])

  // Copy variable to clipboard
  const copyVariable = useCallback((variableName: string) => {
    navigator.clipboard.writeText(`{{${variableName}}}`)
    setCopiedVariable(variableName)
    setTimeout(() => setCopiedVariable(null), 2000)
  }, [])

  // Generate preview HTML with sample data
  const getPreviewHtml = useCallback(() => {
    let html = value
    Object.entries(sampleData).forEach(([key, val]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      html = html.replace(regex, val)
    })
    return html
  }, [value, sampleData])

  // Paste from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      onChange(text)
      showToast('success', 'Template pasted from clipboard')
    } catch (err) {
      showToast('error', 'Failed to read from clipboard')
    }
  }

  // Reset to sample template
  const insertSampleTemplate = () => {
    const sampleTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to {{branchName}}</h1>
    </div>
    <div class="content">
      <p>Dear {{firstName}} {{lastName}},</p>
      <p>We are delighted to have you as part of our community!</p>
      <p>Your email: {{email}}</p>
      <p>Your membership status: {{membershipStatus}}</p>
      <p style="text-align: center; margin-top: 30px;">
        <a href="#" class="button">Visit Our Website</a>
      </p>
    </div>
    <div class="footer">
      <p>{{branchName}} | {{districtName}}</p>
      <p>You received this email because you are a member of our church.</p>
    </div>
  </div>
</body>
</html>`
    onChange(sampleTemplate)
    showToast('success', 'Sample template inserted')
  }

  return (
    <div className="space-y-4">
      {/* Variable Buttons */}
      <Card className="p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">
            Dynamic Variables (Click to insert, or copy)
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowSampleDataModal(true)}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Edit Sample Data
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_VARIABLES.map((variable) => (
            <div
              key={variable.name}
              className="inline-flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 transition-colors"
            >
              <button
                type="button"
                onClick={() => insertVariable(variable.name)}
                className="px-3 py-1.5 text-sm font-mono hover:bg-blue-50 transition-colors"
                title={`Click to insert {{${variable.name}}} at cursor`}
              >
                {`{{${variable.name}}}`}
              </button>
              <button
                type="button"
                onClick={() => copyVariable(variable.name)}
                className="px-2 py-1.5 border-l border-gray-200 hover:bg-gray-100 transition-colors"
                title="Copy to clipboard"
              >
                {copiedVariable === variable.name ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3 text-gray-400" />
                )}
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          These variables will be replaced with actual member data when the email is sent.
        </p>
      </Card>

      {/* Editor/Preview Tabs */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Tab Header */}
        <div className="flex items-center justify-between bg-gray-100 border-b border-gray-200">
          <div className="flex">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${
                activeTab === 'editor'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Code className="h-4 w-4" />
              HTML Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${
                activeTab === 'preview'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
          </div>
          <div className="flex items-center gap-2 pr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handlePaste}
              title="Paste template from clipboard"
            >
              <ClipboardPaste className="h-4 w-4 mr-1" />
              Paste
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={insertSampleTemplate}
              title="Insert sample email template"
            >
              Sample Template
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'editor' ? (
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={20}
                className="w-full p-4 font-mono text-sm border-0 focus:ring-0 resize-none"
                placeholder={placeholder || `Paste your HTML email template here or start typing...

Example:
<!DOCTYPE html>
<html>
<body>
  <h1>Hello {{firstName}}!</h1>
  <p>Welcome to {{branchName}}.</p>
</body>
</html>`}
                spellCheck={false}
              />
              {/* Line count indicator */}
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {value.split('\n').length} lines | {value.length} characters
              </div>
            </div>
          ) : (
            <div className="p-4 bg-white">
              <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                <strong>Preview Mode:</strong> Dynamic variables are replaced with sample data.
                <button
                  type="button"
                  onClick={() => setShowSampleDataModal(true)}
                  className="underline ml-1"
                >
                  Edit sample data
                </button>
              </div>
              {value ? (
                <div className="border rounded-lg overflow-hidden bg-white">
                  <iframe
                    srcDoc={getPreviewHtml()}
                    className="w-full h-[500px] border-0"
                    title="Email Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  No content to preview. Add HTML content in the editor tab.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Sample Data Modal */}
      <Modal
        isOpen={showSampleDataModal}
        onClose={() => setShowSampleDataModal(false)}
        title="Edit Sample Data for Preview"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Customize the sample values used in the preview. These values help you see how your email will look with real data.
          </p>
          <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {DEFAULT_VARIABLES.map((variable) => (
              <div key={variable.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {variable.label}
                </label>
                <Input
                  value={sampleData[variable.name] || ''}
                  onChange={(e) =>
                    setSampleData((prev) => ({ ...prev, [variable.name]: e.target.value }))
                  }
                  placeholder={variable.sampleValue}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSampleData(
                  DEFAULT_VARIABLES.reduce((acc, v) => ({ ...acc, [v.name]: v.sampleValue }), {})
                )
              }}
            >
              Reset to Defaults
            </Button>
            <Button type="button" onClick={() => setShowSampleDataModal(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
