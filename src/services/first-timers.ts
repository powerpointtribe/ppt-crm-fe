import { apiService } from './api'
import { ApiResponse } from '@/types/api'
import { transformPaginatedResponse, transformSingleResponse } from '@/utils/apiResponseTransform'

export interface FollowUpRecord {
  date: string
  method: 'phone' | 'email' | 'sms' | 'whatsapp' | 'visit' | 'video_call'
  notes: string
  outcome: 'successful' | 'no_answer' | 'busy' | 'not_interested' | 'interested' | 'follow_up_needed'
  contactedBy: string | {
    _id: string
    firstName: string
    lastName: string
    email?: string
  }
  nextFollowUpDate?: string
}

export interface CallReport {
  _id: string
  firstTimerId: string
  callMadeBy: string
  callDate: string
  status: 'successful' | 'no_answer' | 'busy' | 'not_interested' | 'interested' | 'follow_up_needed' | 'completed'
  notes: string
  deductions?: string

  // Service attendance tracking
  attended2ndService: boolean
  attended3rdService: boolean
  attended4thService: boolean

  contactMethod: 'phone' | 'email' | 'sms' | 'whatsapp' | 'visit' | 'video_call'
  nextFollowUpDate?: string
  reportNumber: number // 1-4
  createdAt: string
  updatedAt: string
}

export interface CreateCallReportData {
  firstTimerId: string
  callDate: string
  status: CallReport['status']
  notes: string
  deductions?: string
  attended2ndService?: boolean
  attended3rdService?: boolean
  attended4thService?: boolean
  contactMethod: CallReport['contactMethod']
  nextFollowUpDate?: string
  reportNumber: number
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
  howDidYouHear?: 'friend' | 'family' | 'advertisement' | 'online' | 'event' | 'walkby' | 'website' | 'social_media' | 'other'
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
  // Engagement status for first-timers
  // This is different from membershipStatus used in Members module
  status: 'NEW' | 'ENGAGED' | 'READY_FOR_INTEGRATION' | 'ARCHIVED' | 'CLOSED'
  assignedTo?: string
  followUpPerson?: string
  giaLeader?: string
  followUps: FollowUpRecord[]
  notes?: string
  converted: boolean
  convertedToMemberId?: string
  dateConverted?: string

  // New enhanced fields
  stage: 'new' | 'engaged' | 'closed'
  interestedInJoining: boolean
  integrationStage: 'none' | 'assigned_to_district' | 'started_cohort' | 'baptism_class' | 'baptized' | 'cell_group' | 'ministry_assigned' | 'leadership_training' | 'fully_integrated'
  integrationStageDate?: string
  assignedDistrict?: string
  districtAssignmentDate?: string

  // Call reports tracking
  callReportsCount: number

  // Member conversion
  memberRecord?: string
  memberCreatedAt?: string
  pendingDistrictAssignment: boolean

  // Branch assignment
  branch?: string | {
    _id: string
    name: string
    slug?: string
  }

  // Archive fields
  isArchived: boolean
  archivedAt?: string
  archiveReason?: string
  exemptFromAutoArchive: boolean

  // Ready for Integration fields
  readyForIntegration: boolean
  readyForIntegrationDate?: string
  markedReadyBy?: string | {
    _id: string
    firstName: string
    lastName: string
  }

