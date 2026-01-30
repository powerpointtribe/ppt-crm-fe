export enum EmailTemplateCategory {
  GENERAL = 'GENERAL',
  WELCOME = 'WELCOME',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  EVENT = 'EVENT',
  REMINDER = 'REMINDER',
  NEWSLETTER = 'NEWSLETTER',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum SendLogStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
}

export enum RecipientFilterType {
  ALL_MEMBERS = 'ALL_MEMBERS',
  BY_BRANCH = 'BY_BRANCH',
  BY_GROUP = 'BY_GROUP',
  BY_UNIT = 'BY_UNIT',
  BY_DISTRICT = 'BY_DISTRICT',
  BY_MEMBERSHIP_STATUS = 'BY_MEMBERSHIP_STATUS',
  CUSTOM = 'CUSTOM',
}

export interface EmailTemplate {
  _id: string
  branch: string | { _id: string; name: string }
  name: string
  subject: string
  htmlContent: string
  plainTextContent?: string
  availableVariables: string[]
  category: EmailTemplateCategory
  isActive: boolean
  createdBy: string | { _id: string; firstName: string; lastName: string }
  updatedBy?: string | { _id: string; firstName: string; lastName: string }
  createdAt: string
  updatedAt: string
}

export interface RecipientFilter {
  filterType: RecipientFilterType
  branchIds?: string[]
  groupIds?: string[]
  unitIds?: string[]
  districtIds?: string[]
  membershipStatuses?: string[]
  customMemberIds?: string[]
}

export interface CampaignStats {
  totalRecipients: number
  sent: number
  delivered: number
  failed: number
  opened: number
  clicked: number
}

export interface EmailCampaign {
  _id: string
  branch: string | { _id: string; name: string }
  name: string
  subject: string
  htmlContent: string
  template?: string | EmailTemplate
  recipientFilter: RecipientFilter
  status: CampaignStatus
  scheduledAt?: string
  sentAt?: string
  stats: CampaignStats
  createdBy: string | { _id: string; firstName: string; lastName: string }
  updatedBy?: string | { _id: string; firstName: string; lastName: string }
  createdAt: string
  updatedAt: string
}

export interface EmailSendLog {
  _id: string
  campaign: string | EmailCampaign
  member: string | { _id: string; firstName: string; lastName: string; email: string }
  email: string
  status: SendLogStatus
  sentAt?: string
  deliveredAt?: string
  openedAt?: string
  clickedAt?: string
  errorMessage?: string
  messageId?: string
  createdAt: string
  updatedAt: string
}

// DTOs
export interface CreateEmailTemplateData {
  branch: string
  name: string
  subject: string
  htmlContent: string
  plainTextContent?: string
  category: EmailTemplateCategory
  isActive?: boolean
}

export interface UpdateEmailTemplateData {
  name?: string
  subject?: string
  htmlContent?: string
  plainTextContent?: string
  category?: EmailTemplateCategory
  isActive?: boolean
}

export interface CreateEmailCampaignData {
  branch: string
  name: string
  subject: string
  htmlContent: string
  template?: string
  recipientFilter: RecipientFilter
}

export interface UpdateEmailCampaignData {
  name?: string
  subject?: string
  htmlContent?: string
  template?: string
  recipientFilter?: RecipientFilter
}

export interface ScheduleCampaignData {
  scheduledAt: string
}

// Query params
export interface TemplateQueryParams {
  page?: number
  limit?: number
  search?: string
  category?: EmailTemplateCategory
  isActive?: boolean
}

export interface CampaignQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: CampaignStatus
  startDate?: string
  endDate?: string
}

export interface SendLogQueryParams {
  page?: number
  limit?: number
  status?: SendLogStatus
}

// Response types
export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface BulkEmailStatistics {
  templates: {
    total: number
    active: number
    byCategory: Record<string, number>
  }
  campaigns: {
    total: number
    byStatus: Record<string, number>
    thisMonth: number
  }
  emails: {
    totalSent: number
    delivered: number
    failed: number
    deliveryRate: number
  }
}

export interface RecipientPreview {
  totalCount: number
  sampleRecipients: Array<{
    _id: string
    firstName: string
    lastName: string
    email: string
  }>
}
