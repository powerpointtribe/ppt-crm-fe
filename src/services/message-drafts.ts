import { apiService } from './api'
import { ApiResponse } from '@/types/api'
import { transformSingleResponse } from '@/utils/apiResponseTransform'

export interface MessageDraft {
  _id: string
  title: string
  message: string
  subject?: string
  templateId?: 1 | 2 | 3
  recipientMode?: 'by_date' | 'individual'
  recipientIds?: string[]
  scheduledDate?: string
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
  branch?: {
    _id: string
    name: string
  }
  recipients?: Array<{
    firstName: string
    lastName: string
    email: string
  }>
  createdAt?: string
  updatedAt?: string
}

export interface CreateMessageDraftData {
  title?: string
  message: string
  subject?: string
  templateId?: number
  recipientMode?: 'by_date' | 'individual'
  recipientIds?: string[]
  scheduledDate?: string
  scheduledTime: string
  branch?: string
}

export interface UpdateMessageDraftData {
  title?: string
  message?: string
  subject?: string
  templateId?: number
  recipientMode?: 'by_date' | 'individual'
  recipientIds?: string[]
  scheduledDate?: string
  scheduledTime?: string
  branch?: string
}

export interface MessageDraftSearchParams {
  page?: number
  limit?: number
  status?: MessageDraft['status']
}

export interface PreviewResponse {
  preview: string
  htmlPreview: string
  availableVariables: string[]
}

export interface EmailTemplate {
  id: 1 | 2 | 3
  name: string
  description: string
  previewHtml: string
}

export const messageDraftsService = {
  getTemplates: async (): Promise<EmailTemplate[]> => {
    const response = await apiService.get<ApiResponse<EmailTemplate[]>>('/first-timers/message-drafts/templates')
    return transformSingleResponse<EmailTemplate[]>(response) as EmailTemplate[]
  },

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
    return {
      data: result.drafts || [],
      total: result.total || 0,
      page: result.page || 1,
      limit: result.limit || 10,
      totalPages: result.totalPages || 0,
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

  previewMessage: async (data: { message: string; templateId?: number; subject?: string }): Promise<PreviewResponse> => {
    const response = await apiService.post<ApiResponse<PreviewResponse>>('/first-timers/message-drafts/preview', data)
    return transformSingleResponse<PreviewResponse>(response) as PreviewResponse
  },

  sendTestEmail: async (data: { email: string; message: string; templateId?: number; subject?: string }): Promise<void> => {
    await apiService.post('/first-timers/message-drafts/send-test', data)
  },

  sendMessageNow: async (id: string): Promise<void> => {
    await apiService.post(`/first-timers/message-drafts/${id}/send-now`)
  },
}
