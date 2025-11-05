import { apiService } from './api'

export interface UploadResponse {
  url: string
}

export const uploadService = {
  uploadImage: async (file: File): Promise<UploadResponse> => {
    console.log('Upload service called with file:', { name: file.name, size: file.size, type: file.type })

    const formData = new FormData()
    formData.append('file', file)

    console.log('FormData created, making API call to /upload/image')

    try {
      // Use the existing API service post method with multipart/form-data
      const result = await apiService.post<UploadResponse>('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for file uploads
      })
      console.log('Upload API response:', result)
      return result
    } catch (error) {
      console.error('Upload service error:', error)
      throw error
    }
  }
}