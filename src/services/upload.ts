import { apiService } from './api'

export interface UploadResponse {
  url: string
}

export const uploadService = {
  // Uploads through the backend, which stores to whichever provider is active
  // (Cloudflare R2 when configured, else Cloudinary) and returns the public URL.
  uploadImage: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)

    return apiService.post<UploadResponse>('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
