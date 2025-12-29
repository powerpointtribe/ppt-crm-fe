import { apiService } from './api'
import { ApiResponse } from '@/types/api'
import { transformPaginatedResponse, transformSingleResponse } from '@/utils/apiResponseTransform'

export interface MemberReference {
  _id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  membershipStatus?: string
}

export interface RoleReference {
  _id: string
  name: string
  displayName: string
  slug: string
}

export interface Group {
  _id: string
  name: string
  type: 'district' | 'unit' | 'fellowship' | 'ministry' | 'committee'
  description?: string
  // District leadership
  districtPastor?: string | MemberReference
  // Unit leadership
  unitHead?: string | MemberReference
  assistantUnitHead?: string | MemberReference
  // Ministry leadership
  ministryDirector?: string | MemberReference
  // Ministry-Unit linking
  linkedUnits?: (string | Group)[]
  // Default role for group members
  defaultRole?: string | RoleReference
  // Members
  members: (string | MemberReference)[]
  currentMemberCount?: number
  maxCapacity?: number
  meetingSchedule?: {
    day: string
    time: string
    frequency?: 'weekly' | 'biweekly' | 'monthly'
    location?: string
    isVirtual?: boolean
    virtualLink?: string
    address?: {
      street?: string
      city?: string
      state?: string
      country?: string
    }
  }
  hostingInfo?: {
    hostMember?: string | MemberReference
    rotatingHosts?: (string | MemberReference)[]
    currentHost?: string | MemberReference
  }
  // Contact information (top-level fields as per schema)
  contactPhone?: string
  contactEmail?: string
  // Legacy contact object for backward compatibility
  contact?: {
    phone?: string
    email?: string
    address?: string
  }
  vision?: string
  mission?: string
  goals?: string[]
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
  assistantUnitHead?: string
  ministryDirector?: string
  linkedUnits?: string[]
  defaultRole?: string
  meetingSchedule?: Group['meetingSchedule']
  hostingInfo?: Group['hostingInfo']
  maxCapacity?: number
  contact?: Group['contact']
  vision?: string
  mission?: string
  goals?: string[]
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

  removeDistrictPastor: async (groupId: string): Promise<Group> => {
    const response = await apiService.patch<ApiResponse<Group>>(`/groups/${groupId}/remove-district-pastor`)
    return response.data?.data || response.data
  },

  assignUnitHead: async (groupId: string, headId: string): Promise<Group> => {
    const response = await apiService.patch<ApiResponse<Group>>(`/groups/${groupId}/assign-unit-head/${headId}`)
    return response.data?.data || response.data
  },

  removeUnitHead: async (groupId: string): Promise<Group> => {
    const response = await apiService.patch<ApiResponse<Group>>(`/groups/${groupId}/remove-unit-head`)
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

  // ============================================
  // NEW METHODS: Leadership, Bulk Members, Ministry-Unit Sync
  // ============================================

  // Assign Assistant Unit Head
  assignAssistantUnitHead: async (groupId: string, memberId: string): Promise<Group> => {
    const response = await apiService.patch<ApiResponse<Group>>(
      `/groups/${groupId}/assign-assistant-unit-head/${memberId}`
    )
    return response.data?.data || response.data
  },

  // Remove Assistant Unit Head
  removeAssistantUnitHead: async (groupId: string): Promise<Group> => {
    const response = await apiService.patch<ApiResponse<Group>>(
      `/groups/${groupId}/remove-assistant-unit-head`
    )
    return response.data?.data || response.data
  },

  // Assign Ministry Director
  assignMinistryDirector: async (groupId: string, memberId: string): Promise<Group> => {
    const response = await apiService.patch<ApiResponse<Group>>(
      `/groups/${groupId}/assign-ministry-director/${memberId}`
    )
    return response.data?.data || response.data
  },

  // Remove Ministry Director
  removeMinistryDirector: async (groupId: string): Promise<Group> => {
    const response = await apiService.patch<ApiResponse<Group>>(
      `/groups/${groupId}/remove-ministry-director`
    )
    return response.data?.data || response.data
  },

  // Bulk Add Members
  addMembersToGroup: async (groupId: string, memberIds: string[]): Promise<Group> => {
    const response = await apiService.patch<ApiResponse<Group>>(
      `/groups/${groupId}/members/bulk-add`,
      { memberIds }
    )
    return response.data?.data || response.data
  },

  // Set Default Role
  setDefaultRole: async (groupId: string, roleId: string): Promise<Group> => {
    const response = await apiService.patch<ApiResponse<Group>>(
      `/groups/${groupId}/default-role/${roleId}`
    )
    return response.data?.data || response.data
  },

  // Remove Default Role
  removeDefaultRole: async (groupId: string): Promise<Group> => {
    const response = await apiService.patch<ApiResponse<Group>>(
      `/groups/${groupId}/remove-default-role`
    )
    return response.data?.data || response.data
  },

  // Link Units to Ministry
  linkUnitsToMinistry: async (ministryId: string, unitIds: string[]): Promise<Group> => {
    const response = await apiService.patch<ApiResponse<Group>>(
      `/groups/${ministryId}/link-units`,
      { unitIds }
    )
    return response.data?.data || response.data
  },

  // Unlink Units from Ministry
  unlinkUnitsFromMinistry: async (ministryId: string, unitIds: string[]): Promise<Group> => {
    const response = await apiService.patch<ApiResponse<Group>>(
      `/groups/${ministryId}/unlink-units`,
      { unitIds }
    )
    return response.data?.data || response.data
  },

  // Get all ministries
  getMinistries: async (params?: GroupSearchParams): Promise<PaginatedResponse<Group>> => {
    const response = await apiService.get<ApiResponse<any>>('/groups', {
      params: { ...params, type: 'ministry' }
    })
    return transformPaginatedResponse<Group>(response)
  },
}