import { QRCodeSVG } from 'qrcode.react'
import { CheckCircle, Calendar, Copy, Check, Download } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { SuccessMessage } from '@/types/registration-form'
import { cn } from '@/utils/cn'

interface RegistrationSuccessProps {
  firstName: string
  lastName: string
  checkInCode: string
  status: string
  eventTitle: string
  eventDate: string
  successConfig?: SuccessMessage
}

export default function RegistrationSuccess({
  firstName,
  lastName,
  checkInCode,
  status,
  eventTitle,
  eventDate,
  successConfig,
}: RegistrationSuccessProps) {
  const [copiedCode, setCopiedCode] = useState(false)

  const title = successConfig?.title || 'Registration Successful!'
  const message = successConfig?.message || `Thank you for registering, ${firstName}!`
  const showQR = successConfig?.showCheckInQR !== false

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(checkInCode)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleDownloadQR = () => {
    const canvas = document.createElement('canvas')
    const svg = document.querySelector('.checkin-qr-svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const img = new Image()
    img.onload = () => {
      canvas.width = 200
      canvas.height = 200
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, 200, 200)
        ctx.drawImage(img, 0, 0, 200, 200)
        const pngUrl = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.download = `checkin-${checkInCode}.png`
        link.href = pngUrl
        link.click()
      }
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  const getStatusMessage = () => {
    switch (status) {
      case 'waitlisted':
        return {
          color: 'text-amber-600',
          bg: 'bg-amber-50',
          message: "You've been added to the waitlist. We'll notify you if a spot becomes available.",
        }
      case 'pending':
        return {
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          message: "Your registration is pending approval. You'll be notified once it's confirmed.",
        }
      case 'confirmed':
        return {
          color: 'text-green-600',
          bg: 'bg-green-50',
          message: "Your registration is confirmed! We look forward to seeing you.",
        }
      default:
        return {
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          message: `Status: ${status}`,
        }
    }
  }

  const statusInfo = getStatusMessage()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-lg mx-auto"
    >
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Success Header */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-4"
          >
            <CheckCircle className="h-12 w-12 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
          <p className="text-white/90">{message}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Event Info */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">{eventTitle}</p>
              <p className="text-sm text-gray-500">{eventDate}</p>
            </div>
          </div>

          {/* Check-in Code */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Your Check-in Code</p>
            <div className="inline-flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-3">
              <span className="text-2xl font-mono font-bold text-primary-600 tracking-wider">
                {checkInCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  copiedCode
                    ? 'bg-green-100 text-green-600'
                    : 'hover:bg-gray-200 text-gray-500'
                )}
              >
                {copiedCode ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Save this code. You'll need it to check in at the event.
            </p>
          </div>

          {/* QR Code for Check-in */}
          {showQR && (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-3">Or scan this QR code at check-in</p>
              <div className="inline-block p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <QRCodeSVG
                  value={checkInCode}
                  size={150}
                  level="M"
                  className="checkin-qr-svg"
                />
              </div>
              <button
                type="button"
                onClick={handleDownloadQR}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Save QR Code
              </button>
            </div>
          )}

          {/* Status Message */}
          <div className={cn('p-4 rounded-lg', statusInfo.bg)}>
            <p className={cn('text-sm text-center', statusInfo.color)}>
              {statusInfo.message}
            </p>
          </div>

          {/* Registrant Info */}
          <div className="text-center text-sm text-gray-500 pt-4 border-t">
            <p>
              Registered as: <span className="font-medium text-gray-700">{firstName} {lastName}</span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
