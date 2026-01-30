import { z } from 'zod'
import { EmailTemplateCategory, RecipientFilterType } from '@/types/bulk-email'

export const emailTemplateSchema = z.object({
  branch: z.string().min(1, 'Branch is required'),
  name: z.string().min(1, 'Template name is required').max(100, 'Name is too long'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject is too long'),
  htmlContent: z.string().min(1, 'Email content is required'),
  plainTextContent: z.string().optional(),
  category: z.nativeEnum(EmailTemplateCategory),
  isActive: z.boolean().optional().default(true),
})

export type EmailTemplateFormData = z.infer<typeof emailTemplateSchema>

export const recipientFilterSchema = z.object({
  filterType: z.nativeEnum(RecipientFilterType),
  branchIds: z.array(z.string()).optional(),
  groupIds: z.array(z.string()).optional(),
  unitIds: z.array(z.string()).optional(),
  districtIds: z.array(z.string()).optional(),
  membershipStatuses: z.array(z.string()).optional(),
  customMemberIds: z.array(z.string()).optional(),
})

export const emailCampaignSchema = z.object({
  branch: z.string().min(1, 'Branch is required'),
  name: z.string().min(1, 'Campaign name is required').max(100, 'Name is too long'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject is too long'),
  htmlContent: z.string().min(1, 'Email content is required'),
  template: z.string().optional(),
  recipientFilter: recipientFilterSchema,
})

export type EmailCampaignFormData = z.infer<typeof emailCampaignSchema>

export const scheduleCampaignSchema = z.object({
  scheduledAt: z.string().min(1, 'Scheduled date/time is required'),
})

export type ScheduleCampaignFormData = z.infer<typeof scheduleCampaignSchema>
