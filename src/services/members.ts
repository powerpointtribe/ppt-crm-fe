import { apiService } from './api'
import { ApiResponse } from '@/types/api'
import { transformPaginatedResponse, transformSingleResponse, transformArrayResponse } from '@/utils/apiResponseTransform'
import { Member } from '@/types'

// LEGACY FILE: This service is deprecated. Use members-unified.ts instead.
// These type aliases are kept for backward compatibility
export type Address = NonNullable<Member['address']>
export type EmergencyContact = NonNullable<Member['emergencyContact']>

// Re-export Member for backward compatibility
export type { Member }

export interface CreateMemberData {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: 'male' | 'female'
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed'
  address: Address
  district: string
  unit?: string
  additionalGroups?: string[]
  membershipStatus?: Member['membershipStatus']
  dateJoined?: string
  baptismDate?: string
  confirmationDate?: string
  ministries?: string[]
  skills?: string[]
  occupation?: string
  workAddress?: string
  spouse?: string
  children?: string[]
  parent?: string
  emergencyContact?: EmergencyContact
  notes?: string
}

export interface UpdateMemberData extends Partial<CreateMemberData> {}

export interface MemberSearchParams {
  page?: number
  limit?: number
  search?: string
  membershipStatus?: Member['membershipStatus']
  gender?: 'male' | 'female'
  maritalStatus?: Member['maritalStatus']
  districtId?: string
  unitId?: string
  ministry?: string
  leadershipRole?: 'district_pastor' | 'champ' | 'unit_head'
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

export const membersService = {
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
    await apiService.delete(`/members/${id}`)
  },

  getMemberStats: async (): Promise<any> => {
    const response = await apiService.get<ApiResponse<any>>('/members/stats')
    return transformSingleResponse(response)
  },

  getDistrictMembers: async (districtId: string, params?: MemberSearchParams): Promise<PaginatedResponse<Member>> => {
    const response = await apiService.get<ApiResponse<any>>(`/members/district/${districtId}`, { params })
    return transformPaginatedResponse<Member>(response)
  },

  getMyDistrictMembers: async (params?: MemberSearchParams): Promise<PaginatedResponse<Member>> => {
    const response = await apiService.get<ApiResponse<any>>('/members/my-district', { params })
    return transformPaginatedResponse<Member>(response)
  },

  getUnitMembers: async (unitId: string, params?: MemberSearchParams): Promise<PaginatedResponse<Member>> => {
    const response = await apiService.get<ApiResponse<any>>(`/members/unit/${unitId}`, { params })
    return transformPaginatedResponse<Member>(response)
  },

  getMyUnitMembers: async (params?: MemberSearchParams): Promise<PaginatedResponse<Member>> => {
    const response = await apiService.get<ApiResponse<any>>('/members/my-unit', { params })
    return transformPaginatedResponse<Member>(response)
  },

  // Note: Simple upload endpoint not available, use bulkOperation instead
  // uploadMembers: async (formData: FormData): Promise<any> => {
  //   const response = await apiService.post<ApiResponse<any>>('/members/upload', formData, {
  //     headers: {
  //       'Content-Type': 'multipart/form-data'
  //     }
  //   })
  //   return response.data?.data || response.data
  // },

  // Bulk operations with CSV
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

  // Duplicate management
  checkForDuplicates: async (data: { email?: string; phone?: string }): Promise<{
    hasDuplicates: boolean;
    duplicates: Array<{
      id: string;
      name: string;
      email: string;
      phone: string;
      membershipStatus: string;
      dateJoined: string;
      duplicateFields: string[];
    }>;
  }> => {
    const response = await apiService.post<ApiResponse<any>>('/members/duplicates/check', data)
    return response.data?.data || response.data
  },

  findPotentialDuplicates: async (): Promise<{
    emailDuplicates: any[];
    phoneDuplicates: any[];
    nameDuplicates: any[];
  }> => {
    const response = await apiService.get<ApiResponse<any>>('/members/duplicates/find')
    return response.data?.data || response.data
  },

  mergeDuplicates: async (mergeData: {
    primaryMemberId: string;
    duplicateMemberIds: string[];
  }): Promise<Member> => {
    const response = await apiService.post<ApiResponse<Member>>('/members/duplicates/merge', mergeData)
    return transformSingleResponse<Member>(response)
  },

  validateNoDuplicates: async (email: string, phone: string): Promise<{
    isValid: boolean;
    message: string;
    duplicates?: any[];
  }> => {
    const response = await apiService.get<ApiResponse<any>>(`/members/validation/duplicate-check/${email}/${phone}`)
    return response.data?.data || response.data
  },

  // Timeline/Activity endpoints
  getMemberTimeline: async (memberId: string, params?: { limit?: number; offset?: number }): Promise<{
    activities: any[];
    total: number;
  }> => {
    try {
      // apiService.get returns response.data directly, so 'response' IS the data
      const response = await apiService.get<{ activities: any[]; total: number }>(`/activity-tracker/members/${memberId}/timeline`, { params })
      console.log('[MemberTimeline] Raw API response:', response)

      // Handle both wrapped and unwrapped response formats
      const activities = response?.activities ?? (response as any)?.data?.activities ?? []
      const total = response?.total ?? (response as any)?.data?.total ?? 0

      console.log('[MemberTimeline] Parsed activities:', activities.length, 'total:', total)

      return { activities, total }
    } catch (error) {
      console.error('[MemberTimeline] Error fetching timeline:', error)
      return { activities: [], total: 0 }
    }
  },

  getMemberTimelineStatistics: async (memberId: string): Promise<{
    totalActivities: number;
    recentActivities: number;
    milestones: number;
    roleChanges: number;
    trainings: number;
    lastActivity: Date;
  }> => {
    try {
      // apiService.get returns response.data directly, so 'response' IS the data
      const response = await apiService.get<any>(`/activity-tracker/members/${memberId}/statistics`)
      console.log('[MemberTimeline] Statistics API response:', response)

      // Handle both wrapped and unwrapped response formats
      const stats = response?.data || response

      return {
        totalActivities: stats?.totalActivities ?? 0,
        recentActivities: stats?.recentActivities ?? 0,
        milestones: stats?.milestones ?? 0,
        roleChanges: stats?.roleChanges ?? 0,
        trainings: stats?.trainings ?? 0,
        lastActivity: stats?.lastActivity || new Date(),
      }
    } catch (error) {
      console.error('[MemberTimeline] Error fetching statistics:', error)
      return {
        totalActivities: 0,
        recentActivities: 0,
        milestones: 0,
        roleChanges: 0,
        trainings: 0,
        lastActivity: new Date(),
      }
    }
  },
}