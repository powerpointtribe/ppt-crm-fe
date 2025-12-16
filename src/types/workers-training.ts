export enum WorkersTrainingStatus {
  REGISTERED = 'REGISTERED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DROPPED_OUT = 'DROPPED_OUT',
  DEFERRED = 'DEFERRED',
  SUSPENDED = 'SUSPENDED',
}

export enum CohortType {
  DAVID_COMPANY = 'DAVID_COMPANY',
  LXL_FOUNDATION = 'LXL_FOUNDATION',
  LXL_INTERMEDIATE = 'LXL_INTERMEDIATE',
  LXL_ADVANCED = 'LXL_ADVANCED',
  PASTORAL_TRAINING = 'PASTORAL_TRAINING',
  MINISTRY_LEADERSHIP = 'MINISTRY_LEADERSHIP',
  SPECIAL_TRAINING = 'SPECIAL_TRAINING',
}

export enum CohortStatus {
  PLANNING = 'PLANNING',
  REGISTRATION_OPEN = 'REGISTRATION_OPEN',
  REGISTRATION_CLOSED = 'REGISTRATION_CLOSED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  POSTPONED = 'POSTPONED',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
  SICK = 'SICK',
}

export enum AssignmentStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED',
  LATE_SUBMISSION = 'LATE_SUBMISSION',
  RESUBMISSION_REQUIRED = 'RESUBMISSION_REQUIRED',
}

export enum TrainingOutcome {
  GRADUATED = 'GRADUATED',
  PROMOTED_TO_DC = 'PROMOTED_TO_DC',
  PROMOTED_TO_LXL = 'PROMOTED_TO_LXL',
  PROMOTED_TO_LEADERSHIP = 'PROMOTED_TO_LEADERSHIP',
  ASSIGNED_TO_UNIT = 'ASSIGNED_TO_UNIT',
  ASSIGNED_TO_MINISTRY = 'ASSIGNED_TO_MINISTRY',
  INCOMPLETE = 'INCOMPLETE',
  FAILED = 'FAILED',
}

export interface CohortModule {
  title: string;
  description?: string;
  duration: number;
  materials?: string[];
  facilitator?: string;
  isOptional: boolean;
}

export interface CohortAssignment {
  title: string;
  description?: string;
  dueDate: Date;
  maxScore: number;
  weight: number;
  isRequired: boolean;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
}

export interface CohortStatistics {
  totalSessions: number;
  completedSessions: number;
  averageAttendance: number;
  averageGrade: number;
  graduationRate: number;
}

