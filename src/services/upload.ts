import { apiService } from './api'

export interface UploadResponse {
  url: string
}

interface SignatureResponse {
  signature: string
  timestamp: number
  folder: string
  cloudName: string
  apiKey: string
}

export const uploadService = {
  uploadImage: async (file: File): Promise<UploadResponse> => {
    const sign = await apiService.post<SignatureResponse>('/upload/sign')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('api_key', sign.apiKey)
    formData.append('timestamp', String(sign.timestamp))
    formData.append('signature', sign.signature)
    formData.append('folder', sign.folder)

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
      { method: 'POST', body: formData },
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message || 'Upload failed')
    }

    const data = await res.json()
    return { url: data.secure_url }
  },
}
