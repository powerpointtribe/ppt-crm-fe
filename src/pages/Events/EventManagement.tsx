import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { eventsService } from '@/services/events'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, Users, Handshake, Mail, BarChart3, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import RegistrationsManagement from './RegistrationsManagement'
import PartnersManagement from './PartnersManagement'
import EmailComposer from './EmailComposer'
import EventAnalyticsTab from './EventAnalyticsTab'

export default function EventManagement() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsService.getEventById(eventId!),
    enabled: !!eventId,
  })

  // Fetch overview stats
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['event-overview', eventId],
    queryFn: () => eventsService.getEventOverviewAdmin(eventId!),
    enabled: !!eventId,
  })

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Event not found</p>
        <Button onClick={() => navigate('/events')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/events')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
          </div>
          <p className="text-muted-foreground">
            Manage registrations, partners, and communications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {new Date(event.startDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      {overview && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overview.registrations?.totalRegistrations || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {overview.registrations?.confirmedCount || 0} confirmed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Check-In Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overview.registrations?.checkInRate || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {overview.registrations?.attendedCount || 0} attended
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Partner Inquiries</CardTitle>
              <Handshake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overview.partners?.totalInquiries || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {overview.partners?.statusBreakdown?.confirmed || 0} confirmed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overview.partners?.conversionRate || 0}%
              </div>
              <p className="text-xs text-muted-foreground">Partner success rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="registrations">
            <Users className="h-4 w-4 mr-2" />
            Registrations
          </TabsTrigger>
          <TabsTrigger value="partners">
            <Handshake className="h-4 w-4 mr-2" />
            Partners
          </TabsTrigger>
          <TabsTrigger value="emails">
            <Mail className="h-4 w-4 mr-2" />
            Emails
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <EventAnalyticsTab eventId={eventId!} />
        </TabsContent>

        <TabsContent value="registrations">
          <RegistrationsManagement eventId={eventId!} event={event} />
        </TabsContent>

        <TabsContent value="partners">
          <PartnersManagement eventId={eventId!} event={event} />
        </TabsContent>

        <TabsContent value="emails">
          <EmailComposer eventId={eventId!} event={event} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
