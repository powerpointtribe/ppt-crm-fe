import { apiService } from './api'
import { ApiResponse } from '@/types/api'
import {
  transformPaginatedResponse,
  transformSingleResponse,
} from '@/utils/apiResponseTransform'
import {
  Event,
  EventRegistration,
  EventStats,
  CreateEventData,
  UpdateEventData,
  EventSearchParams,
  RegistrationSearchParams,
  CreateRegistrationData,
  PublicRegistrationData,
  AddCommitteeMemberData,
  PaginatedResponse,
  EventSession,
  SessionAttendance,
  CreateSessionData,
  UpdateSessionData,
  SessionSearchParams,
  RecordAttendanceData,
  RecordAssessmentData,
  EventOverviewStats,
  FullEventAnalytics,
  RegistrationAnalytics,
  SessionAnalytics,
  RegistrationFunnel,
  CheckInAnalytics,
  EventCommitteeAnalytics,
  TrainingCompletionSummary,
  AttendeeProgress,
  AttendanceTrend,
  MemberEngagementAnalytics,
  EventsDashboardAnalytics,
  ParticipantAccountabilitySummary,
  TrainingAccountabilityReport,
  EventAnalyticsQueryParams,
  TrendAnalyticsQueryParams,
  ParticipantAccountabilityQueryParams,
} from '@/types/event'

