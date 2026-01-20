import axios from 'axios'
import { apiService } from './api'
import type {
  Requisition,
  ExpenseCategory,
  CreateRequisitionDto,
  UpdateRequisitionDto,
  ApproveRequisitionDto,
  RejectRequisitionDto,
  DisburseRequisitionDto,
  RequisitionQueryParams,
  PaginatedResponse,
  CreateExpenseCategoryDto,
  UpdateExpenseCategoryDto,
  FinanceStatistics,
  FormFieldConfig,
  CreateFormFieldConfigDto,
  UpdateFormFieldConfigDto,
  BulkUpdateSortOrderDto,
} from '@/types/finance'
import type { PublicRequisitionFormData, PublicApproveFormData, PublicRejectFormData, PublicDisburseFormData } from '@/schemas/publicRequisition'

// Public API client (no auth header)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Public types
export interface PublicBranch {
  _id: string
  name: string
  slug: string
  description?: string
  address?: {
    city?: string
    state?: string
  }
}

export interface PublicExpenseCategory {
  _id: string
  name: string
  description?: string
}

export interface TokenVerificationResponse {
  valid: boolean
  actionType?: 'approve' | 'reject' | 'disburse'
  requisition?: Requisition
  error?: string
  expiresAt?: string
  recipientEmail?: string
}

export interface LxlEligibilityResponse {
  eligible: boolean
  memberName?: string
  reason?: string
  leadershipRole?: string
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
}

