import { Member } from './index'
import {
  EnhancedCustomField,
  EnhancedRegistrationSettings,
  FormSection,
  FormHeader,
  SuccessMessage,
  TermsAndConditions,
  FieldValidation,
  ConditionalLogic,
  ConditionalRule,
  CustomFieldType,
  FormLayout,
  FormStatus,
} from './registration-form'

// Re-export registration form types for convenience
export type {
  EnhancedCustomField,
  EnhancedRegistrationSettings,
  FormSection,
  FormHeader,
  SuccessMessage,
  TermsAndConditions,
  FieldValidation,
  ConditionalLogic,
  ConditionalRule,
  CustomFieldType,
  FormLayout,
  FormStatus,
}

// Event types
export type EventType =
  | 'conference'
  | 'workshop'
  | 'seminar'
  | 'retreat'
  | 'service'
  | 'outreach'
  | 'meeting'
  | 'celebration'
  | 'training'
  | 'other'

// Event status
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'

// Registration status
export type RegistrationStatus =
  | 'pending'
  | 'confirmed'
  | 'waitlisted'
  | 'cancelled'
  | 'attended'
  | 'no-show'

// Attendee type
export type AttendeeType = 'member' | 'visitor'

// Event location
export interface EventLocation {
  name: string
  address?: string
  city?: string
  state?: string
  isVirtual: boolean
  virtualLink?: string
}

// Custom field for registration (legacy - kept for backwards compatibility)
export interface CustomField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'email' | 'phone' | 'number' | 'date' | 'time' | 'rating' | 'multi-checkbox'
  required: boolean
  options?: string[]
  placeholder?: string
  helpText?: string
  description?: string
  sectionId?: string
  order: number
  validation?: FieldValidation
  conditionalLogic?: ConditionalLogic
}

// Registration settings (enhanced with new fields)
export interface RegistrationSettings {
  isOpen: boolean
  maxAttendees?: number
  deadline?: string
  requireApproval: boolean
  allowWaitlist: boolean
  customFields: CustomField[]
  formLayout?: FormLayout
  formSections?: FormSection[]
  qrCodeEnabled?: boolean
  formHeader?: FormHeader
  successMessage?: SuccessMessage
  termsAndConditions?: TermsAndConditions
  formStatus?: FormStatus
}

// Committee member
export interface CommitteeMember {
  member: string | Member
  role: string
  assignedAt: string
}

// Main Event interface
export interface Event {
  _id: string
  title: string
  description?: string
  type: EventType
  status: EventStatus
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  location: EventLocation
  registrationSettings: RegistrationSettings
  registrationSlug?: string
  committee: CommitteeMember[]
  organizer?: string | Member
  branch: {
    _id: string
    name: string
  } | string
  bannerImage?: string
  contactEmail?: string
  contactPhone?: string
  websiteUrl?: string
  tags: string[]
  registrationCount: number
  confirmedCount: number
  attendedCount: number
  createdAt: string
  updatedAt: string
}

// Attendee info for registration
export interface AttendeeInfo {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  gender?: 'male' | 'female'
}

