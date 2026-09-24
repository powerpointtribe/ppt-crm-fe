import { apiService } from './api'

export enum ServiceType {
  SUNDAY_SERVICE = 'sunday_service',
  BIBLE_STUDY = 'bible_study',
  WORKERS_MEETING = 'workers_meeting',
  SPECIAL_EVENT = 'special_event',
  SUNDAY_FIRST_SERVICE = 'sunday_first_service',
  SUNDAY_SECOND_SERVICE = 'sunday_second_service',
  MIDWEEK_SERVICE = 'midweek_service',
  FRIDAY_VIGIL = 'friday_vigil',
  SPECIAL_SERVICE = 'special_service',
  YOUTH_SERVICE = 'youth_service',
  CHILDREN_SERVICE = 'children_service',
  OTHER = 'other',
}

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  [ServiceType.SUNDAY_SERVICE]: 'Sunday Service',
  [ServiceType.BIBLE_STUDY]: 'Bible Study',
  [ServiceType.WORKERS_MEETING]: 'Workers Meeting',
  [ServiceType.SPECIAL_EVENT]: 'Special Event',
  [ServiceType.OTHER]: 'Others',
  [ServiceType.SUNDAY_FIRST_SERVICE]: 'Sunday 1st Service',
  [ServiceType.SUNDAY_SECOND_SERVICE]: 'Sunday 2nd Service',
  [ServiceType.MIDWEEK_SERVICE]: 'Midweek Service',
  [ServiceType.FRIDAY_VIGIL]: 'Friday Vigil',
  [ServiceType.SPECIAL_SERVICE]: 'Special Service',
  [ServiceType.YOUTH_SERVICE]: 'Youth Service',
  [ServiceType.CHILDREN_SERVICE]: 'Children Service',
}

export const CREATE_SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: ServiceType.SUNDAY_SERVICE, label: 'Sunday Service' },
  { value: ServiceType.BIBLE_STUDY, label: 'Bible Study' },
  { value: ServiceType.WORKERS_MEETING, label: 'Workers Meeting' },
  { value: ServiceType.SPECIAL_EVENT, label: 'Special Event' },
  { value: ServiceType.OTHER, label: 'Others' },
]

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

  async getServiceSessions(params?: {
    branch?: string
    limit?: number
    page?: number
  }): Promise<{
    data: {
      serviceDate: string
      serviceType: ServiceType
      serviceTitle: string | null
      totalCheckedIn: number
      totalPresent: number
      totalLate: number
      totalAbsent: number
      total: number
      lastCheckIn: string | null
    }[]
    total: number
    page: number
    limit: number
  }> {
    const response = await apiService.get<any>('/service-attendance/sessions', { params })
    return response as any
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

  async getGroupMeetingOverview(branch?: string): Promise<{
    groups: {
      _id: string
      name: string
      type: string
      memberCount: number
      leader: string | null
      totalMeetings: number
      lastMeetingDate: string | null
      avgAttendanceRate: number
    }[]
    uniqueMemberCount: number
  }> {
    const params: Record<string, string> = {}
    if (branch) params.branch = branch
    const response = await apiService.get<any>('/service-attendance/group-meeting/overview', {
      params: Object.keys(params).length ? params : undefined,
    })
    return (response as any).data
  }

  async recordGroupMeeting(data: {
    groupId: string
    meetingDate: string
    presentMemberIds: string[]
    notes?: string
  }): Promise<{ present: number; absent: number; skipped: number }> {
    const response = await apiService.post<{
      data: { present: number; absent: number; skipped: number }
    }>('/service-attendance/group-meeting', data)
    return (response as any).data
  }

  async getGroupMeetingHistory(
    groupId: string,
    limit = 10,
  ): Promise<{ date: string; present: number; absent: number; total: number; rate: number }[]> {
    const response = await apiService.get<{
      data: { date: string; present: number; absent: number; total: number; rate: number }[]
    }>(`/service-attendance/group-meeting/${groupId}/history`, {
      params: { limit: String(limit) },
    })
    return (response as any).data
  }

  async publicVerifyLeader(email: string, password: string): Promise<{
    leader: { _id: string; firstName: string; lastName: string }
    groups: {
      _id: string
      name: string
      type: string
      members: { _id: string; firstName: string; lastName: string }[]
    }[]
  }> {
    const response = await apiService.post<any>(
      '/service-attendance/public/verify-leader',
      { email, password },
    )
    return (response as any).data
  }

  async publicRecordGroupMeeting(data: {
    email: string
    password: string
    groupId: string
    meetingDate: string
    presentMemberIds: string[]
    notes?: string
  }): Promise<{ present: number; absent: number; skipped: number }> {
    const response = await apiService.post<any>(
      '/service-attendance/public/group-meeting',
      data,
    )
    return (response as any).data
  }

  async deleteRecord(id: string): Promise<void> {
    await apiService.delete(`/service-attendance/${id}`)
  }
}

export const serviceAttendanceService = new ServiceAttendanceService()
