import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsService } from '@/services/events'
import { Event, EventPartner, PartnerStatus } from '@/types/event'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Search, MoreVertical, X, Mail, User } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  eventId: string
  event: Event
}

export default function PartnersManagement({ eventId, event }: Props) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [selectedPartner, setSelectedPartner] = useState<EventPartner | null>(null)
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [contactForm, setContactForm] = useState({ subject: '', message: '' })
  const [statusForm, setStatusForm] = useState({ status: '', notes: '' })

  // Fetch partners
  const { data, isLoading } = useQuery({
    queryKey: ['event-partners', eventId, search, statusFilter, page],
    queryFn: () =>
      eventsService.getEventPartners(eventId, {
        search,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit: 20,
      }),
    enabled: !!eventId,
  })

  // Contact partner mutation
  const contactMutation = useMutation({
    mutationFn: (data: { subject: string; message: string }) =>
      eventsService.contactPartner(eventId, selectedPartner!._id, {
        ...data,
        updateStatus: PartnerStatus.CONTACTED,
      }),
    onSuccess: () => {
      toast.success('Email sent successfully')
      setShowContactDialog(false)
      setContactForm({ subject: '', message: '' })
      queryClient.invalidateQueries({ queryKey: ['event-partners', eventId] })
    },
    onError: () => {
      toast.error('Failed to send email')
    },
  })

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (data: { status: string; notes?: string }) =>
      eventsService.updatePartnerStatus(eventId, selectedPartner!._id, data),
    onSuccess: () => {
      toast.success('Status updated successfully')
      setShowStatusDialog(false)
      setStatusForm({ status: '', notes: '' })
      queryClient.invalidateQueries({ queryKey: ['event-partners', eventId] })
    },
    onError: () => {
      toast.error('Failed to update status')
    },
  })

  const partners = data?.data || []
  const pagination = data?.pagination

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800',
      contacted: 'bg-blue-100 text-blue-800',
      in_discussion: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
    }
    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {status.replace(/_/g, ' ')}
      </Badge>
    )
  }

  const openContactDialog = (partner: EventPartner) => {
    setSelectedPartner(partner)
    setContactForm({
      subject: `Partnership Opportunity - ${event.title}`,
      message: `Dear ${partner.name},\n\nThank you for your interest in partnering with us for ${event.title}.\n\n`,
    })
    setShowContactDialog(true)
  }

  const openStatusDialog = (partner: EventPartner) => {
    setSelectedPartner(partner)
    setStatusForm({ status: partner.status, notes: partner.notes || '' })
    setShowStatusDialog(true)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, company, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="in_discussion">In Discussion</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>

            {(search || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('all')
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : partners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No partnership inquiries found
                </TableCell>
              </TableRow>
            ) : (
              partners.map((partner: EventPartner) => (
                <TableRow key={partner._id}>
                  <TableCell className="font-medium">{partner.name}</TableCell>
                  <TableCell>{partner.company || '-'}</TableCell>
                  <TableCell>{partner.email}</TableCell>
                  <TableCell>{partner.phone}</TableCell>
                  <TableCell>{getStatusBadge(partner.status)}</TableCell>
                  <TableCell>
                    {new Date(partner.submittedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {partner.assignedTo
                      ? `${partner.assignedTo.firstName} ${partner.assignedTo.lastName}`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openContactDialog(partner)}>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openStatusDialog(partner)}>
                          <User className="h-4 w-4 mr-2" />
                          Update Status
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {partners.length} of {pagination.total} partners
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === pagination.pages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Contact Partner</DialogTitle>
            <DialogDescription>
              Send an email to {selectedPartner?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={contactForm.subject}
                onChange={(e) =>
                  setContactForm({ ...contactForm, subject: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={contactForm.message}
                onChange={(e) =>
                  setContactForm({ ...contactForm, message: e.target.value })
                }
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => contactMutation.mutate(contactForm)}
              disabled={contactMutation.isPending}
            >
              {contactMutation.isPending ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Partner Status</DialogTitle>
            <DialogDescription>
              Update the status for {selectedPartner?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={statusForm.status}
                onValueChange={(value) =>
                  setStatusForm({ ...statusForm, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="in_discussion">In Discussion</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={statusForm.notes}
                onChange={(e) =>
                  setStatusForm({ ...statusForm, notes: e.target.value })
                }
                rows={4}
                placeholder="Add notes about this partner..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateStatusMutation.mutate(statusForm)}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
