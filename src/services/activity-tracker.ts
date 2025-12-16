import { apiService } from './api';
import {
  MemberActivity,
  MemberTimeline,
  MemberLifecycleStats,
  ActivityType,
  ActivityStatus,
  ActivityPriority,
} from '@/types/activity-tracker';
import { ApiResponse, PaginatedResponse } from '@/types';

export interface ActivityQueryParams {
  page?: number;
  limit?: number;
  memberId?: string;
  activityType?: ActivityType;
  status?: ActivityStatus;
  priority?: ActivityPriority;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class ActivityTrackerService {
  async getActivities(params?: ActivityQueryParams): Promise<PaginatedResponse<MemberActivity>> {
    return await apiService.get('/activity-tracker/activities', { params });
  }

  async getActivity(id: string): Promise<MemberActivity> {
    return await apiService.get(`/activity-tracker/activities/${id}`);
  }

  async getActivityStatistics(memberId?: string): Promise<{
    totalActivities: number;
    recentActivities: number;
    activityTypeBreakdown: Record<string, number>;
    statusBreakdown: Record<string, number>;
    priorityBreakdown: Record<string, number>;
  }> {
    return await apiService.get('/activity-tracker/activities/statistics', {
      params: memberId ? { memberId } : undefined,
    });
  }

  async getUpcomingFollowUps(limit?: number): Promise<MemberActivity[]> {
    return await apiService.get('/activity-tracker/follow-ups/upcoming', {
      params: limit ? { limit } : undefined,
    });
  }

  async getMemberTimeline(
    memberId: string,
    limit?: number,
    offset?: number,
  ): Promise<MemberTimeline> {
    return await apiService.get(`/activity-tracker/members/${memberId}/timeline`, {
      params: {
        ...(limit && { limit }),
        ...(offset && { offset }),
      },
    });
  }

  async getMemberLifecycleStats(memberId: string): Promise<MemberLifecycleStats> {
    return await apiService.get(`/activity-tracker/members/${memberId}/statistics`);
  }

  async addFollowUpNote(
    activityId: string,
    note: string,
    nextFollowUpDate?: Date,
  ): Promise<MemberActivity> {
    return await apiService.post(`/activity-tracker/activities/${activityId}/follow-up`, {
      note,
      nextFollowUpDate: nextFollowUpDate?.toISOString(),
    });
  }

  async markActivityComplete(activityId: string): Promise<MemberActivity> {
    return await apiService.post(`/activity-tracker/activities/${activityId}/complete`);
  }

  // Lifecycle event logging methods
  async logMemberRegistration(memberId: string, source?: string): Promise<MemberActivity> {
    return await apiService.post(`/activity-tracker/members/${memberId}/lifecycle/register`, {
      source,
    });
  }

  async logBaptism(
    memberId: string,
    baptismType: 'water' | 'spirit',
    baptismDate: Date,
    location?: string,
  ): Promise<MemberActivity> {
    return await apiService.post(`/activity-tracker/members/${memberId}/lifecycle/baptism`, {
      baptismType,
      baptismDate: baptismDate.toISOString(),
      location,
    });
  }

  async logSpecialEvent(
    memberId: string,
    eventType: ActivityType,
    title: string,
    description: string,
    eventDate?: Date,
  ): Promise<MemberActivity> {
    return await apiService.post(`/activity-tracker/members/${memberId}/lifecycle/special-event`, {
      eventType,
      title,
      description,
      eventDate: eventDate?.toISOString(),
    });
  }

  // Utility methods for display
  getActivityTypeDisplayName(type: ActivityType): string {
    const displayNames: Record<ActivityType, string> = {
      [ActivityType.MEMBER_REGISTRATION]: 'Member Registration',
      [ActivityType.FIRST_TIME_VISITOR]: 'First Time Visitor',
      [ActivityType.SECOND_TIME_VISITOR]: 'Second Time Visitor',
      [ActivityType.REGULAR_ATTENDEE]: 'Regular Attendee',
      [ActivityType.MEMBER_ONBOARDING]: 'Member Onboarding',
      [ActivityType.MEMBER_ORIENTATION]: 'Member Orientation',

      [ActivityType.MEMBERSHIP_STATUS_CHANGE]: 'Membership Status Change',
      [ActivityType.MEMBERSHIP_ACTIVATION]: 'Membership Activation',
      [ActivityType.MEMBERSHIP_DEACTIVATION]: 'Membership Deactivation',
      [ActivityType.MEMBERSHIP_SUSPENSION]: 'Membership Suspension',
      [ActivityType.MEMBERSHIP_RESTORATION]: 'Membership Restoration',

      [ActivityType.BAPTISM]: 'Baptism',
      [ActivityType.CONFIRMATION]: 'Confirmation',
      [ActivityType.WATER_BAPTISM]: 'Water Baptism',
      [ActivityType.SPIRIT_BAPTISM]: 'Spirit Baptism',
      [ActivityType.REDEDICATION]: 'Rededication',
      [ActivityType.SALVATION]: 'Salvation',

      [ActivityType.ROLE_PROMOTION]: 'Role Promotion',
      [ActivityType.ROLE_DEMOTION]: 'Role Demotion',
      [ActivityType.ROLE_CHANGE]: 'Role Change',
      [ActivityType.ROLE_ASSIGNMENT]: 'Role Assignment',
      [ActivityType.ROLE_REMOVAL]: 'Role Removal',

      [ActivityType.UNIT_ASSIGNMENT]: 'Unit Assignment',
      [ActivityType.UNIT_TRANSFER]: 'Unit Transfer',
      [ActivityType.UNIT_REMOVAL]: 'Unit Removal',
      [ActivityType.DISTRICT_ASSIGNMENT]: 'District Assignment',
      [ActivityType.DISTRICT_TRANSFER]: 'District Transfer',
      [ActivityType.DISTRICT_REMOVAL]: 'District Removal',
      [ActivityType.MINISTRY_ASSIGNMENT]: 'Ministry Assignment',
      [ActivityType.MINISTRY_TRANSFER]: 'Ministry Transfer',
      [ActivityType.MINISTRY_REMOVAL]: 'Ministry Removal',

      [ActivityType.LEADERSHIP_APPOINTMENT]: 'Leadership Appointment',
      [ActivityType.LEADERSHIP_PROMOTION]: 'Leadership Promotion',
      [ActivityType.LEADERSHIP_RESIGNATION]: 'Leadership Resignation',
      [ActivityType.LEADERSHIP_TERMINATION]: 'Leadership Termination',
      [ActivityType.LEADERSHIP_TRANSITION]: 'Leadership Transition',
      [ActivityType.ACTING_APPOINTMENT]: 'Acting Appointment',
      [ActivityType.INTERIM_APPOINTMENT]: 'Interim Appointment',

      [ActivityType.TRAINING_ENROLLMENT]: 'Training Enrollment',
      [ActivityType.TRAINING_START]: 'Training Start',
      [ActivityType.TRAINING_COMPLETION]: 'Training Completion',
      [ActivityType.TRAINING_GRADUATION]: 'Training Graduation',
      [ActivityType.TRAINING_DROPOUT]: 'Training Dropout',
      [ActivityType.TRAINING_SUSPENSION]: 'Training Suspension',
      [ActivityType.TRAINING_DEFERRAL]: 'Training Deferral',
      [ActivityType.CERTIFICATION_AWARDED]: 'Certification Awarded',
      [ActivityType.MENTORSHIP_ASSIGNMENT]: 'Mentorship Assignment',
      [ActivityType.MENTORSHIP_COMPLETION]: 'Mentorship Completion',

      [ActivityType.DC_ENROLLMENT]: 'DC Enrollment',
      [ActivityType.DC_GRADUATION]: 'DC Graduation',
      [ActivityType.LXL_ENROLLMENT]: 'LXL Enrollment',
      [ActivityType.LXL_GRADUATION]: 'LXL Graduation',
      [ActivityType.PASTORAL_TRAINING_START]: 'Pastoral Training Start',
      [ActivityType.PASTORAL_TRAINING_COMPLETION]: 'Pastoral Training Completion',
      [ActivityType.INTERNSHIP_ASSIGNMENT]: 'Internship Assignment',
      [ActivityType.INTERNSHIP_COMPLETION]: 'Internship Completion',

      [ActivityType.TRAVEL_OUT]: 'Travel Out',
      [ActivityType.TRAVEL_RETURN]: 'Travel Return',
      [ActivityType.RELOCATION]: 'Relocation',
      [ActivityType.TEMPORARY_LEAVE]: 'Temporary Leave',
      [ActivityType.EXTENDED_LEAVE]: 'Extended Leave',
      [ActivityType.SABBATICAL]: 'Sabbatical',
      [ActivityType.RETURN_FROM_LEAVE]: 'Return From Leave',
      [ActivityType.ADDRESS_CHANGE]: 'Address Change',
      [ActivityType.CONTACT_RELOCATION]: 'Contact Relocation',

      [ActivityType.DISCIPLINE_WARNING]: 'Discipline Warning',
      [ActivityType.DISCIPLINE_PROBATION]: 'Discipline Probation',
      [ActivityType.DISCIPLINE_SUSPENSION]: 'Discipline Suspension',
      [ActivityType.DISCIPLINE_RESTORATION]: 'Discipline Restoration',
      [ActivityType.COUNSELING_ASSIGNMENT]: 'Counseling Assignment',
      [ActivityType.ACCOUNTABILITY_PARTNER]: 'Accountability Partner',

      [ActivityType.MARRIAGE]: 'Marriage',
      [ActivityType.DIVORCE]: 'Divorce',
      [ActivityType.SEPARATION]: 'Separation',
      [ActivityType.WIDOWED]: 'Widowed',
      [ActivityType.BIRTH_OF_CHILD]: 'Birth of Child',
      [ActivityType.DEATH]: 'Death',
      [ActivityType.GRADUATION]: 'Graduation',
      [ActivityType.CAREER_CHANGE]: 'Career Change',
      [ActivityType.RETIREMENT]: 'Retirement',

      [ActivityType.TRANSFER_OUT]: 'Transfer Out',
      [ActivityType.TRANSFER_IN]: 'Transfer In',
      [ActivityType.BRANCH_TRANSFER]: 'Branch Transfer',
      [ActivityType.CHURCH_PLANT_ASSIGNMENT]: 'Church Plant Assignment',
      [ActivityType.MISSION_DEPLOYMENT]: 'Mission Deployment',
      [ActivityType.MISSION_RETURN]: 'Mission Return',

      [ActivityType.VOLUNTEER_ASSIGNMENT]: 'Volunteer Assignment',
      [ActivityType.SERVICE_COMMITMENT]: 'Service Commitment',
      [ActivityType.COMMITTEE_APPOINTMENT]: 'Committee Appointment',
      [ActivityType.COMMITTEE_REMOVAL]: 'Committee Removal',
      [ActivityType.SPECIAL_PROJECT_ASSIGNMENT]: 'Special Project Assignment',
      [ActivityType.SPECIAL_PROJECT_COMPLETION]: 'Special Project Completion',

      [ActivityType.ATTENDANCE_MILESTONE]: 'Attendance Milestone',
      [ActivityType.ENGAGEMENT_INCREASE]: 'Engagement Increase',
      [ActivityType.ENGAGEMENT_DECREASE]: 'Engagement Decrease',
      [ActivityType.INACTIVE_WARNING]: 'Inactive Warning',
      [ActivityType.REACTIVATION]: 'Reactivation',
      [ActivityType.FOLLOW_UP_SCHEDULED]: 'Follow-up Scheduled',
      [ActivityType.FOLLOW_UP_COMPLETED]: 'Follow-up Completed',

      [ActivityType.FIRST_TIME_GIVER]: 'First Time Giver',
      [ActivityType.TITHING_COMMITMENT]: 'Tithing Commitment',
      [ActivityType.PLEDGE_MADE]: 'Pledge Made',
      [ActivityType.PLEDGE_FULFILLED]: 'Pledge Fulfilled',
      [ActivityType.FINANCIAL_COUNSELING]: 'Financial Counseling',
      [ActivityType.STEWARDSHIP_TRAINING]: 'Stewardship Training',

      [ActivityType.PROFILE_CREATED]: 'Profile Created',
      [ActivityType.PROFILE_UPDATE]: 'Profile Update',
      [ActivityType.CONTACT_UPDATE]: 'Contact Update',
      [ActivityType.EMERGENCY_CONTACT_UPDATE]: 'Emergency Contact Update',
      [ActivityType.PHOTO_UPDATE]: 'Photo Update',
      [ActivityType.DOCUMENT_UPLOAD]: 'Document Upload',
      [ActivityType.ACCOUNT_ACTIVATION]: 'Account Activation',
      [ActivityType.ACCOUNT_DEACTIVATION]: 'Account Deactivation',
      [ActivityType.PASSWORD_RESET]: 'Password Reset',

      [ActivityType.FIRST_CONTACT]: 'First Contact',
      [ActivityType.FOLLOW_UP_CALL]: 'Follow-up Call',
      [ActivityType.HOME_VISIT]: 'Home Visit',
      [ActivityType.COUNSELING_SESSION]: 'Counseling Session',
      [ActivityType.PRAYER_REQUEST]: 'Prayer Request',
      [ActivityType.TESTIMONY_SHARED]: 'Testimony Shared',
      [ActivityType.REFERRAL_MADE]: 'Referral Made',
      [ActivityType.REFERRAL_RECEIVED]: 'Referral Received',

      [ActivityType.DATA_IMPORT]: 'Data Import',
      [ActivityType.DATA_EXPORT]: 'Data Export',
      [ActivityType.BULK_UPDATE]: 'Bulk Update',
      [ActivityType.SYSTEM_MIGRATION]: 'System Migration',
      [ActivityType.RECORD_MERGE]: 'Record Merge',
      [ActivityType.DUPLICATE_RESOLVED]: 'Duplicate Resolved',
    };

    return displayNames[type] || type;
  }

  getActivityTypeColor(type: ActivityType): string {
    // Group activity types by color themes
    if ([
      ActivityType.MEMBER_REGISTRATION,
      ActivityType.FIRST_TIME_VISITOR,
      ActivityType.PROFILE_CREATED,
      ActivityType.ACCOUNT_ACTIVATION,
    ].includes(type)) {
      return 'bg-green-100 text-green-800'; // Registration/New
    }

    if ([
      ActivityType.BAPTISM,
      ActivityType.WATER_BAPTISM,
      ActivityType.SPIRIT_BAPTISM,
      ActivityType.CONFIRMATION,
      ActivityType.SALVATION,
    ].includes(type)) {
      return 'bg-purple-100 text-purple-800'; // Spiritual milestones
    }

    if ([
      ActivityType.ROLE_PROMOTION,
      ActivityType.LEADERSHIP_APPOINTMENT,
      ActivityType.LEADERSHIP_PROMOTION,
      ActivityType.ROLE_ASSIGNMENT,
    ].includes(type)) {
      return 'bg-blue-100 text-blue-800'; // Promotions/Leadership
    }

    if ([
      ActivityType.TRAINING_ENROLLMENT,
      ActivityType.TRAINING_GRADUATION,
      ActivityType.DC_ENROLLMENT,
      ActivityType.DC_GRADUATION,
      ActivityType.LXL_ENROLLMENT,
      ActivityType.LXL_GRADUATION,
      ActivityType.CERTIFICATION_AWARDED,
    ].includes(type)) {
      return 'bg-indigo-100 text-indigo-800'; // Training/Education
    }

    if ([
      ActivityType.UNIT_ASSIGNMENT,
      ActivityType.UNIT_TRANSFER,
      ActivityType.MINISTRY_ASSIGNMENT,
      ActivityType.INTERNSHIP_ASSIGNMENT,
    ].includes(type)) {
      return 'bg-cyan-100 text-cyan-800'; // Assignments/Transfers
    }

    if ([
      ActivityType.MARRIAGE,
      ActivityType.BIRTH_OF_CHILD,
      ActivityType.GRADUATION,
      ActivityType.RETIREMENT,
    ].includes(type)) {
      return 'bg-yellow-100 text-yellow-800'; // Life events
    }

    if ([
      ActivityType.DISCIPLINE_WARNING,
      ActivityType.DISCIPLINE_SUSPENSION,
      ActivityType.MEMBERSHIP_SUSPENSION,
      ActivityType.TRAINING_DROPOUT,
    ].includes(type)) {
      return 'bg-red-100 text-red-800'; // Disciplinary/Negative
    }

    if ([
      ActivityType.TRAVEL_OUT,
      ActivityType.RELOCATION,
      ActivityType.TEMPORARY_LEAVE,
      ActivityType.TRANSFER_OUT,
    ].includes(type)) {
      return 'bg-orange-100 text-orange-800'; // Travel/Location
    }

    return 'bg-gray-100 text-gray-800'; // Default
  }

  getPriorityColor(priority: ActivityPriority): string {
    const colors = {
      [ActivityPriority.LOW]: 'bg-gray-100 text-gray-600',
      [ActivityPriority.MEDIUM]: 'bg-blue-100 text-blue-600',
      [ActivityPriority.HIGH]: 'bg-yellow-100 text-yellow-600',
      [ActivityPriority.URGENT]: 'bg-orange-100 text-orange-600',
      [ActivityPriority.CRITICAL]: 'bg-red-100 text-red-600',
    };
    return colors[priority];
  }
}

export const activityTrackerService = new ActivityTrackerService();
export default activityTrackerService;