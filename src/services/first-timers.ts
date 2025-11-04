import { apiService } from './api'
import { ApiResponse } from '@/types/api'
import { transformPaginatedResponse, transformSingleResponse } from '@/utils/apiResponseTransform'

export interface FollowUpRecord {
  date: string
  method: 'phone' | 'email' | 'sms' | 'whatsapp' | 'visit' | 'video_call'
  notes: string
  outcome: 'successful' | 'no_answer' | 'busy' | 'not_interested' | 'interested' | 'follow_up_needed'
  contactedBy: string
  nextFollowUpDate?: string
}

export interface Address {
  street?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}

export interface FamilyMember {
  name: string
  relationship: string
  age?: number
  attended?: boolean
}

export interface FirstTimer {
  _id: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  dateOfBirth?: string
  gender?: 'male' | 'female'
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed'
  address?: Address
  dateOfVisit: string
  serviceType?: string
  howDidYouHear?: 'friend' | 'family' | 'advertisement' | 'online' | 'event' | 'walkby' | 'other'
  visitorType?: 'first_time' | 'returning' | 'new_to_area' | 'church_shopping'
  familyMembers?: FamilyMember[]
  interests?: string[]
  prayerRequests?: string[]
  servingInterests?: string[]
  occupation?: string
  emergencyContact?: {
    name: string
    relationship: string
    phone: string
  }
  status: 'not_contacted' | 'contacted' | 'scheduled_visit' | 'visited' | 'joined_group' | 'converted' | 'lost_contact'
  assignedTo?: string
  followUps: FollowUpRecord[]
  notes?: string
  converted: boolean
  convertedToMemberId?: string
  dateConverted?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateFirstTimerData {
  firstName: string
  lastName: string
  phone: string
  email?: string
  dateOfBirth?: string
  gender?: 'male' | 'female'
  maritalStatus?: FirstTimer['maritalStatus']
  address?: Address
  dateOfVisit: string
  serviceType?: string
  howDidYouHear?: FirstTimer['howDidYouHear']
  visitorType?: FirstTimer['visitorType']
  familyMembers?: FamilyMember[]
  interests?: string[]
  prayerRequests?: string[]
  servingInterests?: string[]
  occupation?: string
  emergencyContact?: FirstTimer['emergencyContact']
  notes?: string
}

export interface UpdateFirstTimerData extends Partial<CreateFirstTimerData> {
  status?: FirstTimer['status']
  assignedTo?: string
  notes?: string
}

export interface FirstTimerSearchParams {
  page?: number
  limit?: number
  search?: string
  status?: FirstTimer['status']
  assignedTo?: string
  visitDateFrom?: string
  visitDateTo?: string
  converted?: boolean
  needsFollowUp?: boolean
  visitorType?: FirstTimer['visitorType']
  howDidYouHear?: FirstTimer['howDidYouHear']
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

export interface BulkAssignData {
  firstTimerIds: string[]
  assignedTo: string
}

export interface BulkStatusUpdateData {
  firstTimerIds: string[]
  status: FirstTimer['status']
}

export const firstTimersService = {
  getFirstTimers: async (params?: FirstTimerSearchParams): Promise<PaginatedResponse<FirstTimer>> => {
    const response = await apiService.get<ApiResponse<any>>('/first-timers', { params })
    return transformPaginatedResponse<FirstTimer>(response)
  },

  getFirstTimerById: async (id: string): Promise<FirstTimer> => {
    const response = await apiService.get<ApiResponse<FirstTimer>>(`/first-timers/${id}`)
    return transformSingleResponse<FirstTimer>(response) as FirstTimer
  },

  createFirstTimer: async (data: CreateFirstTimerData): Promise<FirstTimer> => {
    const response = await apiService.post<ApiResponse<FirstTimer>>('/first-timers', data)
    return transformSingleResponse<FirstTimer>(response) as FirstTimer
  },

  updateFirstTimer: async (id: string, data: UpdateFirstTimerData): Promise<FirstTimer> => {
    const response = await apiService.patch<ApiResponse<FirstTimer>>(`/first-timers/${id}`, data)
    return transformSingleResponse<FirstTimer>(response) as FirstTimer
  },

  deleteFirstTimer: async (id: string): Promise<void> => {
    await apiService.delete(`/first-timers/${id}`)
  },

  getFirstTimerStats: async (): Promise<any> => {
    const response = await apiService.get<ApiResponse<any>>('/first-timers/stats')
    return transformSingleResponse(response)
  },

  getFirstTimersNeedingFollowUp: async (params?: FirstTimerSearchParams): Promise<PaginatedResponse<FirstTimer>> => {
    const response = await apiService.get<ApiResponse<any>>('/first-timers/needing-follow-up', { params })
    return transformPaginatedResponse<FirstTimer>(response)
  },

  getRecentFirstTimers: async (days: number = 7, params?: FirstTimerSearchParams): Promise<PaginatedResponse<FirstTimer>> => {
    const response = await apiService.get<ApiResponse<any>>(`/first-timers/recent?days=${days}`, { params })
    return transformPaginatedResponse<FirstTimer>(response)
  },

  getMyAssignments: async (params?: FirstTimerSearchParams): Promise<PaginatedResponse<FirstTimer>> => {
    const response = await apiService.get<ApiResponse<any>>('/first-timers/my-assignments', { params })
    return transformPaginatedResponse<FirstTimer>(response)
  },

  addFollowUp: async (id: string, followUpData: Omit<FollowUpRecord, 'contactedBy'>): Promise<FirstTimer> => {
    const response = await apiService.patch<ApiResponse<FirstTimer>>(`/first-timers/${id}/follow-up`, followUpData)
    return response.data?.data || response.data
  },

  updateStatus: async (id: string, status: FirstTimer['status']): Promise<FirstTimer> => {
    const response = await apiService.patch<ApiResponse<FirstTimer>>(`/first-timers/${id}/status`, { status })
    return response.data?.data || response.data
  },

  assignToUser: async (id: string, userId: string): Promise<FirstTimer> => {
    const response = await apiService.patch<ApiResponse<FirstTimer>>(`/first-timers/${id}/assign/${userId}`)
    return response.data?.data || response.data
  },

  convertToMember: async (id: string, memberData?: any): Promise<FirstTimer> => {
    const response = await apiService.patch<ApiResponse<FirstTimer>>(`/first-timers/${id}/convert`, memberData)
    return response.data?.data || response.data
  },

  updateNotes: async (id: string, notes: string): Promise<FirstTimer> => {
    const response = await apiService.patch<ApiResponse<FirstTimer>>(`/first-timers/${id}/notes`, { notes })
    return response.data?.data || response.data
  },

  deactivateFirstTimer: async (id: string): Promise<FirstTimer> => {
    const response = await apiService.patch<ApiResponse<FirstTimer>>(`/first-timers/${id}/deactivate`)
    return response.data?.data || response.data
  },

  bulkAssign: async (data: BulkAssignData): Promise<any> => {
    const response = await apiService.post<ApiResponse<any>>('/first-timers/bulk-assign', data)
    return response.data?.data || response.data
  },

  bulkUpdateStatus: async (data: BulkStatusUpdateData): Promise<any> => {
    const response = await apiService.patch<ApiResponse<any>>('/first-timers/bulk-status', data)
    return response.data?.data || response.data
  },

  // Public registration
  createPublicFirstTimer: async (data: Partial<CreateFirstTimerData>): Promise<any> => {
    const response = await apiService.post<ApiResponse<any>>('/first-timers/public', data)
    return response.data?.data || response.data
  },

  // Additional endpoints
  getPendingDistrictAssignments: async (params?: FirstTimerSearchParams): Promise<PaginatedResponse<FirstTimer>> => {
    const response = await apiService.get<ApiResponse<any>>('/first-timers/pending-district', { params })
    return transformPaginatedResponse<FirstTimer>(response)
  },

  bulkUpload: async (formData: FormData): Promise<any> => {
    const response = await apiService.post<ApiResponse<any>>('/first-timers/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data?.data || response.data
  },

  getSampleCSV: async (): Promise<any> => {
    const response = await apiService.get<ApiResponse<any>>('/first-timers/sample-csv')
    return response.data || response
  },
}