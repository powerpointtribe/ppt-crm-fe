import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check, Share2, Download } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/utils/cn'

interface QRCodeShareProps {
  url: string
  title?: string
  size?: number
  showUrl?: boolean
  className?: string
}

export default function QRCodeShare({
  url,
  title = 'Scan to Register',
  size = 150,
  showUrl = true,
  className,
}: QRCodeShareProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url,
        })
      } catch (error) {
        // User cancelled or error occurred
        console.error('Share failed:', error)
      }
    } else {
      handleCopy()
    }
  }

  const handleDownloadQR = () => {
    const canvas = document.createElement('canvas')
    const svg = document.querySelector('.qr-code-svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const img = new Image()
    img.onload = () => {
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, size, size)
        ctx.drawImage(img, 0, 0)
        const pngUrl = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.download = 'registration-qr-code.png'
        link.href = pngUrl
        link.click()
      }
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  return (
    <div className={cn('bg-gray-50 rounded-lg p-4 text-center', className)}>
      <p className="text-sm font-medium text-gray-700 mb-3">{title}</p>

      {/* QR Code */}
      <div className="inline-block p-3 bg-white rounded-lg shadow-sm">
        <QRCodeSVG
          value={url}
          size={size}
          level="M"
          includeMargin={false}
          className="qr-code-svg"
        />
      </div>

      {/* URL Display */}
      {showUrl && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 break-all mb-2">{url}</p>

          {/* Action Buttons */}
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              )}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Link
                </>
              )}
            </button>

            {typeof navigator.share === 'function' && (
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadQR}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Save QR
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
