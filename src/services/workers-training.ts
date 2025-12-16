import { apiService } from './api';
import {
  Cohort,
  WorkerTrainee,
  CreateCohortData,
  CreateWorkerTraineeData,
  PublicTrainingRegistrationData,
  CohortQueryParams,
  TraineeQueryParams,
  CohortStatisticsResponse,
  TraineeStatisticsResponse,
  WorkersTrainingStatus,
  CohortStatus,
  TrainingOutcome,
  AttendanceStatus,
} from '@/types/workers-training';
import { ApiResponse, PaginatedResponse } from '@/types';

class WorkersTrainingService {
  // Cohort management
  async getCohorts(params?: CohortQueryParams): Promise<PaginatedResponse<Cohort>> {
    const response = await apiService.get('/workers-training/cohorts', {
      params: params ? {
        ...params,
        startDateFrom: params.startDateFrom?.toISOString(),
        startDateTo: params.startDateTo?.toISOString(),
        endDateFrom: params.endDateFrom?.toISOString(),
        endDateTo: params.endDateTo?.toISOString(),
      } : undefined,
    });
    return response.data;
  }

  async getCohort(id: string): Promise<Cohort> {
    const response = await apiService.get(`/workers-training/cohorts/${id}`);
    return response.data;
  }

  async createCohort(data: CreateCohortData): Promise<Cohort> {
    const response = await apiService.post('/workers-training/cohorts', data);
    return response.data;
  }

  async updateCohort(id: string, data: Partial<CreateCohortData>): Promise<Cohort> {
    const response = await apiService.patch(`/workers-training/cohorts/${id}`, data);
    return response.data;
  }

  async updateCohortStatus(id: string, status: CohortStatus): Promise<Cohort> {
    const response = await apiService.patch(`/workers-training/cohorts/${id}/status`, { status });
    return response.data;
  }

  async deleteCohort(id: string): Promise<void> {
    await apiService.delete(`/workers-training/cohorts/${id}`);
  }

  async getCohortStatistics(cohortId?: string): Promise<CohortStatisticsResponse> {
    const url = cohortId
      ? `/workers-training/cohorts/${cohortId}/statistics`
      : '/workers-training/cohorts/statistics';
    const response = await apiService.get(url);
    return response.data;
  }

  async getCohortsForFacilitator(facilitatorId: string, status?: CohortStatus): Promise<Cohort[]> {
    const response = await apiService.get(`/workers-training/cohorts/facilitator/${facilitatorId}`, {
      params: status ? { status } : undefined,
    });
    return response.data;
  }

  // Trainee management
  async getTrainees(params?: TraineeQueryParams): Promise<PaginatedResponse<WorkerTrainee>> {
    const response = await apiService.get('/workers-training/trainees', {
      params,
    });
    return response.data;
  }

  async getTrainee(id: string): Promise<WorkerTrainee> {
    const response = await apiService.get(`/workers-training/trainees/${id}`);
    return response.data;
  }

  async enrollTrainee(data: CreateWorkerTraineeData): Promise<WorkerTrainee> {
    const response = await apiService.post('/workers-training/trainees/enroll', data);
    return response.data;
  }

  async getTraineesByCohort(cohortId: string, params?: Partial<TraineeQueryParams>): Promise<PaginatedResponse<WorkerTrainee>> {
    const response = await apiService.get(`/workers-training/trainees/cohort/${cohortId}`, {
      params,
    });
    return response.data;
  }

  async getTraineesByMember(memberId: string): Promise<WorkerTrainee[]> {
    const response = await apiService.get(`/workers-training/trainees/member/${memberId}`);
    return response.data;
  }

  async updateTraineeStatus(
    id: string,
    status: WorkersTrainingStatus,
    reason?: string
  ): Promise<WorkerTrainee> {
    const response = await apiService.patch(`/workers-training/trainees/${id}/status`, {
      status,
      reason,
    });
    return response.data;
  }

  async assignToUnit(
    traineeId: string,
    unitId: string,
    outcome: TrainingOutcome
  ): Promise<WorkerTrainee> {
    const response = await apiService.patch(`/workers-training/trainees/${traineeId}/assign-unit`, {
      unitId,
      outcome,
    });
    return response.data;
  }

  async recordAttendance(
    traineeId: string,
    attendanceData: {
      sessionId: string;
      sessionDate: Date;
      status: AttendanceStatus;
      checkinTime?: Date;
      checkoutTime?: Date;
      notes?: string;
    }
  ): Promise<WorkerTrainee> {
    const response = await apiService.post(`/workers-training/trainees/${traineeId}/attendance`, {
      ...attendanceData,
      sessionDate: attendanceData.sessionDate.toISOString(),
      checkinTime: attendanceData.checkinTime?.toISOString(),
      checkoutTime: attendanceData.checkoutTime?.toISOString(),
    });
    return response.data;
  }

