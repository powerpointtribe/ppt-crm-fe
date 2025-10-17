import { apiService } from './api'
import { ApiResponse } from '@/types/api'

export interface JobStatus {
  id: string
  type: string
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed'
  progress?: number
  result?: any
  error?: string
  createdAt: string
  updatedAt: string
  userId: string
  metadata?: {
    filename?: string
    totalRows?: number
  }
}

export interface JobHistory {
  jobs: JobStatus[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface QueueStats {
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  totalJobs: number
}

export const queueService = {
  getJobStatus: async (jobId: string): Promise<JobStatus> => {
    const response = await apiService.get<ApiResponse<JobStatus>>(`/queue/jobs/${jobId}/status`)
    return response.data || response
  },

  getJobHistory: async (limit: number = 10): Promise<JobHistory> => {
    const response = await apiService.get<ApiResponse<any>>(`/queue/jobs/history?limit=${limit}`)
    const backendData = response.data || response

    // Backend might return paginated format
    if (backendData && Array.isArray(backendData.data)) {
      return {
        jobs: backendData.data,
        pagination: {
          page: backendData.page || 1,
          limit: backendData.limit || limit,
          total: backendData.total || backendData.data.length,
          totalPages: backendData.totalPages || 1
        }
      }
    }

    // Fallback if it returns job array directly
    if (Array.isArray(backendData)) {
      return {
        jobs: backendData,
        pagination: {
          page: 1,
          limit: limit,
          total: backendData.length,
          totalPages: 1
        }
      }
    }

    return {
      jobs: [],
      pagination: {
        page: 1,
        limit: limit,
        total: 0,
        totalPages: 0
      }
    }
  },

  cancelJob: async (jobId: string): Promise<void> => {
    await apiService.delete(`/queue/jobs/${jobId}`)
  },

  getQueueStats: async (): Promise<QueueStats> => {
    const response = await apiService.get<ApiResponse<QueueStats>>('/queue/stats')
    return response.data || response
  },

  // Helper method to poll job status
  pollJobStatus: (
    jobId: string,
    onUpdate: (status: JobStatus) => void,
    onComplete: (status: JobStatus) => void,
    onError: (error: any) => void,
    interval: number = 2000
  ): (() => void) => {
    let isPolling = true

    const poll = async () => {
      if (!isPolling) return

      try {
        const status = await queueService.getJobStatus(jobId)
        onUpdate(status)

        if (status.status === 'completed' || status.status === 'failed') {
          isPolling = false
          onComplete(status)
        } else {
          setTimeout(poll, interval)
        }
      } catch (error) {
        isPolling = false
        onError(error)
      }
    }

    poll()

    // Return stop function
    return () => {
      isPolling = false
    }
  }
}