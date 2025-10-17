import { apiService } from './api'
import { ApiResponse } from '@/types/api'
import { transformPaginatedResponse, transformSingleResponse, transformArrayResponse } from '@/utils/apiResponseTransform'

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface LeadershipRoles {
  isDistrictPastor: boolean
  isChamp: boolean
  isUnitHead: boolean
  champForDistrict?: string
  leadsUnit?: string
  pastorsDistrict?: string
}

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  email?: string
}

export interface Member {
  _id: string
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
  leadershipRoles: LeadershipRoles
  membershipStatus: 'new_convert' | 'worker' | 'volunteer' | 'leader' | 'district_pastor' | 'champ' | 'unit_head' | 'inactive' | 'transferred'
  dateJoined: string
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
  createdAt: string
  updatedAt: string
}

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
  leadershipRoles?: Partial<LeadershipRoles>
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
}