export const eventsService = {
  // ========== EVENT CRUD ==========

  getEvents: async (
    params?: EventSearchParams
  ): Promise<PaginatedResponse<Event>> => {
    const response = await apiService.get<ApiResponse<any>>('/events', {
      params,
    })
    return transformPaginatedResponse<Event>(response)
  },

  getEventById: async (id: string): Promise<Event> => {
    const response = await apiService.get<ApiResponse<Event>>(`/events/${id}`)
    return transformSingleResponse<Event>(response) as Event
  },

  getEventStats: async (id: string): Promise<EventStats> => {
    const response = await apiService.get<ApiResponse<EventStats>>(
      `/events/${id}/stats`
    )
    return transformSingleResponse<EventStats>(response) as EventStats
  },

  createEvent: async (data: CreateEventData): Promise<Event> => {
    const response = await apiService.post<ApiResponse<Event>>('/events', data)
    return transformSingleResponse<Event>(response) as Event
  },

  updateEvent: async (id: string, data: UpdateEventData): Promise<Event> => {
    const response = await apiService.patch<ApiResponse<Event>>(
      `/events/${id}`,
      data
    )
    return transformSingleResponse<Event>(response) as Event
  },

  deleteEvent: async (id: string): Promise<void> => {
    await apiService.delete(`/events/${id}`)
  },

  // ========== COMMITTEE MANAGEMENT ==========

  addCommitteeMember: async (
    eventId: string,
    data: AddCommitteeMemberData
  ): Promise<Event> => {
    const response = await apiService.post<ApiResponse<Event>>(
      `/events/${eventId}/committee`,
      data
    )
    return transformSingleResponse<Event>(response) as Event
  },

  updateCommitteeMemberRole: async (
    eventId: string,
    memberId: string,
    role: string
  ): Promise<Event> => {
    const response = await apiService.patch<ApiResponse<Event>>(
      `/events/${eventId}/committee/${memberId}`,
      { role }
    )
    return transformSingleResponse<Event>(response) as Event
  },

  removeCommitteeMember: async (
    eventId: string,
    memberId: string
  ): Promise<Event> => {
    const response = await apiService.delete<ApiResponse<Event>>(
      `/events/${eventId}/committee/${memberId}`
    )
    return transformSingleResponse<Event>(response) as Event
  },

  // ========== REGISTRATION MANAGEMENT ==========

  getRegistrations: async (
    eventId: string,
    params?: RegistrationSearchParams
  ): Promise<PaginatedResponse<EventRegistration>> => {
    const response = await apiService.get<ApiResponse<any>>(
      `/events/${eventId}/registrations`,
      { params }
    )
    return transformPaginatedResponse<EventRegistration>(response)
  },

  createRegistration: async (
    eventId: string,
    data: CreateRegistrationData
  ): Promise<EventRegistration> => {
    const response = await apiService.post<ApiResponse<EventRegistration>>(
      `/events/${eventId}/registrations`,
      data
    )
    return transformSingleResponse<EventRegistration>(
      response
    ) as EventRegistration
  },

  updateRegistrationStatus: async (
    eventId: string,
    registrationId: string,
    status: string,
    notes?: string
  ): Promise<EventRegistration> => {
    const response = await apiService.patch<ApiResponse<EventRegistration>>(
      `/events/${eventId}/registrations/${registrationId}`,
      { status, notes }
    )
    return transformSingleResponse<EventRegistration>(
      response
    ) as EventRegistration
  },

  checkInAttendee: async (
    eventId: string,
    registrationId: string
  ): Promise<EventRegistration> => {
    const response = await apiService.patch<ApiResponse<EventRegistration>>(
      `/events/${eventId}/registrations/${registrationId}/check-in`,
      {}
    )
    return transformSingleResponse<EventRegistration>(
      response
    ) as EventRegistration
  },

  checkInByCode: async (
    eventId: string,
    checkInCode: string
  ): Promise<EventRegistration> => {
    const response = await apiService.patch<ApiResponse<EventRegistration>>(
      `/events/${eventId}/check-in-by-code`,
      { checkInCode }
    )
    return transformSingleResponse<EventRegistration>(
      response
    ) as EventRegistration
  },

  // ========== PUBLIC ENDPOINTS ==========

  getPublicEvent: async (slug: string): Promise<Event> => {
    const response = await apiService.get<ApiResponse<Event>>(
      `/events/public/${slug}`
    )
    return transformSingleResponse<Event>(response) as Event
  },

  publicRegister: async (
    slug: string,
    data: PublicRegistrationData
  ): Promise<{
    success: boolean
    message: string
    registration: {
      _id: string
      status: string
      checkInCode: string
      attendeeInfo: { firstName: string; lastName: string }
    }
  }> => {
    const response = await apiService.post<any>(
      `/events/public/${slug}/register`,
      data
    )
    return transformSingleResponse<any>(response)
  },

  // ========== SESSION MANAGEMENT ==========

  createSession: async (
    eventId: string,
    data: CreateSessionData
  ): Promise<EventSession> => {
    const response = await apiService.post<ApiResponse<EventSession>>(
      `/events/${eventId}/sessions`,
      data
    )
    return transformSingleResponse<EventSession>(response) as EventSession
  },

  getSessions: async (
    eventId: string,
    params?: SessionSearchParams
  ): Promise<PaginatedResponse<EventSession>> => {
    const response = await apiService.get<ApiResponse<any>>(
      `/events/${eventId}/sessions`,
      { params }
    )
    return transformPaginatedResponse<EventSession>(response)
  },

  getSessionById: async (sessionId: string): Promise<EventSession> => {
    const response = await apiService.get<ApiResponse<EventSession>>(
      `/events/sessions/${sessionId}`
    )
    return transformSingleResponse<EventSession>(response) as EventSession
  },

  updateSession: async (
    sessionId: string,
    data: UpdateSessionData
  ): Promise<EventSession> => {
    const response = await apiService.patch<ApiResponse<EventSession>>(
      `/events/sessions/${sessionId}`,
      data
    )
    return transformSingleResponse<EventSession>(response) as EventSession
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    await apiService.delete(`/events/sessions/${sessionId}`)
  },

  // ========== SESSION ATTENDANCE ==========

  recordSessionAttendance: async (
    sessionId: string,
    data: RecordAttendanceData
  ): Promise<SessionAttendance> => {
    const response = await apiService.post<ApiResponse<SessionAttendance>>(
      `/events/sessions/${sessionId}/attendance`,
      data
    )
    return transformSingleResponse<SessionAttendance>(response) as SessionAttendance
  },

  recordBulkAttendance: async (
    sessionId: string,
    attendances: RecordAttendanceData[]
  ): Promise<SessionAttendance[]> => {
    const response = await apiService.post<ApiResponse<SessionAttendance[]>>(
      `/events/sessions/${sessionId}/attendance/bulk`,
      { attendances }
    )
    return transformSingleResponse<SessionAttendance[]>(response) as SessionAttendance[]
  },

  recordAssessmentResult: async (
    sessionId: string,
    data: RecordAssessmentData
  ): Promise<SessionAttendance> => {
    const response = await apiService.post<ApiResponse<SessionAttendance>>(
      `/events/sessions/${sessionId}/assessment`,
      data
    )
    return transformSingleResponse<SessionAttendance>(response) as SessionAttendance
  },

  getSessionAttendance: async (sessionId: string): Promise<SessionAttendance[]> => {
    const response = await apiService.get<ApiResponse<SessionAttendance[]>>(
      `/events/sessions/${sessionId}/attendance`
    )
    return transformSingleResponse<SessionAttendance[]>(response) as SessionAttendance[]
  },

  // ========== ANALYTICS ==========

  // Overview analytics (branch level)
  getOverviewStats: async (
    params?: EventAnalyticsQueryParams
  ): Promise<EventOverviewStats> => {
    const response = await apiService.get<ApiResponse<EventOverviewStats>>(
      '/events/analytics/overview',
      { params }
    )
    return transformSingleResponse<EventOverviewStats>(response) as EventOverviewStats
  },

  // Attendance trends (branch level)
  getAttendanceTrends: async (
    params?: TrendAnalyticsQueryParams
  ): Promise<AttendanceTrend> => {
    const response = await apiService.get<ApiResponse<AttendanceTrend>>(
      '/events/analytics/trends',
      { params }
    )
    return transformSingleResponse<AttendanceTrend>(response) as AttendanceTrend
  },

  // Member engagement analytics (branch level)
  getMemberEngagement: async (
    params?: EventAnalyticsQueryParams
  ): Promise<MemberEngagementAnalytics> => {
    const response = await apiService.get<ApiResponse<MemberEngagementAnalytics>>(
      '/events/analytics/engagement',
      { params }
    )
    return transformSingleResponse<MemberEngagementAnalytics>(response) as MemberEngagementAnalytics
  },

  // Dashboard analytics (branch level)
  getDashboardAnalytics: async (
    params?: EventAnalyticsQueryParams
  ): Promise<EventsDashboardAnalytics> => {
    const response = await apiService.get<ApiResponse<EventsDashboardAnalytics>>(
      '/events/analytics/dashboard',
      { params }
    )
    return transformSingleResponse<EventsDashboardAnalytics>(response) as EventsDashboardAnalytics
  },

  // Full event analytics
  getEventAnalytics: async (eventId: string): Promise<FullEventAnalytics> => {
    const response = await apiService.get<ApiResponse<FullEventAnalytics>>(
      `/events/${eventId}/analytics`
    )
    return transformSingleResponse<FullEventAnalytics>(response) as FullEventAnalytics
  },

  // Registration analytics for an event
  getRegistrationAnalytics: async (eventId: string): Promise<RegistrationAnalytics> => {
    const response = await apiService.get<ApiResponse<RegistrationAnalytics>>(
      `/events/${eventId}/analytics/registrations`
    )
    return transformSingleResponse<RegistrationAnalytics>(response) as RegistrationAnalytics
  },

  // Session analytics for an event
  getSessionAnalytics: async (eventId: string): Promise<SessionAnalytics> => {
    const response = await apiService.get<ApiResponse<SessionAnalytics>>(
      `/events/${eventId}/analytics/sessions`
    )
    return transformSingleResponse<SessionAnalytics>(response) as SessionAnalytics
  },

  // Registration funnel for an event
  getRegistrationFunnel: async (eventId: string): Promise<RegistrationFunnel> => {
    const response = await apiService.get<ApiResponse<RegistrationFunnel>>(
      `/events/${eventId}/analytics/funnel`
    )
    return transformSingleResponse<RegistrationFunnel>(response) as RegistrationFunnel
  },

  // Check-in analytics for an event
  getCheckInAnalytics: async (eventId: string): Promise<CheckInAnalytics> => {
    const response = await apiService.get<ApiResponse<CheckInAnalytics>>(
      `/events/${eventId}/analytics/check-in`
    )
    return transformSingleResponse<CheckInAnalytics>(response) as CheckInAnalytics
  },

  // Committee analytics for an event
  getCommitteeAnalytics: async (eventId: string): Promise<EventCommitteeAnalytics> => {
    const response = await apiService.get<ApiResponse<EventCommitteeAnalytics>>(
      `/events/${eventId}/analytics/committee`
    )
    return transformSingleResponse<EventCommitteeAnalytics>(response) as EventCommitteeAnalytics
  },

  // Training completion summary for an event
  getTrainingCompletionSummary: async (eventId: string): Promise<TrainingCompletionSummary> => {
    const response = await apiService.get<ApiResponse<TrainingCompletionSummary>>(
      `/events/${eventId}/analytics/training`
    )
    return transformSingleResponse<TrainingCompletionSummary>(response) as TrainingCompletionSummary
  },

  // Attendee progress for an event
  getAttendeeProgress: async (eventId: string): Promise<AttendeeProgress[]> => {
    const response = await apiService.get<ApiResponse<AttendeeProgress[]>>(
      `/events/${eventId}/analytics/attendee-progress`
    )
    return transformSingleResponse<AttendeeProgress[]>(response) as AttendeeProgress[]
  },

  // ========== PARTICIPANT ACCOUNTABILITY ==========

  // Get participant accountability summary for an event
  getParticipantAccountability: async (
    eventId: string,
    params?: ParticipantAccountabilityQueryParams
  ): Promise<ParticipantAccountabilitySummary> => {
    const response = await apiService.get<ApiResponse<ParticipantAccountabilitySummary>>(
      `/events/${eventId}/accountability`,
      { params }
    )
    return transformSingleResponse<ParticipantAccountabilitySummary>(response) as ParticipantAccountabilitySummary
  },

  // Get training accountability report for an event
  getTrainingAccountabilityReport: async (
    eventId: string,
    params?: ParticipantAccountabilityQueryParams
  ): Promise<TrainingAccountabilityReport> => {
    const response = await apiService.get<ApiResponse<TrainingAccountabilityReport>>(
      `/events/${eventId}/accountability/report`,
      { params }
    )
    return transformSingleResponse<TrainingAccountabilityReport>(response) as TrainingAccountabilityReport
  },
}

export type {
  Event,
  EventRegistration,
  EventStats,
  EventSession,
  SessionAttendance,
  EventOverviewStats,
  FullEventAnalytics,
  RegistrationAnalytics,
  SessionAnalytics,
  RegistrationFunnel,
  CheckInAnalytics,
  EventCommitteeAnalytics,
  TrainingCompletionSummary,
  AttendeeProgress,
  AttendanceTrend,
  MemberEngagementAnalytics,
  EventsDashboardAnalytics,
  ParticipantAccountabilitySummary,
  TrainingAccountabilityReport,
}
