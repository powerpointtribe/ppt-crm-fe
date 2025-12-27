import { apiService } from './api'
import { ApiResponse } from '@/types/api'
import { transformPaginatedResponse, transformSingleResponse } from '@/utils/apiResponseTransform'

export interface Group {
  _id: string
  name: string
  type: 'district' | 'unit' | 'fellowship' | 'ministry' | 'committee'
  description?: string
  districtPastor?: string
  unitHead?: string
  champs?: string[]
  members: string[]
  meetingSchedule?: {
    day: string
    time: string
    frequency: 'weekly' | 'biweekly' | 'monthly'
  }
  hostingInfo?: {
    currentHost: string
    hostRotation: string[]
    nextRotationDate?: string
  }
  capacity?: number
  contact?: {
    phone?: string
    email?: string
    address?: string
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateGroupData {
  name: string
  type: Group['type']
  description?: string
  districtPastor?: string
  unitHead?: string
  meetingSchedule?: Group['meetingSchedule']
  hostingInfo?: Group['hostingInfo']
  capacity?: number
  contact?: Group['contact']
}

export interface UpdateGroupData extends Partial<CreateGroupData> {}

export interface GroupSearchParams {
  page?: number
  limit?: number
  search?: string
  type?: Group['type']
  districtPastorId?: string
  unitHeadId?: string
  isActive?: boolean
  needsLeaders?: boolean
  nearCapacity?: boolean
  branchId?: string
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

export const groupsService = {
  getGroups: async (params?: GroupSearchParams): Promise<PaginatedResponse<Group>> => {
    const response = await apiService.get<ApiResponse<any>>('/groups', { params })
    return transformPaginatedResponse<Group>(response)
  },

  getGroupById: async (id: string): Promise<Group> => {
    const response = await apiService.get<ApiResponse<Group>>(`/groups/${id}`)
    return transformSingleResponse<Group>(response) as Group
  },

  createGroup: async (data: CreateGroupData): Promise<Group> => {
    const response = await apiService.post<ApiResponse<Group>>('/groups', data)
    return transformSingleResponse<Group>(response) as Group
  },

  updateGroup: async (id: string, data: UpdateGroupData): Promise<Group> => {
    const response = await apiService.patch<ApiResponse<Group>>(`/groups/${id}`, data)
    return transformSingleResponse<Group>(response) as Group
  },

  deleteGroup: async (id: string): Promise<void> => {
    await apiService.delete(`/groups/${id}`)
  },

  getGroupStats: async (): Promise<any> => {
    const response = await apiService.get<ApiResponse<any>>('/groups/stats')
    return transformSingleResponse(response)
  },

  getDistricts: async (params?: GroupSearchParams): Promise<PaginatedResponse<Group>> => {
    const response = await apiService.get<ApiResponse<any>>('/groups/districts', { params })
    return transformPaginatedResponse<Group>(response)
  },

  getUnits: async (params?: GroupSearchParams): Promise<PaginatedResponse<Group>> => {
    const response = await apiService.get<ApiResponse<any>>('/groups/units', { params })
    return transformPaginatedResponse<Group>(response)
  },

  getDistrictsNeedingPastors: async (params?: GroupSearchParams): Promise<PaginatedResponse<Group>> => {
    const response = await apiService.get<ApiResponse<any>>('/groups/districts/needing-pastors', { params })
    return transformPaginatedResponse<Group>(response)
  },

  getUnitsNeedingHeads: async (params?: GroupSearchParams): Promise<PaginatedResponse<Group>> => {
    const response = await apiService.get<ApiResponse<any>>('/groups/units/needing-heads', { params })
    return transformPaginatedResponse<Group>(response)
  },

  getMyGroups: async (params?: GroupSearchParams): Promise<PaginatedResponse<Group>> => {
    const response = await apiService.get<ApiResponse<any>>('/groups/my-groups', { params })
    return transformPaginatedResponse<Group>(response)
  },

  addMemberToGroup: async (groupId: string, memberId: string): Promise<Group> => {
    const response = await apiService.patch<ApiResponse<Group>>(`/groups/${groupId}/members/${memberId}/add`)
    return response.data?.data || response.data
  },

  removeMemberFromGroup: async (groupId: string, memberId: string): Promise<Group> => {
    const response = await apiService.patch<ApiResponse<Group>>(`/groups/${groupId}/members/${memberId}/remove`)
    return response.data?.data || response.data
  },

  assignDistrictPastor: async (groupId: string, pastorId: string): Promise<Group> => {
    const response = await apiService.patch<ApiResponse<Group>>(`/groups/${groupId}/assign-district-pastor/${pastorId}`)
    return response.data?.data || response.data
  },

  assignUnitHead: async (groupId: string, headId: string): Promise<Group> => {
    const response = await apiService.patch<ApiResponse<Group>>(`/groups/${groupId}/assign-unit-head/${headId}`)
    return response.data?.data || response.data
  },

  addChamp: async (groupId: string, champId: string): Promise<Group> => {
    const response = await apiService.patch<ApiResponse<Group>>(`/groups/${groupId}/add-champ/${champId}`)
    return response.data?.data || response.data
  },

  removeChamp: async (groupId: string, champId: string): Promise<Group> => {
    const response = await apiService.patch<ApiResponse<Group>>(`/groups/${groupId}/remove-champ/${champId}`)
    return response.data?.data || response.data
  },

  updateHostingInfo: async (groupId: string, hostingData: Group['hostingInfo']): Promise<Group> => {
    const response = await apiService.patch<ApiResponse<Group>>(`/groups/${groupId}/hosting`, hostingData)
    return response.data?.data || response.data
  },

  rotateHost: async (groupId: string): Promise<Group> => {
    const response = await apiService.patch<ApiResponse<Group>>(`/groups/${groupId}/rotate-host`)
    return response.data?.data || response.data
  },

  activateGroup: async (id: string): Promise<Group> => {
    const response = await apiService.patch<ApiResponse<Group>>(`/groups/${id}/activate`)
    return response.data?.data || response.data
  },

  deactivateGroup: async (id: string): Promise<Group> => {
    const response = await apiService.patch<ApiResponse<Group>>(`/groups/${id}/deactivate`)
    return response.data?.data || response.data
  },

  // Note: Bulk upload endpoint not available in backend yet
  // uploadGroups: async (formData: FormData): Promise<any> => {
  //   const response = await apiService.post<ApiResponse<any>>('/groups/upload', formData, {
  //     headers: {
  //       'Content-Type': 'multipart/form-data'
  //     }
  //   })
  //   return response.data?.data || response.data
  // },
}