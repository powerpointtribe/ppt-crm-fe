import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { z } from 'zod'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'

const followUpSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  method: z.enum(['phone', 'email', 'sms', 'whatsapp', 'visit', 'video_call'], {
    required_error: 'Select a contact method'
  }),
  notes: z.string().min(1, 'Notes are required'),
  outcome: z.enum(['successful', 'no_answer', 'busy', 'not_interested', 'interested', 'follow_up_needed'], {
    required_error: 'Select an outcome'
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
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'visit', label: 'Visit' },
  { value: 'video_call', label: 'Video' }
]

const outcomes = [
  { value: 'successful', label: 'Successful' },
  { value: 'interested', label: 'Interested' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'busy', label: 'Busy' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'follow_up_needed', label: 'Follow-up' }
]

export default function FollowUpForm({
  onSubmit,
  onCancel,
  loading = false,
  initialData
}: FollowUpFormProps) {
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

  const watchedMethod = watch('method')
  const watchedOutcome = watch('outcome')

  const handleFormSubmit = async (data: FollowUpFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Follow-up form submission error:', error)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Add Follow-up</h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 -mr-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4">
          {/* Date Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                {...register('date')}
                className={cn(
                  "w-full px-2.5 py-1.5 text-sm border rounded-lg transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent",
                  errors.date ? "border-red-300" : "border-gray-200"
                )}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Notify Me On <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="date"
                {...register('nextFollowUpDate')}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                title="You'll receive an email reminder on this date"
              />
            </div>
          </div>

          {/* Contact Method */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Method
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {contactMethods.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setValue('method', method.value as any)}
                  className={cn(
                    "px-1 py-1.5 text-xs font-medium rounded-md border transition-colors",
                    watchedMethod === method.value
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  {method.label}
                </button>
              ))}
            </div>
            {errors.method && (
              <p className="text-xs text-red-600 mt-1">{errors.method.message}</p>
            )}
          </div>

          {/* Outcome */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Outcome
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {outcomes.map((outcome) => (
                <button
                  key={outcome.value}
                  type="button"
                  onClick={() => setValue('outcome', outcome.value as any)}
                  className={cn(
                    "px-2 py-1.5 text-xs font-medium rounded-md border transition-colors",
                    watchedOutcome === outcome.value
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  {outcome.label}
                </button>
              ))}
            </div>
            {errors.outcome && (
              <p className="text-xs text-red-600 mt-1">{errors.outcome.message}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Brief summary of the follow-up..."
              className={cn(
                "w-full px-2.5 py-1.5 text-xs border rounded-lg resize-none transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent",
                "placeholder:text-gray-400",
                errors.notes ? "border-red-300" : "border-gray-200"
              )}
            />
            {errors.notes && (
              <p className="text-xs text-red-600 mt-1">{errors.notes.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
