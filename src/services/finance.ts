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
}
