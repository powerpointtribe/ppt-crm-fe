import { apiService } from './api'
import { ApiResponse } from '@/types/api'
import { transformPaginatedResponse, transformSingleResponse } from '@/utils/apiResponseTransform'

export enum ServiceTag {
  INVITED_GUEST_MINISTER = 'invited_guest_minister',
  SUNDAY_AFTER_SATURDAY_OUTREACH = 'sunday_after_saturday_outreach',
  THEMED_SERVICE = 'themed_service',
  BEGINNING_OF_NEW_SERIES = 'beginning_of_new_series',
  CELEBRATION_SERVICE = 'celebration_service',
  SUNDAY_AFTER_VIRAL_POST = 'sunday_after_viral_post',
  OTHERS = 'others',
}

export const SERVICE_TAG_LABELS: Record<ServiceTag, string> = {
  [ServiceTag.INVITED_GUEST_MINISTER]: 'Invited Guest Minister',
  [ServiceTag.SUNDAY_AFTER_SATURDAY_OUTREACH]: 'Sunday after Saturday Outreach',
  [ServiceTag.THEMED_SERVICE]: 'Themed Service',
  [ServiceTag.BEGINNING_OF_NEW_SERIES]: 'Beginning of New Series',
  [ServiceTag.CELEBRATION_SERVICE]: 'Celebration Service (Thanksgiving, Wedding, Baby Dedication etc.)',
  [ServiceTag.SUNDAY_AFTER_VIRAL_POST]: 'Sunday after Viral/Promoted Post on WhatsApp/Social Media',
  [ServiceTag.OTHERS]: 'Others',
}

export interface ServiceReport {
  _id: string
  date: string
  serviceName: string
  serviceTags: ServiceTag[]
  totalAttendance: number
  numberOfMales: number
  numberOfFemales: number
  numberOfChildren: number
  numberOfFirstTimers: number
  reportedBy: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  attendanceBreakdown?: {
    total: number
    males: number
    females: number
    children: number
    adults: number
    firstTimers: number
    returningMembers: number
  }
}

export interface CreateServiceReportData {
  date: string
  serviceName: string
  serviceTags?: ServiceTag[]
  totalAttendance: number
  numberOfMales: number
  numberOfFemales: number
  numberOfChildren: number
  numberOfFirstTimers: number
  notes?: string
}

export interface UpdateServiceReportData extends Partial<CreateServiceReportData> {}

