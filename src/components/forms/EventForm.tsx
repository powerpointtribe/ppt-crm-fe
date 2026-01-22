import React, { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Calendar,
  MapPin,
  Users,
  Settings,
  Plus,
  Trash2,
  Clock,
  Link,
  Mail,
  Phone,
  Image,
  Tag,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { cn } from '@/utils/cn'
import {
  Event,
  CreateEventData,
  UpdateEventData,
  EventType,
  EventStatus,
  CustomField,
} from '@/types/event'
import { membersService } from '@/services/members-unified'
import { Member } from '@/types'

interface EventFormProps {
  event?: Event
  onSubmit: (data: CreateEventData | UpdateEventData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  mode: 'create' | 'edit'
  branchId: string
}

const eventTypes: { value: EventType; label: string }[] = [
  { value: 'conference', label: 'Conference' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'retreat', label: 'Retreat' },
  { value: 'service', label: 'Service' },
  { value: 'outreach', label: 'Outreach' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'celebration', label: 'Celebration' },
  { value: 'training', label: 'Training' },
  { value: 'other', label: 'Other' },
]

const eventStatuses: { value: EventStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
]

const stepConfig = [
  { title: 'Basic Info', icon: Calendar, fields: ['title', 'type', 'description', 'startDate', 'endDate', 'startTime', 'endTime'] },
  { title: 'Location', icon: MapPin, fields: ['location'] },
  { title: 'Registration', icon: Settings, fields: ['registrationSettings', 'registrationSlug'] },
  { title: 'Committee & Contact', icon: Users, fields: ['committee', 'contactEmail', 'contactPhone', 'bannerImage', 'tags'] },
]

export default function EventForm({
  event,
  onSubmit,
  onCancel,
  loading = false,
  mode,
  branchId,
}: EventFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4
  const [members, setMembers] = useState<Member[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    control,
    trigger,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<any>({
    defaultValues: event
      ? {
          title: event.title,
          description: event.description || '',
          type: event.type,
          status: event.status,
          startDate: event.startDate?.split('T')[0] || '',
          endDate: event.endDate?.split('T')[0] || '',
          startTime: event.startTime || '',
          endTime: event.endTime || '',
          location: event.location || {
            name: '',
            address: '',
            city: '',
            state: '',
            isVirtual: false,
            virtualLink: '',
          },
          registrationSettings: event.registrationSettings || {
            isOpen: true,
            maxAttendees: undefined,
            deadline: '',
            requireApproval: false,
            allowWaitlist: true,
            customFields: [],
          },
          registrationSlug: event.registrationSlug || '',
          committee: event.committee?.map((c) => ({
            member: typeof c.member === 'string' ? c.member : c.member._id,
            role: c.role,
          })) || [],
          bannerImage: event.bannerImage || '',
          contactEmail: event.contactEmail || '',
          contactPhone: event.contactPhone || '',
          tags: event.tags || [],
        }
      : {
          title: '',
          description: '',
          type: 'other',
          status: 'draft',
          startDate: '',
          endDate: '',
          startTime: '',
          endTime: '',
          location: {
            name: '',
            address: '',
            city: '',
            state: '',
            isVirtual: false,
            virtualLink: '',
          },
          registrationSettings: {
            isOpen: true,
            maxAttendees: undefined,
            deadline: '',
            requireApproval: false,
            allowWaitlist: true,
            customFields: [],
          },
          registrationSlug: '',
          committee: [],
          bannerImage: '',
          contactEmail: '',
          contactPhone: '',
          tags: [],
        },
  })

  const {
    fields: committeeFields,
    append: appendCommittee,
    remove: removeCommittee,
  } = useFieldArray({
    control,
    name: 'committee',
  })

  const {
    fields: customFieldsArray,
    append: appendCustomField,
    remove: removeCustomField,
  } = useFieldArray({
    control,
    name: 'registrationSettings.customFields',
  })

  const watchedTags = watch('tags') || []
  const watchedIsVirtual = watch('location.isVirtual')

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      setLoadingMembers(true)
      const response = await membersService.getMembers({ limit: 100 })
      setMembers(response.items || [])
    } catch (error) {
      console.error('Error loading members:', error)
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleNext = async () => {
    const isValid = await trigger()
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
      setValue('tags', [...watchedTags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (index: number) => {
    const newTags = watchedTags.filter((_: string, i: number) => i !== index)
    setValue('tags', newTags)
  }

  const onFormSubmit = async (data: any) => {
    const formattedData: CreateEventData | UpdateEventData = {
      ...data,
      branch: branchId,
      registrationSettings: {
        ...data.registrationSettings,
        deadline: data.registrationSettings.deadline || undefined,
        maxAttendees: data.registrationSettings.maxAttendees
          ? parseInt(data.registrationSettings.maxAttendees)
          : undefined,
      },
    }
    await onSubmit(formattedData)
  }

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {stepConfig.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const Icon = step.icon

          return (
            <React.Fragment key={stepNumber}>
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(stepNumber)}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200',
                    isCompleted && 'bg-primary-600 border-primary-600 text-white',
                    isCurrent && 'border-primary-600 text-primary-600 bg-primary-50',
                    !isCompleted && !isCurrent && 'border-gray-300 text-gray-400'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </button>
                <span
                  className={cn(
                    'mt-2 text-sm font-medium hidden md:block',
                    isCurrent && 'text-primary-600',
                    !isCurrent && 'text-gray-500'
                  )}
                >
                  {step.title}
                </span>
              </div>
              {index < stepConfig.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-4',
                    stepNumber < currentStep ? 'bg-primary-600' : 'bg-gray-200'
                  )}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Title *
          </label>
          <Input
            {...register('title', { required: 'Title is required' })}
            placeholder="Enter event title"
            error={errors.title?.message as string}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Type *
          </label>
          <select
            {...register('type', { required: 'Type is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {eventTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            {...register('status')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {eventStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date *
          </label>
          <Input
            type="date"
            {...register('startDate', { required: 'Start date is required' })}
            error={errors.startDate?.message as string}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date *
          </label>
          <Input
            type="date"
            {...register('endDate', { required: 'End date is required' })}
            error={errors.endDate?.message as string}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Time
          </label>
          <Input type="time" {...register('startTime')} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Time
          </label>
          <Input type="time" {...register('endTime')} />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter event description"
          />
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          {...register('location.isVirtual')}
          id="isVirtual"
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label htmlFor="isVirtual" className="ml-2 text-sm text-gray-700">
          This is a virtual event
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {watchedIsVirtual ? 'Event Name/Platform' : 'Venue Name'} *
          </label>
          <Input
            {...register('location.name', { required: 'Location name is required' })}
            placeholder={watchedIsVirtual ? 'e.g., Zoom Meeting' : 'e.g., Main Auditorium'}
            error={errors.location?.name?.message as string}
          />
        </div>

        {watchedIsVirtual ? (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Virtual Meeting Link
            </label>
            <Input
              {...register('location.virtualLink')}
              placeholder="https://..."
              type="url"
            />
          </div>
        ) : (
          <>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <Input
                {...register('location.address')}
                placeholder="Street address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <Input {...register('location.city')} placeholder="City" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <Input {...register('location.state')} placeholder="State" />
            </div>
          </>
        )}
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              {...register('registrationSettings.isOpen')}
              id="isOpen"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isOpen" className="ml-2 text-sm text-gray-700">
              Registration is open
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Attendees
          </label>
          <Input
            type="number"
            {...register('registrationSettings.maxAttendees')}
            placeholder="Leave empty for unlimited"
            min={1}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Registration Deadline
          </label>
          <Input type="date" {...register('registrationSettings.deadline')} />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            {...register('registrationSettings.requireApproval')}
            id="requireApproval"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="requireApproval" className="ml-2 text-sm text-gray-700">
            Require approval for registrations
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            {...register('registrationSettings.allowWaitlist')}
            id="allowWaitlist"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="allowWaitlist" className="ml-2 text-sm text-gray-700">
            Allow waitlist when full
          </label>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Registration URL Slug
          </label>
          <div className="flex items-center">
            <span className="text-gray-500 text-sm mr-2">/event-registration/</span>
            <Input
              {...register('registrationSlug')}
              placeholder="my-event-2025"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            This will be used for the public registration link
          </p>
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Custom Registration Fields</h4>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              appendCustomField({
                id: `field-${Date.now()}`,
                label: '',
                type: 'text',
                required: false,
                options: [],
              })
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Field
          </Button>
        </div>

        {customFieldsArray.map((field, index) => (
          <div key={field.id} className="border rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Label
                </label>
                <Input
                  {...register(`registrationSettings.customFields.${index}.label`)}
                  placeholder="e.g., Dietary Requirements"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Type
                </label>
                <select
                  {...register(`registrationSettings.customFields.${index}.type`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="select">Select</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="radio">Radio</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register(`registrationSettings.customFields.${index}.required`)}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Required</label>
                </div>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => removeCustomField(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="border-b pb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Committee Members</h4>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => appendCommittee({ member: '', role: '' })}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Member
          </Button>
        </div>

        {committeeFields.map((field, index) => (
          <div key={field.id} className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Member
              </label>
              <select
                {...register(`committee.${index}.member`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loadingMembers}
              >
                <option value="">Select a member</option>
                {members.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <Input
                {...register(`committee.${index}.role`)}
                placeholder="e.g., Coordinator"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => removeCommittee(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {committeeFields.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No committee members added yet
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Mail className="inline h-4 w-4 mr-1" />
            Contact Email
          </label>
          <Input
            type="email"
            {...register('contactEmail')}
            placeholder="events@church.org"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Phone className="inline h-4 w-4 mr-1" />
            Contact Phone
          </label>
          <Input
            {...register('contactPhone')}
            placeholder="+234..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Image className="inline h-4 w-4 mr-1" />
            Banner Image URL
          </label>
          <Input
            {...register('bannerImage')}
            placeholder="https://..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Tag className="inline h-4 w-4 mr-1" />
            Tags
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button type="button" variant="secondary" onClick={addTag}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {watchedTags.map((tag: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="ml-2 text-primary-500 hover:text-primary-700"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <Card>
        <div className="p-6">
          {renderStepIndicator()}

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 pt-6 border-t flex justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={currentStep === 1 ? onCancel : handlePrevious}
            >
              {currentStep === 1 ? (
                'Cancel'
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </>
              )}
            </Button>

            {currentStep < totalSteps ? (
              <Button type="button" onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button type="submit" disabled={loading}>
                {loading ? (
                  'Saving...'
                ) : mode === 'create' ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Create Event
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Update Event
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </form>
  )
}
