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
  branch?: { _id: string; name: string } | string
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
  branchId?: string
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
  includeInactive?: boolean
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

      const { default: jsPDF } = await import('jspdf')
      const { default: html2canvas } = await import('html2canvas')

      const container = document.createElement('div')
      container.style.position = 'fixed'
      container.style.left = '-9999px'
      container.style.top = '0'
      container.style.width = '800px'
      container.innerHTML = htmlContent
      document.body.appendChild(container)

      await new Promise((resolve) => setTimeout(resolve, 500))

      // Identify logical sections to keep together
      const sectionSelectors = [
        '.header',
        '.executive-summary',
        '.insights-section',
        '.section',
        '.notes-section',
        '.footer',
      ]

      const sections: HTMLElement[] = []
      for (const sel of sectionSelectors) {
        const els = container.querySelectorAll(sel)
        els.forEach((el) => sections.push(el as HTMLElement))
      }

      // If we can't find sections, fall back to single-canvas approach
      if (sections.length === 0) {
        sections.push(container.querySelector('.container') as HTMLElement || container)
      }

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = 210
      const pageHeight = 297
      const margin = 5
      const usableHeight = pageHeight - margin * 2
      let cursorY = margin
      let isFirstPage = true

      for (const section of sections) {
        const canvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          logging: false,
          width: 800,
          backgroundColor: null,
        })

        const imgData = canvas.toDataURL('image/png')
        const imgWidth = pageWidth - margin * 2
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        // If section doesn't fit on current page, start a new page
        if (cursorY + imgHeight > pageHeight - margin && cursorY > margin + 1) {
          pdf.addPage()
          cursorY = margin
          isFirstPage = false
        }

        // If a single section is taller than a full page, scale it to fit
        if (imgHeight > usableHeight) {
          const scale = usableHeight / imgHeight
          const scaledWidth = imgWidth * scale
          const scaledHeight = imgHeight * scale
          const xOffset = margin + (imgWidth - scaledWidth) / 2
          pdf.addImage(imgData, 'PNG', xOffset, cursorY, scaledWidth, scaledHeight)
          cursorY += scaledHeight + 2
        } else {
          pdf.addImage(imgData, 'PNG', margin, cursorY, imgWidth, imgHeight)
          cursorY += imgHeight + 1
        }
      }

      document.body.removeChild(container)
      pdf.save(`service-report-${id}.pdf`)
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

  getAttendanceChartData: async (limit: number = 10, dateFrom?: string, dateTo?: string): Promise<any[]> => {
    const response = await apiService.get<ApiResponse<any[]>>('/service-reports/chart-data', {
      params: { limit, dateFrom, dateTo }
    })
    return transformSingleResponse<any[]>(response) as any[]
  },
}