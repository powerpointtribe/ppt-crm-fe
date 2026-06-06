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
    let container: HTMLDivElement | null = null
    try {
      const response = await apiService.get(`/service-reports/${id}/pdf`)
      const htmlContent = response.data?.data?.html || response.data?.html

      if (!htmlContent) {
        throw new Error('No HTML content received from server')
      }

      const { default: jsPDF } = await import('jspdf')
      const { default: html2canvas } = await import('html2canvas')

      container = document.createElement('div')
      container.style.position = 'fixed'
      container.style.left = '-9999px'
      container.style.top = '0'
      container.style.width = '760px'
      container.style.background = '#ffffff'
      container.innerHTML = htmlContent
      document.body.appendChild(container)

      await new Promise((resolve) => setTimeout(resolve, 300))

      const pageEl = (container.querySelector('.page') as HTMLElement) || container
      const pageRect = pageEl.getBoundingClientRect()

      const canvas = await html2canvas(pageEl, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = 210
      const pageHeight = 297
      const margin = 4
      const imgWidth = pageWidth - margin * 2
      const usableHeightMm = pageHeight - margin * 2
      // Canvas px per CSS px, and the page's usable height expressed in canvas px.
      const ratio = canvas.width / pageRect.width
      const usableHeightPx = (usableHeightMm / imgWidth) * canvas.width

      const addSlice = (start: number, end: number, isFirst: boolean) => {
        const h = Math.max(1, Math.round(end - start))
        if (!isFirst) pdf.addPage()
        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = canvas.width
        sliceCanvas.height = h
        const ctx = sliceCanvas.getContext('2d')!
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
        ctx.drawImage(canvas, 0, -start)
        const sliceHeightMm = (sliceCanvas.height / canvas.width) * imgWidth
        pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', margin, margin, imgWidth, sliceHeightMm)
      }

      const slices: Array<{ start: number; end: number }> = []

      if (canvas.height <= usableHeightPx) {
        // Fits on a single page.
        slices.push({ start: 0, end: canvas.height })
      } else {
        // Multi-page: only cut between "blocks" so no element is split across a page.
        // Candidate cut points = the top edge (in canvas px) of each keep-together
        // block, plus the very bottom of the document.
        const blocks = Array.from(
          pageEl.querySelectorAll<HTMLElement>('[data-pdf-block]'),
        )
        const cuts = blocks
          .map((b) => Math.round((b.getBoundingClientRect().top - pageRect.top) * ratio))
          .filter((y) => y > 0)
        cuts.push(canvas.height)
        // Ensure ascending & unique.
        const candidates = Array.from(new Set(cuts)).sort((a, b) => a - b)

        let pageStart = 0
        let prevCut = 0
        for (const c of candidates) {
          if (c - pageStart <= usableHeightPx) {
            prevCut = c
            continue
          }
          // `c` would overflow the current page.
          if (prevCut > pageStart) {
            slices.push({ start: pageStart, end: prevCut })
            pageStart = prevCut
            if (c - pageStart <= usableHeightPx) {
              prevCut = c
              continue
            }
          }
          // A single block is taller than a page — unavoidable hard split.
          let s = pageStart
          while (c - s > usableHeightPx) {
            slices.push({ start: s, end: s + usableHeightPx })
            s += usableHeightPx
          }
          slices.push({ start: s, end: c })
          pageStart = c
          prevCut = c
        }
        if (pageStart < canvas.height) {
          slices.push({ start: pageStart, end: canvas.height })
        }
      }

      slices.forEach((sl, idx) => addSlice(sl.start, sl.end, idx === 0))

      pdf.save(`service-report-${id}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw error
    } finally {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container)
      }
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