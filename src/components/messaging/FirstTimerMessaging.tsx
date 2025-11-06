import React, { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { showToast } from '@/utils/toast'
import { firstTimersService } from '@/services/first-timers'
import {
  MessageCircle,
  Clock,
  Send,
  Edit,
  Trash2,
  Plus,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { formatDateTime, formatDateTimeLocal, formatFullDateTime } from '@/utils/formatters'

interface MessageHistoryItem {
  _id: string
  message: string
  scheduledTime: string
  sentAt?: string
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled'
  isSent: boolean
  isCancelled: boolean
  createdBy?: {
    firstName: string
    lastName: string
  }
  editedBy?: {
    firstName: string
    lastName: string
  }
  editedAt?: string
  failureReason?: string
  createdAt: string
}

interface ScheduledMessage {
  _id: string
  message: string
  scheduledTime: string
  status: string
  createdBy?: {
    firstName: string
    lastName: string
  }
}

interface FirstTimerMessagingProps {
  firstTimerId: string
  firstTimerName: string
}

export const FirstTimerMessaging: React.FC<FirstTimerMessagingProps> = ({
  firstTimerId,
  firstTimerName,
}) => {
  const [messageHistory, setMessageHistory] = useState<MessageHistoryItem[]>([])
  const [scheduledMessage, setScheduledMessage] = useState<ScheduledMessage | null>(null)
  const [loading, setLoading] = useState(false)
  const [showNewMessageModal, setShowNewMessageModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // Form states
  const [newMessage, setNewMessage] = useState('')
  const [newScheduledTime, setNewScheduledTime] = useState('')
  const [editMessage, setEditMessage] = useState('')
  const [editScheduledTime, setEditScheduledTime] = useState('')

  useEffect(() => {
    loadMessageData()
  }, [firstTimerId])

  const loadMessageData = async () => {
    setLoading(true)
    try {
      const [history, scheduled] = await Promise.all([
        firstTimersService.getMessageHistory(firstTimerId),
        firstTimersService.getScheduledMessage(firstTimerId)
      ])

      setMessageHistory(history || [])
      setScheduledMessage(scheduled)
    } catch (error) {
      console.error('Failed to load message data:', error)
      showToast('error', 'Failed to load message data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMessage = async () => {
    if (!newMessage.trim()) {
      showToast('error', 'Message content is required')
      return
    }

    try {
      await firstTimersService.setPreFilledMessage(
        firstTimerId,
        newMessage,
        newScheduledTime || undefined
      )

      showToast('success', 'Message scheduled successfully')

      setNewMessage('')
      setNewScheduledTime('')
      setShowNewMessageModal(false)
      loadMessageData()
    } catch (error) {
      console.error('Failed to create message:', error)
      showToast('error', 'Failed to schedule message')
    }
  }

  const handleEditMessage = async () => {
    if (!editMessage.trim()) {
      showToast('error', 'Message content is required')
      return
    }

    try {
      await firstTimersService.editScheduledMessage(
        firstTimerId,
        editMessage,
        editScheduledTime || undefined
      )

      showToast('success', 'Message updated successfully')

      setEditMessage('')
      setEditScheduledTime('')
      setShowEditModal(false)
      loadMessageData()
    } catch (error) {
      console.error('Failed to edit message:', error)
      showToast('error', 'Failed to update message')
    }
  }

  const handleCancelMessage = async () => {
    try {
      await firstTimersService.cancelScheduledMessage(firstTimerId)

      showToast('success', 'Message cancelled successfully')

      setShowCancelConfirm(false)
      loadMessageData()
    } catch (error) {
      console.error('Failed to cancel message:', error)
      showToast('error', 'Failed to cancel message')
    }
  }

  const openEditModal = () => {
    if (scheduledMessage) {
      setEditMessage(scheduledMessage.message)
      setEditScheduledTime(
        formatDateTimeLocal(new Date(scheduledMessage.scheduledTime))
      )
      setShowEditModal(true)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-gray-500" />
      default:
        return <MessageCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getDefaultScheduledTime = () => {
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
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-blue-600" />
        Messaging for {firstTimerName}
      </h3>

      <div className="space-y-6">
        {/* Message Status Badge */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Message Status</span>
            </div>
            {/* This will show the message status on the first timer's profile */}
            <div className="text-sm text-blue-700">
              {scheduledMessage || messageHistory.some(msg => msg.status === 'sent') ? (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Has received messages
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  No messages sent
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Current Scheduled Message */}
        <div>
          <h4 className="font-medium mb-3">Current Scheduled Message</h4>
          {scheduledMessage ? (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(scheduledMessage.status)}
                    <Badge variant="secondary">{scheduledMessage.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{scheduledMessage.message}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatFullDateTime(scheduledMessage.scheduledTime)}
                    </span>
                    {scheduledMessage.createdBy && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {scheduledMessage.createdBy.firstName} {scheduledMessage.createdBy.lastName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={openEditModal}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowCancelConfirm(true)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 mb-4">No scheduled message</p>
              <Button onClick={() => setShowNewMessageModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Schedule Message
              </Button>
            </div>
          )}
        </div>

        {/* Message History */}
        <div>
          <h4 className="font-medium mb-3">Message History</h4>
          {messageHistory.length > 0 ? (
            <div className="space-y-3">
              {messageHistory.map((item) => (
                <div key={item._id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(item.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">{item.status}</Badge>
                        <span className="text-xs text-gray-500">
                          {formatFullDateTime(item.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{item.message}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Scheduled: {formatFullDateTime(item.scheduledTime)}
                        </span>
                        {item.sentAt && (
                          <span className="flex items-center gap-1">
                            <Send className="w-3 h-3" />
                            Sent: {formatFullDateTime(item.sentAt)}
                          </span>
                        )}
                      </div>
                      {item.failureReason && (
                        <p className="text-xs text-red-500 mt-1">
                          Failure: {item.failureReason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border border-gray-200 rounded-lg">
              <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No message history available</p>
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      <Modal
        isOpen={showNewMessageModal}
        onClose={() => setShowNewMessageModal(false)}
        title="Schedule New Message"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Create a new message for {firstTimerName}. If no time is specified,
            it will default to 7PM today or 2 hours from now if it's past 7PM.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={4}
              placeholder="Enter your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
          </div>
          <Input
            label="Scheduled Time (Optional)"
            type="datetime-local"
            value={newScheduledTime}
            onChange={(e) => setNewScheduledTime(e.target.value)}
            placeholder={getDefaultScheduledTime()}
          />
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowNewMessageModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateMessage}>
              <Send className="w-4 h-4 mr-2" />
              Schedule Message
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Message Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Scheduled Message"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={4}
              placeholder="Enter your message..."
              value={editMessage}
              onChange={(e) => setEditMessage(e.target.value)}
            />
          </div>
          <Input
            label="Scheduled Time"
            type="datetime-local"
            value={editScheduledTime}
            onChange={(e) => setEditScheduledTime(e.target.value)}
          />
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditMessage}>
              <Edit className="w-4 h-4 mr-2" />
              Update Message
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        title="Cancel Message"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to cancel this scheduled message? This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>
              Keep Message
            </Button>
            <Button variant="destructive" onClick={handleCancelMessage}>
              Cancel Message
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}

export default FirstTimerMessaging