export const financeService = {
  // ============== Requisitions ==============

  /**
   * Create a new requisition
   */
  createRequisition: async (data: CreateRequisitionDto): Promise<Requisition> => {
    const response = await apiService.post<ApiResponse<Requisition>>(
      '/finance/requisitions',
      data
    )
    return response.data
  },

  /**
   * Get all requisitions with filtering
   */
  getRequisitions: async (
    params?: RequisitionQueryParams
  ): Promise<PaginatedResponse<Requisition>> => {
    const response = await apiService.get<ApiResponse<PaginatedResponse<Requisition>>>(
      '/finance/requisitions',
      { params }
    )
    return response.data
  },

  /**
   * Get current user's requisitions
   */
  getMyRequisitions: async (
    params?: RequisitionQueryParams
  ): Promise<PaginatedResponse<Requisition>> => {
    const response = await apiService.get<ApiResponse<PaginatedResponse<Requisition>>>(
      '/finance/requisitions/my',
      { params }
    )
    return response.data
  },

  /**
   * Get requisitions pending approval
   */
  getPendingApprovals: async (
    params?: RequisitionQueryParams
  ): Promise<PaginatedResponse<Requisition>> => {
    const response = await apiService.get<ApiResponse<PaginatedResponse<Requisition>>>(
      '/finance/requisitions/pending-approval',
      { params }
    )
    return response.data
  },

  /**
   * Get requisitions pending disbursement
   */
  getPendingDisbursements: async (
    params?: RequisitionQueryParams
  ): Promise<PaginatedResponse<Requisition>> => {
    const response = await apiService.get<ApiResponse<PaginatedResponse<Requisition>>>(
      '/finance/requisitions/pending-disbursement',
      { params }
    )
    return response.data
  },

  /**
   * Get a single requisition by ID
   */
  getRequisition: async (id: string): Promise<Requisition> => {
    const response = await apiService.get<ApiResponse<Requisition>>(
      `/finance/requisitions/${id}`
    )
    return response.data
  },

  /**
   * Update a draft requisition
   */
  updateRequisition: async (
    id: string,
    data: UpdateRequisitionDto
  ): Promise<Requisition> => {
    const response = await apiService.patch<ApiResponse<Requisition>>(
      `/finance/requisitions/${id}`,
      data
    )
    return response.data
  },

  /**
   * Submit a draft requisition for approval
   */
  submitRequisition: async (id: string): Promise<Requisition> => {
    const response = await apiService.post<ApiResponse<Requisition>>(
      `/finance/requisitions/${id}/submit`
    )
    return response.data
  },

  /**
   * Approve a requisition
   */
  approveRequisition: async (
    id: string,
    data: ApproveRequisitionDto
  ): Promise<Requisition> => {
    const response = await apiService.post<ApiResponse<Requisition>>(
      `/finance/requisitions/${id}/approve`,
      data
    )
    return response.data
  },

  /**
   * Reject a requisition
   */
  rejectRequisition: async (
    id: string,
    data: RejectRequisitionDto
  ): Promise<Requisition> => {
    const response = await apiService.post<ApiResponse<Requisition>>(
      `/finance/requisitions/${id}/reject`,
      data
    )
    return response.data
  },

  /**
   * Disburse funds for a requisition
   */
  disburseRequisition: async (
    id: string,
    data: DisburseRequisitionDto
  ): Promise<Requisition> => {
    const response = await apiService.post<ApiResponse<Requisition>>(
      `/finance/requisitions/${id}/disburse`,
      data
    )
    return response.data
  },

  /**
   * Delete a draft requisition
   */
  deleteRequisition: async (id: string): Promise<void> => {
    await apiService.delete(`/finance/requisitions/${id}`)
  },

  // ============== Dashboard & Reports ==============

  /**
   * Get finance dashboard statistics
   */
  getStatistics: async (): Promise<FinanceStatistics> => {
    const response = await apiService.get<ApiResponse<FinanceStatistics>>(
      '/finance/dashboard/statistics'
    )
    return response.data
  },

  // ============== Expense Categories ==============

  /**
   * Create a new expense category
   */
  createExpenseCategory: async (
    data: CreateExpenseCategoryDto
  ): Promise<ExpenseCategory> => {
    const response = await apiService.post<ApiResponse<ExpenseCategory>>(
      '/finance/expense-categories',
      data
    )
    return response.data
  },

  /**
   * Get all expense categories
   */
  getExpenseCategories: async (): Promise<ExpenseCategory[]> => {
    const response = await apiService.get<ApiResponse<ExpenseCategory[]>>(
      '/finance/expense-categories'
    )
    return response.data
  },

  /**
   * Get a single expense category
   */
  getExpenseCategory: async (id: string): Promise<ExpenseCategory> => {
    const response = await apiService.get<ApiResponse<ExpenseCategory>>(
      `/finance/expense-categories/${id}`
    )
    return response.data
  },

  /**
   * Update an expense category
   */
  updateExpenseCategory: async (
    id: string,
    data: UpdateExpenseCategoryDto
  ): Promise<ExpenseCategory> => {
    const response = await apiService.patch<ApiResponse<ExpenseCategory>>(
      `/finance/expense-categories/${id}`,
      data
    )
    return response.data
  },

  /**
   * Delete an expense category
   */
  deleteExpenseCategory: async (id: string): Promise<void> => {
    await apiService.delete(`/finance/expense-categories/${id}`)
  },

  /**
   * Initialize default expense categories for the branch
   */
  initializeExpenseCategories: async (): Promise<{ created: boolean; count: number; message: string }> => {
    const response = await apiService.post<ApiResponse<{ created: boolean; count: number }>>(
      '/finance/expense-categories/initialize'
    )
    return {
      created: response.data?.created ?? false,
      count: response.data?.count ?? 0,
      message: response.message,
    }
  },

  /**
   * Reset and reinitialize expense categories
   */
  resetExpenseCategories: async (): Promise<{ count: number; message: string }> => {
    const response = await apiService.post<ApiResponse<{ count: number }>>(
      '/finance/expense-categories/reset'
    )
    return {
      count: response.data?.count ?? 0,
      message: response.message,
    }
  },

  // ============== Form Field Configuration ==============

  /**
   * Get form field configurations for a form type
   */
  getFormFields: async (
    formType: string,
    includeInactive = false
  ): Promise<FormFieldConfig[]> => {
    const response = await apiService.get<ApiResponse<FormFieldConfig[]>>(
      `/finance/form-fields/${formType}`,
      { params: { includeInactive: includeInactive.toString() } }
    )
    return response.data
  },

  /**
   * Create a new form field configuration
   */
  createFormField: async (
    data: CreateFormFieldConfigDto
  ): Promise<FormFieldConfig> => {
    const response = await apiService.post<ApiResponse<FormFieldConfig>>(
      '/finance/form-fields',
      data
    )
    return response.data
  },

  /**
   * Update a form field configuration
   */
  updateFormField: async (
    id: string,
    data: UpdateFormFieldConfigDto
  ): Promise<FormFieldConfig> => {
    const response = await apiService.patch<ApiResponse<FormFieldConfig>>(
      `/finance/form-fields/${id}`,
      data
    )
    return response.data
  },

  /**
   * Delete a form field configuration
   */
  deleteFormField: async (id: string): Promise<void> => {
    await apiService.delete(`/finance/form-fields/${id}`)
  },

  /**
   * Toggle form field active status
   */
  toggleFormFieldActive: async (id: string): Promise<FormFieldConfig> => {
    const response = await apiService.post<ApiResponse<FormFieldConfig>>(
      `/finance/form-fields/${id}/toggle-active`
    )
    return response.data
  },

  /**
   * Bulk update sort order for form fields
   */
  bulkUpdateSortOrder: async (data: BulkUpdateSortOrderDto): Promise<void> => {
    await apiService.post('/finance/form-fields/bulk-sort', data)
  },

  /**
   * Initialize default form fields for a form type
   * @returns Object with created flag and message
   */
  initializeFormFields: async (formType: string): Promise<{ created: boolean; count: number; message: string }> => {
    const response = await apiService.post<ApiResponse<{ created: boolean; count: number }>>(
      `/finance/form-fields/initialize/${formType}`
    )
    return {
      created: response.data?.created ?? false,
      count: response.data?.count ?? 0,
      message: response.message,
    }
  },

  /**
   * Reset and reinitialize form fields (deletes all and creates fresh defaults)
   */
  resetFormFields: async (formType: string): Promise<{ count: number; message: string }> => {
    const response = await apiService.post<ApiResponse<{ count: number }>>(
      `/finance/form-fields/reset/${formType}`
    )
    return {
      count: response.data?.count ?? 0,
      message: response.message,
    }
  },

  // ============== Public API Methods (No Auth Required) ==============

  /**
   * Check if a member is eligible to raise requisitions (LXL status)
   */
  checkLxlEligibility: async (email: string, branchSlug: string): Promise<LxlEligibilityResponse> => {
    const response = await publicApi.post<ApiResponse<LxlEligibilityResponse>>(
      '/public/finance/check-eligibility',
      { email, branchSlug }
    )
    return response.data.data
  },

  /**
   * Create a public requisition (no authentication required)
   */
  createPublicRequisition: async (data: PublicRequisitionFormData): Promise<Requisition> => {
    // Clean up the data - remove empty strings from optional fields
    // Backend validation fails if empty strings are sent for optional MongoId or DateString fields
    const cleanedData: Record<string, unknown> = { ...data }

    // Remove empty optional fields that would fail backend validation
    if (!cleanedData.unit || cleanedData.unit === '') {
      delete cleanedData.unit
    }
    if (!cleanedData.lastRequestDate || cleanedData.lastRequestDate === '') {
      delete cleanedData.lastRequestDate
    }
    if (!cleanedData.submitterPhone || cleanedData.submitterPhone === '') {
      delete cleanedData.submitterPhone
    }
    if (!cleanedData.discussedDate || cleanedData.discussedDate === '') {
      delete cleanedData.discussedDate
    }
    if (!cleanedData.documentUrls || (Array.isArray(cleanedData.documentUrls) && cleanedData.documentUrls.length === 0)) {
      delete cleanedData.documentUrls
    }

    const response = await publicApi.post<ApiResponse<Requisition>>(
      '/public/finance/requisitions',
      cleanedData
    )
    return response.data.data
  },

  /**
   * Verify an action token and get requisition details
   */
  verifyActionToken: async (token: string): Promise<TokenVerificationResponse> => {
    const response = await publicApi.get<ApiResponse<TokenVerificationResponse>>(
      `/public/finance/requisitions/verify-token/${token}`
    )
    return response.data.data
  },

  /**
   * Approve a requisition using token (no auth required)
   */
  approveWithToken: async (token: string, data?: PublicApproveFormData): Promise<Requisition> => {
    const response = await publicApi.post<ApiResponse<Requisition>>(
      '/public/finance/requisitions/approve',
      { token, ...data }
    )
    return response.data.data
  },

  /**
   * Reject a requisition using token (no auth required)
   */
  rejectWithToken: async (token: string, data: PublicRejectFormData): Promise<Requisition> => {
    const response = await publicApi.post<ApiResponse<Requisition>>(
      '/public/finance/requisitions/reject',
      { token, ...data }
    )
    return response.data.data
  },

  /**
   * Disburse a requisition using token (no auth required)
   */
  disburseWithToken: async (token: string, data: PublicDisburseFormData): Promise<Requisition> => {
    const response = await publicApi.post<ApiResponse<Requisition>>(
      '/public/finance/requisitions/disburse',
      { token, ...data }
    )
    return response.data.data
  },

  /**
   * Get expense categories for a branch (public, no auth required)
   */
  getPublicExpenseCategories: async (branchSlug: string): Promise<PublicExpenseCategory[]> => {
    const response = await publicApi.get<ApiResponse<PublicExpenseCategory[]>>(
      `/public/finance/expense-categories/${branchSlug}`
    )
    return response.data.data
  },

  /**
   * Get all branches for public requisition form (no auth required)
   */
  getPublicBranches: async (): Promise<PublicBranch[]> => {
    const response = await publicApi.get<ApiResponse<PublicBranch[]>>(
      '/public/finance/branches'
    )
    return response.data.data
  },

  /**
   * Get a single branch by slug (no auth required)
   */
  getPublicBranchBySlug: async (slug: string): Promise<PublicBranch> => {
    const response = await publicApi.get<ApiResponse<PublicBranch>>(
      `/public/finance/branches/${slug}`
    )
    return response.data.data
  },
}
