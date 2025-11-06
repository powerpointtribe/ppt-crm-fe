import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { showToast } from '@/utils/toast'
import { callReportsService } from '@/services/call-reports'

const callReportSchema = z.object({
  status: z.enum(['pending', 'contacted', 'scheduled', 'not_interested', 'converted']),
  contactMethod: z.enum(['phone', 'whatsapp', 'sms', 'email', 'in_person']),
  notes: z.string().optional(),
  outcome: z.string().optional(),
  nextAction: z.string().optional(),
  nextActionDate: z.string().optional()
})

type CallReportFormData = z.infer<typeof callReportSchema>

interface CallReportFormProps {
  firstTimerId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function CallReportForm({
  firstTimerId,
  isOpen,
  onClose,
  onSuccess
}: CallReportFormProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<CallReportFormData>({
    resolver: zodResolver(callReportSchema),
    defaultValues: {
      status: 'contacted',
      contactMethod: 'phone'
    }
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (data: CallReportFormData) => {
    try {
      setLoading(true)

      const response = await callReportsService.create(firstTimerId, data)

      if (response.success) {
        showToast('Call report created successfully', 'success')
        handleClose()
        onSuccess?.()
      } else {
        throw new Error(response.message || 'Failed to create call report')
      }
    } catch (error: any) {
      console.error('Error creating call report:', error)
      showToast(
        error.response?.data?.message || error.message || 'Failed to create call report',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Create Call Report</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  {...register('status')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="contacted">Contacted</option>
                  <option value="scheduled">Scheduled Visit</option>
                  <option value="not_interested">Not Interested</option>
                  <option value="converted">Converted</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Method *
                </label>
                <select
                  {...register('contactMethod')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="phone">Phone Call</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                  <option value="in_person">In Person</option>
                </select>
                {errors.contactMethod && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactMethod.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                {...register('notes')}
                placeholder="Add any notes about the conversation..."
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Outcome
              </label>
              <Input
                {...register('outcome')}
                placeholder="What was the outcome of this contact?"
                error={errors.outcome?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Action
                </label>
                <Input
                  {...register('nextAction')}
                  placeholder="What's the next step?"
                  error={errors.nextAction?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Action Date
                </label>
                <Input
                  type="datetime-local"
                  {...register('nextActionDate')}
                  error={errors.nextActionDate?.message}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                disabled={loading}
              >
                Create Report
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}