  async gradeAssignment(
    traineeId: string,
    gradingData: {
      assignmentId: string;
      title: string;
      score: number;
      maxScore: number;
      grade?: string;
      feedback?: string;
    }
  ): Promise<WorkerTrainee> {
    const response = await apiService.post(`/workers-training/trainees/${traineeId}/grade-assignment`, gradingData);
    return response.data;
  }

  async getTraineeStatistics(cohortId?: string): Promise<TraineeStatisticsResponse> {
    const response = await apiService.get('/workers-training/trainees/statistics', {
      params: cohortId ? { cohortId } : undefined,
    });
    return response.data;
  }

  // Public registration
  async submitPublicRegistration(data: PublicTrainingRegistrationData): Promise<ApiResponse<any>> {
    const response = await apiService.post('/workers-training/trainees/public-enrollment', {
      cohortId: data.cohortId,
      trainees: [{
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        medicalNotes: data.medicalNotes,
        dietaryRestrictions: data.dietaryRestrictions,
        hasTransportation: data.hasTransportation,
        needsAccommodation: data.needsAccommodation,
        accommodationDetails: data.accommodationDetails,
      }]
    });
    return response.data;
  }

  // Public cohorts for registration
  async getPublicCohorts(): Promise<Cohort[]> {
    const response = await apiService.get('/workers-training/cohorts', {
      params: {
        status: CohortStatus.REGISTRATION_OPEN,
        limit: 100,
      }
    });
    return response.data.cohorts || [];
  }

  // Bulk operations
  async bulkEnrollTrainees(data: {
    cohortId: string;
    trainees: Array<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      emergencyContact?: string;
      emergencyPhone?: string;
      medicalNotes?: string;
      dietaryRestrictions?: string;
      hasTransportation?: boolean;
      needsAccommodation?: boolean;
      accommodationDetails?: string;
    }>;
  }): Promise<{
    successful: any[];
    failed: any[];
    total: number;
  }> {
    const response = await apiService.post('/workers-training/trainees/public-enrollment', data);
    return response.data;
  }

  // Utility methods
  getCohortTypeDisplayName(type: string): string {
    const typeMap: Record<string, string> = {
      'DAVID_COMPANY': 'David Company (DC)',
      'LXL_FOUNDATION': 'LXL Foundation',
      'LXL_INTERMEDIATE': 'LXL Intermediate',
      'LXL_ADVANCED': 'LXL Advanced',
      'PASTORAL_TRAINING': 'Pastoral Training',
      'MINISTRY_LEADERSHIP': 'Ministry Leadership',
      'SPECIAL_TRAINING': 'Special Training',
    };
    return typeMap[type] || type;
  }

  getCohortStatusDisplayName(status: string): string {
    const statusMap: Record<string, string> = {
      'PLANNING': 'Planning',
      'REGISTRATION_OPEN': 'Registration Open',
      'REGISTRATION_CLOSED': 'Registration Closed',
      'IN_PROGRESS': 'In Progress',
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled',
      'POSTPONED': 'Postponed',
    };
    return statusMap[status] || status;
  }

  getTraineeStatusDisplayName(status: string): string {
    const statusMap: Record<string, string> = {
      'REGISTERED': 'Registered',
      'IN_PROGRESS': 'In Progress',
      'COMPLETED': 'Completed',
      'DROPPED_OUT': 'Dropped Out',
      'DEFERRED': 'Deferred',
      'SUSPENDED': 'Suspended',
    };
    return statusMap[status] || status;
  }

  getTrainingOutcomeDisplayName(outcome: string): string {
    const outcomeMap: Record<string, string> = {
      'GRADUATED': 'Graduated',
      'PROMOTED_TO_DC': 'Promoted to DC',
      'PROMOTED_TO_LXL': 'Promoted to LXL',
      'PROMOTED_TO_LEADERSHIP': 'Promoted to Leadership',
      'ASSIGNED_TO_UNIT': 'Assigned to Unit',
      'ASSIGNED_TO_MINISTRY': 'Assigned to Ministry',
      'INCOMPLETE': 'Incomplete',
      'FAILED': 'Failed',
    };
    return outcomeMap[outcome] || outcome;
  }
}

export const workersTrainingService = new WorkersTrainingService();
export default workersTrainingService;