  // Profile photo
  profilePhotoUrl?: string

  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ArchiveStats {
  totalArchived: number
  archivedThisMonth: number
  exemptFromArchive: number
  eligibleForArchive: number
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
  branch?: string // Optional - auto-assigned from user's branch if not specified
}

export interface UpdateFirstTimerData extends Partial<CreateFirstTimerData> {
  status?: FirstTimer['status']
  assignedTo?: string
  notes?: string
}

export type DateRangeFilter = '7days' | '30days' | '3months' | 'all'

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
  branchId?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  excludeReadyForIntegration?: boolean
  dateRange?: DateRangeFilter
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
    const assignments = data.firstTimerIds.map(firstTimerId => ({
      firstTimerId,
      memberId: data.assignedTo
    }))
    const response = await apiService.post<ApiResponse<any>>('/first-timers/bulk-assign', { assignments })
    return response.data?.data || response.data
  },

  bulkUpdateStatus: async (data: BulkStatusUpdateData): Promise<any> => {
    const response = await apiService.patch<ApiResponse<any>>('/first-timers/bulk-status', data)
    return response.data?.data || response.data
  },

  // Public registration
  createPublicFirstTimer: async (data: Partial<CreateFirstTimerData> & { branchSlug?: string }): Promise<any> => {
    const { branchSlug, ...firstTimerData } = data

    // Use branch-specific endpoint if branchSlug is provided
    const endpoint = branchSlug
      ? `/first-timers/public/branches/${branchSlug}`
      : '/first-timers/public'

    const response = await apiService.post<ApiResponse<any>>(endpoint, firstTimerData)
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

  // Public form configuration
  getPublicFormConfig: async (): Promise<any> => {
    const response = await apiService.get<ApiResponse<any>>('/first-timers/public/form-config')
    return transformSingleResponse(response)
  },

  // Call Reports
  getCallReports: async (firstTimerId: string): Promise<CallReport[]> => {
    const response = await apiService.get<ApiResponse<CallReport[]>>(`/first-timers/${firstTimerId}/call-reports`)
    return response.data?.data || response.data || []
  },

  createCallReport: async (data: CreateCallReportData): Promise<CallReport> => {
    const response = await apiService.post<ApiResponse<CallReport>>(`/first-timers/${data.firstTimerId}/call-reports`, data)
    return transformSingleResponse<CallReport>(response) as CallReport
  },

  updateCallReport: async (id: string, data: Partial<CreateCallReportData>): Promise<CallReport> => {
    const response = await apiService.patch<ApiResponse<CallReport>>(`/first-timers/call-reports/${id}`, data)
    return transformSingleResponse<CallReport>(response) as CallReport
  },

  deleteCallReport: async (id: string): Promise<void> => {
    await apiService.delete(`/first-timers/call-reports/${id}`)
  },

  getCallReportsSummary: async (firstTimerId: string): Promise<any> => {
    const response = await apiService.get<ApiResponse<any>>(`/first-timers/${firstTimerId}/call-reports/summary`)
    return transformSingleResponse(response)
  },

  // Assignment with notifications
  assignForFollowUp: async (firstTimerId: string, assigneeId: string): Promise<FirstTimer> => {
    const response = await apiService.patch<ApiResponse<FirstTimer>>(`/first-timers/${firstTimerId}/assign`, {
      followUpPersonId: assigneeId
    })
    return transformSingleResponse<FirstTimer>(response) as FirstTimer
  },

  bulkAssignForFollowUp: async (assignments: Array<{firstTimerId: string, assigneeId: string}>): Promise<any> => {
    const response = await apiService.post<ApiResponse<any>>('/first-timers/bulk-assign', {
      assignments
    })
    return response.data?.data || response.data
  },

  // Integration Stage Management
  updateIntegrationStage: async (firstTimerId: string, integrationStage: string, assignedDistrict?: string): Promise<FirstTimer> => {
    const response = await apiService.patch<ApiResponse<FirstTimer>>(`/first-timers/${firstTimerId}/integration-stage`, {
      integrationStage,
      assignedDistrict
    })
    return transformSingleResponse<FirstTimer>(response) as FirstTimer
  },

  // Close First Timer
  closeFirstTimer: async (firstTimerId: string, reason: 'unwilling' | 'became_member', memberRecordId?: string): Promise<FirstTimer> => {
    const response = await apiService.post<ApiResponse<FirstTimer>>(`/first-timers/${firstTimerId}/close`, {
      reason,
      memberRecordId
    })
    return transformSingleResponse<FirstTimer>(response) as FirstTimer
  },

  // Call Reports Analytics
  getGlobalCallReportsAnalytics: async (): Promise<any> => {
    const response = await apiService.get<ApiResponse<any>>('/first-timers/call-reports/analytics/global')
    return transformSingleResponse(response)
  },

  getTeamPerformanceAnalytics: async (): Promise<any[]> => {
    const response = await apiService.get<ApiResponse<any[]>>('/first-timers/call-reports/analytics/team-performance')
    return transformSingleResponse(response) as any[]
  },

  getOverdueCallReports: async (): Promise<any[]> => {
    const response = await apiService.get<ApiResponse<any[]>>('/first-timers/call-reports/overdue')
    return transformSingleResponse(response) as any[]
  },

  searchCallReports: async (params: {
    page?: number
    limit?: number
    status?: string
    contactMethod?: string
    callMadeBy?: string
    fromDate?: string
    toDate?: string
    firstTimerName?: string
  }): Promise<{
    reports: CallReport[]
    total: number
    pagination: {
      page: number
      limit: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }> => {
    const response = await apiService.get<ApiResponse<any>>('/first-timers/call-reports/search', { params })
    return transformSingleResponse(response) as any
  },

  // Archive Management
  getArchivedFirstTimers: async (params?: FirstTimerSearchParams): Promise<PaginatedResponse<FirstTimer>> => {
    // Clean params by removing undefined/null values and ensuring page/limit have defaults
    const cleanParams = params ? Object.fromEntries(
      Object.entries({
        ...params,
        page: params.page || 1,
        limit: params.limit || 10,
      }).filter(([, value]) => value !== undefined && value !== null && value !== '')
    ) : { page: 1, limit: 10 }
    const response = await apiService.get<ApiResponse<any>>('/first-timers/archived', { params: cleanParams })
    return transformPaginatedResponse<FirstTimer>(response)
  },

  getArchiveStats: async (): Promise<ArchiveStats> => {
    const response = await apiService.get<ApiResponse<ArchiveStats>>('/first-timers/archive/stats')
    return transformSingleResponse<ArchiveStats>(response) as ArchiveStats
  },

  archiveFirstTimer: async (id: string, reason?: string): Promise<FirstTimer> => {
    const response = await apiService.post<ApiResponse<FirstTimer>>(`/first-timers/${id}/archive`, { reason })
    return transformSingleResponse<FirstTimer>(response) as FirstTimer
  },

  unarchiveFirstTimer: async (id: string): Promise<FirstTimer> => {
    const response = await apiService.post<ApiResponse<FirstTimer>>(`/first-timers/${id}/unarchive`)
    return transformSingleResponse<FirstTimer>(response) as FirstTimer
  },

  setExemptFromAutoArchive: async (id: string, exempt: boolean): Promise<FirstTimer> => {
    const response = await apiService.patch<ApiResponse<FirstTimer>>(`/first-timers/${id}/exempt-from-archive`, { exempt })
    return transformSingleResponse<FirstTimer>(response) as FirstTimer
  },

  runAutoArchive: async (): Promise<{ archivedCount: number; archivedIds: string[] }> => {
    const response = await apiService.post<ApiResponse<any>>('/first-timers/archive/run-auto-archive')
    return transformSingleResponse(response) as { archivedCount: number; archivedIds: string[] }
  },

  // Ready for Integration
  getReadyForIntegration: async (params?: FirstTimerSearchParams): Promise<PaginatedResponse<FirstTimer>> => {
    const cleanParams = params ? Object.fromEntries(
      Object.entries({
        ...params,
        page: params.page || 1,
        limit: params.limit || 10,
      }).filter(([, value]) => value !== undefined && value !== null && value !== '')
    ) : { page: 1, limit: 10 }
    const response = await apiService.get<ApiResponse<any>>('/first-timers/ready-for-integration', { params: cleanParams })
    return transformPaginatedResponse<FirstTimer>(response)
  },

  getReadyForIntegrationCount: async (): Promise<number> => {
    const response = await apiService.get<ApiResponse<{ count: number }>>('/first-timers/ready-for-integration/count')
    const data = transformSingleResponse(response) as { count: number }
    return data?.count || 0
  },

  markReadyForIntegration: async (id: string): Promise<FirstTimer> => {
    const response = await apiService.post<ApiResponse<FirstTimer>>(`/first-timers/${id}/ready-for-integration`)
    return transformSingleResponse<FirstTimer>(response) as FirstTimer
  },

  unmarkReadyForIntegration: async (id: string): Promise<FirstTimer> => {
    const response = await apiService.post<ApiResponse<FirstTimer>>(`/first-timers/${id}/unmark-ready-for-integration`)
    return transformSingleResponse<FirstTimer>(response) as FirstTimer
  },

  integrateFirstTimer: async (id: string, districtId: string, unitId?: string): Promise<{ firstTimer: FirstTimer; memberId: string }> => {
    const response = await apiService.post<ApiResponse<{ firstTimer: FirstTimer; memberId: string }>>(`/first-timers/${id}/integrate`, {
      districtId,
      unitId,
    })
    return transformSingleResponse<{ firstTimer: FirstTimer; memberId: string }>(response) as { firstTimer: FirstTimer; memberId: string }
  },
}
