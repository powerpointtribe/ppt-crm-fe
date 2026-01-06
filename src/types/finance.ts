import { Member } from './index'

// Form Field Types
export type FormFieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'file'

// Select option for form fields
export interface SelectOption {
  label: string
  value: string
}

// Field validation rules
export interface FieldValidation {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
  patternMessage?: string
}

// Form field configuration
export interface FormFieldConfig {
  _id: string
  branch: string
  formType: string
  fieldKey: string
  label: string
  placeholder?: string
  helpText?: string
  fieldType: FormFieldType
  options: SelectOption[]
  validation: FieldValidation
  defaultValue?: string
  isSystemField: boolean
  isActive: boolean
  sortOrder: number
  step: number
  gridSpan: number
  createdBy: string | Member
  updatedBy?: string | Member
  createdAt: string
  updatedAt: string
}

// Create form field config DTO
export interface CreateFormFieldConfigDto {
  formType: string
  fieldKey: string
  label: string
  placeholder?: string
  helpText?: string
  fieldType: FormFieldType
  options?: SelectOption[]
  validation?: FieldValidation
  defaultValue?: string
  isActive?: boolean
  sortOrder?: number
  step: number
  gridSpan?: number
}

// Update form field config DTO
export interface UpdateFormFieldConfigDto extends Partial<CreateFormFieldConfigDto> {}

// Bulk sort order item
export interface SortOrderItem {
  id: string
  sortOrder: number
}

// Bulk update sort order DTO
export interface BulkUpdateSortOrderDto {
  items: SortOrderItem[]
}

// Cost breakdown item
export interface CostBreakdownItem {
  item: string
  quantity: number
  unitCost: number
  total: number
}

// Bank account details
export interface BankAccount {
  bankName: string
  accountName: string
  accountNumber: string
}

// Expense category
export interface ExpenseCategory {
  _id: string
  branch: string
  name: string
  description?: string
  code?: string
  budgetLimit?: number
  requiresApproval: boolean
  isActive: boolean
  sortOrder: number
  createdBy: string | Member
  createdAt: string
  updatedAt: string
}

// Requisition status
export type RequisitionStatus =
  | 'draft'
  | 'submitted'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'pending_disbursement'
  | 'disbursed'

// Requisition interface
export interface Requisition {
  _id: string
  branch: string | { _id: string; name: string }
  requestor: string | Member
  unit?: string | { _id: string; name: string }
  expenseCategory: string | ExpenseCategory
  eventDescription: string
  dateNeeded: string
  lastRequestDate?: string
  totalAmount: number
  currency: string
  costBreakdown: CostBreakdownItem[]
  creditAccount: BankAccount
  documentUrls: string[]
  discussedWithPDams: boolean
  discussedDate?: string
  status: RequisitionStatus
  submittedAt?: string
  approvedAt?: string
  approvedBy?: string | Member
  approvalNotes?: string
  rejectedAt?: string
  rejectedBy?: string | Member
  rejectionReason?: string
  disbursedAt?: string
  disbursedBy?: string | Member
  disbursementNotes?: string
  disbursementReference?: string
  createdBy: string | Member
  createdAt: string
  updatedAt: string
}

// Create requisition DTO
export interface CreateRequisitionDto {
  unit?: string
  expenseCategory: string
  eventDescription: string
  dateNeeded: string
  lastRequestDate?: string
  costBreakdown: CostBreakdownItem[]
  creditAccount: BankAccount
  documentUrls?: string[]
  discussedWithPDams: boolean
  discussedDate?: string
  isDraft?: boolean
}

// Update requisition DTO
export interface UpdateRequisitionDto extends Partial<CreateRequisitionDto> {}

// Approve requisition DTO
export interface ApproveRequisitionDto {
  notes?: string
}

// Reject requisition DTO
export interface RejectRequisitionDto {
  reason: string
}

// Disburse requisition DTO
export interface DisburseRequisitionDto {
  disbursementReference: string
  notes?: string
}

// Query params
export interface RequisitionQueryParams {
  status?: RequisitionStatus
  expenseCategory?: string
  unit?: string
  requestor?: string
  branch?: string
  startDate?: string
  endDate?: string
  search?: string
  minAmount?: number
  maxAmount?: number
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// Create expense category DTO
export interface CreateExpenseCategoryDto {
  name: string
  description?: string
  code?: string
  budgetLimit?: number
  requiresApproval?: boolean
  isActive?: boolean
  sortOrder?: number
}

// Update expense category DTO
export interface UpdateExpenseCategoryDto extends Partial<CreateExpenseCategoryDto> {}

// Finance statistics
export interface FinanceStatistics {
  totalRequisitions: number
  pendingApproval: number
  pendingDisbursement: number
  disbursed: number
  rejected: number
  totalAmountRequested: number
  totalAmountDisbursed: number
  byStatus: { status: string; count: number }[]
  byCategory: {
    category: string
    categoryId: string
    count: number
    totalAmount: number
  }[]
}

// Event Description Options
export const EVENT_DESCRIPTION_OPTIONS = [
  { value: 'monthly_budget', label: 'Monthly Budget' },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'tnt', label: 'TnT' },
  { value: 'life_questions', label: 'Life Questions' },
  { value: 'paid_event_garrison', label: 'Paid Event at the Garrison' },
  { value: 'themed_services', label: 'Themed Services' },
  { value: 'special_events', label: 'Special Events' },
  { value: 'not_an_event', label: 'Not an Event' },
  { value: 'other', label: 'Other' },
] as const

export type EventDescriptionValue = typeof EVENT_DESCRIPTION_OPTIONS[number]['value']

// Status configuration for display
export const requisitionStatusConfig: Record<
  RequisitionStatus,
  { label: string; color: string; bgColor: string }
> = {
  draft: {
    label: 'Draft',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
  submitted: {
    label: 'Submitted',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  pending_approval: {
    label: 'Pending Approval',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
  approved: {
    label: 'Approved',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
  pending_disbursement: {
    label: 'Pending Disbursement',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
  },
  disbursed: {
    label: 'Disbursed',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
  },
}
