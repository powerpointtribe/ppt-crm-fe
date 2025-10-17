// Utility functions to transform backend responses to frontend expected format

export interface BackendPaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface FrontendPaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface BackendApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
}

/**
 * Transforms backend paginated response to frontend expected format
 */
export function transformPaginatedResponse<T>(
  response: BackendApiResponse<BackendPaginatedResponse<T>> | BackendPaginatedResponse<T> | any
): FrontendPaginatedResponse<T> {

  // Handle the exact API response structure: response.data.data
  if (response?.data?.data && typeof response.data.data === 'object' && Array.isArray(response.data.data.data)) {
    const apiData = response.data.data
    return {
      items: apiData.data,
      pagination: {
        page: apiData.page || 1,
        limit: apiData.limit || 10,
        total: apiData.total || 0,
        totalPages: apiData.totalPages || 0,
        hasNext: apiData.hasNext || false,
        hasPrev: apiData.hasPrev || false
      }
    }
  }

  // Extract the actual data from response wrapper for other cases
  const backendData = response?.data || response

  // Check if it's the backend paginated format with data array directly
  if (backendData && Array.isArray(backendData.data)) {
    return {
      items: backendData.data,
      pagination: {
        page: backendData.page || 1,
        limit: backendData.limit || 10,
        total: backendData.total || 0,
        totalPages: backendData.totalPages || 0,
        hasNext: backendData.hasNext || false,
        hasPrev: backendData.hasPrev || false
      }
    }
  }

  // Fallback for direct array response
  if (Array.isArray(backendData)) {
    return {
      items: backendData,
      pagination: {
        page: 1,
        limit: backendData.length,
        total: backendData.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      }
    }
  }

  // Fallback for direct array in response.data
  if (Array.isArray(response?.data)) {
    return {
      items: response.data,
      pagination: {
        page: 1,
        limit: response.data.length,
        total: response.data.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      }
    }
  }

  // Empty fallback
  return {
    items: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    }
  }
}

/**
 * Transforms backend single item response to frontend expected format
 */
export function transformSingleResponse<T>(
  response: BackendApiResponse<T> | T | any
): T | null {
  // Handle nested data structure from API service (response.data.data)
  if (response?.data?.data && typeof response.data.data === 'object') {
    return response.data.data
  }

  // Extract the actual data from response wrapper
  const data = response?.data || response

  return data || null
}

/**
 * Transforms backend array response to frontend expected format
 */
export function transformArrayResponse<T>(
  response: BackendApiResponse<T[]> | T[] | any
): T[] {
  // Extract the actual data from response wrapper
  const data = response?.data || response

  return Array.isArray(data) ? data : []
}