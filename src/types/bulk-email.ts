export enum EmailTemplateCategory {
  GENERAL = 'general',
  WELCOME = 'welcome',
  ANNOUNCEMENT = 'announcement',
  EVENT = 'event',
  REMINDER = 'reminder',
  NEWSLETTER = 'newsletter',
}

export enum TemplateModule {
  FIRST_TIMERS = 'first-timers',
  MEMBERS = 'members',
  EVENTS = 'events',
  FINANCE = 'finance',
  AUTH = 'auth',
  GROUPS = 'groups',
  BULK_EMAIL = 'bulk-email',
}

export interface VariableDefinition {
  name: string
  description?: string
  sampleValue?: string
}

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum SendLogStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
}

export enum RecipientFilterType {
  ALL_MEMBERS = 'all_members',
  BY_BRANCH = 'by_branch',
  BY_GROUP = 'by_group',
  BY_UNIT = 'by_unit',
  BY_DISTRICT = 'by_district',
  BY_MEMBERSHIP_STATUS = 'by_membership_status',
  BY_MAILING_LIST = 'by_mailing_list',
  CUSTOM = 'custom',
}

export interface EmailTemplate {
  _id: string
  branch?: string | { _id: string; name: string }
  name: string
  subject: string
  htmlContent: string
  plainTextContent?: string
  availableVariables: string[]
  category: EmailTemplateCategory
  module?: TemplateModule
  slug?: string
  isSystem?: boolean
  isActive: boolean
  variableDefinitions?: VariableDefinition[]
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
  mailingListIds?: string[]
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
  ccEmails?: string[]
  bccEmails?: string[]
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
  branch?: string
  name: string
  subject: string
  htmlContent: string
  plainTextContent?: string
  category: EmailTemplateCategory
  module?: TemplateModule
  slug?: string
  variableDefinitions?: VariableDefinition[]
  isActive?: boolean
}

export interface UpdateEmailTemplateData {
  name?: string
  subject?: string
  htmlContent?: string
  plainTextContent?: string
  category?: EmailTemplateCategory
  module?: TemplateModule
  slug?: string
  variableDefinitions?: VariableDefinition[]
  isActive?: boolean
}

export interface CreateEmailCampaignData {
  branch: string
  name: string
  subject: string
  htmlContent: string
  template?: string
  recipientFilter: RecipientFilter
  ccEmails?: string[]
  bccEmails?: string[]
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
  module?: TemplateModule | 'uncategorized'
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
  email?: string
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

// Form Templates

export enum FormFieldType {
  TEXT = 'text',
  EMAIL = 'email',
  PHONE = 'phone',
  NUMBER = 'number',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  TOGGLE = 'toggle',
  RATING = 'rating',
  DATE = 'date',
  HEADING = 'heading',
  PARAGRAPH = 'paragraph',
}

export enum FormTheme {
  DEFAULT = 'default',
  DARK = 'dark',
  CUSTOM = 'custom',
}

export enum FormModule {
  EVENTS = 'events',
  FIRST_TIMERS = 'first-timers',
  MEMBERS = 'members',
  GENERAL = 'general',
}

export interface FormFieldOption {
  label: string
  value: string
}

export interface FormFieldValidation {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
}

export interface FormField {
  key: string
  type: FormFieldType
  label: string
  placeholder?: string
  required: boolean
  width: 'full' | 'half'
  order: number
  options: FormFieldOption[]
  validation: FormFieldValidation
  helpText?: string
  defaultValue?: string
}

export interface FormStyle {
  theme: FormTheme
  primaryColor?: string
  backgroundColor?: string
  textColor?: string
  cardColor?: string
  fontFamily?: string
  headingFontFamily?: string
}

export interface FormTemplate {
  _id: string
  branch?: string | { _id: string; name: string }
  name: string
  slug?: string
  description?: string
  module: FormModule
  fields: FormField[]
  htmlContent?: string
  style: FormStyle
  submitButtonText: string
  successMessage: string
  successHeading?: string
  allowAnonymous: boolean
  thumbnail?: string
  isSystem?: boolean
  isActive: boolean
  createdBy?: string | { _id: string; firstName: string; lastName: string }
  updatedBy?: string | { _id: string; firstName: string; lastName: string }
  createdAt: string
  updatedAt: string
}

export interface CreateFormTemplateData {
  branch?: string
  name: string
  slug?: string
  description?: string
  module?: FormModule
  fields?: Partial<FormField>[]
  htmlContent?: string
  style?: Partial<FormStyle>
  submitButtonText?: string
  successMessage?: string
  successHeading?: string
  allowAnonymous?: boolean
  thumbnail?: string
  isActive?: boolean
}

export interface UpdateFormTemplateData {
  name?: string
  slug?: string
  description?: string
  module?: FormModule
  fields?: Partial<FormField>[]
  htmlContent?: string
  style?: Partial<FormStyle>
  submitButtonText?: string
  successMessage?: string
  successHeading?: string
  allowAnonymous?: boolean
  thumbnail?: string
  isActive?: boolean
}

export interface FormTemplateQueryParams {
  page?: number
  limit?: number
  search?: string
  module?: FormModule
  isActive?: boolean
}
