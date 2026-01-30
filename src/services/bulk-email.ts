import { apiService } from './api'
import {
  EmailTemplate,
  EmailCampaign,
  EmailSendLog,
  CreateEmailTemplateData,
  UpdateEmailTemplateData,
  CreateEmailCampaignData,
  UpdateEmailCampaignData,
  ScheduleCampaignData,
  TemplateQueryParams,
  CampaignQueryParams,
  SendLogQueryParams,
  PaginatedResponse,
  BulkEmailStatistics,
  RecipientPreview,
} from '@/types/bulk-email'

const BASE_URL = '/bulk-email'

export const bulkEmailService = {
  // Templates
  async getTemplates(params?: TemplateQueryParams): Promise<PaginatedResponse<EmailTemplate>> {
    const response = await apiService.get<PaginatedResponse<EmailTemplate>>(`${BASE_URL}/templates`, { params })
    return response
  },

  async getTemplateById(id: string): Promise<EmailTemplate> {
    const response = await apiService.get<EmailTemplate>(`${BASE_URL}/templates/${id}`)
    return response
  },

  async getActiveTemplates(): Promise<EmailTemplate[]> {
    const response = await apiService.get<PaginatedResponse<EmailTemplate>>(`${BASE_URL}/templates`, {
      params: { isActive: true, limit: 100 }
    })
    return response.items
  },

  async createTemplate(data: CreateEmailTemplateData): Promise<EmailTemplate> {
    const response = await apiService.post<EmailTemplate>(`${BASE_URL}/templates`, data)
    return response
  },

  async updateTemplate(id: string, data: UpdateEmailTemplateData): Promise<EmailTemplate> {
    const response = await apiService.patch<EmailTemplate>(`${BASE_URL}/templates/${id}`, data)
    return response
  },

  async deleteTemplate(id: string): Promise<void> {
    await apiService.delete(`${BASE_URL}/templates/${id}`)
  },

  async previewTemplate(id: string, sampleData?: Record<string, string>): Promise<{ html: string; text: string }> {
    const response = await apiService.post<{ html: string; text: string }>(
      `${BASE_URL}/templates/${id}/preview`,
      { sampleData }
    )
    return response
  },

  // Campaigns
  async getCampaigns(params?: CampaignQueryParams): Promise<PaginatedResponse<EmailCampaign>> {
    const response = await apiService.get<PaginatedResponse<EmailCampaign>>(`${BASE_URL}/campaigns`, { params })
    return response
  },

  async getCampaignById(id: string): Promise<EmailCampaign> {
    const response = await apiService.get<EmailCampaign>(`${BASE_URL}/campaigns/${id}`)
    return response
  },

  async createCampaign(data: CreateEmailCampaignData): Promise<EmailCampaign> {
    const response = await apiService.post<EmailCampaign>(`${BASE_URL}/campaigns`, data)
    return response
  },

  async updateCampaign(id: string, data: UpdateEmailCampaignData): Promise<EmailCampaign> {
    const response = await apiService.patch<EmailCampaign>(`${BASE_URL}/campaigns/${id}`, data)
    return response
  },

  async deleteCampaign(id: string): Promise<void> {
    await apiService.delete(`${BASE_URL}/campaigns/${id}`)
  },

  async sendCampaign(id: string): Promise<EmailCampaign> {
    const response = await apiService.post<EmailCampaign>(`${BASE_URL}/campaigns/${id}/send`)
    return response
  },

  async scheduleCampaign(id: string, data: ScheduleCampaignData): Promise<EmailCampaign> {
    const response = await apiService.post<EmailCampaign>(`${BASE_URL}/campaigns/${id}/schedule`, data)
    return response
  },

  async cancelCampaign(id: string): Promise<EmailCampaign> {
    const response = await apiService.post<EmailCampaign>(`${BASE_URL}/campaigns/${id}/cancel`)
    return response
  },

  async previewRecipients(id: string): Promise<RecipientPreview> {
    const response = await apiService.post<RecipientPreview>(`${BASE_URL}/campaigns/${id}/preview`)
    return response
  },

  // Send Logs
  async getCampaignLogs(campaignId: string, params?: SendLogQueryParams): Promise<PaginatedResponse<EmailSendLog>> {
    const response = await apiService.get<PaginatedResponse<EmailSendLog>>(
      `${BASE_URL}/campaigns/${campaignId}/logs`,
      { params }
    )
    return response
  },

  // Statistics
  async getStatistics(): Promise<BulkEmailStatistics> {
    const response = await apiService.get<BulkEmailStatistics>(`${BASE_URL}/statistics`)
    return response
  },
}