// Event registration
export interface EventRegistration {
  _id: string
  event: string | Event
  branch: string | { _id: string; name: string }
  member?: string | Member
  attendeeType: AttendeeType
  attendeeInfo: AttendeeInfo
  status: RegistrationStatus
  customFieldResponses: Record<string, string>
  checkInCode?: string
  registeredAt: string
  confirmedAt?: string
  checkedInAt?: string
  cancelledAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// Event statistics
export interface EventStats {
  totalRegistrations: number
  byStatus: {
    pending: number
    confirmed: number
    waitlisted: number
    attended: number
    cancelled: number
    noShow: number
  }
  byType: {
    members: number
    visitors: number
  }
  capacity: {
    max: number | null
    current: number
    available: number | null
  }
}

// DTOs for creating/updating events
export interface CreateEventData {
  title: string
  description?: string
  type: EventType
  status?: EventStatus
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  location: EventLocation
  registrationSettings?: Partial<RegistrationSettings>
  registrationSlug?: string
  committee?: { member: string; role: string }[]
  organizer?: string
  branch: string
  bannerImage?: string
  contactEmail?: string
  contactPhone?: string
  websiteUrl?: string
  tags?: string[]
}

export interface UpdateEventData extends Partial<CreateEventData> {}

// Search params for events
export interface EventSearchParams {
  page?: number
  limit?: number
  search?: string
  type?: EventType
  status?: EventStatus
  branchId?: string
  organizerId?: string
  startDateFrom?: string
  startDateTo?: string
  tag?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Registration search params
export interface RegistrationSearchParams {
  page?: number
  limit?: number
  search?: string
  status?: RegistrationStatus
  attendeeType?: AttendeeType
}

// Create registration data
export interface CreateRegistrationData {
  memberId?: string
  attendeeType: AttendeeType
  attendeeInfo: AttendeeInfo
  status?: RegistrationStatus
  customFieldResponses?: Record<string, string>
  notes?: string
}

// Public registration data
export interface PublicRegistrationData {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  gender?: 'male' | 'female'
  customFieldResponses?: Record<string, string>
}

// Committee member DTO
export interface AddCommitteeMemberData {
  memberId: string
  role: string
}

// Paginated response
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

// ========== SESSION TYPES ==========

export type SessionType = 'lecture' | 'workshop' | 'practical' | 'assessment' | 'discussion' | 'break' | 'other'
export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type SessionAttendanceStatus = 'present' | 'late' | 'absent' | 'excused'

export interface LearningObjective {
  id: string
  description: string
  required: boolean
}

export interface SessionResource {
  id: string
  title: string
  type: 'document' | 'video' | 'link' | 'presentation'
  url: string
  description?: string
}

export interface SessionFacilitator {
  member: string | Member
  role: 'lead' | 'assistant' | 'guest'
}

export interface SessionAssessmentConfig {
  hasAssessment: boolean
  assessmentType?: 'quiz' | 'assignment' | 'practical' | 'presentation'
  passingScore?: number
  maxScore?: number
  required?: boolean
}

export interface SessionAttendanceConfig {
  isRequired: boolean
  allowLateArrival: boolean
  lateArrivalThresholdMinutes: number
}

export interface EventSession {
  _id: string
  event: string | Event
  branch: string | { _id: string; name: string }
  title: string
  description?: string
  sessionType: SessionType
  status: SessionStatus
  order: number
  date: string
  startTime: string
  endTime: string
  durationMinutes: number
  location?: {
    name: string
    isVirtual: boolean
    virtualLink?: string
  }
  facilitators: SessionFacilitator[]
  learningObjectives: LearningObjective[]
  resources: SessionResource[]
  assessment?: SessionAssessmentConfig
  attendanceConfig?: SessionAttendanceConfig
  attendanceCount: number
  lateCount: number
  absentCount: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface SessionAttendance {
  _id: string
  event: string
  session: string | EventSession
  registration: string | EventRegistration
  branch: string
  member?: string | Member
  status: SessionAttendanceStatus
  checkInTime?: string
  checkOutTime?: string
  lateByMinutes?: number
  objectivesCompletion?: {
    objectiveId: string
    completed: boolean
    notes?: string
  }[]
  assessmentResult?: {
    score: number
    maxScore: number
    percentage: number
    passed: boolean
    attemptNumber: number
    submittedAt: string
    feedback?: string
  }
  facilitatorNotes?: string
  recordedAt: string
  createdAt: string
  updatedAt: string
}

// Session DTOs
export interface CreateSessionData {
  event?: string
  title: string
  description?: string
  sessionType: SessionType
  order?: number
  date: string
  startTime: string
  endTime: string
  durationMinutes?: number
  location?: {
    name: string
    isVirtual: boolean
    virtualLink?: string
  }
  facilitators?: { member: string; role: 'lead' | 'assistant' | 'guest' }[]
  learningObjectives?: { id?: string; description: string; required: boolean }[]
  resources?: Omit<SessionResource, 'id'>[]
  assessment?: SessionAssessmentConfig
  attendanceConfig?: SessionAttendanceConfig
  notes?: string
}

export interface UpdateSessionData extends Partial<CreateSessionData> {
  status?: SessionStatus
}

export interface SessionSearchParams {
  page?: number
  limit?: number
  sessionType?: SessionType
  status?: SessionStatus
  dateFrom?: string
  dateTo?: string
  facilitator?: string
}

export interface RecordAttendanceData {
  registrationId: string
  status: SessionAttendanceStatus
  checkInTime?: string
  checkOutTime?: string
  lateByMinutes?: number
  facilitatorNotes?: string
}

export interface RecordAssessmentData {
  registrationId: string
  score: number
  maxScore: number
  attemptNumber?: number
  feedback?: string
}

// ========== ANALYTICS TYPES ==========

// Overview analytics
export interface EventOverviewStats {
  totalEvents: number
  publishedEvents: number
  completedEvents: number
  upcomingEvents: number
  totalRegistrations: number
  totalAttendees: number
  averageAttendanceRate: number
  totalTrainingEvents: number
  totalCertificationsIssued: number
}

// Registration analytics
export interface RegistrationAnalytics {
  totalRegistrations: number
  confirmedRegistrations: number
  pendingRegistrations: number
  cancelledRegistrations: number
  waitlistedRegistrations: number
  attendedRegistrations: number
  noShowRegistrations: number
  memberRegistrations: number
  visitorRegistrations: number
  conversionRate: number
  registrationsByDay: { date: string; count: number }[]
  registrationsBySource: { source: string; count: number }[]
}

// Session analytics
export interface SessionAnalytics {
  totalSessions: number
  completedSessions: number
  upcomingSessions: number
  averageAttendancePerSession: number
  averageLateArrivalPercentage: number
  attendanceBySession: {
    sessionId: string
    sessionTitle: string
    date: string
    present: number
    late: number
    absent: number
    excused: number
    attendanceRate: number
  }[]
  assessmentResults: {
    sessionId: string
    sessionTitle: string
    averageScore: number
    passRate: number
    totalAttempts: number
  }[]
}

// Attendee progress
export interface AttendeeProgress {
  registrationId: string
  attendeeName: string
  attendeeEmail: string
  attendeeType: string
  memberId?: string
  totalSessionsAttended: number
  totalSessionsRequired: number
  attendancePercentage: number
  averageAssessmentScore: number
  assessmentsPassed: number
  assessmentsFailed: number
  objectivesCompleted: number
  totalObjectives: number
  overallProgress: number
  isCompleted: boolean
  isCertified: boolean
  certificationDate?: string
  sessionDetails: {
    sessionId: string
    sessionTitle: string
    date: string
    status: string
    assessmentScore?: number
    assessmentPassed?: boolean
  }[]
}

// Training completion summary
export interface TrainingCompletionSummary {
  totalEnrolled: number
  totalCompleted: number
  totalCertified: number
  totalInProgress: number
  totalDropped: number
  completionRate: number
  certificationRate: number
  averageCompletionTime: number
  completionByRequirement: {
    requirementType: string
    description: string
    completedCount: number
    totalRequired: number
    completionRate: number
  }[]
}

// Full event analytics
export interface FullEventAnalytics {
  eventId: string
  eventTitle: string
  eventType: string
  status: string
  registrations: RegistrationAnalytics
  sessions?: SessionAnalytics
  completion?: TrainingCompletionSummary
  attendeeProgress?: AttendeeProgress[]
}

// Attendance trends
export interface AttendanceTrend {
  period: 'daily' | 'weekly' | 'monthly'
  trends: {
    date: string
    registrations: number
    attendees: number
    noShows: number
    attendanceRate: number
  }[]
  averageAttendanceRate: number
  peakAttendanceDate: string
  peakAttendanceCount: number
  lowestAttendanceDate: string
  lowestAttendanceCount: number
  growthRate: number
}

// Registration funnel
export interface RegistrationFunnel {
  eventId: string
  stages: {
    stage: string
    count: number
    percentage: number
    dropOffRate: number
  }[]
  overallConversionRate: number
  averageTimeToConfirmation: number
  averageTimeToCheckIn: number
  peakRegistrationHour: number
  peakRegistrationDay: string
}

// Check-in analytics
export interface CheckInAnalytics {
  totalCheckIns: number
  checkInsByMethod: { method: string; count: number }[]
  averageCheckInTime: string
  peakCheckInHour: number
  checkInTimeline: { time: string; count: number }[]
  earlyCheckIns: number
  onTimeCheckIns: number
  lateCheckIns: number
  checkedInByCommittee: { memberId: string; memberName: string; count: number }[]
}

// Committee analytics
export interface CommitteeMemberPerformance {
  memberId: string
  memberName: string
  role: string
  assignedAt: string
  eventsAssigned: number
  tasksCompleted: number
  tasksTotal: number
  checkInsPerformed: number
  registrationsProcessed: number
  lastActivityDate?: string
  performanceScore: number
}

export interface EventCommitteeAnalytics {
  totalCommitteeMembers: number
  rolesDistribution: { role: string; count: number }[]
  totalCheckInsPerformed: number
  totalRegistrationsProcessed: number
  memberPerformance: CommitteeMemberPerformance[]
}

// Member engagement analytics
export interface MemberEngagementAnalytics {
  totalUniqueAttendees: number
  repeatAttendees: number
  firstTimeAttendees: number
  repeatAttendeeRate: number
  topAttendees: {
    memberId: string
    memberName: string
    eventsAttended: number
    totalSessions: number
    averageAttendanceRate: number
  }[]
  attendeesByEventType: {
    eventType: string
    uniqueAttendees: number
    totalAttendances: number
  }[]
  engagementTrend: {
    month: string
    uniqueAttendees: number
    totalAttendances: number
    newAttendees: number
  }[]
}

// Dashboard analytics
export interface EventsDashboardAnalytics {
  overview: EventOverviewStats
  attendanceTrends: AttendanceTrend
  memberEngagement: MemberEngagementAnalytics
  upcomingEvents: {
    eventId: string
    title: string
    startDate: string
    registrationCount: number
    capacity?: number
    capacityPercentage?: number
  }[]
  recentActivity: {
    timestamp: string
    action: string
    description: string
    user?: string
  }[]
  eventsByMonth: {
    month: string
    total: number
    completed: number
    cancelled: number
  }[]
}

// ========== PARTICIPANT ACCOUNTABILITY TYPES ==========

export type AttendanceStatusCategory = 'excellent' | 'good' | 'needs_improvement' | 'at_risk' | 'failed'
export type CertificationStatusCategory = 'not_started' | 'in_progress' | 'completed' | 'certified' | 'failed'
export type AssessmentStatusCategory = 'passing' | 'failing' | 'incomplete'

export interface ParticipantAccountability {
  registrationId: string
  participantId?: string
  participantName: string
  participantEmail: string
  participantPhone?: string
  participantType: string
  registrationDate: string
  registrationStatus: string
  totalSessionsRequired: number
  sessionsAttended: number
  sessionsAbsent: number
  sessionsExcused: number
  lateArrivals: number
  attendancePercentage: number
  attendanceStatus: AttendanceStatusCategory
  totalAssessments: number
  assessmentsCompleted: number
  assessmentsPassed: number
  assessmentsFailed: number
  averageAssessmentScore: number
  assessmentStatus: AssessmentStatusCategory
  completionPercentage: number
  isEligibleForCertification: boolean
  certificationStatus: CertificationStatusCategory
  certificationDate?: string
  certificateNumber?: string
  sessionRecords: {
    sessionId: string
    sessionTitle: string
    sessionDate: string
    attendanceStatus: string
    checkInTime?: string
    checkOutTime?: string
    lateByMinutes?: number
    assessmentScore?: number
    assessmentPassed?: boolean
    facilitatorNotes?: string
  }[]
  requiresFollowUp: boolean
  followUpReason?: string
  lastActivityDate?: string
  daysInactive?: number
}

export interface ParticipantAccountabilitySummary {
  eventId: string
  eventTitle: string
  totalParticipants: number
  activeParticipants: number
  inactiveParticipants: number
  droppedParticipants: number
  averageAttendanceRate: number
  excellentAttendance: number
  goodAttendance: number
  needsImprovement: number
  atRisk: number
  failed: number
  averageAssessmentScore: number
  passingParticipants: number
  failingParticipants: number
  incompleteAssessments: number
  eligibleForCertification: number
  certified: number
  pendingCertification: number
  certificationRate: number
  alerts: {
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    count: number
    participants: { id: string; name: string }[]
  }[]
  participants: ParticipantAccountability[]
}

export interface TrainingAccountabilityReport {
  eventId: string
  eventTitle: string
  reportGeneratedAt: string
  reportGeneratedBy?: string
  totalEnrolled: number
  totalActive: number
  totalCompleted: number
  totalDropped: number
  completionRate: number
  averageProgress: number
  sessionBreakdown: {
    sessionId: string
    sessionTitle: string
    sessionDate: string
    expectedAttendees: number
    actualAttendees: number
    attendanceRate: number
    lateArrivals: number
    absences: number
    excused: number
    assessmentAverage?: number
    assessmentPassRate?: number
  }[]
  participantStatusBreakdown: {
    status: string
    count: number
    percentage: number
    participants: {
      id: string
      name: string
      email: string
      progress: number
    }[]
  }[]
  atRiskParticipants: {
    registrationId: string
    participantName: string
    participantEmail: string
    riskLevel: 'medium' | 'high' | 'critical'
    riskFactors: string[]
    currentProgress: number
    missedSessions: number
    failedAssessments: number
    recommendedAction: string
  }[]
  topPerformers: {
    registrationId: string
    participantName: string
    attendanceRate: number
    assessmentAverage: number
    overallScore: number
  }[]
}

// Query params
export interface EventAnalyticsQueryParams {
  startDate?: string
  endDate?: string
  eventType?: EventType
}

export interface TrendAnalyticsQueryParams {
  startDate?: string
  endDate?: string
  period?: 'daily' | 'weekly' | 'monthly'
  eventType?: EventType
  branchId?: string
}

export interface ParticipantAccountabilityQueryParams {
  attendanceStatus?: AttendanceStatusCategory
  certificationStatus?: CertificationStatusCategory
  requiresFollowUp?: boolean
  search?: string
  sortBy?: 'name' | 'attendance' | 'progress' | 'score' | 'lastActivity'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}
