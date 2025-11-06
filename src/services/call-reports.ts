import { apiService } from './api'
import { ApiResponse } from '@/types/api'
import { transformPaginatedResponse, transformSingleResponse } from '@/utils/apiResponseTransform'

export interface CallReport {
  _id: string
  firstTimer: {
    _id: string
    firstName: string
    lastName: string
    phone: string
    email?: string
  }
  status: 'pending' | 'contacted' | 'scheduled' | 'not_interested' | 'converted'
  contactMethod: 'phone' | 'whatsapp' | 'sms' | 'email' | 'in_person'
  callMadeBy: {
    _id: string
    firstName: string
    lastName: string
  }
  contactDate: string
  notes?: string
  outcome?: string
  nextAction?: string
  nextActionDate?: string
  createdAt: string
  updatedAt: string
}

export interface CreateCallReportRequest {
  firstTimerId: string
  status: string
  contactMethod: string
  notes?: string
  outcome?: string
  nextAction?: string
  nextActionDate?: string
}

export interface CallReportSearchParams {
  page?: number
  limit?: number
  status?: string
  contactMethod?: string
  callMadeBy?: string
  fromDate?: string
  toDate?: string
  firstTimerName?: string
}

export interface GlobalAnalytics {
  totalReports: number
  contactedToday: number
  pendingFollowUps: number
  conversionRate: number
  statusDistribution: Array<{ status: string; count: number }>
  methodDistribution: Array<{ method: string; count: number }>
}

export interface TeamPerformance {
  member: { firstName: string; lastName: string }
  reportCount: number
  conversionRate: number
}

export const callReportsService = {
  // Create a new call report
  async create(firstTimerId: string, data: Omit<CreateCallReportRequest, 'firstTimerId'>) {
    const response = await apiService.post<ApiResponse<CallReport>>(`/first-timers/${firstTimerId}/call-reports`, data)
    return transformSingleResponse<CallReport>(response)
  },

  // Get call reports for a specific first timer
  async getByFirstTimer(firstTimerId: string) {
    const response = await apiService.get<ApiResponse<CallReport[]>>(`/first-timers/${firstTimerId}/call-reports`)
    return transformSingleResponse<CallReport[]>(response)
  },

  // Get call reports summary for a first timer
  async getSummary(firstTimerId: string) {
    const response = await apiService.get<ApiResponse<any>>(`/first-timers/${firstTimerId}/call-reports/summary`)
    return transformSingleResponse(response)
  },

  // Update a call report
  async update(reportId: string, data: Partial<CreateCallReportRequest>) {
    const response = await apiService.patch<ApiResponse<CallReport>>(`/first-timers/call-reports/${reportId}`, data)
    return transformSingleResponse<CallReport>(response)
  },

  // Delete a call report
  async delete(reportId: string) {
    const response = await apiService.delete(`/first-timers/call-reports/${reportId}`)
    return { success: true }
  },

  // Search and filter call reports
  async searchReports(params: CallReportSearchParams) {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString())
      }
    })

    const response = await apiService.get<ApiResponse<any>>(`/first-timers/call-reports/search?${searchParams.toString()}`)
    return transformSingleResponse(response)
  },

  // Get global analytics
  async getGlobalAnalytics() {
    const response = await apiService.get<ApiResponse<GlobalAnalytics>>('/first-timers/call-reports/analytics/global')
    return transformSingleResponse<GlobalAnalytics>(response)
  },

  // Get team performance analytics
  async getTeamPerformance() {
    const response = await apiService.get<ApiResponse<TeamPerformance[]>>('/first-timers/call-reports/analytics/team-performance')
    return transformSingleResponse<TeamPerformance[]>(response)
  },

  // Get overdue reports
  async getOverdueReports() {
    const response = await apiService.get<ApiResponse<any>>('/first-timers/call-reports/overdue')
    return transformSingleResponse(response)
  }
}