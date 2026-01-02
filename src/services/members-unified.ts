import { apiService } from './api'
import { transformPaginatedResponse, transformSingleResponse } from '../utils/apiResponseTransform'
import type { Member } from '../types'

// Re-export Member for backward compatibility
export type { Member }

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  member: Member
}

export interface CreateMemberData {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  dateOfBirth: string
  gender: 'male' | 'female'
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed'
  address?: Member['address']
  branch: string // Required - every member must belong to a branch
  systemRoles?: string[]
  unitType?: string
  district?: string
  unit?: string
  membershipStatus?: string
  dateJoined?: string
}

export interface UpdateMemberData extends Partial<Omit<CreateMemberData, 'password'>> {
  isActive?: boolean
}

export interface MemberSearchParams {
  page?: number
  limit?: number
  search?: string
  membershipStatus?: string
  gender?: 'male' | 'female'
  maritalStatus?: string
  branchId?: string
  districtId?: string
  unitId?: string
  unitType?: string
  systemRole?: string
  leadershipRole?: 'district_pastor' | 'champ' | 'unit_head'
  ministry?: string
  dateJoinedFrom?: string
  dateJoinedTo?: string
  minAge?: number
  maxAge?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
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

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
}

export const membersService = {
  // Authentication methods
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiService.post<ApiResponse<LoginResponse>>('/auth/login', credentials)
    return transformSingleResponse<LoginResponse>(response) as LoginResponse
  },

  register: async (_data: CreateMemberData): Promise<LoginResponse> => {
    throw new Error('Registration is disabled. Access is by invitation only.');
  },

  getProfile: async (): Promise<Member> => {
    const response = await apiService.get<ApiResponse<Member>>('/members/my-profile')
    return transformSingleResponse<Member>(response) as Member
  },

  getAccessibleModules: async (): Promise<{ modules: string[] }> => {
    const response = await apiService.get<ApiResponse<{ modules: string[] }>>('/members/accessible-modules')
    return transformSingleResponse(response) as { modules: string[] }
  },

  // Member management methods
  getMembers: async (params?: MemberSearchParams): Promise<PaginatedResponse<Member>> => {
    const response = await apiService.get<ApiResponse<any>>('/members', { params })
    return transformPaginatedResponse<Member>(response)
  },

  getMemberById: async (id: string): Promise<Member> => {
    const response = await apiService.get<ApiResponse<Member>>(`/members/${id}`)
    return transformSingleResponse<Member>(response) as Member
  },

  createMember: async (data: CreateMemberData): Promise<Member> => {
    const response = await apiService.post<ApiResponse<Member>>('/members', data)
    return transformSingleResponse<Member>(response) as Member
  },

  updateMember: async (id: string, data: UpdateMemberData): Promise<Member> => {
    const response = await apiService.patch<ApiResponse<Member>>(`/members/${id}`, data)
    return transformSingleResponse<Member>(response) as Member
  },

  deleteMember: async (id: string): Promise<void> => {
    await apiService.delete<ApiResponse<void>>(`/members/${id}`)
  },

  // Access control methods
  assignRole: async (id: string, roleData: { roleId: string }): Promise<Member> => {
    const response = await apiService.patch<ApiResponse<Member>>(`/members/${id}/assign-role`, roleData)
    return transformSingleResponse<Member>(response) as Member
  },

  assignUnit: async (id: string, unitData: { unit: string; unitType: string; district?: string }): Promise<Member> => {
    const response = await apiService.patch<ApiResponse<Member>>(`/members/${id}/assign-unit`, unitData)
    return transformSingleResponse<Member>(response) as Member
  },

  // Filtered member access
  getMyDistrictMembers: async (params?: MemberSearchParams): Promise<PaginatedResponse<Member>> => {
    const response = await apiService.get<ApiResponse<any>>('/members/my-district', { params })
    return transformPaginatedResponse<Member>(response)
  },

  getMyUnitMembers: async (params?: MemberSearchParams): Promise<PaginatedResponse<Member>> => {
    const response = await apiService.get<ApiResponse<any>>('/members/my-unit', { params })
    return transformPaginatedResponse<Member>(response)
  },

  // Stats and analytics
  getMemberStats: async (branchId?: string, dateFrom?: string, dateTo?: string): Promise<any> => {
    const params: any = {}
    if (branchId) params.branchId = branchId
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo
    const response = await apiService.get<ApiResponse<any>>('/members/stats', { params: Object.keys(params).length > 0 ? params : undefined })
    return transformSingleResponse(response)
  },

  // Bulk operations
  bulkOperation: async (formData: FormData): Promise<any> => {
    const response = await apiService.post<ApiResponse<any>>('/members/bulk-operation', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data?.data || response.data
  },

  getCSVTemplate: async (operationType: 'create' | 'update'): Promise<any> => {
    const response = await apiService.get<ApiResponse<any>>(`/members/csv-templates/${operationType}`)
    return response.data || response
  },

  // Activation/deactivation
  activateMember: async (id: string): Promise<Member> => {
    const response = await apiService.patch<ApiResponse<Member>>(`/members/${id}/activate`)
    return transformSingleResponse<Member>(response) as Member
  },

  deactivateMember: async (id: string): Promise<Member> => {
    const response = await apiService.patch<ApiResponse<Member>>(`/members/${id}/deactivate`)
    return transformSingleResponse<Member>(response) as Member
  },

  // Password management
  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    await apiService.patch<ApiResponse<void>>('/members/change-password', {
      oldPassword,
      newPassword
    })
  },

  resetPassword: async (id: string): Promise<{ temporaryPassword: string }> => {
    const response = await apiService.patch<ApiResponse<{ temporaryPassword: string }>>(`/members/${id}/reset-password`)
    return transformSingleResponse(response) as { temporaryPassword: string }
  },
}