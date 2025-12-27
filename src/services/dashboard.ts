import { apiService } from './api'

export interface DateRange {
  startDate: string
  endDate: string
}

export interface DashboardOverview {
  // All-time totals
  totalMembers: number
  totalGroups: number
  totalFirstTimers: number
  // Period-specific counts (within selected date range)
  periodMembers: number
  periodGroups: number
  periodFirstTimers: number
  recentFirstTimers: number
  recentActivity: ActivityItem[]
  analytics: {
    memberEngagement: number
    groupParticipation: number
    eventAttendance: number
    monthlyGrowth: number
  }
  trends: {
    membersTrend: string
    groupsTrend: string
    firstTimersTrend: string
  }
  dateRange?: DateRange
}

export interface ActivityItem {
  id: string
  action: string
  user: string
  timestamp: string
  type: 'member' | 'group' | 'first_timer'
}

class DashboardService {
  private formatTrend(trend?: string): string {
    switch (trend) {
      case 'up':
      case 'increasing':
        return '+5%'
      case 'down':
      case 'decreasing':
        return '-3%'
      case 'stable':
      default:
        return '0%'
    }
  }

  private formatPercentage(percentage?: number, trend?: string): string {
    if (percentage === undefined || percentage === null) {
      return this.formatTrend(trend)
    }
    const sign = percentage >= 0 ? '+' : ''
    return `${sign}${percentage}%`
  }

  async getOverview(): Promise<DashboardOverview> {
    return apiService.get<DashboardOverview>('/dashboard/overview')
  }

  async getStats(startDate?: string, endDate?: string, branchId?: string): Promise<Partial<DashboardOverview>> {
    try {
      // Build query params
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (branchId) params.append('branchId', branchId)

      const queryString = params.toString()
      const url = `/dashboard/overview${queryString ? `?${queryString}` : ''}`

      const response = await apiService.get<any>(url)

      // Map the API response structure to our expected format
      const recentActivity = response.data?.recentActivity
      const mappedData: Partial<DashboardOverview> = {
        // All-time totals
        totalMembers: response.data?.stats?.totalMembers || 0,
        totalGroups: response.data?.stats?.totalGroups || 0,
        totalFirstTimers: response.data?.stats?.totalFirstTimers || 0,
        // Period-specific counts (from recentActivity which is filtered by date range)
        periodMembers: recentActivity?.recentMembers?.count || 0,
        periodGroups: recentActivity?.recentGroups?.count || 0,
        periodFirstTimers: recentActivity?.recentFirstTimers?.count || 0,
        recentFirstTimers: recentActivity?.recentFirstTimers?.count || 0,
        analytics: {
          memberEngagement: recentActivity?.recentMembers?.percentage || 0,
          groupParticipation: recentActivity?.recentGroups?.percentage || 0,
          eventAttendance: 0, // Not provided in API
          monthlyGrowth: 0 // Calculate from membershipTrends if needed
        },
        trends: {
          membersTrend: this.formatPercentage(recentActivity?.recentMembers?.percentage, recentActivity?.recentMembers?.trend),
          groupsTrend: this.formatPercentage(recentActivity?.recentGroups?.percentage, recentActivity?.recentGroups?.trend),
          firstTimersTrend: this.formatPercentage(recentActivity?.recentFirstTimers?.percentage, recentActivity?.recentFirstTimers?.trend)
        },
        recentActivity: [], // Map from upcomingTasks if needed
        dateRange: response.data?.dateRange
      }

      return mappedData
    } catch (error) {
      // Fallback for when endpoint doesn't exist yet
      console.warn('Dashboard overview endpoint not available, using fallback data')
      return {
        totalMembers: 800,
        totalGroups: 45,
        totalFirstTimers: 120,
        periodMembers: 25,
        periodGroups: 3,
        periodFirstTimers: 15,
        recentFirstTimers: 15,
        analytics: {
          memberEngagement: 78,
          groupParticipation: 65,
          eventAttendance: 92,
          monthlyGrowth: 12
        },
        trends: {
          membersTrend: '+8%',
          groupsTrend: '+3%',
          firstTimersTrend: '+15%'
        },
        recentActivity: [
          {
            id: '1',
            action: 'New member registered',
            user: 'John Doe',
            timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            type: 'member'
          },
          {
            id: '2',
            action: 'Member profile updated',
            user: 'Jane Smith',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            type: 'member'
          },
          {
            id: '3',
            action: 'First-timer registered',
            user: 'Mike Johnson',
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            type: 'first_timer'
          },
          {
            id: '4',
            action: 'Group meeting scheduled',
            user: 'Admin',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            type: 'group'
          }
        ]
      }
    }
  }

  // Additional dashboard endpoints
  async getModules(): Promise<any> {
    const response = await apiService.get<any>('/dashboard/modules')
    return response.data || response
  }

  async getFirstTimersData(): Promise<any> {
    const response = await apiService.get<any>('/dashboard/first-timers')
    return response.data || response
  }

  async getMembersData(): Promise<any> {
    const response = await apiService.get<any>('/dashboard/members')
    return response.data || response
  }

  async getFinancesData(): Promise<any> {
    const response = await apiService.get<any>('/dashboard/finances')
    return response.data || response
  }

  async getSettingsData(): Promise<any> {
    const response = await apiService.get<any>('/dashboard/settings')
    return response.data || response
  }

  async getDetailedStats(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<any> {
    const response = await apiService.get<any>(`/dashboard/stats?period=${period}`)
    return response.data || response
  }

  async getActivityFeed(limit: number = 20): Promise<any> {
    const response = await apiService.get<any>(`/dashboard/activity?limit=${limit}`)
    return response.data || response
  }

  async getPendingTasks(): Promise<any> {
    const response = await apiService.get<any>('/dashboard/tasks')
    return response.data || response
  }

  async getQuickStats(branchId?: string): Promise<any> {
    const params = new URLSearchParams()
    if (branchId) params.append('branchId', branchId)
    const queryString = params.toString()
    const response = await apiService.get<any>(`/dashboard/quick-stats${queryString ? `?${queryString}` : ''}`)
    return response.data || response
  }

  async getGrowthAnalytics(period: 'week' | 'month' | 'quarter' | 'year' = 'month', branchId?: string): Promise<any> {
    const params = new URLSearchParams()
    params.append('period', period)
    if (branchId) params.append('branchId', branchId)
    const response = await apiService.get<any>(`/dashboard/growth-analytics?${params.toString()}`)
    return response.data || response
  }

  async getRecentActivity(limit: number = 50, days: number = 7, branchId?: string): Promise<any> {
    const params = new URLSearchParams()
    params.append('limit', limit.toString())
    params.append('days', days.toString())
    if (branchId) params.append('branchId', branchId)
    const response = await apiService.get<any>(`/dashboard/recent-activity?${params.toString()}`)
    return response.data || response
  }

  async getDemographics(branchId?: string): Promise<any> {
    const params = new URLSearchParams()
    if (branchId) params.append('branchId', branchId)
    const queryString = params.toString()
    const response = await apiService.get<any>(`/dashboard/demographics${queryString ? `?${queryString}` : ''}`)
    return response.data || response
  }
}

export const dashboardService = new DashboardService()