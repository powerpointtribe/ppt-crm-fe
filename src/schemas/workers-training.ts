import { z } from 'zod';
import {
  CohortType,
  CohortStatus,
  WorkersTrainingStatus,
  TrainingOutcome,
  AttendanceStatus,
} from '@/types/workers-training';

// Address schema
export const AddressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().default('Nigeria'),
});

// Cohort Module schema
export const CohortModuleSchema = z.object({
  title: z.string().min(1, 'Module title is required'),
  description: z.string().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 hour'),
  materials: z.array(z.string()).optional(),
  facilitator: z.string().optional(),
  isOptional: z.boolean().default(false),
});

// Cohort Assignment schema
export const CohortAssignmentSchema = z.object({
  title: z.string().min(1, 'Assignment title is required'),
  description: z.string().optional(),
  dueDate: z.date(),
  maxScore: z.number().min(1).default(100),
  weight: z.number().min(0).max(10).default(1),
  isRequired: z.boolean().default(true),
});

// Create Cohort schema
export const CreateCohortSchema = z.object({
  name: z.string().min(1, 'Cohort name is required').max(100),
  code: z.string().min(1, 'Cohort code is required').max(50),
  type: z.nativeEnum(CohortType),
  description: z.string().max(500).optional(),
  startDate: z.date(),
  endDate: z.date(),
  registrationStartDate: z.date().optional(),
  registrationEndDate: z.date().optional(),
  maxParticipants: z.number().min(0).default(0),
  minimumAttendance: z.number().min(0).max(100).default(80),
  passingGrade: z.number().min(0).max(100).default(60),
  facilitators: z.array(z.string()).default([]),
  coordinator: z.string().optional(),
  supervisor: z.string().optional(),
  venue: z.string().max(200).optional(),
  address: AddressSchema.optional(),
  meetingDays: z.string().max(100).optional(),
  meetingTime: z.string().max(100).optional(),
  modules: z.array(CohortModuleSchema).default([]),
  assignments: z.array(CohortAssignmentSchema).default([]),
  prerequisites: z.array(z.string()).optional(),
  expectedOutcomes: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  cost: z.number().min(0).optional(),
  currency: z.string().max(10).default('NGN').optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(1000).optional(),
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
}).refine((data) => {
  if (data.registrationStartDate && data.registrationEndDate) {
    return data.registrationEndDate > data.registrationStartDate;
  }
  return true;
}, {
  message: 'Registration end date must be after registration start date',
  path: ['registrationEndDate'],
});

// Create Worker Trainee schema
export const CreateWorkerTraineeSchema = z.object({
  member: z.string().min(1, 'Member is required'),
  cohort: z.string().min(1, 'Cohort is required'),
  emergencyContact: z.string().max(100).optional(),
  emergencyPhone: z.string().max(20).optional(),
  medicalNotes: z.string().max(500).optional(),
  dietaryRestrictions: z.string().max(300).optional(),
  hasTransportation: z.boolean().default(false),
  needsAccommodation: z.boolean().default(false),
  accommodationDetails: z.string().max(500).optional(),
});

// Public Training Registration schema
export const PublicTrainingRegistrationSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required').max(20),
  cohortId: z.string().min(1, 'Please select a cohort'),
  emergencyContact: z.string().max(100).optional(),
  emergencyPhone: z.string().max(20).optional(),
  medicalNotes: z.string().max(500).optional(),
  dietaryRestrictions: z.string().max(300).optional(),
  hasTransportation: z.boolean().default(false),
  needsAccommodation: z.boolean().default(false),
  accommodationDetails: z.string().max(500).optional(),
});

// Update Trainee Status schema
export const UpdateTraineeStatusSchema = z.object({
  status: z.nativeEnum(WorkersTrainingStatus),
  reason: z.string().max(500).optional(),
});

// Assign to Unit schema
export const AssignToUnitSchema = z.object({
  unitId: z.string().min(1, 'Unit is required'),
  outcome: z.nativeEnum(TrainingOutcome),
});

// Record Attendance schema
export const RecordAttendanceSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  sessionDate: z.date(),
  status: z.nativeEnum(AttendanceStatus),
  checkinTime: z.date().optional(),
  checkoutTime: z.date().optional(),
  notes: z.string().max(300).optional(),
});

// Grade Assignment schema
export const GradeAssignmentSchema = z.object({
  assignmentId: z.string().min(1, 'Assignment ID is required'),
  title: z.string().min(1, 'Assignment title is required'),
  score: z.number().min(0, 'Score cannot be negative'),
  maxScore: z.number().min(1, 'Max score must be at least 1'),
  grade: z.string().max(10).optional(),
  feedback: z.string().max(1000).optional(),
}).refine((data) => data.score <= data.maxScore, {
  message: 'Score cannot exceed maximum score',
  path: ['score'],
});

// Cohort Query Params schema
export const CohortQuerySchema = z.object({
  page: z.number().min(1).default(1).optional(),
  limit: z.number().min(1).max(100).default(20).optional(),
  search: z.string().optional(),
  status: z.nativeEnum(CohortStatus).optional(),
  type: z.nativeEnum(CohortType).optional(),
  startDateFrom: z.date().optional(),
  startDateTo: z.date().optional(),
  endDateFrom: z.date().optional(),
  endDateTo: z.date().optional(),
  sortBy: z.string().default('createdAt').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
});

// Trainee Query Params schema
export const TraineeQuerySchema = z.object({
  page: z.number().min(1).default(1).optional(),
  limit: z.number().min(1).max(100).default(20).optional(),
  search: z.string().optional(),
  cohort: z.string().optional(),
  status: z.nativeEnum(WorkersTrainingStatus).optional(),
  outcome: z.nativeEnum(TrainingOutcome).optional(),
  assignedMentor: z.string().optional(),
  supervisor: z.string().optional(),
  assignedUnit: z.string().optional(),
  assignedDistrict: z.string().optional(),
  sortBy: z.string().default('enrollmentDate').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
});

// Type exports for form data
export type CreateCohortFormData = z.infer<typeof CreateCohortSchema>;
export type CreateWorkerTraineeFormData = z.infer<typeof CreateWorkerTraineeSchema>;
export type PublicTrainingRegistrationFormData = z.infer<typeof PublicTrainingRegistrationSchema>;
export type UpdateTraineeStatusFormData = z.infer<typeof UpdateTraineeStatusSchema>;
export type AssignToUnitFormData = z.infer<typeof AssignToUnitSchema>;
export type RecordAttendanceFormData = z.infer<typeof RecordAttendanceSchema>;
export type GradeAssignmentFormData = z.infer<typeof GradeAssignmentSchema>;
export type CohortQueryFormData = z.infer<typeof CohortQuerySchema>;
export type TraineeQueryFormData = z.infer<typeof TraineeQuerySchema>;