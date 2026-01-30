import React, { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Trash2,
  Mail,
  Phone,
  Image,
  Tag,
  Globe,
  Video,
  Clock,
  FileText,
  ChevronDown,
  Sparkles,
  Save,
  X,
  Loader2,
  Building,
  Hash,
  Link,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import {
  Event,
  CreateEventData,
  UpdateEventData,
  EventType,
  EventStatus,
  FormSection,
  FormHeader,
  SuccessMessage,
  TermsAndConditions,
  FormLayout,
  FormStatus,
} from '@/types/event'
import { EnhancedCustomField } from '@/types/registration-form'
import { membersService } from '@/services/members-unified'
import { Member } from '@/types'
import { FormBuilderStep } from './event'

interface EventFormProps {
  event?: Event
  onSubmit: (data: CreateEventData | UpdateEventData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  mode: 'create' | 'edit'
  branchId: string
}

const eventTypes: { value: EventType; label: string; icon: string }[] = [
  { value: 'conference', label: 'Conference', icon: '🎤' },
  { value: 'workshop', label: 'Workshop', icon: '🛠️' },
  { value: 'seminar', label: 'Seminar', icon: '📚' },
  { value: 'retreat', label: 'Retreat', icon: '🏕️' },
  { value: 'service', label: 'Service', icon: '⛪' },
  { value: 'outreach', label: 'Outreach', icon: '🤝' },
  { value: 'meeting', label: 'Meeting', icon: '👥' },
  { value: 'celebration', label: 'Celebration', icon: '🎉' },
  { value: 'training', label: 'Training', icon: '🎓' },
  { value: 'other', label: 'Other', icon: '📋' },
]

const eventStatuses: { value: EventStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  { value: 'published', label: 'Published', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700' },
  { value: 'completed', label: 'Completed', color: 'bg-blue-100 text-blue-700' },
]

type TabId = 'details' | 'registration'

const tabs: { id: TabId; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'details', label: 'Event Details', icon: Calendar, description: 'Basic info, schedule & location' },
  { id: 'registration', label: 'Registration', icon: FileText, description: 'Form builder & settings' },
]

// Collapsible Section Component
function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  badge,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  defaultOpen?: boolean
  badge?: string | number
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-50 rounded-lg">
            <Icon className="h-4 w-4 text-primary-600" />
          </div>
          <span className="font-medium text-gray-900">{title}</span>
          {badge !== undefined && (
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown className={cn(
          "h-5 w-5 text-gray-400 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 pt-2 border-t border-gray-100">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Compact Input with Icon
function IconInput({
  icon: Icon,
  label,
  error,
  className,
  ...props
}: {
  icon?: React.ElementType
  label?: string
  error?: string
  className?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          {...props}
          className={cn(
            "w-full rounded-lg border border-gray-300 bg-white transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
            "placeholder:text-gray-400",
            Icon ? "pl-10 pr-3 py-2.5" : "px-3 py-2.5",
            error && "border-red-300 focus:ring-red-500/20 focus:border-red-500",
            props.disabled && "bg-gray-50 text-gray-500"
          )}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

export default function EventForm({
  event,
  onSubmit,
  onCancel,
  loading = false,
  mode,
  branchId,
}: EventFormProps) {
  const [activeTab, setActiveTab] = useState<TabId>('details')
  const [members, setMembers] = useState<Member[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
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
          websiteUrl: event.websiteUrl || '',
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
          websiteUrl: '',
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

  // Enhanced registration settings state
  const [customFields, setCustomFields] = useState<EnhancedCustomField[]>(
    (event?.registrationSettings?.customFields as EnhancedCustomField[]) || []
  )
  const [formSections, setFormSections] = useState<FormSection[]>(
    event?.registrationSettings?.formSections || []
  )
  const [formLayout, setFormLayout] = useState<FormLayout>(
    event?.registrationSettings?.formLayout || 'single-page'
  )
  const [formStatus, setFormStatus] = useState<FormStatus>(
    event?.registrationSettings?.formStatus || 'draft'
  )
  const [qrCodeEnabled, setQrCodeEnabled] = useState(
    event?.registrationSettings?.qrCodeEnabled || false
  )
  const [formHeader, setFormHeader] = useState<FormHeader>(
    event?.registrationSettings?.formHeader || {}
  )
  const [successMessage, setSuccessMessage] = useState<SuccessMessage>(
    event?.registrationSettings?.successMessage || {}
  )
  const [termsAndConditions, setTermsAndConditions] = useState<TermsAndConditions>(
    event?.registrationSettings?.termsAndConditions || { enabled: false }
  )

  const watchedTags = watch('tags') || []
  const watchedIsVirtual = watch('location.isVirtual')
  const watchedType = watch('type')
  const watchedStatus = watch('status')
  const watchedTitle = watch('title')

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

  const selectedType = eventTypes.find(t => t.value === watchedType)
  const selectedStatus = eventStatuses.find(s => s.value === watchedStatus)

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
        customFields: customFields,
        formSections: formSections,
        formLayout: formLayout,
        formStatus: formStatus,
        qrCodeEnabled: qrCodeEnabled,
        formHeader: formHeader,
        successMessage: successMessage,
        termsAndConditions: termsAndConditions,
      },
    }
    await onSubmit(formattedData)
  }

  // Tab: Event Details
  const renderDetailsTab = () => (
    <div className="space-y-4">
      {/* Basic Info Section */}
      <CollapsibleSection title="Basic Information" icon={Sparkles} defaultOpen={true}>
        <div className="space-y-4">
          {/* Title with Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title', { required: 'Title is required' })}
              placeholder="Enter a memorable event title"
              className={cn(
                "w-full rounded-lg border border-gray-300 px-4 py-3 text-lg font-medium",
                "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                "placeholder:text-gray-400 placeholder:font-normal",
                errors.title && "border-red-300"
              )}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title?.message as string}</p>
            )}
          </div>

          {/* Type and Status Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Event Type
              </label>
              <div className="relative">
                <select
                  {...register('type')}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white pl-10 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  {eventTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">
                  {selectedType?.icon}
                </div>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Status
              </label>
              <div className="relative">
                <select
                  {...register('status')}
                  className={cn(
                    "w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-8 py-2.5",
                    "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  )}
                >
                  {eventStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-400 resize-none"
              placeholder="Describe your event..."
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Date & Time Section */}
      <CollapsibleSection title="Date & Time" icon={Clock} defaultOpen={true}>
        <div className="grid grid-cols-2 gap-3">
          <IconInput
            icon={Calendar}
            label="Start Date"
            type="date"
            {...register('startDate', { required: 'Start date is required' })}
            error={errors.startDate?.message as string}
          />
          <IconInput
            icon={Calendar}
            label="End Date"
            type="date"
            {...register('endDate', { required: 'End date is required' })}
            error={errors.endDate?.message as string}
          />
          <IconInput
            icon={Clock}
            label="Start Time"
            type="time"
            {...register('startTime')}
          />
          <IconInput
            icon={Clock}
            label="End Time"
            type="time"
            {...register('endTime')}
          />
        </div>
      </CollapsibleSection>

      {/* Location Section */}
      <CollapsibleSection title="Location" icon={MapPin} defaultOpen={true}>
        <div className="space-y-4">
          {/* Virtual Toggle */}
          <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              {...register('location.isVirtual')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">This is a virtual event</span>
            </div>
          </label>

          {watchedIsVirtual ? (
            <div className="space-y-3">
              <IconInput
                icon={Globe}
                label="Platform Name"
                placeholder="e.g., Zoom, Google Meet"
                {...register('location.name', { required: 'Platform name is required' })}
                error={(errors.location as any)?.name?.message as string}
              />
              <IconInput
                icon={Globe}
                label="Meeting Link"
                type="url"
                placeholder="https://..."
                {...register('location.virtualLink')}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <IconInput
                icon={Building}
                label="Venue Name"
                placeholder="e.g., Main Auditorium"
                {...register('location.name', { required: 'Venue name is required' })}
                error={(errors.location as any)?.name?.message as string}
              />
              <IconInput
                icon={MapPin}
                label="Address"
                placeholder="Street address"
                {...register('location.address')}
              />
              <div className="grid grid-cols-2 gap-3">
                <IconInput
                  label="City"
                  placeholder="City"
                  {...register('location.city')}
                />
                <IconInput
                  label="State"
                  placeholder="State"
                  {...register('location.state')}
                />
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Team & Contact Section */}
      <CollapsibleSection title="Team & Contact" icon={Users} defaultOpen={false} badge={committeeFields.length}>
        <div className="space-y-4">
          {/* Committee Members */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Committee Members</label>
              <button
                type="button"
                onClick={() => appendCommittee({ member: '', role: '' })}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            {committeeFields.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                No committee members added
              </p>
            ) : (
              <div className="space-y-2">
                {committeeFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <select
                      {...register(`committee.${index}.member`)}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      disabled={loadingMembers}
                    >
                      <option value="">Select member</option>
                      {members.map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.firstName} {member.lastName}
                        </option>
                      ))}
                    </select>
                    <input
                      {...register(`committee.${index}.role`)}
                      placeholder="Role"
                      className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeCommittee(index)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <IconInput
              icon={Mail}
              label="Contact Email"
              type="email"
              placeholder="events@church.org"
              {...register('contactEmail')}
            />
            <IconInput
              icon={Phone}
              label="Contact Phone"
              placeholder="+234..."
              {...register('contactPhone')}
            />
          </div>

          {/* Website URL */}
          <div className="pt-2">
            <IconInput
              icon={Link}
              label="Event Website URL"
              type="url"
              placeholder="https://event-website.com"
              {...register('websiteUrl')}
            />
            <p className="mt-1 text-xs text-gray-500">
              Optional: Add a dedicated website URL if this event has its own website
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Tags & Media Section */}
      <CollapsibleSection title="Tags & Media" icon={Tag} defaultOpen={false} badge={watchedTags.length}>
        <div className="space-y-4">
          <IconInput
            icon={Image}
            label="Banner Image URL"
            placeholder="https://..."
            {...register('bannerImage')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tags
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <Button type="button" variant="secondary" onClick={addTag}>
                Add
              </Button>
            </div>
            {watchedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {watchedTags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="hover:text-primary-900 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </CollapsibleSection>
    </div>
  )

  // Tab: Registration Form
  const renderRegistrationTab = () => {
    const watchedIsOpen = watch('registrationSettings.isOpen')
    const watchedMaxAttendees = watch('registrationSettings.maxAttendees')
    const watchedDeadline = watch('registrationSettings.deadline')
    const watchedRequireApproval = watch('registrationSettings.requireApproval')
    const watchedAllowWaitlist = watch('registrationSettings.allowWaitlist')
    const watchedSlug = watch('registrationSlug')

    return (
      <FormBuilderStep
        isOpen={watchedIsOpen}
        maxAttendees={watchedMaxAttendees}
        deadline={watchedDeadline}
        requireApproval={watchedRequireApproval}
        allowWaitlist={watchedAllowWaitlist}
        registrationSlug={watchedSlug}
        customFields={customFields}
        formLayout={formLayout}
        formSections={formSections}
        qrCodeEnabled={qrCodeEnabled}
        formHeader={formHeader}
        successMessage={successMessage}
        termsAndConditions={termsAndConditions}
        formStatus={formStatus}
        eventTitle={watchedTitle}
        onIsOpenChange={(value) => setValue('registrationSettings.isOpen', value)}
        onMaxAttendeesChange={(value) => setValue('registrationSettings.maxAttendees', value)}
        onDeadlineChange={(value) => setValue('registrationSettings.deadline', value)}
        onRequireApprovalChange={(value) => setValue('registrationSettings.requireApproval', value)}
        onAllowWaitlistChange={(value) => setValue('registrationSettings.allowWaitlist', value)}
        onRegistrationSlugChange={(value) => setValue('registrationSlug', value)}
        onCustomFieldsChange={setCustomFields}
        onFormLayoutChange={setFormLayout}
        onFormSectionsChange={setFormSections}
        onQrCodeEnabledChange={setQrCodeEnabled}
        onFormHeaderChange={setFormHeader}
        onSuccessMessageChange={setSuccessMessage}
        onTermsAndConditionsChange={setTermsAndConditions}
        onFormStatusChange={setFormStatus}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="h-full flex flex-col">
      {/* Header with Title Preview and Status */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {selectedType && (
                <span className="text-2xl">{selectedType.icon}</span>
              )}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {watchedTitle || (mode === 'create' ? 'New Event' : 'Edit Event')}
                </h1>
                <p className="text-sm text-gray-500">
                  {mode === 'create' ? 'Create a new event' : 'Update event details'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedStatus && (
              <span className={cn(
                "px-3 py-1 rounded-full text-sm font-medium",
                selectedStatus.color
              )}>
                {selectedStatus.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="flex gap-1">
            {tabs.map((tab, index) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors rounded-t-lg",
                    isActive
                      ? "text-primary-600 bg-primary-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <span className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold",
                    isActive ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-600"
                  )}>
                    {index + 1}
                  </span>
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                    />
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'details' && renderDetailsTab()}
              {activeTab === 'registration' && renderRegistrationTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>

          <div className="flex items-center gap-3">
            {activeTab === 'details' && (
              <Button
                type="button"
                onClick={() => setActiveTab('registration')}
                className="flex items-center gap-2"
              >
                Next: Registration
                <FileText className="h-4 w-4" />
              </Button>
            )}
            {activeTab === 'registration' && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setActiveTab('details')}
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Back to Details
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 min-w-[140px] justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {mode === 'create' ? 'Create Event' : 'Save Changes'}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}
