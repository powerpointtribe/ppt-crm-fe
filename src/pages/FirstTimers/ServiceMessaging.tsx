import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { showToast } from '@/utils/toast'
import { firstTimersService } from '@/services/first-timers'
import {
  MessageCircle,
  Clock,
  Send,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react'
import { formatDate, formatDateTime, formatDateTimeLocal } from '@/utils/formatters'

interface ServiceMessage {
  _id: string
  date: string
  message: string
  scheduledTime?: string
  sentAt?: string
  autoSend: boolean
  isSent: boolean
  recipientCount: number
  sentCount: number
  status: 'draft' | 'scheduled' | 'sent' | 'failed'
  createdBy: {
    firstName: string
    lastName: string
  }
  createdAt: string
}

interface ServiceDay {
  date: string
  dayName: string
  firstTimersCount: number
  hasMessage: boolean
  message?: ServiceMessage
}

interface FirstTimerSummary {
  _id: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  messageSent: boolean
  messageSentAt?: string
}

export default function ServiceMessaging() {
  const [serviceDays, setServiceDays] = useState<ServiceDay[]>([])
  const [selectedService, setSelectedService] = useState<ServiceDay | null>(null)
  const [firstTimers, setFirstTimers] = useState<FirstTimerSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  // Modal states
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  // Form states
  const [message, setMessage] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [autoSend, setAutoSend] = useState(true)

  useEffect(() => {
    loadServiceDays()
  }, [])

  const loadServiceDays = async () => {
    setLoading(true)
    try {
      // Get service days (last 4 weeks of Sundays and Wednesdays)
      const serviceDays = getServiceDays()

      // Load data for each service day
      const serviceDaysWithData = await Promise.all(
        serviceDays.map(async (day) => {
          try {
            // Get first timers for this date
            const firstTimersResponse = await firstTimersService.getFirstTimers({
              visitDateFrom: day.date,
              visitDateTo: day.date,
              limit: 10
            })

            // Check for existing message or auto-create entry
            let message: ServiceMessage | undefined
            try {
              // This now auto-creates draft entries if first timers exist but no message entry exists
              message = await firstTimersService.getDailyMessage(day.date)
            } catch (error) {
              // Error getting/creating message
              console.error(`Failed to get/create daily message for ${day.date}:`, error)
            }

            return {
              ...day,
              firstTimersCount: firstTimersResponse.items.length,
              hasMessage: !!message,
              message
            }
          } catch (error) {
            console.error(`Failed to load data for ${day.date}:`, error)
            return {
              ...day,
              firstTimersCount: 0,
              hasMessage: false
            }
          }
        })
      )

      // Filter out days with no first timers
      const serviceDaysWithFirstTimers = serviceDaysWithData.filter(day => day.firstTimersCount > 0)
      setServiceDays(serviceDaysWithFirstTimers)
    } catch (error) {
      console.error('Failed to load service days:', error)
      showToast('error', 'Failed to load service days')
    } finally {
      setLoading(false)
    }
  }

  const getServiceDays = () => {
    const days: Array<{date: string, dayName: string}> = []
    const today = new Date()

    // Get last 8 weeks of service days
    for (let week = 0; week < 8; week++) {
      // Sunday
      const sunday = new Date(today)
      sunday.setDate(today.getDate() - today.getDay() - (week * 7))

      // Wednesday
      const wednesday = new Date(sunday)
      wednesday.setDate(sunday.getDate() + 3)

      // Only include past and current dates
      if (sunday <= today) {
        days.push({
          date: sunday.toISOString().split('T')[0],
          dayName: `Sunday ${formatDate(sunday.toISOString())}`
        })
      }

      if (wednesday <= today) {
        days.push({
          date: wednesday.toISOString().split('T')[0],
          dayName: `Wednesday ${formatDate(wednesday.toISOString())}`
        })
      }
    }

    // Sort by date descending (most recent first)
    return days.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const loadFirstTimersForService = async (serviceDay: ServiceDay) => {
    try {
      const response = await firstTimersService.getFirstTimers({
        visitDateFrom: serviceDay.date,
        visitDateTo: serviceDay.date,
        limit: 10
      })
      setFirstTimers(response.items)
    } catch (error) {
      console.error('Failed to load first timers:', error)
      showToast('error', 'Failed to load first timers')
    }
  }

  const handleAddMessage = (serviceDay: ServiceDay) => {
    setSelectedService(serviceDay)
    setModalMode('create')
    setMessage('')
    setScheduledTime('')
    setAutoSend(true)
    setShowMessageModal(true)
    loadFirstTimersForService(serviceDay)
  }

  const handleEditMessage = (serviceDay: ServiceDay) => {
    setSelectedService(serviceDay)
    setModalMode('edit')
    if (serviceDay.message) {
      setMessage(serviceDay.message.message)
      setScheduledTime(serviceDay.message.scheduledTime
        ? formatDateTimeLocal(new Date(serviceDay.message.scheduledTime))
        : ''
      )
      setAutoSend(serviceDay.message.autoSend)
    }
    setShowMessageModal(true)
    loadFirstTimersForService(serviceDay)
  }

  const handleViewMessage = (serviceDay: ServiceDay) => {
    setSelectedService(serviceDay)
    setShowViewModal(true)
    loadFirstTimersForService(serviceDay)
  }

  const handleDeleteMessage = (serviceDay: ServiceDay) => {
    setSelectedService(serviceDay)
    setShowDeleteConfirm(true)
  }

  const handleSaveMessage = async () => {
    if (!selectedService || !message.trim()) {
      showToast('error', 'Message content is required')
      return
    }

    setSending(true)
    try {
      const firstTimerIds = firstTimers.map(ft => ft._id)

      if (modalMode === 'create') {
        // Create new message
        await firstTimersService.createDailyMessage({
          date: selectedService.date,
          message,
          scheduledTime: scheduledTime || undefined,
          autoSend,
          firstTimerIds
        })
        showToast('success', 'Message created successfully')
      } else {
        // Update existing message
        if (selectedService.message) {
          await firstTimersService.updateDailyMessage(selectedService.message._id, {
            message,
            scheduledTime: scheduledTime || undefined,
            autoSend
          })
          showToast('success', 'Message updated successfully')
        }
      }

      setShowMessageModal(false)
      loadServiceDays()
    } catch (error) {
      console.error('Failed to save message:', error)
      showToast('error', 'Failed to save message')
    } finally {
      setSending(false)
    }
  }

  const handleSendNow = async () => {
    if (!selectedService?.message) return

    setSending(true)
    try {
      await firstTimersService.sendDailyMessageNow(selectedService.message._id)
      showToast('success', 'Message sent successfully')
      setShowViewModal(false)
      loadServiceDays()
    } catch (error) {
      console.error('Failed to send message:', error)
      showToast('error', 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedService?.message) return

    try {
      await firstTimersService.deleteDailyMessage(selectedService.message._id)
      showToast('success', 'Message deleted successfully')
      setShowDeleteConfirm(false)
      loadServiceDays()
    } catch (error) {
      console.error('Failed to delete message:', error)
      showToast('error', 'Failed to delete message')
    }
  }

  const getStatusBadge = (message?: ServiceMessage) => {
    if (!message) return <Badge variant="outline">No Message</Badge>

    switch (message.status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800">Sent</Badge>
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
      case 'draft':
        // Show different badge for auto-generated draft vs manually created
        if (!message.message || message.message.trim() === '') {
          return <Badge className="bg-yellow-100 text-yellow-800">Ready to Message</Badge>
        }
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge variant="secondary">{message.status}</Badge>
    }
  }

  const getDefaultScheduledTime = () => {
    if (!selectedService) return ''

    const serviceDate = new Date(selectedService.date)
    const today = new Date()

    // If service date is today
    if (serviceDate.toDateString() === today.toDateString()) {
      const now = new Date()
      const todayAt7PM = new Date()
      todayAt7PM.setHours(19, 0, 0, 0)

      if (now > todayAt7PM) {
        // 2 hours from now
        const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)
        return formatDateTimeLocal(twoHoursLater)
      } else {
        return formatDateTimeLocal(todayAt7PM)
      }
    } else {
      // For past service dates, default to 7PM on that date
      const scheduledDate = new Date(selectedService.date)
      scheduledDate.setHours(19, 0, 0, 0)
      return formatDateTimeLocal(scheduledDate)
    }
  }

  return (
    <Layout
      title="Service Messaging"
      subtitle="Manage messages for first timers from service days"
    >
      <div className="space-y-6">
        {/* Service Days List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Service Days
            </h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="space-y-4">
              {serviceDays.map((serviceDay) => (
                <motion.div
                  key={serviceDay.date}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="h-5 w-5 text-gray-500" />
                        <h4 className="font-medium">{serviceDay.dayName}</h4>
                        {getStatusBadge(serviceDay.message)}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {serviceDay.firstTimersCount} first timers
                        </span>

                        {serviceDay.message && (
                          <>
                            {serviceDay.message.scheduledTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                Scheduled: {formatDateTime(serviceDay.message.scheduledTime)}
                              </span>
                            )}
                            {serviceDay.message.sentAt && (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                Sent: {formatDateTime(serviceDay.message.sentAt)}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-4 w-4" />
                              {serviceDay.message.sentCount}/{serviceDay.message.recipientCount} sent
                            </span>
                          </>
                        )}
                      </div>

                      {serviceDay.message && (
                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                          {serviceDay.message.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {serviceDay.hasMessage ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewMessage(serviceDay)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditMessage(serviceDay)}
                            disabled={serviceDay.message?.status === 'sent'}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMessage(serviceDay)}
                            disabled={serviceDay.message?.status === 'sent'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAddMessage(serviceDay)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Message
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {serviceDays.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="font-medium">No service days with first timers found</p>
                  <p className="text-sm mt-1">Service days will only appear here when they have first-time visitors</p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Add/Edit Message Modal */}
        <Modal
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          title={modalMode === 'create' ? 'Add Message' : 'Edit Message'}
        >
          <div className="space-y-4">
            {selectedService && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">{selectedService.dayName}</span>
                </div>
                <div className="text-sm text-blue-600 mt-1">
                  {firstTimers.length} first timers will receive this message
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Content
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                rows={4}
                placeholder="Enter your message for first timers..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={autoSend}
                    onChange={(e) => setAutoSend(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Send immediately</span>
                </label>
                {!autoSend && (
                  <Input
                    label="Schedule Time"
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    placeholder={getDefaultScheduledTime()}
                  />
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowMessageModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveMessage}
                loading={sending}
                disabled={!message.trim()}
              >
                {modalMode === 'create' ? (
                  autoSend ? (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Create & Send
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Create & Schedule
                    </>
                  )
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Update Message
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>

        {/* View Message Modal */}
        <Modal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          title="Message Details"
        >
          {selectedService?.message && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{selectedService.dayName}</h4>
                  {getStatusBadge(selectedService.message)}
                </div>
                <p className="text-gray-700 mb-3">{selectedService.message.message}</p>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Recipients:</span> {selectedService.message.recipientCount}
                  </div>
                  <div>
                    <span className="font-medium">Sent:</span> {selectedService.message.sentCount}
                  </div>
                  {selectedService.message.scheduledTime && (
                    <div className="col-span-2">
                      <span className="font-medium">Scheduled:</span> {formatDateTime(selectedService.message.scheduledTime)}
                    </div>
                  )}
                  {selectedService.message.sentAt && (
                    <div className="col-span-2">
                      <span className="font-medium">Sent at:</span> {formatDateTime(selectedService.message.sentAt)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </Button>
                {selectedService.message.status === 'scheduled' && (
                  <Button
                    onClick={handleSendNow}
                    loading={sending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Now
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Delete Message"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
              >
                Delete Message
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  )
}