import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import {
  Calendar, Phone, Mail, MessageSquare, Video, Home,
  User, Clock, AlertCircle, Check, X
} from 'lucide-react'
import { z } from 'zod'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { cn } from '@/utils/cn'

const followUpSchema = z.object({
  date: z.string().min(1, 'Follow-up date is required'),
  method: z.enum(['phone', 'email', 'sms', 'whatsapp', 'visit', 'video_call'], {
    required_error: 'Contact method is required'
  }),
  notes: z.string().min(1, 'Follow-up notes are required'),
  outcome: z.enum(['successful', 'no_answer', 'busy', 'not_interested', 'interested', 'follow_up_needed'], {
    required_error: 'Follow-up outcome is required'
  }),
  nextFollowUpDate: z.string().optional()
})

type FollowUpFormData = z.infer<typeof followUpSchema>

interface FollowUpFormProps {
  onSubmit: (data: FollowUpFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  initialData?: Partial<FollowUpFormData>
}

const contactMethods = [
  { value: 'phone', label: 'Phone Call', icon: Phone, color: 'text-blue-600 bg-blue-100' },
  { value: 'email', label: 'Email', icon: Mail, color: 'text-green-600 bg-green-100' },
  { value: 'sms', label: 'SMS/Text', icon: MessageSquare, color: 'text-purple-600 bg-purple-100' },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'text-green-600 bg-green-100' },
  { value: 'visit', label: 'Home Visit', icon: Home, color: 'text-orange-600 bg-orange-100' },
  { value: 'video_call', label: 'Video Call', icon: Video, color: 'text-indigo-600 bg-indigo-100' }
]

const outcomes = [
  { value: 'successful', label: 'Successful Contact', color: 'text-green-600 bg-green-100' },
  { value: 'no_answer', label: 'No Answer', color: 'text-yellow-600 bg-yellow-100' },
  { value: 'busy', label: 'Busy/Unavailable', color: 'text-orange-600 bg-orange-100' },
  { value: 'not_interested', label: 'Not Interested', color: 'text-red-600 bg-red-100' },
  { value: 'interested', label: 'Interested/Positive', color: 'text-green-600 bg-green-100' },
  { value: 'follow_up_needed', label: 'Follow-up Needed', color: 'text-blue-600 bg-blue-100' }
]

export default function FollowUpForm({
  onSubmit,
  onCancel,
  loading = false,
  initialData
}: FollowUpFormProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>(initialData?.method || '')
  const [selectedOutcome, setSelectedOutcome] = useState<string>(initialData?.outcome || '')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FollowUpFormData>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      date: initialData?.date || new Date().toISOString().split('T')[0],
      method: initialData?.method,
      notes: initialData?.notes || '',
      outcome: initialData?.outcome,
      nextFollowUpDate: initialData?.nextFollowUpDate || ''
    }
  })

  const watchedOutcome = watch('outcome')

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method)
    setValue('method', method as any)
  }

  const handleOutcomeSelect = (outcome: string) => {
    setSelectedOutcome(outcome)
    setValue('outcome', outcome as any)
  }

  const handleFormSubmit = async (data: FollowUpFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Follow-up form submission error:', error)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Add Follow-up Record</h3>
                <p className="text-sm text-gray-600">Record the outcome of your follow-up contact</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={onCancel}
              className="p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                Follow-up Date *
              </label>
              <Input
                type="date"
                {...register('date')}
                error={errors.date?.message}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Contact Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Contact Method *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {contactMethods.map((method) => {
                  const Icon = method.icon
                  const isSelected = selectedMethod === method.value

                  return (
                    <motion.button
                      key={method.value}
                      type="button"
                      onClick={() => handleMethodSelect(method.value)}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2",
                        isSelected
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50"
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={cn(
                        "p-2 rounded-full",
                        isSelected ? method.color : "bg-gray-100 text-gray-500"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium">{method.label}</span>
                    </motion.button>
                  )
                })}
              </div>
              {errors.method && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.method.message}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Follow-up Notes *
              </label>
              <textarea
                {...register('notes')}
                rows={4}
                placeholder="Describe what happened during the follow-up contact..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
              />
              {errors.notes && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.notes.message}
                </p>
              )}
            </div>

            {/* Outcome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Follow-up Outcome *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {outcomes.map((outcome) => {
                  const isSelected = selectedOutcome === outcome.value

                  return (
                    <motion.button
                      key={outcome.value}
                      type="button"
                      onClick={() => handleOutcomeSelect(outcome.value)}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all duration-200 flex items-center gap-3",
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      )}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        isSelected ? "bg-blue-500" : "bg-gray-300"
                      )} />
                      <span className={cn(
                        "text-sm font-medium",
                        isSelected ? "text-blue-700" : "text-gray-700"
                      )}>
                        {outcome.label}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
              {errors.outcome && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.outcome.message}
                </p>
              )}
            </div>

            {/* Next Follow-up Date (conditional) */}
            {(watchedOutcome === 'follow_up_needed' || watchedOutcome === 'no_answer' || watchedOutcome === 'busy') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  Next Follow-up Date
                </label>
                <Input
                  type="date"
                  {...register('nextFollowUpDate')}
                  error={errors.nextFollowUpDate?.message}
                  className="transition-all duration-200 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Schedule when to follow up again
                </p>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                className="px-6"
              >
                Cancel
              </Button>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  loading={loading}
                  className="px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  {loading ? (
                    'Saving...'
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Add Follow-up
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </form>
        </div>
      </Card>
    </motion.div>
  )
}