export interface Cohort {
  _id: string;
  name: string;
  code: string;
  type: CohortType;
  description?: string;
  status: CohortStatus;
  startDate: Date;
  endDate: Date;
  registrationStartDate?: Date;
  registrationEndDate?: Date;
  maxParticipants: number;
  currentParticipants: number;
  minimumAttendance: number;
  passingGrade: number;
  facilitators: string[];
  coordinator?: string;
  supervisor?: string;
  venue?: string;
  address?: Address;
  meetingDays?: string;
  meetingTime?: string;
  modules: CohortModule[];
  assignments: CohortAssignment[];
  prerequisites?: string[];
  expectedOutcomes?: string[];
  certifications?: string[];
  statistics: CohortStatistics;
  cost?: number;
  currency?: string;
  isActive: boolean;
  tags?: string[];
  notes?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceRecord {
  sessionId: string;
  sessionDate: Date;
  status: AttendanceStatus;
  checkinTime?: Date;
  checkoutTime?: Date;
  notes?: string;
  markedBy?: string;
}

export interface AssignmentRecord {
  assignmentId: string;
  title: string;
  status: AssignmentStatus;
  submissionDate?: Date;
  dueDate: Date;
  score?: number;
  maxScore: number;
  grade?: string;
  feedback?: string;
  attempts: number;
  isLateSubmission: boolean;
  gradedBy?: string;
}

export interface AttendanceStats {
  totalSessions: number;
  attendedSessions: number;
  attendancePercentage: number;
  excusedAbsences: number;
}

export interface AcademicPerformance {
  overallGrade: number;
  averageScore: number;
  totalAssignments: number;
  submittedAssignments: number;
  gradedAssignments: number;
  passedAssignments: number;
}

export interface MentoringRecord {
  date: Date;
  mentor: string;
  type: string;
  duration?: number;
  topics?: string[];
  notes?: string;
  actionItems?: string[];
  nextMeetingDate?: Date;
}

export interface EvaluationScores {
  technical?: number;
  leadership?: number;
  character?: number;
  ministry?: number;
  overall?: number;
}

export interface EvaluationRecord {
  date: Date;
  evaluator: string;
  type: string;
  scores: EvaluationScores;
  strengths?: string[];
  areasForImprovement?: string[];
  recommendations?: string[];
  notes?: string;
}

export interface WorkerTrainee {
  _id: string;
  member: string;
  cohort: string;
  status: WorkersTrainingStatus;
  enrollmentDate: Date;
  completionDate?: Date;
  graduationDate?: Date;
  dropoutDate?: Date;
  dropoutReason?: string;
  attendance: AttendanceStats;
  attendanceRecords: AttendanceRecord[];
  assignments: AssignmentRecord[];
  academicPerformance: AcademicPerformance;
  assignedMentor?: string;
  supervisor?: string;
  mentoringRecords: MentoringRecord[];
  evaluations: EvaluationRecord[];
  outcome?: TrainingOutcome;
  assignedUnit?: string;
  assignedDistrict?: string;
  assignedMinistries?: string[];
  newRole?: string;
  placementDate?: Date;
  placementApprovedBy?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalNotes?: string;
  dietaryRestrictions?: string;
  hasTransportation: boolean;
  needsAccommodation: boolean;
  accommodationDetails?: string;
  tags?: string[];
  notes?: string;
  enrolledBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCohortData {
  name: string;
  code: string;
  type: CohortType;
  description?: string;
  startDate: Date;
  endDate: Date;
  registrationStartDate?: Date;
  registrationEndDate?: Date;
  maxParticipants: number;
  minimumAttendance: number;
  passingGrade: number;
  facilitators: string[];
  coordinator?: string;
  supervisor?: string;
  venue?: string;
  address?: Address;
  meetingDays?: string;
  meetingTime?: string;
  modules: CohortModule[];
  assignments: CohortAssignment[];
  prerequisites?: string[];
  expectedOutcomes?: string[];
  certifications?: string[];
  cost?: number;
  currency?: string;
  tags?: string[];
  notes?: string;
}

export interface CreateWorkerTraineeData {
  member: string;
  cohort: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalNotes?: string;
  dietaryRestrictions?: string;
  hasTransportation?: boolean;
  needsAccommodation?: boolean;
  accommodationDetails?: string;
}

export interface PublicTrainingRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cohortId: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalNotes?: string;
  dietaryRestrictions?: string;
  hasTransportation?: boolean;
  needsAccommodation?: boolean;
  accommodationDetails?: string;
}

export interface CohortQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CohortStatus;
  type?: CohortType;
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TraineeQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  cohort?: string;
  status?: WorkersTrainingStatus;
  outcome?: TrainingOutcome;
  assignedMentor?: string;
  supervisor?: string;
  assignedUnit?: string;
  assignedDistrict?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CohortStatusCounts {
  _id: CohortStatus;
  count: number;
}

export interface CohortTypeCounts {
  _id: CohortType;
  count: number;
}

export interface CohortSummary {
  totalCohorts: number;
  totalParticipants: number;
  averageSize: number;
  totalCapacity: number;
}

export interface CohortStatisticsResponse {
  statusCounts: CohortStatusCounts[];
  typeCounts: CohortTypeCounts[];
  summary: CohortSummary;
  upcomingCohorts: Cohort[];
  activeCohorts: Cohort[];
}

export interface TraineeStatusCounts {
  _id: WorkersTrainingStatus;
  count: number;
}

export interface TraineeOutcomeCounts {
  _id: TrainingOutcome;
  count: number;
}

export interface TraineePerformanceStats {
  averageAttendance: number;
  averageGrade: number;
  totalTrainees: number;
}

export interface TraineePlacementStats {
  _id: string;
  count: number;
}

export interface TraineeStatisticsResponse {
  statusCounts: TraineeStatusCounts[];
  outcomeCounts: TraineeOutcomeCounts[];
  performanceStats: TraineePerformanceStats;
  placementStats: TraineePlacementStats[];
}