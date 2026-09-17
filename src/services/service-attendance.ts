import { apiService } from './api'

export enum ServiceType {
  SUNDAY_FIRST_SERVICE = 'sunday_first_service',
  SUNDAY_SECOND_SERVICE = 'sunday_second_service',
  MIDWEEK_SERVICE = 'midweek_service',
  FRIDAY_VIGIL = 'friday_vigil',
  SPECIAL_SERVICE = 'special_service',
  YOUTH_SERVICE = 'youth_service',
  CHILDREN_SERVICE = 'children_service',
  OTHER = 'other',
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  [ServiceType.SUNDAY_FIRST_SERVICE]: 'Sunday 1st Service',
  [ServiceType.SUNDAY_SECOND_SERVICE]: 'Sunday 2nd Service',
  [ServiceType.MIDWEEK_SERVICE]: 'Midweek Service',
  [ServiceType.FRIDAY_VIGIL]: 'Friday Vigil',
  [ServiceType.SPECIAL_SERVICE]: 'Special Service',
  [ServiceType.YOUTH_SERVICE]: 'Youth Service',
  [ServiceType.CHILDREN_SERVICE]: 'Children Service',
  [ServiceType.OTHER]: 'Other',
}

export interface AttendanceRecord {
  _id: string
  member: {
    _id: string
    firstName: string
    lastName: string
    email?: string
    phone?: string
    profilePicture?: string
  }
  branch: string
  serviceDate: string
  serviceType: ServiceType
  status: 'present' | 'late' | 'absent'
  checkInMethod: 'qr' | 'manual' | 'app' | 'import'
  checkInTime?: string
  checkedInBy?: { _id: string; firstName: string; lastName: string }
  notes?: string
  createdAt: string
}

export interface AttendanceStats {
  totalRecords: number
  uniqueMembers: number
  byServiceType: { _id: string; count: number }[]
  byStatus: { _id: string; count: number }[]
}

export interface BulkCheckInResult {
  created: number
  skipped: number
}

export interface QrCheckInResult {
  member: { firstName: string; lastName: string }
  alreadyCheckedIn: boolean
}

class ServiceAttendanceService {
  async checkIn(data: {
    member: string
    serviceDate: string
    serviceType: ServiceType
    status?: 'present' | 'late'
    checkInMethod?: string
    branch?: string
    notes?: string
  }): Promise<AttendanceRecord> {
    const response = await apiService.post<{ data: AttendanceRecord }>(
      '/service-attendance',
      data,
    )
    return (response as any).data
  }

  async bulkCheckIn(data: {
    memberIds: string[]
    serviceDate: string
    serviceType: ServiceType
    checkInMethod?: string
  }): Promise<BulkCheckInResult> {
    const response = await apiService.post<{ data: BulkCheckInResult }>(
      '/service-attendance/bulk',
      data,
    )
    return (response as any).data
  }

  async qrCheckIn(data: {
    identifier: string
    serviceDate: string
    serviceType: ServiceType
    branch: string
    notes?: string
  }): Promise<QrCheckInResult> {
    const response = await apiService.post<{ data: QrCheckInResult }>(
      '/service-attendance/qr-check-in',
      data,
    )
    return (response as any).data
  }

  async getAttendance(params?: {
    serviceType?: ServiceType
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
  }): Promise<{ data: AttendanceRecord[]; total: number; page: number; limit: number }> {
    const response = await apiService.get<any>('/service-attendance', { params })
    return (response as any)
  }

  async getServiceAttendees(
    date: string,
    serviceType: ServiceType,
    branch?: string,
  ): Promise<AttendanceRecord[]> {
    const params: Record<string, string> = { date, serviceType }
    if (branch) params.branch = branch
    const response = await apiService.get<{ data: AttendanceRecord[] }>(
      '/service-attendance/service',
      { params },
    )
    return (response as any).data
  }

  async getStats(startDate?: string, endDate?: string): Promise<AttendanceStats> {
    const params: Record<string, string> = {}
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    const response = await apiService.get<{ data: AttendanceStats }>(
      '/service-attendance/stats',
      { params: Object.keys(params).length ? params : undefined },
    )
    return (response as any).data
  }

  async markAbsentees(data: {
    serviceDate: string
    serviceType: ServiceType
    branch?: string
  }): Promise<{ marked: number }> {
    const response = await apiService.post<{ data: { marked: number } }>(
      '/service-attendance/mark-absent',
      data,
    )
    return (response as any).data
  }

  async deleteRecord(id: string): Promise<void> {
    await apiService.delete(`/service-attendance/${id}`)
  }
}

export const serviceAttendanceService = new ServiceAttendanceService()
