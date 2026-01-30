import { QRCodeSVG } from 'qrcode.react'
import { QrCode, Image, MessageSquare, FileText, ExternalLink } from 'lucide-react'
import {
  FormHeader,
  SuccessMessage,
  TermsAndConditions,
  FormLayout,
  FormStatus,
} from '@/types/registration-form'
import Input from '@/components/ui/Input'
import { cn } from '@/utils/cn'

interface FormSettingsPanelProps {
  formLayout: FormLayout
  formStatus: FormStatus
  qrCodeEnabled: boolean
  formHeader: FormHeader | undefined
  successMessage: SuccessMessage | undefined
  termsAndConditions: TermsAndConditions | undefined
  registrationSlug?: string
  onFormLayoutChange: (layout: FormLayout) => void
  onFormStatusChange: (status: FormStatus) => void
  onQrCodeEnabledChange: (enabled: boolean) => void
  onFormHeaderChange: (header: FormHeader) => void
  onSuccessMessageChange: (message: SuccessMessage) => void
  onTermsAndConditionsChange: (terms: TermsAndConditions) => void
}

export default function FormSettingsPanel({
  formLayout,
  formStatus,
  qrCodeEnabled,
  formHeader = {},
  successMessage = {},
  termsAndConditions = { enabled: false },
  registrationSlug,
  onFormLayoutChange,
  onFormStatusChange,
  onQrCodeEnabledChange,
  onFormHeaderChange,
  onSuccessMessageChange,
  onTermsAndConditionsChange,
}: FormSettingsPanelProps) {
  const publicUrl = registrationSlug
    ? `${window.location.origin}/event-registration/${registrationSlug}`
    : null

  return (
    <div className="space-y-6">
      {/* Form Status */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Form Status
        </h4>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onFormStatusChange('draft')}
            className={cn(
              'flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all',
              formStatus === 'draft'
                ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            Draft
          </button>
          <button
            type="button"
            onClick={() => onFormStatusChange('live')}
            className={cn(
              'flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all',
              formStatus === 'live'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            Live
          </button>
        </div>
        <p className="text-xs text-gray-500">
          {formStatus === 'draft'
            ? 'Form is not publicly visible'
            : 'Form is publicly accessible'}
        </p>
      </div>

      {/* Form Layout */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Form Layout</h4>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onFormLayoutChange('single-page')}
            className={cn(
              'flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all',
              formLayout === 'single-page'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            Single Page
          </button>
          <button
            type="button"
            onClick={() => onFormLayoutChange('multi-section')}
            className={cn(
              'flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all',
              formLayout === 'multi-section'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            Multi-Section
          </button>
        </div>
      </div>

      {/* QR Code */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            QR Code Sharing
          </h4>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={qrCodeEnabled}
              onChange={(e) => onQrCodeEnabledChange(e.target.checked)}
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
        {qrCodeEnabled && publicUrl && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <div className="inline-block p-3 bg-white rounded-lg shadow-sm">
              <QRCodeSVG value={publicUrl} size={120} />
            </div>
            <p className="text-xs text-gray-500 mt-2 break-all">
              {publicUrl}
            </p>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline mt-1"
            >
              Open form <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
        {qrCodeEnabled && !publicUrl && (
          <p className="text-xs text-amber-600">
            Set a registration slug to enable QR code sharing
          </p>
        )}
      </div>

      {/* Form Header */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Image className="h-4 w-4" />
          Form Header
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Custom Title
            </label>
            <Input
              value={formHeader.title || ''}
              onChange={(e) => onFormHeaderChange({ ...formHeader, title: e.target.value })}
              placeholder="Leave empty to use event title"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Description
            </label>
            <textarea
              value={formHeader.description || ''}
              onChange={(e) => onFormHeaderChange({ ...formHeader, description: e.target.value })}
              placeholder="Brief description for the form"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Logo URL
            </label>
            <Input
              value={formHeader.logoUrl || ''}
              onChange={(e) => onFormHeaderChange({ ...formHeader, logoUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Success Message */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Success Message
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Title
            </label>
            <Input
              value={successMessage.title || ''}
              onChange={(e) => onSuccessMessageChange({ ...successMessage, title: e.target.value })}
              placeholder="Registration Successful!"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Message
            </label>
            <textarea
              value={successMessage.message || ''}
              onChange={(e) => onSuccessMessageChange({ ...successMessage, message: e.target.value })}
              placeholder="Thank you for registering..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showCheckInQR"
              checked={successMessage.showCheckInQR !== false}
              onChange={(e) => onSuccessMessageChange({ ...successMessage, showCheckInQR: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="showCheckInQR" className="ml-2 text-sm text-gray-700">
              Show check-in QR code on success
            </label>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Terms & Conditions
          </h4>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={termsAndConditions.enabled}
              onChange={(e) => onTermsAndConditionsChange({ ...termsAndConditions, enabled: e.target.checked })}
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
        {termsAndConditions.enabled && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Checkbox Text
              </label>
              <Input
                value={termsAndConditions.text || ''}
                onChange={(e) => onTermsAndConditionsChange({ ...termsAndConditions, text: e.target.value })}
                placeholder="I agree to the terms and conditions"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Link URL (optional)
              </label>
              <Input
                value={termsAndConditions.linkUrl || ''}
                onChange={(e) => onTermsAndConditionsChange({ ...termsAndConditions, linkUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
