import { apiService } from './api'

export interface UploadResponse {
  url: string
}

export const uploadService = {
  // Uploads through the backend, which stores to whichever provider is active
  // (Cloudflare R2 when configured, else Cloudinary) and returns the public URL.
  // `folder` organises the upload in storage, e.g. 'powerpoint/first-timers'
  // or 'powerpoint/<module>'. Defaults to a generic PowerPoint bucket folder.
  uploadImage: async (
    file: File,
    folder = 'powerpoint/uploads',
  ): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    return apiService.post<UploadResponse>('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
