import { apiService } from './api'
import { transformPaginatedResponse, transformSingleResponse } from '@/utils/apiResponseTransform'

export interface Member {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: 'male' | 'female'
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed'

  // Authentication fields
  isActive: boolean
  lastLogin?: string

  // System access control
  systemRoles: string[]
  unitType?: 'gia' | 'district' | 'ministry_unit' | 'leadership_unit'
  accessibleModules: string[]

  // Church membership
  membershipStatus: 'new_convert' | 'worker' | 'volunteer' | 'leader' | 'district_pastor' | 'champ' | 'unit_head' | 'inactive' | 'transferred'
  dateJoined: string
  baptismDate?: string
  confirmationDate?: string

  // Church structure
  district?: any
  unit?: any
  additionalGroups?: string[]

  // Leadership roles
  leadershipRoles: {
    isDistrictPastor: boolean
    isChamp: boolean
    isUnitHead: boolean
    champForDistrict?: string
    leadsUnit?: string
    pastorsDistrict?: string
  }

  // Personal info
  address?: {
    street: string
    city: string
    state: string
    zipCode?: string
    country: string
  }
  ministries?: string[]
  skills?: string[]
  occupation?: string
  workAddress?: string

  // Family
  spouse?: any
  children?: any[]
  parent?: any
  emergencyContact?: {
    name: string
    relationship: string
    phone: string
    email?: string
  }

  // Spiritual journey
  spiritualJourney: {
    foundationClass: { completed: boolean; completionDate?: string }
    baptismClass: { completed: boolean; completionDate?: string }
    membershipClass: { completed: boolean; completionDate?: string }
    leadershipClass: { completed: boolean; completionDate?: string }
  }

  // System fields
  notes?: string
  profilePicture?: string
  engagement: {
    lastAttendance?: string
    attendanceCount: number
    engagementScore: number
  }
  createdAt: string
  updatedAt: string
}

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

  register: async (data: CreateMemberData): Promise<LoginResponse> => {
    const response = await apiService.post<ApiResponse<LoginResponse>>('/auth/register', data)
    return transformSingleResponse<LoginResponse>(response) as LoginResponse
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
  assignRole: async (id: string, roleData: { systemRoles: string[]; leadershipRoles?: any }): Promise<Member> => {
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
  getMemberStats: async (): Promise<any> => {
    const response = await apiService.get<ApiResponse<any>>('/members/stats')
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