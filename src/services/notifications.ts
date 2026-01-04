import { apiService } from './api'

export interface NotificationItem {
  id: string
  type: 'assigned_first_timer' | 'birthday_upcoming' | 'ready_for_integration' | 'membership_status_change' | 'group_addition' | 'member_joined_your_group'
  title: string
  description: string
  createdAt: string
  data?: Record<string, any>
}

export interface UserNotificationsResponse {
  totalCount: number
  items: NotificationItem[]
  counts: {
    assignedFirstTimers: number
    upcomingBirthdays: number
    readyForIntegration: number
    membershipStatusChanges: number
    groupAdditions: number
    membersJoinedYourGroups: number
  }
}

export interface NotificationCountResponse {
  success: boolean
  data: {
    count: number
  }
}

export interface NotificationsResponse {
  success: boolean
  data: UserNotificationsResponse
}

export interface DismissResponse {
  success: boolean
  message: string
}

export const notificationsService = {
  async getMyNotifications(): Promise<NotificationsResponse> {
    return apiService.get<NotificationsResponse>('/notifications/my')
  },

  async getNotificationCount(): Promise<NotificationCountResponse> {
    return apiService.get<NotificationCountResponse>('/notifications/count')
  },

  async dismissNotification(notificationId: string): Promise<DismissResponse> {
    return apiService.delete<DismissResponse>(`/notifications/${encodeURIComponent(notificationId)}`)
  },

  async dismissAllNotifications(): Promise<DismissResponse> {
    return apiService.delete<DismissResponse>('/notifications')
  },
}
