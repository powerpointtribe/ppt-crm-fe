import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsService } from '@/services/events'
import { Event, EventRegistration, RegistrationStatus } from '@/types/event'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Search, Download, Mail, MoreVertical, Filter, X } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  eventId: string
  event: Event
}

export default function RegistrationsManagement({ eventId, event }: Props) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [trackFilter, setTrackFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkEmailDialog, setShowBulkEmailDialog] = useState(false)

  // Fetch registrations
  const { data, isLoading } = useQuery({
    queryKey: ['event-registrations', eventId, search, statusFilter, trackFilter, page],
    queryFn: () =>
      eventsService.getEventRegistrationsAdmin(eventId, {
        search,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit: 20,
      }),
    enabled: !!eventId,
  })

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: (format: 'csv' | 'xlsx') =>
      eventsService.exportRegistrations(eventId, format),
    onSuccess: (blob, format) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `registrations-${eventId}-${Date.now()}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Export downloaded successfully')
    },
    onError: () => {
      toast.error('Failed to export registrations')
    },
  })

  // Bulk email mutation
  const bulkEmailMutation = useMutation({
    mutationFn: (data: { subject: string; message: string }) =>
      eventsService.sendBulkRegistrationEmail(eventId, {
        ...data,
        registrationIds: Array.from(selectedIds),
      }),
    onSuccess: (result) => {
      toast.success(`Email queued for ${result.recipientCount} registrants`)
      setShowBulkEmailDialog(false)
      setSelectedIds(new Set())
    },
    onError: () => {
      toast.error('Failed to send bulk email')
    },
  })

  const registrations = data?.data || []
  const pagination = data?.pagination

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      attended: 'bg-emerald-100 text-emerald-800',
      waitlisted: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      'no-show': 'bg-gray-100 text-gray-800',
    }
    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {status.replace(/-/g, ' ')}
      </Badge>
    )
  }

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedIds(newSelection)
  }

  const toggleAllSelection = () => {
    if (selectedIds.size === registrations.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(registrations.map((r) => r._id)))
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters & Actions */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="attended">Attended</SelectItem>
                <SelectItem value="waitlisted">Waitlisted</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no-show">No Show</SelectItem>
              </SelectContent>
            </Select>

            <Select value={trackFilter} onValueChange={setTrackFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Track" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tracks</SelectItem>
                <SelectItem value="Professional">Professional</SelectItem>
                <SelectItem value="Entrepreneur">Entrepreneur</SelectItem>
              </SelectContent>
            </Select>

            {(search || statusFilter !== 'all' || trackFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('all')
                  setTrackFilter('all')
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkEmailDialog(true)}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email ({selectedIds.size})
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => exportMutation.mutate('xlsx')}>
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportMutation.mutate('csv')}>
                  CSV (.csv)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.size === registrations.length && registrations.length > 0}
                  onCheckedChange={toggleAllSelection}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Track</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered</TableHead>
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
            ) : registrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No registrations found
                </TableCell>
              </TableRow>
            ) : (
              registrations.map((reg: EventRegistration) => (
                <TableRow key={reg._id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(reg._id)}
                      onCheckedChange={() => toggleSelection(reg._id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {reg.attendeeInfo.firstName} {reg.attendeeInfo.lastName}
                  </TableCell>
                  <TableCell>{reg.attendeeInfo.email || '-'}</TableCell>
                  <TableCell>{reg.attendeeInfo.phone || '-'}</TableCell>
                  <TableCell>
                    {reg.customFieldResponses?.get?.('track') || '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(reg.status)}</TableCell>
                  <TableCell>
                    {new Date(reg.registeredAt).toLocaleDateString()}
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
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Send Email</DropdownMenuItem>
                        <DropdownMenuItem>Update Status</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          Delete
                        </DropdownMenuItem>
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
              Showing {registrations.length} of {pagination.total} registrations
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

      {/* Bulk Email Dialog */}
      <Dialog open={showBulkEmailDialog} onOpenChange={setShowBulkEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email to {selectedIds.size} Registrants</DialogTitle>
            <DialogDescription>
              Compose and send a bulk email to selected registrants
            </DialogDescription>
          </DialogHeader>
          {/* Email form would go here */}
          <p className="text-sm text-muted-foreground">
            Email composer form to be implemented
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
