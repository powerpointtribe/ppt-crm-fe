import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { eventsService } from '@/services/events'
import { Event } from '@/types/event'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  UserCheck,
  Handshake,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface Props {
  eventId: string
  event: Event
}

export default function EventAnalyticsTab({ eventId, event }: Props) {
  // Fetch analytics data
  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['event-overview', eventId],
    queryFn: () => eventsService.getEventOverviewAdmin(eventId),
  })

  const { data: partnerAnalytics, isLoading: partnerLoading } = useQuery({
    queryKey: ['partner-analytics', eventId],
    queryFn: () => eventsService.getPartnerAnalytics(eventId),
  })

  const isLoading = overviewLoading || partnerLoading

  // Calculate metrics
  const totalRegistrations = overviewData?.stats?.totalRegistrations || 0
  const checkedInCount = overviewData?.stats?.checkedInCount || 0
  const checkInRate = totalRegistrations > 0 ? ((checkedInCount / totalRegistrations) * 100).toFixed(1) : '0.0'

  const totalPartners = partnerAnalytics?.total || 0
  const confirmedPartners = partnerAnalytics?.byStatus?.confirmed || 0
  const conversionRate = totalPartners > 0 ? ((confirmedPartners / totalPartners) * 100).toFixed(1) : '0.0'

  // Prepare chart data
  const trackData = overviewData?.trackDistribution
    ? Object.entries(overviewData.trackDistribution).map(([name, value]) => ({
        name,
        value,
      }))
    : []

  const statusData = overviewData?.statusBreakdown
    ? Object.entries(overviewData.statusBreakdown).map(([name, value]) => ({
        name: name.replace(/-/g, ' '),
        count: value,
      }))
    : []

  const partnerPipelineData = partnerAnalytics?.byStatus
    ? [
        { name: 'Pending', value: partnerAnalytics.byStatus.pending || 0 },
        { name: 'Contacted', value: partnerAnalytics.byStatus.contacted || 0 },
        { name: 'In Discussion', value: partnerAnalytics.byStatus.in_discussion || 0 },
        { name: 'Confirmed', value: partnerAnalytics.byStatus.confirmed || 0 },
        { name: 'Declined', value: partnerAnalytics.byStatus.declined || 0 },
      ]
    : []

  const registrationTrendData = overviewData?.registrationTrend || []

  // Colors
  const TRACK_COLORS = ['#8b5cf6', '#06b6d4']
  const STATUS_COLORS = ['#6366f1', '#10b981', '#14b8a6', '#f59e0b', '#ef4444', '#6b7280']
  const PIPELINE_COLORS = ['#9ca3af', '#3b82f6', '#f59e0b', '#10b981', '#ef4444']

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Total Registrations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegistrations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {overviewData?.stats?.confirmedCount || 0} confirmed
            </p>
          </CardContent>
        </Card>

        {/* Check-in Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-in Rate</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkInRate}%</div>
            <p className="text-xs text-muted-foreground">
              {checkedInCount} checked in
            </p>
          </CardContent>
        </Card>

        {/* Partner Inquiries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partner Inquiries</CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPartners}</div>
            <p className="text-xs text-muted-foreground">
              {partnerAnalytics?.byStatus?.pending || 0} pending
            </p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {confirmedPartners} confirmed partners
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Registration Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Registration Trend</CardTitle>
            <CardDescription>Registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            {registrationTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={registrationTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Registrations"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Track Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Track Distribution</CardTitle>
            <CardDescription>Professional vs Entrepreneur</CardDescription>
          </CardHeader>
          <CardContent>
            {trackData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={trackData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {trackData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={TRACK_COLORS[index % TRACK_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No track data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Registration Status</CardTitle>
            <CardDescription>Breakdown by status</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" name="Count">
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No status data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Partner Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle>Partner Pipeline</CardTitle>
            <CardDescription>Partnership inquiry status</CardDescription>
          </CardHeader>
          <CardContent>
            {partnerPipelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={partnerPipelineData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" name="Count">
                    {partnerPipelineData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIPELINE_COLORS[index % PIPELINE_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No partner data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Confirmed Registrations
              </div>
              <div className="text-2xl font-bold">
                {overviewData?.stats?.confirmedCount || 0}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-yellow-600" />
                Pending Registrations
              </div>
              <div className="text-2xl font-bold">
                {overviewData?.stats?.pendingCount || 0}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <XCircle className="h-4 w-4 text-red-600" />
                Cancelled Registrations
              </div>
              <div className="text-2xl font-bold">
                {overviewData?.stats?.cancelledCount || 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
