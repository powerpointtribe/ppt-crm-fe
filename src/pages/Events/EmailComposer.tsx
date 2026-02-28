import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { eventsService } from '@/services/events'
import { Event } from '@/types/event'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Mail, Users, Handshake, Send, Info } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  eventId: string
  event: Event
}

export default function EmailComposer({ eventId, event }: Props) {
  const [recipient Type, setRecipientType] = useState<'registrations' | 'partners'>('registrations')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Send to registrations
  const sendToRegistrationsMutation = useMutation({
    mutationFn: (data: { subject: string; message: string; statuses?: string[] }) =>
      eventsService.sendBulkRegistrationEmail(eventId, data),
    onSuccess: (result) => {
      toast.success(`Email queued for ${result.recipientCount} registrants`)
      setSubject('')
      setMessage('')
    },
    onError: () => {
      toast.error('Failed to send email')
    },
  })

  // Send to partners
  const sendToPartnersMutation = useMutation({
    mutationFn: (data: { subject: string; message: string; statuses?: string[] }) =>
      eventsService.sendBulkPartnerEmail(eventId, data),
    onSuccess: (result) => {
      toast.success(`Email queued for ${result.recipientCount} partners`)
      setSubject('')
      setMessage('')
    },
    onError: () => {
      toast.error('Failed to send email')
    },
  })

  const handleSend = () => {
    if (!subject || !message) {
      toast.error('Please fill in subject and message')
      return
    }

    const data = {
      subject,
      message,
      statuses: statusFilter !== 'all' ? [statusFilter] : undefined,
    }

    if (recipientType === 'registrations') {
      sendToRegistrationsMutation.mutate(data)
    } else {
      sendToPartnersMutation.mutate(data)
    }
  }

  const isPending =
    sendToRegistrationsMutation.isPending || sendToPartnersMutation.isPending

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Main Composer */}
      <div className="md:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Compose Email</CardTitle>
            <CardDescription>
              Send bulk emails to registrants or partners
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recipient Type */}
            <Tabs value={recipientType} onValueChange={(v: any) => setRecipientType(v)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="registrations">
                  <Users className="h-4 w-4 mr-2" />
                  Registrants
                </TabsTrigger>
                <TabsTrigger value="partners">
                  <Handshake className="h-4 w-4 mr-2" />
                  Partners
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Recipient Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {recipientType === 'registrations' ? (
                    <>
                      <SelectItem value="confirmed">Confirmed Only</SelectItem>
                      <SelectItem value="pending">Pending Only</SelectItem>
                      <SelectItem value="attended">Attended Only</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="pending">Pending Only</SelectItem>
                      <SelectItem value="contacted">Contacted Only</SelectItem>
                      <SelectItem value="confirmed">Confirmed Only</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here... Use variables like {{firstName}}, {{lastName}}, {{checkInCode}}"
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSubject('')
                  setMessage('')
                }}
              >
                Clear
              </Button>
              <Button onClick={handleSend} disabled={isPending}>
                <Send className="h-4 w-4 mr-2" />
                {isPending ? 'Sending...' : 'Send Email'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Variables */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Template Variables</CardTitle>
            <CardDescription>
              Available variables for {recipientType}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <div className="font-mono text-xs space-y-1">
                <div>
                  <Badge variant="secondary">{'{{firstName}}'}</Badge>
                  <p className="text-muted-foreground mt-1">First name</p>
                </div>
                <div className="mt-2">
                  <Badge variant="secondary">{'{{lastName}}'}</Badge>
                  <p className="text-muted-foreground mt-1">Last name</p>
                </div>
                {recipientType === 'registrations' && (
                  <>
                    <div className="mt-2">
                      <Badge variant="secondary">{'{{checkInCode}}'}</Badge>
                      <p className="text-muted-foreground mt-1">QR check-in code</p>
                    </div>
                    <div className="mt-2">
                      <Badge variant="secondary">{'{{track}}'}</Badge>
                      <p className="text-muted-foreground mt-1">
                        Professional/Entrepreneur
                      </p>
                    </div>
                  </>
                )}
                {recipientType === 'partners' && (
                  <div className="mt-2">
                    <Badge variant="secondary">{'{{company}}'}</Badge>
                    <p className="text-muted-foreground mt-1">Company name</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Info className="h-4 w-4" />
              Important Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <ul className="list-disc list-inside space-y-1">
              <li>Emails are queued and sent in batches</li>
              <li>Processing may take a few minutes</li>
              <li>Variables are automatically replaced</li>
              <li>Recipients can't see each other's emails</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
