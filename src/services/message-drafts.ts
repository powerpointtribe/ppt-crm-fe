import { apiService } from './api'
import { ApiResponse } from '@/types/api'
import { transformPaginatedResponse, transformSingleResponse } from '@/utils/apiResponseTransform'

export interface MessageDraft {
  _id: string
  title: string
  message: string
  scheduledDate: string
  scheduledTime: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
  createdBy?: {
    _id: string
    firstName: string
    lastName: string
    email?: string
  }
  updatedBy?: {
    _id: string
    firstName: string
    lastName: string
    email?: string
  }
  sentAt?: string
  recipientCount?: number
  successCount?: number
  failedCount?: number
  failureReason?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateMessageDraftData {
  title?: string
  message: string
  scheduledDate: string // YYYY-MM-DD
  scheduledTime: string // HH:mm
}

export interface UpdateMessageDraftData {
  title?: string
  message?: string
  scheduledDate?: string
  scheduledTime?: string
}

export interface MessageDraftSearchParams {
  page?: number
  limit?: number
  status?: MessageDraft['status']
}

export interface PaginatedResponse<T> {
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

export interface PreviewResponse {
  preview: string
  htmlPreview: string
  availableVariables: string[]
}

export const messageDraftsService = {
  getMessageDrafts: async (params?: MessageDraftSearchParams): Promise<{
    data: MessageDraft[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> => {
    const response = await apiService.get<ApiResponse<{
      drafts: MessageDraft[]
      total: number
      page: number
      limit: number
      totalPages: number
    }>>('/first-timers/message-drafts', { params })
    const result = transformSingleResponse(response)
    // Backend returns { drafts, total, page, limit, totalPages }
    // Transform to { data, total, page, limit, totalPages }
    return {
      data: result.drafts || [],
      total: result.total || 0,
      page: result.page || 1,
      limit: result.limit || 10,
      totalPages: result.totalPages || 0
    }
  },

  getMessageDraftById: async (id: string): Promise<MessageDraft> => {
    const response = await apiService.get<ApiResponse<MessageDraft>>(`/first-timers/message-drafts/${id}`)
    return transformSingleResponse<MessageDraft>(response) as MessageDraft
  },

  createMessageDraft: async (data: CreateMessageDraftData): Promise<MessageDraft> => {
    const response = await apiService.post<ApiResponse<MessageDraft>>('/first-timers/message-drafts', data)
    return transformSingleResponse<MessageDraft>(response) as MessageDraft
  },

  updateMessageDraft: async (id: string, data: UpdateMessageDraftData): Promise<MessageDraft> => {
    const response = await apiService.patch<ApiResponse<MessageDraft>>(`/first-timers/message-drafts/${id}`, data)
    return transformSingleResponse<MessageDraft>(response) as MessageDraft
  },

  deleteMessageDraft: async (id: string): Promise<void> => {
    await apiService.delete(`/first-timers/message-drafts/${id}`)
  },

  previewMessage: async (data: { message: string }): Promise<PreviewResponse> => {
    const response = await apiService.post<ApiResponse<PreviewResponse>>('/first-timers/message-drafts/preview', data)
    return transformSingleResponse<PreviewResponse>(response) as PreviewResponse
  },

  sendMessageNow: async (id: string): Promise<void> => {
    await apiService.post(`/first-timers/message-drafts/${id}/send-now`)
  },
}
