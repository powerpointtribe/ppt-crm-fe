import React from 'react'
import { motion } from 'framer-motion'
import {
  Calendar, Phone, Mail, MessageSquare, Video, Home,
  User, Clock, CheckCircle, AlertCircle, XCircle,
  ArrowRight, Plus
} from 'lucide-react'
import { FollowUpRecord } from '@/services/first-timers'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'

interface FollowUpHistoryProps {
  followUps: FollowUpRecord[]
  onAddFollowUp?: () => void
  className?: string
}

const getMethodIcon = (method: FollowUpRecord['method']) => {
  switch (method) {
    case 'phone': return Phone
    case 'email': return Mail
    case 'sms': return MessageSquare
    case 'whatsapp': return MessageSquare
    case 'visit': return Home
    case 'video_call': return Video
    default: return Phone
  }
}

const getMethodColor = (method: FollowUpRecord['method']) => {
  switch (method) {
    case 'phone': return 'text-blue-600 bg-blue-100'
    case 'email': return 'text-green-600 bg-green-100'
    case 'sms': return 'text-purple-600 bg-purple-100'
    case 'whatsapp': return 'text-green-600 bg-green-100'
    case 'visit': return 'text-orange-600 bg-orange-100'
    case 'video_call': return 'text-indigo-600 bg-indigo-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}

const getOutcomeIcon = (outcome: FollowUpRecord['outcome']) => {
  switch (outcome) {
    case 'successful': return CheckCircle
    case 'interested': return CheckCircle
    case 'no_answer': return Clock
    case 'busy': return Clock
    case 'not_interested': return XCircle
    case 'follow_up_needed': return ArrowRight
    default: return AlertCircle
  }
}

const getOutcomeColor = (outcome: FollowUpRecord['outcome']) => {
  switch (outcome) {
    case 'successful': return 'text-green-600 bg-green-100'
    case 'interested': return 'text-green-600 bg-green-100'
    case 'no_answer': return 'text-yellow-600 bg-yellow-100'
    case 'busy': return 'text-yellow-600 bg-yellow-100'
    case 'not_interested': return 'text-red-600 bg-red-100'
    case 'follow_up_needed': return 'text-blue-600 bg-blue-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

const formatMethodLabel = (method: FollowUpRecord['method']) => {
  switch (method) {
    case 'phone': return 'Phone Call'
    case 'email': return 'Email'
    case 'sms': return 'SMS/Text'
    case 'whatsapp': return 'WhatsApp'
    case 'visit': return 'Home Visit'
    case 'video_call': return 'Video Call'
    default: return method
  }
}

const formatOutcomeLabel = (outcome: FollowUpRecord['outcome']) => {
  switch (outcome) {
    case 'successful': return 'Successful Contact'
    case 'interested': return 'Interested/Positive'
    case 'no_answer': return 'No Answer'
    case 'busy': return 'Busy/Unavailable'
    case 'not_interested': return 'Not Interested'
    case 'follow_up_needed': return 'Follow-up Needed'
    default: return outcome
  }
}

export default function FollowUpHistory({
  followUps,
  onAddFollowUp,
  className
}: FollowUpHistoryProps) {
  const sortedFollowUps = [...followUps].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Follow-up History</h3>
            <p className="text-sm text-gray-600">
              {followUps.length} follow-up{followUps.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
        </div>
        {onAddFollowUp && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={onAddFollowUp}
              size="sm"
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <Plus className="w-4 h-4" />
              Add Follow-up
            </Button>
          </motion.div>
        )}
      </div>

      {followUps.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Follow-ups Yet</h4>
          <p className="text-gray-600 mb-6">
            Start tracking follow-up activities for this visitor
          </p>
          {onAddFollowUp && (
            <Button
              onClick={onAddFollowUp}
              variant="secondary"
              className="flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Add First Follow-up
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedFollowUps.map((followUp, index) => {
            const MethodIcon = getMethodIcon(followUp.method)
            const OutcomeIcon = getOutcomeIcon(followUp.outcome)
            const methodColor = getMethodColor(followUp.method)
            const outcomeColor = getOutcomeColor(followUp.outcome)

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Timeline line */}
                {index < sortedFollowUps.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200" />
                )}

                <div className="flex gap-4">
                  {/* Timeline dot */}
                  <div className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shadow-lg",
                    methodColor
                  )}>
                    <MethodIcon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          outcomeColor
                        )}>
                          <div className="flex items-center gap-1">
                            <OutcomeIcon className="w-3 h-3" />
                            {formatOutcomeLabel(followUp.outcome)}
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-500">
                          {formatMethodLabel(followUp.method)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(followUp.date)}
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                      {followUp.notes}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Contacted by: {followUp.contactedBy}
                      </div>
                      {followUp.nextFollowUpDate && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <ArrowRight className="w-3 h-3" />
                          Next: {formatDate(followUp.nextFollowUpDate)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Summary Stats */}
      {followUps.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {followUps.filter(f => f.outcome === 'successful' || f.outcome === 'interested').length}
              </div>
              <div className="text-xs text-gray-600">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {followUps.filter(f => f.outcome === 'no_answer' || f.outcome === 'busy').length}
              </div>
              <div className="text-xs text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {followUps.filter(f => f.outcome === 'follow_up_needed').length}
              </div>
              <div className="text-xs text-gray-600">Need Follow-up</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {followUps.length}
              </div>
              <div className="text-xs text-gray-600">Total Attempts</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}