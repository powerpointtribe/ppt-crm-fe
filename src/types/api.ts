export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
}

export interface ApiError {
  success: false
  message: string
  error?: any
  timestamp: string
}