export interface ServiceReportSearchParams {
  page?: number
  limit?: number
  search?: string
  serviceTag?: ServiceTag
  dateFrom?: string
  dateTo?: string
  reportedBy?: string
  serviceName?: string
  minAttendance?: number
  maxAttendance?: number
  minFirstTimers?: number
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

export interface ServiceReportStats {
  overall: {
    totalReports: number
    totalAttendance: number
    highestAttendance: number
    totalFirstTimers: number
    averageAttendance: number
    averageFirstTimers: number
    totalMales: number
    totalFemales: number
    totalChildren: number
  }
  byServiceTag: Array<{
    _id: ServiceTag
    count: number
    totalAttendance: number
    averageAttendance: number
  }>
  monthlyTrends: Array<{
    _id: {
      year: number
      month: number
    }
    reportCount: number
    totalAttendance: number
    totalFirstTimers: number
    averageAttendance: number
  }>
}

export const serviceReportsService = {
  getServiceReports: async (params?: ServiceReportSearchParams): Promise<PaginatedResponse<ServiceReport>> => {
    const response = await apiService.get<ApiResponse<any>>('/service-reports', { params })
    return transformPaginatedResponse<ServiceReport>(response)
  },

  getServiceReportById: async (id: string): Promise<ServiceReport> => {
    const response = await apiService.get<ApiResponse<ServiceReport>>(`/service-reports/${id}`)
    return transformSingleResponse<ServiceReport>(response) as ServiceReport
  },

  createServiceReport: async (data: CreateServiceReportData): Promise<ServiceReport> => {
    const response = await apiService.post<ApiResponse<ServiceReport>>('/service-reports', data)
    return transformSingleResponse<ServiceReport>(response) as ServiceReport
  },

  updateServiceReport: async (id: string, data: UpdateServiceReportData): Promise<ServiceReport> => {
    const response = await apiService.patch<ApiResponse<ServiceReport>>(`/service-reports/${id}`, data)
    return transformSingleResponse<ServiceReport>(response) as ServiceReport
  },

  deleteServiceReport: async (id: string): Promise<void> => {
    await apiService.delete(`/service-reports/${id}`)
  },

  getServiceReportStats: async (params?: { dateFrom?: string; dateTo?: string }): Promise<ServiceReportStats> => {
    const response = await apiService.get<ApiResponse<ServiceReportStats>>('/service-reports/stats', { params })
    return transformSingleResponse<ServiceReportStats>(response) as ServiceReportStats
  },

  getMyServiceReports: async (params?: ServiceReportSearchParams): Promise<PaginatedResponse<ServiceReport>> => {
    const response = await apiService.get<ApiResponse<any>>('/service-reports/my-reports', { params })
    return transformPaginatedResponse<ServiceReport>(response)
  },

  getRecentServiceReports: async (
    days: number = 30,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<ServiceReport>> => {
    const response = await apiService.get<ApiResponse<any>>('/service-reports/recent', {
      params: { days, page, limit }
    })
    return transformPaginatedResponse<ServiceReport>(response)
  },

  generatePdfReport: async (id: string): Promise<void> => {
    try {
      const response = await apiService.get(`/service-reports/${id}/pdf`)
      const htmlContent = response.data?.data?.html || response.data?.html

      if (!htmlContent) {
        throw new Error('No HTML content received from server')
      }

      // Create a new window/tab with the HTML content for printing
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.open()
        printWindow.document.write(htmlContent)
        printWindow.document.close()

        // Auto-trigger print dialog after content loads
        printWindow.onload = () => {
          printWindow.print()
        }
      } else {
        // Fallback: create a blob and download as HTML
        const blob = new Blob([htmlContent], { type: 'text/html' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `service-report-${id}.html`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw error
    }
  },

  // Helper function to validate attendance numbers
  validateAttendanceNumbers: (data: CreateServiceReportData | UpdateServiceReportData): string[] => {
    const errors: string[] = []

    if (data.totalAttendance !== undefined &&
        data.numberOfMales !== undefined &&
        data.numberOfFemales !== undefined &&
        data.numberOfChildren !== undefined) {

      const calculatedTotal = data.numberOfMales + data.numberOfFemales + data.numberOfChildren
      if (calculatedTotal !== data.totalAttendance) {
        errors.push(
          `Total attendance (${data.totalAttendance}) must equal sum of males (${data.numberOfMales}) + females (${data.numberOfFemales}) + children (${data.numberOfChildren}) = ${calculatedTotal}`
        )
      }
    }

    if (data.numberOfFirstTimers !== undefined &&
        data.totalAttendance !== undefined &&
        data.numberOfFirstTimers > data.totalAttendance) {
      errors.push(
        `Number of first timers (${data.numberOfFirstTimers}) cannot exceed total attendance (${data.totalAttendance})`
      )
    }

    return errors
  },

  // Helper function to get service tag label
  getServiceTagLabel: (tag: ServiceTag): string => {
    return SERVICE_TAG_LABELS[tag] || tag
  },

  // Helper function to get all service tag options
  getServiceTagOptions: (): Array<{ value: ServiceTag; label: string }> => {
    return Object.entries(SERVICE_TAG_LABELS).map(([value, label]) => ({
      value: value as ServiceTag,
      label,
    }))
  },

  getAttendanceChartData: async (limit: number = 10): Promise<any[]> => {
    const response = await apiService.get<ApiResponse<any[]>>('/service-reports/chart-data', {
      params: { limit }
    })
    return transformSingleResponse<any[]>(response) as any[]
  },
}