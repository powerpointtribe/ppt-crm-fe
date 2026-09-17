export interface GisMetrics {
  totalActiveMembers: number
  avgSundayAttendance: number
  firstTimerCount: number
  firstTimerConversionRate: number
  retentionRate90Day: number
  smallGroupParticipationRate: number
  servingRate: number
  newMembersThisMonth: number
  inactiveMembers: number
  baptismRate: number
  leadershipPipelineCount: number
  growthRate: number
  avgEngagementScore: number
  attritionCount: number
  followUpRate: number
}

export interface GisFunnel {
  reach: number
  visit: number
  connect: number
  belong: number
  grow: number
  serve: number
  lead: number
  multiply: number
}

export interface GisDashboard {
  metrics: GisMetrics
  funnel: GisFunnel
}

export interface GisDistrictBreakdown {
  districtId: string
  districtName: string
  memberCount: number
  avgAttendance: number
  firstTimerCount: number
  conversionRate: number
  engagementScore: number
}

export interface GisSnapshot {
  _id: string
  branch: string
  snapshotDate: string
  period: 'weekly' | 'monthly'
  metrics: GisMetrics
  funnelCounts: GisFunnel
  districtBreakdowns: GisDistrictBreakdown[]
  createdAt: string
}

export interface GisDistrictView {
  district: { id: string; name: string }
  memberCount: number
  metrics: {
    retentionRate: number
    inactiveCount: number
    servingRate: number
    avgEngagementScore: number
    conversionsFromFirstTimers: number
  } | null
}

export interface GisUnitView {
  unit: { id: string; name: string; type: string }
  memberCount: number
  metrics: {
    activeRate: number
    avgEngagementScore: number
  }
}

export interface GisDirectorateView {
  directorate: { id: string; name: string }
  totalMembers: number
  districtCount: number
  districts: GisDistrictView[]
}

export interface GisMemberJourney {
  member: {
    id: string
    name: string
    status: string
    dateJoined: string
  }
  funnelStage: string
  engagement: {
    lastAttendance?: string
    attendanceCount: number
    engagementScore: number
  }
  spiritualJourney: {
    foundationClass: { completed: boolean; completionDate?: string }
    baptismClass: { completed: boolean; completionDate?: string }
    membershipClass: { completed: boolean; completionDate?: string }
    leadershipClass: { completed: boolean; completionDate?: string }
  }
  attendance90Days: number
  inTraining: boolean
  district: { _id: string; name: string } | null
  unit: { _id: string; name: string } | null
  firstTimerOrigin: {
    visitDate: string
    conversionDate: string
    followUps: number
  } | null
}

export const FUNNEL_STAGES = [
  { key: 'reach', label: 'Reach', color: '#94A3B8' },
  { key: 'visit', label: 'Visit', color: '#6366F1' },
  { key: 'connect', label: 'Connect', color: '#8B5CF6' },
  { key: 'belong', label: 'Belong', color: '#06B6D4' },
  { key: 'grow', label: 'Grow', color: '#10B981' },
  { key: 'serve', label: 'Serve', color: '#F59E0B' },
  { key: 'lead', label: 'Lead', color: '#EF4444' },
  { key: 'multiply', label: 'Multiply', color: '#EC4899' },
] as const

export type FunnelStageKey = (typeof FUNNEL_STAGES)[number]['key']
